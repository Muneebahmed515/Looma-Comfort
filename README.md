# Looma Comfort

The website and admin panel for **Looma Comfort**, premium furniture in Pakistan. Customers browse the collection and order on WhatsApp. There is no cart or online payment.

- **Public site:** home page, shop with filters, categories, collections, product pages, best sellers, new arrivals, sale, search, wishlist, about, contact, custom furniture, FAQs, policies, branded 404.
- **Admin panel** (`/admin`): products, categories, collections, materials, home page sections, hero slides, offers (scheduled, applied automatically), promo banners, announcement bar, reviews, pages, FAQs, inbox, newsletter subscribers, site settings, team, and two-step sign in.
- **Stack:** Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, Neon (serverless Postgres), Vercel Blob (images), Vercel. Motion: Lenis, GSAP with ScrollTrigger and SplitText, and Motion (framer-motion).

---

## 1. Run it on your computer (2 minutes)

You need **Node.js 20.9 or newer**.

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `DATABASE_URL`, the site runs in **demo mode**:

- The site uses the built-in sample catalogue (29 products, demo photography).
- `/admin` opens a read-only preview of the admin panel with the same data. You can explore every screen, but nothing is saved.

---

## 2. Connect the Neon database

1. Create a free account at https://neon.tech and create a **New project**.
   - **Region:** *AWS Asia Pacific (Singapore)*, the closest Neon region to Pakistan.
   - Neon creates a database called `neondb`.
2. **Copy the connection string:** in your project, click **Connect**, keep **Pooled connection** on, and copy the string that starts with `postgresql://…`. This is your `DATABASE_URL`.
3. **Create `.env.local`** from `.env.example` and fill in:
   - `DATABASE_URL`: the string from step 2
   - `AUTH_SECRET`, `REVALIDATE_SECRET`, `CRON_SECRET`: three different long random strings. Make each one with:
     `node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"`
4. **Create the tables.** Use one of these two ways.
   - **From your computer:** run `npm run db:setup`.
   - **Without tools:** open **SQL Editor** in Neon, paste the whole of `db/setup.sql`, and click **Run**.

   Either way, this creates every table and loads the starting catalogue, pages, FAQs and settings. Running it again is safe.
   `setup.sql` is all of `db/migrations/` plus `db/seed.sql` in one file. After changing either, run `npm run db:bundle`.
5. **Create your owner account:**
   ```bash
   npm run admin:create -- you@example.com "Your Name"
   ```
   It asks you to choose a password (at least 10 characters).
6. Restart `npm run dev` and sign in at http://localhost:3000/admin.

**Team members.** As the owner, open **Admin → Team → Add someone**. You get a one-time password to send them privately. They sign in and choose their own password under **Account**.

**Forgotten passwords.** There is no email service.
- For a team member, the owner clicks **New password** next to their name in **Team**.
- For the owner, run `npm run admin:create -- you@example.com` again. This sets a new password, turns off two-step sign in and signs the account out on every device.

**Image uploads** need a Vercel Blob store (see step 3 of the next section). Until one is connected, uploading shows "Image storage is not connected". To upload from your computer, copy `BLOB_READ_WRITE_TOKEN` from the store's settings into `.env.local`.

---

## 3. Deploy to Vercel and connect your domain

1. Push this folder to a **private** GitHub repository.
2. In https://vercel.com, click **Add New → Project**, import the repository, and keep the defaults. Don't deploy yet.
3. **Storage** tab of the project:
   - Click **Create → Blob**, name it e.g. `looma-images`, and connect it to the project. Vercel adds `BLOB_READ_WRITE_TOKEN` for you.
   - Optional: instead of pasting the Neon string yourself, you can add Neon here (**Create → Neon**), which adds `DATABASE_URL` for you. If you do, create the tables in that database (step 4 of section 2).
4. **Settings → Environment Variables:** add every variable from `.env.example` that isn't there yet:
   - `DATABASE_URL`
   - `AUTH_SECRET`, `REVALIDATE_SECRET`, `CRON_SECRET`
   - `NEXT_PUBLIC_SITE_URL`: your live address, e.g. `https://your-domain.com`, or the `https://<project>.vercel.app` address until you have a domain
   - optionally, the Turnstile keys
5. **Deploy.** If you add or change a variable later, go to **Deployments → ⋯ → Redeploy**, because some values are built into the site.
   - Every push to `main` (or `master`) updates the live site. Other branches get preview links.
   - `vercel.json` runs the website in **Frankfurt (fra1)**, next to the database. If your Neon project is in another region, change `regions` in `vercel.json` to the nearest Vercel region.
6. **Domain:** go to **Settings → Domains** and add `your-domain.com` and `www.your-domain.com`.
   - At your domain registrar, add the **A** and **CNAME** records exactly as Vercel shows them. Keep any existing **MX** (email) records.
   - SSL is automatic.
   - For a `.pk` domain, it is easiest to point the nameservers to Cloudflare (free) or Vercel and manage DNS there.
7. **Scheduled offers:** offers, hero slides and banners start and end on time. The site refreshes its cache every hour, and a daily cron job (`/api/cron/daily`) refreshes it and trims old tracking rows.
   - To have changes appear within minutes, schedule a `POST` to `https://your-domain.com/api/revalidate` with the header `Authorization: Bearer <REVALIDATE_SECRET>`. Use a free service such as cron-job.org, every 10 minutes.
8. **Search:** in Google Search Console, verify the domain (paste the code in **Admin → Site settings**) and submit `https://your-domain.com/sitemap.xml`.

> **Hosting note:** Vercel's free *Hobby* plan is for non-commercial use. For a business site, plan to upgrade to **Pro** at launch (about US$20/month), or host on Cloudflare.

---

## 4. Using the admin

| Task | Where |
|---|---|
| Add a product | **Products → Add product**: name, photos (compressed automatically), price, options with extra cost, details. It saves as a hidden draft until you click **Publish**. |
| Put things on sale | **Offers → New offer**: choose % or Rs. off, which categories/collections/products, and start/end times. The lowest price always wins; offers never stack. |
| Change the home page | **Home page**: drag to reorder sections, switch them on or off, choose the products each one shows. |
| Change the big slides | **Hero slides**: desktop image (landscape) and an optional mobile image (portrait). Press Enter in the heading to choose line breaks. |
| Top-of-page message | **Announcement bar**: several messages rotate. |
| Approve reviews | **Reviews**: website reviews wait for approval; you can also add reviews you received on WhatsApp. |
| WhatsApp number and message | **Site settings → WhatsApp** (owner only). Placeholders: `{{product}} {{options}} {{quantity}} {{price}} {{total}} {{sku}} {{url}}`. |
| Messages from the website | **Inbox**: reply on WhatsApp in one tap. |
| Analytics | **Site settings → Analytics**: paste your GA4 ID and/or Meta Pixel ID. WhatsApp clicks are tracked as leads. |

Every save updates the website within seconds. The **Dashboard** shows a setup checklist, WhatsApp clicks per product, recent changes and storage use.

**Photo tips:** square or 4:5 photos on a plain, warm background, at least 1600 px wide. Hero images should be about 2400 × 1050 (desktop) and 1080 × 1350 (mobile).

---

## 5. Decisions made for you (change any of them)

These follow the defaults from the plan:

- **Pricing:** prices shown as "Rs. 125,000". Options add a fixed extra cost. When a sale price and an offer both apply, the **lowest price wins** and offers don't stack. Out-of-stock items stay visible with "Ask about availability". "Price on request" is supported per product.
- **WhatsApp:** one number. The order message includes the product, options, quantity, price, SKU and a link that reopens the page with the same options. The floating button uses WhatsApp green; the main order button uses Dark Walnut.
- **Reviews:** customers can submit reviews on the site (moderated), and admins can add reviews too.
- **Contact form:** saved to the admin inbox, then the customer can continue on WhatsApp with the message pre-filled.
- **Newsletter:** emails are collected and can be exported as CSV (Admin → Subscribers).
- **Intro animation:** home page only, once per visit. You can switch it off in Settings.
- **Featured collection:** "editorial" layout. A horizontal-scroll layout is available in Home page settings.
- **Page transitions:** soft cross-fade only.
- **Placeholders to replace:**
  - WhatsApp number (`+92 300 0000000`)
  - Showroom address
  - Social links
  - The figures in the brand story ("5,000+ happy homes", etc.); only use real numbers
  - Demo photos

  The dashboard checklist tracks most of these. Change the figures in **Home page → Brand story**.
- **Demo photography** is from Unsplash (free licence) and is only a placeholder. Replace it with your own product photos.
- **Policy pages** are sensible drafts. Please review them (they are not legal advice).

---

## 6. Developer reference

```bash
npm run dev            # local development
npm run build          # production build
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm test               # unit tests (pricing, WhatsApp messages, search, filters)
npm run db:check       # runs every migration + seed in an in-memory Postgres and tests the triggers
npm run db:setup       # creates the tables + starter content in the database in DATABASE_URL
npm run admin:create   # creates the owner account, or resets an admin's password
npm run test:e2e       # browser smoke test against a running site (default http://localhost:3000, or pass a URL)
npm run db:seed-file   # regenerate db/seed.sql from src/lib/demo/data.ts
npm run brand:assets   # regenerate logo crops, favicon and share image from assets/brand/logo-source.png
npm run icons:generate # regenerate the lightweight icon set
```

**Structure**

```
src/app/(site)/         public pages
src/app/admin/          admin panel (login + (panel) protected area)
src/app/api/            search, product cards, WhatsApp click beacon, revalidate, cron, CSV export
src/components/         site, home, catalog, product, content, motion, admin, ui
src/lib/data/           cached site snapshot (getSiteData), filters, search, sections
src/lib/admin/          admin auth, field definitions, data, server actions
src/lib/auth/           session cookie, password hashing, two-step codes
src/lib/db/             Neon client and safe SQL builders
src/lib/pricing.ts      offers, sale prices and option prices (unit tested)
src/lib/whatsapp.ts     wa.me links and message templates (unit tested)
db/migrations/          schema and triggers (db/setup.sql = migrations + seed)
```

**How data flows**

- All public pages read one cached snapshot (`getSiteData`, tagged `site`).
- Admin saves call `updateTag('site')`, so the site refreshes instantly. The hourly cache lifetime, the daily cron job and the optional `/api/revalidate` ping pick up offers that start or end.
- Without `DATABASE_URL`, the snapshot comes from `src/lib/demo/data.ts`.

**Security**

- The database is only reached from the server (`DATABASE_URL` is never sent to the browser). Public pages query published rows only.
- Admins sign in with an email and password (scrypt-hashed), plus an optional authenticator-app code. The session is an HMAC-signed, HTTP-only cookie (`AUTH_SECRET`).
- Admin access is checked in the proxy, the admin layout and every server action/upload. A password reset or removal signs that person out everywhere.
- Every SQL statement is parameterised, and table and column names are checked against a fixed list.
- Public forms are inserted by the server after a honeypot check, optional Cloudflare Turnstile, and rate limits.
- Rich text is sanitised on save and again when displayed.

**Images**

- Uploads are compressed in the browser into 480/960/1600 px WebP files and stored in Vercel Blob and served directly through a custom loader. They don't use Vercel's image quota.
- Deleting or replacing an image removes its files.

**Motion**

- Lenis runs on desktop only; phones keep native scrolling.
- GSAP reveals start once the page is idle, and each element is set up only as it nears the screen.
- Above-the-fold animations are pure CSS, so they never wait for JavaScript.
- Everything respects "reduced motion" and Data Saver.
