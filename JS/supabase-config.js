window.SUPABASE_CONFIG = {
  url: 'https://dcojkzsekqctzlegrzdd.supabase.co',
  anonKey: 'sb_publishable_lSgBJenvr6GIsb4IWT0W1A_O1E6wqnI',
  // Krátké přihlašovací jméno -> e-mail účtu v Supabase.
  // Do přihlašovacího pole v admin.html tak stačí napsat "myska"
  // místo celé e-mailové adresy. Samotný e-mail funguje pořád taky.
  //
  // Klíče musí být malými písmeny, zadané jméno se převádí na malá.
  // Na velikosti písmen při přihlašování proto nezáleží.
  //
  // Heslo se NIKDY nenastavuje tady - spravuje ho Supabase.
  // Tenhle soubor je veřejný, takže sem nepatří ani osobní adresy.
  adminLoginAliases: {
    myska: 'aura@michaell.cz',
    svoby: 'admin@michaell.cz'
  }
};

// Kategorie ceníku. Slug musí odpovídat data-group / data-category-filter
// v msginfo.html - podle něj se karty z databáze řadí do sekcí.
window.SERVICE_CATEGORIES = [
  { slug: 'klasicke', label: 'Klasické' },
  { slug: 'sportovni', label: 'Sportovní' },
  { slug: 'zabaly', label: 'Zábaly' },
  { slug: 'scratch', label: 'Scratch Therapy' },
  { slug: 'vedomy', label: 'Vědomý dotek' },
  { slug: 'motyli', label: 'Motýlý dotek' },
  { slug: 'bankovani', label: 'Baňkování' },
  { slug: 'fullbody', label: 'Full body' },
  { slug: 'tarot', label: 'Tarot' },
  { slug: 'ostatni', label: 'Ostatní služby' }
];

// Knihovna Supabase se stahuje až ve chvíli, kdy ji stránka opravdu potřebuje
// (kniha návštěv, ceník z databáze, galerie na úvodu). Díky routeru se pohled
// může objevit i bez znovunačtení stránky, proto je načtení společné.
window.SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

let supabaseLibraryPromise = null;

window.ensureSupabase = () => {
  if (window.supabase) {
    return Promise.resolve(window.supabase);
  }
  if (supabaseLibraryPromise) {
    return supabaseLibraryPromise;
  }

  supabaseLibraryPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${window.SUPABASE_CDN}"]`);
    const script = existing || document.createElement('script');

    script.addEventListener('load', () => resolve(window.supabase), { once: true });
    script.addEventListener('error', () => reject(new Error('Supabase se nepodařilo načíst')), {
      once: true
    });

    if (!existing) {
      script.src = window.SUPABASE_CDN;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    // Další pokus smí proběhnout znovu, výpadek sítě nemá knihovnu zablokovat.
    supabaseLibraryPromise = null;
    throw error;
  });

  return supabaseLibraryPromise;
};
