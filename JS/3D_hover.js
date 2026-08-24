document.addEventListener('DOMContentLoaded', () => {
  const shopThumbnails = document.querySelectorAll(
    '.page-shop .shop-gallery img, .page-home .welcome-gallery img, .page-home .home-myths-gallery__grid img'
  );
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (shopThumbnails.length && supportsHover && !prefersReducedMotion) {
    shopThumbnails.forEach((thumbnail) => {
      const thumbnailScale = thumbnail.matches('.page-home .welcome-gallery img, .page-home .home-myths-gallery__grid img') ? 1.05 : 1.1;

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
});

// ===== 3D EFEKT PRO LOGO V HLAVNÍ SEKCI =====
const logoBubble = document.querySelector('.logo-bubble');
if (logoBubble) {
  // Vypneme původní pulzování, aby se nebilo s 3D natočením
  logoBubble.style.animation = 'none';
  // Povolíme 3D prostor uvnitř bubliny
  logoBubble.style.transformStyle = 'preserve-3d';

  const logoImg = logoBubble.querySelector('img');
  if (logoImg) {
    // Kouzlo: Vysuneme samotné logo směrem k uživateli (nad podklad)
    logoImg.style.transform = 'translateZ(40px)';
    // Přidáme stín pod vznášející se logo, což umocní hloubku
    logoImg.style.filter = 'drop-shadow(0 15px 15px rgba(0,0,0,0.5))';
  }

  document.addEventListener('mousemove', (e) => {
    // Výpočet pozice myši vůči středu obrazovky (viewportu)
    const xAxis = (window.innerWidth / 2 - e.clientX) / 25; // Čím menší dělitel, tím silnější náklon
    const yAxis = (window.innerHeight / 2 - e.clientY) / 25;

    // Rychlý a plynulý přechod při sledování myši
    logoBubble.style.transition = 'transform 0.1s ease-out';
    // Samotný 3D náklon a jemné zvětšení
    logoBubble.style.transform = `perspective(1000px) rotateY(${-xAxis}deg) rotateX(${yAxis}deg) scale3d(1.05, 1.05, 1.05)`;
  });

  // Plynulé vrácení do původní polohy, když uživatel opustí okno webu
  document.addEventListener('mouseleave', () => {
    logoBubble.style.transition = 'transform 0.5s ease-out';
    logoBubble.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)';
  });
}
