# AGENTS.md

This repository is **NájomApp** — a single-file, privacy-first web application
for screening rental applicants in the Slovak Republic.

## Instructions for AI agents

Read and follow these, in order of authority:

1. **`NajomApp_Project_Instructions.md`** — the authoritative project reference
   (identity, architecture, data schema, design tokens, Slovak copy conventions,
   security, accessibility, code quality, testing).
2. **`.clinerules/najomapp.md`** — the operational digest of the above, applied
   to every task.

If anything conflicts, the full instruction document wins.

## Key rules at a glance

- All HTML, CSS and JS live in **`najomnik.html`**. No server, no build step, no npm.
- Only external dependency allowed: Google Fonts CDN (Inter + DM Serif Display).
- `localStorage` is the datastore; JSON export/import is the backup story.
- Two views, never simultaneous: **Záujemca** (applicant) and **Vlastník** (owner).
- UI copy in **Slovak** (formal vykanie); code comments in **English**.
- Never hardcode colors — use the canonical CSS variables.
- Treat **Rodné číslo** as sensitive: never log it, never print it by default,
  never expose it in the Owner list view.
