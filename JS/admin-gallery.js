(() => {
  const admin = window.AdminApp;
  if (!admin) {
    return;
  }

  const app = admin.app;
  const GALLERY = 'home-prostor';
  const photos = window.GALLERY_PROSTOR || [];

  const listEl = app.querySelector('[data-gallery-list]');
  const statusEl = app.querySelector('[data-gallery-status]');
  const tabCountEl = app.querySelector('[data-gallery-tab-count]');
  const newButton = app.querySelector('[data-gallery-new]');

  const modal = app.querySelector('[data-gallery-modal]');
  const modalTitle = app.querySelector('#gallery-modal-title');
  const form = app.querySelector('[data-gallery-form]');
  const formStatus = app.querySelector('[data-gallery-form-status]');
  const submitButton = app.querySelector('[data-gallery-submit]');
  const imageSelect = app.querySelector('[data-gallery-image-select]');
  const imagePreview = app.querySelector('[data-gallery-image-preview]');
  const imageEmpty = app.querySelector('[data-gallery-image-empty]');

  if (!listEl || !form) {
    return;
  }

  let client = null;
  let images = [];
  let editingId = null;
  let lastFocused = null;

  const setStatus = (target, message, type = '') => {
    if (!target) {
      return;
    }
    target.textContent = message;
    target.dataset.state = type;
  };

  /* ---------------------------------------------------------------
     Číselník obrázků
     --------------------------------------------------------------- */

  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = '— vyberte obrázek —';
  imageSelect.appendChild(emptyOption);

  photos.forEach((path) => {
    const option = document.createElement('option');
    option.value = path;
    option.textContent = path.replace('galerie/', '');
    imageSelect.appendChild(option);
  });

  const updatePreview = () => {
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

  imageSelect.addEventListener('change', updatePreview);

  /* ---------------------------------------------------------------
     Výpis fotek
     --------------------------------------------------------------- */

  const buildRow = (image, index) => {
    const row = document.createElement('article');
    row.className = 'admin-gallery-item';
    row.dataset.active = image.active ? 'true' : 'false';

    const position = document.createElement('span');
    position.className = 'admin-gallery-item__position';
    position.textContent = String(index + 1);

    const thumb = document.createElement('div');
    thumb.className = 'admin-gallery-item__thumb';
    const img = document.createElement('img');
    img.src = image.image_path;
    img.alt = image.alt_text || '';
    img.loading = 'lazy';
    thumb.appendChild(img);

    const body = document.createElement('div');
    body.className = 'admin-gallery-item__body';

    const name = document.createElement('strong');
    name.textContent = image.image_path.replace('galerie/', '');

    const alt = document.createElement('p');
    alt.className = 'admin-gallery-item__alt';
    alt.textContent = image.alt_text || 'Bez popisu';

    body.append(name, alt);

    if (!image.active) {
      const hidden = document.createElement('span');
      hidden.className = 'admin-badge admin-badge--muted';
      hidden.textContent = 'Skryto';
      body.appendChild(hidden);
    }

    const actions = document.createElement('div');
    actions.className = 'admin-gallery-item__actions';

    const up = document.createElement('button');
    up.className = 'admin-icon-button admin-icon-button--small';
    up.type = 'button';
    up.textContent = '↑';
    up.title = 'Posunout nahoru';
    up.setAttribute('aria-label', `Posunout „${name.textContent}“ nahoru`);
    up.disabled = index === 0;
    up.addEventListener('click', () => move(index, -1));

    const down = document.createElement('button');
    down.className = 'admin-icon-button admin-icon-button--small';
    down.type = 'button';
    down.textContent = '↓';
    down.title = 'Posunout dolů';
    down.setAttribute('aria-label', `Posunout „${name.textContent}“ dolů`);
    down.disabled = index === images.length - 1;
    down.addEventListener('click', () => move(index, 1));

    const edit = document.createElement('button');
    edit.className = 'admin-action admin-action--small';
    edit.type = 'button';
    edit.textContent = 'Upravit';
    edit.addEventListener('click', () => openModal(image));

    const toggle = document.createElement('button');
    toggle.className = 'admin-action admin-action--small admin-action--secondary';
    toggle.type = 'button';
    toggle.textContent = image.active ? 'Skrýt' : 'Zobrazit';
    toggle.addEventListener('click', () => saveChanges(image.id, { active: !image.active }));

    const remove = document.createElement('button');
    remove.className = 'admin-action admin-action--small admin-action--danger';
    remove.type = 'button';
    remove.textContent = 'Odebrat';
    remove.addEventListener('click', () => {
      if (window.confirm('Opravdu chcete tuto fotku odebrat z galerie? Soubor v galerii zůstane.')) {
        deleteImage(image.id);
      }
    });

    actions.append(up, down, edit, toggle, remove);
    row.append(position, thumb, body, actions);
    return row;
  };

  const render = () => {
    listEl.replaceChildren();

    if (tabCountEl) {
      const active = images.filter((image) => image.active).length;
      tabCountEl.textContent = images.length
        ? `${active} ${active === 1 ? 'fotka' : active < 5 ? 'fotky' : 'fotek'} na webu`
        : 'Fotky salonu';
    }

    if (!images.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = 'V galerii zatím není žádná fotka. Přidejte první pomocí tlačítka výše.';
      listEl.appendChild(empty);
      return;
    }

    images.forEach((image, index) => listEl.appendChild(buildRow(image, index)));
  };

  /* ---------------------------------------------------------------
     Databáze
     --------------------------------------------------------------- */

  const loadImages = async () => {
    setStatus(statusEl, 'Načítám galerii…');
    const { data, error } = await client
      .from('gallery_images')
      .select('*')
      .eq('gallery', GALLERY)
      .order('sort_order', { ascending: true });

    if (error) {
      setStatus(statusEl, 'Galerii se nepodařilo načíst. Ověřte oprávnění administrátora.', 'error');
      return;
    }

    images = data || [];
    render();
    setStatus(statusEl, '');
  };

  const saveChanges = async (id, changes) => {
    const { error } = await client.from('gallery_images').update(changes).eq('id', id);
    if (error) {
      setStatus(statusEl, 'Změnu se nepodařilo uložit.', 'error');
      return;
    }
    await loadImages();
  };

  const deleteImage = async (id) => {
    const { error } = await client.from('gallery_images').delete().eq('id', id);
    if (error) {
      setStatus(statusEl, 'Fotku se nepodařilo odebrat.', 'error');
      return;
    }
    setStatus(statusEl, 'Fotka byla odebrána z galerie.', 'success');
    await loadImages();
  };

  // Prohození dvou sousedních fotek. Pořadí se po každé změně přečísluje
  // na 10, 20, 30…, aby v něm nevznikaly díry ani shodné hodnoty.
  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) {
      return;
    }

    const reordered = images.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setStatus(statusEl, 'Ukládám pořadí…');

    const updates = reordered.map((image, position) => (
      client.from('gallery_images').update({ sort_order: (position + 1) * 10 }).eq('id', image.id)
    ));
    const results = await Promise.all(updates);

    if (results.some((result) => result.error)) {
      setStatus(statusEl, 'Pořadí se nepodařilo uložit celé. Zkuste to prosím znovu.', 'error');
    }
    await loadImages();
  };

  /* ---------------------------------------------------------------
     Editor fotky
     --------------------------------------------------------------- */

  const openModal = (image) => {
    editingId = image ? image.id : null;
    lastFocused = document.activeElement;
    modalTitle.textContent = image ? 'Úprava fotky' : 'Nová fotka';
    setStatus(formStatus, '');
    form.reset();

    form.elements.image_path.value = image ? image.image_path : '';
    form.elements.alt_text.value = image ? (image.alt_text || '') : '';
    form.elements.active.checked = image ? Boolean(image.active) : true;

    updatePreview();
    modal.hidden = false;
    document.body.classList.add('admin-modal-open');
    imageSelect.focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    editingId = null;
    document.body.classList.remove('admin-modal-open');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  };

  app.querySelectorAll('[data-gallery-modal-close]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  });

  newButton.addEventListener('click', () => openModal(null));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      gallery: GALLERY,
      image_path: form.elements.image_path.value,
      alt_text: form.elements.alt_text.value.trim(),
      active: form.elements.active.checked
    };

    if (!payload.image_path) {
      setStatus(formStatus, 'Vyberte prosím obrázek.', 'error');
      return;
    }

    // Nová fotka jde na konec galerie.
    if (!editingId) {
      const highest = images.reduce((max, image) => Math.max(max, image.sort_order), 0);
      payload.sort_order = highest + 10;
    }

    submitButton.disabled = true;
    setStatus(formStatus, 'Ukládám…');

    const isEdit = Boolean(editingId);
    const { error } = isEdit
      ? await client.from('gallery_images').update(payload).eq('id', editingId)
      : await client.from('gallery_images').insert(payload);

    submitButton.disabled = false;

    if (error) {
      setStatus(formStatus, `Uložení se nezdařilo: ${error.message}`, 'error');
      return;
    }

    closeModal();
    setStatus(statusEl, isEdit ? 'Změny byly uloženy.' : 'Fotka byla přidána.', 'success');
    await loadImages();
  });

  admin.onAdminReady((supabaseClient) => {
    client = supabaseClient;
    loadImages();
  });
})();
