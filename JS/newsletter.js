/**
 * Odběr novinek e-mailem (newsletter) v patičce
 *
 * Formulář pošle e-mail databázové funkci newsletter_subscribe v Supabase,
 * která ho předá do Brevo. Brevo pak návštěvníkovi pošle e-mail s odkazem
 * k potvrzení odběru (double opt-in). Po kliknutí na odkaz Brevo přesměruje
 * zpátky na web s ?odber=potvrzen a tady se zobrazí poděkování.
 * Podrobnosti a nastavení: supabase-newsletter.sql.
 *
 * Inicializace běží při prvním načtení i po každém přepnutí pohledu routerem.
 * Knihovna Supabase se stahuje až při odeslání formuláře.
 */

// Poděkování po potvrzení odběru se ukáže nahoře pod menu, ne u formuláře:
// patička je až na konci dlouhé stránky a na telefonu by ji zakryla lišta
// s cookies, kterou člověk otevírající odkaz z e-mailu často ještě uvidí.
const showNewsletterConfirmation = (signal) => {
  const notice = document.createElement('div');
  notice.className = 'newsletter-notice';
  notice.setAttribute('role', 'status');

  const text = document.createElement('p');
  text.className = 'newsletter-notice__text';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'newsletter-notice__close';
  close.setAttribute('aria-label', 'Zavřít oznámení');
  close.textContent = '×';

  notice.append(text, close);
  document.body.appendChild(notice);

  // Text až po vložení do stránky, aby ho čtečka obrazovky ohlásila.
  requestAnimationFrame(() => {
    const title = document.createElement('strong');
    title.textContent = 'Odběr je potvrzený.';
    text.append(title, ' Děkuji, že chcete dostávat novinky e-mailem.');
  });

  const remove = () => notice.remove();
  close.addEventListener('click', remove);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      remove();
    }
  }, { signal });
  // Při přechodu na jinou stránku oznámení zmizí.
  signal.addEventListener('abort', remove, { once: true });
};

const initNewsletter = (signal) => {
  const form = document.querySelector('[data-newsletter-form]');
  if (!form) {
    return;
  }

  const status = form.querySelector('[data-newsletter-status]');
  const submitButton = form.querySelector('button[type="submit"]');

  // Stejné pojistky proti jednoduchým botům jako v knize návštěv: skryté
  // pole, které vyplní jen bot, a minimální čas od zobrazení formuláře.
  // Obě tiše "uspějí" bez odeslání, aby bot nepoznal, že byl odhalen.
  // Skutečnou ochranu proti zneužití řeší limity v databázi.
  const formShownAt = Date.now();
  const MIN_SUBMIT_DELAY_MS = 1500;

  const GENERIC_ERROR = 'Přihlášení se nepodařilo. Zkuste to prosím později.';

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.dataset.state = type;
  };

  const successMessage = (email) =>
    `Skoro hotovo! Na adresu ${email} teď přijde e-mail s odkazem, kterým odběr potvrdíte. ` +
    'Když nedorazí do pár minut, podívejte se prosím do spamu.';

  // Návrat z potvrzovacího odkazu v e-mailu. Parametr se z adresy hned
  // odstraní, aby poděkování nevyskočilo znovu po obnovení stránky.
  const params = new URLSearchParams(location.search);
  if (params.get('odber') === 'potvrzen') {
    showNewsletterConfirmation(signal);
    params.delete('odber');
    const query = params.toString();
    history.replaceState(
      history.state,
      '',
      `${location.pathname}${query ? `?${query}` : ''}${location.hash}`
    );
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();

    const honeypotFilled = formData.get('website');
    const submittedTooFast = Date.now() - formShownAt < MIN_SUBMIT_DELAY_MS;
    if (honeypotFilled || submittedTooFast) {
      form.reset();
      setStatus(successMessage(email), 'success');
      return;
    }

    if (!window.SUPABASE_CONFIG || !window.ensureSupabase) {
      setStatus(GENERIC_ERROR, 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus('Odesílám…');

    let errorMessage = '';
    try {
      await window.ensureSupabase();
      const { error } = await window
        .getPublicSupabaseClient()
        .rpc('newsletter_subscribe', { p_email: email });

      if (error) {
        // P0001 = hláška napsaná pro návštěvníka (neplatná adresa, limit
        // pokusů, odběr ještě není spuštěný). Ostatní chyby jsou technické.
        errorMessage = error.code === 'P0001' && error.message ? error.message : GENERIC_ERROR;
      }
    } catch (error) {
      console.warn('Přihlášení k odběru selhalo:', error);
      errorMessage = GENERIC_ERROR;
    }

    // Mezitím mohl návštěvník přejít na jinou stránku
    if (signal.aborted) {
      return;
    }

    submitButton.disabled = false;
    if (errorMessage) {
      setStatus(errorMessage, 'error');
      return;
    }

    form.reset();
    setStatus(successMessage(email), 'success');
  });
};

(() => {
  const register =
    window.AuraView?.register ??
    ((init) =>
      document.addEventListener('DOMContentLoaded', () =>
        init(new AbortController().signal)
      ));

  register(initNewsletter);
})();
