import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import App from "./App";

/**
 * The App shell tests must not touch the network. `isSupabaseConfigured` is true
 * on any machine that has a filled-in `.env.local`, which would make the owner
 * tab perform a real session lookup — and behave differently per machine.
 * Rendering it as unconfigured keeps these tests about the shell, and keeps the
 * owner gate's own behaviour in `OwnerPage.test.tsx` where it belongs.
 */
vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: false,
  getSupabase: () => {
    throw new Error("Supabase is not configured in the App shell tests.");
  },
}));

describe("App shell (Sprint 1.1)", () => {
  it("renders the brand mark", () => {
    render(<App />);
    expect(screen.getByText("Nájom")).toBeInTheDocument();
  });

  it("renders both principal tabs in the header", () => {
    render(<App />);
    const tablist = screen.getByRole("tablist", { name: "Prepnúť zobrazenie" });
    expect(within(tablist).getAllByRole("tab")).toHaveLength(2);
  });

  it("starts on the Záujemca tab with its panel visible", () => {
    render(<App />);
    expect(screen.getByRole("tab", { name: "Záujemca" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel", { name: "Záujemca" })).toBeVisible();
  });

  it("keeps the owner panel out of the accessibility tree until selected", () => {
    render(<App />);
    expect(screen.queryByRole("tabpanel", { name: "Vlastník" })).not.toBeInTheDocument();
  });

  it("reveals the owner panel when the Vlastník tab is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Vlastník" }));

    expect(screen.getByRole("tabpanel", { name: "Vlastník" })).toBeVisible();
    expect(screen.queryByRole("tabpanel", { name: "Záujemca" })).not.toBeInTheDocument();
  });

  it("navigates tabs with the arrow keys (keyboard accessibility, §8)", async () => {
    const user = userEvent.setup();
    render(<App />);

    screen.getByRole("tab", { name: "Záujemca" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "Vlastník" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("wraps arrow-key navigation around the tab list", async () => {
    const user = userEvent.setup();
    render(<App />);

    screen.getByRole("tab", { name: "Záujemca" }).focus();
    await user.keyboard("{ArrowLeft}");

    expect(screen.getByRole("tab", { name: "Vlastník" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("keeps both panels mounted so form state survives a tab switch", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("tab", { name: "Vlastník" }));

    const tenantPanel = container.querySelector("#panel-najomnik");
    const ownerPanel = container.querySelector("#panel-vlastnik");
    expect(tenantPanel).not.toBeNull();
    expect(ownerPanel).not.toBeNull();
    expect(tenantPanel).toHaveAttribute("hidden");
    expect(ownerPanel).not.toHaveAttribute("hidden");
  });

  it("uses a roving tabindex so only the active tab is in the tab order", () => {
    render(<App />);
    expect(screen.getByRole("tab", { name: "Záujemca" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Vlastník" })).toHaveAttribute("tabindex", "-1");
  });

  it("lists the five canonical Slovak step names in order (spec §6.4)", () => {
    render(<App />);
    const progress = screen.getByRole("navigation", { name: "Priebeh formulára" });
    const steps = within(progress)
      .getAllByRole("listitem")
      // The leading digit is decorative (aria-hidden), so strip it to read the
      // label. `textContent` is DOM text and still contains it.
      .map((item) => item.textContent?.replace(/^\d/, "") ?? "");

    expect(steps).toEqual(["Osobné", "Pobyt", "Štúdium & Práca", "Byt", "Situácia"]);
  });

  it("provides a skip link for keyboard users (§8)", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: "Preskočiť na obsah" })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
});