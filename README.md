# Looma Comfort

The website and admin panel for **Looma Comfort**, premium furniture in Pakistan. Customers browse the collection and order on WhatsApp. There is no cart or online payment.

- **Public site:** home page, shop with filters, categories, collections, product pages, best sellers, new arrivals, sale, search, wishlist, about, contact, custom furniture, FAQs, policies, branded 404.
- **Admin panel** (`/admin`): products, categories, collections, materials, home page sections, hero slides, offers (scheduled, applied automatically), promo banners, announcement bar, reviews, pages, FAQs, inbox, newsletter subscribers, site settings, team, and two-step sign in.
- **Stack:** Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, Storage), Vercel. Motion: Lenis, GSAP with ScrollTrigger and SplitText, and Motion (framer-motion).

---

## 1. Run it on your computer (2 minutes)

You need **Node.js 20.9 or newer**.

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no Supabase keys, the site runs in **demo mode**:

- The site uses the built-in sample catalogue (29 products, demo photography).
- `/admin` opens a read-only preview of the admin panel with the same data. You can explore every screen, but nothing is saved.

---

## 2. Connect Supabase (database, login, image storage)

1. Create a free account at https://supabase.com and click **New project**.
   - **Region:** *South Asia (Mumbai)*, the closest to Pakistan.
   - Save the database password in a password manager.
2. **Create the database.** Use one of these two ways.
   - **Easiest (no tools):** open **SQL Editor** in Supabase, paste the whole of `supabase/setup.sql` and click **Run**, once.
     It creates every table, the security rules, the image folders and the scheduler, and loads the starting catalogue, pages, FAQs and settings.
     If it reports that `pg_cron` or `pg_net` is unavailable, enable both under **Database → Extensions** and run it again (a failed run changes nothing).
     `setup.sql` is all of `supabase/migrations/` plus `supabase/seed.sql` in one file; after changing either, run `npm run db:bundle`.
   - **Or with the CLI:** run `npx supabase login`, then `npx supabase link --project-ref <your-ref>`, then `npx supabase db push --include-seed`.
3. **Authentication → Sign In / Providers:**
   - Turn **off** "Allow new users to sign up". Only people you invite can become admins.
4. **Authentication → URL Configuration:**
   - **Site URL:** `https://your-domain.com`
   - **Redirect URLs:** add `https://your-domain.com/**` and `http://localhost:3000/**` (password-reset links come back to `/auth/callback?next=…`)
5. **Create your owner account.**
   - In **Authentication → Users**, click **Add user** (or invite yourself) with your email and a strong password.
   - Then in the **SQL Editor**, run:
     ```sql
     insert into public.admin_users (user_id, email, role, full_name)
     select id, email, 'owner', 'Your Name' from auth.users where email = 'you@example.com';
     ```
6. **API keys:** in **Project Settings → API Keys**, copy:
   - the **Project URL**
   - the **publishable** key
   - the **secret** key
7. **Environment variables:** create `.env.local` from `.env.example` and fill in those keys, plus two long random strings for `REVALIDATE_SECRET` and `CRON_SECRET`.
8. Restart `npm run dev` and sign in at http://localhost:3000/admin.

**Emails (password reset, invites).** Supabase's built-in email is limited and only reaches your own team members. For reliable emails:

- Create a free account at https://resend.com.
- Add its DNS records to your domain.
- Enter its SMTP details under **Authentication → Emails → SMTP Settings**.

---

## 3. Deploy to Vercel and connect your domain

1. Push this folder to a **private** GitHub repository.
2. In https://vercel.com, click **Add New → Project**, import the repository, and keep the defaults.
3. Add every variable from `.env.example` under **Settings → Environment Variables**:
   - Set `NEXT_PUBLIC_SITE_URL` to `https://your-domain.com`.
   - Use **separate values** for the Production and Preview environments.
4. **Settings → Functions → Region:** choose **Mumbai (bom1)**, next to the database. `vercel.json` also sets this.
5. **Deploy.** Every push to `main` updates the live site. Other branches get preview links.
6. **Domain:** go to **Settings → Domains** and add `your-domain.com` and `www.your-domain.com`.
   - At your domain registrar, add the **A** and **CNAME** records exactly as Vercel shows them. Keep any existing **MX** (email) records.
   - SSL is automatic.
   - For a `.pk` domain, it is easiest to point the nameservers to Cloudflare (free) or Vercel and manage DNS there.
7. **Scheduled offers:** offers, hero slides and banners start and end on time automatically. In Supabase **SQL Editor**, run this once:
   ```sql
   select vault.create_secret('https://your-domain.com/api/revalidate', 'revalidate_url');
   select vault.create_secret('<same value as REVALIDATE_SECRET>', 'revalidate_secret');
   ```
   Without this, scheduled changes still appear within an hour.
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
npm run db:check       # runs every migration + seed in an in-memory Postgres and tests the security rules
npm run test:e2e       # browser smoke test against a running site (default http://localhost:3000, or pass a URL)
npm run db:seed-file   # regenerate supabase/seed.sql from src/lib/demo/data.ts
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
src/lib/pricing.ts      offers, sale prices and option prices (unit tested)
src/lib/whatsapp.ts     wa.me links and message templates (unit tested)
supabase/migrations/    schema, Row Level Security, storage, scheduler
```

**How data flows**

- All public pages read one cached snapshot (`getSiteData`, tagged `site`).
- Admin saves call `updateTag('site')`, so the site refreshes instantly. The database scheduler calls `/api/revalidate` when an offer starts or ends.
- Without Supabase keys, the snapshot comes from `src/lib/demo/data.ts`.

**Security**

- Visitors can only read published content (Row Level Security).
- Every write requires a row in `admin_users`.
- Admin access is checked four times: in the proxy, the admin layout, every server action, and by RLS.
- Public forms are inserted by the server after a honeypot check, optional Cloudflare Turnstile, and rate limits.
- Rich text is sanitised on save and again when displayed.

**Images**

- Uploads are compressed in the browser into 480/960/1600 px WebP files and served directly from Supabase Storage through a custom loader. They don't use Vercel's image quota.
- Deleting or replacing an image removes its files.

**Motion**

- Lenis runs on desktop only; phones keep native scrolling.
- GSAP reveals start once the page is idle, and each element is set up only as it nears the screen.
- Above-the-fold animations are pure CSS, so they never wait for JavaScript.
- Everything respects "reduced motion" and Data Saver.
