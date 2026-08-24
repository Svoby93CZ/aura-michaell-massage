document.addEventListener('DOMContentLoaded', () => {
  // Interaktivni filtrace katalogu sluzeb na msginfo.html (v2 layout)
  const serviceCatalog = document.querySelector('[data-service-catalog]');
  if (serviceCatalog) {
    // Odkazy na ovladaci prvky filtru
    const searchInput = document.getElementById('serviceSearch');
    const durationSelect = document.getElementById('serviceDuration');
    const sortSelect = document.getElementById('serviceSort');
    const resetButton = document.getElementById('serviceReset');
    const resultCount = document.getElementById('serviceResultsCount');
    const emptyState = document.getElementById('serviceEmptyState');
    const cards = Array.from(serviceCatalog.querySelectorAll('.svc2-card'));
    const groups = Array.from(serviceCatalog.querySelectorAll('.svc2-group'));
    const chips = Array.from(serviceCatalog.querySelectorAll('[data-category-filter]'));

    let activeCategory = 'all';

    // Predzpracovani dat karet pro razeni a vykon filtrovani
    cards.forEach((card, index) => {
      card.dataset.originalIndex = String(index);
      const duration = Number(card.dataset.duration || 0);
      card.dataset.durationValue = String(duration);

      const priceText = card.querySelector('.svc2-meta span:last-child')?.textContent || '';
      const price = Number(priceText.replace(/[^\d]/g, '')) || 0;
      card.dataset.priceValue = String(price);
    });

    const matchesDuration = (duration, filter) => {
      if (filter === 'all') {
        return true;
      }
      if (filter === 'short') {
        return duration <= 40;
      }
      if (filter === 'medium') {
        return duration > 40 && duration <= 70;
      }
      if (filter === 'long') {
        return duration > 70;
      }
      return true;
    };

    const updateFilters = () => {
      // Aktualni hodnoty ovladacich prvku
      const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const durationValue = durationSelect ? durationSelect.value : 'all';
      const sortValue = sortSelect ? sortSelect.value : 'recommended';
      let visibleCards = 0;

      // Filtrovani jednotlivych karet
      cards.forEach((card) => {
        const cardName = (card.dataset.name || '').toLowerCase();
        const cardCategory = (card.dataset.category || '').trim().toLowerCase();
        const cardDuration = Number(card.dataset.duration || 0);

        const textMatch = !searchValue || cardName.includes(searchValue);
        const categoryMatch = activeCategory === 'all' || cardCategory === activeCategory;
        const durationMatch = matchesDuration(cardDuration, durationValue);
        const shouldShow = textMatch && categoryMatch && durationMatch;

        card.hidden = !shouldShow;
        if (shouldShow) {
          visibleCards += 1;
        }
      });

      // Razeni + zobrazeni po skupinach (sekcich)
      groups.forEach((group) => {
        const groupCards = Array.from(group.querySelectorAll('.svc2-card'));
        const visibleGroupCards = groupCards.filter((card) => !card.hidden);

        // Dynamicke serazeni viditelnych karet podle volby uzivatele
        const compareCards = (left, right) => {
          const leftPrice = Number(left.dataset.priceValue || 0);
          const rightPrice = Number(right.dataset.priceValue || 0);
          const leftDuration = Number(left.dataset.durationValue || 0);
          const rightDuration = Number(right.dataset.durationValue || 0);
          const leftIndex = Number(left.dataset.originalIndex || 0);
          const rightIndex = Number(right.dataset.originalIndex || 0);
          const leftRecommended = left.dataset.recommended === 'true' ? 1 : 0;
          const rightRecommended = right.dataset.recommended === 'true' ? 1 : 0;

          if (sortValue === 'priceAsc') {
            return leftPrice - rightPrice || leftIndex - rightIndex;
          }
          if (sortValue === 'priceDesc') {
            return rightPrice - leftPrice || leftIndex - rightIndex;
          }
          if (sortValue === 'durationAsc') {
            return leftDuration - rightDuration || leftIndex - rightIndex;
          }
          if (sortValue === 'durationDesc') {
            return rightDuration - leftDuration || leftIndex - rightIndex;
          }

          return rightRecommended - leftRecommended || leftPrice - rightPrice || leftIndex - rightIndex;
        };

        // Vizuální stagger animace pri kazde zmene filtru/razeni
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

        const hasVisibleCard = visibleGroupCards.length > 0;
        group.hidden = !hasVisibleCard;
      });

      // Aktualizace informacniho textu o poctu vysledku
      if (resultCount) {
        resultCount.textContent = `${visibleCards} ${visibleCards === 1 ? 'služba' : 'služeb'}`;
      }
      if (emptyState) {
        emptyState.hidden = visibleCards > 0;
      }
    };

    // Prepinani kategorii pres chip tlacitka
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

    // Prubezne prepocty pri zmene filtru
    if (searchInput) {
      searchInput.addEventListener('input', updateFilters);
    }
    if (durationSelect) {
      durationSelect.addEventListener('change', updateFilters);
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', updateFilters);
    }
    // Obnoveni vychoziho stavu filtru
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        activeCategory = 'all';
        if (searchInput) {
          searchInput.value = '';
        }
        if (durationSelect) {
          durationSelect.value = 'all';
        }
        if (sortSelect) {
          sortSelect.value = 'recommended';
        }
        chips.forEach((item) => {
          const isDefault = item.dataset.categoryFilter === 'all';
          item.classList.toggle('is-active', isDefault);
          item.setAttribute('aria-pressed', isDefault ? 'true' : 'false');
        });
        updateFilters();
      });
    }

    updateFilters();
  }
});
