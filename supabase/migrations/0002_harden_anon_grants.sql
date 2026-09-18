-- ============================================================================
-- NájomApp — migration 0002: fail-closed table grants for the `anon` role
--
-- WHY THIS EXISTS
--   Migration 0001 assumed the project had been created with "Automatically
--   expose new tables" OFF, and on that assumption granted `anon` exactly one
--   table privilege: INSERT. Verifying the live project on 2026-09-18 proved the
--   assumption wrong — Supabase's default grants are present in addition, so
--   `anon` also carries SELECT, UPDATE and DELETE on public.candidates:
--
--     GET    /rest/v1/candidates?select=id            -> 200, content-range: */0
--     PATCH  /rest/v1/candidates?id=eq.<no-such-id>    -> 204
--     DELETE /rest/v1/candidates?id=eq.<no-such-id>    -> 204
--
--   No applicant data is exposed as things stand: RLS is enabled and the only
--   `anon` policy is `applicants_may_submit` (INSERT only), so a read returns
--   zero rows and an update/delete matches zero rows. But the surplus grants are
--   a latent hole — they go live the moment anyone adds a permissive `anon`
--   policy, or RLS is disabled by accident — and 0001's own §9(b) verification
--   ("expect anon -> INSERT only") can no longer pass.
--
--   This migration restores the intended posture: `anon` may INSERT and do
--   nothing else. It is idempotent, touches no data, and is safe to re-run.
--
-- ROOT CAUSE TO FIX IN THE DASHBOARD (not reachable from SQL)
--   Project Settings -> Data API -> turn "Automatically expose new tables" OFF.
--   Otherwise every table added in later sprints starts life this permissive.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. anon: INSERT, and only INSERT
--    `revoke all` first so the file is correct no matter which default grants
--    the project happens to carry.
-- ---------------------------------------------------------------------------
revoke all on table public.candidates from anon;
grant insert on table public.candidates to anon;


-- ---------------------------------------------------------------------------
-- 2. authenticated: restated so this file is self-sufficient.
--    These are the four privileges 0001 grants, and they are what the landlord
--    dashboard needs. Which ROWS each may touch is still decided by the RLS
--    policies in 0001 — grants and policies are independent layers.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table public.candidates to authenticated;


-- ---------------------------------------------------------------------------
-- 3. Verification — run separately.
--
-- (a) Expect anon -> INSERT only, authenticated -> the four CRUD privileges.
--     select grantee, privilege_type
--       from information_schema.role_table_grants
--      where table_name = 'candidates'
--      order by grantee, privilege_type;
--
-- (b) From outside, with the anon key, reading must now be DENIED
--     (401 "permission denied for table candidates") instead of a 200 with an
--     empty list — while an insert must still succeed (201). Do NOT test this in
--     the SQL Editor: it runs as a superuser and bypasses both grants and RLS.
--
-- NOTE (Sprint 4.1, not fixed here): public.touch_updated_at() is a trigger
-- function that PostgreSQL grants EXECUTE on to PUBLIC by default. It is never
-- called directly, so revoking that EXECUTE — and pinning its search_path —
-- belongs with the rest of the Sprint 4.1 database hardening, after it has been
-- verified against real inserts.
-- ============================================================================
