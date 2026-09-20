(() => {
  const admin = window.AdminApp;
  if (!admin) {
    return;
  }

  const app = admin.app;
  const categories = window.SERVICE_CATEGORIES || [];
  const gallery = window.GALLERY_MASAZE || [];

  const listEl = app.querySelector('[data-service-list]');
  const statusEl = app.querySelector('[data-services-status]');
  const tabCountEl = app.querySelector('[data-services-tab-count]');
  const filterCategory = app.querySelector('[data-service-filter-category]');
  const searchInput = app.querySelector('[data-service-search]');
  const newButton = app.querySelector('[data-service-new]');

  const modal = app.querySelector('[data-service-modal]');
  const modalTitle = app.querySelector('#service-modal-title');
  const form = app.querySelector('[data-service-form]');
  const formStatus = app.querySelector('[data-service-form-status]');
  const submitButton = app.querySelector('[data-service-submit]');
  const categorySelect = app.querySelector('#service-category');
  const imageSelect = app.querySelector('[data-service-image-select]');
  const imagePreview = app.querySelector('[data-service-image-preview]');
  const imageEmpty = app.querySelector('[data-service-image-empty]');

  if (!listEl || !form) {
    return;
  }

  let client = null;
  let services = [];
  let editingId = null;
  let lastFocused = null;

  const setStatus = (target, message, type = '') => {
    if (!target) {
      return;
    }
    target.textContent = message;
    target.dataset.state = type;
  };

  const categoryLabel = (slug) => {
    const found = categories.find((item) => item.slug === slug);
    return found ? found.label : slug;
  };

  const formatPrice = (value) => `${new Intl.NumberFormat('cs-CZ').format(value)} Kč`;

  // Vyhledávací klíč bez diakritiky - stejný formát jako data-name
  // u karet v msginfo.html, aby filtrování v katalogu fungovalo dál.
  const toSearchKey = (value) => value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  /* ---------------------------------------------------------------
     Naplnění číselníků
     --------------------------------------------------------------- */

  categories.forEach((category) => {
    const filterOption = document.createElement('option');
    filterOption.value = category.slug;
    filterOption.textContent = category.label;
    filterCategory.appendChild(filterOption);

    const formOption = document.createElement('option');
    formOption.value = category.slug;
    formOption.textContent = category.label;
    categorySelect.appendChild(formOption);
  });

  const emptyImageOption = document.createElement('option');
  emptyImageOption.value = '';
  emptyImageOption.textContent = '— bez obrázku —';
  imageSelect.appendChild(emptyImageOption);

  gallery.forEach((path) => {
    const option = document.createElement('option');
    option.value = path;
    option.textContent = path.replace('galerie/masaze/', '');
    imageSelect.appendChild(option);
  });

  const updateImagePreview = () => {
    const path = imageSelect.value;
    if (path) {
      imagePreview.src = path;
      imagePreview.hidden = false;
      imageEmpty.hidden = true;
    } else {
      imagePreview.removeAttribute('src');
      imagePreview.hidden = true;
      imageEmpty.hidden = false;
    }
  };

  imageSelect.addEventListener('change', updateImagePreview);

  /* ---------------------------------------------------------------
     Výpis masáží
     --------------------------------------------------------------- */

  const visibleServices = () => {
    const category = filterCategory.value;
    const query = toSearchKey(searchInput.value || '');

    return services.filter((service) => {
      const categoryMatch = category === 'all' || service.category === category;
      const textMatch = !query || toSearchKey(`${service.name} ${service.description || ''}`).includes(query);
      return categoryMatch && textMatch;
    });
  };

  const buildRow = (service) => {
    const row = document.createElement('article');
    row.className = 'admin-service';
    row.dataset.active = service.active ? 'true' : 'false';

    const thumb = document.createElement('div');
    thumb.className = 'admin-service__thumb';
    if (service.image_path) {
      const img = document.createElement('img');
      img.src = service.image_path;
      img.alt = service.image_alt || service.name;
      img.loading = 'lazy';
      thumb.appendChild(img);
    } else {
      thumb.textContent = '—';
    }

    const body = document.createElement('div');
    body.className = 'admin-service__body';

    const title = document.createElement('div');
    title.className = 'admin-service__title';

    const name = document.createElement('strong');
    name.textContent = service.name;
    title.appendChild(name);

    if (service.recommended) {
      const badge = document.createElement('span');
      badge.className = 'admin-badge admin-badge--gold';
      badge.textContent = service.badge_text || 'Doporučujeme';
      title.appendChild(badge);
    }
    if (!service.active) {
      const hidden = document.createElement('span');
      hidden.className = 'admin-badge admin-badge--muted';
      hidden.textContent = 'Skryto';
      title.appendChild(hidden);
    }

    const description = document.createElement('p');
    description.className = 'admin-service__description';
    description.textContent = service.description || '';

    const meta = document.createElement('div');
    meta.className = 'admin-service__meta';

    const duration = document.createElement('span');
    duration.textContent = `${service.duration_minutes} min`;

    const price = document.createElement('span');
    price.className = 'admin-service__price';
    price.textContent = formatPrice(service.price_czk);

    meta.append(duration, price);
    body.append(title, description, meta);

    const actions = document.createElement('div');
    actions.className = 'admin-service__actions';

    const edit = document.createElement('button');
    edit.className = 'admin-action admin-action--small';
    edit.type = 'button';
    edit.textContent = 'Upravit';
    edit.addEventListener('click', () => openModal(service));

    const toggle = document.createElement('button');
    toggle.className = 'admin-action admin-action--small admin-action--secondary';
    toggle.type = 'button';
    toggle.textContent = service.active ? 'Skrýt' : 'Zobrazit';
    toggle.addEventListener('click', () => saveChanges(service.id, { active: !service.active }));

    const remove = document.createElement('button');
    remove.className = 'admin-action admin-action--small admin-action--danger';
    remove.type = 'button';
    remove.textContent = 'Smazat';
    remove.addEventListener('click', () => {
      if (window.confirm(`Opravdu chcete smazat masáž „${service.name}“? Tuto akci nelze vrátit zpět.`)) {
        deleteService(service.id);
      }
    });

    actions.append(edit, toggle, remove);
    row.append(thumb, body, actions);
    return row;
  };

  const render = () => {
    const visible = services.length ? visibleServices() : [];
    listEl.replaceChildren();

    if (tabCountEl) {
      const active = services.filter((service) => service.active).length;
      tabCountEl.textContent = services.length
        ? `${active} ${active === 1 ? 'masáž' : active < 5 ? 'masáže' : 'masáží'} na webu`
        : 'Masáže a ceny';
    }

    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = services.length
        ? 'Žádná masáž neodpovídá filtru.'
        : 'Zatím tu není žádná masáž. Přidejte první pomocí tlačítka výše.';
      listEl.appendChild(empty);
      return;
    }

    // Seskupení podle kategorií ve stejném pořadí jako na webu.
    const order = categories.map((category) => category.slug);
    const groups = new Map();
    visible.forEach((service) => {
      if (!groups.has(service.category)) {
        groups.set(service.category, []);
      }
      groups.get(service.category).push(service);
    });

    const sortedKeys = Array.from(groups.keys()).sort((left, right) => {
      const leftIndex = order.indexOf(left);
      const rightIndex = order.indexOf(right);
      return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
    });

    sortedKeys.forEach((key) => {
      const group = document.createElement('section');
      group.className = 'admin-service-group';

      const heading = document.createElement('h3');
      heading.textContent = categoryLabel(key);

      const count = document.createElement('span');
      count.className = 'admin-service-group__count';
      count.textContent = String(groups.get(key).length);
      heading.appendChild(count);

      group.appendChild(heading);
      groups.get(key).forEach((service) => group.appendChild(buildRow(service)));
      listEl.appendChild(group);
    });
  };

  /* ---------------------------------------------------------------
     Databáze
     --------------------------------------------------------------- */

  const loadServices = async () => {
    setStatus(statusEl, 'Načítám ceník…');
    const { data, error } = await client
      .from('services')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      setStatus(statusEl, 'Ceník se nepodařilo načíst. Ověřte oprávnění administrátora.', 'error');
      return;
    }

    services = data || [];
    render();
    setStatus(statusEl, '');
  };

  const saveChanges = async (id, changes) => {
    const { error } = await client.from('services').update(changes).eq('id', id);
    if (error) {
      setStatus(statusEl, 'Změnu se nepodařilo uložit.', 'error');
      return;
    }
    await loadServices();
  };

  const deleteService = async (id) => {
    const { error } = await client.from('services').delete().eq('id', id);
    if (error) {
      setStatus(statusEl, 'Masáž se nepodařilo smazat.', 'error');
      return;
    }
    setStatus(statusEl, 'Masáž byla smazána.', 'success');
    await loadServices();
  };

  /* ---------------------------------------------------------------
     Editor masáže
     --------------------------------------------------------------- */

  const openModal = (service) => {
    editingId = service ? service.id : null;
    lastFocused = document.activeElement;
    modalTitle.textContent = service ? `Úprava: ${service.name}` : 'Nová masáž';
    setStatus(formStatus, '');
    form.reset();

    const nextOrder = () => {
      const category = filterCategory.value !== 'all' ? filterCategory.value : (categories[0] && categories[0].slug);
      const inCategory = services.filter((item) => item.category === category);
      return inCategory.length ? Math.max(...inCategory.map((item) => item.sort_order)) + 10 : 10;
    };

    form.elements.name.value = service ? service.name : '';
    form.elements.category.value = service ? service.category : (filterCategory.value !== 'all' ? filterCategory.value : categories[0].slug);
    form.elements.description.value = service ? (service.description || '') : '';
    form.elements.duration_minutes.value = service ? service.duration_minutes : '';
    form.elements.price_czk.value = service ? service.price_czk : '';
    form.elements.image_path.value = service ? (service.image_path || '') : '';
    form.elements.image_alt.value = service ? (service.image_alt || '') : '';
    form.elements.reservio_url.value = service ? (service.reservio_url || '') : '';
    form.elements.badge_text.value = service ? (service.badge_text || '') : '';
    form.elements.sort_order.value = service ? service.sort_order : nextOrder();
    form.elements.recommended.checked = service ? Boolean(service.recommended) : false;
    form.elements.active.checked = service ? Boolean(service.active) : true;

    updateImagePreview();
    modal.hidden = false;
    document.body.classList.add('admin-modal-open');
    form.elements.name.focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    editingId = null;
    document.body.classList.remove('admin-modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  };

  app.querySelectorAll('[data-service-modal-close]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  });

  newButton.addEventListener('click', () => openModal(null));
  filterCategory.addEventListener('change', render);
  searchInput.addEventListener('input', render);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const payload = {
      name,
      slug: toSearchKey(`${name} ${form.elements.category.value}`),
      category: form.elements.category.value,
      description: form.elements.description.value.trim(),
      duration_minutes: Number(form.elements.duration_minutes.value),
      price_czk: Number(form.elements.price_czk.value),
      image_path: form.elements.image_path.value || null,
      image_alt: form.elements.image_alt.value.trim() || name,
      reservio_url: form.elements.reservio_url.value.trim() || null,
      badge_text: form.elements.badge_text.value.trim() || null,
      sort_order: Number(form.elements.sort_order.value) || 0,
      recommended: form.elements.recommended.checked,
      active: form.elements.active.checked
    };

    if (!payload.name || !payload.duration_minutes || Number.isNaN(payload.price_czk)) {
      setStatus(formStatus, 'Vyplňte prosím název, délku i cenu.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus(formStatus, 'Ukládám…');

    // closeModal() editingId vynuluje, proto si režim zapamatujeme předem.
    const isEdit = Boolean(editingId);
    const { error } = isEdit
      ? await client.from('services').update(payload).eq('id', editingId)
      : await client.from('services').insert(payload);

    submitButton.disabled = false;

    if (error) {
      setStatus(formStatus, `Uložení se nezdařilo: ${error.message}`, 'error');
      return;
    }

    closeModal();
    setStatus(statusEl, isEdit ? 'Změny byly uloženy.' : 'Masáž byla přidána.', 'success');
    await loadServices();
  });

  admin.onAdminReady((supabaseClient) => {
    client = supabaseClient;
    loadServices();
  });
})();
