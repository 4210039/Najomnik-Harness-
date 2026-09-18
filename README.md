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

## Status

`najomnik.html` **is present** — 1,877 lines, ~68 KB unminified (within the
120 KB §3.1 budget). Phase 1 features are implemented: two-view shell, design
system, 5-step tenant form, owner sidebar + detail panel, localStorage
read/write, JSON export/import, and a password gate.

`app/` holds the React + TypeScript rewrite. It has the app shell, tab panels and
design tokens, **plus the full Sprint 2 data layer**: the `app/src/lib/` modules
that map the canonical nested record (§3.3) onto the flat `candidates` columns,
the Zod schemas for both forms, and typed CRUD over Supabase. All of it is
covered by unit tests — run `npm test` and `npm run typecheck` inside `app/`.

The Supabase project **exists and both migrations are applied** (0001 schema + RLS,
0002 fail-closed grants), public sign-ups are disabled, and the dashboard's
"Automatically expose new tables" setting is off. The tenant path is verified
end-to-end over the REST API: an unauthenticated insert succeeds (`201`), reading a
row back is refused (`401`), crafted `rating` / `status` values are rejected by the
RLS policy (`401`), and after 0002 `anon` can no longer read, update or delete at
all. The landlord user is created; run **`npm run verify:connection`** inside `app/`
to prove the authenticated read — it asks only for a row count (never applicant
data) and hides the password as you type. The owner panel is also **not yet
password-protected** — authentication lands in Sprint 4.1, so the scaffold must not
be deployed publicly.

**Note:** the file predates the specification and diverges from it in a number of
ways (storage keys, password hashing, flat vs. nested data model, component class
names, zero ARIA coverage, inline event handlers). The complete list is in
[§12.1 of the instructions](NajomApp_Project_Instructions.md) — that table is the
compliance backlog.

