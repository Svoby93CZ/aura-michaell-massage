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
  const list = app.querySelector('[data-admin-entry-list]');
  const status = app.querySelector('[data-admin-status]');
  const userLabel = app.querySelector('[data-admin-user]');

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.dataset.state = type;
  };

  const formatDate = (date) => new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));

  const showLogin = () => {
    loginPanel.hidden = false;
    dashboard.hidden = true;
  };

  const showDashboard = (user) => {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    userLabel.textContent = user.email || '';
  };

  const renderEntries = (entries) => {
    list.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'guestbook-empty';
      empty.textContent = 'Žádné čekající vzkazy.';
      list.appendChild(empty);
      return;
    }

    entries.forEach((entry) => {
      const article = document.createElement('article');
      article.className = 'admin-entry';
      const heading = document.createElement('div');
      heading.className = 'admin-entry__heading';
      const author = document.createElement('strong');
      author.textContent = entry.nickname;
      const date = document.createElement('time');
      date.textContent = formatDate(entry.created_at);
      heading.append(author, date);

      const message = document.createElement('p');
      message.textContent = entry.message;
      const rating = document.createElement('p');
      rating.className = 'admin-entry__rating';
      rating.textContent = entry.rating ? `${entry.rating}/5` : 'Bez hodnocení';

      const actions = document.createElement('div');
      actions.className = 'admin-entry__actions';
      if (!entry.approved) {
        const approve = document.createElement('button');
        approve.className = 'admin-action';
        approve.type = 'button';
        approve.textContent = 'Schválit';
        approve.addEventListener('click', () => updateEntry(entry.id, { approved: true }));
        actions.appendChild(approve);
      }
      const remove = document.createElement('button');
      remove.className = 'admin-action admin-action--danger';
      remove.type = 'button';
      remove.textContent = 'Smazat';
      remove.addEventListener('click', () => {
        if (window.confirm('Opravdu chcete tento vzkaz smazat?')) {
          deleteEntry(entry.id);
        }
      });
      actions.appendChild(remove);
      article.append(heading, message, rating, actions);
      list.appendChild(article);
    });
  };

  const loadEntries = async () => {
    setStatus('Načítám vzkazy…');
    const { data, error } = await client
      .from('guestbook_entries')
      .select('id, nickname, rating, message, approved, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setStatus('Vzkazy se nepodařilo načíst. Ověřte oprávnění administrátora.', 'error');
      return;
    }

    renderEntries(data || []);
    setStatus('');
  };

  const updateEntry = async (id, changes) => {
    const { error } = await client.from('guestbook_entries').update(changes).eq('id', id);
    if (error) {
      setStatus('Změnu se nepodařilo uložit.', 'error');
      return;
    }
    await loadEntries();
  };

  const deleteEntry = async (id) => {
    const { error } = await client.from('guestbook_entries').delete().eq('id', id);
    if (error) {
      setStatus('Vzkaz se nepodařilo smazat.', 'error');
      return;
    }
    await loadEntries();
  };

  const checkAdmin = async (user) => {
    const { data, error } = await client
      .from('guestbook_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      await client.auth.signOut();
      showLogin();
      setStatus('Tento účet nemá oprávnění správce.', 'error');
      return;
    }

    showDashboard(user);
    loadEntries();
  };

  if (!client) {
    showLogin();
    setStatus('Nejprve nastavte údaje Supabase v souboru supabase-config.js.', 'error');
    return;
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = new FormData(loginForm).get('email');
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.SUPABASE_CONFIG.adminRedirectUrl }
    });
    setStatus(error ? 'Přihlašovací odkaz se nepodařilo odeslat.' : 'Odkaz byl odeslán na zadaný e-mail.', error ? 'error' : 'success');
  });

  app.querySelector('[data-admin-logout]').addEventListener('click', async () => {
    await client.auth.signOut();
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