# NájomApp — Implementation Plan

> **10 main sprints · 30 mini-sprints · ~14–18 weeks solo part-time**
> From a single HTML file to a full property management SaaS: listing manager,
> applicant CRM, visit scheduler, and contract generator.
> Infrastructure cost: **€0/month**.

Authoritative specification: [`NajomApp_Project_Instructions.md`](NajomApp_Project_Instructions.md).
Operational rule digest: [`.clinerules/najomapp.md`](.clinerules/najomapp.md).
This document is the **roadmap**; where a sprint conflicts with the specification,
the specification wins.

---

## Current status — where we are right now

**Snapshot date: 2026-09-18 · branch `main` · no sprint formally closed.**

The project is in **Sprint 1**, with the **Sprint 2 data layer already written
ahead of schedule in `app/src/lib/`**. Phase 1 (the `najomnik.html` prototype) is
shipped and works, the React rewrite carries a typed, validated, fully tested data
layer, and **the Supabase project now exists: migration 0001 is applied, public
sign-ups are disabled, and the tenant path has been verified end-to-end over the
REST API.** Still outstanding: a landlord account (so no authenticated read has
been exercised yet), migration 0002, and any deployment.

### Verified evidence

| Check | Command | Result |
| --- | --- | --- |
| React + data-layer unit tests | `cd app && npm test` | ✅ 6 files, **97 tests passing** |
| TypeScript strict check | `cd app && npm run typecheck` | ✅ clean, no errors |
| Supabase client singleton | `ls app/src/lib/` | ✅ `supabase.ts` — lazy client, `isSupabaseConfigured` guard, 7 tests |
| Canonical record mapper | `app/src/lib/candidate.ts` | ✅ nested ↔ flat translation, 24 tests |
| Zod validation schemas | `app/src/lib/candidateSchema.ts` | ✅ per-step + whole application + owner review, 25 tests |
| Candidate CRUD | `app/src/lib/candidates.ts` | ✅ list / get / submit / create / update / delete, 25 tests |
| Migration 0001 applied | Supabase SQL Editor | ✅ table, 6 indexes, `updated_at` trigger, RLS + grants |
| Project reachable | `curl $VITE_SUPABASE_URL/auth/v1/health` | ✅ HTTP 200 |
| Vite loads `app/.env.local` | live probe through `listCandidates()` | ✅ `isSupabaseConfigured: true`, reached the real project |
| RLS hides every row from anon | `GET /rest/v1/candidates?select=id` | ✅ HTTP 200, `content-range: */0` — zero rows visible |
| anon cannot read a row back | `POST … Prefer: return=representation` | ✅ HTTP 401, `42501 new row violates row-level security policy` |
| Crafted owner fields rejected | `POST … {"rating":5,"notes":"x"}` | ✅ HTTP 401, `42501` — policy requires `rating is null and notes is null` |
| Crafted status rejected | `POST … {"status":"shortlisted"}` | ✅ HTTP 401, `42501` — policy requires `status = 'pending'` |
| **anon holds surplus grants** | `PATCH` / `DELETE` on a non-existent id | ❌ HTTP **204** — anon carries SELECT, UPDATE and DELETE, not just INSERT → **`0002_harden_anon_grants.sql` written, not yet applied** |
| Landlord account + authenticated read | Supabase dashboard, then `auth.signInWithPassword` | ⬜ not done — this is what still blocks closing 1.2 |
| shadcn/ui initialised | `ls app/components.json` | ❌ not initialised |
| CI workflow | `ls .github/workflows` | ❌ absent |
| Vercel project linked | Vercel dashboard | ⚠️ `app/vercel.json` written, connection unverified |

### Sprint-by-sprint position

| Sprint | Name | Status | Notes |
| --- | --- | --- | --- |
| **S1** | Scaffold | 🟡 **~80 % — in progress** | 1.1 nearly done, 1.2 live but unverified from the landlord side, 1.3 half-configured |
| S2 | Data Layer | 🟡 **data layer live, not closed** | 2.1 + 2.3 written, tested and now pointed at a real project; 2.2 (JSON import tool) not started |
| S3 | Tenant Form in React | ⬜ not started | Runs parallel with S4 |
| S4 | Landlord Dashboard + Auth | ⬜ not started | Runs parallel with S3 |
| S5 | Filters & Analytics | ⬜ not started | |
| S6 | Calendar | ⬜ not started | |
| S7 | Contracts | ⬜ not started | Can overlap S6 |
| S8 | Listings Core | ⬜ not started | |
| S9 | Platform Features | ⬜ not started | |
| S10 | Launch | ⬜ not started | |

### Mini-sprint detail

| Mini-sprint | Status | Evidence / what remains |
| --- | --- | --- |
| 1.1 Vite + React + Tailwind scaffold | 🟡 mostly done | Vite + React + TS running (`app/`); Tailwind CSS **v4** wired via `@tailwindcss/vite` + `@theme` in `src/index.css`; all spec §5.1 tokens ported and mirrored in `src/lib/tokens.ts` with a drift-detecting test; folders `/pages`, `/components`, `/lib` exist; fonts (Inter + DM Serif Display) loaded in `app/index.html`; two-tab shell with ARIA tablist in `src/components/AppHeader.tsx`. **Remaining:** shadcn/ui init, `/hooks` folder, placeholder panels replaced with faithful layout ports. *Deviation: Tailwind v4 is CSS-first, so there is deliberately no `tailwind.config.ts`.* |
| 1.2 Supabase project setup | 🟡 project live, landlord read pending | Project created and `supabase/migrations/0001_init.sql` applied; public sign-ups disabled; `app/.env.local` holds the URL and anon key (git-ignored, mode 600) while the committed `.env.example` stays blank. Verified over REST: reachable (200), anon insert succeeds (201), anon read-back denied (401), a crafted `rating`/`notes` denied (401), a crafted `status` denied (401), anon sees `*/0` rows. `app/src/lib/supabase.ts` is the lazy singleton (7 tests). **Remaining:** create the landlord user, sign in and read a row; apply `0002_harden_anon_grants.sql`; turn "Automatically expose new tables" off in the dashboard. |
| 1.3 Git, Vercel & env config | 🟡 half-configured | Repo on GitHub (`origin`), `app/vercel.json` present (vite framework, `npm ci`, SPA rewrite), `.gitignore` at root and in `app/` excludes `.env.local`, `.env.example` committed with blank values. **Remaining:** actually connecting the repo to Vercel, setting env vars in the dashboard, and verifying a production deploy. |
| 2.1 Supabase CRUD for candidates | 🟡 code complete | `app/src/lib/candidates.ts` — `listCandidates`, `getCandidateById`, `submitApplication` (tenant, insert without read-back because `anon` may not SELECT), `createCandidate`, `updateCandidate`, `updateOwnerReview`, `deleteCandidate`; 25 tests assert the exact PostgREST chain, the flattened payloads and that a failure never echoes Rodné číslo. **Remaining:** replacing the localStorage calls in the UI once Sprint 3/4 screens exist. |
| 2.3 TypeScript data model & validation | 🟡 mostly done | `candidate.ts` (nested canonical record, row/patch/draft types, half-star rating helpers), `candidateSchema.ts` (per-step schemas for Sprint 3.2, whole-application schema, owner-review schema, canonical Slovak error copy) and `listing_id` already nullable in the migration. **Remaining:** `supabase gen types typescript` against the live project to replace the hand-written `CandidateRow`. |

### Security finding — surplus `anon` grants (open, fix ready)

Verifying the live project over the REST API showed that `anon` carries **SELECT,
UPDATE and DELETE** on `public.candidates`, not just the INSERT that migration
0001 intended: `PATCH` and `DELETE` against a **non-existent** id answer `204`
instead of `401 permission denied`, and a read answers `200` with an empty list
instead of being refused. Cause: the project carries Supabase's default
"Automatically expose new tables" grants, so 0001's premise that those grants were
off is untrue for this project.

No applicant data is exposed today — RLS is on, and the only `anon` policy is
`applicants_may_submit` (INSERT), which is why the read returns `*/0` rows. But the
surplus grants are a latent hole: they go live the moment a permissive `anon`
policy is added or RLS is switched off by accident, and 0001's own §9(b)
verification ("expect anon → INSERT only") can no longer pass.

**Fix, written and waiting to be applied:** `supabase/migrations/0002_harden_anon_grants.sql`
(`revoke all on public.candidates from anon` + re-`grant insert`). Its root cause —
**Project Settings → Data API → Automatically expose new tables** — must also be
switched **OFF** in the dashboard, or every table added in later sprints starts
life this permissive.


### Carried forward from Phase 1 — compliance backlog

`najomnik.html` (1,877 lines, ~68 KB) is functional but **predates the
specification** and diverges from it. The full list is
[§12.1 of the instructions](NajomApp_Project_Instructions.md). Highlights the
React rewrite must not inherit:

- Storage keys are `najomnici_v4` / `naj_pw_v3` / `najom_draft` instead of the
  specified `najomapp_applicants` / `najomapp_owner_hash` / `najomapp_active_id`.
- Password "hashing" is `btoa(encodeURIComponent(pw))` (base64, not a hash) and
  falls back to a hardcoded `admin123`.
- The applicant record is **flat**, not the canonical nested shape
  (`personal` / `residence` / `studyWork` / `apartment` / `situation` / `owner`).
- **Zero** ARIA attributes, zero `<label for>` associations, ~64 inline
  `onclick`-family handlers, no `init()` + `DOMContentLoaded` wiring, 35 hardcoded
  hex colours outside `:root`.
- The owner gate is hidden behind a triple-click ghost button rather than the tab.

✅ Verified clean in the prototype: no `var`, no `!important`, no `eval()`, no
`document.write()`, no external JS, CSS variable names match §5.1, size within the
120 KB budget.

### Immediate next actions (start here)

1. **Apply `0002_harden_anon_grants.sql`** and switch
   **Project Settings → Data API → Automatically expose new tables** OFF. Until
   then the project is not fail-closed the way 0001 documents it.
2. **Create the landlord user** (Authentication → Users → Add user → auto-confirm;
   sign-ups stay disabled), sign in once, and confirm an authenticated read
   returns rows. That is the last thing standing between 1.2 and "done".
3. **Finish 1.1** — run `npx shadcn@latest init` in `app/`, add the `/hooks`
   folder, and replace the two placeholder panels with faithful visual ports of
   the prototype layout.
4. **Close 1.3** — connect Vercel (Root Directory = `app`), set
   `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for Production, Preview and
   Development, and verify the production deploy.
5. **Then finish S2** — 2.2 (the one-time JSON import tool) is the only
   mini-sprint left in the data layer before Sprint 3+.

> ⚠️ The owner panel in `app/` is **not yet password-protected** (Sprint 4.1).
> `app/vercel.json` and `app/.env.example` exist, but the build must **not** be
> deployed publicly until authentication lands.

---

## Current State (Phase 1 — `najomnik.html`)

| Status | Feature |
|--------|---------|
| ✅ Done | Multi-step tenant application form |
| ✅ Done | Owner dashboard with candidate list |
| ✅ Done | Candidate CRUD (create, edit, delete) |
| ✅ Done | Star rating (half-star precision) |
| ✅ Done | Facebook profile URL field |
| ✅ Done | JSON export / import |
| ✅ Done | Design system (CSS tokens, typography) |
| ⚠️ Limit | localStorage only — no shared state across devices |
| ⚠️ Limit | No auth — owner view is publicly accessible |
| ⚠️ Limit | No filters, no analytics |
| ⚠️ Limit | No calendar, contracts, or listing manager |
| ⚠️ Limit | No image storage |

---

## Target Stack

| Layer | Tool | Cost |
|-------|------|------|
| Frontend framework | Vite + React + TypeScript | Free |
| Styling | Tailwind CSS + shadcn/ui | Free |
| Database | Supabase Postgres | Free (500 MB) |
| Auth | Supabase Auth | Free |
| File storage | Supabase Storage | Free (1 GB) |
| Real-time | Supabase Realtime | Free |
| Table / filters | TanStack Table | Free |
| Charts | Recharts | Free |
| PDF generation | react-pdf | Free |
| Image compression | browser-image-compression | Free |
| Hosting | Vercel | Free |

---

## Sprint Dependency Map

```
S1 Scaffold  →  S2 Data Layer  →  S3 Tenant Form   (parallel)
                               →  S4 Dashboard      (parallel)
                                       ↓
                               S5 Filters & Analytics
                               S6 Calendar
                               S7 Contracts
               S2 ──────────→  S8 Listings Core
                                       ↓
                               S9 Platform Features
                                       ↓
                               S10 Launch
```

> **S1 and S2 are hard blockers.** Do not begin Sprint 3+ until the data layer is live.
> **S3 and S4 run in parallel.** S6 and S7 can also overlap.

---

## Sprint Timeline (solo, part-time ~15 hrs/week)

| Sprint | Name | Duration | Cumulative |
|--------|------|----------|------------|
| S1 | Scaffold | 1 week | Wk 1 |
| S2 | Data Layer | 1 week | Wk 2 |
| S3 + S4 | Form & Dashboard (parallel) | 2 weeks | Wk 4 |
| S5 | Filters & Analytics | 2 weeks | Wk 6 |
| S6 | Calendar | 3 weeks | Wk 9 |
| S7 | Contracts | 2 weeks | Wk 9 (parallel with S6) |
| S8 | Listings Core | 3 weeks | Wk 12 |
| S9 | Platform Features | 2 weeks | Wk 14 |
| S10 | Launch | 1–2 weeks | Wk 15–16 |

Full-time equivalent: **~6–8 weeks**.

---

## Sprint 1 — Project Scaffold & Tech Setup

**Goal:** Abandon the single HTML file. Set up the full React + Supabase project
locally, configure CI/CD, and get a working deployed shell on Vercel. Everything
in subsequent sprints depends on this foundation being solid.

**Tags:** Infrastructure · Frontend

### Mini-sprint 1.1 — Vite + React + Tailwind Scaffold

- Init project: `npm create vite@latest` with React + TypeScript template
- Install and configure Tailwind CSS
- Install shadcn/ui, run `npx shadcn@latest init`
- Port all CSS design tokens (`--ink`, `--accent`, `--radius`, etc.) into the
  Tailwind theme
- Set up folder structure: `/pages`, `/components`, `/lib`, `/hooks`

**Deliverable:** Running dev server with correct fonts, colors, and a blank
two-tab layout matching the current app visually.

> **Implementation note (2026-09-17):** the scaffold uses **Tailwind CSS v4**
> with the `@tailwindcss/vite` plugin, which is CSS-first — tokens are declared in
> `@theme` inside `src/index.css` instead of a `tailwind.config.ts`. This is
> intentional and supersedes the `tailwind.config.ts` wording above.

### Mini-sprint 1.2 — Supabase Project Setup

- Create Supabase project at supabase.com
- Define initial schema: `candidates` table mirroring the current data model (all
  fields from `ownerSave()`), **normalised into the canonical nested record shape
  of spec §3.3** (`personal`, `residence`, `studyWork`, `apartment`, `situation`,
  `owner`)
- Enable Row Level Security (RLS) — landlord-only writes, public inserts for
  tenant form
- Add `supabase-js` to the React project: `npm install @supabase/supabase-js`
- Create `lib/supabase.ts` singleton client using env vars

**Deliverable:** Supabase project live with candidates table. React app connects
and can read rows.

### Mini-sprint 1.3 — Git, Vercel & Env Config

- Push repo to GitHub
- Connect repo to Vercel — auto-deploy on push to `main`
- Configure environment variables in Vercel dashboard (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`)
- Add `.env.example` to repo (no secrets committed, `.env.local` in
  `.gitignore`)
- Verify production deploy works end-to-end

**Deliverable:** Live Vercel URL. Any push to `main` auto-deploys. Foundation
complete.

---

## Sprint 2 — Replace localStorage with Supabase

**Goal:** Wire the full data layer. All candidate reads and writes go through
Supabase. Existing localStorage data gets a migration tool. The app now works
across devices and browsers simultaneously — the single biggest architectural
upgrade.

**Tags:** Infrastructure · Data

### Mini-sprint 2.1 — Supabase CRUD for Candidates

- Create `lib/candidates.ts`: typed functions for `getAll`, `getById`, `upsert`,
  `delete`
- Replace all `localStorage.setItem` / `getItem` / `loadAll()` / `saveAll()` calls
  with Supabase calls
- Handle loading states (`isLoading`) and error boundaries per route
- Add optimistic UI updates — list updates immediately, syncs in background

**Deliverable:** Candidate list and detail reads/writes fully backed by Postgres.
localStorage is no longer the source of truth.

### Mini-sprint 2.2 — JSON Import Migration Tool

- Build one-time migration UI: paste or upload existing `najomnici.json`
- Parse, validate schema, and bulk-insert into Supabase (`upsert` on `id`)
- Handle duplicates gracefully — upsert by existing ID, skip malformed records
- Show migration report: "X imported, Y skipped, Z errors"
- Retain JSON export feature — now exports from Supabase data, not localStorage

**Deliverable:** Any existing localStorage data migrated to Supabase in under 2
minutes with one file upload.

### Mini-sprint 2.3 — TypeScript Data Model & Validation

- Define `Candidate` TypeScript interface matching the Supabase schema exactly
- Add Zod schemas for form validation on both tenant-side and owner-side forms
- **Add `listing_id` nullable foreign key to candidates table now** — null until
  Sprint 9 enforces it, but seeding it early avoids a painful backfill later
- Write unit tests for data transform helpers (date formatting, rating rounding,
  etc.)

**Deliverable:** Typed, validated data model. Compiler catches any field
mismatches from this point forward.

---

## Sprint 3 — Rebuild Tenant Application Form in React

**Goal:** Port the existing multi-step form — the most polished part of the
current app — into React components. Logic and design are proven; the goal is a
clean component architecture, Zod-validated form state, and direct Supabase
submission without any landlord action required.

**Tags:** Frontend · Feature

### Mini-sprint 3.1 — Multi-step Form Components

- Build `<StepProgress>` stepper component (matches existing dot + label design)
- Create five step pages as React components: Personal Info, Residence,
  Studies & Work, Apartment, Situation
- Implement `useFormState` hook to share state across steps
- Port all fields, radio toggle groups (`<ToggleGroup>`), and conditional
  subfields into React

**Deliverable:** All 5 form steps navigable with working field state, matching
current visual design exactly.

### Mini-sprint 3.2 — Validation, Draft Saving & Submission

- Add per-step Zod validation — "Next" button disabled until required fields pass
- Draft auto-save to localStorage — tenant can close tab and resume without
  losing data
- On final submit: write directly to Supabase `candidates` table with
  `status: 'pending'`
- Disable submit button during network request, show inline spinner

**Deliverable:** Tenant submits form → row appears in Supabase → landlord sees it
on next load (or instantly once Sprint 6 Realtime is live).

### Mini-sprint 3.3 — Confirmation UX & Mobile Responsiveness

- Post-submit confirmation screen with branded thank-you message in Slovak
- Clear draft from localStorage only after confirmed successful submission
- Full mobile audit: all fields, buttons, and steps usable on 375px viewport
- Test on iOS Safari and Android Chrome (common issues: input zoom, date pickers)

**Deliverable:** Tenant form is production-ready and mobile-first. Shareable as a
standalone public URL.

---

## Sprint 4 — Rebuild Landlord Dashboard + Auth

**Goal:** Port the owner view into React with Supabase Auth protecting it. The
sidebar candidate list, detail panel, star rating, and notes are rebuilt as proper
React components. Auth is the critical addition — the current owner view is
completely unprotected.

**Tags:** Frontend · Infrastructure · Feature

### Mini-sprint 4.1 — Supabase Auth (Landlord Login)

- Enable email + password auth in Supabase dashboard
- Build `<LoginPage>` with email/password form and "forgot password" link
- Create `useAuth` hook: session persistence via `supabase.auth.getSession()`,
  sign out
- Protect all `/owner/*` routes with auth guard component — redirect
  unauthenticated users to `/login`
- Update Supabase RLS policies: candidate reads restricted to `auth.uid()`
  matching landlord

**Deliverable:** Landlord must log in to see any candidate data. Tenant form
remains fully public.

### Mini-sprint 4.2 — Candidate List Sidebar + Detail Panel

- Build `<CandidateSidebar>` with avatar (hue-varied by initials), name, origin,
  rating badge
- Build `<CandidateDetail>` — full read-only display of all fields matching
  current layout
- Toggle to edit mode: all fields become editable inline
- Wire save → `lib/candidates.upsert()` → optimistic sidebar update → toast
  notification

**Deliverable:** Full CRUD on candidates via React UI backed by Supabase. Feature
parity with current HTML app.

### Mini-sprint 4.3 — Star Rating, Notes & FB Link

- Port `<StarRating>` component (half-star precision, hover preview — matches
  existing logic)
- Rating change: debounced write to Supabase (300 ms delay to avoid per-click
  round trips)
- Notes textarea: auto-save with "Saved" / "Saving…" indicator
- Facebook profile URL → validated, renders as a clickable preview link
- Delete candidate: shadcn/ui `<AlertDialog>` confirmation, not native `confirm()`

**Deliverable:** All existing owner-side functionality working in React. Ready to
extend in subsequent sprints.

---

## Sprint 5 — Filters Dashboard + Analytics

**Goal:** Highest-value pure-frontend feature — no new infrastructure needed.
TanStack Table handles client-side filtering and sorting on the candidates array
already in memory. Recharts renders statistics. Turns the candidate list from a
scrollable pile into a decision-making tool.

**Tags:** Frontend · Feature · Data

### Mini-sprint 5.1 — Filter Panel with TanStack Table

- Install and configure `@tanstack/react-table` with the existing candidates array
- Filters to implement:
  - Minimum rating (range slider: 0–5)
  - Employment type (checkbox group: Student / TPP / SZČO / Unemployed)
  - Origin city/country (free-text search)
  - Move-in date range (two date pickers: from / to)
  - Has notes / no notes (toggle)
  - Has Facebook URL / missing (toggle)
- Active filter chips displayed above the list — click any chip to remove that
  filter
- "Clear all filters" button resets to unfiltered state

**Deliverable:** Filter sidebar that narrows the candidate list in real-time with
zero backend calls.

### Mini-sprint 5.2 — Stats Summary Cards

- Stats row at the top of the dashboard:
  - Total candidates (filtered vs total)
  - Average rating
  - New candidates this week
- Employment breakdown counts: Student / TPP / SZČO / Unemployed
- Move-in urgency: candidates wanting to move in within 30 / 60 / 90 days
- All stats react to active filters — e.g. "avg 4.2★ among 12 filtered results"

**Deliverable:** Summary cards that update live as filters change. Meaningful
aggregate data at a glance.

### Mini-sprint 5.3 — Recharts Visualisations

- Install `recharts`
- Rating distribution: horizontal bar chart grouped by star range (0–1★, 1–2★ …
  4–5★)
- Employment mix: donut chart (TPP / Student / SZČO / Other)
- Move-in demand: column chart by month (when do most people want to move in?)
- Top origin cities: ranked list with count bars
- Analytics section is collapsible — landlord can hide charts to focus on the list

**Deliverable:** Full analytics section. Landlord sees rating distribution,
employment mix, and move-in demand curve in one view.

---

## Sprint 6 — Real-time Visit Booking Calendar

**Goal:** The feature that definitively requires a backend. Landlord creates
available slots; tenants book them; all users see live availability via Supabase
Realtime websockets. When tenant A books 10:00, tenant B sees it grey out
instantly — no polling, no page refresh. Most technically complex sprint.

**Tags:** Infrastructure · Feature · Data

### Mini-sprint 6.1 — Slots Schema + Landlord Slot Creator

- Create Supabase table: `slots (id, listing_id, date, hour, tenant_id, status,
  created_at)`
- `status` enum: `open | booked | cancelled`
- Build landlord "slot creator" UI: pick week → click hour blocks to mark
  available → save batch
- Batch insert open slots on save: one write, not N individual inserts
- Landlord can cancel slots — sets status to `cancelled`, frees the block visually

**Deliverable:** Landlord creates a week of availability. Slots written to
Supabase.

### Mini-sprint 6.2 — Tenant Booking Flow

- Tenant-facing calendar view: week grid with open slots highlighted in accent
  colour
- One-click to reserve: modal asks for name + phone (no account required for
  tenants)
- On confirm: slot `status → booked`, `tenant_id` set, confirmation shown
  immediately
- Booked slots render as greyed out for all subsequent visitors

**Deliverable:** Tenant can view available slots and book one. Booking written to
Supabase with tenant contact info.

### Mini-sprint 6.3 — Supabase Realtime Live Updates

- Subscribe to `slots` table via
  `supabase.channel('slots').on('postgres_changes', ...)`
- On any slot update: re-render the affected calendar cell without page refresh
- Landlord dashboard: "Upcoming visits" list with all booked slots and tenant
  names
- Connection status indicator in the UI (connected / reconnecting / offline)
- Graceful fallback: poll every 30 seconds if the websocket connection fails

**Deliverable:** Two browser tabs open on the calendar — booking in one updates
the other in under 500 ms.

---

## Sprint 7 — Rental Contract Generation & PDF Export

**Goal:** Template engine + react-pdf. Landlord picks a candidate, picks a
template, and all known fields auto-fill in seconds. The filled contract previews
inline and downloads as a properly typeset PDF. No Word doc, no manual data entry.
Pure frontend — no backend needed.

**Tags:** Frontend · Feature

### Mini-sprint 7.1 — Template Engine + Storage

- Template format: plain text with `{{firstName}}`, `{{moveIn}}`, `{{price}}`
  placeholders — matching candidate field names exactly
- Store 2–3 default Slovak templates in Supabase: short-term rental, long-term
  rental, room rental
- Template CRUD UI for landlord: create, edit, duplicate, delete
- Template list accessible from the dashboard navigation

**Deliverable:** Landlord has 3 editable contract templates stored in Supabase.

### Mini-sprint 7.2 — One-click Auto-fill from Candidate

- "Generate contract" button on every candidate detail panel
- Template selector modal — landlord picks which template to use
- Auto-fill engine: `template.replace(/\{\{(\w+)\}\}/g, (_, k) => candidate[k] || '')`
- Editable rich-text preview — landlord can tweak text before downloading
- Unfilled placeholders (missing candidate data) highlighted in amber with a
  warning count

**Deliverable:** One click generates a filled contract from any candidate record in
under 3 seconds.

### Mini-sprint 7.3 — react-pdf Export

- Install `@react-pdf/renderer`
- Define contract PDF layout as React components: header with landlord name/logo,
  body text, signature blocks, footer
- Render the filled template content into the PDF document
- "Download PDF" button triggers browser download
- Filename pattern: `zmluva-{lastName}-{YYYY-MM-DD}.pdf`

**Deliverable:** Properly typeset Slovak rental contract PDF, downloaded in one
click from a candidate record.

---

## Sprint 8 — Listing Manager Core (Data, Text & Images)

**Goal:** The structural spine of the whole product. Landlord writes the flat
advertisement, uploads photos, and stores everything centrally.
Highest-infrastructure sprint because photos require Supabase Storage. Client-side
image compression is non-negotiable — uncompressed phone photos are 5–15 MB each.

**Tags:** Infrastructure · Feature · Data

### Mini-sprint 8.1 — Listing Schema + CRUD

- Create Supabase table: `listings (id, title, description, price, deposit,
  availableFrom, size_m2, floor, furnished, pets_allowed, parking, created_at,
  updated_at)`
- Create `listing_images (id, listing_id, storage_path, url, display_order,
  is_cover)`
- Create `listing_platforms (id, listing_id, name, external_url, posted_at,
  status)`
- Build landlord listing list view + "New listing" form with all text fields
- Basic text field CRUD working end-to-end with Supabase

**Deliverable:** Landlord can create, edit, and delete flat listings with all
text/boolean fields. No images yet.

### Mini-sprint 8.2 — Rich Text Editor for Ad Copy

- Install Tiptap (`@tiptap/react`): headless rich text editor with React
  integration
- Toolbar: Bold, Italic, Bullet list, Numbered list, Heading 2
- Separate fields: `title` (plain text, 60-char limit shown) and `description`
  (rich text)
- Character count displayed under description — critical for Bazos character
  limits
- Auto-save draft to Supabase every 30 seconds, "Last saved at HH:MM" indicator

**Deliverable:** Full rich text editor for listing description. Landlord can
compose a complete flat advertisement.

### Mini-sprint 8.3 — Image Uploader + Supabase Storage

- Enable Supabase Storage bucket: `listing-images` (public reads, authenticated
  writes)
- Install `browser-image-compression` — compress to max 1 MB / image before any
  upload
- Drag-and-drop multi-image uploader using `react-dropzone`
- Per-image upload progress bar shown during upload
- Drag-to-reorder images (dnd-kit), click star to set cover photo
- Delete image: removes file from Storage bucket + row from `listing_images`

**Deliverable:** Landlord uploads phone photos → compressed client-side → stored in
Supabase → displayed with reorder and cover selection.

---

## Sprint 9 — Listing Manager: Platform Features & App Flow

**Goal:** One master listing, multiple platform outputs. The landlord writes once;
the app formats for Bazos (short, plain-text, character-limited) and Facebook
(conversational, longer). Platform URLs are tracked with jump links. Candidates get
linked to their listing, completing the end-to-end product flow.

**Tags:** Frontend · Feature · Data

### Mini-sprint 9.1 — Platform-specific Ad Copy Templates

- Define Bazos template: short title (≤60 chars), plain-text body, price +
  category tags, no markdown
- Define Facebook template: conversational opener, emoji permitted, longer
  description body
- Auto-generate both from master listing fields on demand (no manual input)
- Side-by-side preview: "Bazos" tab | "Facebook" tab
- Landlord can manually edit each platform version before copying — edits do not
  affect the master

**Deliverable:** One listing → two platform-optimised ad texts generated
automatically and independently editable.

### Mini-sprint 9.2 — Copy-to-clipboard & Platform Tracking

- "Copy for Bazos" / "Copy for Facebook" buttons — one-click clipboard via
  `navigator.clipboard`
- Platform tracker checklist: Bazos / Facebook / Nehnutelnosti.sk / Other —
  landlord marks where posted
- Store external post URL per platform — rendered as a jump link in the dashboard
- Store `posted_at` date per platform — landlord sees when each post went live
- Status badge per platform entry: `Draft` / `Posted` / `Expired`

**Deliverable:** Landlord tracks every platform the ad is live on, with dates and
direct jump links.

### Mini-sprint 9.3 — Listing ↔ Candidate Connection

- `listing_id` on `candidates` already exists (seeded in Sprint 2.3) — now enforce
  it in the UI
- Tenant form URL accepts `?listing=<id>` — auto-associates submission with that
  listing
- Landlord can manually set or change `listing_id` on any existing candidate record
- Listing detail page shows: applicant count, average rating, and a "View
  applicants" link → pre-filtered candidate list
- Pipeline summary visible on listing: Applied → Visited → Contract sent (counts
  per stage)

**Deliverable:** End-to-end product flow complete: Listing → Application → Visit →
Contract, all connected and navigable.

---

## Sprint 10 — Multi-property, Mobile QA & Production Launch

**Goal:** If the landlord manages more than one flat, the data model needs
`listing_id` enforced on every entity. This was seeded early — now it's surfaced in
the UI. Final mobile audit, performance pass, security review, and a
production-hardened deploy on a custom domain.

**Tags:** Frontend · UX · Infrastructure

### Mini-sprint 10.1 — Multi-property Data Model Enforcement

- Verify `listing_id` foreign key is present on: `candidates`, `slots`, `contracts`
  (via `listing_id` on contract metadata)
- Add listing context switcher to dashboard header — landlord selects the active
  listing
- All lists, filters, and calendar views respect the active listing scope
- Analytics dashboard: per-listing view with an "All listings" aggregate toggle
- Calendar shows only slots for the active listing; switching listing updates the
  calendar

**Deliverable:** App works correctly with 2+ listings. No data bleeds between
properties.

### Mini-sprint 10.2 — Mobile UX Audit + Performance

- Dashboard sidebar: collapses to a slide-in drawer on screens < 768px
- Calendar: touch-friendly tap-to-book, swipe left/right to navigate weeks
- Image upload on mobile: camera access via `accept="image/*"`, pinch zoom in
  preview
- Run Lighthouse audit — targets: Performance ≥ 90, Accessibility = 100
- Lazy-load images using `IntersectionObserver`
- Paginate candidate list beyond 50 records (cursor-based via Supabase `range()`)

**Deliverable:** Entire app usable on a phone. Lighthouse scores green.

### Mini-sprint 10.3 — Production Hardening & Launch

- Supabase RLS audit — verify no data accessible to unauthenticated users or other
  landlords
- Add React error boundaries on every route — app never fully white-screens
- Install Sentry (`@sentry/react`, free tier) for error monitoring and alerting
- Connect custom domain in Vercel dashboard
- Write `README.md`: setup instructions, environment variable reference, Supabase
  schema diagram
- Tag `v1.0.0` release on GitHub

**Deliverable:** Production-hardened app on a custom domain. Observable, monitored,
and documented. Ready to use.

---

## Key Technical Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Supabase over Firebase | Postgres (relational), Realtime, Storage, and Auth all in one SDK. Foreign keys work. No vendor lock-in on query language. |
| Vite over CRA | 10–100× faster dev server, native ES modules, smaller bundles. CRA is deprecated. |
| TanStack Table over server-side filtering | Candidate volumes (hundreds, not thousands) fit comfortably in memory. Zero latency on filter changes. |
| react-pdf over jsPDF + html2canvas | Produces real vector PDFs with proper font embedding. jsPDF+canvas produces rasterised text — not acceptable for legal documents. |
| browser-image-compression before upload | Phone photos are 5–15 MB. Without compression, storage fills fast and upload UX is painful on mobile connections. 5 lines of code, massive UX improvement. |
| `listing_id` seeded in Sprint 2 | Adding a foreign key to a table with hundreds of rows later is painful. Plant the column early as nullable, enforce it in Sprint 9–10. |
| Tiptap over Quill or Draft.js | Actively maintained, headless, TypeScript-first, React native. Quill is largely unmaintained. |

---

## Working with this plan

- **One sprint at a time.** Close every mini-sprint's deliverable before opening
  the next, and update the status tables at the top of this document when a
  mini-sprint closes.
- **Non-negotiables that carry across every sprint**
  (spec, `.clinerules/najomapp.md`): UI copy in Slovak with formal vykanie, code
  comments in English, `const`/`let` only, no hardcoded colours — always the
  canonical tokens, functions under 40 lines, accessibility baseline on every
  component.
- **Rodné číslo is sensitive.** Never log it, never put it in filenames or URLs,
  never show it in a list view, exclude it from print.
- **`najomnik.html` stays the behavioural reference** until its React replacement
  ships — but the React rewrite must follow the specification, not the prototype's
  divergences (§12.1).
- Sprint durations assume ~15 hrs/week solo. Full-time equivalent is ~6–8 weeks.

---

*Plan prepared based on current HTML file analysis and feature specification.
Adjust sprint durations based on developer availability and feature
prioritisation.*
