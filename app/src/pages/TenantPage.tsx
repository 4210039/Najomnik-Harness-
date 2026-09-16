import { STEP_NAMES } from "@/types";

/**
 * Záujemca (tenant) view.
 *
 * Sprint 1.1 deliverable: the layout shell with correct spacing, typography
 * and palette. The interactive 5-step form with validation arrives in
 * Sprint 3.1–3.3. Until it ships, najomnik.html remains the reference
 * implementation for form behaviour.
 */
export function TenantPage() {
  return (
    <div className="mx-auto max-w-[700px] px-5 pt-10 pb-20">
      <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-accent uppercase">
        Prenájom bytu
      </p>
      <h1 className="font-serif text-[1.875rem] leading-tight text-ink">Formulár záujemcu</h1>
      <p className="mt-2 max-w-[520px] text-[0.9rem] leading-relaxed text-muted">
        Vyplňte prosím všetky polia čo najpresnejšie — pomôže nám to lepšie posúdiť vašu žiadosť.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-[0.6875rem] font-bold tracking-[0.08em] text-subtle uppercase">
          Kroky formulára
        </h2>
        <ol className="mt-4 flex flex-wrap gap-2">
          {STEP_NAMES.map((step) => (
            <li
              key={step.id}
              className="rounded-full border border-border-2 bg-surface-2 px-3 py-1 text-[0.8125rem] font-medium text-ink-3"
            >
              {step.id}. {step.sk}
            </li>
          ))}
        </ol>
        <p className="mt-5 border-t border-border pt-4 text-[0.8125rem] leading-relaxed text-muted">
          Interaktívny formulár sa presúva do Reactu v šprinte 3.1. Dovtedy je referenčná
          implementácia v súbore <code className="text-ink-3">najomnik.html</code>.
        </p>
      </div>
    </div>
  );
}