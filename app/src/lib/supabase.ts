import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client singleton (Sprint 1.2).
 *
 * Configuration arrives through `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
 * Vite inlines every `VITE_`-prefixed variable into the public bundle, so the
 * **anon / publishable** key belongs here and the **service_role / secret** key
 * must never appear in one. A secret key bypasses Row Level Security entirely —
 * in a `VITE_` variable it would be readable by every visitor of the site.
 *
 * The client is created lazily rather than at module load, for two reasons:
 *   1. Tests and `npm run dev` run without a `.env.local`, so merely importing
 *      this module must not fail before anyone asks for data.
 *   2. `createClient` allocates a session manager and a Realtime websocket. Those
 *      should not exist until a screen genuinely needs them.
 */

/** Normalise an env value; an unset or whitespace-only variable counts as absent. */
function readEnvVariable(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const supabaseUrl = readEnvVariable(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = readEnvVariable(import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * `false` until both variables are filled in. Screens can use this to render a
 * "not connected" notice instead of throwing at the user.
 */
export const isSupabaseConfigured = supabaseUrl !== "" && supabaseAnonKey !== "";

let cachedClient: SupabaseClient | null = null;

const NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured. Copy app/.env.example to app/.env.local, set " +
  "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the project's dashboard " +
  "(Project Settings -> API), then restart the dev server.";

/**
 * The shared Supabase client. Throws a descriptive error when the environment
 * is not configured — a deliberate failure, since silently querying nothing
 * would be far harder to debug than a clear message.
 *
 * The database type parameter is left off until `supabase gen types typescript`
 * can be run against the live project; generated types replace it wholesale.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);

  cachedClient ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // the landlord stays signed in across reloads
      autoRefreshToken: true, // refresh before the JWT expires
      detectSessionInUrl: true, // required for the Sprint 4.1 password-recovery link
    },
  });

  return cachedClient;
}