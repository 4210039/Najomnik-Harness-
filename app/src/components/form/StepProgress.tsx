import { cn } from "@/lib/utils";
import { STEP_NAMES, type StepNumber } from "@/types";

interface StepProgressProps {
  currentStep: StepNumber;
}

/**
 * The dot-and-label stepper from the prototype (`.progress-steps`, `.pstep`,
 * `.pstep-dot`, `.plabel`), ported to Tailwind.
 *
 * Deliberately NOT interactive, exactly like the prototype: navigation lives in
 * the Späť/Ďalej buttons, so an applicant can never click forward past a step
 * whose required fields are still empty. The active step is exposed with
 * `aria-current="step"` so the information is available non-visually.
 */
export function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <nav aria-label="Priebeh formulára" className="mt-8">
      <ol className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {STEP_NAMES.map((step) => {
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;

          return (
            <li
              key={step.id}
              aria-current={isActive ? "step" : undefined}
              className="flex items-center gap-2"
            >
              {/* Decorative for assistive tech: the number duplicates what
                  aria-current="step" and the "Krok X z 5" label already say. */}
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.72rem] font-semibold",
                  isActive
                    ? "border-accent bg-accent text-white"
                    : isDone
                      ? "border-accent-mid bg-accent-light text-accent"
                      : "border-border-2 bg-surface-2 text-subtle",
                )}
              >
                {step.id}
              </span>
              <span
                className={cn(
                  "text-[0.8125rem] whitespace-nowrap",
                  isActive ? "font-semibold text-ink" : "font-medium text-muted",
                )}
              >
                {step.sk}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
