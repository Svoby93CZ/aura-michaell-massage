/**
 * Plynulé přepínání stránek bez znovunačtení (SPA vrstva)
 *
 * Každá veřejná stránka má obsah zabalený v <div id="spa-root" data-view="...">.
 * Router zachytí kliknutí na interní odkaz, stáhne cílovou stránku, vymění
 * obsah #spa-root a přepíše adresu přes history.pushState. Stránky přitom
 * zůstávají plnohodnotné - bez JS (nebo při chybě) funguje klasická navigace.
 *
 * Rozhraní pro ostatní skripty:
 *   window.AuraView.register(fn) - fn(signal) se zavolá při každém zobrazení
 *   pohledu. Signal se odpojí (abort) při odchodu z pohledu, takže na něj lze
 *   navázat globální listenery, intervaly a animační smyčky.
 */
(() => {
  const ROOT_ID = 'spa-root';
  const FADE_MS = 220;
  const SKIP_PAGES = ['admin.html'];

  const viewInits = [];
  const executedOnce = new Set();
  const htmlCache = new Map();

  let controller = new AbortController();
  let booted = false;
  let navigationToken = 0;
  // Cesta stránky, jejíž obsah je právě vykreslený. Při popstate už
  // location ukazuje na cíl, takže ji nejde zjistit odtud.
  let renderedPath = location.pathname;

  const supportsRouting = Boolean(
    window.fetch && window.DOMParser && window.history && window.history.pushState
  );

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getRoot = () => document.getElementById(ROOT_ID);
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  // ===== Životní cyklus pohledu =====
  const runViewInits = () => {
    const signal = controller.signal;
    viewInits.forEach((init) => {
      try {
        init(signal);
      } catch (error) {
        console.error('Inicializace pohledu selhala:', error);
      }
    });
  };

  const teardownView = () => {
    controller.abort();
    controller = new AbortController();
  };

  window.AuraView = {
    register(init) {
      if (typeof init !== 'function') {
        return;
      }
      viewInits.push(init);
      if (booted) {
        try {
          init(controller.signal);
        } catch (error) {
          console.error('Inicializace pohledu selhala:', error);
        }
      }
    },
    get signal() {
      return controller.signal;
    },
    navigate(url) {
      return navigate(new URL(url, location.href), { push: true });
    }
  };

  // ===== Hlavička dokumentu =====
  const syncMeta = (doc, selector, attribute, createTag) => {
    const source = doc.querySelector(selector);
    let target = document.querySelector(selector);

    if (!source) {
      return;
    }
    if (!target) {
      target = createTag();
      document.head.appendChild(target);
    }
    target.setAttribute(attribute, source.getAttribute(attribute) || '');
  };

  const syncHead = (doc) => {
    document.title = doc.title || document.title;

    [['description'], ['keywords']].forEach(([name]) => {
      syncMeta(doc, `meta[name="${name}"]`, 'content', () => {
        const tag = document.createElement('meta');
        tag.setAttribute('name', name);
        return tag;
      });
    });

    ['og:title', 'og:description', 'og:url', 'og:type', 'og:image'].forEach((property) => {
      syncMeta(doc, `meta[property="${property}"]`, 'content', () => {
        const tag = document.createElement('meta');
        tag.setAttribute('property', property);
        return tag;
      });
    });

    syncMeta(doc, 'link[rel="canonical"]', 'href', () => {
      const tag = document.createElement('link');
      tag.setAttribute('rel', 'canonical');
      return tag;
    });
  };

  // ===== Skripty vložené přímo v obsahu stránky =====
  const captureDocumentWrite = (target, run) => {
    const originalWrite = document.write;
    const originalWriteln = document.writeln;

    const writeInto = (...chunks) => {
      const template = document.createElement('template');
      template.innerHTML = chunks.join('');
      target.appendChild(template.content);
    };

    document.write = writeInto;
    document.writeln = (...chunks) => writeInto(...chunks, '\n');

    const restore = () => {
      document.write = originalWrite;
      document.writeln = originalWriteln;
    };

    return run().then(restore, (error) => {
      restore();
      throw error;
    });
  };

  const onceKeyOf = (script) => {
    if (script.dataset.spaOnce === undefined) {
      return null;
    }
    return script.dataset.spaOnce || script.getAttribute('src');
  };

  const executeScript = (original) => {
    const src = original.getAttribute('src');

    // Widgety třetích stran, které stačí nastartovat jednou za návštěvu
    const onceKey = onceKeyOf(original);
    if (onceKey) {
      if (executedOnce.has(onceKey)) {
        original.remove();
        return Promise.resolve();
      }
      executedOnce.add(onceKey);
    }

    const replacement = document.createElement('script');
    Array.from(original.attributes).forEach(({ name, value }) => {
      replacement.setAttribute(name, value);
    });
    replacement.textContent = original.textContent;

    const finished = src
      ? new Promise((resolve) => {
          replacement.addEventListener('load', resolve, { once: true });
          replacement.addEventListener('error', resolve, { once: true });
        })
      : Promise.resolve();

    const insert = () => {
      original.replaceWith(replacement);
      return finished;
    };

    // Starší počítadla a widgety zapisují obsah přes document.write; zachytíme
    // ho do vlastního kontejneru, aby nepřepsaly celý dokument.
    if (original.dataset.spaWrite === 'capture') {
      const host = document.createElement('span');
      host.className = 'spa-script-output';
      original.before(host);
      return captureDocumentWrite(host, insert).finally(() => {
        // Prázdný obal by vypadal jako výstup skriptu (např. skryté počítadlo
        // návštěv se odkrývá právě podle toho, jestli něco vypsalo). Skripty
        // vložené přes document.write se navíc samy nespustí, takže je za
        // výstup nepovažujeme.
        const hasOutput = [...host.childNodes].some((node) =>
          node.nodeType === Node.ELEMENT_NODE
            ? node.tagName !== 'SCRIPT'
            : node.textContent.trim().length > 0
        );
        if (!hasOutput) {
          host.remove();
        }
      });
    }

    return insert();
  };

  const runContentScripts = async (container) => {
    const scripts = Array.from(container.querySelectorAll('script'));
    for (const script of scripts) {
      try {
        await executeScript(script);
      } catch (error) {
        console.warn('Skript v obsahu stránky selhal:', error);
      }
    }
  };

  // ===== Přechod mezi pohledy =====
  const applyTransition = async (mutate) => {
    if (prefersReducedMotion()) {
      mutate();
      return;
    }

    if (typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(mutate);
      try {
        await transition.updateCallbackDone;
      } catch (error) {
        console.warn('Přechod pohledu selhal:', error);
      }
      return;
    }

    const leaving = getRoot();
    if (leaving) {
      leaving.classList.add('spa-view--leaving');
      await wait(FADE_MS);
    }

    mutate();

    const entering = getRoot();
    if (entering) {
      entering.classList.add('spa-view--entering');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => entering.classList.remove('spa-view--entering'));
      });
    }
  };

  // ===== Scroll a zaměření =====
  // Po přepnutí pohledu se obrázky dopočítávají postupně, takže stránka bývá
  // chvíli nižší, než byla, a prohlížeč uloženou pozici ořízne. Dorovnáváme ji
  // proto ještě chvíli - ale jen dokud je stránka příliš krátká. Jakmile se na
  // pozici dostaneme nebo začne rolovat někdo jiný, přestaneme zasahovat.
  const settleScroll = (target) => {
    if (target <= 0) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    let cancelled = false;
    const userEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const stop = () => {
      cancelled = true;
      userEvents.forEach((type) => window.removeEventListener(type, stop));
    };
    userEvents.forEach((type) => window.addEventListener(type, stop, { passive: true }));

    const attempt = (remaining) => {
      // Nižší pozice znamená, že se cíl ještě nevešel; vyšší nebo shodná
      // znamená, že jsme doma nebo že stránku posunul někdo jiný.
      if (cancelled || remaining <= 0 || window.scrollY >= target - 2) {
        stop();
        return;
      }
      window.scrollTo({ top: target, behavior: 'instant' });
      window.setTimeout(() => attempt(remaining - 1), 100);
    };

    window.scrollTo({ top: target, behavior: 'instant' });
    requestAnimationFrame(() => attempt(12));
  };

  const restoreScroll = (hash, savedPosition) => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start'
        });
        return;
      }
    }
    settleScroll(typeof savedPosition === 'number' ? savedPosition : 0);
  };

  // Pozice se ukládá do záznamu historie, který opouštíme. Tlačítko Zpět
  // se pak vrátí přesně tam, kde návštěvník byl - i v rámci jedné stránky.
  const rememberScroll = () => {
    history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '', location.href);
  };

  // Skok na kotvu přesune i fokus, jinak by další Tab začal znovu od menu
  // (odkaz "Přeskočit na obsah", čtečky obrazovky).
  const focusTarget = (target) => {
    if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  };

  const moveFocus = () => {
    const root = getRoot();
    if (!root) {
      return;
    }
    const heading = root.querySelector('h1') || root;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  };

  // ===== Načtení stránky =====
  const fetchPage = async (url) => {
    const key = url.pathname;
    if (htmlCache.has(key)) {
      return htmlCache.get(key);
    }

    const response = await fetch(url.href, {
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'aura-router' }
    });
    if (!response.ok) {
      throw new Error(`Stránku se nepodařilo načíst (${response.status})`);
    }

    const html = await response.text();
    htmlCache.set(key, html);
    return html;
  };

  const prefetch = (url) => {
    if (!supportsRouting || htmlCache.has(url.pathname)) {
      return;
    }
    fetchPage(url).catch(() => {
      htmlCache.delete(url.pathname);
    });
  };

  const navigate = async (url, { push = true, savedPosition = null } = {}) => {
    const token = ++navigationToken;
    const root = getRoot();
    if (!root) {
      location.href = url.href;
      return;
    }

    document.documentElement.classList.add('spa-busy');

    let doc;
    try {
      const html = await fetchPage(url);
      doc = new DOMParser().parseFromString(html, 'text/html');
    } catch (error) {
      console.warn('Přechod bez načtení stránky selhal, pokračuji klasicky:', error);
      location.href = url.href;
      return;
    }

    // Mezitím uživatel klikl jinam - tuto navigaci zahodíme
    if (token !== navigationToken) {
      return;
    }

    const incomingRoot = doc.getElementById(ROOT_ID);
    if (!incomingRoot) {
      location.href = url.href;
      return;
    }

    if (push) {
      rememberScroll();
      history.pushState({ path: url.pathname }, '', url.href);
    }

    teardownView();

    await applyTransition(() => {
      const outgoing = getRoot();
      const adopted = document.importNode(incomingRoot, true);
      outgoing.replaceWith(adopted);
      document.body.className = doc.body.className;
      syncHead(doc);
    });
    renderedPath = url.pathname;

    document.documentElement.classList.remove('spa-busy');

    booted = true;
    await runContentScripts(getRoot());
    runViewInits();

    // Při návratu má uložená pozice přednost před kotvou v adrese.
    const returning = !push && typeof savedPosition === 'number';
    restoreScroll(returning ? '' : url.hash, returning ? savedPosition : null);
    moveFocus();

    // Bez souhlasu by se událost jen hromadila ve frontě a odešla by se
    // dodatečně, kdyby návštěvník souhlas dal později.
    if (window.AuraConsent?.has('analytics') && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: url.pathname + url.search,
        page_title: document.title
      });
    }
  };

  // ===== Zachytávání odkazů =====
  const isRoutable = (url) => {
    if (url.origin !== location.origin) {
      return false;
    }
    const file = url.pathname.split('/').pop();
    if (SKIP_PAGES.includes(file)) {
      return false;
    }
    return file === '' || file.endsWith('.html');
  };

  const findLink = (event) => {
    if (event.defaultPrevented || event.button !== 0) {
      return null;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return null;
    }
    const link = event.target.closest('a[href]');
    if (!link) {
      return null;
    }
    if (link.target && link.target !== '_self') {
      return null;
    }
    if (link.hasAttribute('download') || link.dataset.spaSkip !== undefined) {
      return null;
    }
    if ((link.getAttribute('rel') || '').includes('external')) {
      return null;
    }

    const href = link.getAttribute('href') || '';
    // Prázdnou kotvu a jiná schémata (mailto:, tel:) necháváme prohlížeči.
    // Kotvy v rámci stránky (#…) zpracujeme níže, jinak by je prohlížeč
    // ohlásil jako popstate a stránka by se zbytečně vykreslila znovu.
    if (href === '#' || /^(mailto|tel|sms|javascript):/i.test(href)) {
      return null;
    }

    const url = new URL(link.href, location.href);
    return isRoutable(url) ? url : null;
  };

  if (!supportsRouting) {
    document.addEventListener('DOMContentLoaded', () => {
      booted = true;
      runViewInits();
    });
    return;
  }

  document.addEventListener('click', (event) => {
    const url = findLink(event);
    if (!url) {
      return;
    }

    // Odkaz v rámci aktuální stránky - jen doscrollovat, nic nevykreslovat.
    // Kotvu, která na stránce není, necháme prohlížeči.
    if (url.pathname === location.pathname && url.hash) {
      const target = document.getElementById(url.hash.slice(1));
      if (!target) {
        return;
      }
      event.preventDefault();
      rememberScroll();
      history.pushState({ path: url.pathname }, '', url.href);
      restoreScroll(url.hash, null);
      focusTarget(target);
      return;
    }

    if (url.href === location.href) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    navigate(url, { push: true });
  });

  document.addEventListener(
    'pointerenter',
    (event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link) {
        return;
      }
      const url = new URL(link.href, location.href);
      if (isRoutable(url) && url.pathname !== location.pathname) {
        prefetch(url);
      }
    },
    { capture: true }
  );

  window.addEventListener('popstate', (event) => {
    const url = new URL(location.href);
    if (!isRoutable(url)) {
      return;
    }
    const savedPosition = event.state?.scrollY;

    // Zpět/Vpřed mezi kotvami téže stránky - obsah zůstává, jen se posune.
    // Uložená pozice má přednost před kotvou v adrese.
    if (url.pathname === renderedPath) {
      const hasSaved = typeof savedPosition === 'number';
      restoreScroll(hasSaved ? '' : url.hash, savedPosition);
      return;
    }
    navigate(url, { push: false, savedPosition });
  });

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  document.addEventListener('DOMContentLoaded', () => {
    history.replaceState({ path: location.pathname }, '', location.href);

    // Tyto skripty spustil parser při načtení stránky - podruhé už ne.
    document.querySelectorAll('script[data-spa-once]').forEach((script) => {
      const key = onceKeyOf(script);
      if (key) {
        executedOnce.add(key);
      }
    });

    booted = true;
    runViewInits();
    if (location.hash) {
      restoreScroll(location.hash, null);
    }
  });
})();
