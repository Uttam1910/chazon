# Chazon Digital Ventures

An npm-workspaces monorepo with three apps that run together:

| App | Path | Dev URL | What it is |
| --- | --- | --- | --- |
| Website | `apps/web` | http://localhost:5173 | The public Chazon website (React + Vite, prerendered to static HTML per page). Renders its built-in copy, then shows what the Admin has published. |
| Admin | `apps/admin` | http://localhost:5174 | Chazon Admin: leads, growth audits, content, media, settings, SEO, users (React + Vite + React Router). |
| API | `apps/api` | http://localhost:5000 | REST API (Express 5, Prisma 7, PostgreSQL). Auth, CMS, enquiry intake, Resend email. |
| Shared | `packages/shared` | — | Domain constants, API types and a safe Markdown renderer used by all three. |

## Demo mode (no database needed)

Add `VITE_DEMO_MODE=true` to `.env` and run `npm run dev`. The Admin (http://localhost:5174, login **demo@chazon.local** / **chazon-demo-2026**, pre-filled) and the website (http://localhost:5173) then use sample data built into the code (`packages/shared/src/demo.ts`). No API or database is used. Everything is clickable and editable, and changes reset when you reload the page. Website enquiries show a success message but aren't sent. Remove the line to switch back to the real API.

## Demo with a local database (see everything with sample data)

```sh
npm install
npm run demo
```

This starts a private PostgreSQL in `.demo/` (git-ignored; needs the PostgreSQL command-line tools, e.g. `brew install postgresql@16`), loads sample leads, audits, articles, case studies and testimonials, and runs all three apps:

- Website: http://localhost:5173
- Admin: http://localhost:5174, signed in as **demo@chazon.local** / **chazon-demo-2026**

Your `.env` and any real database aren't touched, and demo mode sends no emails. Stop `npm run dev` first (they use the same ports). Ctrl+C stops the demo, and `npm run demo:reset` deletes the demo data. Demo records are marked (source "Demo", `demo-` slugs, "Sample" titles) and never go anywhere else.

## Quick start

Requires Node 20.19+ and PostgreSQL.

```sh
npm install                      # installs every workspace and generates the Prisma client
cp .env.example .env             # set DATABASE_URL, AUTH_SECRET (openssl rand -base64 48), ADMIN_EMAIL, ADMIN_PASSWORD
npm run db:migrate               # create/upgrade the database schema
npm run db:seed                  # load Chazon's current services, industries, settings and homepage SEO
npm run dev                      # website :5173, Admin :5174, API :5000
```

Sign in to the Admin at http://localhost:5174 with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`. Those credentials are checked against the environment and never stored in the database.

Run one app at a time with `npm run dev:web`, `npm run dev:admin` or `npm run dev:api`. The website still works without the API; it shows its built-in content, and the enquiry form reports that it couldn't send.

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | All three apps (via `concurrently`). |
| `npm run build` | Builds API (`apps/api/dist`), website (`apps/web/dist`) and Admin (`apps/admin/dist`). Also `build:web`, `build:admin`, `build:api`. |
| `npm run start:api` | Runs the built API (`node apps/api/dist/index.js`). |
| `npm run typecheck` / `npm run lint` | TypeScript in every workspace / ESLint across the repo. |
| `npm test` | Website unit and render tests (Vitest): form validation and submission outcomes, contact channels, every page's metadata, links and structured data. |
| `npm run db:migrate` | `prisma migrate dev` (development: creates and applies migrations). |
| `npm run db:deploy` | `prisma migrate deploy` (production: applies committed migrations only, never resets data). |
| `npm run db:seed` | Idempotent baseline content. Existing rows, including Admin edits, are never overwritten. |
| `npm run db:seed:demo` / `npm run db:demo:clear` | **Development only.** 8 leads + 3 audits named `[Demo] …` with source `Demo`; refuses to run with `NODE_ENV=production`. |
| `npm run admin:create -- --email … --name … [--role EDITOR]` | Optional: creates an additional team user stored in the database (or resets one's password). Reads `NEW_USER_PASSWORD` if set, otherwise prompts without echo. Not needed for the main `.env` login. |
| `npm run db:studio` | Prisma Studio. |

## Configuration

Everything comes from environment variables. See `.env.example` for the full list with notes. The API reads the repository-root `.env`. The website and Admin builds read `VITE_*` values from the root `.env`, `.env.local` and `.env.[mode]`, and those values are public.

- **Required for the API:** `AUTH_SECRET` (32+ chars), plus `ADMIN_EMAIL` + `ADMIN_PASSWORD` (12+ chars) for the Admin login.
- **Database:** `DATABASE_URL` is optional while no database exists. The API still starts and the `.env` Admin can sign in; the Admin shows a "Database not connected" banner, and the website uses its built-in content. Set it and run `npm run db:migrate` to enable leads and content. In production also `PUBLIC_SITE_URL`, `ADMIN_URL` and `API_URL`. The API refuses to start without them.
- **Optional:** `DIRECT_URL` (non-pooled URL for migrations), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CHAZON_NOTIFICATION_EMAIL`, `UPLOAD_DIR`, `TRUST_PROXY`, `SESSION_TTL_HOURS`, `PORT`.
- **Website/Admin builds:** `VITE_API_URL` (defaults to `http://localhost:5000` in dev; **must be set for production builds**, otherwise the website runs without the API, as it did before) and `VITE_SITE_URL`. `VITE_CONTACT_EMAIL`, `VITE_PHONE`, `VITE_WHATSAPP_NUMBER` and `VITE_*_URL` are fallbacks used until set in Admin → Website Settings. `VITE_ENQUIRY_ENDPOINT` overrides where enquiries go. `VITE_BOOKING_URL` (optional) adds a booking link. Without an enquiry endpoint the form says plainly that it can't send, and never shows a success message.

## How the pieces connect

- **Enquiries.** The website's "Let's Talk" form → `POST /api/public/enquiries` → a **Lead**. "Get a Digital Growth Audit" → a **GrowthAudit**. The record is saved first, then emails are sent in the background. A failed email is logged on the record's timeline and never loses the enquiry.
- **Spam and abuse protection:** a hidden honeypot field, a minimum fill time, a link-spam check (these submissions get a fake "accepted" response and are not stored), server-side validation, a per-IP rate limit (5 per 10 minutes) and an origin check. The campaign (`utm_source`) or referring site is captured as the lead source.
- **Content.** `GET /api/public/site` returns published services (grouped under the four fixed pillars), industries, testimonials, case-study summaries, recent insights, settings and SEO. The homepage renders the built-in copy immediately and swaps in this data when it arrives.
  - Testimonials stay hidden until one is published.
  - The Work and Insights sections keep their "in preparation" frameworks until real content is published.
- **Public pages:** `/`, `/services`, one page per pillar (`/services/website-development`, `/services/digital-growth`, `/services/conversion-optimisation`, `/services/business-automation`), `/growth-audit`, `/approach`, `/about`, `/contact`, `/privacy`, `/terms`, plus `/insights` and `/work` (listings). These are prerendered to `dist/<path>/index.html`. Articles and case studies (`/insights/:slug`, `/work/:slug`) are served from `dist/app-shell.html`, an empty shell, so **static hosts must rewrite those two patterns to `/app-shell.html`** (the Vercel configs do). Unknown paths get `dist/404.html` with a 404 status. Old homepage links such as `/?enquiry=audit#contact` still reach the right form.
- **SEO.** Every fixed page is prerendered at build time with its own title, description, canonical, Open Graph tags and JSON-LD (Organization, WebSite, BreadcrumbList, Service, FAQPage, only describing what the page shows), so crawlers get full content without running JavaScript. Admin → SEO overrides the homepage, Insights and Work metadata (global robots flags and OG image apply everywhere). Articles and case studies set their own title, description, canonical and OG tags in the browser. The build writes `sitemap.xml` with the fixed pages (`PUBLIC_PAGES` in `packages/shared`); `GET /api/public/sitemap.xml` lists the same pages plus every published article and case study, and both are named in `robots.txt`. Canonicals, structured data and the sitemap need `VITE_SITE_URL`.
- **Media.** Uploads are decoded with sharp (which rejects non-images and SVG), auto-rotated, stripped of metadata, resized to ≤2400px and stored as WebP in `UPLOAD_DIR` (default `apps/api/uploads`, git-ignored). They are served from `/uploads/…`. Use persistent storage in production.

## Admin

- **Sections:** Dashboard, Leads (search, status/archive filters, sort, pagination, notes, activity timeline, edit, archive, delete), Growth Audits, Services (per pillar: reorder, publish, archive), Work / Case Studies, Insights (Markdown editor with preview, scheduling, SEO), Industries, Testimonials, Media, Website Settings, SEO and Admin Users.
- **Main login:** `ADMIN_EMAIL` / `ADMIN_PASSWORD` (and optional `ADMIN_NAME`) in `.env`, always with the Admin role.
  - The password is compared with the environment value on each sign-in and never written to the database. The session is a signed cookie, so sign-in works without a database. When a database is connected, a matching user row (no password) lets notes and activity show who did what.
  - To change it, edit `.env` and restart the API; that signs out all sessions. Changing `ADMIN_EMAIL` deactivates the old account.
  - The account shows as "Managed in .env" and can't be edited in the app.
  - Additional team members (e.g. Editors) can still be added under Admin Users; they are stored in the database with scrypt-hashed passwords.
- **Roles:** **Admin** can do everything. **Editor** can do everything except manage users and change website settings, and cannot permanently delete leads or audits. The API enforces these rules, not just the UI.
- **Sessions:** server-side, stored as an HMAC of a random token. The cookie is `HttpOnly` and `SameSite=Lax` (`__Host-` prefixed and `Secure` in production), with a 12-hour sliding expiry. Changing or resetting a password, or deactivating a user, signs out their other sessions.
- **Brute-force and CSRF protection:** passwords are hashed with scrypt, and sign-in attempts are rate-limited. State-changing requests must come from `ADMIN_URL`.
- **Production deployment:** the Admin and API must be on the **same site** (e.g. `admin.example.com` and `api.example.com`) so the session cookie is sent. Set `VITE_API_URL` when building the Admin.

## Email (Resend)

Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (a sender on a domain verified in Resend) and `CHAZON_NOTIFICATION_EMAIL`. Each enquiry or audit request sends:

- a notification to Chazon (reply-to: the customer, with a link to the record in the Admin);
- a confirmation to the customer.

The key is used only by the API and never reaches a browser bundle. Without these variables, nothing is sent, and the timeline says so.

## Website content notes

Copy that isn't managed in the Admin (service-page detail, problems, approach, audit scope, FAQs, founder) lives in `apps/web/src/content.ts`. Pages are in `apps/web/src/pages/`, shared sections and layout in `apps/web/src/components/`, routes in `apps/web/src/routes.tsx`, metadata and structured data in `apps/web/src/seo.ts`, and design tokens in `apps/web/src/styles.css` (Instrument Serif, Geist and Geist Mono, self-hosted via Fontsource). Service titles and short descriptions published in the Admin replace the built-in lists on the service pages.

Before launch:

- Add an approved Binny Rogin portrait (`founder.photo` in `content.ts`); until then a typographic monogram is shown.
- Have the privacy notice and website terms (`apps/web/src/pages/Legal.tsx`) reviewed. They describe how this site actually handles data, but they are not legal advice.
- Publish only verified case studies, approved testimonials and real articles. The Admin's editors remind authors not to publish unverified results.
- The privacy and terms texts in the footer are launch placeholders, not final legal policies.

**Analytics.** `track` in `apps/web/src/config.ts` emits `chazon:analytics` DOM events: `cta_click` (location, destination), `form_start`, `form_submission`, `form_error` (reason), `service_page_view`, `whatsapp_click`, `contact_click` and `booking_click`. If a tag manager is added to the page (`window.dataLayer` exists), each event is also pushed there as `chazon_<event>`, where its consent settings apply. No tracking script is loaded by default and no form values or personal data are ever included. To use GA4: add GTM with Consent Mode, create triggers on the `chazon_*` events, and update the privacy notice first.

**Browser checks.** `scripts/check-browser.mjs` checks every page at up to 11 widths (overflow, off-screen content, one H1, named controls, text size, tap targets) plus keyboard navigation of both menus, CTA destinations, the form, the mobile action bar and reduced motion. It needs Playwright in `.tools/` (`npm i --prefix .tools playwright`) and Google Chrome; set `CHECK_URL` to test a preview or production build.

**Booking.** Set `VITE_BOOKING_URL` (an https:// Calendly, Cal.com or similar page) to offer "Book a discovery call" next to the enquiry form. Without it, discovery calls are requested through the form.

## Deploying on Vercel

**One Vercel project serves both apps:**

- `https://<your-site>/` → website
- `https://<your-site>/admin` → Admin

The root `vercel.json` runs `npm run build:vercel` (`scripts/build-vercel.mjs`). It builds the website, builds the Admin with base path `/admin/`, and copies it into `apps/web/dist/admin`. Prerendered pages are served as static files (trailing slashes redirect to the canonical form), rewrites send articles and case studies to the app shell and Admin deep links to the Admin, hashed assets are cached for a year, and Admin pages are sent with `X-Robots-Tag: noindex`.

- **Environment variables** are set in Vercel (Settings → Environment Variables); `.env` is not uploaded.
- **Demo:** `VITE_DEMO_MODE=true` in Vercel puts the **Admin only** in demo mode (login `demo@chazon.local` / `chazon-demo-2026`). The public website is always built without demo data.
- **Standalone Admin (optional):** a separate Vercel project with Root Directory `apps/admin` also works (`apps/admin/vercel.json`); it serves the Admin at `/`.
- **Going live:** host the API on a Node host (e.g. Render/Railway) with PostgreSQL (e.g. Neon/Supabase). Then set `VITE_API_URL` and remove `VITE_DEMO_MODE`. Put the website/Admin and the API on your own domain (e.g. `example.com` + `api.example.com`): a `*.vercel.app` address and the API's address count as different sites, so the sign-in cookie wouldn't be sent.
