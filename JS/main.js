document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const initThemeToggle = () => {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) {
      return;
    }

    const root = document.documentElement;

    const applyTheme = (theme) => {
      if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    };

    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    toggle.addEventListener('click', () => {
      const nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        localStorage.setItem('theme', nextTheme);
      } catch (e) {}
    });
  };

  initThemeToggle();

  const initVisitCounter = () => {
    const counter = document.querySelector('.site-footer__counter');
    if (!counter) {
      return;
    }

    const label = counter.querySelector('strong');
    const hasValue = [...counter.childNodes].some((node) => {
      if (node === label) {
        return false;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        return node.tagName !== 'SCRIPT';
      }
      return node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0;
    });

    if (hasValue) {
      counter.hidden = false;
    }
  };

  initVisitCounter();

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

  // ===== Primární navigace =====
  const nav = document.querySelector('.primary-nav');
  const menu = nav ? nav.querySelector('.primary-nav__menu') : null;
  const toggle = nav ? nav.querySelector('.primary-nav__toggle') : null;
  const currentPath = window.location.pathname.replace(/\\/g, '/');

  if (menu) {
    menu.querySelectorAll('.primary-nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) {
        return;
      }

      const linkPath = new URL(href, window.location.href).pathname.replace(/\\/g, '/');
      if (linkPath === currentPath) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  if (nav && menu && toggle) {
    const closeMenu = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
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
        if (window.matchMedia('(max-width: 900px)').matches) {
          closeMenu();
        }
      });
    });

    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 901px)').matches) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
      }
    });

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('is-open') && !nav.contains(event.target)) {
        closeMenu();
      }
    });
  }

  if (nav) {
    const updateNavScrolled = () => {
      nav.classList.toggle('primary-nav--scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', updateNavScrolled, { passive: true });
    updateNavScrolled();
  }

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
    detail.addEventListener('toggle', event => {
      event.stopPropagation();
    });
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
