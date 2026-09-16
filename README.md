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
| [`.clinerules/najomapp.md`](.clinerules/najomapp.md) | Operational rule digest applied to every task |
| [`AGENTS.md`](AGENTS.md) | Entry point for AI agent tooling |

## Repository layout

| Path | Contents |
| --- | --- |
| `najomnik.html` | The shipped single-file app — HTML, CSS and JS inline, no build step, no external JS |
| `app/` | Work-in-progress React + TypeScript rewrite (Vite, Tailwind CSS, Supabase client, Vitest). `npm install && npm run dev` inside `app/`; `node_modules/` is git-ignored |
| `NajomApp_Project_Instructions.md` | Authoritative specification (see the table above) |

## Status

`najomnik.html` **is present** — 1,877 lines, ~68 KB unminified (within the
120 KB §3.1 budget). Phase 1 features are implemented: two-view shell, design
system, 5-step tenant form, owner sidebar + detail panel, localStorage
read/write, JSON export/import, and a password gate.

`app/` holds the React + TypeScript rewrite at its scaffold stage (app shell,
tab panels, design tokens, component tests). Its owner panel is **not yet
password-protected** — authentication lands in Sprint 4.1, so the scaffold must
not be deployed publicly.

**Note:** the file predates the specification and diverges from it in a number of
ways (storage keys, password hashing, flat vs. nested data model, component class
names, zero ARIA coverage, inline event handlers). The complete list is in
[§12.1 of the instructions](NajomApp_Project_Instructions.md) — that table is the
compliance backlog.

