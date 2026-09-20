// Kreslící animace loga - čáry se postupně vykreslí, chvíli vydrží a zase zmizí.
//
// Zdrojem je SVG uvnitř logo-animace-ukazka.html; načítá se za běhu, aby
// nemuselo být vložené v každé stránce zvlášť. Animace se nastartuje nad
// každým prvkem .hero-logo-draw, takže ji stačí do stránky vložit a načíst
// tenhle soubor - používá ji veřejný web i přihlašovací stránka administrace.

document.addEventListener('DOMContentLoaded', () => {
  const initHeroLogoDraw = async () => {
    const logoHost = document.querySelector('.hero-logo-draw');
    if (!logoHost) {
      return;
    }

    try {
      const response = await fetch('logo-animace-ukazka.html');
      if (!response.ok) {
        return;
      }

      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      const sourceSvg = parsed.querySelector('svg');
      if (!sourceSvg) {
        return;
      }

      const svg = sourceSvg.cloneNode(true);
      svg.classList.add('hero-logo-draw__svg');
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      logoHost.innerHTML = '';
      logoHost.appendChild(svg);

      const paths = svg.querySelectorAll('path');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const drawDurationMs = 1600;
      const eraseDurationMs = 1200;
      const startDelayMs = 80;
      const staggerMs = 12;
      const holdDrawnMs = 4000;
      const holdErasedMs = 260;

      paths.forEach((path) => {
        const length = path.getTotalLength();
        path.style.transition = 'none';
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = reduceMotion ? '0' : `${length}`;

        if (reduceMotion) {
          return;
        }

        path.dataset.pathLength = `${length}`;
      });

      if (!reduceMotion) {
        const runLoop = () => {
          paths.forEach((path, index) => {
            const length = Number(path.dataset.pathLength || 0);
            const drawDelay = startDelayMs + index * staggerMs;
            const eraseDelay = drawDelay + drawDurationMs + holdDrawnMs;

            path.style.transition = 'none';
            path.style.strokeDashoffset = `${length}`;

            setTimeout(() => {
              path.style.transition = `stroke-dashoffset ${drawDurationMs}ms ease`;
              path.style.strokeDashoffset = '0';
            }, drawDelay);

            setTimeout(() => {
              path.style.transition = `stroke-dashoffset ${eraseDurationMs}ms ease-in`;
              path.style.strokeDashoffset = `${length}`;
            }, eraseDelay);
          });
        };

        const lastPathIndex = Math.max(paths.length - 1, 0);
        const cycleDurationMs =
          startDelayMs +
          lastPathIndex * staggerMs +
          drawDurationMs +
          holdDrawnMs +
          eraseDurationMs +
          holdErasedMs;

        runLoop();
        window.setInterval(runLoop, cycleDurationMs);
      }
    } catch (error) {
      console.error('Hero logo animation failed:', error);
    }
  };
  initHeroLogoDraw();
});
