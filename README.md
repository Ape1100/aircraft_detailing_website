# Brightwork — Aircraft Appearance & Preservation Services

A landing page, client portal, and admin portal for a mobile aircraft
detailing business, built with React + Vite + TypeScript + Tailwind CSS.

This project was generated as a complete, working source tree. It has not been run with a real
`npm install` in the environment that produced it (no outbound network access there), but an
offline TypeScript pass was run against it using locally available compiler/type packages to catch
syntax errors, bad imports, and mismatched props — no such errors were found. Follow the steps
below on your own machine to install dependencies and do a normal first run.

## 1. Install and run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

If `npm run dev` surfaces any TypeScript or import errors, they should be
minor — the offline check covered syntax and internal consistency, but
not exact third-party API usage (Radix prop names, etc.) since the real
packages weren't installed when it ran.

## 2. What's included right now

- **Public landing page** — hero, services (launch + advanced/limited), rate card, memberships,
  quick quote form, FAQ. Logo, company name, tagline, and contact info all pull from Admin >
  Settings.
- **Instant Estimate Wizard** (`/estimate`) — 10-step flow wired to the live pricing engine and
  service catalog, so any service or price you add in Admin shows up here automatically.
- **Pricing rule engine** (`src/lib/pricing-engine.ts`) — base price → size multiplier → category
  complexity multiplier → condition modifiers → service package/add-ons → travel fee → membership
  discount → promotional discounts → labor hours → price range. The multipliers themselves are
  editable from Admin > Pricing Rules; nothing is hardcoded.
- **White-label settings layer** (`src/lib/settings-store.tsx`) — a React context holding business
  branding, the service catalog, pricing multipliers, and discount rules, persisted to the
  browser's localStorage so a different detailing business can reconfigure the whole app without
  touching code. (See "Multi-tenant note" below for how to take this further with Supabase.)
- **Admin > Settings** — company logo upload, name, tagline, accent color, contact info, and full
  invoicing configuration (invoice prefix, tax rate, deposit %, payment terms, late fee, footer
  note).
- **Admin > Services** — add, edit, or remove services; every field (name, description, price,
  category, availability) is editable and changes propagate to the landing page, quote form,
  wizard, and report builder instantly.
- **Admin > Pricing Rules** — edit aircraft size/complexity multipliers, condition modifiers,
  membership discount percentages, travel fee rules, and the blended hourly rate used to estimate
  labor.
- **Admin > Discounts** — create holiday/seasonal discounts (date-bound), repeat-customer
  discounts (based on completed service count), and multi-service bundle discounts — all applied
  automatically wherever they match. "Manual" discounts are available only inside the custom quote
  builder for one-off negotiated pricing.
- **Admin > Custom Quote** — build a one-off quote for a specific client: prefill line items from
  an existing request or add them by hand, toggle any discount on or off (with an "auto-suggest
  eligible" shortcut), and save/track the quote's status.
- **Client portal** (`/portal/...`) — dashboard, aircraft, service requests, new request form,
  invoices, detailing reports, membership.
- **Admin portal** (`/admin/...`) — dashboard, clients, requests (status pipeline), the report
  builder (with the required disclaimer), and everything above.
- **Supabase schema** (`supabase/schema.sql`) — tables, row-level security, and storage bucket
  setup, ready to run against a real project.
- **Stripe stubs** (`src/lib/stripe-client.ts`, `netlify/functions/*`) — the calling code and
  serverless function shape are in place; the actual Stripe SDK calls are commented out with TODOs
  so you can drop in your own keys and price IDs.

Everything in the client/admin portals currently reads from `src/lib/mock-data.ts` (clients,
aircraft, requests, invoices, reports) rather than a live database — that's the next step in
section 3 below. Settings, the service catalog, pricing rules, and discounts are *not* mock data;
they're real editable state, just stored in the browser rather than a server for now.

### Multi-tenant note

Right now "white-label" means: one deployment, one business, fully reconfigurable branding and
pricing — perfect for selling/handing this off to a different detailing company as their own app.
Settings persist in `localStorage`, so they're per-browser, not shared across devices or staff
accounts yet. To support multiple independent businesses on one shared deployment (true
multi-tenancy), you'd add a `business_settings` / `services` / `pricing_config` / `discount_rules`
table to Supabase (mirroring the shapes in `src/types/index.ts`), scope every row by a `tenant_id`,
and swap `src/lib/settings-store.tsx`'s localStorage read/write for Supabase queries — the
component layer above it (Admin Settings/Services/Pricing Rules/Discounts pages) wouldn't need to
change at all, since they only talk to the `useSettings()` hook.

## 3. Connect Supabase (auth + data)

1. Create a project at supabase.com.
2. Copy the Project URL and anon key into a `.env.local` file (copy
   `.env.example` as a starting point).
3. Open the Supabase SQL editor and run everything in
   `supabase/schema.sql`. If your project blocks DDL on
   `storage.buckets` from SQL, create the five buckets listed there
   manually under Storage instead (all private).
4. Run `npm install @supabase/supabase-js`, then uncomment the real
   client in `src/lib/supabase-client.ts`.
5. Replace the `MOCK_*` imports in `src/pages/client/*.tsx` and
   `src/pages/admin/*.tsx` with real Supabase queries against the tables
   in the schema.

## 4. Connect Stripe (payments + memberships)

1. Run `npm install stripe @stripe/stripe-js`.
2. Add your publishable key to `.env.local` and your secret key /
   webhook signing secret to your hosting provider's environment
   variables (never commit secret keys).
3. Fill in the commented-out Stripe calls in
   `netlify/functions/create-checkout-session.ts`,
   `create-subscription-session.ts`, and `stripe-webhook.ts`.
4. Create real Stripe Prices for each membership tier and drop the price
   IDs into `create-subscription-session.ts`.

## 5. Push this to your GitHub repo

You already have a repo at:

```
https://github.com/Ape1100/aircraft_detailing_website.git
```

From inside this project folder:

```bash
git init
git remote add origin https://github.com/Ape1100/aircraft_detailing_website.git
git branch -M main
git add .
git commit -m "Initial commit: Brightwork landing page, client/admin portal, pricing engine"
git push -u origin main
```

If the repo already has a README or license file from GitHub's "create
repo" flow, `git pull origin main --allow-unrelated-histories` before the
push, then resolve any conflicts.

## 6. Deploying

The project is set up for Netlify Functions (`netlify/functions/`), but
the frontend itself is a standard Vite app and will also deploy fine to
Vercel or Cloudflare Pages — you'd just relocate the three function files
into that platform's serverless function convention and update the
fetch URLs in `src/lib/stripe-client.ts` accordingly.

## 7. Project structure

```
src/
  types/            Shared TypeScript domain model
  lib/               pricing-engine.ts, settings-store.tsx, mock-data.ts, supabase-client.ts, stripe-client.ts
  components/ui/      Reusable primitives (button, card, badge, input, select, ...)
  components/aviation/  Signature components (N-Number plate, confidence gauge, badges)
  components/layout/  Site header/footer, BrandLogo, shared portal sidebar shell
  pages/landing/      Landing page sections
  pages/wizard/        10-step estimate wizard
  pages/auth/           Login / signup
  pages/client/         Client portal pages
  pages/admin/          Admin portal pages, including Settings, Pricing Rules, Discounts, Custom Quote
supabase/schema.sql    Database schema, RLS policies, storage buckets
netlify/functions/      Stripe serverless function stubs
```
