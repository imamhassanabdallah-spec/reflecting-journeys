// Mobile navigation toggle
const navToggle = document.getElementById("nav-toggle");
const siteNav = document.getElementById("site-nav");

navToggle.addEventListener("click", () => {
  const open = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

// Close the mobile menu after tapping a link
siteNav.addEventListener("click", (e) => {
  if (e.target.tagName === "A" && siteNav.classList.contains("open")) {
    siteNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

// Reveal-on-scroll animations
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("visible"));
}

// Keep the footer year current
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================================================
   CMS content hydration
   Loads content/site.json (edited via /admin) and fills the
   page. If the file can't load (e.g. opened via file://), the
   text baked into index.html simply remains.
   ============================================================ */

// Escape HTML, then allow **bold** and *italic* markers
function rich(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function setHTML(selector, value) {
  const el = document.querySelector(selector);
  if (el && value != null) el.innerHTML = rich(value);
}

function setImage(selector, src) {
  const el = document.querySelector(selector);
  if (el && src) {
    el.src = src;
    el.parentElement.classList.remove("img-missing");
  }
}

function setList(selector, items, renderItem) {
  const el = document.querySelector(selector);
  if (el && Array.isArray(items) && items.length) {
    el.innerHTML = items.map(renderItem).join("");
  }
}

async function hydrateContent() {
  let c;
  try {
    const res = await fetch("content/site.json", { cache: "no-store" });
    if (!res.ok) return;
    c = await res.json();
  } catch {
    return; // keep baked-in content
  }

  if (c.hero) {
    setHTML(".hero-copy .eyebrow", c.hero.eyebrow);
    setHTML(".hero-copy h1", c.hero.headline);
    setHTML(".hero-copy .lead", c.hero.lead);
    setHTML(".hero-actions .btn-primary", c.hero.cta_primary);
    setHTML(".hero-actions .btn-ghost", c.hero.cta_secondary);
    setList(".hero-trust", c.hero.bullets, (b) => `<li>${rich(b)}</li>`);
    setImage(".hero-photo img", c.hero.image);
  }

  if (c.about) {
    setHTML(".about-copy h2", c.about.heading);
    setHTML("#about-p1", c.about.p1);
    setHTML("#about-p2", c.about.p2);
    setList(".checklist", c.about.checklist, (p) => `<li>${rich(p)}</li>`);
    setHTML(".about-badge strong", c.about.name);
    setHTML(".about-badge span", c.about.role);
    setHTML(".about-copy .btn", c.about.button);
    setImage(".about-frame img", c.about.image);
  }

  if (c.human_design) {
    setHTML("#human-design h2", c.human_design.heading);
    setHTML("#human-design .section-sub", c.human_design.sub);
    setImage(".hd-frame img", c.human_design.image);
    setList("#human-design .card-grid", c.human_design.cards, (card) => `
      <article class="card">
        <div class="card-icon" aria-hidden="true">${rich(card.icon || "◆")}</div>
        <h3>${rich(card.title)}</h3>
        <p>${rich(card.text)}</p>
      </article>`);
  }

  if (c.services) {
    setHTML("#services .section-head h2", c.services.heading);
    setHTML("#services .section-sub", c.services.sub);
    setList("#services .card-grid", c.services.items, (s) => `
      <article class="card service-card${s.featured ? " featured" : ""}">
        ${s.featured ? '<span class="pill">Most popular</span>' : ""}
        <h3>${rich(s.title)}</h3>
        <p>${rich(s.text)}</p>
        <ul class="service-list">
          ${(s.bullets || []).map((b) => `<li>${rich(b)}</li>`).join("")}
        </ul>
        <a href="#contact" class="text-link">Book a session →</a>
      </article>`);
  }

  setList(".focus-tags", c.focus_tags, (t) => `<li>${rich(t)}</li>`);

  setList(".steps", c.steps, (s, i) => `
    <li>
      <span class="step-num">${i + 1}</span>
      <h3>${rich(s.title)}</h3>
      <p>${rich(s.text)}</p>
    </li>`);

  if (c.testimonial) {
    setHTML(".testimonial blockquote", `“${c.testimonial.quote}”`);
    setHTML(".testimonial figcaption strong", c.testimonial.name);
    setHTML(".testimonial figcaption span", c.testimonial.role);
  }

  if (c.cta) {
    setHTML(".cta-inner h2", c.cta.heading);
    setHTML(".cta-inner p", c.cta.text);
    setHTML(".cta-inner .btn", c.cta.button);
    if (c.cta.image) {
      document.querySelector(".cta-band").style.background =
        `linear-gradient(135deg, rgba(38,58,49,0.92), rgba(62,92,80,0.88)), ` +
        `url("${c.cta.image}") center 30% / cover no-repeat`;
    }
  }

  if (c.contact) {
    setHTML("#contact-intro", c.contact.intro);
    const handle = (c.contact.instagram || "").replace(/^@/, "");
    setList(".contact-list", [0], () => `
      <li><span class="contact-label">Email</span> <a href="mailto:${c.contact.email}">${c.contact.email}</a></li>
      <li><span class="contact-label">Instagram</span> <a href="https://instagram.com/${handle}" target="_blank" rel="noopener">${rich(c.contact.instagram)}</a></li>
      <li><span class="contact-label">Location</span> ${rich(c.contact.location)}</li>`);
    const form = document.querySelector(".contact-form");
    if (form) form.setAttribute("action", `mailto:${c.contact.email}`);
    const footerMail = document.querySelector('.footer-social a[href^="mailto:"]');
    if (footerMail) footerMail.href = `mailto:${c.contact.email}`;
    const footerInsta = document.querySelector('.footer-social a[href*="instagram"]');
    if (footerInsta) footerInsta.href = `https://instagram.com/${handle}`;
  }

  if (c.footer) setHTML(".footer-brand p", c.footer.tagline);
}

hydrateContent();
