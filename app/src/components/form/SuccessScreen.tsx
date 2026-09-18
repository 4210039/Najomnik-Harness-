interface SuccessScreenProps {
  onReset: () => void;
}

/**
 * Post-submit confirmation (Sprint 3.3), using the prototype's copy verbatim
 * ("Ďakujeme!" / "Vaše údaje sme prijali. Ozveme sa vám čo najskôr.").
 *
 * There is no applicant-facing id here on purpose: the `anon` role holds an
 * INSERT grant and no SELECT grant, so `submitApplication()` cannot read the id
 * back, and this screen must not pretend otherwise.
 */
export function SuccessScreen({ onReset }: SuccessScreenProps) {
  return (
    <div className="mx-auto mt-14 max-w-[520px] rounded-xl border border-border bg-surface p-10 text-center shadow-sm">
      <div
        aria-hidden="true"
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-light text-3xl"
      >
        ✅
      </div>

      <h2 className="mt-5 font-serif text-[1.6rem] leading-tight text-ink">Ďakujeme!</h2>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
        Vaše údaje sme prijali. Ozveme sa vám čo najskôr.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 cursor-pointer rounded-md bg-accent px-5 py-2.5 text-[0.875rem] font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Vyplniť nový formulár
      </button>
    </div>
  );
}
