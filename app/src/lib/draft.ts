/**
 * Tenant form draft persistence (Sprint 3.2).
 *
 * The applicant can close the tab mid-form and resume: every change is written
 * to localStorage under one key and rehydrated on mount.
 *
 * WHY A SEPARATE KEY
 *   Spec §3.3 names three keys (`najomapp_applicants`, `najomapp_owner_hash`,
 *   `najomapp_active_id`) and none of them is a draft — in Phase 1 the applicants
 *   array *was* the store, so a draft was unnecessary. In the React rewrite the
 *   draft is a scratchpad that is discarded once the application is accepted, so
 *   it gets its own key. Flagged as an addition to §3.3 rather than a silent
 *   divergence.
 *
 * SENSITIVITY
 *   The draft is personal data and may contain Rodné číslo, because the applicant
 *   typed it. It therefore never leaves this browser, is never logged, and is
 *   deleted only after a *confirmed* successful submission — never on failure,
 *   which would lose the applicant's work.
 */

import { createEmptyCandidateDraft, type CandidateDraft } from "./candidate";

export const DRAFT_STORAGE_KEY = "najomapp_draft";

/** localStorage throws in some privacy modes; never let that break the form. */
function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Merge a stored value onto an empty draft, copying only known sections and
 * known string fields. A draft written by an older build is therefore still
 * readable, and a corrupt one cannot inject unexpected keys.
 */
function rehydrate(value: unknown): CandidateDraft | null {
  if (typeof value !== "object" || value === null) return null;

  const draft = createEmptyCandidateDraft();
  const stored = value as Record<string, unknown>;

  for (const section of Object.keys(draft) as Array<keyof CandidateDraft>) {
    const storedSection = stored[section];
    if (typeof storedSection !== "object" || storedSection === null) continue;

    // `unknown` is required: StudyWorkFields holds a literal union
    // (`StudentStatus | ""`) rather than plain `string`, so the compiler refuses
    // to treat the section as an index signature without the intermediate step.
    const fields = draft[section] as unknown as Record<string, string>;
    for (const field of Object.keys(fields)) {
      const storedValue = (storedSection as Record<string, unknown>)[field];
      if (typeof storedValue === "string") fields[field] = storedValue;
    }
  }

  return draft;
}

/** The stored draft, or `null` when there is none (or it is unusable). */
export function loadDraft(): CandidateDraft | null {
  const storage = safeStorage();
  if (storage === null) return null;

  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    return raw === null ? null : rehydrate(JSON.parse(raw));
  } catch {
    return null; // corrupt JSON: start a fresh form rather than crash it
  }
}

export function saveDraft(draft: CandidateDraft): void {
  const storage = safeStorage();
  if (storage === null) return;

  try {
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* Quota exceeded or storage disabled: the form keeps working, only the
       ability to resume is lost. Never surface this to the applicant. */
  }
}

export function clearDraft(): void {
  const storage = safeStorage();
  if (storage === null) return;

  try {
    storage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* nothing useful to do */
  }
}

/** True when nothing has been filled in — used to avoid storing an empty draft. */
export function isDraftEmpty(draft: CandidateDraft): boolean {
  return Object.values(draft).every((section) =>
    Object.values(section).every((value) => value === ""),
  );
}
