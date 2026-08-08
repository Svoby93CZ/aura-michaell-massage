# Tahák: použité části kódu v projektu

Tento soubor je přehled toho, co se v projektu opravdu používá.
Je rozdělený na HTML, CSS a JavaScript.

## 1) HTML elementy (tagy)

- `html` - kořen celého HTML dokumentu.
- `head` - metadata stránky (titulek, CSS, meta tagy).
- `title` - název stránky v záložce prohlížeče.
- `meta` - technické informace (kódování, viewport, SEO).
- `link` - připojení externích souborů (typicky CSS, ikony).
- `style` - vložené CSS přímo v HTML.
- `body` - viditelný obsah stránky.
- `header` - hlavička sekce nebo stránky.
- `nav` - navigace (menu, odkazy).
- `main` - hlavní obsah stránky.
- `section` - tematický blok obsahu.
- `article` - samostatný obsahový celek.
- `footer` - patička sekce nebo stránky.
- `div` - univerzální blokový kontejner.
- `span` - univerzální řádkový kontejner.
- `h1`, `h2`, `h3`, `h4` - nadpisy různých úrovní.
- `p` - odstavec textu.
- `a` - odkaz.
- `img` - obrázek.
- `iframe` - vložený externí obsah (např. mapa/video).
- `ul` - nečíslovaný seznam.
- `li` - položka seznamu.
- `button` - tlačítko pro akce.
- `strong` - zvýrazněný text (významově důležitý).
- `br` - zalomení řádku.
- `details` - rozbalovací blok.
- `summary` - viditelná hlavička pro `details`.
- `audio` - přehrávání zvuku.
- `source` - zdroj média (`audio`, `video`, `picture`).
- `noscript` - obsah pro případ vypnutého JavaScriptu.
- `script` - JavaScript kód.
- `svg` - vektorová grafika.
- `g` - skupina prvků uvnitř SVG.
- `path` - křivka/tvar v SVG.
- `circle` - kruh v SVG.

## 2) HTML atributy (co se v projektu používá)

- `class` - přiřazení CSS tříd.
- `id` - unikátní identifikátor prvku.
- `style` - inline CSS přímo na prvku.
- `lang` - jazyk dokumentu.
- `charset` - znaková sada dokumentu.
- `name`, `content`, `http-equiv`, `property` - metadata (`meta`) pro prohlížeče/SEO.
- `href` - adresa odkazu.
- `target` - kde se odkaz otevře (`_blank` apod.).
- `rel` - vztah odkazu (bezpečnost/SEO).
- `src` - zdroj obrázku/skriptu/média.
- `srcset`, `sizes` - responzivní obrázky.
- `alt` - alternativní text obrázku.
- `loading`, `decoding`, `fetchpriority` - optimalizace načítání obrázků.
- `width`, `height` - rozměry prvku.
- `type` - typ prvku (např. u tlačítka či scriptu).
- `media` - podmínky načítání stylu.
- `title` - doplňkový popisek.
- `role` - role prvku pro asistivní technologie.
- `allowfullscreen`, `referrerpolicy` - chování iframu a bezpečnost.
- `aria-label`, `aria-labelledby`, `aria-controls`, `aria-expanded`, `aria-hidden`, `aria-live`, `aria-pressed` - přístupnost pro čtečky.
- `data-*` (např. `data-category`, `data-tooltip`, `data-duration`) - vlastní data pro JS logiku.
- SVG atributy: `viewBox`, `xmlns`, `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `cx`, `cy`, `r`, `d`, `focusable`.

## 3) CSS vlastnosti (použité v projektu)

### Rozměry a box model

- `width`, `height` - šířka a výška prvku.
- `min-width`, `min-height` - minimální rozměr.
- `max-width`, `max-height` - maximální rozměr.
- `margin`, `margin-top`, `margin-right`, `margin-bottom`, `margin-left` - vnější odsazení.
- `padding`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`, `padding-inline` - vnitřní odsazení.
- `box-sizing` - jak se počítají rozměry prvku (`border-box`).
- `aspect-ratio` - poměr stran prvku.

### Pozicování a vrstvení

- `position` - způsob pozicování (`relative`, `absolute`, `fixed`).
- `top`, `right`, `bottom`, `left` - odsazení při pozicování.
- `inset` - zkrácený zápis pro top/right/bottom/left.
- `z-index` - pořadí vrstev.
- `display` - způsob vykreslení (`block`, `flex`, `grid`, ...).
- `order` - pořadí položek ve flexu.

### Flexbox a Grid

- `flex`, `flex-basis`, `flex-direction`, `flex-wrap`, `flex-shrink` - rozložení ve flexboxu.
- `align-items`, `align-content`, `align-self` - zarovnání ve vedlejší ose.
- `justify-content` - zarovnání v hlavní ose.
- `gap` - mezery mezi položkami.
- `grid-template-columns`, `grid-template-rows`, `grid-column` - rozložení v CSS Grid.

### Typografie a text

- `font-family`, `font-size`, `font-style`, `font-weight` - vzhled písma.
- `line-height` - výška řádku.
- `letter-spacing` - mezery mezi písmeny.
- `text-align` - zarovnání textu.
- `text-decoration` - dekorace textu.
- `text-shadow` - stín textu.
- `text-transform` - změna velikosti písmen.
- `text-overflow` - chování přetečeného textu.
- `white-space` - zalamování mezer a řádků.
- `word-break`, `word-wrap`, `overflow-wrap`, `hyphens` - dělení a lámání slov.
- `vertical-align` - svislé zarovnání inline prvků.
- `list-style` - styl odrážek/číslování seznamu.

### Barvy, pozadí, rámečky

- `color` - barva textu.
- `background`, `background-color`, `background-image` - pozadí prvku.
- `background-position`, `background-size`, `background-repeat`, `background-attachment` - chování pozadí.
- `background-blend-mode`, `background-clip`, `background-origin` - pokročilé efekty pozadí.
- `border`, `border-width`, `border-style`, `border-color` - rámeček.
- `border-top`, `border-right`, `border-bottom`, `border-left` - rámeček po stranách.
- `border-radius` - zaoblení rohů.
- `box-shadow` - stín prvku.
- `opacity` - průhlednost.

### Interakce a chování

- `cursor` - tvar kurzoru myši.
- `pointer-events` - zda prvek reaguje na kliknutí/hover.
- `user-select`, `-webkit-user-select`, `-moz-user-select`, `-ms-user-select` - možnost označovat text.
- `touch-action` - chování dotykových gest.
- `visibility` - viditelnost prvku.
- `overflow`, `overflow-x`, `overflow-y` - chování přetečení obsahu.
- `scroll-behavior` - plynulost scrollu.
- `scroll-padding-top` - offset při skoku na kotvu.
- `scroll-snap-type`, `scroll-snap-align` - přichytávání při scrollování.
- `scrollbar-width` - šířka scrollbarů.

### Animace, transformace, efekty

- `transition` - plynulé přechody stavů.
- `transform`, `transform-origin` - posun, rotace, škálování.
- `animation`, `animation-duration`, `animation-delay` - klíčové animace.
- `will-change` - hint pro výkon prohlížeče.
- `filter`, `backdrop-filter` - grafické filtry.
- `mix-blend-mode` - způsob prolínání vrstev.
- `backface-visibility` - viditelnost zadní strany při 3D transformacích.

### Masky a speciální grafika

- `mask-image`, `mask-composite` - maskování prvků.
- `-webkit-mask-image`, `-webkit-mask-composite` - webkit varianta masek.
- `clip` - ořez obsahu.
- `fill`, `stroke`, `stroke-width` - styly SVG tvarů.
- `content` - obsah pseudo-prvků (`::before`, `::after`).

### Výkon a rendering

- `content-visibility` - odložené vykreslení mimo viewport.
- `contain-intrinsic-size` - rezervace prostoru pro odložený obsah.
- `-webkit-font-smoothing`, `-moz-osx-font-smoothing` - vyhlazení písma.
- `-webkit-overflow-scrolling` - plynulejší scroll na iOS.
- `-webkit-text-stroke`, `-webkit-background-clip` - webkit textové efekty.

### CSS proměnné (custom properties) použité v projektu

- `--pad`, `--gap` - globální mezery/odsazení.
- `--accent`, `--accent-2`, `--gold`, `--cream`, `--dark`, `--border` - barevné a stylové tokeny.
- `--box-shadow-light`, `--box-shadow-medium`, `--box-shadow-heavy` - připravené stíny.
- `--transition-speed` - jednotná rychlost přechodů.
- `--nav-btn-height`, `--nav-btn-height-sm`, `--nav-btn-height-xs`, `--nav-title-width` - rozměry navigace.
- `--layer-ground`, `--layer-content`, `--layer-floating`, `--layer-nav`, `--layer-dropdown`, `--layer-overlay`, `--layer-scroll-button`, `--layer-modal` - vrstvy (`z-index`) jako systém.
- `--parallax-image`, `--parallax-overlay` - obrázek a overlay pro parallax sekce.
- `--electric-border-color`, `--electric-light-color`, `--gradient-color` - efektové barvy.
- `--svc2-accent`, `--svc2-accent-2`, `--svc2-border`, `--svc2-card`, `--svc2-deep`, `--svc2-ink`, `--svc2-muted`, `--svc2-shadow`, `--svc2-shell`, `--svc2-nav-safe-left`, `--svc2-nav-safe-right` - proměnné pro design sekce služeb (v2).

## 4) JavaScript konstrukce a API (použité v projektu)

- `const` - konstanta (nemění se reference).
- `class`, `constructor`, `new` - objektově orientovaný zápis tříd.
- `async` / `await` - asynchronní operace čitelněji než čisté Promise.
- `try` / `catch` - zachycení chyb.
- `document`, `window`, `Math` - globální browser objekty.
- `addEventListener` - reakce na události (`click`, `DOMContentLoaded`, ...).
- `querySelector`, `querySelectorAll`, `getElementById` - hledání prvků v DOM.
- `classList` - přidání/odebrání CSS tříd.
- `setAttribute`, `getAttribute` - práce s HTML atributy.
- `dataset` - práce s `data-*` atributy.
- `innerHTML`, `appendChild` - vkládání obsahu do DOM.
- `fetch` - načtení dat/souboru přes HTTP.
- `DOMParser` - převod textového HTML na DOM strukturu.
- `matchMedia` - zjištění media query v JS.
- `setTimeout`, `setInterval` - časování akcí.
- `requestAnimationFrame` - plynulé animace podle vykreslování prohlížeče.
- `IntersectionObserver` - sledování, jestli je prvek ve viewportu.
- `forEach`, `map`, `filter`, `sort` - běžné metody pro práci s poli.

## 5) Jak s tím pracovat při učení

- Když narazíš na neznámý HTML tag, podívej se nejdřív do sekce 1.
- Když nevíš, co dělá nějaký styl (`margin`, `padding`, `z-index`), otevři sekci 3.
- Když nevíš, co dělá JavaScript řádek, zkontroluj sekci 4.
- Tip: Nejrychlejší učení je vzít jeden prvek (např. `display: flex`) a hned ho změnit v kódu, ať vidíš rozdíl na stránce.

---

Pokud budeš chtít, můžu ti z toho udělat i verzi „pro začátečníka“ (kratší) a verzi „pro pokročilé“ (s příklady přímo z tvých souborů).
