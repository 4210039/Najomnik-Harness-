/**
 * Typed CRUD for `public.candidates` (Sprint 2.1).
 *
 * The only module that talks to the `candidates` table. It converts between the
 * nested canonical record and the flat columns (see `./candidate.ts`), and it
 * is the place where the RLS design surfaces in code:
 *
 *   * `submitApplication()` is the TENANT path. `anon` holds an INSERT grant and
 *     no SELECT grant, so the row is written and deliberately **not** read back
 *     — asking for it would fail with a permission error.
 *   * Everything else is the LANDLORD path and runs as `authenticated`, which
 *     holds SELECT/INSERT/UPDATE/DELETE.
 *
 * Every function takes the client as an optional last argument so tests can
 * inject a fake; in the app the shared singleton is used.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  candidateDraftToRow,
  flattenCandidatePatch,
  rowToCandidate,
  type Candidate,
  type CandidateDraft,
  type CandidatePatch,
  type CandidateRow,
} from "./candidate";
import type { OwnerReview } from "./candidateSchema";
import { getSupabase } from "./supabase";

export const CANDIDATES_TABLE = "candidates";

/** A tenant submission: the collected draft plus the listing it came from. */
export type NewCandidate = CandidateDraft & { listingId?: string | null };

/**
 * Turn a PostgREST error into an Error that names the failed operation.
 *
 * The API's own message is appended rather than swallowed — it is what tells
 * an RLS denial apart from a constraint violation — but no row data is echoed,
 * so sensitive values (Rodné číslo above all) never reach a log (§7).
 */
function fail(operation: string, error: { message: string } | null): never {
  throw new Error(
    `Supabase ${operation} on "${CANDIDATES_TABLE}" failed: ${error?.message ?? "unknown error"}`,
  );
}

/** Every applicant, newest first — the owner sidebar's default order. */
export async function listCandidates(client: SupabaseClient = getSupabase()): Promise<Candidate[]> {
  const { data, error } = await client
    .from(CANDIDATES_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) fail("select", error);
  return (data ?? []).map((row) => rowToCandidate(row as CandidateRow));
}

/** One applicant, or `null` when the id no longer exists. */
export async function getCandidateById(
  id: string,
  client: SupabaseClient = getSupabase(),
): Promise<Candidate | null> {
  const { data, error } = await client
    .from(CANDIDATES_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) fail("select", error);
  return data === null ? null : rowToCandidate(data as CandidateRow);
}

/**
 * Tenant path: submit an application.
 *
 * No `.select()` — the `anon` role may not read the table, so the created id is
 * not returned and the confirmation screen must not pretend otherwise. `status`
 * is left to the column default ('pending') and the owner-only columns stay
 * NULL, exactly as the `applicants_may_submit` policy requires.
 */
export async function submitApplication(
  draft: NewCandidate,
  client: SupabaseClient = getSupabase(),
): Promise<void> {
  const { listingId = null, ...fields } = draft;
  const { error } = await client
    .from(CANDIDATES_TABLE)
    .insert(candidateDraftToRow(fields, listingId));

  if (error) fail("insert", error);
}

/**
 * Landlord path: create a record typed in by the owner, returning it with its
 * database-generated id, timestamps and default status.
 */
export async function createCandidate(
  draft: NewCandidate,
  client: SupabaseClient = getSupabase(),
): Promise<Candidate> {
  const { listingId = null, ...fields } = draft;
  const { data, error } = await client
    .from(CANDIDATES_TABLE)
    .insert(candidateDraftToRow(fields, listingId))
    .select("*")
    .single();

  if (error) fail("insert", error);
  return rowToCandidate(data as CandidateRow);
}

/**
 * Apply a partial update. Returns the stored row, so callers can render the
 * server's `updated_at` rather than trusting their own optimistic copy.
 */
export async function updateCandidate(
  id: string,
  patch: CandidatePatch,
  client: SupabaseClient = getSupabase(),
): Promise<Candidate> {
  const columns = flattenCandidatePatch(patch);
  if (Object.keys(columns).length === 0) {
    throw new Error("updateCandidate: refusing to send an empty patch");
  }

  const { data, error } = await client
    .from(CANDIDATES_TABLE)
    .update(columns)
    .eq("id", id)
    .select("*")
    .single();

  if (error) fail("update", error);
  return rowToCandidate(data as CandidateRow);
}

/** Save the owner's rating, notes, Facebook link and pipeline stage at once. */
export async function updateOwnerReview(
  id: string,
  review: OwnerReview,
  client: SupabaseClient = getSupabase(),
): Promise<Candidate> {
  return updateCandidate(
    id,
    {
      status: review.status,
      owner: { rating: review.rating, notes: review.notes, facebookUrl: review.facebookUrl },
    },
    client,
  );
}

/** Hard delete. The owner panel offers this only from the detail view. */
export async function deleteCandidate(
  id: string,
  client: SupabaseClient = getSupabase(),
): Promise<void> {
  const { error } = await client.from(CANDIDATES_TABLE).delete().eq("id", id);

  if (error) fail("delete", error);
}
