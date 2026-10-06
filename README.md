# 🌟 Aura Michaell Massage

Webové stránky masážního salonu Aura Michaell v Bruntále.

🌐 **[auramichaell.cz](https://auramichaell.cz)**

Repozitář je veřejný, aby bylo vidět, jak je web postavený. Nejde ale
o open-source projekt — podrobnosti v sekci [Autorská práva](#-autorská-práva).

## 🚀 Co web umí

- Prezentace salonu, masáží a ceremonií, přizpůsobená desktopu i mobilu
- Ceník masáží načítaný z databáze, se statickou zálohou pro případ výpadku
- Galerie salonu, ceremonií a dárkových poukazů
- Moderovaná kniha návštěv — vzkazy se zobrazí až po schválení
- Plynulé přepínání stránek bez znovunačtení
- Rezervace termínů přes Reservio
- Souhlas s cookies a stránka zásad ochrany osobních údajů (GDPR)
- Neveřejná administrace ceníku, galerie a knihy návštěv

## 🛠️ Technologie

- **HTML, CSS a JavaScript** bez frameworků a bez sestavovacího kroku —
  soubory se nahrávají na hosting tak, jak jsou v repozitáři
- **[Supabase](https://supabase.com)** — databáze a přihlášení do administrace.
  Kdo smí data číst a měnit, hlídají pravidla RLS přímo v databázi.
- **[Resend](https://resend.com)** — e-mailové upozornění na nový vzkaz
- **GitHub Actions** — automatická údržba souborů (viz níže)
- **Apache** (`.htaccess`) — cache, bezpečnostní hlavičky a Content Security Policy

V repozitáři nejsou žádná hesla ani tajné klíče. Klíč Supabase
v `JS/supabase-config.js` je veřejný (*publishable*) klíč určený pro prohlížeč;
tajné údaje jsou uložené mimo repozitář v Supabase Vault.

## 📁 Struktura projektu

```
.
├── index.html              # Hlavní stránka
├── about.html              # O salonu
├── ceremonie.html          # Ceremoniální a rituální služby
├── obchod.html             # Obchod / doplňkové nabídky
├── msginfo.html            # Přehled služeb a ceník
├── privacy-policy.html     # Ochrana osobních údajů (GDPR)
├── admin.html              # Administrace (neveřejná)
├── style.css               # Hlavní CSS styly
├── supabase-*.sql          # Schéma databáze (viz Databáze)
├── JS/                     # JavaScript
│   ├── main.js              # Hlavní funkcionalita webu
│   ├── router.js            # Přepínání stránek bez znovunačtení
│   ├── supabase-config.js   # Napojení na Supabase
│   ├── guestbook.js         # Kniha návštěv
│   ├── katalog.js           # Filtrování katalogu služeb
│   ├── cookie-consent.js    # Souhlas s cookies
│   ├── ceremony-carousel.js # Karusel ceremonií
│   ├── ceremony-lightbox.js # Lightbox se zoomem pro galerii ceremonií
│   ├── 3D_hover.js          # 3D efekty navigace a prvků
│   ├── card-3d.js           # 3D karta / vizuální efekty
│   ├── logo-draw.js         # Kreslící animace loga
│   ├── gallery-manifest.js  # Seznam obrázků (generovaný)
│   └── admin*.js            # Administrace
├── galerie/                # Obrázky
│   ├── masaze/             # Masáže
│   ├── ceremonie/          # Ceremonie
│   └── Poukazy/            # Dárkové poukazy
├── .github/workflows/      # Automatická údržba souborů
└── tools/                  # Pomocné skripty
    ├── generate_gallery_manifest.py  # Obnoví seznam obrázků
    ├── stamp_assets.py               # Verzování CSS a JS proti staré cache
    ├── extract_services.py           # Převede ceník z msginfo.html do SQL
    ├── inline_section_comments.py    # Sjednotí komentáře v CSS
    └── _audit-unused-css.ps1         # Najde nepoužívané CSS
```

## 🗄️ Databáze

Schéma je rozdělené do SQL souborů, které se spouštějí v Supabase SQL Editoru:

| Soubor | Obsah |
| --- | --- |
| `supabase-guestbook.sql` | Kniha návštěv a seznam správců |
| `supabase-guestbook-notify.sql` | E-mailové upozornění na nový vzkaz |
| `supabase-services.sql` | Ceník masáží |
| `supabase-services-seed.sql` | Prvotní naplnění ceníku |
| `supabase-gallery.sql` | Galerie salonu na hlavní stránce |

Ceník na `msginfo.html` a galerie na hlavní stránce se načítají z databáze.
Statický obsah přímo v HTML zůstává jako záloha pro případ, že by databáze
nebo JavaScript neodpověděly.

## 💻 Spuštění u sebe

Web nepotřebuje žádnou instalaci ani sestavení. Stačí libovolný statický
server, například:

```bash
python3 -m http.server 8000
```

a otevřít `http://localhost:8000`.

## 🤖 Automatická údržba

Po každé změně v `galerie/`, `JS/`, `style.css` nebo v HTML souborech na větvi
`main` se spustí workflow `.github/workflows/aktualizace-souboru.yml`, který:

1. obnoví seznam obrázků (`generate_gallery_manifest.py`),
2. doplní k CSS a JS značku verze (`stamp_assets.py`),
3. výsledek uloží zpět do repozitáře.

Proč to je potřeba: `.htaccess` nechává prohlížeč držet si CSS a JS až měsíc.
Bez značky verze by si návštěvníci načetli novou HTML stránku se starým
skriptem. A obsah složky `galerie/` prohlížeč sám přečíst neumí
(`Options -Indexes`), proto ten seznam.

Skripty jde spustit i ručně z kořene repozitáře:

```bash
python3 tools/generate_gallery_manifest.py
python3 tools/stamp_assets.py
```

## 🔀 Přepínání stránek bez znovunačtení

Obsah každé stránky je zabalený v `<div id="spa-root" data-view="...">`.
`JS/router.js` zachytí kliknutí na interní odkaz, stáhne cílovou stránku,
vymění obsah tohoto obalu a přepíše adresu v prohlížeči.

- Každá stránka má dál vlastní adresu, `title` a meta popisky — sitemap
  i vyhledávače fungují stejně jako u klasického webu.
- Bez JavaScriptu (nebo když se něco nepovede) se odkazy chovají klasicky.
- `admin.html` je z přepínání vyňatý a funguje samostatně.

Při úpravách stránek je potřeba dodržet dvě věci:

1. Veškerý obsah patří dovnitř `#spa-root`, skripty naopak zůstávají až za ním.
2. Skript, který se má spustit i po přepnutí pohledu, se registruje přes
   `window.AuraView.register((signal) => { ... })`. Globální listenery, intervaly
   a animační smyčky navažte na `signal`, aby se při odchodu ze stránky uklidily.

Widgety třetích stran uvnitř obsahu se řídí dvěma atributy: `data-spa-once`
spustí skript jen jednou za návštěvu, `data-spa-write="capture"` odchytí jeho
zápis přes `document.write`, aby nepřepsal celou stránku.

## 📞 Kontakt

**Aura Michaell Massage** — Michaela Svobodová  
**Web:** [auramichaell.cz](https://auramichaell.cz)  
**E-mail:** aura.michaell@seznam.cz  
**Telefon:** +420 727 836 338  
**Adresa:** Šmilovského 663/1, 792 01 Bruntál

## 📝 Autorská práva

© 2026 Aura Michaell Massage. Všechna práva vyhrazena.

Zdrojový kód je zveřejněný jen k nahlédnutí a repozitář nemá žádnou
open-source licenci. Texty, fotografie, logo ani kód webu proto není
dovoleno bez písemného souhlasu kopírovat ani dál používat.

---

**Poslední aktualizace:** 06.10.2026
