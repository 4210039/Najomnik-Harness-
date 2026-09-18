import { describe, expect, it } from "vitest";

import {
  type CandidatePatch,
  type CandidateRow,
  type CandidateRowInsert,
  candidateDraftToRow,
  createEmptyCandidateDraft,
  flattenCandidatePatch,
  isHalfStepRating,
  roundToHalfStar,
  rowToCandidate,
} from "./candidate";

/**
 * A fully populated row as PostgREST returns it. Kept in one place so the
 * round-trip test and the section tests cannot drift apart.
 */
const ROW: CandidateRow = {
  id: "6f1c8c2e-0f0a-4caa-9a2f-1b2c3d4e5f60",
  created_at: "2026-09-01T09:00:00.000Z",
  updated_at: "2026-09-02T10:30:00.000Z",
  status: "shortlisted",
  listing_id: null,
  first_name: "Mária",
  last_name: "Kováčová",
  dob: "1994-05-12",
  rc: "9455121234",
  op_number: null,
  passport_number: null,
  phone: "+421900111222",
  email: "maria@example.com",
  extra_contact: null,
  origin: "Košice",
  bratislava_years: "3",
  student_status: "no",
  school: null,
  year_level: null,
  employment_status: "tpp",
  employer: "Acme s.r.o.",
  employment_duration: "2 roky",
  must_have: "parkovanie",
  nice_to_have: null,
  dream: null,
  likes: null,
  move_in_date: "2026-10-01",
  current_situation: "Býva u rodičov",
  additional_info: null,
  facebook_url: "https://facebook.com/maria",
  rating: 4.5,
  notes: "Príjemný rozhovor.",
};

describe("rowToCandidate (spec §3.3 canonical shape)", () => {
  it("builds the nested record the specification defines", () => {
    const candidate = rowToCandidate(ROW);

    expect(candidate.id).toBe(ROW.id);
    expect(candidate.createdAt).toBe(ROW.created_at);
    expect(candidate.updatedAt).toBe(ROW.updated_at);
    expect(Object.keys(candidate).sort()).toEqual(
      [
        "apartment",
        "createdAt",
        "id",
        "listingId",
        "owner",
        "personal",
        "residence",
        "situation",
        "status",
        "studyWork",
        "updatedAt",
      ].sort(),
    );
  });

  it("maps every section onto its camelCase field names", () => {
    const { personal, residence, studyWork, apartment, situation, owner } = rowToCandidate(ROW);

    expect(personal).toEqual({
      firstName: "Mária",
      lastName: "Kováčová",
      dob: "1994-05-12",
      rc: "9455121234",
      opNumber: "",
      passportNumber: "",
      phone: "+421900111222",
      email: "maria@example.com",
      extraContact: "",
    });
    expect(residence).toEqual({ origin: "Košice", bratislavaYears: "3" });
    expect(studyWork).toEqual({
      studentStatus: "no",
      school: "",
      yearLevel: "",
      employmentStatus: "tpp",
      employer: "Acme s.r.o.",
      employmentDuration: "2 roky",
    });
    expect(apartment).toEqual({
      mustHave: "parkovanie",
      niceToHave: "",
      dream: "",
      likes: "",
      moveInDate: "2026-10-01",
    });
    expect(situation).toEqual({ currentSituation: "Býva u rodičov", additionalInfo: "" });
    expect(owner).toEqual({
      facebookUrl: "https://facebook.com/maria",
      rating: 4.5,
      notes: "Príjemný rozhovor.",
    });
  });

  it("leaks no snake_case column name to the rest of the app", () => {
    const candidate = rowToCandidate(ROW);
    const nested = Object.values(candidate).filter(
      (value) => typeof value === "object" && value !== null,
    );

    for (const section of nested) {
      for (const key of Object.keys(section)) {
        expect(key).not.toContain("_");
      }
    }
    expect(Object.keys(candidate).some((key) => key.includes("_"))).toBe(false);
  });

  it("turns NULL into the empty string the record shape uses", () => {
    const candidate = rowToCandidate({ ...ROW, rc: null, notes: null, move_in_date: null });

    expect(candidate.personal.rc).toBe("");
    expect(candidate.owner.notes).toBe("");
    expect(candidate.apartment.moveInDate).toBe("");
  });

  it("coerces a numeric(2,1) rating delivered as a string", () => {
    expect(rowToCandidate({ ...ROW, rating: "3.5" }).owner.rating).toBe(3.5);
  });

  it("reads a missing or unusable rating as 'not rated yet' (0)", () => {
    expect(rowToCandidate({ ...ROW, rating: null }).owner.rating).toBe(0);
    expect(rowToCandidate({ ...ROW, rating: "unrated" }).owner.rating).toBe(0);
  });
});

describe("candidateDraftToRow", () => {
  it("writes NULL for every optional field the tenant left empty", () => {
    const row = candidateDraftToRow(createEmptyCandidateDraft(), null);

    expect(row.op_number).toBeNull();
    expect(row.rc).toBeNull();
    expect(row.extra_contact).toBeNull();
    expect(row.bratislava_years).toBeNull();
    expect(row.student_status).toBeNull();
    expect(row.employment_status).toBeNull();
    expect(row.move_in_date).toBeNull();
    expect(row.additional_info).toBeNull();
  });

  it("keeps the four NOT NULL columns as trimmed strings", () => {
    const draft = createEmptyCandidateDraft();
    draft.personal.firstName = "  Ján ";
    draft.personal.lastName = " Novák  ";
    draft.personal.phone = " +421 900 111 222 ";
    draft.personal.email = " jan@example.com ";

    const row = candidateDraftToRow(draft, null);

    expect(row.first_name).toBe("Ján");
    expect(row.last_name).toBe("Novák");
    expect(row.phone).toBe("+421 900 111 222");
    expect(row.email).toBe("jan@example.com");
  });

  it("stores the answer enums only when the tenant actually chose one", () => {
    const draft = createEmptyCandidateDraft();
    draft.studyWork.studentStatus = "partTime";
    draft.studyWork.employmentStatus = "szco";

    const row = candidateDraftToRow(draft, null);

    expect(row.student_status).toBe("partTime");
    expect(row.employment_status).toBe("szco");
  });

  it("carries listing_id through once Sprint 9.3 attaches a listing", () => {
    const listingId = "2f1c8c2e-0f0a-4caa-9a2f-1b2c3d4e5f61";

    expect(candidateDraftToRow(createEmptyCandidateDraft(), listingId).listing_id).toBe(listingId);
    expect(candidateDraftToRow(createEmptyCandidateDraft()).listing_id).toBeNull();
  });

  it("never includes an owner-only column, which the anon policy forbids", () => {
    const columns = Object.keys(candidateDraftToRow(createEmptyCandidateDraft(), null));

    expect(columns).not.toContain("rating");
    expect(columns).not.toContain("notes");
    expect(columns).not.toContain("facebook_url");
    expect(columns).not.toContain("status");
  });

  it("round-trips a stored row back to the same columns", () => {
    const { id, createdAt, updatedAt, status, ...draft } = rowToCandidate(ROW);
    const insert: CandidateRowInsert = candidateDraftToRow(draft, ROW.listing_id);

    expect([id, createdAt, updatedAt, status]).toEqual([
      ROW.id,
      ROW.created_at,
      ROW.updated_at,
      ROW.status,
    ]);
    expect(insert.first_name).toBe(ROW.first_name);
    expect(insert.last_name).toBe(ROW.last_name);
    expect(insert.rc).toBe(ROW.rc);
    expect(insert.phone).toBe(ROW.phone);
    expect(insert.origin).toBe(ROW.origin);
    expect(insert.must_have).toBe(ROW.must_have);
    expect(insert.move_in_date).toBe(ROW.move_in_date);
    expect(insert.current_situation).toBe(ROW.current_situation);
  });
});

describe("flattenCandidatePatch", () => {
  it("maps a nested patch onto database columns", () => {
    const columns = flattenCandidatePatch({
      personal: { email: "novy@example.com" },
      owner: { rating: 3.5, notes: "Druhý rozhovor." },
      status: "reviewing",
    });

    expect(columns).toEqual({
      email: "novy@example.com",
      rating: 3.5,
      notes: "Druhý rozhovor.",
      status: "reviewing",
    });
  });

  it("does not touch sections the caller left out", () => {
    expect(Object.keys(flattenCandidatePatch({ owner: { notes: "x" } }))).toEqual(["notes"]);
  });

  it("clears a column when the caller sends an empty string", () => {
    expect(flattenCandidatePatch({ owner: { notes: "" } })).toEqual({ notes: null });
    expect(flattenCandidatePatch({ apartment: { mustHave: "   " } })).toEqual({ must_have: null });
  });

  it("keeps a zero rating instead of dropping it as falsy", () => {
    expect(flattenCandidatePatch({ owner: { rating: 0 } })).toEqual({ rating: 0 });
  });

  it("skips undefined values so an omitted field is not cleared", () => {
    expect(flattenCandidatePatch({ owner: { notes: undefined, rating: 5 } })).toEqual({ rating: 5 });
  });

  it("ignores unknown keys rather than inventing columns", () => {
    const rogue = JSON.parse('{"personal":{"bogusField":"x"}}') as CandidatePatch;

    expect(flattenCandidatePatch(rogue)).toEqual({});
  });

  it("maps listingId, and only when it is explicitly present", () => {
    expect(flattenCandidatePatch({ listingId: null })).toEqual({ listing_id: null });
    expect(flattenCandidatePatch({})).toEqual({});
  });
});

describe("rating helpers (§3.3: 0–5 in half steps)", () => {
  it("accepts only exact half steps inside the range", () => {
    expect(isHalfStepRating(0)).toBe(true);
    expect(isHalfStepRating(4.5)).toBe(true);
    expect(isHalfStepRating(5)).toBe(true);
    expect(isHalfStepRating(4.3)).toBe(false);
    expect(isHalfStepRating(-0.5)).toBe(false);
    expect(isHalfStepRating(5.5)).toBe(false);
    expect(isHalfStepRating(Number.NaN)).toBe(false);
  });

  it("snaps arbitrary values to the nearest half star", () => {
    expect(roundToHalfStar(4.3)).toBe(4.5);
    expect(roundToHalfStar(4.2)).toBe(4);
    expect(roundToHalfStar(3.25)).toBe(3.5);
  });

  it("clamps out-of-range input instead of storing it", () => {
    expect(roundToHalfStar(-3)).toBe(0);
    expect(roundToHalfStar(9)).toBe(5);
    expect(roundToHalfStar(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("createEmptyCandidateDraft", () => {
  it("covers exactly the sections the tenant form collects", () => {
    const draft = createEmptyCandidateDraft();

    expect(Object.keys(draft).sort()).toEqual(
      ["apartment", "personal", "residence", "situation", "studyWork"].sort(),
    );
  });

  it("starts every field empty so a partially filled form still saves", () => {
    const draft = createEmptyCandidateDraft();
    const values = [
      ...Object.values(draft.personal),
      ...Object.values(draft.residence),
      ...Object.values(draft.studyWork),
      ...Object.values(draft.apartment),
      ...Object.values(draft.situation),
    ];

    expect(values.every((value) => value === "")).toBe(true);
  });
});