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

  const initNavigationScene = () => {
    const nav = document.querySelector('.primary-nav');
    const navInner = nav ? nav.querySelector('.primary-nav__inner') : null;
    if (!navInner) {
      return;
    }

    let canvas = navInner.querySelector('.primary-nav__scene');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'primary-nav__scene';
      canvas.setAttribute('aria-hidden', 'true');
      navInner.prepend(canvas);
    }

    const startScene = () => {
      if (!window.THREE || canvas.dataset.initialized === 'true') {
        return;
      }

      try {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        const group = new THREE.Group();
        const particleCount = 180;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const champagne = new THREE.Color('#f0c98a');
        const aqua = new THREE.Color('#83d8cb');

        for (let index = 0; index < particleCount; index += 1) {
          const offset = index * 3;
          const progress = index / particleCount;
          positions[offset] = (progress - 0.5) * 8;
          positions[offset + 1] = Math.sin(progress * Math.PI * 5) * 0.26 + (Math.random() - 0.5) * 0.42;
          positions[offset + 2] = (Math.random() - 0.5) * 1.8;
          const color = index % 4 === 0 ? aqua : champagne;
          colors[offset] = color.r;
          colors[offset + 1] = color.g;
          colors[offset + 2] = color.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const material = new THREE.PointsMaterial({
          size: 0.045,
          transparent: true,
          opacity: 0.68,
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        group.add(new THREE.Points(geometry, material));
        scene.add(group);
        camera.position.z = 4.6;
        canvas.dataset.initialized = 'true';

        const resize = () => {
          const width = Math.max(navInner.clientWidth, 1);
          const height = Math.max(navInner.clientHeight, 1);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
          renderer.setSize(width, height, false);
        };

        resize();
        window.addEventListener('resize', resize, { passive: true });

        const render = (time) => {
          group.rotation.y = time * 0.00008;
          group.rotation.x = Math.sin(time * 0.00018) * 0.08;
          renderer.render(scene, camera);
          if (!prefersReducedMotion) {
            window.requestAnimationFrame(render);
          }
        };

        render(0);
      } catch (error) {
        canvas.remove();
        console.warn('Navigation 3D scene unavailable:', error);
      }
    };

    if (window.THREE) {
      startScene();
      return;
    }

    const existingThreeScript = document.querySelector('script[src*="three.min.js"]');
    if (existingThreeScript) {
      existingThreeScript.addEventListener('load', startScene, { once: true });
      return;
    }

    const threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    threeScript.async = true;
    threeScript.addEventListener('load', startScene, { once: true });
    document.head.appendChild(threeScript);
  };

  // ===== Primární navigace =====
  const nav = document.querySelector('.primary-nav');
  const body = document.body;
  const menu = nav ? nav.querySelector('.primary-nav__menu') : null;
  const toggle = nav ? nav.querySelector('.primary-nav__toggle') : null;
  const brand = nav ? nav.querySelector('.primary-nav__brand') : null;
  const titleLink = nav ? nav.querySelector('.primary-nav__title-link') : null;
  let dropdowns = nav ? Array.from(nav.querySelectorAll('.primary-nav__dropdown')) : [];
  let heroOutOfView = false;
  const currentPath = window.location.pathname.replace(/\\/g, '/');

  const pageTitles = {
    '/index.html': 'Aura Michaell Massage',
    '/': 'Aura Michaell Massage',
    '/about.html': 'O mně',
    '/msginfo.html': 'Masáže a ceník',
    '/ceremonie.html': 'Aura ceremonie',
    '/obchod.html': 'Obchod a poukazy',
    '/privacy-policy.html': 'Ochrana osobních údajů'
  };

  if (titleLink) {
    const pageKey = Object.keys(pageTitles).find(path => currentPath.endsWith(path));
    titleLink.textContent = pageTitles[pageKey] || 'Aura Michaell Massage';
    titleLink.setAttribute('aria-hidden', 'false');
    titleLink.tabIndex = 0;
  }

  if (nav && menu && dropdowns.length) {
    dropdowns.forEach(dropdown => {
      const links = Array.from(dropdown.querySelectorAll('.primary-nav__dropdown-link'));
      links.forEach(link => {
        link.className = 'primary-nav__link';
        menu.insertBefore(link, dropdown);
      });
      dropdown.remove();
    });
    dropdowns = [];
  }

  if (menu) {
    menu.querySelectorAll('.primary-nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http')) {
        return;
      }

      const linkPath = new URL(href, window.location.href).pathname.replace(/\\/g, '/');
      if (linkPath === currentPath) {
        link.hidden = true;
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  const initNavButton3d = () => {
    if (!menu || prefersReducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    menu.querySelectorAll('.primary-nav__link:not([hidden])').forEach(link => {
      link.classList.add('nav-3d-button');
      let isPressed = false;

      const applyButtonTransform = event => {
        const bounds = link.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        const rotateY = x * 10;
        const rotateX = y * -10;
        const glowX = 50 + x * 55;
        const glowY = 50 + y * 55;

        link.style.transform = isPressed
          ? `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(1px) translateZ(-3px) scale(0.96)`
          : `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px) translateZ(12px) scale(1.03)`;
        link.style.setProperty('--nav-glow-x', `${glowX}%`);
        link.style.setProperty('--nav-glow-y', `${glowY}%`);
      };

      link.addEventListener('pointerenter', () => {
        link.classList.add('nav-3d-button--active');
      });

      link.addEventListener('pointermove', event => {
        applyButtonTransform(event);
      });

      link.addEventListener('pointerdown', event => {
        isPressed = true;
        link.classList.add('nav-3d-button--pressed');
        applyButtonTransform(event);
      });

      link.addEventListener('pointerup', event => {
        isPressed = false;
        link.classList.remove('nav-3d-button--pressed');
        applyButtonTransform(event);
      });

      const resetButton = () => {
        isPressed = false;
        link.classList.remove('nav-3d-button--active');
        link.classList.remove('nav-3d-button--pressed');
        link.style.removeProperty('transform');
        link.style.removeProperty('--nav-glow-x');
        link.style.removeProperty('--nav-glow-y');
      };

      link.addEventListener('pointercancel', resetButton);
      link.addEventListener('pointerleave', resetButton);
    });
  };

  initNavButton3d();

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
    const shouldShow = Boolean(titleLink);
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
      closeAllDropdowns();
      updateNavCondensed();
    };

    openMenu = () => {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      menu.scrollTop = 0;
      nav.classList.remove('primary-nav--condensed');
      if (brand) {
        brand.setAttribute('aria-hidden', 'false');
        brand.tabIndex = 0;
      }
      evaluateTitleState();
    };

    syncForViewport = () => {
      const isDesktop = window.matchMedia('(min-width: 1101px)').matches;
      if (isDesktop) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'false');
        menu.scrollTop = 0;
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
        if (window.matchMedia('(max-width: 1100px)').matches) {
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
