# Reflecting Journeys — Go-Live & Admin Setup Guide

The site is 100% static (HTML/CSS/JS) with a free admin panel (Decap CMS).
Total cost: **$0** — the only optional cost is a custom domain (~$10–15/year).

---

## Part 1 — Put the site online (free)

1. Create a free account at **github.com** (if you don't have one).
2. Create a new repository, e.g. `reflecting-journeys`.
3. Upload everything inside the `website` folder to the repository
   (the repo root must contain `index.html`, `styles.css`, `script.js`,
   `admin/`, `content/`, `images/`).
   From a terminal inside the `website` folder:
   ```
   git init -b main
   git add .
   git commit -m "Reflecting Journeys website"
   git remote add origin https://github.com/YOUR_USERNAME/reflecting-journeys.git
   git push -u origin main
   ```
4. Create a free account at **netlify.com** → "Add new site" →
   "Import an existing project" → pick the GitHub repo.
   Build command: *(leave empty)*. Publish directory: `/` (the root).
5. Deploy. Netlify gives you a free URL like `reflecting-journeys.netlify.app`.
   You can rename it under **Site settings → Site details → Change site name**,
   or connect a custom domain later.

## Part 2 — Turn on the admin panel (one-time, ~5 minutes)

1. In Netlify: **Site settings (or Integrations) → Identity → Enable Identity**.
2. Under **Identity → Registration**, set it to **Invite only** (important).
3. Under **Identity → Services → Git Gateway**, click **Enable Git Gateway**.
4. Under **Identity → Invite users**, invite the owner's email (Laura's).
5. She receives an email → clicks the invite link → sets a password.

## Part 3 — How the owner edits the site

1. Go to `https://YOUR-SITE.netlify.app/admin/`
2. Log in with email + password.
3. Click **Website Content** — every section is listed
   (Hero, About, Services, Testimonial, Contact, …).
4. Change any text or upload new photos, then click **Publish**.
5. The live site updates automatically within ~1 minute.

Formatting tips inside the editor:
- `*word*` → elegant *italics* (used in the big headline)
- `**word**` → **bold**

## Notes

- All editable content lives in `content/site.json`. The admin panel
  edits that file; the page loads it automatically.
- Photos uploaded through the admin go to `images/uploads/`.
- The 4 starter photos must exist as:
  `images/laura-hero.jpg`, `images/laura-portrait.jpg`,
  `images/laura-studio.jpg`, `images/laura-journey.jpg`.
- The contact form currently uses a `mailto:` action. For a proper
  form inbox, create a free account at **formspree.io**, then replace
  the form's `action` in `index.html` with your Formspree URL
  (50 free submissions/month).
