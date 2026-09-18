/// <reference types="vite/client" />

/**
 * Ambient declarations for the Vite toolchain.
 *
 * `vite/client` supplies typings for side-effect asset imports (CSS), `import.meta.env`
 * and the `VITE_*` environment variables. Without this file TypeScript 7 rejects
 * `import "./index.css";`.
 */

/**
 * Typed environment variables. Declaring them explicitly means a typo such as
 * `VITE_SUPERBASE_URL` fails the type check instead of silently reporting the
 * app as "not configured" at runtime.
 */
interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcdefghijklm.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon / publishable key. Public by design — RLS enforces access. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}