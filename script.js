/* ============================================================
   REFLECTING JOURNEYS — interactions (lightweight & fail-safe)
   The site is fully readable without JS. This adds:
   the mobile menu, a subtle scroll-reveal (with a hard failsafe
   so nothing can ever stay hidden), the two carousels and the
   CMS content injection. No heavy scroll effects.
   ============================================================ */
(function () {
  'use strict';
  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: solid state once scrolled ---------- */
  var header = doc.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 12); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile navigation (simple, reliable drawer) ---------- */
  var toggle = doc.querySelector('[data-nav-toggle]');
  var nav = doc.getElementById('primary-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      doc.body.classList.toggle('nav-open', open);   // locks body scroll (CSS)
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 920) setOpen(false); });
  }

  /* ---------- Services dropdown: sync aria (desktop) ---------- */
  var subGroup = doc.querySelector('[data-submenu]');
  if (subGroup) {
    var subToggle = subGroup.querySelector('.nav__sub-toggle');
    var sync = function (open) { if (subToggle) subToggle.setAttribute('aria-expanded', String(open)); };
    subGroup.addEventListener('mouseenter', function () { sync(true); });
    subGroup.addEventListener('mouseleave', function () { sync(false); });
    subGroup.addEventListener('focusin', function () { sync(true); });
    subGroup.addEventListener('focusout', function (e) { if (!subGroup.contains(e.relatedTarget)) sync(false); });
  }

  /* ---------- Reveal on scroll — fail-safe ----------
     Content is visible by default (see CSS: hidden only under html.js).
     If anything goes wrong, a timer reveals everything. */
  var revealEls = doc.querySelectorAll('[data-reveal], [data-stagger]');
  var revealAll = function () { revealEls.forEach(function (el) { el.classList.add('is-in'); }); };
  if (reduceMotion || !('IntersectionObserver' in window) || !revealEls.length) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); obs.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Hard failsafe: nothing may stay hidden.
    window.setTimeout(revealAll, 2200);
    // Also reveal everything once fully loaded (covers late layout shifts).
    window.addEventListener('load', function () { window.setTimeout(revealAll, 400); });
  }

  /* ---------- Testimonials carousel ---------- */
  function initCarousels() {
    doc.querySelectorAll('[data-carousel]').forEach(function (root) {
      var track = root.querySelector('[data-carousel-track]');
      var slides = Array.prototype.slice.call(root.querySelectorAll('.carousel__slide'));
      var prev = root.querySelector('[data-carousel-prev]');
      var next = root.querySelector('[data-carousel-next]');
      var dotsWrap = root.querySelector('[data-carousel-dots]');
      if (!track || slides.length === 0) return;
      var index = 0;

      var dots = slides.map(function (_, i) {
        var b = doc.createElement('button');
        b.className = 'carousel__dot';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        b.addEventListener('click', function () { go(i); });
        if (dotsWrap) dotsWrap.appendChild(b);
        return b;
      });

      var render = function () {
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
        slides.forEach(function (s, i) { s.setAttribute('aria-hidden', String(i !== index)); });
        dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === index)); });
      };
      var go = function (i) { index = (i + slides.length) % slides.length; render(); };
      var nextSlide = function () { go(index + 1); };
      var prevSlide = function () { go(index - 1); };

      if (prev) prev.addEventListener('click', prevSlide);
      if (next) next.addEventListener('click', nextSlide);
      root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') nextSlide();
        else if (e.key === 'ArrowLeft') prevSlide();
      });

      var x0 = null;
      var start = function (x) { x0 = x; };
      var end = function (x) {
        if (x0 === null) return;
        var dx = x - x0;
        if (Math.abs(dx) > 45) { dx < 0 ? nextSlide() : prevSlide(); }
        x0 = null;
      };
      track.addEventListener('touchstart', function (e) { start(e.touches[0].clientX); }, { passive: true });
      track.addEventListener('touchend', function (e) { end(e.changedTouches[0].clientX); }, { passive: true });
      track.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') start(e.clientX); });
      track.addEventListener('pointerup', function (e) { if (e.pointerType === 'mouse') end(e.clientX); });

      render();
    });
  }

  /* ---------- Butterfly carousel (arrows + drag-to-scroll) ---------- */
  var bfTrack = doc.querySelector('[data-bf-track]');
  if (bfTrack) {
    var step = function () {
      var fig = bfTrack.querySelector('.poster-figure');
      var gap = parseFloat(getComputedStyle(bfTrack).columnGap) || 16;
      return (fig ? fig.offsetWidth : bfTrack.clientWidth * 0.6) + gap;
    };
    var bfPrev = doc.querySelector('[data-bf-prev]');
    var bfNext = doc.querySelector('[data-bf-next]');
    if (bfPrev) bfPrev.addEventListener('click', function () { bfTrack.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    if (bfNext) bfNext.addEventListener('click', function () { bfTrack.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }); });
    var down = false, startX = 0, startScroll = 0;
    bfTrack.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; startX = e.clientX; startScroll = bfTrack.scrollLeft; bfTrack.classList.add('is-dragging'); });
    bfTrack.addEventListener('pointermove', function (e) { if (!down) return; bfTrack.scrollLeft = startScroll - (e.clientX - startX); });
    var endDrag = function () { down = false; bfTrack.classList.remove('is-dragging'); };
    bfTrack.addEventListener('pointerup', endDrag);
    bfTrack.addEventListener('pointerleave', endDrag);
  }

  /* ---------- CMS content injection ----------
     Reads content/site.json (edited via Decap CMS at /admin) and
     overrides the inline defaults. Fully readable without JS. */
  function applyCMS() {
    return fetch('content/site.json', { cache: 'no-store' })
      .then(function (res) { if (!res.ok) throw 0; return res.json(); })
      .then(function (data) {
        var get = function (path) { return path.split('.').reduce(function (o, k) { return (o == null ? undefined : o[k]); }, data); };
        var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
        var md = function (s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); };
        var c = data.contact || {};

        doc.querySelectorAll('[data-cms]').forEach(function (el) {
          var v = get(el.getAttribute('data-cms'));
          if (v != null) el.innerHTML = md(v);
        });

        // Editable images: [data-cms-img="images.home.hero"] -> sets the <img> src
        doc.querySelectorAll('[data-cms-img]').forEach(function (el) {
          var v = get(el.getAttribute('data-cms-img'));
          if (v) el.setAttribute('src', v);
        });

        var fl = doc.querySelectorAll('.site-footer__connect .site-footer__contact');
        if (fl[0] && c.email) { fl[0].href = 'mailto:' + c.email; fl[0].textContent = c.email; }
        if (fl[1] && c.whatsapp_url) { fl[1].href = c.whatsapp_url; fl[1].textContent = 'WhatsApp · ' + c.whatsapp_display; }
        if (fl[2] && c.instagram_url) { fl[2].href = c.instagram_url; fl[2].textContent = 'Instagram · ' + c.instagram_handle; }
        var fTag = doc.querySelector('.site-footer__tag');
        if (fTag && data.footer && data.footer.tagline) fTag.innerHTML = md(data.footer.tagline);
        var fLoc = doc.querySelector('.site-footer__loc');
        if (fLoc && c.location) fLoc.textContent = c.location;

        var cl = doc.querySelectorAll('.contact-list .contact-list__value');
        if (cl.length) {
          if (cl[0] && c.email) { cl[0].href = 'mailto:' + c.email; cl[0].textContent = c.email; }
          if (cl[1] && c.whatsapp_url) { cl[1].href = c.whatsapp_url; cl[1].textContent = c.whatsapp_display; }
          if (cl[2] && c.instagram_url) { cl[2].href = c.instagram_url; cl[2].textContent = c.instagram_handle; }
          if (cl[3] && c.location) { cl[3].textContent = c.location; }
        }
        var waBtn = doc.querySelector('.contact-cta .btn');
        if (waBtn && c.whatsapp_url) waBtn.href = c.whatsapp_url;

        if (data.cta) {
          var t = doc.querySelector('.booking-cta__title'); if (t && data.cta.title) t.textContent = data.cta.title;
          var l = doc.querySelector('.booking-cta__lead'); if (l && data.cta.lead) l.innerHTML = md(data.cta.lead);
          var b = doc.querySelector('.booking-cta__actions .btn'); if (b && data.cta.button) b.textContent = data.cta.button;
        }

        var track = doc.querySelector('[data-carousel-track]');
        if (track && Array.isArray(data.testimonials) && data.testimonials.length) {
          track.innerHTML = data.testimonials.map(function (t, i) {
            return '<li class="carousel__slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + data.testimonials.length + '">' +
              '<figure class="testimonial">' +
              '<blockquote class="testimonial__quote font-display">' + md(t.quote) + '</blockquote>' +
              '<figcaption class="testimonial__by">' +
              '<span class="testimonial__initials">' + esc(t.initials) + '</span>' +
              '<span class="testimonial__role">' + esc(t.role) + '</span>' +
              '</figcaption></figure></li>';
          }).join('');
        }
      })
      .catch(function () { /* inline defaults stay */ });
  }

  /* ---------- Current year ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  applyCMS().finally(initCarousels);
})();
