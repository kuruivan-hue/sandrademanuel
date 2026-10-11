/**
 * SANDRA DE MANUEL — ARTE FLAMENCO
 * Interacciones, animaciones de viewport y control multimedia
 */

document.addEventListener('DOMContentLoaded', () => {
  initViewportReveals();
  initHeroVideo();
  initGalleryShowcase();
  initLightbox();
  initMobileNav();
  initContactModal();
  initSmoothScroll();
});

/* ==========================================================================
   1. REVELACIÓN AL ENTRAR AL VIEWPORT (0.75s opacity + translateY(22px))
   ========================================================================== */
function initViewportReveals() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  reveals.forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   2. HERO VIDEO & PAUSA FUERA DE VIEWPORT + PREFERS-REDUCED-MOTION
   ========================================================================== */
function initHeroVideo() {
  const heroVideo = document.getElementById('heroVideo');
  if (!heroVideo) return;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function handleMotionPreference() {
    if (reducedMotionQuery.matches) {
      heroVideo.pause();
    } else {
      // Intentar reproducción silenciosa si está en pantalla
      heroVideo.play().catch(() => {
        // Fallback en caso de bloqueo estricto del navegador
      });
    }
  }

  handleMotionPreference();
  reducedMotionQuery.addEventListener('change', handleMotionPreference);

  // Pausar el vídeo al salir del viewport
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!reducedMotionQuery.matches) {
          heroVideo.play().catch(() => {});
        }
      } else {
        heroVideo.pause();
      }
    });
  }, { threshold: 0.1 });

  videoObserver.observe(heroVideo);

  // Cabecera transparente / con fondo al scroll
  const siteHeader = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      siteHeader?.classList.add('is-scrolled');
    } else {
      siteHeader?.classList.remove('is-scrolled');
    }
  }, { passive: true });
}

/* ==========================================================================
   3. GALERÍA: TABS DE VÍDEO (HORIZONTAL / VERTICAL) Y CONTROLES
   ========================================================================== */
function initGalleryShowcase() {
  const showcaseVideo = document.getElementById('showcaseVideo');
  const videoContainer = document.getElementById('videoPlayerContainer');
  const playPauseBtn = document.getElementById('videoPlayPauseBtn');
  const muteBtn = document.getElementById('videoMuteBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');

  if (!showcaseVideo || !videoContainer) return;

  const videoSources = {
    horizontal: {
      src: 'assets/videos/hero-loop.mp4',
      poster: 'assets/photos/hero-poster.jpg',
      isVertical: false
    },
    vertical: {
      src: 'assets/videos/reel-vertical.mp4',
      poster: 'assets/photos/sandra-escena-1.jpg',
      isVertical: true
    }
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      const data = videoSources[target];
      if (!data) return;

      tabBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      showcaseVideo.pause();
      showcaseVideo.src = data.src;
      showcaseVideo.poster = data.poster;

      if (data.isVertical) {
        videoContainer.classList.add('is-vertical');
      } else {
        videoContainer.classList.remove('is-vertical');
      }

      showcaseVideo.load();
      showcaseVideo.play().catch(() => {});
      updatePlayIcon(true);
    });
  });

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (showcaseVideo.paused) {
        showcaseVideo.play();
        updatePlayIcon(true);
      } else {
        showcaseVideo.pause();
        updatePlayIcon(false);
      }
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      showcaseVideo.muted = !showcaseVideo.muted;
      muteBtn.textContent = showcaseVideo.muted ? '🔇' : '🔊';
    });
  }

  function updatePlayIcon(isPlaying) {
    if (!playPauseBtn) return;
    playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    if (isPlaying) {
      videoContainer.classList.remove('is-paused');
    } else {
      videoContainer.classList.add('is-paused');
    }
  }

  showcaseVideo.addEventListener('play', () => updatePlayIcon(true));
  showcaseVideo.addEventListener('pause', () => updatePlayIcon(false));
}

/* ==========================================================================
   4. LIGHTBOX PARA FOTOGRAFÍAS
   ========================================================================== */
function initLightbox() {
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const photoCards = document.querySelectorAll('.photo-card');

  if (!lightboxModal || !photoCards.length) return;

  const galleryItems = Array.from(photoCards).map(card => {
    const img = card.querySelector('img');
    const title = card.querySelector('.photo-caption-title')?.textContent || 'Sandra de Manuel';
    return {
      src: img?.getAttribute('src') || '',
      caption: title
    };
  });

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const item = galleryItems[currentIndex];
    if (!item) return;

    lightboxImg.src = item.src;
    lightboxImg.alt = item.caption;
    lightboxCaption.textContent = item.caption;
    lightboxModal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  photoCards.forEach((card, index) => {
    card.addEventListener('click', () => openLightbox(index));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });
  });

  lightboxCloseBtn?.addEventListener('click', closeLightbox);

  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('is-active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % galleryItems.length;
      openLightbox(currentIndex);
    }
    if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
      openLightbox(currentIndex);
    }
  });
}

/* ==========================================================================
   5. NAVEGACIÓN MÓVIL
   ========================================================================== */
function initMobileNav() {
  const mobileToggle = document.getElementById('mobileNavToggle');
  const mobileDrawer = document.getElementById('mobileNavDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (!mobileToggle || !mobileDrawer) return;

  function toggleDrawer() {
    const isOpen = mobileDrawer.classList.toggle('is-open');
    mobileToggle.setAttribute('aria-expanded', isOpen);
    mobileToggle.textContent = isOpen ? 'Cerrar' : 'Menú';
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  mobileToggle.addEventListener('click', toggleDrawer);

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileDrawer.classList.remove('is-open');
      mobileToggle.textContent = 'Menú';
      document.body.style.overflow = '';
    });
  });
}

/* ==========================================================================
   6. MODAL DE CONTACTO RÁPIDO
   ========================================================================== */
function initContactModal() {
  const contactModal = document.getElementById('contactModal');
  const modalTriggers = document.querySelectorAll('[data-open-contact]');
  const closeTriggers = document.querySelectorAll('[data-close-contact]');
  const selectService = document.getElementById('contactServiceSelect');
  const contactForm = document.getElementById('contactQuickForm');

  if (!contactModal) return;

  function openContact(service = '') {
    if (selectService && service) {
      selectService.value = service;
    }
    contactModal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeContact() {
    contactModal.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  modalTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || '';
      openContact(service);
    });
  });

  closeTriggers.forEach(btn => {
    btn.addEventListener('click', closeContact);
  });

  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) closeContact();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal.classList.contains('is-active')) {
      closeContact();
    }
  });

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName')?.value || '';
    const email = document.getElementById('contactEmail')?.value || '';
    const service = selectService?.value || 'Consulta';
    const message = document.getElementById('contactMessage')?.value || '';

    // Preparar mensaje para WhatsApp o mailto
    const textMsg = encodeURIComponent(
      `Hola Sandra, soy ${name} (${email}). Me gustaría consultar sobre: ${service}. Detalle: ${message}`
    );

    // Botón de confirmación visual
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      const origText = submitBtn.textContent;
      submitBtn.textContent = '¡Mensaje preparado!';
      submitBtn.style.backgroundColor = 'var(--color-accent)';
      submitBtn.style.color = 'var(--color-ink)';

      setTimeout(() => {
        // Enlace por mailto o WhatsApp
        window.location.href = `mailto:sandrademanuelbailaora@gmail.com?subject=${encodeURIComponent('Consulta web: ' + service)}&body=${textMsg}`;
        closeContact();
        submitBtn.textContent = origText;
        submitBtn.style.backgroundColor = '';
        submitBtn.style.color = '';
        contactForm.reset();
      }, 700);
    }
  });
}

/* ==========================================================================
   7. SMOOTH SCROLL PARA ENLACES ANCLA
   ========================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
