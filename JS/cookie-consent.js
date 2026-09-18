(() => {
  const STORAGE_KEY = 'am_cookie_consent';

  const readConsent = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeConsent = (granted) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ granted, ts: Date.now() }));
    } catch {
      // localStorage nedostupné (privátní režim apod.) - souhlas se zeptáme znovu příště
    }
  };

  const applyConsent = (granted) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage: granted ? 'granted' : 'denied'
    });
  };

  let banner = null;

  const closeBanner = () => {
    banner?.remove();
    banner = null;
  };

  const showBanner = () => {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Souhlas s používáním cookies');
    banner.innerHTML = `
      <p class="cookie-consent__text">
        Používáme Google Analytics k anonymní statistice návštěvnosti. Cookies pro tento účel
        aktivujeme až po vašem souhlasu. Více v
        <a href="privacy-policy.html">Zásadách ochrany osobních údajů</a>.
      </p>
      <div class="cookie-consent__actions">
        <button type="button" class="cookie-consent__btn cookie-consent__btn--decline">Odmítnout</button>
        <button type="button" class="cookie-consent__btn cookie-consent__btn--accept">Přijmout</button>
      </div>
    `;
    document.body.appendChild(banner);

    banner.querySelector('.cookie-consent__btn--accept').addEventListener('click', () => {
      writeConsent(true);
      applyConsent(true);
      closeBanner();
    });
    banner.querySelector('.cookie-consent__btn--decline').addEventListener('click', () => {
      writeConsent(false);
      applyConsent(false);
      closeBanner();
    });
  };

  const stored = readConsent();
  if (stored) {
    applyConsent(stored.granted);
  } else {
    showBanner();
  }

  window.reopenCookieBanner = () => {
    closeBanner();
    showBanner();
  };
})();
