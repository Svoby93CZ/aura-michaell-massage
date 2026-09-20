/**
 * Lightbox s přiblížením a taháním pro galerii ceremonií
 *
 * Dříve inline skript v ceremonie.html. Samostatný soubor je potřeba proto,
 * že router vkládá obsah stránky dynamicky - inicializace se musí dát
 * zopakovat při každém zobrazení pohledu.
 */
(() => {
  const register =
    window.AuraView?.register ??
    ((init) =>
      document.addEventListener('DOMContentLoaded', () =>
        init(new AbortController().signal)
      ));

  register((signal) => {
    const onDocument = (type, handler, options) =>
      document.addEventListener(type, handler, { ...(options || {}), signal });

    const modal = document.getElementById('lightbox-modal');
    if (!modal) {
      return;
    }

    const image = document.getElementById('lightbox-image');
    const caption = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const zoomInBtn = document.querySelector('.lightbox-zoom-in');
    const zoomOutBtn = document.querySelector('.lightbox-zoom-out');
    const zoomResetBtn = document.querySelector('.lightbox-zoom-reset');
    const zoomLevelDisplay = document.getElementById('zoom-level');
    const wrapper = document.querySelector('.lightbox-image-wrapper');
    const galleryImages = document.querySelectorAll('.ceremony-gallery-img');

    let currentImageIndex = 0;
    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    const MIN_ZOOM = 1;
    const MAX_ZOOM = 4;
    const ZOOM_STEP = 0.2;

    // Drag state
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartPanX = 0;
    let dragStartPanY = 0;

    const images = Array.from(galleryImages).map(img => ({
      src: img.src,
      alt: img.alt
    }));

    const updateTransform = () => {
      image.style.transform = `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`;
    };

    const updateZoomDisplay = () => {
      zoomLevelDisplay.textContent = Math.round(zoomLevel * 100) + '%';
    };

    const setZoom = (level) => {
      zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
      updateZoomDisplay();
      updateTransform();
    };

    const resetZoom = () => {
      zoomLevel = 1;
      panX = 0;
      panY = 0;
      updateZoomDisplay();
      updateTransform();
    };

    const openLightbox = (index) => {
      currentImageIndex = index;
      image.src = images[currentImageIndex].src;
      image.alt = images[currentImageIndex].alt;
      caption.textContent = images[currentImageIndex].alt;
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      resetZoom();
    };

    const closeLightbox = () => {
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      resetZoom();
    };

    const showPrevImage = () => {
      currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
      image.src = images[currentImageIndex].src;
      image.alt = images[currentImageIndex].alt;
      caption.textContent = images[currentImageIndex].alt;
      resetZoom();
    };

    const showNextImage = () => {
      currentImageIndex = (currentImageIndex + 1) % images.length;
      image.src = images[currentImageIndex].src;
      image.alt = images[currentImageIndex].alt;
      caption.textContent = images[currentImageIndex].alt;
      resetZoom();
    };

    // ===== EVENT LISTENERY =====
    // Otevření z karuselu řeší JS/ceremony-carousel.js přes toto rozhraní
    window.openCeremonyLightbox = (imgEl) => {
      const index = Array.from(galleryImages).indexOf(imgEl);
      if (index > -1) openLightbox(index);
    };

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrevImage);
    nextBtn.addEventListener('click', showNextImage);

    zoomInBtn.addEventListener('click', () => setZoom(zoomLevel + ZOOM_STEP));
    zoomOutBtn.addEventListener('click', () => setZoom(zoomLevel - ZOOM_STEP));
    zoomResetBtn.addEventListener('click', resetZoom);

    // ===== MOUSE WHEEL ZOOM =====
    wrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom(zoomLevel + delta);
    }, { passive: false });

    // ===== MOUSE DRAG/PAN =====
    image.addEventListener('mousedown', (e) => {
      if (zoomLevel > 1) {
        isDragging = true;
        image.style.cursor = 'grabbing';
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartPanX = panX;
        dragStartPanY = panY;
        e.preventDefault();
      }
    });

    onDocument('mousemove', (e) => {
      if (isDragging && zoomLevel > 1) {
        const deltaX = (dragStartX - e.clientX) / zoomLevel;
        const deltaY = (dragStartY - e.clientY) / zoomLevel;
        panX = dragStartPanX - deltaX;
        panY = dragStartPanY - deltaY;
        updateTransform();
      }
    });

    onDocument('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        image.style.cursor = 'grab';
      }
    });

    // ===== TOUCH DRAG/PAN =====
    let isTouchDragging = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartPanX = 0;
    let touchStartPanY = 0;

    image.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1 && zoomLevel > 1) {
        isTouchDragging = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartPanX = panX;
        touchStartPanY = panY;
      }
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      if (isTouchDragging && e.touches.length === 1 && zoomLevel > 1) {
        e.preventDefault();
        const deltaX = (touchStartX - e.touches[0].clientX) / zoomLevel;
        const deltaY = (touchStartY - e.touches[0].clientY) / zoomLevel;
        panX = touchStartPanX - deltaX;
        panY = touchStartPanY - deltaY;
        updateTransform();
      }
    }, { passive: false });

    onDocument('touchend', () => {
      isTouchDragging = false;
    });

    // ===== PINCH ZOOM (MOBIL) =====
    let lastDistance = 0;
    wrapper.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (lastDistance > 0) {
          const delta = distance - lastDistance;
          if (Math.abs(delta) > 5) {
            setZoom(zoomLevel + (delta > 0 ? ZOOM_STEP : -ZOOM_STEP));
          }
        }
        lastDistance = distance;
      }
    }, { passive: false });

    wrapper.addEventListener('touchend', () => {
      lastDistance = 0;
    });

    // ===== KEYBOARD SHORTCUTS =====
    modal.addEventListener('click', (e) => {
      if (e.target === modal.querySelector('.lightbox-overlay')) {
        closeLightbox();
      }
    });

    onDocument('keydown', (e) => {
      if (modal.getAttribute('aria-hidden') === 'false') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrevImage();
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom(zoomLevel + ZOOM_STEP);
        }
        if (e.key === '-') {
          e.preventDefault();
          setZoom(zoomLevel - ZOOM_STEP);
        }
        if (e.key === '0') {
          e.preventDefault();
          resetZoom();
        }
      }
    });

    // Při odchodu z pohledu uklidíme globální stav
    signal.addEventListener('abort', () => {
      delete window.openCeremonyLightbox;
      document.body.style.overflow = '';
    });
  });
})();
