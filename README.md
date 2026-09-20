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
├── style.css               # Hlavní CSS styly
├── JS/                     # JavaScript funkcionalita
│   ├── 3D_hover.js         # 3D efekty navigace a prvků
│   ├── admin.js             # Administrace: přihlášení, záložky, kniha návštěv
│   ├── admin-services.js    # Administrace: správa ceníku masáží
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

Přihlášení jménem a heslem přes Supabase Auth. Stránka má dvě záložky:
**Ceník** (přidání, úprava a mazání masáží včetně cen a obrázků) a
**Kniha návštěv** (schvalování a mazání vzkazů).

### První nastavení

1. V Supabase SQL Editoru spusťte `supabase-services.sql` a poté
   `supabase-services-seed.sql`.
2. Nastavte účtu správce heslo. Buď v Supabase → Authentication → Users,
   nebo se přihlaste odkazem „Reset password" z e-mailu a heslo si zadejte
   v administraci tlačítkem **Změnit heslo** v horní liště.
3. V Supabase → Authentication → Sign In / Providers **vypněte registraci
   nových uživatelů** („Allow new users to sign up"). Bez toho si může
   kdokoli s veřejným klíčem založit účet.
4. Tamtéž doporučujeme zapnout **Leaked password protection** a minimální
   délku hesla 12 znaků.
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

### Obrázky masáží

Obrázky se vybírají ze složky `galerie/masaze/`. Po přidání nového souboru
je potřeba obnovit jejich seznam:

```bash
python3 tools/generate_gallery_manifest.py
```

Kategorie ceníku (Klasické, Sportovní, …) a texty Indikace/Kontraindikace
se stále upravují ručně v `msginfo.html`; seznam kategorií je navíc
v `JS/supabase-config.js`.

## 🚀 Před nasazením

`.htaccess` nechává prohlížeč držet si CSS a JS až měsíc. Po změně těchto
souborů proto spusťte:

```bash
python3 tools/stamp_assets.py
```

Skript doplní ke každému odkazu na vlastní `.css` a `.js` značku `?v=<hash>`
spočítanou z obsahu souboru. Bez toho si návštěvníci i vy načtete novou HTML
stránku se starým skriptem — stránka pak vypadá nově, ale nefunguje.

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
