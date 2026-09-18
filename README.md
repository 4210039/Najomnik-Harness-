# NájomApp

A single-file, privacy-first web application for screening rental applicants in
the **Slovak Republic** — built for Bratislava landlords managing one or a small
number of properties.

- **Záujemca** (applicant) fills a 5-step interest form.
- **Vlastník** (owner) reviews, rates and notes applicants behind a password gate.

No server. No database. No login backend. Data lives in `localStorage`; JSON
export/import is the backup and migration story. Everything ships in one
`najomnik.html` file.

## Documentation for contributors and AI agents

| File | Purpose |
| --- | --- |
| [`NajomApp_Project_Instructions.md`](NajomApp_Project_Instructions.md) | Authoritative project reference — architecture, data schema, design system, Slovak copy, security, accessibility, code quality, testing |
| [`NajomApp_Implementation_Plan.md`](NajomApp_Implementation_Plan.md) | Sprint roadmap — 10 sprints / 30 mini-sprints from the single-file prototype to the full SaaS, including the current status snapshot |
| [`.clinerules/najomapp.md`](.clinerules/najomapp.md) | Operational rule digest applied to every task |
| [`AGENTS.md`](AGENTS.md) | Entry point for AI agent tooling |

## Repository layout

| Path | Contents |
| --- | --- |
| `najomnik.html` | The shipped single-file app — HTML, CSS and JS inline, no build step, no external JS |
| `app/` | Work-in-progress React + TypeScript rewrite (Vite, Tailwind CSS, Supabase client, Vitest). `npm install && npm run dev` inside `app/`; `node_modules/` is git-ignored |
| `supabase/` | Database migrations for the rewrite, applied by hand through the Supabase SQL Editor (`0001_init.sql` creates `candidates`, its indexes, its `updated_at` trigger and its RLS policies; `0002_harden_anon_grants.sql` restores INSERT-only grants for the `anon` role) |
| `NajomApp_Project_Instructions.md` | Authoritative specification (see the table above) |

## Running and testing locally

Everything below runs on your machine — **no deployment is needed to test the app.**
`npm run dev` is the everyday loop; `npm run serve:prod` runs the *exact* artifact
Vercel would serve, so a deploy is only ever about hosting, not verification.

```bash
cd app
npm install            # once

npm run dev            # dev server with hot reload  → http://localhost:5173
npm run check          # typecheck + all unit tests (the gate to run before committing)
npm run test:watch     # unit tests in watch mode
npm run serve:prod     # production build, then preview → http://localhost:4173
npm run verify:connection   # sign in as the landlord and prove the Supabase read
```

`npm run verify:connection` asks for a row **count**, never rows, so no applicant
data is loaded or printed, and the password is typed with the echo switched off.

Working in a Codespace? The forwarded `…-5173.app.github.dev` URL *is* the local
dev server — keep that port's visibility **Private**, because the owner panel is
not yet password-protected (Sprint 4.1).

## Status

`najomnik.html` **is present** — 1,877 lines, ~68 KB unminified (within the
120 KB §3.1 budget). Phase 1 features are implemented: two-view shell, design
system, 5-step tenant form, owner sidebar + detail panel, localStorage
read/write, JSON export/import, and a password gate. It is now the reference only
for the **owner** panel; applicant behaviour has been ported.

`app/` holds the React + TypeScript rewrite. It has the app shell, the design
tokens and the **full data layer** (`app/src/lib/`: the nested↔flat record mapper,
Zod schemas, typed CRUD), and since Sprint 3 the **applicant form is real**: a
5-step wizard with per-step validation, draft autosave and resume, a Supabase
submission, and a confirmation screen. Everything is covered by unit tests — **124
across 8 files**; run `npm run check` inside `app/`.

The Supabase project **exists and both migrations are applied** (0001 schema + RLS,
0002 fail-closed grants), public sign-ups are disabled, and the dashboard's
"Automatically expose new tables" setting is off. The tenant path is verified
end-to-end: an unauthenticated insert succeeds (`201`), reading a row back is
refused (`401`), crafted `rating` / `status` values are rejected by the RLS policy
(`401`), and after 0002 `anon` can no longer read, update or delete at all. The
landlord user is created; run **`npm run verify:connection`** to prove the
authenticated read.

⚠️ **Not ready to deploy publicly.** The owner panel is still a static placeholder
with no authentication (Sprint 4.1), and the applicant form now writes to the live
database. Also note the build is **570 kB (164 kB gzip)** with
`@supabase/supabase-js` bundled — over Vite's warning threshold, to be code-split
before launch.

**Note:** the file predates the specification and diverges from it in a number of
ways (storage keys, password hashing, flat vs. nested data model, component class
names, zero ARIA coverage, inline event handlers). The complete list is in
[§12.1 of the instructions](NajomApp_Project_Instructions.md) — that table is the
compliance backlog.

