# 🌟 Aura Michaell Massage - Website

Profesionální webová stránka pro masážní salon v Bruntále.

## 📁 Struktura projektu

```
.
├── index.html              # Hlavní stránka
├── about.html              # O salonu
├── ceremonie.html          # Ceremoniální a rituální služby
├── obchod.html             # Obchod / doplňkové nabídky
├── msginfo.html            # Přehled služeb a ceníky
├── privacy-policy.html     # Ochrana osobních údajů (GDPR)
├── style.css               # Hlavní CSS styly
├── main.js                 # JavaScript funkcionalita
├── card-3d.js              # 3D karta / vizuální efekty
├── galerie/                # Obrázky pro galerii
│   ├── masaze/             # Obrázky masáží
│   ├── ceremonie/          # Obrázky ceremonií
│   └── Poukazy/            # Dárkové poukazy
└── tools/                  # Nástroje pro údržbu kódu
    ├── _audit-unused-css.ps1
    └── inline_section_comments.py
```

## 🚀 Co web umí

- Responzivní prezentaci salonu na desktopu i mobilu
- Hero sekci, navigaci, kontakty a základní informační stránky
- Přehled služeb a ceníků v desktop i mobilním zobrazení
- Galerie a vizuální doplňky včetně 3D efektů
- Stránku zásad ochrany osobních údajů
- Moderovanou Knihu návštěv napojenou na Supabase
- Statický web bez front-end závislostí

## 🛠️ Údržba

Aktualizace ceníků probíhají v souboru [msginfo.html](msginfo.html) ve dvou variantách:
1. desktop zobrazení.
2. mobilní karty.

Nové obrázky přidávejte podle účelu do složek [galerie/](galerie/), [galerie/masaze/](galerie/masaze/) nebo [galerie/Poukazy/](galerie/Poukazy/).

### Nastavení Knihy návštěv

1. V Supabase vytvořte projekt a spusťte celý soubor [supabase-guestbook.sql](supabase-guestbook.sql) v SQL Editoru.
2. Do [supabase-config.js](supabase-config.js) vložte URL projektu a veřejný `anon` klíč.
3. V Supabase Authentication povolte e-mailové přihlášení a nastavte Redirect URL na `https://auramichaell.cz/admin.html`.
4. Otevřete [admin.html](admin.html), požádejte o přihlašovací odkaz a přihlaste se e-mailem správce.
5. V Supabase SQL Editoru přiřaďte přihlášený účet jako správce. ID uživatele najdete v Authentication > Users:

```sql
insert into public.guestbook_admins (user_id)
values ('ID_UZIVATELE_Z_AUTH_USERS');
```

Nové vzkazy jsou nejprve skryté. Zobrazí se až po schválení v administraci; záznamy lze také trvale smazat.

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

**Poslední aktualizace:** 14. srpna 2026
