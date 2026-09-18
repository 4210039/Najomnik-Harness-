import type {
  CandidateStatus,
  EmploymentStatus,
  StudentStatus,
} from "@/lib/candidate";

/**
 * Slovak labels for the owner's views (Sprint 4.2).
 *
 * The database stores the §3.3 enums, never these strings — the same rule the
 * tenant form follows. These maps exist so nothing in the owner UI has to render
 * a raw enum value such as `shortlisted`.
 *
 * WHERE THEY COME FROM
 *   The study/employment labels match the words the applicant chose, so the
 *   landlord reads back what was actually answered. The pipeline labels are new
 *   copy and are listed in §13 of the specification for ratification.
 */

export const CANDIDATE_STATUS_LABELS: Readonly<Record<CandidateStatus, string>> = {
  pending: "Nový",
  reviewing: "V posudzovaní",
  shortlisted: "Vo výbere",
  rejected: "Zamietnutý",
  archived: "Archivovaný",
};

export const STUDENT_STATUS_LABELS: Readonly<Record<StudentStatus, string>> = {
  fullTime: "Áno",
  partTime: "Externé",
  no: "Nie",
};

export const EMPLOYMENT_STATUS_LABELS: Readonly<Record<EmploymentStatus, string>> = {
  tpp: "TPP",
  szco: "SZČO",
  brigada: "Brigáda",
  no: "Nie",
};

/** Shown wherever the applicant left an optional field blank. */
export const NOT_PROVIDED = "Neuvedené";

/**
 * `2026-09-18` (or a full timestamp) → `18. 9. 2026`, the order a Slovak reader
 * expects. Falls back to the raw value, so a malformed date never renders as
 * "Invalid Date", and a missing one becomes "Neuvedené".
 */
export function formatDate(value: string): string {
  if (value === "") return NOT_PROVIDED;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match === null) return value;

  return `${Number(match[3])}. ${Number(match[2])}. ${match[1]}`;
}

/** A missing enum answer renders as "Neuvedené" rather than an empty gap. */
export function describeAnswer(value: string): string {
  return value === "" ? NOT_PROVIDED : value;
}

export function describeStatus(status: CandidateStatus): string {
  return CANDIDATE_STATUS_LABELS[status];
}

export function describeStudentStatus(value: StudentStatus | ""): string {
  return value === "" ? NOT_PROVIDED : STUDENT_STATUS_LABELS[value];
}

export function describeEmploymentStatus(value: EmploymentStatus | ""): string {
  return value === "" ? NOT_PROVIDED : EMPLOYMENT_STATUS_LABELS[value];
}