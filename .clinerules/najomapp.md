# NájomApp — Auto-Loaded Rules

Authoritative detail: **`NajomApp_Project_Instructions.md`**. This file is the
operational digest that applies to every task. If the two ever disagree, the full
document wins — and this file must be corrected.

## Identity

NájomApp is a **single-file, privacy-first** web app for screening rental
applicants in Slovakia (Bratislava landlords, one or a few properties). Two
principals, never simultaneous: **Záujemca** (applicant — 5-step form) and
**Vlastník** (owner — review, rate, note). No server, no DB, no login backend.
`localStorage` is the store; **JSON export/import** is the backup & migration story.

## Hard constraints — never violate

- Everything lives in `najomnik.html` — HTML, CSS, JS inline. No exceptions.
- Only external dependency: Google Fonts CDN (Inter + DM Serif Display).
- No build step, no bundler, no npm, no external JS (not even jQuery).
- Must work offline after first font cache. Target **< 120 KB unminified**.
- No hardcoded colors — always use the CSS variables below.
- No `!important` except a legitimate override (comment why).
- No `document.write()`, no `eval()`, no inline `onclick` / `onstyle`.
- `const` / `let` only — never `var`. Comments in English; UI copy in **Slovak**.
- Functions under 40 lines — extract helpers freely.
- Event listeners registered in an `init()` called on `DOMContentLoaded`.
- IDs: camelCase for JS handles, kebab-case for CSS-only selectors.

## Views

`#viewNajomnik` (tenant, `display:block`) and `#viewVlastnik` (owner,
`display:none`), toggled by a tab bar in the sticky header.
**The Owner tab must pass the password gate before revealing the panel.**

## localStorage

- `najomapp_applicants` — JSON array of records
- `najomapp_owner_hash` — SHA-256 hash of the owner password (no plaintext, no default)
- `najomapp_active_id` — selected applicant id

Unlock state lives in a JS `let` (session only; closing the tab locks again).

## Applicant record (canonical shape)

`id, createdAt, updatedAt` plus:
`personal{firstName,lastName,dob,rc,opNumber,passportNumber,phone,email,extraContact}`,
`residence{origin,bratislavaYears}`,
`studyWork{studentStatus,school,yearLevel,employmentStatus,employer,employmentDuration}`,
`apartment{mustHave,niceToHave,dream,likes,moveInDate}`,
`situation{currentSituation,additionalInfo}`,
`owner{facebookUrl,rating,notes}`.
`rating` is 0–5 in 0.5 steps. Do not deviate without updating the full document.

## Design tokens — canonical, never rename

`--ink --ink-2 --ink-3 --muted --subtle --bg --surface --surface-2 --surface-3
--border --border-2 --accent --accent-hover --accent-light --accent-mid --green
--green-light --danger --danger-light --amber --amber-light --star --star-half
--violet --violet-light --violet-border --radius-sm --radius --radius-lg --radius-xl
--shadow-xs --shadow-sm --shadow-md --shadow-lg`

Values are defined verbatim in §5.1 of the full document. Never invent new colors.

## Component inventory — use these exact names

| Component | class / selector |
| --- | --- |
| Progress stepper | `.progress-steps`, `.pstep`, `.pstep-dot`, `.plabel` |
| Step pages | `.step-page`, `.step-page.active` |
| Form card | `.form-card` |
| Input | `.input` |
| Textarea | `.textarea` |
| Button primary | `.btn-primary` |
| Button secondary | `.btn-secondary` |
| Owner sidebar | `.owner-sidebar`, `.owner-main` |
| Applicant list item | `.applicant-item`, `.applicant-item.active` |
| Star rating | `.star-wrap`, `.star` |
| Modal | `.modal-overlay`, `.modal` |
| Tag / badge | `.tag` |

## Slovak copy

Formal **vykanie** throughout ("Vyplňte…", "Uveďte…" — not "Je potrebné…").
Warm but professional; never legalese. Canonical step names in order:
`1 Osobné · 2 Pobyt · 3 Štúdium & Práca · 4 Byt · 5 Situácia`.
Error states: `Povinné pole`, `Zadajte platný e-mail`,
`Zadajte platné telefónne číslo`, `Táto hodnota je príliš krátka`.
Full label glossary: §6.2 of the full document — use those exact strings.

## Sensitive data (Rodné číslo)

- Never `console.log` the RC value.
- Never put RC in export filenames or URL parameters.
- RC is **optional** — never make it required.
- Owner list view must **not** display RC; only the full detail panel.
- Exclude RC from print via a `no-print` class.
- Helper text: "Rodné číslo uchovávajte v súlade s platnou legislatívou o ochrane
  osobných údajov."

## Accessibility baseline (every component)

Tab-reachable; `:focus-visible` ring (2px, accent); real `<label>` elements;
errors linked via `aria-describedby`; star rating keyboard-navigable with arrow
keys and `aria-valuenow` / `aria-valuetext`; modals trap focus, close on Escape
and restore focus to the trigger; WCAG AA contrast (4.5:1 body / 3:1 large);
step changes announced via `aria-live="polite"`.

## Definition of done

Run the §10 testing checklist of the full document. No console errors on load or
during normal use; usable at 375px with no horizontal scroll on main content.
