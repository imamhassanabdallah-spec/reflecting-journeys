/* ============================================================
   REFLECTING JOURNEYS — interactions
   Progressive enhancement only. The site is fully readable
   without JS; this adds motion, the mobile menu, and the
   scroll-reveal choreography.
   ============================================================ */
(function () {
  'use strict';
  const doc = document;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: scrolled state ---------- */
  const header = doc.querySelector('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  const toggle = doc.querySelector('[data-nav-toggle]');
  const nav = doc.getElementById('primary-nav');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      doc.body.classList.toggle('nav-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    // Close on link tap / Escape / resize to desktop
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 920) setOpen(false); });
  }

  /* ---------- Services dropdown: sync aria (desktop) ---------- */
  const subGroup = doc.querySelector('[data-submenu]');
  if (subGroup) {
    const subToggle = subGroup.querySelector('.nav__sub-toggle');
    const sync = (open) => subToggle && subToggle.setAttribute('aria-expanded', String(open));
    subGroup.addEventListener('mouseenter', () => sync(true));
    subGroup.addEventListener('mouseleave', () => sync(false));
    subGroup.addEventListener('focusin', () => sync(true));
    subGroup.addEventListener('focusout', (e) => { if (!subGroup.contains(e.relatedTarget)) sync(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = doc.querySelectorAll('[data-reveal], [data-stagger]');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.getAttribute('data-reveal-delay');
            if (delay) el.style.setProperty('--reveal-delay', delay);
            el.classList.add('is-in');
            obs.unobserve(el);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---------- Journey: scroll-linked progress line ---------- */
  const jTrack = doc.querySelector('[data-journey]');
  if (jTrack && !reduceMotion) {
    let ticking = false;
    const update = () => {
      const r = jTrack.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress from when track top reaches 70% of viewport to when bottom reaches 40%
      const start = vh * 0.7, end = vh * 0.4;
      const p = (start - r.top) / (r.height - (vh - end) + (start - end) || 1);
      jTrack.style.setProperty('--jp', String(Math.max(0, Math.min(1, p))));
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Testimonials carousel ---------- */
  doc.querySelectorAll('[data-carousel]').forEach((root) => {
    const track = root.querySelector('[data-carousel-track]');
    const slides = Array.from(root.querySelectorAll('.carousel__slide'));
    const prev = root.querySelector('[data-carousel-prev]');
    const next = root.querySelector('[data-carousel-next]');
    const dotsWrap = root.querySelector('[data-carousel-dots]');
    if (!track || slides.length === 0) return;
    let index = 0;

    // Build dots
    const dots = slides.map((_, i) => {
      const b = doc.createElement('button');
      b.className = 'carousel__dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      b.addEventListener('click', () => go(i));
      dotsWrap && dotsWrap.appendChild(b);
      return b;
    });

    const render = () => {
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== index)));
      dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === index)));
    };
    const go = (i) => { index = (i + slides.length) % slides.length; render(); };
    const nextSlide = () => go(index + 1);
    const prevSlide = () => go(index - 1);

    prev && prev.addEventListener('click', prevSlide);
    next && next.addEventListener('click', nextSlide);

    // Keyboard
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { nextSlide(); }
      else if (e.key === 'ArrowLeft') { prevSlide(); }
    });

    // Swipe / drag
    let x0 = null;
    const start = (x) => { x0 = x; };
    const end = (x) => {
      if (x0 === null) return;
      const dx = x - x0;
      if (Math.abs(dx) > 45) { dx < 0 ? nextSlide() : prevSlide(); }
      x0 = null;
    };
    track.addEventListener('touchstart', (e) => start(e.touches[0].clientX), { passive: true });
    track.addEventListener('touchend', (e) => end(e.changedTouches[0].clientX), { passive: true });
    track.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') start(e.clientX); });
    track.addEventListener('pointerup', (e) => { if (e.pointerType === 'mouse') end(e.clientX); });

    render();
  });

  /* ---------- Current year ---------- */
  doc.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
