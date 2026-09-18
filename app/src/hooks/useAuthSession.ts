import { useCallback, useEffect, useState } from "react";

import { SIGN_IN_FAILED_MESSAGE, getOwnerSession, signInOwner, signOutOwner, subscribeToAuthChanges } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * `loading`   — the session is still being read; render nothing decisive yet.
 * `signedOut` — show the sign-in form.
 * `signedIn`  — reveal the owner panel.
 * `unavailable` — the Supabase env vars are missing, so auth cannot run at all.
 */
export type OwnerAuthStatus = "loading" | "signedOut" | "signedIn" | "unavailable";

export interface OwnerAuthController {
  status: OwnerAuthStatus;
  /** The signed-in landlord's address, for the panel header. */
  email: string;
  /** Slovak message from the last failed attempt. */
  error: string;
  isSubmitting: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * The landlord's auth session (Sprint 4.1).
 *
 * The session is read once on mount and then kept in step through
 * `onAuthStateChange`, which also covers a token refresh or sign-out happening
 * in another tab. `persistSession: true` means a reload stays signed in — a
 * deliberate change from Phase 1, where unlocking lasted only for the tab
 * (recorded in §13 of the specification).
 */
export function useAuthSession(): OwnerAuthController {
  const [status, setStatus] = useState<OwnerAuthStatus>("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("unavailable");
      return;
    }

    let isActive = true;

    const applyUser = (user: { email?: string } | null): void => {
      if (!isActive) return;
      setEmail(user?.email ?? "");
      setStatus(user === null ? "signedOut" : "signedIn");
    };

    // Subscribing first closes the gap where a sign-in completes between the
    // initial read and the listener being attached.
    const unsubscribe = subscribeToAuthChanges(applyUser);

    void getOwnerSession()
      .then(applyUser)
      .catch(() => {
        // A client that cannot even be created is unconfigured in practice.
        if (isActive) setStatus("unavailable");
      });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (address: string, password: string): Promise<void> => {
    setIsSubmitting(true);
    setError("");

    try {
      const user = await signInOwner(address, password);
      setEmail(user.email ?? "");
      setStatus("signedIn");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : SIGN_IN_FAILED_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setError("");

    try {
      await signOutOwner();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : SIGN_IN_FAILED_MESSAGE);
    } finally {
      // The gate closes either way: a failed sign-out must never leave the panel
      // looking unlocked.
      setEmail("");
      setStatus("signedOut");
    }
  }, []);

  return { status, email, error, isSubmitting, signIn, signOut };
}