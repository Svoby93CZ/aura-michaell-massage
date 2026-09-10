(() => {
  const section = document.querySelector('[data-guestbook]');
  if (!section || !window.supabase || !window.SUPABASE_CONFIG) {
    return;
  }

  const { url, anonKey } = window.SUPABASE_CONFIG;
  const hasConfiguration = url && anonKey && !url.includes('YOUR-PROJECT') && !anonKey.includes('YOUR_SUPABASE');
  const client = hasConfiguration ? window.supabase.createClient(url, anonKey) : null;
  const form = section.querySelector('[data-guestbook-form]');
  const list = section.querySelector('[data-guestbook-list]');
  const status = section.querySelector('[data-guestbook-status]');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.dataset.state = type;
  };

  const formatDate = (date) => new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(date));

  const renderStars = (rating) => rating
    ? `${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`
    : 'Bez hodnocení';

  const renderEntries = (entries) => {
    list.replaceChildren();

    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'guestbook-empty';
      empty.textContent = 'Kniha zatím čeká na první vzkaz.';
      list.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const article = document.createElement('article');
      article.className = 'guestbook-entry';

      const header = document.createElement('div');
      header.className = 'guestbook-entry__header';
      const author = document.createElement('strong');
      author.className = 'guestbook-entry__author';
      author.textContent = entry.nickname;
      const date = document.createElement('time');
      date.className = 'guestbook-entry__date';
      date.dateTime = entry.created_at;
      date.textContent = formatDate(entry.created_at);
      header.append(author, date);

      const message = document.createElement('p');
      message.className = 'guestbook-entry__message';
      message.textContent = entry.message;
      const rating = document.createElement('span');
      rating.className = 'guestbook-entry__rating';
      rating.setAttribute('aria-label', entry.rating ? `Hodnocení ${entry.rating} z 5` : 'Bez hodnocení');
      rating.textContent = renderStars(entry.rating);

      article.append(header, message, rating);
      list.appendChild(article);
    });
  };

  const loadEntries = async () => {
    if (!client) {
      setStatus('Kniha návštěv čeká na nastavení Supabase.', 'error');
      return;
    }

    const { data, error } = await client
      .from('guestbook_entries')
      .select('nickname, rating, message, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      setStatus('Vzkazy se momentálně nepodařilo načíst.', 'error');
      return;
    }

    renderEntries(data || []);
  };

  if (!client) {
    setStatus('Kniha návštěv čeká na nastavení Supabase.', 'error');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }

    submitButton.disabled = true;
    setStatus('Odesílám vzkaz…');
    const formData = new FormData(form);
    const ratingValue = formData.get('rating');
    const { error } = await client.from('guestbook_entries').insert({
      nickname: formData.get('nickname').trim(),
      rating: ratingValue ? Number(ratingValue) : null,
      message: formData.get('message').trim(),
      approved: false
    });

    submitButton.disabled = false;
    if (error) {
      setStatus('Vzkaz se nepodařilo odeslat. Zkuste to prosím později.', 'error');
      return;
    }

    form.reset();
    setStatus('Děkuji. Vzkaz se zobrazí po schválení.', 'success');
  });

  loadEntries();
})();