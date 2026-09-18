import { useCallback, useEffect, useMemo, useState } from "react";

import { listCandidates } from "@/lib/candidates";
import type { Candidate } from "@/lib/candidate";

/**
 * Loads the applicant list for the owner panel (Sprint 4.2).
 *
 * Only ever mounted behind the Sprint 4.1 gate: `listCandidates()` runs as the
 * `authenticated` role, which is exactly what the RLS policies on
 * `public.candidates` require. There is deliberately no polling — the volume is
 * a few hundred rows at most, so `reload()` after a write is enough.
 */

export type CandidatesStatus = "loading" | "ready" | "error";

/** New copy — listed in §13 of the specification for ratification. */
export const CANDIDATES_FAILED_MESSAGE =
  "Zoznam záujemcov sa nepodarilo načítať. Skúste to prosím znova.";

export interface CandidatesController {
  status: CandidatesStatus;
  candidates: Candidate[];
  error: string;
  /** The applicant whose detail is shown, or `null` when the list is empty. */
  selectedId: string | null;
  selected: Candidate | null;
  selectCandidate: (id: string) => void;
  reload: () => Promise<void>;
}

export function useCandidates(): CandidatesController {
  const [status, setStatus] = useState<CandidatesStatus>("loading");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setStatus("loading");

    try {
      const loaded = await listCandidates();
      setCandidates(loaded);
      setStatus("ready");

      // Keep the current selection when it still exists, otherwise fall back to
      // the newest applicant so the detail pane is never pointlessly empty.
      setSelectedId((current) =>
        loaded.some((candidate) => candidate.id === current)
          ? current
          : (loaded[0]?.id ?? null),
      );
    } catch (cause) {
      // The technical detail helps a developer; the landlord gets Slovak copy.
      console.error("listCandidates failed:", cause);
      setError(CANDIDATES_FAILED_MESSAGE);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  return {
    status,
    candidates,
    error,
    selectedId,
    selected,
    selectCandidate: setSelectedId,
    reload,
  };
}