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
  function initCarousels() {
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
  }

  /* ---------- CMS content injection ----------
     Reads content/site.json (edited via the Decap CMS at /admin) and
     overrides the inline defaults. The page is fully readable without JS;
     this simply lets Laura update copy, contact details and testimonials.
     Lightweight formatting: *word* -> italic, **word** -> bold, line breaks. */
  async function applyCMS() {
    let data;
    try {
      const res = await fetch('content/site.json', { cache: 'no-store' });
      if (!res.ok) return;
      data = await res.json();
    } catch (e) { return; }

    const get = (path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), data);
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const md = (s) => esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    const c = data.contact || {};

    // Page-specific fields: [data-cms="path.to.field"]
    doc.querySelectorAll('[data-cms]').forEach((el) => {
      const v = get(el.getAttribute('data-cms'));
      if (v != null) el.innerHTML = md(v);
    });

    // Footer contact links (email, WhatsApp, Instagram) — on every page
    const fl = doc.querySelectorAll('.site-footer__connect .site-footer__contact');
    if (fl[0] && c.email) { fl[0].href = 'mailto:' + c.email; fl[0].textContent = c.email; }
    if (fl[1] && c.whatsapp_url) { fl[1].href = c.whatsapp_url; fl[1].textContent = 'WhatsApp · ' + c.whatsapp_display; }
    if (fl[2] && c.instagram_url) { fl[2].href = c.instagram_url; fl[2].textContent = 'Instagram · ' + c.instagram_handle; }
    const fTag = doc.querySelector('.site-footer__tag');
    if (fTag && data.footer && data.footer.tagline) fTag.innerHTML = md(data.footer.tagline);
    const fLoc = doc.querySelector('.site-footer__loc');
    if (fLoc && c.location) fLoc.textContent = c.location;

    // Contact page: contact list (email, WhatsApp, Instagram, location)
    const cl = doc.querySelectorAll('.contact-list .contact-list__value');
    if (cl.length) {
      if (cl[0] && c.email) { cl[0].href = 'mailto:' + c.email; cl[0].textContent = c.email; }
      if (cl[1] && c.whatsapp_url) { cl[1].href = c.whatsapp_url; cl[1].textContent = c.whatsapp_display; }
      if (cl[2] && c.instagram_url) { cl[2].href = c.instagram_url; cl[2].textContent = c.instagram_handle; }
      if (cl[3] && c.location) { cl[3].textContent = c.location; }
    }
    const waBtn = doc.querySelector('.contact-cta .btn');
    if (waBtn && c.whatsapp_url) waBtn.href = c.whatsapp_url;

    // "Book a call" section (home + service pages)
    if (data.cta) {
      const t = doc.querySelector('.booking-cta__title'); if (t && data.cta.title) t.textContent = data.cta.title;
      const l = doc.querySelector('.booking-cta__lead'); if (l && data.cta.lead) l.innerHTML = md(data.cta.lead);
      const b = doc.querySelector('.booking-cta__actions .btn'); if (b && data.cta.button) b.textContent = data.cta.button;
    }

    // Testimonials — rebuild the carousel slides
    const track = doc.querySelector('[data-carousel-track]');
    if (track && Array.isArray(data.testimonials) && data.testimonials.length) {
      track.innerHTML = data.testimonials.map((t, i) =>
        '<li class="carousel__slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + data.testimonials.length + '">' +
          '<figure class="testimonial">' +
            '<blockquote class="testimonial__quote font-display">' + md(t.quote) + '</blockquote>' +
            '<figcaption class="testimonial__by">' +
              '<span class="testimonial__initials">' + esc(t.initials) + '</span>' +
              '<span class="testimonial__role">' + esc(t.role) + '</span>' +
            '</figcaption>' +
          '</figure>' +
        '</li>'
      ).join('');
    }
  }

  /* ---------- Butterfly carousel (arrows + drag-to-scroll) ---------- */
  const bfTrack = doc.querySelector('[data-bf-track]');
  if (bfTrack) {
    const step = () => {
      const fig = bfTrack.querySelector('.poster-figure');
      const gap = parseFloat(getComputedStyle(bfTrack).columnGap) || 16;
      return (fig ? fig.offsetWidth : bfTrack.clientWidth * 0.6) + gap;
    };
    const prev = doc.querySelector('[data-bf-prev]');
    const next = doc.querySelector('[data-bf-next]');
    prev && prev.addEventListener('click', () => bfTrack.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    next && next.addEventListener('click', () => bfTrack.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    // mouse drag-to-scroll
    let down = false, startX = 0, startScroll = 0;
    bfTrack.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; startX = e.clientX; startScroll = bfTrack.scrollLeft; bfTrack.classList.add('is-dragging'); });
    bfTrack.addEventListener('pointermove', (e) => { if (!down) return; bfTrack.scrollLeft = startScroll - (e.clientX - startX); });
    const endDrag = () => { down = false; bfTrack.classList.remove('is-dragging'); };
    bfTrack.addEventListener('pointerup', endDrag);
    bfTrack.addEventListener('pointerleave', endDrag);
  }

  /* ---------- Current year ---------- */
  doc.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  // Apply editable content, then start the carousel on the (possibly rebuilt) slides
  applyCMS().finally(initCarousels);
})();
