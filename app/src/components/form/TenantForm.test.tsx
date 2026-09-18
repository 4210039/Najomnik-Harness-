import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TenantForm } from "@/components/form/TenantForm";
import { SUBMIT_FAILED_MESSAGE } from "@/hooks/useTenantForm";
import { submitApplication } from "@/lib/candidates";
import { INVALID_EMAIL_MESSAGE } from "@/lib/candidateSchema";
import { DRAFT_STORAGE_KEY } from "@/lib/draft";

/**
 * The data layer is mocked: these tests are about the wizard's behaviour, not
 * about PostgREST. `candidates.test.ts` covers the queries.
 */
vi.mock("@/lib/candidates", () => ({ submitApplication: vi.fn() }));

const submitMock = vi.mocked(submitApplication);

/** Step 1's four required fields, exactly as `personalStepSchema` wants them. */
async function fillStepOne(user: UserEvent): Promise<void> {
  await user.type(screen.getByLabelText(/Meno/), "Mária");
  await user.type(screen.getByLabelText(/Priezvisko/), "Kováčová");
  await user.type(screen.getByLabelText(/Telefón/), "+421900111222");
  await user.type(screen.getByLabelText(/E-mail/), "maria@example.com");
}

const nextButton = () => screen.getByRole("button", { name: /Ďalej/ });
const backButton = () => screen.getByRole("button", { name: /Späť/ });

/** Walk from step 1 to step 5, filling the only other required field on the way. */
async function advanceToLastStep(user: UserEvent): Promise<void> {
  await fillStepOne(user);
  await user.click(nextButton());

  await user.type(screen.getByLabelText(/Odkiaľ ste/), "Košice");
  await user.click(nextButton()); // -> 3 Štúdium & Práca
  await user.click(nextButton()); // -> 4 Byt
  await user.click(nextButton()); // -> 5 Situácia
}

describe("TenantForm (Sprint 3.1–3.3)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    submitMock.mockReset();
  });

  it("starts on step 1 with the persona's fields", () => {
    render(<TenantForm />);

    expect(screen.getByRole("heading", { name: "Osobné údaje" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Meno/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rodné číslo/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pobyt" })).not.toBeInTheDocument();
  });

  it("does not render a Back button on the first step", () => {
    render(<TenantForm />);

    expect(screen.queryByRole("button", { name: /Späť/ })).not.toBeInTheDocument();
  });

  it("blocks Ďalej until the required fields pass, and says why", () => {
    render(<TenantForm />);

    expect(nextButton()).toBeDisabled();
    // The disabled button must not be a dead end (§8): an explanation is shown
    // and linked to it via aria-describedby.
    expect(screen.getByRole("status")).toHaveTextContent(
      "Vyplňte povinné polia, aby ste mohli pokračovať.",
    );
    expect(nextButton()).toHaveAttribute("aria-describedby", "step-status");
  });

  it("enables Ďalej once step 1 validates", async () => {
    const user = userEvent.setup();
    render(<TenantForm />);

    await fillStepOne(user);

    expect(nextButton()).toBeEnabled();
  });

  it("shows a field error only after the field has been left", async () => {
    const user = userEvent.setup();
    render(<TenantForm />);

    const email = screen.getByLabelText(/E-mail/);
    await user.type(email, "not-an-email");

    // Typing alone must not shout at the applicant mid-word.
    expect(screen.queryByText(INVALID_EMAIL_MESSAGE)).not.toBeInTheDocument();

    await user.tab();

    expect(screen.getByText(INVALID_EMAIL_MESSAGE)).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAttribute("aria-describedby", "email-error");
  });

  it("marks the current step for assistive tech", () => {
    render(<TenantForm />);

    const progress = screen.getByRole("navigation", { name: "Priebeh formulára" });
    const firstStep = within(progress).getByText("Osobné").closest("li");

    expect(firstStep).toHaveAttribute("aria-current", "step");
  });

  it("announces every step change in a live region (§8)", async () => {
    const user = userEvent.setup();
    render(<TenantForm />);

    expect(screen.getByText("Krok 1 z 5: Osobné")).toBeInTheDocument();

    await fillStepOne(user);
    await user.click(nextButton());

    expect(screen.getByText("Krok 2 z 5: Pobyt")).toBeInTheDocument();
  });

  it("advances to step 2 and keeps step 1's answers when going back", async () => {
    const user = userEvent.setup();
    render(<TenantForm />);

    await fillStepOne(user);
    await user.click(nextButton());

    expect(screen.getByRole("heading", { name: "Pôvod a súčasný pobyt" })).toBeInTheDocument();

    await user.click(backButton());

    expect(screen.getByLabelText(/Meno/)).toHaveValue("Mária");
  });
it("reveals the study questions only after a studying answer", async () => {
    const user = userEvent.setup();
    render(<TenantForm />);

    await fillStepOne(user);
    await user.click(nextButton());
    await user.type(screen.getByLabelText(/Odkiaľ ste/), "Košice");
    await user.click(nextButton());

    expect(screen.queryByLabelText(/Kde študujete/)).not.toBeInTheDocument();

    const studentGroup = screen.getByRole("group", { name: "Ste študent/ka?" });
    await user.click(within(studentGroup).getByRole("radio", { name: "Áno" }));

    expect(screen.getByLabelText(/Kde študujete/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rok \/ ročník/)).toBeInTheDocument();
  });

  it("stores the spec enum value, never the Slovak label, for a toggle answer", async () => {
    const user = userEvent.setup();
    render(<TenantForm />);

    await fillStepOne(user);
    await user.click(nextButton());
    await user.type(screen.getByLabelText(/Odkiaľ ste/), "Košice");
    await user.click(nextButton());

    const employmentGroup = screen.getByRole("group", { name: "Pracujete?" });
    await user.click(within(employmentGroup).getByRole("radio", { name: "SZČO" }));

    // Storing "Áno"/"SZČO" is the §12.1 defect this rewrite exists to remove.
    await waitFor(() => {
      const stored = window.localStorage.getItem(DRAFT_STORAGE_KEY) ?? "";
      expect(stored).toContain('"employmentStatus":"szco"');
    });

    expect(screen.getByLabelText(/Kde \/ u koho pracujete/)).toBeInTheDocument();
  });

  it("sends the completed application and shows the confirmation", async () => {
    const user = userEvent.setup();
    submitMock.mockResolvedValue(undefined);
    render(<TenantForm />);

    await advanceToLastStep(user);
    await user.click(screen.getByRole("button", { name: /Odoslať žiadosť/ }));

    await waitFor(() => expect(submitMock).toHaveBeenCalledTimes(1));

    const [submitted] = submitMock.mock.calls[0] ?? [];
    expect(submitted?.personal.firstName).toBe("Mária");
    expect(submitted?.residence.origin).toBe("Košice");

    expect(await screen.findByRole("heading", { name: "Ďakujeme!" })).toBeInTheDocument();
    expect(
      screen.getByText("Vaše údaje sme prijali. Ozveme sa vám čo najskôr."),
    ).toBeInTheDocument();
  });

  it("clears the saved draft only after a confirmed submission", async () => {
    const user = userEvent.setup();
    submitMock.mockResolvedValue(undefined);
    render(<TenantForm />);

    await advanceToLastStep(user);
    await waitFor(() =>
      expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull(),
    );

    await user.click(screen.getByRole("button", { name: /Odoslať žiadosť/ }));
    await screen.findByRole("heading", { name: "Ďakujeme!" });

    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("keeps the applicant's work when submission fails", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    submitMock.mockRejectedValue(
      new Error('Supabase insert on "candidates" failed: permission denied'),
    );
    render(<TenantForm />);

    await advanceToLastStep(user);
    await user.click(screen.getByRole("button", { name: /Odoslať žiadosť/ }));

    const alert = await screen.findByRole("alert");
    // Friendly Slovak, never the PostgREST wording.
    expect(alert).toHaveTextContent(SUBMIT_FAILED_MESSAGE);
    expect(alert.textContent ?? "").not.toContain("permission denied");

    // No confirmation was earned, so the form stays put...
    expect(screen.queryByRole("heading", { name: "Ďakujeme!" })).not.toBeInTheDocument();
    // ...and the answers survive, so nothing has to be retyped.
    await waitFor(() =>
      expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toContain("Mária"),
    );

    consoleError.mockRestore();
  });

  it("resumes a draft saved in an earlier session", () => {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ personal: { firstName: "Ján", lastName: "Novák" } }),
    );

    render(<TenantForm />);

    expect(screen.getByLabelText(/Meno/)).toHaveValue("Ján");
    expect(screen.getByLabelText(/Priezvisko/)).toHaveValue("Novák");
  });

  it("starts a clean form after Vyplniť nový formulár", async () => {
    const user = userEvent.setup();
    submitMock.mockResolvedValue(undefined);
    render(<TenantForm />);

    await advanceToLastStep(user);
    await user.click(screen.getByRole("button", { name: /Odoslať žiadosť/ }));
    await user.click(await screen.findByRole("button", { name: "Vyplniť nový formulár" }));

    expect(screen.getByLabelText(/Meno/)).toHaveValue("");
    expect(screen.getByText("Krok 1 z 5: Osobné")).toBeInTheDocument();
    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});