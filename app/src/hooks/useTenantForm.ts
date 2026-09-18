import { useCallback, useEffect, useMemo, useState } from "react";
import type { z } from "zod";

import { submitApplication } from "@/lib/candidates";
import { createEmptyCandidateDraft, type CandidateDraft } from "@/lib/candidate";
import { TENANT_STEP_SCHEMAS, tenantApplicationSchema } from "@/lib/candidateSchema";
import { clearDraft, isDraftEmpty, loadDraft, saveDraft } from "@/lib/draft";
import { STEP_NAMES, type StepNumber } from "@/types";

export const FIRST_STEP: StepNumber = 1;
export const LAST_STEP: StepNumber = 5;

/** Long enough to not touch localStorage on every keystroke, short enough that
 *  a tab closed mid-word still resumes with the word. */
const DRAFT_SAVE_DELAY_MS = 400;

/** Which section of the canonical record each wizard step edits (spec §6.4). */
const SECTION_BY_STEP: Record<StepNumber, keyof CandidateDraft> = {
  1: "personal",
  2: "residence",
  3: "studyWork",
  4: "apartment",
  5: "situation",
};

export type SubmitStatus = "idle" | "submitting" | "submitted" | "error";

/**
 * Applicant-facing copy for a failed submission. The data layer's own message is
 * technical (PostgREST codes, RLS wording) and must never be shown to an
 * applicant — it names internals and helps nobody filling in a form.
 * TODO (spec §6.3): add this string to the canonical glossary.
 */
export const SUBMIT_FAILED_MESSAGE = "Žiadosť sa nepodarilo odoslať. Skúste to prosím znova.";

export interface TenantFormController {
  draft: CandidateDraft;
  currentStep: StepNumber;
  /** True when the current step passes its Zod schema — gates the Ďalej button. */
  canAdvance: boolean;
  /** True when the whole application validates — gates the Odoslať button. */
  canSubmit: boolean;
  status: SubmitStatus;
  submitError: string;
  /** Slovak sentence for the `aria-live` region on a step change (§8). */
  stepAnnouncement: string;
  update: <TSection extends keyof CandidateDraft>(
    section: TSection,
    patch: Partial<CandidateDraft[TSection]>,
  ) => void;
  /** The field's error message, but only once the field has been touched. */
  errorFor: (fieldId: string) => string;
  markTouched: (fieldId: string) => void;
  goNext: () => void;
  goBack: () => void;
  submit: () => Promise<void>;
  reset: () => void;
}

/**
 * Map a failed parse onto `{ fieldName: firstMessage }`.
 *
 * Only the first message per field is kept: several rules can fire on one value
 * (empty → "Povinné pole" *and* "Táto hodnota je príliš krátka") and the UI has
 * room for exactly one.
 */
function collectFieldErrors(result: z.ZodSafeParseResult<unknown>): Record<string, string> {
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && errors[field] === undefined) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

function stepAnnouncementFor(step: StepNumber): string {
  const name = STEP_NAMES.find((entry) => entry.id === step)?.sk ?? "";
  return `Krok ${step} z ${LAST_STEP}: ${name}`;
}

/**
 * State for the 5-step applicant form (Sprint 3.1–3.3).
 *
 * Validation is never duplicated here: the schemas in `lib/candidateSchema.ts`
 * are the single source of truth, so the browser and the database agree on what
 * an acceptable application is.
 */
export function useTenantForm(): TenantFormController {
  const [draft, setDraft] = useState<CandidateDraft>(
    () => loadDraft() ?? createEmptyCandidateDraft(),
  );
  const [currentStep, setCurrentStep] = useState<StepNumber>(FIRST_STEP);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");

  // Resume support: debounce every change into localStorage. Nothing is written
  // once the application has been accepted — `submit()` clears the key instead.
  useEffect(() => {
    if (status === "submitted") return;

    const timer = window.setTimeout(() => {
      if (isDraftEmpty(draft)) clearDraft();
      else saveDraft(draft);
    }, DRAFT_SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [draft, status]);

  const update = useCallback(
    <TSection extends keyof CandidateDraft>(
      section: TSection,
      patch: Partial<CandidateDraft[TSection]>,
    ): void => {
      setDraft((previous) => ({
        ...previous,
        [section]: { ...previous[section], ...patch },
      }));
    },
    [],
  );

  const stepResult = useMemo(
    () => TENANT_STEP_SCHEMAS[currentStep].safeParse(draft[SECTION_BY_STEP[currentStep]]),
    [draft, currentStep],
  );

  const fieldErrors = useMemo(() => collectFieldErrors(stepResult), [stepResult]);
  const canSubmit = useMemo(() => tenantApplicationSchema.safeParse(draft).success, [draft]);

  const errorFor = useCallback(
    (fieldId: string): string => (touched.has(fieldId) ? (fieldErrors[fieldId] ?? "") : ""),
    [touched, fieldErrors],
  );

  const markTouched = useCallback((fieldId: string): void => {
    setTouched((previous) => {
      if (previous.has(fieldId)) return previous;
      return new Set(previous).add(fieldId);
    });
  }, []);

  const goToStep = useCallback((step: StepNumber): void => {
    setCurrentStep(step);
    setTouched(new Set<string>()); // errors belong to the step that showed them
  }, []);

  const goNext = useCallback((): void => {
    if (!stepResult.success || currentStep >= LAST_STEP) return;
    goToStep((currentStep + 1) as StepNumber);
  }, [stepResult, currentStep, goToStep]);

  const goBack = useCallback((): void => {
    if (currentStep <= FIRST_STEP) return;
    goToStep((currentStep - 1) as StepNumber);
  }, [currentStep, goToStep]);

  const submit = useCallback(async (): Promise<void> => {
    // Defence in depth: the last step is the only place an application may be
    // saved, and only once it validates completely. TenantForm checks too, but
    // this guard means no future caller can persist an incomplete record.
    if (currentStep !== LAST_STEP || !canSubmit) return;

    setStatus("submitting");
    setSubmitError("");

    try {
      await submitApplication(draft);
      clearDraft(); // only ever after a confirmed success (Sprint 3.3)
      setStatus("submitted");
    } catch (error) {
      // Technical detail to the developer, friendly Slovak to the applicant.
      console.error("submitApplication failed:", error);
      setSubmitError(SUBMIT_FAILED_MESSAGE);
      setStatus("error");
    }
  }, [currentStep, canSubmit, draft]);

  const reset = useCallback((): void => {
    setDraft(createEmptyCandidateDraft());
    setCurrentStep(FIRST_STEP);
    setTouched(new Set<string>());
    setStatus("idle");
    setSubmitError("");
    clearDraft();
  }, []);

  return {
    draft,
    currentStep,
    canAdvance: stepResult.success,
    canSubmit,
    status,
    submitError,
    stepAnnouncement: stepAnnouncementFor(currentStep),
    update,
    errorFor,
    markTouched,
    goNext,
    goBack,
    submit,
    reset,
  };
}