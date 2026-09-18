import type { ComponentType } from "react";

import { StepProgress } from "@/components/form/StepProgress";
import { SuccessScreen } from "@/components/form/SuccessScreen";
import type { StepProps } from "@/components/form/stepProps";
import { ApartmentStep } from "@/components/form/steps/ApartmentStep";
import { PersonalStep } from "@/components/form/steps/PersonalStep";
import { ResidenceStep } from "@/components/form/steps/ResidenceStep";
import { SituationStep } from "@/components/form/steps/SituationStep";
import { StudyWorkStep } from "@/components/form/steps/StudyWorkStep";
import { FIRST_STEP, LAST_STEP, useTenantForm } from "@/hooks/useTenantForm";
import type { StepNumber } from "@/types";

const STEP_COMPONENTS: Record<StepNumber, ComponentType<StepProps>> = {
  1: PersonalStep,
  2: ResidenceStep,
  3: StudyWorkStep,
  4: ApartmentStep,
  5: SituationStep,
};

/** Explains why Ďalej is unavailable, so the disabled button is not a dead end. */
const STEP_INCOMPLETE_MESSAGE = "Vyplňte povinné polia, aby ste mohli pokračovať.";

/**
 * Shown instead when the last step is reached but an earlier step is invalid —
 * the applicant cannot see which field is at fault from here, so the copy points
 * backwards rather than repeating the field-level wording.
 * TODO (spec §6.3): both strings need ratifying in the canonical glossary.
 */
const EARLIER_STEP_INCOMPLETE_MESSAGE =
  "Skontrolujte povinné polia v predchádzajúcich krokoch.";

const PRIMARY_BUTTON =
  "cursor-pointer rounded-md bg-accent px-5 py-2.5 text-[0.875rem] font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle";
const SUBMIT_BUTTON =
  "cursor-pointer rounded-md bg-green px-5 py-2.5 text-[0.875rem] font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle";
const SECONDARY_BUTTON =
  "cursor-pointer rounded-md border border-border-2 bg-surface px-5 py-2.5 text-[0.875rem] font-semibold text-ink-3 transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:text-subtle";

/**
 * The 5-step applicant wizard (Sprint 3.1–3.3).
 *
 * Only the active step is mounted. All state lives in `useTenantForm`, so
 * nothing is lost by unmounting — and the document never contains hidden form
 * controls that assistive technology could stumble into.
 *
 * `noValidate` disables the browser's own bubbles: validation is Zod's job, so
 * the messages match the §6.3 glossary and the database constraints exactly.
 */
export function TenantForm() {
  const form = useTenantForm();

  if (form.status === "submitted") {
    return <SuccessScreen onReset={form.reset} />;
  }

  const StepComponent = STEP_COMPONENTS[form.currentStep];
  const stepProps: StepProps = {
    draft: form.draft,
    update: form.update,
    errorFor: form.errorFor,
    markTouched: form.markTouched,
  };

  const isLastStep = form.currentStep === LAST_STEP;
  const isSubmitting = form.status === "submitting";
  const isBlocked = isLastStep ? !form.canSubmit : !form.canAdvance;
  const statusMessageId = "step-status";
  const statusMessage = isLastStep
    ? EARLIER_STEP_INCOMPLETE_MESSAGE
    : STEP_INCOMPLETE_MESSAGE;

  return (
    <>
      <StepProgress currentStep={form.currentStep} />

      {/* §8: every step change is announced to screen readers. */}
      <p aria-live="polite" className="sr-only">
        {form.stepAnnouncement}
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          // A <form> submits implicitly when Enter is pressed in a text input —
          // from ANY step. Unguarded, that saved a half-finished application and
          // skipped every remaining step (found by manual testing: Enter in the
          // date field on Byt went straight to the confirmation, so Situácia was
          // never shown). The wizard therefore owns the decision: Enter means
          // "continue" until the last step, where it means "submit".
          event.preventDefault();

          if (!isLastStep) {
            form.goNext(); // itself a no-op unless the current step validates
            return;
          }

          if (form.canSubmit && !isSubmitting) void form.submit();
        }}
      >
        <StepComponent {...stepProps} />

        {isBlocked ? (
          <p id={statusMessageId} role="status" className="mt-5 text-[0.8rem] text-muted">
            {statusMessage}
          </p>
        ) : null}

        {form.status === "error" ? (
          <p
            role="alert"
            className="mt-5 rounded-md border border-danger bg-danger-light px-3 py-2 text-[0.82rem] font-medium text-danger"
          >
            {form.submitError}
          </p>
        ) : null}

        <div className="mt-6 flex items-end justify-between gap-4">
          {form.currentStep > FIRST_STEP ? (
            <button
              type="button"
              onClick={form.goBack}
              disabled={isSubmitting}
              className={SECONDARY_BUTTON}
            >
              ← Späť
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-4">
            <span className="text-[0.8rem] whitespace-nowrap text-muted">
              Krok <strong className="font-semibold text-ink-3">{form.currentStep}</strong> z{" "}
              {LAST_STEP}
            </span>

            {isLastStep ? (
              <button
                type="submit"
                disabled={!form.canSubmit || isSubmitting}
                aria-describedby={isBlocked ? statusMessageId : undefined}
                className={SUBMIT_BUTTON}
              >
                {isSubmitting ? "Odosielam…" : "Odoslať žiadosť ✓"}
              </button>
            ) : (
              <button
                type="button"
                onClick={form.goNext}
                disabled={!form.canAdvance}
                aria-describedby={isBlocked ? statusMessageId : undefined}
                className={PRIMARY_BUTTON}
              >
                Ďalej →
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}