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
├── masaze/                 # Obrázky masáží
├── Poukazy/                # Dárkové poukazy
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
- Statický web bez front-end závislostí

## 🛠️ Údržba

Aktualizace ceníků probíhají v souboru [msginfo.html](msginfo.html) ve dvou variantách:
1. desktop zobrazení.
2. mobilní karty.

Nové obrázky přidávejte podle účelu do složek [galerie/](galerie/), [masaze/](masaze/) nebo [Poukazy/](Poukazy/).

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
