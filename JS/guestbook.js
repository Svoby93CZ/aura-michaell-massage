/**
 * Veřejná Kniha návštěv
 *
 * Inicializace běží při prvním načtení i po každém přepnutí pohledu routerem.
 * Knihovna Supabase se dotahuje až tady, ostatní stránky ji nepotřebují.
 */
const initGuestbook = async (signal) => {
  const section = document.querySelector('[data-guestbook]');
  if (!section || !window.SUPABASE_CONFIG) {
    return;
  }

  try {
    await window.ensureSupabase();
  } catch (error) {
    console.warn('Kniha návštěv není dostupná:', error);
    return;
  }

  // Mezitím mohl uživatel přejít na jinou stránku
  if (signal.aborted || !window.supabase) {
    return;
  }

  const { url, anonKey } = window.SUPABASE_CONFIG;
  const hasConfiguration = url && anonKey && !url.includes('YOUR-PROJECT') && !anonKey.includes('YOUR_SUPABASE');
  const client = hasConfiguration ? window.supabase.createClient(url, anonKey) : null;
  const form = section.querySelector('[data-guestbook-form]');
  const list = section.querySelector('[data-guestbook-list]');
  const status = section.querySelector('[data-guestbook-status]');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;

  // Bezpecnostni pojistky proti jednoduchym botum - honeypot pole, ktere
  // vidi jen boti (skryte pred lidmi CSS + tabindex -1), a minimalni cas
  // od nacteni stranky do odeslani (bot obvykle vyplni a odesle formular
  // za desetiny sekundy). Obe tise "uspeji" bez skutecneho odeslani, aby
  // bot nezjistil, ze byl odhalen. Skutecnou ochranu proti odeslani pres
  // primy API pozadavek (mimo tento formular) resi rate-limit v databazi.
  const formLoadedAt = Date.now();
  const MIN_SUBMIT_DELAY_MS = 3000;

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

    const formData = new FormData(form);

    // Honeypot vyplneny nebo formular odeslan podezrele rychle - tise
    // predstirame uspech, aniz bychom cokoliv odeslali do databaze.
    const honeypotFilled = formData.get('website');
    const submittedTooFast = Date.now() - formLoadedAt < MIN_SUBMIT_DELAY_MS;
    if (honeypotFilled || submittedTooFast) {
      form.reset();
      setStatus('Děkuji. Vzkaz se zobrazí po schválení.', 'success');
      return;
    }

    submitButton.disabled = true;
    setStatus('Odesílám vzkaz…');
    const ratingValue = formData.get('rating');
    const { error } = await client.from('guestbook_entries').insert({
      nickname: formData.get('nickname').trim(),
      rating: ratingValue ? Number(ratingValue) : null,
      message: formData.get('message').trim(),
      approved: false
    });

    submitButton.disabled = false;
    if (error) {
      const isRateLimit = /příliš mnoho vzkazů|denního limitu/i.test(error.message || '');
      setStatus(isRateLimit ? error.message : 'Vzkaz se nepodařilo odeslat. Zkuste to prosím později.', 'error');
      return;
    }

    form.reset();
    setStatus('Děkuji. Vzkaz se zobrazí po schválení.', 'success');
  });

  loadEntries();
};

(() => {
  const register =
    window.AuraView?.register ??
    ((init) =>
      document.addEventListener('DOMContentLoaded', () =>
        init(new AbortController().signal)
      ));

  register(initGuestbook);
})();
