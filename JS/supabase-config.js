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
    svoby: 'admin@micheall.cz'
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
