import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `supabase.ts` reads `import.meta.env` when the module is first evaluated, so
 * each test stubs the environment, resets the module registry, and re-imports.
 * Without the reset the first import would win and every later assertion would
 * be testing a stale module instance.
 */
async function importSupabaseModule() {
  vi.resetModules();
  return await import("./supabase");
}

const TEST_URL = "https://testproject.supabase.co";
const TEST_KEY = "sb_publishable_test_key";

describe("Supabase client (Sprint 1.2)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("reports itself unconfigured when both variables are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const { isSupabaseConfigured } = await importSupabaseModule();

    expect(isSupabaseConfigured).toBe(false);
  });

  it("treats whitespace-only values as missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "   ");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "  ");

    const { isSupabaseConfigured } = await importSupabaseModule();

    expect(isSupabaseConfigured).toBe(false);
  });

  it("stays unconfigured when only one of the two variables is set", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", TEST_URL);
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const { isSupabaseConfigured } = await importSupabaseModule();

    expect(isSupabaseConfigured).toBe(false);
  });

  it("explains how to fix an unconfigured client instead of failing obscurely", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const { getSupabase } = await importSupabaseModule();

    expect(() => getSupabase()).toThrowError(/Supabase is not configured/);
    expect(() => getSupabase()).toThrowError(/\.env\.local/);
  });

  it("defers the failure to first use, so an unconfigured app still boots", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    // Importing must not throw: no client is allocated until data is requested.
    const module = await importSupabaseModule();

    expect(module.isSupabaseConfigured).toBe(false);
    expect(module.getSupabase).toBeTypeOf("function");
  });

  it("becomes configured once both variables are present", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", TEST_URL);
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", TEST_KEY);

    const { isSupabaseConfigured } = await importSupabaseModule();

    expect(isSupabaseConfigured).toBe(true);
  });

  it("returns a single shared instance so the auth session is not duplicated", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", TEST_URL);
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", TEST_KEY);

    const { getSupabase } = await importSupabaseModule();

    expect(getSupabase()).toBe(getSupabase());
  });
});