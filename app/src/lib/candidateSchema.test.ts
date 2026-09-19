import { describe, expect, it } from "vitest";

import { createEmptyCandidateDraft, type CandidateDraft } from "./candidate";
import {
  INVALID_DATE_MESSAGE,
  INVALID_EMAIL_MESSAGE,
  INVALID_PHONE_MESSAGE,
  INVALID_RATING_MESSAGE,
  REQUIRED_FIELD_MESSAGE,
  TENANT_STEP_SCHEMAS,
  TOO_SHORT_MESSAGE,
  firstErrorMessage,
  isValidIsoDate,
  isValidPhoneNumber,
  ownerReviewSchema,
  personalStepSchema,
  tenantApplicationSchema,
} from "./candidateSchema";

/** A complete, valid step 1 — the base every personal test varies from. */
const VALID_PERSONAL = {
  firstName: "Mária",
  lastName: "Kováčová",
  dob: "1994-05-12",
  rc: "",
  opNumber: "",
  passportNumber: "",
  phone: "+421900111222",
  email: "maria@example.com",
  extraContact: "",
};

function validApplication() {
  return {
    personal: VALID_PERSONAL,
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
  };
}

/** The first error message of a failed parse — what the UI shows inline. */
function messageFor(schema: { safeParse: (input: unknown) => unknown }, input: unknown): string {
  return firstErrorMessage(schema.safeParse(input) as never);
}

describe("canonical error copy (spec §6.3)", () => {
  it("uses the exact glossary strings", () => {
    expect(REQUIRED_FIELD_MESSAGE).toBe("Povinné pole");
    expect(INVALID_EMAIL_MESSAGE).toBe("Zadajte platný e-mail");
    expect(INVALID_PHONE_MESSAGE).toBe("Zadajte platné telefónne číslo");
    expect(TOO_SHORT_MESSAGE).toBe("Táto hodnota je príliš krátka");
  });

  it("returns an empty message for valid input", () => {
    expect(firstErrorMessage(personalStepSchema.safeParse(VALID_PERSONAL))).toBe("");
  });
});

describe("personalStepSchema (step 1, Osobné)", () => {
  it("accepts a fully filled step", () => {
    const result = personalStepSchema.safeParse(VALID_PERSONAL);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(VALID_PERSONAL);
  });

  it("requires first and last name", () => {
    expect(messageFor(personalStepSchema, { ...VALID_PERSONAL, firstName: "" })).toBe(
      REQUIRED_FIELD_MESSAGE,
    );
    expect(messageFor(personalStepSchema, { ...VALID_PERSONAL, lastName: "   " })).toBe(
      REQUIRED_FIELD_MESSAGE,
    );
  });

  it("reports a single-character name as too short", () => {
    expect(messageFor(personalStepSchema, { ...VALID_PERSONAL, lastName: "K" })).toBe(
      TOO_SHORT_MESSAGE,
    );
  });

  it("trims the values it stores", () => {
    const result = personalStepSchema.parse({ ...VALID_PERSONAL, firstName: "  Mária  " });

    expect(result.firstName).toBe("Mária");
  });

  it("rejects an email that is missing or malformed", () => {
    expect(messageFor(personalStepSchema, { ...VALID_PERSONAL, email: "" })).toBe(
      REQUIRED_FIELD_MESSAGE,
    );
    expect(messageFor(personalStepSchema, { ...VALID_PERSONAL, email: "maria(at)example.com" })).toBe(
      INVALID_EMAIL_MESSAGE,
    );
  });

  it("accepts Slovak and international phone formats", () => {
    for (const phone of ["+421900111222", "0900 111 222", "0900/111222", "(02) 1234 5678"]) {
      expect(personalStepSchema.safeParse({ ...VALID_PERSONAL, phone }).success).toBe(true);
    }
  });

  it("rejects a phone that is missing or not a phone number", () => {
    expect(messageFor(personalStepSchema, { ...VALID_PERSONAL, phone: "" })).toBe(
      REQUIRED_FIELD_MESSAGE,
    );
    expect(messageFor(personalStepSchema, { ...VALID_PERSONAL, phone: "zavolajte mi" })).toBe(
      INVALID_PHONE_MESSAGE,
    );
  });

  it("never requires Rodné číslo, and does not police its format (spec §7)", () => {
    expect(personalStepSchema.safeParse({ ...VALID_PERSONAL, rc: "" }).success).toBe(true);
    expect(personalStepSchema.safeParse({ ...VALID_PERSONAL, rc: "945512/1234" }).success).toBe(
      true,
    );
  });

  it("accepts an ISO date of birth and rejects free text", () => {
    expect(personalStepSchema.safeParse({ ...VALID_PERSONAL, dob: "" }).success).toBe(true);
    expect(messageFor(personalStepSchema, { ...VALID_PERSONAL, dob: "12.5.1994" })).toBe(
      INVALID_DATE_MESSAGE,
    );
  });
});

describe("step schemas and the whole application", () => {
  it("exposes exactly the five canonical steps (spec §6.4)", () => {
    expect(Object.keys(TENANT_STEP_SCHEMAS).map(Number).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("accepts a valid application and matches the canonical draft shape", () => {
    const result = tenantApplicationSchema.safeParse(validApplication());

    expect(result.success).toBe(true);
    // Type-level guarantee: the parsed form is directly submittable.
    const draft: CandidateDraft = result.success ? result.data : createEmptyCandidateDraft();
    expect(Object.keys(draft).sort()).toEqual(Object.keys(createEmptyCandidateDraft()).sort());
  });

  it("leaves every step-3 and step-5 field optional", () => {
    const minimal = validApplication();
    minimal.studyWork = {
      studentStatus: "",
      school: "",
      yearLevel: "",
      employmentStatus: "",
      employer: "",
      employmentDuration: "",
    };
    minimal.situation = { currentSituation: "", additionalInfo: "" };

    expect(tenantApplicationSchema.safeParse(minimal).success).toBe(true);
  });

  it("still requires the fields that make an application actionable", () => {
    const noContact = validApplication();
    noContact.personal = { ...VALID_PERSONAL, email: "" };

    expect(tenantApplicationSchema.safeParse(noContact).success).toBe(false);
  });

  it("accepts the spec's enum literals and rejects the prototype's Slovak ones", () => {
    const valid = validApplication();
    valid.studyWork.studentStatus = "partTime";
    valid.studyWork.employmentStatus = "szco";
    expect(tenantApplicationSchema.safeParse(valid).success).toBe(true);

    const legacy = validApplication();
    legacy.studyWork.employmentStatus = "Áno" as never;
    expect(tenantApplicationSchema.safeParse(legacy).success).toBe(false);
  });

  it("rejects a move-in date that is not a real calendar date", () => {
    const impossible = validApplication();
    impossible.apartment.moveInDate = "2026-02-30";

    expect(tenantApplicationSchema.safeParse(impossible).success).toBe(false);
  });

  it("rejects the prototype's free-text move-in value", () => {
    const freeText = validApplication();
    freeText.apartment.moveInDate = "od 1. septembra";

    expect(messageFor(tenantApplicationSchema, freeText)).toBe(INVALID_DATE_MESSAGE);
  });

  it("requires a move-in date on the Byt step", () => {
    // The landlord needs to know when the flat is wanted, so this field is
    // mandatory. The column stays nullable: the rule belongs to the form.
    const apartment = validApplication().apartment;

    expect(messageFor(TENANT_STEP_SCHEMAS[4], { ...apartment, moveInDate: "" })).toBe(
      REQUIRED_FIELD_MESSAGE,
    );
  });
});
describe("ownerReviewSchema (owner panel, Sprint 4.3)", () => {
  const VALID_REVIEW = {
    status: "reviewing",
    rating: 4.5,
    notes: "Príjemný rozhovor.",
    facebookUrl: "https://facebook.com/maria",
  };

  it("accepts a review with a half-star rating", () => {
    expect(ownerReviewSchema.safeParse(VALID_REVIEW).success).toBe(true);
    expect(ownerReviewSchema.safeParse({ ...VALID_REVIEW, rating: 0 }).success).toBe(true);
    expect(ownerReviewSchema.safeParse({ ...VALID_REVIEW, rating: 5 }).success).toBe(true);
  });

  it("rejects a rating that is not a half step", () => {
    expect(messageFor(ownerReviewSchema, { ...VALID_REVIEW, rating: 4.3 })).toBe(
      INVALID_RATING_MESSAGE,
    );
  });

  it("rejects a rating outside 0–5", () => {
    expect(ownerReviewSchema.safeParse({ ...VALID_REVIEW, rating: -1 }).success).toBe(false);
    expect(ownerReviewSchema.safeParse({ ...VALID_REVIEW, rating: 6 }).success).toBe(false);
  });

  it("accepts only the pipeline stages the database allows", () => {
    for (const status of ["pending", "reviewing", "shortlisted", "rejected", "archived"]) {
      expect(ownerReviewSchema.safeParse({ ...VALID_REVIEW, status }).success).toBe(true);
    }
    expect(ownerReviewSchema.safeParse({ ...VALID_REVIEW, status: "maybe" }).success).toBe(false);
  });

  it("lets the owner clear notes and the Facebook link", () => {
    const cleared = { ...VALID_REVIEW, notes: "", facebookUrl: "" };

    expect(ownerReviewSchema.safeParse(cleared).success).toBe(true);
  });
});

describe("field helpers", () => {
  it("validates phone numbers by their digits, not their formatting", () => {
    expect(isValidPhoneNumber("+421 900 111 222")).toBe(true);
    expect(isValidPhoneNumber("0900111222")).toBe(true);
    expect(isValidPhoneNumber("12345")).toBe(false);
    expect(isValidPhoneNumber("+4219001112223333")).toBe(false);
    expect(isValidPhoneNumber("")).toBe(false);
  });

  it("validates calendar dates rather than just the pattern", () => {
    expect(isValidIsoDate("2026-10-01")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("01.10.2026")).toBe(false);
    expect(isValidIsoDate("2026-1-1")).toBe(false);
  });
});