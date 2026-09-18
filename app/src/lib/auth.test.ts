import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import {
  INVALID_CREDENTIALS_MESSAGE,
  SIGN_IN_FAILED_MESSAGE,
  getOwnerSession,
  signInOwner,
  signOutOwner,
  subscribeToAuthChanges,
  toSlovakAuthError,
} from "./auth";

/** A stand-in for `client.auth`, with each method overridable per test. */
function fakeClient(overrides: Record<string, unknown> = {}): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      ...overrides,
    },
  } as unknown as SupabaseClient;
}

const LANDLORD = { email: "prenajimatel@example.com" };

describe("toSlovakAuthError (§6: the landlord never sees English)", () => {
  it("maps a wrong credential onto Slovak copy", () => {
    expect(toSlovakAuthError("Invalid login credentials")).toBe(INVALID_CREDENTIALS_MESSAGE);
  });

  it("matches the provider's wording regardless of case", () => {
    expect(toSlovakAuthError("invalid LOGIN credentials")).toBe(INVALID_CREDENTIALS_MESSAGE);
  });

  it("falls back to a generic message for anything unrecognised", () => {
    expect(toSlovakAuthError("AuthApiError: unexpected_failure")).toBe(SIGN_IN_FAILED_MESSAGE);
  });

  it("never passes the provider's own message through", () => {
    const provider = "relation \"users\" does not exist";
    expect(toSlovakAuthError(provider)).not.toContain(provider);
  });
});

describe("getOwnerSession", () => {
  it("returns the signed-in landlord", async () => {
    const client = fakeClient({
      getSession: vi.fn(async () => ({ data: { session: { user: LANDLORD } }, error: null })),
    });

    expect(await getOwnerSession(client)).toEqual(LANDLORD);
  });

  it("returns null when nobody is signed in", async () => {
    expect(await getOwnerSession(fakeClient())).toBeNull();
  });

  it("treats a failed lookup as signed out, which is recoverable", async () => {
    const client = fakeClient({
      getSession: vi.fn(async () => ({ data: { session: null }, error: { message: "boom" } })),
    });

    expect(await getOwnerSession(client)).toBeNull();
  });
});

describe("signInOwner", () => {
  it("returns the landlord on success", async () => {
    const client = fakeClient({
      signInWithPassword: vi.fn(async () => ({ data: { user: LANDLORD }, error: null })),
    });

    expect(await signInOwner("prenajimatel@example.com", "tajne", client)).toEqual(LANDLORD);
  });

  it("passes the credentials through unchanged", async () => {
    const signInWithPassword = vi.fn(async () => ({ data: { user: LANDLORD }, error: null }));
    const client = fakeClient({ signInWithPassword });

    await signInOwner("prenajimatel@example.com", "tajne", client);

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "prenajimatel@example.com",
      password: "tajne",
    });
  });

  it("throws Slovak copy for wrong credentials", async () => {
    const client = fakeClient({
      signInWithPassword: vi.fn(async () => ({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      })),
    });

    await expect(signInOwner("a@b.sk", "zle", client)).rejects.toThrowError(
      INVALID_CREDENTIALS_MESSAGE,
    );
  });

  it("throws rather than returning a missing user", async () => {
    const client = fakeClient({
      signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: null })),
    });

    await expect(signInOwner("a@b.sk", "x", client)).rejects.toThrowError(SIGN_IN_FAILED_MESSAGE);
  });
});

describe("signOutOwner", () => {
  it("resolves on success", async () => {
    await expect(signOutOwner(fakeClient())).resolves.toBeUndefined();
  });

  it("throws Slovak copy when the sign-out fails", async () => {
    const client = fakeClient({ signOut: vi.fn(async () => ({ error: { message: "boom" } })) });

    await expect(signOutOwner(client)).rejects.toThrowError(SIGN_IN_FAILED_MESSAGE);
  });
});

describe("subscribeToAuthChanges", () => {
  it("reports the landlord after a sign-in event", () => {
    const emitters: Array<(event: string, session: unknown) => void> = [];
    const client = fakeClient({
      onAuthStateChange: vi.fn((callback: (event: string, session: unknown) => void) => {
        emitters.push(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    });
    const onChange = vi.fn();

    subscribeToAuthChanges(onChange, client);
    emitters[0]?.("SIGNED_IN", { user: LANDLORD });

    expect(onChange).toHaveBeenCalledWith(LANDLORD);
  });

  it("reports null after a sign-out event", () => {
    const emitters: Array<(event: string, session: unknown) => void> = [];
    const client = fakeClient({
      onAuthStateChange: vi.fn((callback: (event: string, session: unknown) => void) => {
        emitters.push(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    });
    const onChange = vi.fn();

    subscribeToAuthChanges(onChange, client);
    emitters[0]?.("SIGNED_OUT", null);

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("unsubscribes when the caller unsubscribes, so React effects can clean up", () => {
    const unsubscribe = vi.fn();
    const client = fakeClient({
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } })),
    });

    const stop = subscribeToAuthChanges(vi.fn(), client);
    stop();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});