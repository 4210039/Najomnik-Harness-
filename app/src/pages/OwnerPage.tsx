import { OwnerGate } from "@/components/owner/OwnerGate";
import { OwnerPanel } from "@/components/owner/OwnerPanel";
import { useAuthSession } from "@/hooks/useAuthSession";

/**
 * Vlastník (owner) view — behind the Sprint 4.1 authentication gate.
 *
 * Spec §3.2: "The Owner tab must pass the password gate before revealing the
 * panel." Phase 1 hid the gate behind a triple-click ghost button (§12.1); here
 * clicking the tab *is* the gate, and no part of the panel mounts while signed
 * out, so there is nothing to reveal by accident.
 *
 * The signed-in panel is still a layout placeholder — the applicant sidebar,
 * detail view, rating and notes are Sprints 4.2–4.3.
 */
export function OwnerPage() {
  const auth = useAuthSession();

  if (auth.status === "signedIn") {
    return <OwnerPanel email={auth.email} onSignOut={auth.signOut} />;
  }

  return <OwnerGate auth={auth} />;
}