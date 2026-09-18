/**
 * Canonical applicant record (spec §3.3) and its translation to the flat
 * `public.candidates` columns (migration 0001).
 *
 * WHY TWO SHAPES
 *   The spec defines a nested record — personal / residence / studyWork /
 *   apartment / situation / owner. Postgres stores the same data as flat
 *   snake_case columns so that the Sprint 5 filters and Sprint 10 pagination
 *   can use indexes (see the migration header). This module is the single
 *   boundary where one becomes the other; nothing else in the app should need
 *   to know that `personal.firstName` lives in `first_name`.
 *
 * FIELD NOTES
 *   * `rc` (Rodné číslo) is sensitive: it is carried through untouched, never
 *     logged, never printed and never rendered in a list view (§7).
 *   * Optional text travels as `""` in the nested shape and as NULL in
 *     Postgres. The spec's record uses empty strings, so that — not
 *     `undefined` — is the canonical "not filled in" value in TypeScript.
 *   * `status` and `listingId` are ADDITIVE to §3.3: the spec's record predates
 *     the pipeline and listing features, while migration 0001 already carries
 *     both columns. Flagged for a §3.3 amendment rather than silently diverging.
 */

/** Study status (spec §3.3): `fullTime` | `partTime` | `no`. */
export const STUDENT_STATUSES = ["fullTime", "partTime", "no"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

/** Employment status (spec §3.3): `tpp` | `szco` | `brigada` | `no`. */
export const EMPLOYMENT_STATUSES = ["tpp", "szco", "brigada", "no"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

/** Application pipeline stage. Mirrors the CHECK constraint in migration 0001. */
export const CANDIDATE_STATUSES = [
  "pending",
  "reviewing",
  "shortlisted",
  "rejected",
  "archived",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

/** Highest rating, and the granularity the owner UI offers (half stars). */
export const MAX_RATING = 5;
export const RATING_STEP = 0.5;

export interface PersonalFields {
  firstName: string;
  lastName: string;
  dob: string;
  /** Rodné číslo — sensitive (§7). Optional, always. */
  rc: string;
  opNumber: string;
  passportNumber: string;
  phone: string;
  email: string;
  extraContact: string;
}

export interface ResidenceFields {
  origin: string;
  bratislavaYears: string;
}

export interface StudyWorkFields {
  studentStatus: StudentStatus | "";
  school: string;
  yearLevel: string;
  employmentStatus: EmploymentStatus | "";
  employer: string;
  employmentDuration: string;
}

export interface ApartmentFields {
  mustHave: string;
  niceToHave: string;
  dream: string;
  likes: string;
  /** ISO `YYYY-MM-DD`; the column is a real `date` (Sprint 5 range filters). */
  moveInDate: string;
}

export interface SituationFields {
  currentSituation: string;
  additionalInfo: string;
}

/** Owner-only fields. Never submitted by the tenant form (§7, migration RLS). */
export interface OwnerFields {
  facebookUrl: string;
  /** 0–5 in 0.5 steps. `0` means "not rated yet". */
  rating: number;
  notes: string;
}

/** The full record as the app sees it — nested, camelCase, spec §3.3. */
export interface Candidate {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: CandidateStatus;
  listingId: string | null;
  personal: PersonalFields;
  residence: ResidenceFields;
  studyWork: StudyWorkFields;
  apartment: ApartmentFields;
  situation: SituationFields;
  owner: OwnerFields;
}

/**
 * The tenant-submittable subset: everything except the server-owned lifecycle
 * fields and the owner-only block. This is what the 5-step form collects.
 */
export interface CandidateDraft {
  personal: PersonalFields;
  residence: ResidenceFields;
  studyWork: StudyWorkFields;
  apartment: ApartmentFields;
  situation: SituationFields;
}

/** A partial update. An empty string clears the column (writes NULL). */
export interface CandidatePatch {
  status?: CandidateStatus;
  listingId?: string | null;
  personal?: Partial<PersonalFields>;
  residence?: Partial<ResidenceFields>;
  studyWork?: Partial<StudyWorkFields>;
  apartment?: Partial<ApartmentFields>;
  situation?: Partial<SituationFields>;
  owner?: Partial<OwnerFields>;
}

/** A row exactly as PostgREST returns it (flat, snake_case, NULLable). */
export interface CandidateRow {
  id: string;
  created_at: string;
  updated_at: string;
  status: CandidateStatus;
  listing_id: string | null;
  first_name: string;
  last_name: string;
  dob: string | null;
  rc: string | null;
  op_number: string | null;
  passport_number: string | null;
  phone: string;
  email: string;
  extra_contact: string | null;
  origin: string | null;
  bratislava_years: string | null;
  student_status: StudentStatus | null;
  school: string | null;
  year_level: string | null;
  employment_status: EmploymentStatus | null;
  employer: string | null;
  employment_duration: string | null;
  must_have: string | null;
  nice_to_have: string | null;
  dream: string | null;
  likes: string | null;
  move_in_date: string | null;
  current_situation: string | null;
  additional_info: string | null;
  /** Owner-only. Absent from an insert, which the anon RLS policy enforces. */
  facebook_url: string | null;
  rating: number | string | null;
  notes: string | null;
}

/**
 * Columns an application insert may carry. `facebook_url`, `rating` and
 * `notes` are deliberately excluded: the `applicants_may_submit` policy
 * rejects a row where any of them is not NULL, so a tenant can never award
 * itself stars or inject landlord notes.
 */
export type CandidateRowInsert = Pick<
  CandidateRow,
  | "listing_id"
  | "first_name"
  | "last_name"
  | "dob"
  | "rc"
  | "op_number"
  | "passport_number"
  | "phone"
  | "email"
  | "extra_contact"
  | "origin"
  | "bratislava_years"
  | "student_status"
  | "school"
  | "year_level"
  | "employment_status"
  | "employer"
  | "employment_duration"
  | "must_have"
  | "nice_to_have"
  | "dream"
  | "likes"
  | "move_in_date"
  | "current_situation"
  | "additional_info"
>;

/** Empty string (the form's "not filled in") becomes NULL in Postgres. */
function toColumn(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** NULL from Postgres becomes the empty string the spec's record uses. */
function fromColumn(value: string | null): string {
  return value ?? "";
}

/** `numeric(2,1)` may arrive as a number or as a string, depending on the path. */
function fromRating(value: number | string | null): number {
  if (value === null) return 0;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function personalFromRow(row: CandidateRow): PersonalFields {
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    dob: fromColumn(row.dob),
    rc: fromColumn(row.rc),
    opNumber: fromColumn(row.op_number),
    passportNumber: fromColumn(row.passport_number),
    phone: row.phone,
    email: row.email,
    extraContact: fromColumn(row.extra_contact),
  };
}

function studyWorkFromRow(row: CandidateRow): StudyWorkFields {
  return {
    studentStatus: row.student_status ?? "",
    school: fromColumn(row.school),
    yearLevel: fromColumn(row.year_level),
    employmentStatus: row.employment_status ?? "",
    employer: fromColumn(row.employer),
    employmentDuration: fromColumn(row.employment_duration),
  };
}

function apartmentFromRow(row: CandidateRow): ApartmentFields {
  return {
    mustHave: fromColumn(row.must_have),
    niceToHave: fromColumn(row.nice_to_have),
    dream: fromColumn(row.dream),
    likes: fromColumn(row.likes),
    moveInDate: fromColumn(row.move_in_date),
  };
}

/** Rebuild the nested canonical record from a flat database row. */
export function rowToCandidate(row: CandidateRow): Candidate {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    listingId: row.listing_id,
    personal: personalFromRow(row),
    residence: {
      origin: fromColumn(row.origin),
      bratislavaYears: fromColumn(row.bratislava_years),
    },
    studyWork: studyWorkFromRow(row),
    apartment: apartmentFromRow(row),
    situation: {
      currentSituation: fromColumn(row.current_situation),
      additionalInfo: fromColumn(row.additional_info),
    },
    owner: {
      facebookUrl: fromColumn(row.facebook_url),
      rating: fromRating(row.rating),
      notes: fromColumn(row.notes),
    },
  };
}

/**
 * Flatten a tenant draft into insertable columns.
 *
 * The four NOT NULL columns are always written; everything else is written as
 * NULL when empty, because the form is allowed to skip it. `listingId` stays
 * null until Sprint 9.3 attaches applications to a listing.
 */
export function candidateDraftToRow(
  draft: CandidateDraft,
  listingId: string | null = null,
): CandidateRowInsert {
  const { personal, residence, studyWork, apartment, situation } = draft;

  return {
    listing_id: listingId,
    first_name: personal.firstName.trim(),
    last_name: personal.lastName.trim(),
    dob: toColumn(personal.dob),
    rc: toColumn(personal.rc),
    op_number: toColumn(personal.opNumber),
    passport_number: toColumn(personal.passportNumber),
    phone: personal.phone.trim(),
    email: personal.email.trim(),
    extra_contact: toColumn(personal.extraContact),
    origin: toColumn(residence.origin),
    bratislava_years: toColumn(residence.bratislavaYears),
    student_status: studyWork.studentStatus === "" ? null : studyWork.studentStatus,
    school: toColumn(studyWork.school),
    year_level: toColumn(studyWork.yearLevel),
    employment_status: studyWork.employmentStatus === "" ? null : studyWork.employmentStatus,
    employer: toColumn(studyWork.employer),
    employment_duration: toColumn(studyWork.employmentDuration),
    must_have: toColumn(apartment.mustHave),
    nice_to_have: toColumn(apartment.niceToHave),
    dream: toColumn(apartment.dream),
    likes: toColumn(apartment.likes),
    move_in_date: toColumn(apartment.moveInDate),
    current_situation: toColumn(situation.currentSituation),
    additional_info: toColumn(situation.additionalInfo),
  };
}

/** Nested field name -> database column, per section. Single source of truth. */
const COLUMN_BY_FIELD = {
  personal: {
    firstName: "first_name",
    lastName: "last_name",
    dob: "dob",
    rc: "rc",
    opNumber: "op_number",
    passportNumber: "passport_number",
    phone: "phone",
    email: "email",
    extraContact: "extra_contact",
  },
  residence: { origin: "origin", bratislavaYears: "bratislava_years" },
  studyWork: {
    studentStatus: "student_status",
    school: "school",
    yearLevel: "year_level",
    employmentStatus: "employment_status",
    employer: "employer",
    employmentDuration: "employment_duration",
  },
  apartment: {
    mustHave: "must_have",
    niceToHave: "nice_to_have",
    dream: "dream",
    likes: "likes",
    moveInDate: "move_in_date",
  },
  situation: { currentSituation: "current_situation", additionalInfo: "additional_info" },
  owner: { facebookUrl: "facebook_url", rating: "rating", notes: "notes" },
} as const;

/**
 * Write one section's changed fields into `columns`.
 *
 * Unknown keys and `undefined` values are skipped rather than mapped, so a
 * typo in a caller cannot create a bogus column — PostgREST would otherwise
 * fail the whole update with a confusing `PGRST204`.
 */
function assignSection<TSection extends object>(
  columns: Record<string, unknown>,
  values: Partial<TSection> | undefined,
  columnByField: { readonly [K in keyof TSection]?: string },
): void {
  if (values === undefined) return;

  for (const field of Object.keys(values) as Array<keyof TSection>) {
    const column = columnByField[field];
    const value = values[field];
    if (column === undefined || value === undefined) continue;
    columns[column] = typeof value === "string" ? toColumn(value) : value;
  }
}

/**
 * Turn a partial update into a flat column payload.
 *
 * Passing `""` therefore clears a column (writes NULL), which is what a user
 * emptying a textarea in the owner panel expects.
 */
export function flattenCandidatePatch(patch: CandidatePatch): Record<string, unknown> {
  const columns: Record<string, unknown> = {};

  assignSection<PersonalFields>(columns, patch.personal, COLUMN_BY_FIELD.personal);
  assignSection<ResidenceFields>(columns, patch.residence, COLUMN_BY_FIELD.residence);
  assignSection<StudyWorkFields>(columns, patch.studyWork, COLUMN_BY_FIELD.studyWork);
  assignSection<ApartmentFields>(columns, patch.apartment, COLUMN_BY_FIELD.apartment);
  assignSection<SituationFields>(columns, patch.situation, COLUMN_BY_FIELD.situation);
  assignSection<OwnerFields>(columns, patch.owner, COLUMN_BY_FIELD.owner);

  if (patch.status !== undefined) columns.status = patch.status;
  if (patch.listingId !== undefined) columns.listing_id = patch.listingId;

  return columns;
}

/** True when `value` is an allowed rating: 0–5 in exact half-star steps. */
export function isHalfStepRating(value: number): boolean {
  return (
    Number.isFinite(value) && value >= 0 && value <= MAX_RATING && Number.isInteger(value * 2)
  );
}

/** Snap any number to the nearest half star, clamped to 0–5. */
export function roundToHalfStar(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const snapped = Math.round(value * 2) / 2;
  return Math.min(MAX_RATING, Math.max(0, snapped));
}

/** An empty draft for the tenant form — every field present, nothing filled. */
export function createEmptyCandidateDraft(): CandidateDraft {
  return {
    personal: {
      firstName: "",
      lastName: "",
      dob: "",
      rc: "",
      opNumber: "",
      passportNumber: "",
      phone: "",
      email: "",
      extraContact: "",
    },
    residence: { origin: "", bratislavaYears: "" },
    studyWork: {
      studentStatus: "",
      school: "",
      yearLevel: "",
      employmentStatus: "",
      employer: "",
      employmentDuration: "",
    },
    apartment: { mustHave: "", niceToHave: "", dream: "", likes: "", moveInDate: "" },
    situation: { currentSituation: "", additionalInfo: "" },
  };
}