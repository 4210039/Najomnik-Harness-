import { TenantForm } from "@/components/form/TenantForm";

/**
 * Záujemca (tenant) view.
 *
 * The page header is the prototype's `.tenant-header`; everything below it is
 * the interactive 5-step form (Sprint 3.1–3.3), which owns its own state,
 * validation, draft saving and submission.
 *
 * `najomnik.html` remains the behavioural reference for anything not yet ported
 * — the owner panel in particular (Sprints 4.1–4.3).
 */
export function TenantPage() {
  return (
    <div className="mx-auto max-w-[700px] px-5 pt-10 pb-20">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-accent uppercase">
          Prenájom bytu
        </p>
        <h1 className="font-serif text-[1.875rem] leading-tight text-ink">Formulár záujemcu</h1>
        <p className="mt-2 max-w-[520px] text-[0.9rem] leading-relaxed text-muted">
          Vyplňte prosím všetky polia čo najpresnejšie — pomôže nám to lepšie posúdiť vašu
          žiadosť.
        </p>
      </div>

      <TenantForm />
    </div>
  );
}