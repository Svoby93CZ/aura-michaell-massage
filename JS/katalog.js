document.addEventListener('DOMContentLoaded', () => {
  // Katalog sluzeb na msginfo.html.
  //
  // Karty se primarne nacitaji z tabulky `services` v Supabase, aby sly
  // spravovat z admin.html. Staticke HTML v msginfo.html zustava jako
  // zaloha: kdyz je JS vypnuty nebo databaze neodpovi, navstevnik uvidi
  // posledni rucne ulozenou verzi ceniku misto prazdne stranky.
  const serviceCatalog = document.querySelector('[data-service-catalog]');
  if (!serviceCatalog) {
    return;
  }

  const resultCount = document.getElementById('serviceResultsCount');
  const emptyState = document.getElementById('serviceEmptyState');
  const groups = Array.from(serviceCatalog.querySelectorAll('.svc2-group'));
  const chips = Array.from(serviceCatalog.querySelectorAll('[data-category-filter]'));

  const initialChip = chips.find((chip) => chip.classList.contains('is-active')) || chips[0];
  let activeCategory = initialChip ? (initialChip.dataset.categoryFilter || 'all').toLowerCase() : 'all';

  // Vychozi chip je v HTML oznaceny tridou, ale aria-pressed byva false.
  chips.forEach((chip) => {
    chip.setAttribute('aria-pressed', chip === initialChip ? 'true' : 'false');
  });

  /* -----------------------------------------------------------------
     Filtrovani a razeni
     ----------------------------------------------------------------- */

  const currentCards = () => Array.from(serviceCatalog.querySelectorAll('.svc2-card'));

  const readCardValues = (card, index) => {
    card.dataset.originalIndex = String(index);
    card.dataset.durationValue = String(Number(card.dataset.duration || 0));

    const priceText = card.querySelector('.svc2-meta span:last-child')?.textContent || '';
    card.dataset.priceValue = String(Number(priceText.replace(/[^\d]/g, '')) || 0);
  };

  const updateFilters = () => {
    const cards = currentCards();
    cards.forEach(readCardValues);

    let visibleCards = 0;

    cards.forEach((card) => {
      const cardCategory = (card.dataset.category || '').trim().toLowerCase();
      const shouldShow = activeCategory === 'all' || cardCategory === activeCategory;

      card.hidden = !shouldShow;
      if (shouldShow) {
        visibleCards += 1;
      }
    });

    // Doporucene nahoru, pak podle ceny a nakonec podle poradi z databaze.
    const compareCards = (left, right) => {
      const leftRecommended = left.dataset.recommended === 'true' ? 1 : 0;
      const rightRecommended = right.dataset.recommended === 'true' ? 1 : 0;
      const leftPrice = Number(left.dataset.priceValue || 0);
      const rightPrice = Number(right.dataset.priceValue || 0);
      const leftIndex = Number(left.dataset.originalIndex || 0);
      const rightIndex = Number(right.dataset.originalIndex || 0);

      return rightRecommended - leftRecommended || leftPrice - rightPrice || leftIndex - rightIndex;
    };

    groups.forEach((group) => {
      const groupCards = Array.from(group.querySelectorAll('.svc2-card'));
      const visibleGroupCards = groupCards.filter((card) => !card.hidden);

      // Vizualni stagger animace pri kazde zmene filtru.
      visibleGroupCards
        .sort(compareCards)
        .forEach((card, index) => {
          card.style.order = String(index);
          card.classList.remove('is-entering');
          card.style.setProperty('--stagger-delay', `${Math.min(index * 26, 240)}ms`);
          // Force reflow to restart animation when filters change
          void card.offsetWidth;
          card.classList.add('is-entering');
        });

      groupCards
        .filter((card) => card.hidden)
        .forEach((card) => {
          card.style.order = '';
          card.classList.remove('is-entering');
          card.style.removeProperty('--stagger-delay');
        });

      group.hidden = visibleGroupCards.length === 0;
    });

    if (resultCount) {
      const label = visibleCards === 1 ? 'služba' : visibleCards >= 2 && visibleCards <= 4 ? 'služby' : 'služeb';
      resultCount.textContent = `${visibleCards} ${label}`;
    }
    if (emptyState) {
      emptyState.hidden = visibleCards > 0;
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = (chip.dataset.categoryFilter || 'all').toLowerCase();
      chips.forEach((item) => {
        const isActive = item === chip;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      updateFilters();
    });
  });

  /* -----------------------------------------------------------------
     Vykresleni karet z databaze
     ----------------------------------------------------------------- */

  const buildCard = (service) => {
    const article = document.createElement('article');
    article.className = 'svc2-card';
    article.dataset.category = service.category;
    article.dataset.duration = String(service.duration_minutes);
    article.dataset.name = service.slug || '';
    if (service.recommended) {
      article.dataset.recommended = 'true';
    }

    if (service.image_path) {
      const img = document.createElement('img');
      img.src = service.image_path;
      img.alt = service.image_alt || service.name;
      img.loading = 'lazy';
      article.appendChild(img);
    }

    const body = document.createElement('div');
    body.className = 'svc2-card__body';

    if (service.recommended && service.badge_text) {
      const badge = document.createElement('span');
      badge.className = 'svc2-card__badge';
      badge.textContent = service.badge_text;
      body.appendChild(badge);
    }

    const heading = document.createElement('h4');
    heading.textContent = service.name;
    body.appendChild(heading);

    if (service.description) {
      const description = document.createElement('p');
      description.textContent = service.description;
      body.appendChild(description);
    }

    const meta = document.createElement('div');
    meta.className = 'svc2-meta';
    const duration = document.createElement('span');
    duration.textContent = `${service.duration_minutes} min`;
    const price = document.createElement('span');
    price.textContent = `${new Intl.NumberFormat('cs-CZ').format(service.price_czk)} Kč`;
    meta.append(duration, price);
    body.appendChild(meta);

    if (service.reservio_url) {
      const link = document.createElement('a');
      link.href = service.reservio_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Rezervovat';
      body.appendChild(link);
    }

    article.appendChild(body);
    return article;
  };

  const renderFromDatabase = (rows) => {
    const byCategory = new Map();
    rows.forEach((service) => {
      if (!byCategory.has(service.category)) {
        byCategory.set(service.category, []);
      }
      byCategory.get(service.category).push(service);
    });

    groups.forEach((group) => {
      const grid = group.querySelector('.svc2-grid');
      if (!grid) {
        return;
      }
      const rowsForGroup = byCategory.get(group.dataset.group) || [];
      grid.replaceChildren(...rowsForGroup.map(buildCard));
    });

    serviceCatalog.dataset.source = 'database';
  };

  const loadServices = async () => {
    if (!window.supabase || !window.SUPABASE_CONFIG) {
      return false;
    }

    const { url, anonKey } = window.SUPABASE_CONFIG;
    if (!url || !anonKey || url.includes('YOUR-PROJECT') || anonKey.includes('YOUR_SUPABASE')) {
      return false;
    }

    try {
      const client = window.supabase.createClient(url, anonKey);
      const { data, error } = await client
        .from('services')
        .select('category, name, slug, description, duration_minutes, price_czk, image_path, image_alt, reservio_url, recommended, badge_text, sort_order')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      // Prazdna odpoved by smazala cely cenik - radeji necháme staticke HTML.
      if (error || !data || !data.length) {
        return false;
      }

      renderFromDatabase(data);
      return true;
    } catch (error) {
      return false;
    }
  };

  // Nejdriv zobrazime staticky zaklad, pak ho tise nahradime daty z databaze.
  updateFilters();
  loadServices().then((loaded) => {
    if (loaded) {
      updateFilters();
    }
  });
});
