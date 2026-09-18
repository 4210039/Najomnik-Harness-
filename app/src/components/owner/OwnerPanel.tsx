import { ApplicantDetail } from "@/components/owner/ApplicantDetail";
import { ApplicantList } from "@/components/owner/ApplicantList";
import { useCandidates } from "@/hooks/useCandidates";

interface OwnerPanelProps {
  email: string;
  onSignOut: () => Promise<void>;
}

/**
 * The signed-in owner panel (Sprint 4.2).
 *
 * Only reachable behind the Sprint 4.1 gate, and only mounted with a session, so
 * every read here runs as the `authenticated` role — which is what the RLS
 * policies on `public.candidates` require.
 *
 * Rating, notes and stage changes are Sprint 4.3; this view is read-only.
 */
export function OwnerPanel({ email, onSignOut }: OwnerPanelProps) {
  const { status, candidates, error, selectedId, selected, selectCandidate, reload } =
    useCandidates();

  return (
    <div className="flex min-h-[calc(100vh-60px)] flex-col">
      <div className="flex items-center justify-end gap-3 border-b border-border bg-surface-2 px-4 py-2">
        <span className="text-[0.75rem] text-muted">{email}</span>
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="cursor-pointer rounded-sm border border-border-2 bg-surface px-3 py-1 text-[0.75rem] font-medium text-ink-3 transition-colors hover:bg-surface-3"
        >
          Odhlásiť sa
        </button>
      </div>

      <div className="flex flex-1">
        <aside className="flex w-[280px] min-w-[260px] flex-col border-r border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 pt-4 pb-3">
            <h2 className="text-[0.6875rem] font-bold tracking-[0.08em] text-subtle uppercase">
              Záujemcovia
            </h2>
            <span className="rounded-full border border-border bg-surface-3 px-2 py-0.5 text-[0.7rem] font-semibold text-muted">
              {candidates.length}
            </span>
          </div>

          {status === "loading" ? (
            <p role="status" className="flex-1 px-5 py-10 text-center text-[0.82rem] text-muted">
              Načítavam…
            </p>
          ) : null}

          {status === "error" ? (
            <div className="flex-1 px-5 py-8 text-center">
              <p role="alert" className="text-[0.82rem] leading-relaxed text-danger">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-3 cursor-pointer rounded-sm border border-border-2 bg-surface px-3 py-1 text-[0.75rem] font-medium text-ink-3 transition-colors hover:bg-surface-3"
              >
                Skúsiť znova
              </button>
            </div>
          ) : null}

          {status === "ready" && candidates.length === 0 ? (
            <p className="flex-1 px-5 py-10 text-center text-[0.82rem] leading-relaxed text-subtle">
              Žiadni záujemcovia.
            </p>
          ) : null}

          {status === "ready" && candidates.length > 0 ? (
            <ApplicantList
              candidates={candidates}
              selectedId={selectedId}
              onSelect={selectCandidate}
            />
          ) : null}
        </aside>

        {selected === null ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-bg px-10 py-15 text-center text-muted">
            <span
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-[14px] border border-border bg-surface-3 text-2xl"
            >
              🏠
            </span>
            <h2 className="font-serif text-[1.25rem] text-ink-3">Vyberte záujemcu</h2>
            <p className="max-w-[320px] text-[0.85rem] leading-relaxed">
              Vyberte záujemcu zo zoznamu vľavo a zobrazia sa všetky jeho údaje.
            </p>
          </div>
        ) : (
          <ApplicantDetail candidate={selected} />
        )}
      </div>
    </div>
  );
}