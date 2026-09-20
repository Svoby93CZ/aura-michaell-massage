# 🌟 Aura Michaell Massage - Website

Profesionální webová stránka pro masážní salon v Bruntále.

## 📁 Struktura projektu

```
.
├── index.html              # Hlavní stránka
├── about.html              # O salonu
├── ceremonie.html          # Ceremoniální a rituální služby
├── obchod.html             # Obchod / doplňkové nabídky
├── msginfo.html            # Přehled služeb a ceníky (načítá se z databáze)
├── privacy-policy.html     # Ochrana osobních údajů (GDPR)
├── admin.html              # Administrace: ceník + kniha návštěv
├── supabase-guestbook.sql  # Schéma knihy návštěv pro Supabase
├── supabase-services.sql   # Schéma ceníku pro Supabase
├── supabase-services-seed.sql # Prvotní naplnění ceníku (31 masáží)
├── supabase-gallery.sql    # Schéma galerie salonu pro Supabase
├── style.css               # Hlavní CSS styly
├── JS/                     # JavaScript funkcionalita
│   ├── 3D_hover.js         # 3D efekty navigace a prvků
│   ├── admin.js             # Administrace: přihlášení, záložky, kniha návštěv
│   ├── admin-services.js    # Administrace: správa ceníku masáží
│   ├── admin-gallery.js     # Administrace: správa galerie salonu
│   ├── gallery-manifest.js  # Seznam obrázků masáží (generovaný)
│   ├── card-3d.js           # 3D karta / vizuální efekty
│   ├── ceremony-carousel.js # Karusel ceremonií
│   ├── guestbook.js         # Veřejná kniha návštěv
│   ├── katalog.js            # Filtrování katalogu služeb
│   ├── main.js              # Hlavní JavaScript funkcionalita
│   └── supabase-config.js   # Konfigurace Supabase
├── galerie/                # Obrázky pro galerii
│   ├── masaze/             # Obrázky masáží
│   ├── ceremonie/          # Obrázky ceremonií
│   └── Poukazy/            # Dárkové poukazy
├── .github/workflows/      # Automatická údržba souborů na GitHubu
└── tools/                  # Nástroje pro údržbu kódu
    ├── _audit-unused-css.ps1
    ├── extract_services.py           # Vytáhne ceník z msginfo.html do SQL
    ├── stamp_assets.py               # Verzování CSS a JS proti staré cache
    ├── generate_gallery_manifest.py  # Obnoví seznam obrázků masáží
    └── inline_section_comments.py
```

## 🚀 Co web umí

- Responzivní prezentaci salonu na desktopu i mobilu
- Hero sekci, navigaci, kontakty a základní informační stránky
- Přehled služeb a ceníků v desktop i mobilním zobrazení
- Galerie a vizuální doplňky včetně 3D efektů
- Stránku zásad ochrany osobních údajů
- Moderovanou Knihu návštěv napojenou na Supabase
- Ceník masáží editovatelný z administrace (admin.html)
- Statický web bez front-end závislostí

## 🔐 Administrace (admin.html)

Přihlášení jménem a heslem přes Supabase Auth. Stránka má tři záložky:
**Ceník** (přidání, úprava a mazání masáží; cena se edituje rovnou v seznamu,
pořadí mění šipky), **Galerie** (fotky v sekci „Prostor a atmosféra salonu“
na hlavní stránce) a **Kniha návštěv** (schvalování a mazání vzkazů).

Do administrace se dostanete buď přímo přes `admin.html`, nebo **trojklikem
na copyright v patičce** kterékoli stránky webu.

### První nastavení

1. V Supabase SQL Editoru spusťte `supabase-services.sql`, poté
   `supabase-services-seed.sql` a nakonec `supabase-gallery.sql`.
2. Nastavte účtu správce heslo. Buď v Supabase → Authentication → Users,
   nebo se přihlaste odkazem „Reset password" z e-mailu a heslo si zadejte
   v administraci tlačítkem **Změnit heslo** v horní liště.
3. V Supabase → Authentication → Sign In / Providers **vypněte registraci
   nových uživatelů** („Allow new users to sign up"). Bez toho si může
   kdokoli s veřejným klíčem založit účet.
4. Tamtéž nastavte **minimální délku hesla** na 12 znaků.

   Supabase umí odmítat hesla z úniků dat, ale až od placeného tarifu.
   Na bezplatném tarifu to za něj dělá administrace sama: před uložením
   porovná heslo s veřejnou databází HaveIBeenPwned. Samotné heslo přitom
   prohlížeč neposílá — odejde jen prvních pět znaků jeho SHA-1 otisku
   a shoda se hledá až v prohlížeči.
5. Krátké přihlašovací jméno se nastavuje v `JS/supabase-config.js`
   v sekci `adminLoginAliases` (překládá se na e-mail účtu).

Pozor: odkaz „Reset password" ze Supabase sám o sobě přihlašuje, ale heslo
**nemění** — nové heslo je potřeba zadat. Proto má administrace v horní liště
tlačítko **Změnit heslo**. Odkaz z toho e-mailu má stejnou moc jako heslo,
takže ho nikomu nepřeposílejte.

Oprávnění správce se řídí tabulkou `guestbook_admins` — samotné přihlášení
nestačí, účet musí mít v této tabulce řádek. Přístup k datům hlídá RLS
přímo v databázi, přihlašovací formulář je jen pohodlí.

### Ceník a jeho záloha

Ceník se na `msginfo.html` načítá z tabulky `services`, takže změny
v administraci jsou na webu vidět okamžitě. Statické karty přímo
v `msginfo.html` zůstávají jako **záloha** pro případ, že by databáze
nebo JavaScript neodpověděly.

Tato záloha se sama neaktualizuje — po větších změnách ceníku ji nechte
přegenerovat, jinak by při výpadku ukázala staré ceny.

### Galerie salonu

Karusel „Prostor a atmosféra salonu“ na hlavní stránce se načítá z tabulky
`gallery_images`. Statické snímky v `index.html` zůstávají jako záloha, stejně
jako u ceníku. Karusel na `ceremonie.html` je čistě statický a administrace
se ho netýká.

### Obrázky

Obrázky masáží se vybírají ze složky `galerie/masaze/`, fotky galerie
ze složky `galerie/`. Nový soubor tam stačí nahrát přes web GitHubu —
seznam pro administraci si obnoví workflow sám (viz *Automatická údržba*).

Kategorie ceníku (Klasické, Sportovní, …) a texty Indikace/Kontraindikace
se stále upravují ručně v `msginfo.html`; seznam kategorií je navíc
v `JS/supabase-config.js`.

## 🤖 Automatická údržba

Po každé změně v `galerie/`, `JS/`, `style.css` nebo v HTML souborech na větvi
`main` se sám spustí workflow `.github/workflows/aktualizace-souboru.yml`, který:

1. obnoví seznam obrázků pro administraci (`generate_gallery_manifest.py`),
2. doplní k CSS a JS značku verze (`stamp_assets.py`),
3. výsledek uloží zpět do repozitáře.

**Nové obrázky proto stačí nahrát přes web GitHubu — nic se nespouští ručně.**
Průběh je vidět na GitHubu v záložce *Actions*; tamtéž jde workflow spustit
ručně tlačítkem *Run workflow*.

Proč to je potřeba: `.htaccess` nechává prohlížeč držet si CSS a JS až měsíc.
Bez značky verze by si návštěvníci i vy načetli novou HTML stránku se starým
skriptem — stránka by vypadala nově, ale nefungovala. A složku `galerie/`
si prohlížeč sám přečíst neumí (`Options -Indexes`), proto ten seznam.

Když byste přesto chtěl skripty spustit u sebe, jdou zavolat odkudkoli:

```bash
python3 ~/aura-michaell-massage/tools/generate_gallery_manifest.py
python3 ~/aura-michaell-massage/tools/stamp_assets.py
```

Pro sjednocení inline komentářů v CSS použijte:

```powershell
python tools/inline_section_comments.py
```

## 📞 Kontakt

**Provozovatel:** Michaela Svobodová  
**Email:** aura.michaell@seznam.cz  
**Telefon:** +420 727 836 338  
**Adresa:** Šmilovského 663/1, 792 01 Bruntál

## 📝 Licence

© 2026 Aura Michaell Massage. Všechna práva vyhrazena.

---

**Poslední aktualizace:** 20.09.2026
