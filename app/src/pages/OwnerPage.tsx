/**
 * Vlastník (owner) view.
 *
 * Sprint 1.1 deliverable: the layout shell only. The candidate sidebar,
 * detail panel, rating and notes arrive in Sprint 4.2–4.3, behind the
 * Supabase Auth guard added in Sprint 4.1.
 *
 * WARNING: this panel is currently reachable by anyone who clicks the tab.
 * Authentication is Sprint 4.1. Do not deploy this build publicly.
 */
export function OwnerPage() {
  return (
    <div className="flex min-h-[calc(100vh-60px)]">
      <aside className="flex w-[280px] min-w-[260px] flex-col border-r border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 pt-4 pb-3">
          <h2 className="text-[0.6875rem] font-bold tracking-[0.08em] text-subtle uppercase">
            Záujemcovia
          </h2>
          <span className="rounded-full border border-border bg-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-muted">
            0
          </span>
        </div>
        <div className="flex-1 px-5 py-10 text-center text-[0.82rem] leading-relaxed text-subtle">
          Žiadni záujemcovia.
        </div>
      </aside>

      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-bg px-10 py-15 text-center text-muted">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-[14px] border border-border bg-surface-3 text-2xl"
        >
          🏠
        </span>
        <h2 className="font-serif text-[1.25rem] text-ink-3">Vyberte záujemcu</h2>
        <p className="max-w-[320px] text-[0.85rem] leading-relaxed">
          Panel prenajímateľa sa presúva do Reactu v šprintoch 4.2–4.3. Prihlásenie a ochrana
          prístupu prídu v šprinte 4.1.
        </p>
      </div>
    </div>
  );
}