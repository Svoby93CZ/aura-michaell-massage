# Newsletter: Zimní poukazy + Vánoční soutěž (Brevo)

| Soubor | K čemu je |
|---|---|
| `newsletter-zima-2026.html` | šablona e-mailu, vkládá se do Brevo |
| `obrazky/logo.png` | logo do hlavičky (84 px, ve 2× rozlišení) |
| `obrazky/zimni-poukaz.jpg` | zimní dárkový poukaz (520 px, ve 2× rozlišení) |
| `obrazky/soutez-zahlavi.jpg` | záhlaví soutěže, výřez z plakátu (600 px, ve 2× rozlišení) |

Složku `newsletter/` není potřeba nahrávat na hosting webu.

## Postup v Brevo

1. **Nahraj obrázky.** Tři soubory ze složky `obrazky/` nahraj do Brevo
   (knihovna obrázků) a u každého zkopíruj jeho odkaz (URL).
2. **Vlož odkazy na obrázky.** V HTML najdi `obrazky/logo.png`,
   `obrazky/zimni-poukaz.jpg` a `obrazky/soutez-zahlavi.jpg` a nahraď je
   zkopírovanými odkazy z Brevo. Každý je v souboru jen jednou.
3. **Odkaz na soutěž.** Tlačítko „Zapojit se do soutěže“ teď vede na profil
   na Instagramu. Na Instagramu otevři soutěžní příspěvek → ⋯ → Kopírovat
   odkaz a vlož ho místo odkazu na profil (v HTML u značky 🔗 ODKAZ NA
   SOUTĚŽNÍ PŘÍSPĚVEK).
4. **Vlož šablonu.** Templates → nová šablona → Add content → Code your own
   (vlastní HTML) → vlož celý obsah souboru `newsletter-zima-2026.html`.
5. **Předmět a náhledový text** vyplň v nastavení šablony, například:
   - Subject line: `Chvilka klidu pod stromeček ❄️`
   - Preview text: `Darujte klid a vyhrajte masáž`
6. **Otestuj.** Preview & test → pošli si zkušební e-mail na Seznam i Gmail
   a zkontroluj ho na počítači i v telefonu.

## Úpravy

Návod je i v komentáři na začátku HTML souboru. Stručně:

- ✏️ označuje texty, 🖼️ obrázky, 🔗 odkazy.
- Každá sekce je ohraničená řádky `▼ ZAČÁTEK SEKCE …` a `▲ KONEC SEKCE …`.
  Co je mezi nimi, lze smazat nebo zkopírovat jako celek.
- Barvy se mění přes Najít a nahradit, jejich seznam je v komentáři.
- Odkazy `{{ mirror }}` (verze v prohlížeči) a `{{ unsubscribe }}`
  (odhlášení) doplňuje Brevo, nemaž je.

Obrázky vznikly z podkladů pro soutěž a poukaz. Při další akci stačí vyměnit
obrázky a texty, struktura šablony zůstává.
