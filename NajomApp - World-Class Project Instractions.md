NájomApp — Project Instructions & Context
Claude Project · Senior-Grade Reference Document
Written to Anthropic best-practice standards for Claude Projects · September 2026

1. Project Identity
NájomApp (Slovak: nájomník = tenant) is a single-file, privacy-first web application for screening rental applicants in the Slovak Republic — primarily for Bratislava landlords managing one or a small number of properties.

The application serves two principals who never interact simultaneously:

Principal	Slovak label	Role
Applicant / Tenant	Záujemca	Fills a 5-step interest form
Owner / Landlord	Vlastník	Reviews, rates, and notes applicants
Everything lives in one .html file. No server. No database. No login backend. Data lives in localStorage; JSON export/import is the backup & migration story.

2. How to Talk to Claude in This Project
2.1 The Prime Directive for Every Request
When you ask Claude to build, fix, or extend NájomApp, always anchor the request to one of these three contexts. Claude will tailor tone, scope, and output accordingly.

[CONTEXT: Tenant UX]    — anything the applicant sees or interacts with
[CONTEXT: Owner UX]     — the landlord panel, ratings, notes, export/import
[CONTEXT: Architecture] — data model, localStorage schema, overall file structure
You do not need to write the bracket literally — just making the context clear in plain language is enough. The bracket form is a shortcut for dense multi-part requests.

2.2 Prompt Patterns That Get the Best Results
Pattern A — Targeted feature build

Add [feature] to the [Tenant/Owner] view.
It should [behaviour].
Keep the single-file architecture.
Output the minimal changed HTML/CSS/JS only — no full-file dump unless I ask.
Pattern B — Bug fix

In the Owner view, [describe what breaks].
Here is the relevant code: [paste snippet].
Fix it without changing surrounding logic.
Pattern C — Full-file regeneration

Regenerate the complete najomnik.html.
Apply all changes discussed this session plus: [list].
Preserve the existing CSS variable palette exactly.
Pattern D — Content / copy

Write Slovak-language microcopy for [element].
Tone: professional but warm, not bureaucratic.
Max [N] words.
Pattern E — Architecture decision

I want to add [feature].
Give me three implementation approaches with trade-offs.
Consider: single-file constraint, no build step, localStorage limits.
2.3 What Claude Knows About This Project by Default
Because this Claude Project contains the source files and this instruction document, Claude always has:

The current HTML/CSS/JS source
The implementation plan phases
The data schema (see §4)
The design system tokens (see §5)
The Slovak UX copy conventions (see §6)
You do not need to paste the file into every message. Just say "the current file" and Claude will reference it from project memory.

3. Application Architecture
3.1 Single-File Rules (Non-Negotiable)
Everything — HTML, CSS, JS — lives in najomnik.html.
External resources allowed: Google Fonts CDN only (Inter + DM Serif Display). No other CDN dependencies.
No build step, no bundler, no npm.
Must work offline after first font cache (fallback stack covers no-network).
File size target: under 120 KB unminified.
3.2 View Switching
Two sibling <div> containers controlled by JavaScript:

<div id="viewNajomnik"> <!-- Tenant view, display:block by default -->
<div id="viewVlastnik"> <!-- Owner view, display:none by default -->
Tab bar in the sticky header toggles between them. The Owner tab must trigger the password gate before revealing the panel.

3.3 State Architecture
localStorage key          Type        Description
─────────────────────────────────────────────────────
najomapp_applicants       JSON array  All applicant records
najomapp_owner_hash       string      bcrypt-style hash of owner password (or SHA-256 for simplicity)
najomapp_active_id        string      Currently selected applicant ID in Owner view
Applicant record shape (canonical — do not deviate without updating this doc):

{
  "id": "uuid-v4",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "personal": {
    "firstName": "",
    "lastName": "",
    "dob": "",
    "rc": "",          // Rodné číslo — handle with care (see §7)
    "opNumber": "",    // OP = občiansky preukaz
    "passportNumber": "",
    "phone": "",
    "email": "",
    "extraContact": ""
  },
  "residence": {
    "origin": "",          // Country + city of origin
    "bratislavaYears": ""  // How long in Bratislava
  },
  "studyWork": {
    "studentStatus": "",   // "fullTime" | "partTime" | "no"
    "school": "",
    "yearLevel": "",
    "employmentStatus": "", // "tpp" | "szco" | "brigada" | "no"
    "employer": "",
    "employmentDuration": ""
  },
  "apartment": {
    "mustHave": "",
    "niceToHave": "",
    "dream": "",
    "likes": "",
    "moveInDate": ""
  },
  "situation": {
    "currentSituation": "",
    "additionalInfo": ""
  },
  "owner": {
    "facebookUrl": "",
    "rating": 0,           // 0–5, supports 0.5 increments
    "notes": ""
  }
}
3.4 Password Gate
Default password: set on first use via a "set password" flow (no default hardcoded).
Storage: SHA-256 hash of the password in localStorage (no plaintext ever).
Session unlock: password check result stored in a JS let variable — not in localStorage. Closing the tab locks again.
Change password flow: requires current password confirmation.
4. Implementation Phases
The project follows this phased roadmap. Always tell Claude which phase you are working in.

Phase 1 — Foundation ✅ (Complete)
Single-file shell with two-view tab switching
Design system (CSS variables, typography, shadow system)
Header with logo, tab bar, ghost trigger
Tenant 5-step form — all fields, validation stubs
Owner sidebar + detail panel layout
localStorage read/write for applicants
Export JSON / Import JSON
Password gate (basic)
Slovak microcopy throughout
Phase 2 — Polish & Completeness (Current focus)
Form validation with inline error messages (Slovak)
Step completion gating (cannot skip)
Star rating component (0–5, half-star, click + keyboard)
Owner notes auto-save (debounced, 800 ms)
Applicant list search/filter in Owner sidebar
Submission success screen with animated confirmation
Responsive layout (mobile: 375 px minimum)
Accessibility: ARIA labels, keyboard navigation, focus traps in modals
Phase 3 — Advanced Features
PDF export of individual applicant profiles (using window.print() + print stylesheet)
Duplicate detection (same name + DOB)
Applicant status tags (Interested / Viewed / Shortlisted / Rejected)
Sort applicants by: date, rating, name
Bulk delete with confirmation
Optional: WhatsApp / email share link generator for the tenant form URL
Phase 4 — Hardening
Content Security Policy meta tag
Input sanitisation (XSS prevention in owner notes display)
localStorage quota guard (warn at 80% of 5 MB)
Print stylesheet for applicant profile
Offline-first: service worker (optional, only if requested)
5. Design System
5.1 CSS Variables (Canonical — never rename these)
/* Ink / Text */
--ink:        #0F1623;   /* Primary text */
--ink-2:      #1E2A3B;   /* Secondary headers */
--ink-3:      #344054;   /* Tertiary text */
--muted:      #667085;   /* Labels, placeholders */
--subtle:     #98A2B3;   /* Disabled, step labels */

/* Surfaces */
--bg:         #F5F6FA;   /* Page background */
--surface:    #FFFFFF;   /* Cards, header */
--surface-2:  #F9FAFB;   /* Alternating rows */
--surface-3:  #F2F4F7;   /* Tab bar track */

/* Borders */
--border:     #E4E7EC;   /* Default border */
--border-2:   #D0D5DD;   /* Focused/hovered border */

/* Accent — deep indigo */
--accent:       #3B5BDB;
--accent-hover: #2F4AC7;
--accent-light: #EEF2FF;
--accent-mid:   #C5D0FA;

/* Status */
--green:        #12B76A;   /* Success, done steps */
--green-light:  #ECFDF3;
--danger:       #F04438;   /* Errors */
--danger-light: #FEF3F2;
--amber:        #F79009;   /* Warnings */
--amber-light:  #FFFAEB;
--star:         #F59E0B;   /* Star rating filled */
--star-half:    #FCD34D;   /* Star rating half */

/* Owner accent — violet */
--violet:       #7C3AED;
--violet-light: #F5F3FF;
--violet-border:#DDD6FE;

/* Geometry */
--radius-sm:  6px;
--radius:     10px;
--radius-lg:  14px;
--radius-xl:  18px;

/* Shadows */
--shadow-xs: 0 1px 2px rgba(16,24,40,.05);
--shadow-sm: 0 1px 3px rgba(16,24,40,.1), 0 1px 2px rgba(16,24,40,.06);
--shadow-md: 0 4px 8px -2px rgba(16,24,40,.1), 0 2px 4px -2px rgba(16,24,40,.06);
--shadow-lg: 0 12px 40px -4px rgba(16,24,40,.12), 0 4px 12px -2px rgba(16,24,40,.08);
5.2 Typography
Role	Font	Weight	Size
App name / headings	DM Serif Display	400	1.875rem
Body	Inter	400	0.9rem
Labels	Inter	500	0.8125rem
Eyebrow / caps	Inter	600	0.75rem + letter-spacing
Muted / helper	Inter	400	0.8125rem
5.3 Component Inventory
Every component in the file must follow these names (use as CSS class or data-attribute):

Component	Primary class/selector
Progress stepper	.progress-steps, .pstep, .pstep-dot, .plabel
Step pages	.step-page, .step-page.active
Form card	.form-card
Input	.input
Textarea	.textarea
Button primary	.btn-primary
Button secondary	.btn-secondary
Owner sidebar	.owner-sidebar, .owner-main
Applicant list item	.applicant-item, .applicant-item.active
Star rating	.star-wrap, .star
Modal	.modal-overlay, .modal
Tag / badge	.tag
6. Slovak UX Copy Conventions
6.1 Voice & Tone
Warm but professional. Not bureaucratic. Not overly casual.
Speak directly to the user: "Vyplňte…", "Uveďte…" — not "Je potrebné vyplniť…"
Avoid legalese. This is a human screening tool, not a government form.
Use the vykanie (formal "you" = Vy) form consistently throughout.
6.2 Canonical Label Glossary
Use these exact strings for UI labels — consistency matters for the owner who reads hundreds of entries.

Meno                    First name
Priezvisko              Last name
Dátum narodenia         Date of birth
Rodné číslo             Birth number (handle sensitively — see §7)
Číslo OP                ID card number
Číslo pasu              Passport number
Telefón                 Phone
E-mail                  Email
Ďalší kontakt           Additional contact
Odkiaľ pochádza?        Where are they from?
Ako dlho v Bratislave?  How long in Bratislava?
Štúdium                 Studies
Zamestnanie             Employment
Kde pracuje?            Where does they work?
Ako dlho?               How long?
Čo je nevyhnutné?       What is essential?
Čo by uvítal/a?         What would they welcome?
Sen / ideál             Dream / ideal
Nasťahovanie            Move-in
Aktuálna situácia       Current situation
Interné — vlastník      Internal — owner only
Hodnotenie              Rating
Moje poznámky           My notes
6.3 Microcopy for Error States
Povinné pole                    Required field (generic)
Zadajte platný e-mail           Enter a valid email
Zadajte platné telefónne číslo  Enter a valid phone number
Táto hodnota je príliš krátka   This value is too short
6.4 Slovak Step Names (Canonical)
1  Osobné        Personal
2  Pobyt         Residence
3  Štúdium & Práca  Studies & Work
4  Byt           Apartment
5  Situácia      Situation
7. Sensitive Data Handling
NájomApp collects Rodné číslo (Slovak birth number — equivalent to a national ID number). This requires special care:

Never log the field value to console.log in debug code.
Never include RC in export filenames or URL parameters.
The field is optional — do not make it required.
In the Owner list view, do not display the RC. Show it only in the full detail panel.
If a print stylesheet is added, exclude RC from the printed profile by default (add a no-print class).
Remind users in a helper text: "Rodné číslo uchovávajte v súlade s platnou legislatívou o ochrane osobných údajov."
8. Accessibility Standards
Every new component Claude builds must meet these baseline requirements:

All interactive elements reachable by Tab / Shift+Tab
Buttons have visible :focus-visible ring (2px, accent color)
Form fields have associated <label> elements (not just placeholder)
Error messages programmatically associated via aria-describedby
Star rating component: keyboard-navigable with arrow keys, announces value via aria-valuenow / aria-valuetext
Modal dialogs: focus trap active while open, Escape closes, returns focus to trigger
Color contrast: all text/background pairs meet WCAG AA (4.5:1 for body, 3:1 for large text)
Step progression announced to screen readers via aria-live="polite" region
9. Code Quality Standards
When Claude writes or modifies code for this project:

Must-haves
Comments in English (code), labels/copy in Slovak (UI)
Functions under 40 lines — extract helpers freely
const / let only — no var
Event listeners added in an init() function called on DOMContentLoaded
No inline onclick / onstyle attributes in HTML
IDs follow pattern: camelCase for JS handles, kebab-case for CSS-only selectors
Must-avoids
No document.write()
No eval()
No external JS dependencies (not even jQuery)
No CSS !important except for legitimate override cases (comment why)
No hardcoded colors — always use CSS variables
10. Testing Checklist
Before declaring any feature done, verify:

□ Tenant form: all 5 steps navigate forward and back correctly
□ Tenant form: submit stores to localStorage and shows success screen
□ Tenant form: "Vyplniť nový formulár" resets and returns to step 1
□ Owner view: password gate blocks access before correct password
□ Owner view: applicant list renders from localStorage on load
□ Owner view: selecting applicant populates all fields in detail panel
□ Owner view: saving applicant updates localStorage without creating duplicate
□ Owner view: delete removes from list and clears panel
□ Export: produces valid JSON with all applicants
□ Import: successfully merges or replaces applicants
□ Responsive: layout usable at 375px width (no horizontal scroll on main content)
□ No console errors on load or during normal use
11. Asking Claude for Help — Quick Reference
I want to…	Say to Claude…
Add a field to the tenant form	"Add [field name] to step [N] of the tenant form. Field type: [text/select/radio]. Label: [Slovak text]. It is [required/optional]."
Fix a layout bug	"The [component] breaks on [viewport/state]. Here is what I see: [describe]. Fix it."
Rebuild a component from scratch	"Rewrite the [component] component. Requirements: [list]. Keep all other code identical."
Get a code review	"Review the [section] of the current file. Focus on: [accessibility / performance / correctness / security]."
Generate copy	"Write Slovak microcopy for [element]. Context: [what it does]. Tone: warm/professional."
Plan a new feature	"I want to add [feature]. Propose an implementation approach that fits the single-file constraint. No code yet."
Full file regeneration	"Generate the complete updated najomnik.html incorporating: [list of changes]. Preserve all existing CSS variables and IDs."
12. Project Files Reference
File	Purpose
najomnik.html	The application — single source of truth
NájomApp___Implementation_Plan.html	Phase-by-phase feature roadmap (artifact)
NajomApp_Project_Instructions.md	This document
This document is the authoritative reference for all Claude interactions in this project. Update it when the architecture, data schema, or phase status changes.