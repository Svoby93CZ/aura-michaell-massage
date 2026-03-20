document.addEventListener('DOMContentLoaded', () => {
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
// ===== HUDBA NA POZADÍ A PŘEPÍNÁNÍ TLAČÍTKA =====
const bgMusic = document.getElementById('bg-music');
const musicToggleBtn = document.getElementById('music-toggle');
const musicIcon = document.getElementById('music-icon');

if (bgMusic && musicToggleBtn && musicIcon) {
  // Zde nastav cesty k obrázkům, které se budou střídat!
  const iconPlay = 'galerie/play.webp';
  const iconPause = 'galerie/pause.webp';

  // Funkce, která řeší zákaz autoplaye v prohlížeči
  const tryPlayMusic = () => {
    bgMusic.play().then(() => {
      // Pokud se přehrání povede, změníme ikonku na pauzu
      musicIcon.src = iconPause;
    }).catch((err) => {
      // Prohlížeč hudbu zablokoval, ikonka zůstane na "play"
      console.log("Autoplay blokován prohlížečem, čeká se na interakci.");
      musicIcon.src = iconPlay;
    });
  };

  // Kliknutí na samotné tlačítko
  musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Zabránění spuštění globálního kliku níže
    if (bgMusic.paused) {
      bgMusic.play();
      musicIcon.src = iconPause;
    } else {
      bgMusic.pause();
      musicIcon.src = iconPlay;
    }
  });

  // Chytrý trik: Spustí hudbu při PRVNÍM kliknutí kamkoliv na web (např. na tlačítko "Menu")
  let userInteracted = false;
  document.body.addEventListener('click', () => {
    if (!userInteracted && bgMusic.paused) {
      tryPlayMusic();
      userInteracted = true;
    }
  }, { once: true }); // Proběhne jen jednou
}
