// Točivý karusel fotografií - prostřední snímek je "hlavní", šipky/tažení/klik posouvají řadu
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.ceremony-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.ceremony-carousel__track');
  const slides = Array.from(track.querySelectorAll('.ceremony-carousel__slide'));
  const prevBtn = carousel.querySelector('.ceremony-carousel__nav--prev');
  const nextBtn = carousel.querySelector('.ceremony-carousel__nav--next');
  const total = slides.length;
  if (!total) return;

  const OFFSET_STEP = 68; // % posun na snímek od středu
  const MAX_VISIBLE = 3;  // kolik snímků na každou stranu zůstává viditelných
  let activeIndex = Math.floor(total / 2);
  let suppressClick = false;

  const render = () => {
    slides.forEach((slide, i) => {
      let offset = i - activeIndex;
      // najde nejkratší cestu v kruhu (např. z posledního na první snímek)
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
      const abs = Math.abs(offset);
      const scale = Math.max(1 - abs * 0.22, 0.4);
      const opacity = abs > MAX_VISIBLE ? 0 : Math.max(1 - abs * 0.32, 0);
      slide.style.transform = `translateX(calc(-50% + ${offset * OFFSET_STEP}%)) scale(${scale})`;
      slide.style.zIndex = String(total - abs);
      slide.style.opacity = String(opacity);
      slide.style.pointerEvents = abs > MAX_VISIBLE ? 'none' : 'auto';
      slide.classList.toggle('is-active', offset === 0);
    });
  };

  const goTo = (index) => {
    activeIndex = ((index % total) + total) % total;
    render();
  };

  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (i === activeIndex) {
        const img = slide.querySelector('img');
        if (img && typeof window.openCeremonyLightbox === 'function') {
          window.openCeremonyLightbox(img);
        }
      } else {
        goTo(i);
      }
    });
  });

  prevBtn?.addEventListener('click', () => goTo(activeIndex - 1));
  nextBtn?.addEventListener('click', () => goTo(activeIndex + 1));

  // ===== TAŽENÍ MYŠÍ / PRSTEM PRO OTOČENÍ KARUSELU =====
  const DRAG_THRESHOLD = 40;
  let isDragging = false;
  let dragStartX = 0;

  const dragStart = (x) => {
    isDragging = true;
    dragStartX = x;
  };

  const dragEnd = (x) => {
    if (!isDragging) return;
    isDragging = false;
    const diff = x - dragStartX;
    if (Math.abs(diff) > DRAG_THRESHOLD) {
      suppressClick = true;
      goTo(activeIndex + (diff < 0 ? 1 : -1));
    }
  };

  track.addEventListener('touchstart', (e) => dragStart(e.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', (e) => dragEnd(e.changedTouches[0].clientX));

  track.addEventListener('mousedown', (e) => {
    dragStart(e.clientX);
    e.preventDefault();
  });
  window.addEventListener('mouseup', (e) => {
    if (isDragging) dragEnd(e.clientX);
  });

  // ===== ŠIPKY NA KLÁVESNICI =====
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
    if (e.key === 'ArrowRight') goTo(activeIndex + 1);
  });

  render();
});
