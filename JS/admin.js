(() => {
  const app = document.querySelector('[data-admin-app]');
  if (!app || !window.supabase || !window.SUPABASE_CONFIG) {
    return;
  }

  const { url, anonKey } = window.SUPABASE_CONFIG;
  const hasConfiguration = url && anonKey && !url.includes('YOUR-PROJECT') && !anonKey.includes('YOUR_SUPABASE');
  const client = hasConfiguration ? window.supabase.createClient(url, anonKey) : null;

  const loginPanel = app.querySelector('[data-admin-login-panel]');
  const dashboard = app.querySelector('[data-admin-dashboard]');
  const loginForm = app.querySelector('[data-admin-login-form]');
  const loginStatus = app.querySelector('[data-admin-login-status]');
  const list = app.querySelector('[data-admin-entry-list]');
  const status = app.querySelector('[data-admin-status]');
  const userLabel = app.querySelector('[data-admin-user]');
  const entriesTabCount = app.querySelector('[data-entries-tab-count]');

  // Modul ceníku (JS/admin-services.js) se napojí přes tohle rozhraní.
  // Ověření správce může doběhnout dřív, než se modul ceníku vůbec načte,
  // proto si stav pamatujeme a pozdní registraci zavoláme rovnou.
  const readyCallbacks = [];
  let adminReady = false;

  window.AdminApp = {
    client,
    app,
    onAdminReady(callback) {
      if (adminReady) {
        callback(client);
        return;
      }
      readyCallbacks.push(callback);
    }
  };

  const setStatus = (target, message, type = '') => {
    if (!target) {
      return;
    }
    target.textContent = message;
    target.dataset.state = type;
  };

  const formatDate = (date) => new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));

  /* ---------------------------------------------------------------
     Noční režim - stejná logika jako na ostatních stránkách webu.
     --------------------------------------------------------------- */

  const themeToggle = app.querySelector('[data-theme-toggle]');
  const themeIcon = app.querySelector('[data-theme-toggle-icon]');

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  };

  const currentTheme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  applyTheme(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try {
        localStorage.setItem('theme', next);
      } catch (error) {
        /* Soukromý režim prohlížeče - volbu prostě neuložíme. */
      }
    });
  }

  /* ---------------------------------------------------------------
     Přepínání sekcí Ceník / Kniha návštěv
     --------------------------------------------------------------- */

  const tabs = Array.from(app.querySelectorAll('[data-admin-tab]'));
  const panels = Array.from(app.querySelectorAll('[data-admin-panel]'));

  const activateTab = (name) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.adminTab === name;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.adminPanel === name;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
    try {
      localStorage.setItem('am_admin_tab', name);
    } catch (error) {
      /* Volbu záložky si prostě nezapamatujeme. */
    }
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.adminTab));
  });

  let storedTab = null;
  try {
    storedTab = localStorage.getItem('am_admin_tab');
  } catch (error) {
    storedTab = null;
  }
  if (storedTab && tabs.some((tab) => tab.dataset.adminTab === storedTab)) {
    activateTab(storedTab);
  }

  /* ---------------------------------------------------------------
     Kniha návštěv
     --------------------------------------------------------------- */

  let allEntries = [];
  let entryFilter = 'pending';

  const visibleEntries = () => {
    if (entryFilter === 'pending') {
      return allEntries.filter((entry) => !entry.approved);
    }
    if (entryFilter === 'approved') {
      return allEntries.filter((entry) => entry.approved);
    }
    return allEntries;
  };

  const renderEntries = () => {
    const entries = visibleEntries();
    list.replaceChildren();

    if (entriesTabCount) {
      const pending = allEntries.filter((entry) => !entry.approved).length;
      entriesTabCount.textContent = pending
        ? `${pending} ${pending === 1 ? 'vzkaz čeká' : pending < 5 ? 'vzkazy čekají' : 'vzkazů čeká'}`
        : 'Vše vyřízeno';
      entriesTabCount.dataset.highlight = pending ? 'true' : 'false';
    }

    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = entryFilter === 'pending'
        ? 'Žádné čekající vzkazy.'
        : 'Žádné vzkazy v tomto filtru.';
      list.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const article = document.createElement('article');
      article.className = 'admin-entry';
      article.dataset.approved = entry.approved ? 'true' : 'false';

      const heading = document.createElement('div');
      heading.className = 'admin-entry__heading';

      const author = document.createElement('strong');
      author.textContent = entry.nickname;

      const meta = document.createElement('div');
      meta.className = 'admin-entry__meta';

      const state = document.createElement('span');
      state.className = entry.approved ? 'admin-badge admin-badge--ok' : 'admin-badge admin-badge--wait';
      state.textContent = entry.approved ? 'Schváleno' : 'Čeká';

      const date = document.createElement('time');
      date.textContent = formatDate(entry.created_at);
      meta.append(state, date);
      heading.append(author, meta);

      const message = document.createElement('p');
      message.className = 'admin-entry__message';
      message.textContent = entry.message;

      const rating = document.createElement('p');
      rating.className = 'admin-entry__rating';
      rating.textContent = entry.rating ? `${'★'.repeat(entry.rating)}${'☆'.repeat(5 - entry.rating)}` : 'Bez hodnocení';

      const actions = document.createElement('div');
      actions.className = 'admin-entry__actions';

      const toggle = document.createElement('button');
      toggle.className = entry.approved ? 'admin-action admin-action--secondary' : 'admin-action';
      toggle.type = 'button';
      toggle.textContent = entry.approved ? 'Skrýt z webu' : 'Schválit';
      toggle.addEventListener('click', () => updateEntry(entry.id, { approved: !entry.approved }));
      actions.appendChild(toggle);

      const remove = document.createElement('button');
      remove.className = 'admin-action admin-action--danger';
      remove.type = 'button';
      remove.textContent = 'Smazat';
      remove.addEventListener('click', () => {
        if (window.confirm(`Opravdu chcete smazat vzkaz od „${entry.nickname}“?`)) {
          deleteEntry(entry.id);
        }
      });
      actions.appendChild(remove);

      article.append(heading, message, rating, actions);
      list.appendChild(article);
    });
  };

  app.querySelectorAll('[data-entry-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      entryFilter = button.dataset.entryFilter;
      app.querySelectorAll('[data-entry-filter]').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
      renderEntries();
    });
  });

  const loadEntries = async () => {
    setStatus(status, 'Načítám vzkazy…');
    const { data, error } = await client
      .from('guestbook_entries')
      .select('id, nickname, rating, message, approved, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setStatus(status, 'Vzkazy se nepodařilo načíst. Ověřte oprávnění administrátora.', 'error');
      return;
    }

    allEntries = data || [];
    renderEntries();
    setStatus(status, '');
  };

  const updateEntry = async (id, changes) => {
    const { error } = await client.from('guestbook_entries').update(changes).eq('id', id);
    if (error) {
      setStatus(status, 'Změnu se nepodařilo uložit.', 'error');
      return;
    }
    await loadEntries();
  };

  const deleteEntry = async (id) => {
    const { error } = await client.from('guestbook_entries').delete().eq('id', id);
    if (error) {
      setStatus(status, 'Vzkaz se nepodařilo smazat.', 'error');
      return;
    }
    await loadEntries();
  };

  /* ---------------------------------------------------------------
     Přihlášení jménem/e-mailem a heslem
     --------------------------------------------------------------- */

  // Papírové pozadí patří jen přihlašovací obrazovce, proto se přepíná
  // třídou na body - kdyby leželo na samotné sekci, překrylo by záři,
  // která se kolem karty kreslí pseudoelementem pod ní.
  const showLogin = () => {
    loginPanel.hidden = false;
    dashboard.hidden = true;
    document.body.classList.add('admin-page--login');
  };

  const showDashboard = (user) => {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    userLabel.textContent = user.email || '';
    document.body.classList.remove('admin-page--login');
  };

  // Krátké přihlašovací jméno přeložíme na e-mail účtu v Supabase.
  const resolveEmail = (value) => {
    const login = value.trim();
    if (login.includes('@')) {
      return login;
    }
    const aliases = window.SUPABASE_CONFIG.adminLoginAliases || {};
    return aliases[login.toLowerCase()] || login;
  };

  const passwordToggle = app.querySelector('[data-password-toggle]');
  const passwordInput = app.querySelector('#admin-password');
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const show = passwordInput.type === 'password';
      passwordInput.type = show ? 'text' : 'password';
      passwordToggle.textContent = show ? 'Skrýt' : 'Zobrazit';
      passwordToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      passwordToggle.setAttribute('aria-label', show ? 'Skrýt heslo' : 'Zobrazit heslo');
    });
  }

  const checkAdmin = async (user) => {
    const { data, error } = await client
      .from('guestbook_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      await client.auth.signOut();
      showLogin();
      setStatus(loginStatus, 'Tento účet nemá oprávnění správce.', 'error');
      return;
    }

    showDashboard(user);
    setStatus(loginStatus, '');
    loadEntries();

    if (!adminReady) {
      adminReady = true;
      readyCallbacks.forEach((callback) => callback(client));
    }
  };

  if (!client) {
    showLogin();
    setStatus(loginStatus, 'Nejprve nastavte údaje Supabase v souboru JS/supabase-config.js.', 'error');
    return;
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(loginForm);
    const email = resolveEmail(String(form.get('login') || ''));
    const password = String(form.get('password') || '');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      setStatus(loginStatus, 'Vyplňte prosím přihlašovací jméno i heslo.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus(loginStatus, 'Přihlašuji…');

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        // Supabase vrací stejnou chybu pro špatné jméno i špatné heslo,
        // takže útočník nezjistí, který z údajů byl platný.
        setStatus(loginStatus, 'Přihlášení se nezdařilo. Zkontrolujte jméno a heslo.', 'error');
      }
    } catch (error) {
      setStatus(loginStatus, 'Přihlášení se nezdařilo. Zkuste to prosím znovu.', 'error');
    } finally {
      submitButton.disabled = false;
      loginForm.querySelector('#admin-password').value = '';
    }
  });

  /* ---------------------------------------------------------------
     Změna hesla

     Přihlásit se jde i odkazem „Reset password“ ze Supabase, který
     ale heslo nemění - jen pustí dovnitř. Tady si ho správce nastaví.
     --------------------------------------------------------------- */

  const passwordModal = app.querySelector('[data-password-modal]');
  const passwordForm = app.querySelector('[data-password-form]');
  const passwordStatus = app.querySelector('[data-password-status]');
  const passwordChangeButton = app.querySelector('[data-password-change]');

  const closePasswordModal = () => {
    passwordModal.hidden = true;
    passwordForm.reset();
    setStatus(passwordStatus, '');
    document.body.classList.remove('admin-modal-open');
  };

  passwordChangeButton.addEventListener('click', () => {
    setStatus(passwordStatus, '');
    passwordModal.hidden = false;
    document.body.classList.add('admin-modal-open');
    passwordForm.elements.password.focus();
  });

  app.querySelectorAll('[data-password-modal-close]').forEach((button) => {
    button.addEventListener('click', closePasswordModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !passwordModal.hidden) {
      closePasswordModal();
    }
  });

  const newPasswordToggle = app.querySelector('[data-new-password-toggle]');
  const newPasswordInput = app.querySelector('#new-password');
  newPasswordToggle.addEventListener('click', () => {
    const show = newPasswordInput.type === 'password';
    newPasswordInput.type = show ? 'text' : 'password';
    newPasswordToggle.textContent = show ? 'Skrýt' : 'Zobrazit';
    newPasswordToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
    newPasswordToggle.setAttribute('aria-label', show ? 'Skrýt heslo' : 'Zobrazit heslo');
  });

  /* Kontrola proti uniklým heslům.

     Supabase tohle umí sám, ale až od placeného tarifu. Děláme proto totéž
     přímo tady - přes stejné veřejné API HaveIBeenPwned, které používá i on.

     Heslo se nikam neposílá: spočítá se z něj SHA-1 otisk a odejde jen jeho
     prvních pět znaků. Server vrátí všechny otisky s tímto začátkem (jsou
     jich tisíce) a shoda se hledá až v prohlížeči. Z odeslaného útržku tak
     nejde poznat, o které heslo šlo.

     Když API neodpoví, změnu hesla nezablokujeme - je to pomoc, ne ochrana
     přístupu. Tou zůstává samotné heslo a pravidla v databázi. */
  const pocetUniku = async (password) => {
    if (!window.crypto || !window.crypto.subtle) {
      return null;
    }

    const bajty = new TextEncoder().encode(password);
    const otisk = await window.crypto.subtle.digest('SHA-1', bajty);
    const hex = Array.from(new Uint8Array(otisk))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const zacatek = hex.slice(0, 5);
    const zbytek = hex.slice(5);

    const odpoved = await fetch(`https://api.pwnedpasswords.com/range/${zacatek}`);
    if (!odpoved.ok) {
      throw new Error(`HaveIBeenPwned odpovědělo ${odpoved.status}`);
    }

    const radky = (await odpoved.text()).split('\n');
    for (const radek of radky) {
      const [pripona, pocet] = radek.trim().split(':');
      if (pripona === zbytek) {
        return Number(pocet) || 0;
      }
    }
    return 0;
  };

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = passwordForm.elements.password.value;
    const passwordAgain = passwordForm.elements.passwordAgain.value;
    const submitButton = passwordForm.querySelector('[data-password-submit]');

    if (password !== passwordAgain) {
      setStatus(passwordStatus, 'Hesla se neshodují.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus(passwordStatus, 'Ověřuji heslo…');

    let kontrolaProbehla = true;
    try {
      const uniky = await pocetUniku(password);
      if (uniky === null) {
        kontrolaProbehla = false;
      } else if (uniky) {
        const kolikrat = new Intl.NumberFormat('cs-CZ').format(uniky);
        setStatus(
          passwordStatus,
          `Tohle heslo se objevilo v únicích dat (${kolikrat}×). Zvolte prosím jiné.`,
          'error'
        );
        submitButton.disabled = false;
        return;
      }
    } catch (error) {
      // Kontrola je pomoc, ne ochrana přístupu - výpadek změnu hesla nezastaví.
      kontrolaProbehla = false;
    }

    setStatus(passwordStatus, 'Ukládám nové heslo…');

    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        setStatus(passwordStatus, `Heslo se nepodařilo změnit: ${error.message}`, 'error');
        return;
      }
      passwordForm.reset();
      setStatus(
        passwordStatus,
        kontrolaProbehla
          ? 'Heslo bylo změněno. Příště se jím přihlásíte.'
          : 'Heslo bylo změněno, ale kontrolu uniklých hesel se nepodařilo provést.',
        'success'
      );
    } catch (error) {
      setStatus(passwordStatus, 'Heslo se nepodařilo změnit. Zkuste to prosím znovu.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  app.querySelector('[data-admin-logout]').addEventListener('click', async () => {
    await client.auth.signOut();
    adminReady = false;
    showLogin();
  });

  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      checkAdmin(session.user);
    } else {
      showLogin();
    }
  });

  client.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      checkAdmin(data.session.user);
    } else {
      showLogin();
    }
  });
})();
