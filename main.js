document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

      paths.forEach((path, index) => {
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

  // ===== Primární navigace =====
  const nav = document.querySelector('.primary-nav');
  const body = document.body;
  const menu = nav ? nav.querySelector('.primary-nav__menu') : null;
  const toggle = nav ? nav.querySelector('.primary-nav__toggle') : null;
  const brand = nav ? nav.querySelector('.primary-nav__brand') : null;
  const titleLink = nav ? nav.querySelector('.primary-nav__title-link') : null;
  const dropdowns = nav ? Array.from(nav.querySelectorAll('.primary-nav__dropdown')) : [];
  let heroOutOfView = false;

  const closeAllDropdowns = (exception = null) => {
    dropdowns.forEach(dropdown => {
      if (dropdown === exception) {
        return;
      }
      dropdown.classList.remove('primary-nav__dropdown--open');
      const button = dropdown.querySelector('.primary-nav__dropdown-toggle');
      const panel = dropdown.querySelector('.primary-nav__dropdown-panel');
      if (button) {
        button.setAttribute('aria-expanded', 'false');
      }
      if (panel) {
        panel.setAttribute('aria-hidden', 'true');
      }
    });
  };

  let closeMenu = () => {};
  let openMenu = () => {};
  let syncForViewport = () => {};

  const triggerTitleTyping = () => {
    if (!titleLink) {
      return;
    }
    titleLink.classList.remove('is-typing');
    // Force reflow to restart animation
    void titleLink.offsetWidth;
    titleLink.classList.add('is-typing');
  };

  const evaluateTitleState = () => {
    if (!nav) {
      return;
    }
    const previouslyVisible = nav.classList.contains('primary-nav--show-title');
    const shouldShow = heroOutOfView && nav.classList.contains('primary-nav--condensed') && !nav.classList.contains('is-open');
    nav.classList.toggle('primary-nav--show-title', shouldShow);

    if (titleLink) {
      titleLink.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      titleLink.tabIndex = shouldShow ? 0 : -1;
      if (!shouldShow) {
        titleLink.classList.remove('is-typing');
      } else if (!previouslyVisible) {
        triggerTitleTyping();
      }
    }
  };

  const updateNavCondensed = () => {
    if (!nav) {
      return;
    }
    const isDesktop = window.matchMedia('(min-width: 1101px)').matches;
    if (isDesktop) {
      nav.classList.remove('primary-nav--condensed');
      nav.classList.remove('primary-nav--show-title');
      if (brand) {
        brand.setAttribute('aria-hidden', 'false');
        brand.tabIndex = 0;
      }
      evaluateTitleState();
      return;
    }
    const threshold = 80;
    const shouldCondense = window.scrollY > threshold && !nav.classList.contains('is-open');
    nav.classList.toggle('primary-nav--condensed', shouldCondense);
    if (brand) {
      brand.setAttribute('aria-hidden', shouldCondense ? 'true' : 'false');
      brand.tabIndex = shouldCondense ? -1 : 0;
    }
    evaluateTitleState();
  };

  if (nav && titleLink) {
    const hero = document.querySelector('.hero-title');
    if (hero && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const wasOutOfView = heroOutOfView;
          heroOutOfView = entry.intersectionRatio < 0.2;
          if (heroOutOfView !== wasOutOfView) {
            evaluateTitleState();
          }
        });
      }, {
        threshold: [0, 0.2, 0.5, 1],
        rootMargin: '-40px 0px 0px 0px'
      });
      observer.observe(hero);
    } else {
      heroOutOfView = true;
      evaluateTitleState();
    }
  }

  if (nav && menu && toggle) {
    closeMenu = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      menu.scrollTop = 0;
      body.classList.remove('nav-open');
      closeAllDropdowns();
      updateNavCondensed();
    };

    openMenu = () => {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      menu.scrollTop = 0;
      body.classList.add('nav-open');
      nav.classList.remove('primary-nav--condensed');
      if (brand) {
        brand.setAttribute('aria-hidden', 'false');
        brand.tabIndex = 0;
      }
      evaluateTitleState();
    };

    syncForViewport = () => {
      const isDesktop = window.matchMedia('(min-width: 921px)').matches;
      if (isDesktop) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'false');
        menu.scrollTop = 0;
        body.classList.remove('nav-open');
        closeAllDropdowns();
      } else {
        if (!nav.classList.contains('is-open')) {
          menu.setAttribute('aria-hidden', 'true');
        }
        closeAllDropdowns();
      }
      updateNavCondensed();
    };

    toggle.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    nav.querySelectorAll('.primary-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 920px)').matches) {
          closeMenu();
        }
      });
    });

    window.addEventListener('resize', syncForViewport);
    syncForViewport();

    window.addEventListener('scroll', updateNavCondensed, { passive: true });
    updateNavCondensed();

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (nav.classList.contains('is-open')) {
          closeMenu();
        } else {
          closeAllDropdowns();
        }
      }
    });

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('is-open') && !nav.contains(event.target)) {
        closeMenu();
      }
    });
  }

  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.primary-nav__dropdown-toggle');
    const panel = dropdown.querySelector('.primary-nav__dropdown-panel');

    if (!button || !panel) {
      return;
    }

    panel.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const willOpen = !dropdown.classList.contains('primary-nav__dropdown--open');
      if (willOpen) {
        closeAllDropdowns(dropdown);
      } else {
        closeAllDropdowns();
      }

      dropdown.classList.toggle('primary-nav__dropdown--open', willOpen);
      button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      panel.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
    });

    panel.querySelectorAll('a').forEach(item => {
      item.addEventListener('click', () => {
        closeAllDropdowns();
        if (nav && nav.classList.contains('is-open')) {
          closeMenu();
        }
      });
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.primary-nav__dropdown')) {
      closeAllDropdowns();
    }
  });

  if (!menu || !toggle) {
    window.addEventListener('scroll', updateNavCondensed, { passive: true });
    updateNavCondensed();
  }

  evaluateTitleState();

  // Jemné animace při vstupu do viewportu
  const revealElements = document.querySelectorAll('.reveal-on-scroll');

  if (revealElements.length > 0) {
    if ('IntersectionObserver' in window && !prefersReducedMotion) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -8% 0px'
      });

      revealElements.forEach(element => revealObserver.observe(element));
    } else {
      revealElements.forEach(element => element.classList.add('is-visible'));
    }
  }

  // Lazy loading pro obrázky
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => imageObserver.observe(img));
  }

  // Scroll to top button
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    const updateScrollBtn = () => {
      scrollBtn.classList.toggle('show', window.scrollY > 300);
    };

    window.addEventListener('scroll', updateScrollBtn);
    updateScrollBtn();

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Zabraňte vnitřním detailům (indikace/kontraindikace) v zavírání rodičovské sekce
  const innerDetails = document.querySelectorAll('.service-accordion .indikace-toggle, .service-accordion .kontraindikace-toggle');

  innerDetails.forEach((detail) => {
    // Blokuj toggle event
    detail.addEventListener('toggle', event => {
      event.stopPropagation();
    });
    // Blokuj click event na summary
    const summary = detail.querySelector('summary');
    if (summary) {
      summary.addEventListener('click', event => {
        event.stopPropagation();
      });
    }
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const prevBtn = lightbox ? lightbox.querySelector('.modal-nav--prev') : null;
  const nextBtn = lightbox ? lightbox.querySelector('.modal-nav--next') : null;
  const closeBtn = lightbox ? lightbox.querySelector('.modal-close') : null;

  if (lightbox && lightboxImg) {
    const triggers = Array.from(document.querySelectorAll('[data-lightbox], .cards img'));
    if (!triggers.length) {
      return;
    }

    const groups = new Map();
    let currentGroupKey = null;
    let currentIndex = 0;
    let touchStartX = 0;
    let touchStartY = 0;

    const updateNavVisibility = () => {
      if (!prevBtn || !nextBtn) {
        return;
      }
      const items = currentGroupKey ? groups.get(currentGroupKey) : null;
      if (!items || items.length < 2) {
        prevBtn.classList.add('is-hidden');
        nextBtn.classList.add('is-hidden');
      } else {
        prevBtn.classList.remove('is-hidden');
        nextBtn.classList.remove('is-hidden');
      }
    };

    const renderCurrentItem = () => {
      if (!currentGroupKey) {
        return;
      }
      const items = groups.get(currentGroupKey);
      if (!items || !items.length) {
        return;
      }
      const item = items[currentIndex];
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
    };

    const closeLightbox = () => {
      lightbox.classList.remove('show');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImg.removeAttribute('src');
      lightboxImg.removeAttribute('alt');
      document.body.style.overflow = '';
      currentGroupKey = null;
      currentIndex = 0;
      updateNavVisibility();
    };

    const openLightbox = (groupKey, index) => {
      const items = groups.get(groupKey);
      if (!items || !items.length) {
        return;
      }
      currentGroupKey = groupKey;
      currentIndex = index;
      renderCurrentItem();
      updateNavVisibility();
      lightbox.classList.add('show');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const showNext = () => {
      if (!currentGroupKey) {
        return;
      }
      const items = groups.get(currentGroupKey);
      if (!items || items.length < 2) {
        return;
      }
      currentIndex = (currentIndex + 1) % items.length;
      renderCurrentItem();
    };

    const showPrev = () => {
      if (!currentGroupKey) {
        return;
      }
      const items = groups.get(currentGroupKey);
      if (!items || items.length < 2) {
        return;
      }
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      renderCurrentItem();
    };

    triggers.forEach((trigger, idx) => {
      const groupKey = trigger.dataset.lightbox || `__single_${idx}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      const collection = groups.get(groupKey);
      const itemIndex = collection.length;
      collection.push({
        src: trigger.dataset.full || trigger.src,
        alt: trigger.getAttribute('alt') || '',
      });

      trigger.addEventListener('click', () => openLightbox(groupKey, itemIndex));
      trigger.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(groupKey, itemIndex);
        }
      });
      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
      trigger.classList.add('lightbox-trigger');
    });

    if (prevBtn) {
      prevBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        showPrev();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        showNext();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        closeLightbox();
      });
    }

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    lightbox.addEventListener('touchstart', (event) => {
      const touch = event.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });

    lightbox.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const isHorizontalSwipe = Math.abs(deltaX) > 44 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

      if (!isHorizontalSwipe) {
        return;
      }

      if (deltaX < 0) {
        showNext();
      } else {
        showPrev();
      }
    }, { passive: true });

    document.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('show')) {
        return;
      }
      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowRight') {
        showNext();
      } else if (event.key === 'ArrowLeft') {
        showPrev();
      }
    });
  }
});
/* --- Corner decor parallax: jemný pohyb blobů podle pozice myši --- */
(function(){
  const container = document.querySelector('.corner-decor');
  if (!container) return;
  const blobs = Array.from(container.querySelectorAll('.c'));
  if (!blobs.length) return;

  let w = window.innerWidth, h = window.innerHeight;
  let mouseX = w/2, mouseY = h/2;
  let rafId = null;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onMove(e){
    mouseX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || mouseX;
    mouseY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || mouseY;
    if (!rafId) rafId = requestAnimationFrame(update);
  }

  function update(){
    rafId = null;
    const cx = (mouseX - w/2) / w;
    const cy = (mouseY - h/2) / h;
    blobs.forEach((b, i) => {
      const depth = (i % 2 === 0 ? -1 : 1) * (12 + i * 4);
      const tx = Math.round(cx * depth * 20);
      const ty = Math.round(cy * depth * 12);
      b.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
  }

  if (!reduced) {
    window.addEventListener('mousemove', onMove, {passive:true});
    window.addEventListener('touchmove', onMove, {passive:true});
  }
  window.addEventListener('resize', () => { w = window.innerWidth; h = window.innerHeight; });
})();
