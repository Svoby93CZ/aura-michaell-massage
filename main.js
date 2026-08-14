console.log('[DEBUG] main.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('[DEBUG] DOMContentLoaded fired');

  const shopThumbnails = document.querySelectorAll('.page-shop .shop-gallery img');
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (shopThumbnails.length && supportsHover && !prefersReducedMotion) {
    shopThumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener('pointerenter', () => {
        thumbnail.classList.add('is-3d-active');
        const hoverTilt = Math.random() < 0.5 ? -2 : 2;
        thumbnail.style.setProperty('--hover-tilt', `${hoverTilt}deg`);
        thumbnail.style.zIndex = '5';
        thumbnail.style.transition = 'transform 0.22s ease-out, border-color 0.25s ease';
        thumbnail.style.transform = 'perspective(700px) rotateX(-4deg) rotateY(4deg) rotateZ(var(--hover-tilt)) translateZ(34px) translateY(-10px) scale(1.1)';
      });

      thumbnail.addEventListener('pointermove', (event) => {
        const bounds = thumbnail.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        const rotateY = x * 14;
        const rotateX = y * -14;

        thumbnail.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(var(--hover-tilt, 0deg)) translateZ(34px) translateY(-10px) scale(1.1)`;
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
      console.error('[DEBUG] Hero logo animation failed:', error);
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

  // Interaktivni filtrace katalogu sluzeb na msginfo.html (v2 layout)
  const serviceCatalog = document.querySelector('[data-service-catalog]');
  if (serviceCatalog) {
    // Odkazy na ovladaci prvky filtru
    const searchInput = document.getElementById('serviceSearch');
    const durationSelect = document.getElementById('serviceDuration');
    const sortSelect = document.getElementById('serviceSort');
    const resetButton = document.getElementById('serviceReset');
    const resultCount = document.getElementById('serviceResultsCount');
    const emptyState = document.getElementById('serviceEmptyState');
    const cards = Array.from(serviceCatalog.querySelectorAll('.svc2-card'));
    const groups = Array.from(serviceCatalog.querySelectorAll('.svc2-group'));
    const chips = Array.from(serviceCatalog.querySelectorAll('[data-category-filter]'));

    let activeCategory = 'all';

    // Predzpracovani dat karet pro razeni a vykon filtrovani
    cards.forEach((card, index) => {
      card.dataset.originalIndex = String(index);
      const duration = Number(card.dataset.duration || 0);
      card.dataset.durationValue = String(duration);

      const priceText = card.querySelector('.svc2-meta span:last-child')?.textContent || '';
      const price = Number(priceText.replace(/[^\d]/g, '')) || 0;
      card.dataset.priceValue = String(price);
    });

    const matchesDuration = (duration, filter) => {
      if (filter === 'all') {
        return true;
      }
      if (filter === 'short') {
        return duration <= 40;
      }
      if (filter === 'medium') {
        return duration > 40 && duration <= 70;
      }
      if (filter === 'long') {
        return duration > 70;
      }
      return true;
    };

    const updateFilters = () => {
      // Aktualni hodnoty ovladacich prvku
      const searchValue = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const durationValue = durationSelect ? durationSelect.value : 'all';
      const sortValue = sortSelect ? sortSelect.value : 'recommended';
      let visibleCards = 0;

      // Filtrovani jednotlivych karet
      cards.forEach((card) => {
        const cardName = (card.dataset.name || '').toLowerCase();
        const cardCategory = (card.dataset.category || '').trim().toLowerCase();
        const cardDuration = Number(card.dataset.duration || 0);

        const textMatch = !searchValue || cardName.includes(searchValue);
        const categoryMatch = activeCategory === 'all' || cardCategory === activeCategory;
        const durationMatch = matchesDuration(cardDuration, durationValue);
        const shouldShow = textMatch && categoryMatch && durationMatch;

        card.hidden = !shouldShow;
        if (shouldShow) {
          visibleCards += 1;
        }
      });

      // Razeni + zobrazeni po skupinach (sekcich)
      groups.forEach((group) => {
        const groupCards = Array.from(group.querySelectorAll('.svc2-card'));
        const visibleGroupCards = groupCards.filter((card) => !card.hidden);

        // Dynamicke serazeni viditelnych karet podle volby uzivatele
        const compareCards = (left, right) => {
          const leftPrice = Number(left.dataset.priceValue || 0);
          const rightPrice = Number(right.dataset.priceValue || 0);
          const leftDuration = Number(left.dataset.durationValue || 0);
          const rightDuration = Number(right.dataset.durationValue || 0);
          const leftIndex = Number(left.dataset.originalIndex || 0);
          const rightIndex = Number(right.dataset.originalIndex || 0);
          const leftRecommended = left.dataset.recommended === 'true' ? 1 : 0;
          const rightRecommended = right.dataset.recommended === 'true' ? 1 : 0;

          if (sortValue === 'priceAsc') {
            return leftPrice - rightPrice || leftIndex - rightIndex;
          }
          if (sortValue === 'priceDesc') {
            return rightPrice - leftPrice || leftIndex - rightIndex;
          }
          if (sortValue === 'durationAsc') {
            return leftDuration - rightDuration || leftIndex - rightIndex;
          }
          if (sortValue === 'durationDesc') {
            return rightDuration - leftDuration || leftIndex - rightIndex;
          }

          return rightRecommended - leftRecommended || leftPrice - rightPrice || leftIndex - rightIndex;
        };

        // Vizuální stagger animace pri kazde zmene filtru/razeni
        visibleGroupCards
          .sort(compareCards)
          .forEach((card, index) => {
            card.style.order = String(index);
            card.classList.remove('is-entering');
            card.style.setProperty('--stagger-delay', `${Math.min(index * 26, 240)}ms`);
            // Force reflow to restart animation when filters change
            void card.offsetWidth;
            card.classList.add('is-entering');
          });

        groupCards
          .filter((card) => card.hidden)
          .forEach((card) => {
            card.style.order = '';
            card.classList.remove('is-entering');
            card.style.removeProperty('--stagger-delay');
          });

        const hasVisibleCard = visibleGroupCards.length > 0;
        group.hidden = !hasVisibleCard;
      });

      // Aktualizace informacniho textu o poctu vysledku
      if (resultCount) {
        resultCount.textContent = `${visibleCards} ${visibleCards === 1 ? 'služba' : 'služeb'}`;
      }
      if (emptyState) {
        emptyState.hidden = visibleCards > 0;
      }
    };

    // Prepinani kategorii pres chip tlacitka
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activeCategory = (chip.dataset.categoryFilter || 'all').toLowerCase();
        chips.forEach((item) => {
          const isActive = item === chip;
          item.classList.toggle('is-active', isActive);
          item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        updateFilters();
      });
    });

    // Prubezne prepocty pri zmene filtru
    if (searchInput) {
      searchInput.addEventListener('input', updateFilters);
    }
    if (durationSelect) {
      durationSelect.addEventListener('change', updateFilters);
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', updateFilters);
    }
    // Obnoveni vychoziho stavu filtru
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        activeCategory = 'all';
        if (searchInput) {
          searchInput.value = '';
        }
        if (durationSelect) {
          durationSelect.value = 'all';
        }
        if (sortSelect) {
          sortSelect.value = 'recommended';
        }
        chips.forEach((item) => {
          const isDefault = item.dataset.categoryFilter === 'all';
          item.classList.toggle('is-active', isDefault);
          item.setAttribute('aria-pressed', isDefault ? 'true' : 'false');
        });
        updateFilters();
      });
    }

    updateFilters();
  }

  // Zabraňte vnitřním detailům (indikace/kontraindikace) v zavírání rodičovské sekce
  const innerDetails = document.querySelectorAll('.service-accordion .indikace-toggle, .service-accordion .kontraindikace-toggle');
  console.log('[DEBUG] Počet vnitřních details:', innerDetails.length);

  innerDetails.forEach((detail, idx) => {
    // Blokuj toggle event
    detail.addEventListener('toggle', event => {
      console.log(`[DEBUG] Inner details #${idx} toggle:`, event.target.hasAttribute('open') ? 'OPENED' : 'CLOSED', 'CLASS:', event.target.className);
      event.stopPropagation();
    });
    // Blokuj click event na summary
    const summary = detail.querySelector('summary');
    if (summary) {
      summary.addEventListener('click', event => {
        console.log(`[DEBUG] Inner summary #${idx} click:`, summary.textContent.slice(0, 30));
        event.stopPropagation();
      });
    }
  });

  // Monitoruj hlavní sekce
  const mainAccordions = document.querySelectorAll('.service-accordion');
  console.log('[DEBUG] Počet hlavních accordionů:', mainAccordions.length);

  mainAccordions.forEach((accordion, idx) => {
    accordion.addEventListener('toggle', event => {
      console.log(`[DEBUG] Main accordion #${idx} toggle:`, event.target.hasAttribute('open') ? 'OPENED' : 'CLOSED');
    });

    // Sleduj mutace atributu
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'open') {
          const isOpen = accordion.hasAttribute('open');
          console.log(`[DEBUG] Main accordion #${idx} attribute change:`, isOpen ? 'OPENED' : 'CLOSED');
        }
      });
    });
    observer.observe(accordion, { attributes: true, attributeFilter: ['open'] });
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
// ===== HUDBA NA POZADÍ A PŘEPÍNÁNÍ TLAČÍTKA =====
const bgMusic = document.getElementById('bg-music');
const musicToggleButtons = Array.from(
  document.querySelectorAll('[data-music-toggle], #music-toggle')
);
const musicIcons = Array.from(
  document.querySelectorAll('[data-music-icon], #music-icon')
);

if (bgMusic && musicToggleButtons.length > 0 && musicIcons.length > 0) {
  // Zde nastav cesty k obrázkům, které se budou střídat!
  const iconPlay = 'galerie/play.webp';
  const iconPause = 'galerie/pause.webp';

  const syncMusicIcons = () => {
    const isPaused = bgMusic.paused;
    const icon = isPaused ? iconPlay : iconPause;
    const iconAlt = isPaused ? 'Play' : 'Pause';

    musicIcons.forEach((img) => {
      img.src = icon;
      img.alt = iconAlt;
    });
  };

  // Funkce, která řeší zákaz autoplaye v prohlížeči
  const tryPlayMusic = () => {
    bgMusic.play().then(() => {
      // Pokud se přehrání povede, změníme ikonku na pauzu
      syncMusicIcons();
    }).catch((err) => {
      // Prohlížeč hudbu zablokoval, ikonka zůstane na "play"
      console.log("Autoplay blokován prohlížečem, čeká se na interakci.");
      syncMusicIcons();
    });
  };

  // Kliknutí na kterékoliv hudební tlačítko
  musicToggleButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Zabránění spuštění globálního kliku níže
      if (bgMusic.paused) {
        bgMusic.play().then(() => {
          syncMusicIcons();
        }).catch(() => {
          syncMusicIcons();
        });
      } else {
        bgMusic.pause();
        syncMusicIcons();
      }
    });
  });

  bgMusic.addEventListener('play', syncMusicIcons);
  bgMusic.addEventListener('pause', syncMusicIcons);
  bgMusic.addEventListener('ended', syncMusicIcons);

  // Chytrý trik: Spustí hudbu při PRVNÍM kliknutí kamkoliv na web (např. na tlačítko "Menu")
  let userInteracted = false;
  document.body.addEventListener('click', () => {
    if (!userInteracted && bgMusic.paused) {
      tryPlayMusic();
      userInteracted = true;
    }
  }, { once: true }); // Proběhne jen jednou

  syncMusicIcons();
}
