/**
 * Souhlas s cookies a obsah třetích stran, který na něm závisí
 *
 * Bez souhlasu web nestahuje nic od třetích stran. Kategorie souhlasu:
 *   analytics - Google Analytics (statistika návštěvnosti)
 *   external  - mapa Google a recenze z Googlu přes službu Elfsight
 *
 * Volba se ukládá do localStorage i s verzí a časem. Po roce, nebo když
 * přibude kategorie (CONSENT_VERSION), se web zeptá znovu.
 *
 * Rozhraní pro ostatní skripty:
 *   window.AuraConsent.has('analytics' | 'external')
 *   window.AuraConsent.onChange(fn) - vrací funkci, která odběr zruší
 *   window.AuraConsent.open() - znovu otevře lištu
 * Tlačítko s atributem data-cookie-settings lištu otevře také.
 */
(() => {
  const STORAGE_KEY = 'am_cookie_consent';
  const CONSENT_VERSION = 2;
  const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
  const CATEGORIES = ['analytics', 'external'];
  const GA_ID = 'G-732NT4QJEX';

  const readConsent = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      // Záznam bez verze je ze staré lišty, která se ptala jen na Analytics.
      if (!stored || stored.version !== CONSENT_VERSION) {
        return null;
      }
      if (!(Date.now() - stored.ts < CONSENT_MAX_AGE_MS)) {
        return null;
      }
      return stored;
    } catch {
      return null;
    }
  };

  let consent = readConsent();
  const listeners = new Set();

  const has = (category) => Boolean(consent && consent[category]);

  const onChange = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  /* -----------------------------------------------------------------
     Google Analytics - skript se stáhne až po souhlasu
     ----------------------------------------------------------------- */

  let analyticsLoaded = false;

  // Cookies Analytics leží na hlavní doméně (.auramichaell.cz), smazat je jde
  // jen se stejnou doménou, jakou měly při uložení. Zkoušíme proto všechny.
  const clearAnalyticsCookies = () => {
    const names = document.cookie
      .split(';')
      .map((cookie) => cookie.split('=')[0].trim())
      .filter((name) => /^(_ga|_gid|_gat)/.test(name));
    if (!names.length) {
      return;
    }

    const parts = location.hostname.split('.');
    const domains = [''];
    for (let i = 0; i < parts.length - 1; i += 1) {
      domains.push(`; domain=.${parts.slice(i).join('.')}`);
    }

    names.forEach((name) => {
      domains.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
      });
    });
  };

  const applyAnalytics = () => {
    if (typeof window.gtag !== 'function') {
      return;
    }

    if (!has('analytics')) {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
      return;
    }

    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    if (analyticsLoaded) {
      return;
    }
    analyticsLoaded = true;
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  };

  const saveConsent = (choice) => {
    consent = { version: CONSENT_VERSION, ts: Date.now() };
    CATEGORIES.forEach((category) => {
      consent[category] = Boolean(choice[category]);
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      // localStorage nedostupné (privátní režim apod.) - volba platí do zavření stránky
    }

    applyAnalytics();
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('Reakce na změnu souhlasu selhala:', error);
      }
    });
  };

  /* -----------------------------------------------------------------
     Lišta se souhlasem
     ----------------------------------------------------------------- */

  let banner = null;
  let returnFocusTo = null;

  const closeBanner = () => {
    banner?.remove();
    banner = null;
    if (returnFocusTo && document.contains(returnFocusTo)) {
      returnFocusTo.focus();
    }
    returnFocusTo = null;
  };

  const showBanner = ({ focus = false } = {}) => {
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'cookie-consent';
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-labelledby', 'cookie-consent-title');
      banner.innerHTML = `
        <div class="cookie-consent__body">
          <p class="cookie-consent__title" id="cookie-consent-title">Soukromí na tomto webu</p>
          <p class="cookie-consent__text">
            Web funguje i bez cookies. Se souhlasem použijeme Google Analytics ke statistice
            návštěvnosti a zobrazíme mapu a recenze z Googlu (přes službu Elfsight), které tím
            získají vaši IP adresu. Více v <a href="privacy-policy.html">Zásadách ochrany osobních údajů</a>.
          </p>
          <div class="cookie-consent__options">
            <label class="cookie-consent__option">
              <input type="checkbox" data-consent-category="analytics">
              <span><strong>Statistika návštěvnosti</strong> (Google Analytics)</span>
            </label>
            <label class="cookie-consent__option">
              <input type="checkbox" data-consent-category="external">
              <span><strong>Mapa a recenze</strong> (Google Mapy, Elfsight)</span>
            </label>
          </div>
        </div>
        <div class="cookie-consent__actions">
          <button type="button" class="cookie-consent__btn cookie-consent__btn--primary" data-consent-action="reject">Odmítnout vše</button>
          <button type="button" class="cookie-consent__btn" data-consent-action="save">Uložit výběr</button>
          <button type="button" class="cookie-consent__btn cookie-consent__btn--primary" data-consent-action="accept">Přijmout vše</button>
        </div>
      `;

      banner.addEventListener('click', (event) => {
        const action = event.target.closest('[data-consent-action]')?.dataset.consentAction;
        if (!action) {
          return;
        }
        const choice = {};
        CATEGORIES.forEach((category) => {
          const checkbox = banner.querySelector(`[data-consent-category="${category}"]`);
          choice[category] = action === 'accept' || (action === 'save' && checkbox.checked);
        });
        saveConsent(choice);
        closeBanner();
      });

      banner.addEventListener('keydown', (event) => {
        // Escape jen zavře znovu otevřenou lištu. Při první návštěvě se volba
        // musí vybrat, jinak by se lišta na každé stránce ukazovala znovu.
        if (event.key === 'Escape' && consent) {
          closeBanner();
        }
      });

      document.body.appendChild(banner);
    }

    CATEGORIES.forEach((category) => {
      banner.querySelector(`[data-consent-category="${category}"]`).checked = has(category);
    });

    if (focus) {
      banner.querySelector('input, button').focus();
    }
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-cookie-settings]');
    if (!trigger) {
      return;
    }
    returnFocusTo = trigger;
    showBanner({ focus: true });
  });

  window.AuraConsent = {
    has,
    onChange,
    open: () => showBanner({ focus: true })
  };

  applyAnalytics();
  if (!consent) {
    showBanner();
  }

  /* -----------------------------------------------------------------
     Mapa a recenze až po souhlasu nebo kliknutí

     <div data-consent-embed="external" data-embed-script="https://…">
       <div class="consent-embed__placeholder">
         … <button data-consent-embed-load>Zobrazit</button>
       </div>
       <template data-consent-embed-content>…skutečný obsah…</template>
     </div>

     Se souhlasem v dané kategorii se obsah načte sám. Bez něj ho jde
     načíst tlačítkem jen pro tuto chvíli - volba se nikam neukládá.
     ----------------------------------------------------------------- */

  const loadedScripts = new Set();

  const loadEmbed = (container) => {
    const template = container.querySelector('template[data-consent-embed-content]');
    if (container.dataset.embedLoaded || !template) {
      return;
    }
    container.dataset.embedLoaded = 'true';
    container.replaceChildren(template.content.cloneNode(true));

    // Skript widgetu (Elfsight) stačí stáhnout jednou za návštěvu, nové
    // prvky na stránce si po přepnutí pohledu najde sám.
    const src = container.dataset.embedScript;
    if (src && !loadedScripts.has(src)) {
      loadedScripts.add(src);
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    }
  };

  const initConsentEmbeds = (signal) => {
    const containers = Array.from(document.querySelectorAll('[data-consent-embed]'));
    if (!containers.length) {
      return;
    }

    containers.forEach((container) => {
      container.querySelector('[data-consent-embed-load]')?.addEventListener('click', () => {
        loadEmbed(container);
      });
    });

    const loadAllowed = () => {
      containers.forEach((container) => {
        if (has(container.dataset.consentEmbed)) {
          loadEmbed(container);
        }
      });
    };

    loadAllowed();
    const unsubscribe = onChange(loadAllowed);
    signal.addEventListener('abort', unsubscribe, { once: true });
  };

  const register =
    window.AuraView?.register ??
    ((init) =>
      document.addEventListener('DOMContentLoaded', () =>
        init(new AbortController().signal)
      ));

  register(initConsentEmbeds);
})();
