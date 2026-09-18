import { SignInForm } from "@/components/owner/SignInForm";
import type { OwnerAuthController } from "@/hooks/useAuthSession";

interface OwnerGateProps {
  auth: OwnerAuthController;
}

/**
 * Everything the owner side shows until a landlord is signed in.
 *
 * Spec §3.2: the Owner tab must pass the gate before revealing the panel — so
 * the gate is what the tab renders, not an overlay on top of a visible panel.
 * Nothing belonging to the panel is mounted while signed out.
 */
export function OwnerGate({ auth }: OwnerGateProps) {
  if (auth.status === "loading") {
    return (
      <p role="status" className="mx-auto mt-16 text-center text-[0.85rem] text-muted">
        Načítavam…
      </p>
    );
  }

  if (auth.status === "unavailable") {
    return (
      <div className="mx-auto mt-16 max-w-[420px] px-5 text-center">
        <h2 className="font-serif text-[1.3rem] leading-tight text-ink">
          Prihlásenie nie je dostupné
        </h2>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
          Aplikácia nie je prepojená s databázou. Skontrolujte prosím nastavenie
          <code className="mx-1 text-ink-3">app/.env.local</code>a obnovte stránku.
        </p>
      </div>
    );
  }

  return <SignInForm error={auth.error} isSubmitting={auth.isSubmitting} onSubmit={auth.signIn} />;
}