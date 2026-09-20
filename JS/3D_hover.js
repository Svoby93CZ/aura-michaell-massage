/**
 * 3D efekty pro náhledy galerie
 *
 * Inicializace běží při prvním načtení i po každém přepnutí pohledu routerem.
 */
const init3DHover = (signal) => {
  // Grafiky s mýty o sportovní masáži jsou zde záměrně vynechané -
  // nesou text, který se má v klidu číst, proto zůstávají statické.
  const shopThumbnails = document.querySelectorAll(
    '.page-shop .shop-gallery img, .page-home .welcome-gallery img'
  );
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (shopThumbnails.length && supportsHover && !prefersReducedMotion) {
    shopThumbnails.forEach((thumbnail) => {
      const thumbnailScale = thumbnail.matches('.page-home .welcome-gallery img') ? 1.05 : 1.1;

      thumbnail.addEventListener('pointerenter', () => {
        thumbnail.classList.add('is-3d-active');
        const hoverTilt = Math.random() < 0.5 ? -2 : 2;
        thumbnail.style.setProperty('--hover-tilt', `${hoverTilt}deg`);
        thumbnail.style.zIndex = '5';
        thumbnail.style.transition = 'transform 0.22s ease-out, border-color 0.25s ease';
        thumbnail.style.transform = `perspective(700px) rotateX(-4deg) rotateY(4deg) rotateZ(var(--hover-tilt)) translateZ(34px) translateY(-10px) scale(${thumbnailScale})`;
      });

      thumbnail.addEventListener('pointermove', (event) => {
        const bounds = thumbnail.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        const rotateY = x * 14;
        const rotateX = y * -14;

        thumbnail.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(var(--hover-tilt, 0deg)) translateZ(34px) translateY(-10px) scale(${thumbnailScale})`;
      });

      thumbnail.addEventListener('pointerleave', () => {
        thumbnail.style.transition = 'transform 0.35s ease, border-color 0.25s ease';
        thumbnail.style.transform = '';
        thumbnail.style.zIndex = '';
        thumbnail.style.removeProperty('--hover-tilt');
        thumbnail.classList.remove('is-3d-active');
      });
    });
  }
};

(() => {
  const register =
    window.AuraView?.register ??
    ((init) =>
      document.addEventListener('DOMContentLoaded', () =>
        init(new AbortController().signal)
      ));

  register(init3DHover);
})();
