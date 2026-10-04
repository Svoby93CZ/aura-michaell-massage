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
├── supabase-guestbook-notify.sql # Upozornění e-mailem na nový vzkaz
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
│   ├── katalog.js           # Filtrování katalogu služeb
│   ├── logo-draw.js         # Kreslící animace loga
│   ├── main.js              # Hlavní JavaScript funkcionalita
│   ├── ceremony-lightbox.js # Lightbox se zoomem pro galerii ceremonií
│   ├── router.js            # Přepínání stránek bez znovunačtení
│   └── supabase-config.js   # Konfigurace Supabase a načtení knihovny
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
- Upozornění e-mailem, když do knihy návštěv přijde nový vzkaz
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
   v sekci `adminLoginAliases` (překládá se na e-mail účtu). Klíče pište
   malými písmeny; na velikosti písmen při přihlašování pak nezáleží.
   Soubor je veřejný, takže do něj nepatří osobní e-mailové adresy.

### Přidání dalšího správce

1. V Supabase → Authentication → Users → **Add user** → *Create new user*
   založte účet a zaškrtněte **Auto Confirm User** (jinak čeká na
   potvrzovací e-mail).
2. Dejte účtu oprávnění:

   ```sql
   insert into public.guestbook_admins (user_id)
   select id from auth.users where email = 'novy@priklad.cz'
   on conflict do nothing;
   ```

3. Volitelně přidejte krátké jméno do `adminLoginAliases`.

Odebrání správce: smazáním účtu v Supabase zmizí i jeho oprávnění,
tabulka má na účty vazbu `on delete cascade`.

Pozor: odkaz „Reset password" ze Supabase sám o sobě přihlašuje, ale heslo
**nemění** — nové heslo je potřeba zadat. Proto má administrace v horní liště
tlačítko **Změnit heslo**. Odkaz z toho e-mailu má stejnou moc jako heslo,
takže ho nikomu nepřeposílejte.

Oprávnění správce se řídí tabulkou `guestbook_admins` — samotné přihlášení
nestačí, účet musí mít v této tabulce řádek. Přístup k datům hlídá RLS
přímo v databázi, přihlašovací formulář je jen pohodlí.

### Upozornění na nový vzkaz

Když návštěvník napíše do knihy návštěv, přijde vám e-mail s přezdívkou,
hodnocením, textem vzkazu a odkazem do administrace. E-mail posílá přímo
databáze přes službu [Resend](https://resend.com) (zdarma do 100 e-mailů
denně), na webu se nic nemění.

Nastavení (jednou):

1. Zaregistrujte se na resend.com **adresou, na kterou chcete upozornění
   dostávat**. Dokud v Resend neověříte vlastní doménu, posílá jen na
   adresu, se kterou jste se registrovali.
2. V Resend → **API Keys** → *Create API Key* (stačí oprávnění
   *Sending access*). Klíč začíná `re_` a ukáže se jen jednou.
3. V Supabase SQL Editoru spusťte `supabase-guestbook-notify.sql`.
4. Tamtéž uložte klíč a adresu do trezoru (Vault). Do souborů v repozitáři
   je nepište, ty jsou veřejné:

   ```sql
   select vault.create_secret('re_VAS_KLIC', 'guestbook_resend_api_key');
   select vault.create_secret('vas@email.cz', 'guestbook_notify_to');
   ```

5. Napište zkušební vzkaz na webu. E-mail přijde do minuty, případně
   se podívejte do spamu.

Když e-mail nepřišel, odpověď od Resend je v databázi ještě 6 hodin:

```sql
select created, status_code, content from net._http_response
order by created desc limit 5;
```

Změna adresy:

```sql
select vault.update_secret(id, 'nova@adresa.cz')
from vault.secrets where name = 'guestbook_notify_to';
```

Upozornění na víc adres (třeba pro oba správce) zapíšete oddělené čárkou,
ale Resend to dovolí až s ověřenou doménou: v Resend → **Domains** přidejte
`auramichaell.cz`, DNS záznamy, které vypíše, vložte u správce domény a pak
nastavte i odesílatele:

```sql
select vault.create_secret('Kniha návštěv <web@auramichaell.cz>', 'guestbook_notify_from');
```

Vypnutí: `delete from vault.secrets where name = 'guestbook_resend_api_key';`

Pojistka proti spamu: když za poslední hodinu přijde víc než 10 vzkazů,
další se uloží bez e-mailu. Uvidíte je normálně v administraci.

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

## 🔀 Přepínání stránek bez znovunačtení

Veřejné stránky se mezi sebou přepínají plynule, podobně jako záložky
v administraci. Obsah každé stránky je zabalený v `<div id="spa-root" data-view="...">`;
`JS/router.js` zachytí kliknutí na interní odkaz, stáhne cílovou stránku,
vymění obsah tohoto obalu a přepíše adresu v prohlížeči.

Co zůstává beze změny:

- Každá stránka má dál vlastní adresu (`msginfo.html`, `ceremonie.html`, ...),
  vlastní `title` a meta popisky - sitemap i vyhledávače fungují stejně jako dřív.
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

**Provozovatel:** Michaela Svobodová  
**Email:** aura.michaell@seznam.cz  
**Telefon:** +420 727 836 338  
**Adresa:** Šmilovského 663/1, 792 01 Bruntál

## 📝 Licence

© 2026 Aura Michaell Massage. Všechna práva vyhrazena.

---

**Poslední aktualizace:** 03.10.2026
