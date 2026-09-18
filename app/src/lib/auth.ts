import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getSupabase } from "./supabase";

/**
 * Landlord authentication (Sprint 4.1).
 *
 * Supabase Auth replaces Phase 1's password gate entirely. That gate hashed the
 * password with SHA-256 into localStorage and fell back to a hardcoded
 * `admin123` (§12.1) — a value anyone could read from the page source. Auth here
 * is server-verified, and the `authenticated` role is what unlocks the RLS
 * policies on `public.candidates`.
 *
 * Every function takes the client as an optional last argument, matching
 * `candidates.ts`, so tests can inject a fake instead of reaching the network.
 */

/**
 * Supabase answers a bad sign-in in English ("Invalid login credentials"). The
 * landlord is Slovak and should never see a raw provider message, so the two
 * outcomes that matter are mapped here. Anything unrecognised becomes the
 * generic failure — never the original string, which can name internals.
 */
export const INVALID_CREDENTIALS_MESSAGE = "Nesprávny e-mail alebo heslo.";
export const SIGN_IN_FAILED_MESSAGE = "Prihlásenie sa nepodarilo. Skúste to prosím znova.";

export function toSlovakAuthError(message: string): string {
  return /invalid login credentials/i.test(message)
    ? INVALID_CREDENTIALS_MESSAGE
    : SIGN_IN_FAILED_MESSAGE;
}

/** The signed-in landlord, or `null` when the session is absent or expired. */
export async function getOwnerSession(client: SupabaseClient = getSupabase()): Promise<User | null> {
  const { data, error } = await client.auth.getSession();

  // A failed session lookup is treated as "not signed in": the gate then shows
  // the sign-in form, which is a recoverable state, rather than an error screen.
  if (error) return null;
  return data.session?.user ?? null;
}

/** Sign in and return the landlord. Throws Slovak copy on failure. */
export async function signInOwner(
  email: string,
  password: string,
  client: SupabaseClient = getSupabase(),
): Promise<User> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) throw new Error(toSlovakAuthError(error.message));
  if (data.user === null) throw new Error(SIGN_IN_FAILED_MESSAGE);
  return data.user;
}

/**
 * Sign out. The session lives in localStorage (`persistSession: true` in
 * `supabase.ts`), so this is what actually locks the panel again.
 */
export async function signOutOwner(client: SupabaseClient = getSupabase()): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw new Error(SIGN_IN_FAILED_MESSAGE);
}

/**
 * Watch for sign-in and sign-out — including the token refresh that happens in
 * another tab. Returns the unsubscribe function, which is what a React effect
 * needs to clean up.
 */
export function subscribeToAuthChanges(
  onChange: (user: User | null) => void,
  client: SupabaseClient = getSupabase(),
): () => void {
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    onChange(session?.user ?? null);
  });

  return () => data.subscription.unsubscribe();
}