import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnerGate } from "@/components/owner/OwnerGate";
import { INVALID_CREDENTIALS_MESSAGE } from "@/lib/auth";
import type { OwnerAuthController } from "@/hooks/useAuthSession";
import { OwnerPage } from "@/pages/OwnerPage";

/**
 * A fake `client.auth`, injected through a mocked `@/lib/supabase`.
 *
 * The gate itself is also rendered directly in the second describe block, with a
 * hand-made controller — that covers the states a mocked client cannot reach
 * (loading, unconfigured) without any module-registry gymnastics.
 */
const { fakeAuth } = vi.hoisted(() => ({
  fakeAuth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
}));

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  getSupabase: () => ({ auth: fakeAuth }),
}));

const LANDLORD = { email: "prenajimatel@example.com" };

function controller(overrides: Partial<OwnerAuthController> = {}): OwnerAuthController {
  return {
    status: "loading",
    email: "",
    error: "",
    isSubmitting: false,
    signIn: vi.fn(),
    signOut: vi.fn(async () => {}),
    ...overrides,
  };
}

async function signIn(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText(/E-mail/), LANDLORD.email);
  await user.type(screen.getByLabelText(/Heslo/), "tajneheslo");
  await user.click(screen.getByRole("button", { name: "Prihlásiť sa" }));
}

describe("the owner gate (Sprint 4.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fakeAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    fakeAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("asks for a sign-in and mounts no part of the panel (§3.2)", async () => {
    render(<OwnerPage />);

    expect(
      await screen.findByRole("heading", { name: "Prihlásenie prenajímateľa" }),
    ).toBeInTheDocument();
    // The panel must not exist behind the gate — not merely be hidden.
    expect(screen.queryByText("Záujemcovia")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Odhlásiť sa" })).not.toBeInTheDocument();
  });

  it("reveals the panel when a session already exists, and shows who is signed in", async () => {
    fakeAuth.getSession.mockResolvedValue({
      data: { session: { user: LANDLORD } },
      error: null,
    });

    render(<OwnerPage />);

    expect(await screen.findByText("Záujemcovia")).toBeInTheDocument();
    expect(screen.getByText(LANDLORD.email)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Prihlásenie prenajímateľa" })).not.toBeInTheDocument();
  });

  it("keeps the submit button disabled until both fields are filled", async () => {
    const user = userEvent.setup();
    render(<OwnerPage />);

    const button = await screen.findByRole("button", { name: "Prihlásiť sa" });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/E-mail/), LANDLORD.email);
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/Heslo/), "tajneheslo");
    expect(button).toBeEnabled();
  });

  it("signs in and reveals the panel", async () => {
    const user = userEvent.setup();
    fakeAuth.signInWithPassword.mockResolvedValue({ data: { user: LANDLORD }, error: null });

    render(<OwnerPage />);
    await screen.findByRole("heading", { name: "Prihlásenie prenajímateľa" });
    await signIn(user);

    expect(await screen.findByText("Záujemcovia")).toBeInTheDocument();
    expect(fakeAuth.signInWithPassword).toHaveBeenCalledWith({
      email: LANDLORD.email,
      password: "tajneheslo",
    });
  });

  it("shows Slovak copy for wrong credentials and keeps the gate shut", async () => {
    const user = userEvent.setup();
    fakeAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    render(<OwnerPage />);
    await screen.findByRole("heading", { name: "Prihlásenie prenajímateľa" });
    await signIn(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(INVALID_CREDENTIALS_MESSAGE);
    expect(screen.queryByText("Záujemcovia")).not.toBeInTheDocument();
  });

  it("closes the gate again on sign-out", async () => {
    const user = userEvent.setup();
    fakeAuth.getSession.mockResolvedValue({
      data: { session: { user: LANDLORD } },
      error: null,
    });
    fakeAuth.signOut.mockResolvedValue({ error: null });

    render(<OwnerPage />);
    await screen.findByText("Záujemcovia");

    await user.click(screen.getByRole("button", { name: "Odhlásiť sa" }));

    expect(
      await screen.findByRole("heading", { name: "Prihlásenie prenajímateľa" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Záujemcovia")).not.toBeInTheDocument();
  });
});

describe("OwnerGate states", () => {
  it("shows a loading state before the panel is revealed", () => {
    render(<OwnerGate auth={controller({ status: "loading" })} />);

    expect(screen.getByRole("status")).toHaveTextContent("Načítavam…");
    expect(screen.queryByLabelText(/Heslo/)).not.toBeInTheDocument();
  });

  it("explains an unconfigured client instead of showing a form that cannot work", () => {
    render(<OwnerGate auth={controller({ status: "unavailable" })} />);

    expect(
      screen.getByRole("heading", { name: "Prihlásenie nie je dostupné" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Heslo/)).not.toBeInTheDocument();
  });
});