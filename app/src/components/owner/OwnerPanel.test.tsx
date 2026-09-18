import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OwnerPanel } from "@/components/owner/OwnerPanel";
import { listCandidates } from "@/lib/candidates";
import type { Candidate } from "@/lib/candidate";

vi.mock("@/lib/candidates", () => ({ listCandidates: vi.fn() }));

const listMock = vi.mocked(listCandidates);

/** A complete applicant record, built here so the assertions stay readable. */
function applicant(
  id: string,
  firstName: string,
  lastName: string,
  rc: string,
  status: Candidate["status"] = "pending",
): Candidate {
  return {
    id,
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-02T10:30:00.000Z",
    status,
    listingId: null,
    personal: {
      firstName,
      lastName,
      dob: "1994-05-12",
      rc,
      opNumber: "EA 123456",
      passportNumber: "",
      phone: "+421900111222",
      email: "maria@example.com",
      extraContact: "",
    },
    residence: { origin: "Košice", bratislavaYears: "3" },
    studyWork: {
      studentStatus: "no",
      school: "",
      yearLevel: "",
      employmentStatus: "tpp",
      employer: "Acme s.r.o.",
      employmentDuration: "2 roky",
    },
    apartment: {
      mustHave: "parkovanie",
      niceToHave: "",
      dream: "",
      likes: "",
      moveInDate: "2026-10-01",
    },
    situation: { currentSituation: "Býva u rodičov", additionalInfo: "" },
    owner: { facebookUrl: "", rating: 0, notes: "" },
  };
}

const MARIA_RC = "9455121234";
const MARIA = applicant("id-maria", "Mária", "Kováčová", MARIA_RC, "shortlisted");
const JAN = applicant("id-jan", "Ján", "Novák", "9001011234");

function renderPanel(): void {
  render(<OwnerPanel email="prenajimatel@example.com" onSignOut={vi.fn(async () => {})} />);
}

describe("OwnerPanel — the applicant list (Sprint 4.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the applicants with their pipeline stage", async () => {
    listMock.mockResolvedValue([MARIA, JAN]);

    renderPanel();

    const list = await screen.findByRole("list");

    expect(within(list).getByText("Mária Kováčová")).toBeInTheDocument();
    expect(within(list).getByText("Ján Novák")).toBeInTheDocument();
    // The stage is shown in Slovak, never as the raw enum.
    expect(within(list).getByText(/Vo výbere/)).toBeInTheDocument();
  });

  it("shows how many applicants there are", async () => {
    listMock.mockResolvedValue([MARIA, JAN]);

    renderPanel();

    expect(await screen.findByText("Záujemcovia")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("never shows Rodné číslo in the list — only in the detail (§7)", async () => {
    listMock.mockResolvedValue([MARIA, JAN]);

    renderPanel();
    const list = await screen.findByRole("list");

    expect(list.textContent ?? "").not.toContain(MARIA_RC);
    expect(list.textContent ?? "").not.toContain("9001011234");

    // It appears exactly once on the page: in the auto-selected detail panel.
    expect(screen.getAllByText(MARIA_RC)).toHaveLength(1);
  });

  it("keeps Rodné číslo out of print (§7)", async () => {
    listMock.mockResolvedValue([MARIA]);

    renderPanel();
    const value = await screen.findByText(MARIA_RC);

    expect(value.closest('[class*="print:hidden"]')).not.toBeNull();
  });

  it("opens the newest applicant automatically", async () => {
    listMock.mockResolvedValue([MARIA, JAN]);

    renderPanel();

    // The whole record is rendered, not just the name.
    expect(await screen.findByText("Acme s.r.o.")).toBeInTheDocument();
    expect(screen.getByText("Býva u rodičov")).toBeInTheDocument();
  });

  it("switches the detail when another applicant is selected", async () => {
    const user = userEvent.setup();
    listMock.mockResolvedValue([MARIA, JAN]);

    renderPanel();
    await user.click(await screen.findByRole("button", { name: /Ján Novák/ }));

    expect(await screen.findByText("9001011234")).toBeInTheDocument();
    expect(screen.queryByText("9455121234")).not.toBeInTheDocument();
  });

  it("formats dates and enum answers for a Slovak reader", async () => {
    listMock.mockResolvedValue([MARIA]);

    renderPanel();

    expect(await screen.findByText("12. 5. 1994")).toBeInTheDocument();
    expect(screen.getByText("1. 10. 2026")).toBeInTheDocument();
    expect(screen.getByText("TPP")).toBeInTheDocument();
    // Empty optional answers are labelled, not left blank.
    expect(screen.getAllByText("Neuvedené").length).toBeGreaterThan(0);
  });

  it("says so when there are no applicants yet", async () => {
    listMock.mockResolvedValue([]);

    renderPanel();

    expect(await screen.findByText("Žiadni záujemcovia.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("Vyberte záujemcu")).toBeInTheDocument();
  });

  it("reports a failed load in Slovak and offers a retry", async () => {
    const user = userEvent.setup();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    listMock.mockRejectedValue(new Error('Supabase select on "candidates" failed'));

    renderPanel();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Zoznam záujemcov sa nepodarilo načítať.");
    expect(alert.textContent ?? "").not.toContain("Supabase");

    listMock.mockResolvedValue([MARIA]);
    await user.click(screen.getByRole("button", { name: "Skúsiť znova" }));

    const list = await screen.findByRole("list");
    expect(within(list).getByText("Mária Kováčová")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("labels the panel so the count and the list agree", async () => {
    listMock.mockResolvedValue([MARIA, JAN]);

    renderPanel();
    const list = await screen.findByRole("list");

    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });
});