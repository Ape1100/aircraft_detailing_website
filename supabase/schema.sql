-- Brightwork Supabase schema
-- Run this against a fresh Supabase project (SQL Editor > New query > Run).
-- Assumes Supabase Auth is used for sign-in; profiles.id matches auth.users.id.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role as enum ('client', 'admin');

create type aircraft_category as enum (
  'piston_single', 'piston_twin', 'turboprop', 'light_jet', 'mid_size_jet',
  'heavy_jet', 'helicopter', 'experimental', 'warbird', 'other'
);

create type request_status as enum (
  'requested', 'quote_sent', 'approved', 'scheduled', 'in_progress',
  'completed', 'paid', 'archived', 'cancelled'
);

create type invoice_status as enum ('unpaid', 'deposit_paid', 'paid', 'overdue');

create type membership_tier as enum ('ramp_ready', 'owner_care', 'preservation', 'fleet_fbo');

-- 'verified' means an admin has physically confirmed the aircraft/job in
-- person and locked in the number — this is the ONLY status that may be
-- charged via Stripe. See create-checkout-session.ts's policy comment.
create type custom_quote_status as enum ('draft', 'sent', 'accepted', 'verified');

create type observed_issue_category as enum (
  'paint_chips', 'scratches', 'corrosion_observation', 'loose_missing_fastener',
  'fluid_staining', 'tire_wheel_observation', 'window_condition',
  'seal_trim_condition', 'interior_wear', 'other'
);

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'client',
  name text not null,
  email text not null,
  phone text,
  company text,
  created_at timestamptz not null default now()
);

create table aircraft (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  tail_number text not null,
  make text not null,
  model text not null,
  category aircraft_category not null,
  year int,
  home_airport text,
  hangared boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  aircraft_id uuid not null references aircraft (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade,
  status request_status not null default 'requested',
  preferred_date date,
  -- Distinct from preferred_date: that's the client's original ask,
  -- this is the date an admin actually locks in once approved — set
  -- when status transitions to 'scheduled'. Drives the admin calendar
  -- (src/pages/admin/AdminCalendar.tsx); requests with no scheduled_date
  -- don't appear there.
  scheduled_date date,
  airport_location text not null,
  fbo_name text,
  notes text,
  -- Separate from the client's own `notes` above on purpose: an admin's
  -- price-adjustment justification and aircraft-condition observations
  -- should never overwrite or blend with what the client originally
  -- wrote. Admin-only — not shown anywhere in the client portal.
  admin_notes text,
  estimate_low numeric(10, 2),
  estimate_high numeric(10, 2),
  created_at timestamptz not null default now()
);

create table service_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests (id) on delete cascade,
  service_code text not null,
  created_at timestamptz not null default now()
);

-- Photos of the aircraft attached to a request — either the client at
-- submission time, or an admin while physically at the aircraft, both
-- uploaded to the aircraft-photos storage bucket below under
-- <request's client_id>/<request_id>/<filename>. Always the owning
-- client's id as the folder prefix regardless of who actually uploads —
-- the storage RLS policy grants read/write to that folder's owner OR an
-- admin, so using the client's id (not the uploader's) is what lets the
-- client read back a photo an admin uploaded, and vice versa. `url`
-- stores that storage path, not a public URL — the bucket is private,
-- so callers resolve it to a signed URL on demand (see getSignedPhotoUrl
-- in supabase-client-hooks.ts).
create table request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests (id) on delete cascade,
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- On-site, per-task checklist for a job — separate from the request's own
-- `services` array, since a bundle like complete_detail is really several
-- physical tasks (see BUNDLE_MAP in supabase-client-hooks.ts). Seeded once
-- (check-then-insert) the first time a request's checklist is opened, not
-- regenerated on every load. This is an internal field-ops tool, not
-- client-facing — RLS below is intentionally admin-only, unlike every
-- other table in this schema which is "owner or admin".
create table request_checklist_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests (id) on delete cascade,
  -- Bare ServiceCode for an atomic service (e.g. "exterior_wash"); for a
  -- bundle's expanded sub-task, "<bundle_code>__<sub_code>" (e.g.
  -- "complete_detail__exterior_wash") so it never collides with that same
  -- service selected standalone on the same request.
  item_code text not null,
  label text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests (id) on delete cascade,
  amount numeric(10, 2) not null,
  sent_at timestamptz not null default now(),
  expires_at timestamptz,
  accepted boolean not null default false
);

-- Admin-built one-off quotes (see src/pages/admin/AdminCustomQuote.tsx).
-- client_id is plain text, not a uuid FK to profiles: the admin portal's
-- client list is still mock data (MOCK_ADMIN_CLIENTS, ids like "client-1"),
-- unrelated to real Supabase profiles. Until that's wired up, the "owner"
-- half of the RLS policy below won't match anything in practice — only
-- is_admin() grants access. request_id is similarly a bare uuid with no FK
-- (the request-prefill flow in AdminCustomQuote.tsx is also still mock
-- data), so this table has no hard dependency on service_requests existing.
create table custom_quotes (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  client_name text not null,
  request_id uuid,
  line_items jsonb not null default '[]'::jsonb,
  applied_discount_ids text[] not null default '{}',
  notes text,
  subtotal numeric(10, 2) not null,
  discount_total numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  status custom_quote_status not null default 'draft',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  stripe_checkout_session_id text,
  -- Set by stripe-webhook.ts on checkout.session.completed. Separate
  -- from `status`: status tracks the verification/finalization
  -- lifecycle (draft -> ... -> verified), paid_at tracks whether the
  -- Stripe charge actually went through, since those are different
  -- facts that can't both be represented by a single status column.
  paid_at timestamptz
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  request_id uuid references service_requests (id) on delete set null,
  amount numeric(10, 2) not null,
  deposit_amount numeric(10, 2),
  status invoice_status not null default 'unpaid',
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  stripe_payment_intent_id text
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  amount numeric(10, 2) not null,
  method text not null default 'card',
  paid_at timestamptz not null default now(),
  stripe_charge_id text
);

-- Stripe documents that webhook events may be delivered more than once;
-- stripe-webhook.ts checks for an existing row before inserting, but that
-- check-then-insert is not atomic against a near-simultaneous duplicate
-- delivery. This constraint is the actual backstop — a second insert for
-- the same charge fails with 23505, which the webhook handler treats as
-- "already processed" rather than a real error.
create unique index payments_invoice_charge_unique on payments (invoice_id, stripe_charge_id)
  where stripe_charge_id is not null;

create table memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  tier membership_tier not null,
  monthly_amount numeric(10, 2),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  stripe_subscription_id text
);

-- Same rationale as payments_invoice_charge_unique above, for the
-- subscription-created path in stripe-webhook.ts.
create unique index memberships_subscription_unique on memberships (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table detailing_reports (
  id uuid primary key default gen_random_uuid(),
  aircraft_id uuid not null references aircraft (id) on delete cascade,
  client_id uuid not null references profiles (id) on delete cascade,
  service_date date not null,
  location text not null,
  services_performed text[],
  -- Per-service price after the admin's manual up/down adjustment, plus
  -- the unadjusted category-multiplier base price it started from (see
  -- calculateServiceBasePrice in pricing-engine.ts) — an array of
  -- {code, name, basePrice, finalPrice}, mirroring the jsonb line_items
  -- pattern already used on custom_quotes.
  service_prices jsonb not null default '[]'::jsonb,
  total numeric(10, 2),
  -- Set once the report has been emailed to the client (see
  -- send-report-email.ts) — null means still a draft. Deliberately a
  -- separate confirm step from the initial save, not implied by mere
  -- existence of the row, so a half-finished report never gets emailed
  -- by accident.
  confirmed_at timestamptz,
  products_used text[],
  technician_notes text,
  recommendations text,
  -- This disclaimer is required on every report and should not be removed
  -- or altered by application code; it is stored alongside each report.
  disclaimer text not null default
    'This report is for appearance and cleaning documentation only. It is not an FAA inspection, maintenance release, repair recommendation, or airworthiness determination. Any maintenance-related concerns should be reviewed by a qualified A&P mechanic, IA, or approved maintenance provider.',
  created_at timestamptz not null default now()
);

create table report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references detailing_reports (id) on delete cascade,
  url text not null,
  kind text not null check (kind in ('before', 'after', 'observed_issue')),
  caption text
);

create table observed_issues (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references detailing_reports (id) on delete cascade,
  category observed_issue_category not null,
  note text not null,
  photo_id uuid references report_photos (id) on delete set null
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  aircraft_id uuid references aircraft (id) on delete set null,
  url text not null,
  label text not null,
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- Clients can only see/manage their own records. Admins can see/manage all.
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table aircraft enable row level security;
alter table service_requests enable row level security;
alter table service_items enable row level security;
alter table request_photos enable row level security;
alter table request_checklist_items enable row level security;
alter table quotes enable row level security;
alter table custom_quotes enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table memberships enable row level security;
alter table detailing_reports enable row level security;
alter table report_photos enable row level security;
alter table observed_issues enable row level security;
alter table documents enable row level security;

-- Helper: is the current user an admin?
create function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

create policy "Profiles: self or admin read" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "Profiles: self update" on profiles
  for update using (id = auth.uid() or is_admin());

-- profiles deliberately has NO insert policy for normal clients/admins to
-- use directly. The only supported way a profiles row is created is the
-- trigger below, which runs as the function owner (security definer) and
-- so bypasses RLS entirely — it fires the moment a row lands in
-- auth.users, regardless of whether email confirmation is pending (the
-- client may not have an authenticated session yet at that point, so any
-- auth.uid()-keyed insert policy would still fail anyway). Do not "fix"
-- a broken signup by adding a client-side insert policy instead of using
-- this trigger.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, email, company)
  values (
    new.id,
    'client',
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'company'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "Aircraft: owner or admin" on aircraft
  for all using (owner_id = auth.uid() or is_admin());

create policy "Requests: owner or admin" on service_requests
  for all using (client_id = auth.uid() or is_admin());

create policy "Service items: via parent request" on service_items
  for all using (
    is_admin() or exists (
      select 1 from service_requests sr
      where sr.id = service_items.request_id and sr.client_id = auth.uid()
    )
  );

create policy "Request photos: via parent request" on request_photos
  for all using (
    is_admin() or exists (
      select 1 from service_requests sr
      where sr.id = request_photos.request_id and sr.client_id = auth.uid()
    )
  );

-- Admin-only, unlike the "owner or admin" pattern above — see the
-- request_checklist_items table comment for why.
create policy "Checklist items: admin only" on request_checklist_items
  for all using (is_admin());

create policy "Quotes: via parent request" on quotes
  for all using (
    is_admin() or exists (
      select 1 from service_requests sr
      where sr.id = quotes.request_id and sr.client_id = auth.uid()
    )
  );

create policy "Custom quotes: owner or admin" on custom_quotes
  for all using (client_id = (auth.uid())::text or is_admin());

create policy "Invoices: owner or admin" on invoices
  for all using (client_id = auth.uid() or is_admin());

create policy "Payments: via parent invoice" on payments
  for all using (
    is_admin() or exists (
      select 1 from invoices i where i.id = payments.invoice_id and i.client_id = auth.uid()
    )
  );

create policy "Memberships: owner or admin" on memberships
  for all using (client_id = auth.uid() or is_admin());

create policy "Reports: owner or admin" on detailing_reports
  for all using (client_id = auth.uid() or is_admin());

create policy "Report photos: via parent report" on report_photos
  for all using (
    is_admin() or exists (
      select 1 from detailing_reports r where r.id = report_photos.report_id and r.client_id = auth.uid()
    )
  );

create policy "Observed issues: via parent report" on observed_issues
  for all using (
    is_admin() or exists (
      select 1 from detailing_reports r where r.id = observed_issues.report_id and r.client_id = auth.uid()
    )
  );

create policy "Documents: owner or admin" on documents
  for all using (client_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------
-- Storage buckets
-- Run separately if your Supabase project disallows DDL on storage.buckets
-- from the SQL editor — in that case create these from Storage > New bucket
-- in the dashboard instead, using the same names, all private.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('aircraft-photos', 'aircraft-photos', false),
  ('report-photos', 'report-photos', false),
  ('documents', 'documents', false),
  ('invoices', 'invoices', false),
  ('detailing-reports', 'detailing-reports', false)
on conflict (id) do nothing;

-- Example storage policy: clients can only read objects in a folder named
-- after their own user id (e.g. aircraft-photos/<user_id>/...). Admins can
-- read everything. Adjust the folder convention in your upload code to match.
create policy "Storage: owner folder or admin read"
  on storage.objects for select
  using (
    is_admin() or (auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Storage: owner folder or admin write"
  on storage.objects for insert
  with check (
    is_admin() or (auth.uid())::text = (storage.foldername(name))[1]
  );
