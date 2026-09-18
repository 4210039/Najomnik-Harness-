-- ============================================================================
-- NájomApp — migration 0001: the `candidates` table
--
-- HOW TO APPLY
--   Supabase dashboard -> SQL Editor -> New query -> paste this whole file -> Run.
--   The file is idempotent-ish and non-destructive: it only creates. Re-running
--   it after a partial failure will error on the already-created objects, which
--   is safe — read the error, apply the missing part.
--
-- STORAGE MODEL
--   The canonical applicant record (spec §3.3) is NESTED:
--     personal{}, residence{}, studyWork{}, apartment{}, situation{}, owner{}
--   Postgres stores it as FLAT snake_case columns, and
--   `app/src/lib/candidates.ts` rebuilds the nested shape at the TypeScript
--   boundary. The spec's shape is therefore preserved wherever it is observable.
--   Rationale: Sprint 5 filters (rating, employment, origin, move-in range) and
--   Sprint 10.2 cursor pagination need indexable columns; `jsonb` would turn
--   every filter into a `->>` expression with no usable indexes.
--
-- SECURITY POSTURE (fail-closed)
--   * RLS is enabled explicitly here (not only via the automatic-RLS trigger).
--   * `anon` — the public tenant form — may INSERT one application and can never
--     read anything back. That is the whole point: an applicant must not be able
--     to enumerate other applicants.
--   * Reads require `authenticated` (the landlord).
--   * `service_role` bypasses RLS by design and is NEVER used in the browser.
--   * No automatic grants: this project was created with "Automatically expose
--     new tables" OFF, so the GRANT statements below are load-bearing. Without
--     them the Data API cannot reach the table at all.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- 2. candidates
--
--    Enum-like fields use `text` + a CHECK constraint rather than a Postgres
--    ENUM type. Rationale: adding a value to an enum is a non-transactional
--    DDL change, which is awkward when migrations are applied by hand. A CHECK
--    constraint is a one-line ALTER.
-- ---------------------------------------------------------------------------
create table public.candidates (
  id uuid primary key default gen_random_uuid(),

  -- ── lifecycle ────────────────────────────────────────────────────────────
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'reviewing', 'shortlisted', 'rejected', 'archived')),

  -- Populated from `?listing=<id>` (Sprint 9.3). Nullable until public.listings
  -- exists; the FOREIGN KEY is added in a later migration so this table can be
  -- seeded early without a painful backfill (see the plan's Sprint 2 note).
  listing_id uuid,

  -- ── personal{} ───────────────────────────────────────────────────────────
  first_name text not null,
  last_name  text not null,
  dob        date,
  -- Sensitive personal data. Never logged, never printed, never shown in the
  -- owner list view — only in the full detail panel (spec §7, §11).
  rc                text,
  op_number         text,
  passport_number   text,
  phone        text not null,
  email        text not null,
  extra_contact text,

  -- ── residence{} ──────────────────────────────────────────────────────────
  origin text,
  -- Kept as text: the form collects a human answer ("3", "od detstva"), and
  -- nothing filters on it numerically. Promote to integer only if that changes.
  bratislava_years text,

  -- ── studyWork{} ──────────────────────────────────────────────────────────
  student_status text
    check (student_status is null or student_status in ('fullTime', 'partTime', 'no')),
  school     text,
  year_level text,
  employment_status text
    check (employment_status is null or employment_status in ('tpp', 'szco', 'brigada', 'no')),
  employer            text,
  employment_duration text,

  -- ── apartment{} ──────────────────────────────────────────────────────────
  must_have    text,
  nice_to_have text,
  dream        text,
  likes        text,
  -- A real `date`, not text: Sprint 5 filters on a move-in range and Sprint 5.2
  -- buckets urgency into 30/60/90 days.
  move_in_date date,

  -- ── situation{} ──────────────────────────────────────────────────────────
  current_situation text,
  additional_info   text,

  -- ── owner{} ──────────────────────────────────────────────────────────────
  facebook_url text,
  -- 0–5 in half-star steps. The `* 2 = floor(* 2)` clause rejects 3.7, 4.3 etc.
  rating numeric(2, 1)
    check (rating is null or (rating >= 0 and rating <= 5 and rating * 2 = floor(rating * 2))),
  notes text
);


-- ---------------------------------------------------------------------------
-- 3. Column documentation
--    The `rc` note is deliberate: it surfaces the obligation to whoever opens
--    the table in the dashboard, not just to whoever reads the app code.
-- ---------------------------------------------------------------------------
comment on column public.candidates.rc is
  'Rodné číslo — sensitive personal data. Never log it, never include it in export filenames or URLs, never display it in the owner list view. Handle in line with Slovak data-protection legislation.';
comment on column public.candidates.status is
  'Application pipeline stage. New tenant submissions always arrive as pending.';
comment on column public.candidates.listing_id is
  'Owning property. Null until Sprint 9.3 wires listings to applications.';


-- ---------------------------------------------------------------------------
-- 4. Indexes
--    Chosen for the query patterns the roadmap actually needs, not speculatively.
-- ---------------------------------------------------------------------------
-- Sprint 5.1 / 9.3 — scope the list to one property.
create index candidates_listing_id_idx on public.candidates (listing_id);
-- Default dashboard ordering and Sprint 5.2 "new this week".
create index candidates_created_at_idx on public.candidates (created_at desc);
-- Sprint 5.1 minimum-rating filter and rating sort.
create index candidates_rating_idx on public.candidates (rating desc nulls last);
-- Sprint 5.1 employment-type filter.
create index candidates_employment_status_idx on public.candidates (employment_status);
-- Sprint 5.1 move-in date range and Sprint 5.2 30/60/90-day urgency buckets.
create index candidates_move_in_date_idx on public.candidates (move_in_date);
-- Pipeline counts on the listing detail page (Sprint 9.3).
create index candidates_status_idx on public.candidates (status);


-- ---------------------------------------------------------------------------
-- 5. updated_at trigger
-- ---------------------------------------------------------------------------
create trigger candidates_touch_updated_at
  before update on public.candidates
  for each row
  execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 6. Row Level Security
--
--    Enabled explicitly, even though the project was created with the
--    automatic-RLS trigger ON. Belt and braces: this migration must be
--    self-sufficient, and it documents the intent in version control.
--    RLS with zero policies is a full deny — which is where we start.
-- ---------------------------------------------------------------------------
alter table public.candidates enable row level security;


-- ---------------------------------------------------------------------------
-- 7. Grants — mandatory on this project
--    "Automatically expose new tables" is OFF, so nothing is reachable until
--    it is granted here. Grants and RLS are two independent layers: grants say
--    WHICH ROLE may touch the table, policies say WHICH ROWS.
-- ---------------------------------------------------------------------------
-- The public tenant form may create a row and nothing else. No SELECT grant is
-- given to anon, so an applicant can never read back — or enumerate — other
-- applications. This is the single most important line in the file.
grant insert on table public.candidates to anon;

-- The landlord gets full CRUD; the policies below decide which rows.
grant select, insert, update, delete on table public.candidates to authenticated;


-- ---------------------------------------------------------------------------
-- 8. Policies
-- ---------------------------------------------------------------------------
-- Applicant (unauthenticated): may submit, may not read, and may not pre-fill
-- owner-side fields. Without this `with check`, a crafted request could post a
-- self-awarded 5-star rating or inject notes.
create policy applicants_may_submit
  on public.candidates
  for insert
  to anon
  with check (
    status = 'pending'
    and rating is null
    and notes is null
  );

-- Landlord: full access to every row.
--
-- TODO (Sprint 4.1): tighten these four to the signed-in landlord, e.g.
--   using ((select auth.uid()) = landlord_id)
-- once a landlord/profile table exists and candidates carries `landlord_id`.
-- At that point multi-landlord isolation becomes real. Until then, "authenticated"
-- means "the one account I created" — which is only true if PUBLIC SIGNUPS ARE
-- DISABLED (Authentication -> Sign In / Providers -> disable "Allow new users to
-- sign up"). Leaving signups open while these policies say `true` would let any
-- stranger register and read every applicant. Do not deploy before that is off.
create policy landlord_can_read
  on public.candidates for select
  to authenticated
  using (true);

create policy landlord_can_insert
  on public.candidates for insert
  to authenticated
  with check (true);

create policy landlord_can_update
  on public.candidates for update
  to authenticated
  using (true) with check (true);

create policy landlord_can_delete
  on public.candidates for delete
  to authenticated
  using (true);


-- ---------------------------------------------------------------------------
-- 9. Verification — run these separately after the migration succeeds.
--
-- (a) RLS really is on. Expect relrowsecurity = true.
--     select relname, relrowsecurity from pg_class where relname = 'candidates';
--
-- (b) Grants are exactly as intended. Expect anon -> INSERT only, and
--     authenticated -> SELECT/INSERT/UPDATE/DELETE.
--     select grantee, privilege_type
--       from information_schema.role_table_grants
--      where table_name = 'candidates'
--      order by grantee, privilege_type;
--
-- (c) Policies exist and none is unexpectedly permissive to anon.
--     select policyname, roles, cmd from pg_policies where tablename = 'candidates';
--
-- (d) End-to-end smoke test of the tenant path, then clean up:
--     insert into public.candidates (first_name, last_name, phone, email)
--     values ('Test', 'Formular', '+421900000000', 'test@example.com')
--     returning id, status, created_at;
--     -- then: delete from public.candidates where email = 'test@example.com';
-- ============================================================================


