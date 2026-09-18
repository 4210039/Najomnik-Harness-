import { describeStatus } from "@/components/owner/labels";
import type { Candidate } from "@/lib/candidate";
import { cn } from "@/lib/utils";

interface ApplicantListProps {
  candidates: Candidate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * The owner sidebar list (`.applicant-item`, spec §5.3).
 *
 * NEVER renders Rodné číslo. §7 confines it to the full detail panel, and a list
 * is precisely the surface a landlord scrolls through — possibly with the
 * applicant sitting opposite. Each row shows the name, the pipeline stage and
 * where the person is from, and nothing else.
 */
export function ApplicantList({ candidates, selectedId, onSelect }: ApplicantListProps) {
  return (
    <ul className="flex-1 overflow-y-auto">
      {candidates.map((candidate) => {
        const isActive = candidate.id === selectedId;
        const origin = candidate.residence.origin;

        return (
          <li key={candidate.id}>
            <button
              type="button"
              onClick={() => onSelect(candidate.id)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "w-full cursor-pointer border-b border-border px-4 py-3 text-left transition-colors",
                isActive ? "bg-accent-light" : "bg-surface hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "block truncate text-[0.85rem] font-semibold",
                  isActive ? "text-accent" : "text-ink",
                )}
              >
                {candidate.personal.firstName} {candidate.personal.lastName}
              </span>
              <span className="mt-0.5 block truncate text-[0.75rem] text-muted">
                {describeStatus(candidate.status)}
                {origin === "" ? "" : ` · ${origin}`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}