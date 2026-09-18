/**
 * Zod schemas for the two forms (Sprint 2.3, spec §6.3).
 *
 * ONE SCHEMA PER STEP
 *   Sprint 3.2 disables "Ďalej" until the current step passes, so validation is
 *   exposed per step (`TENANT_STEP_SCHEMAS`) as well as for the whole
 *   application (`tenantApplicationSchema`). The owner-side panel is validated
 *   by `ownerReviewSchema`.
 *
 * MESSAGE POLICY
 *   Error copy comes from the canonical glossary in §6.3 and is never inlined
 *   at the call site — the UI reads these constants so a wording change happens
 *   in one place. Two additions were unavoidable and are flagged for a §6.3
 *   amendment: `INVALID_DATE_MESSAGE` (the column is a real `date`, so free
 *   text such as the prototype's "od 1. septembra" would fail the insert) and
 *   `INVALID_RATING_MESSAGE` (half-star granularity is new in React).
 *
 * NOT VALIDATED ON PURPOSE
 *   `rc` — Rodné číslo is optional (§7) and §6.3 defines no message for a
 *   malformed one, so a format rule would both invent copy and risk blocking a
 *   submission over an optional field. Stored as typed, trimmed.
 *   `facebookUrl` — a convenience link the landlord may paste in any form; the
 *   browser's own `type="url"` check covers the obvious typo.
 */

import { z } from "zod";

import type { StepNumber } from "@/types";

import {
  CANDIDATE_STATUSES,
  EMPLOYMENT_STATUSES,
  MAX_RATING,
  STUDENT_STATUSES,
  isHalfStepRating,
} from "./candidate";

// ── canonical error copy (spec §6.3) ────────────────────────────────────────
export const REQUIRED_FIELD_MESSAGE = "Povinné pole";
export const INVALID_EMAIL_MESSAGE = "Zadajte platný e-mail";
export const INVALID_PHONE_MESSAGE = "Zadajte platné telefónne číslo";
export const TOO_SHORT_MESSAGE = "Táto hodnota je príliš krátka";

/** Additions to §6.3 — see MESSAGE POLICY above. */
export const INVALID_DATE_MESSAGE = "Zadajte platný dátum";
export const INVALID_RATING_MESSAGE = "Hodnotenie musí byť 0 – 5 v krokoch po 0,5";

/** A name shorter than this is almost certainly a typo or a single keypress. */
const NAME_MIN_LENGTH = 2;

/**
 * Accepts Slovak and international formats: `+421 900 000 000`, `0900/000000`,
 * `(02) 1234 5678`. Digits are counted after stripping separators.
 */
export function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/[\s().\-/]/g, "");
  return /^\+?\d{9,15}$/.test(digits);
}

/** True for a real `YYYY-MM-DD` calendar date (rejects 2026-02-30, 2026-13-01). */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// ── field primitives ────────────────────────────────────────────────────────
const requiredName = z
  .string()
  .trim()
  .min(1, REQUIRED_FIELD_MESSAGE)
  .min(NAME_MIN_LENGTH, TOO_SHORT_MESSAGE);

const requiredText = z.string().trim().min(1, REQUIRED_FIELD_MESSAGE);

/** Optional text: `""` is a legitimate answer, not a missing one. */
const optionalText = z.string().trim();

const email = z
  .string()
  .trim()
  .min(1, REQUIRED_FIELD_MESSAGE)
  .pipe(z.email({ message: INVALID_EMAIL_MESSAGE }));

const phone = z
  .string()
  .trim()
  .min(1, REQUIRED_FIELD_MESSAGE)
  .refine(isValidPhoneNumber, { message: INVALID_PHONE_MESSAGE });

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || isValidIsoDate(value), { message: INVALID_DATE_MESSAGE });

const rating = z
  .number()
  .min(0, INVALID_RATING_MESSAGE)
  .max(MAX_RATING, INVALID_RATING_MESSAGE)
  .refine(isHalfStepRating, { message: INVALID_RATING_MESSAGE });

/** Empty string means "not answered", which the enum columns store as NULL. */
const optionalStudentStatus = z.union([z.literal(""), z.enum(STUDENT_STATUSES)]);
const optionalEmploymentStatus = z.union([z.literal(""), z.enum(EMPLOYMENT_STATUSES)]);

// ── step 1: Osobné ──────────────────────────────────────────────────────────
export const personalStepSchema = z.object({
  firstName: requiredName,
  lastName: requiredName,
  dob: optionalDate,
  rc: optionalText,
  opNumber: optionalText,
  passportNumber: optionalText,
  phone,
  email,
  extraContact: optionalText,
});

// ── step 2: Pobyt ───────────────────────────────────────────────────────────
export const residenceStepSchema = z.object({
  origin: requiredText,
  bratislavaYears: optionalText,
});

// ── step 3: Štúdium & Práca ─────────────────────────────────────────────────
// Whether `school` or `employer` is required depends on the two status answers,
// a cross-field rule the React form applies in Sprint 3.2. It is not enforced
// here so that a tenant who studies can still leave the work block empty.
export const studyWorkStepSchema = z.object({
  studentStatus: optionalStudentStatus,
  school: optionalText,
  yearLevel: optionalText,
  employmentStatus: optionalEmploymentStatus,
  employer: optionalText,
  employmentDuration: optionalText,
});

// ── step 4: Byt ─────────────────────────────────────────────────────────────
export const apartmentStepSchema = z.object({
  mustHave: optionalText,
  niceToHave: optionalText,
  dream: optionalText,
  likes: optionalText,
  moveInDate: optionalDate,
});

// ── step 5: Situácia ────────────────────────────────────────────────────────
export const situationStepSchema = z.object({
  currentSituation: optionalText,
  additionalInfo: optionalText,
});

/**
 * Per-step lookup for the wizard. Typed by `StepNumber`, so the compiler
 * catches a missing or misspelled step.
 */
export const TENANT_STEP_SCHEMAS: Record<StepNumber, z.ZodType> = {
  1: personalStepSchema,
  2: residenceStepSchema,
  3: studyWorkStepSchema,
  4: apartmentStepSchema,
  5: situationStepSchema,
};

/** The whole 5-step application, as submitted to `submitApplication()`. */
export const tenantApplicationSchema = z.object({
  personal: personalStepSchema,
  residence: residenceStepSchema,
  studyWork: studyWorkStepSchema,
  apartment: apartmentStepSchema,
  situation: situationStepSchema,
});

/**
 * Owner-side review. `status` is part of the same payload because the pipeline
 * stage and the rating are changed on the same screen (Sprint 4.3).
 */
export const ownerReviewSchema = z.object({
  status: z.enum(CANDIDATE_STATUSES),
  rating,
  notes: optionalText,
  facebookUrl: optionalText,
});

export type PersonalInput = z.infer<typeof personalStepSchema>;
export type ResidenceInput = z.infer<typeof residenceStepSchema>;
export type StudyWorkInput = z.infer<typeof studyWorkStepSchema>;
export type ApartmentInput = z.infer<typeof apartmentStepSchema>;
export type SituationInput = z.infer<typeof situationStepSchema>;
export type TenantApplication = z.infer<typeof tenantApplicationSchema>;
export type OwnerReview = z.infer<typeof ownerReviewSchema>;

/**
 * First error message of a failed parse, ready for a single inline error
 * message. Returns `""` when the input is valid.
 */
export function firstErrorMessage(result: z.ZodSafeParseResult<unknown>): string {
  return result.success ? "" : (result.error.issues[0]?.message ?? REQUIRED_FIELD_MESSAGE);
}