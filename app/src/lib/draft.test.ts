import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyCandidateDraft, type CandidateDraft } from "./candidate";
import {
  DRAFT_STORAGE_KEY,
  clearDraft,
  isDraftEmpty,
  loadDraft,
  saveDraft,
} from "./draft";

/** A draft with a few fields filled, including the sensitive one. */
function filledDraft(): CandidateDraft {
  const draft = createEmptyCandidateDraft();
  draft.personal.firstName = "Mária";
  draft.personal.lastName = "Kováčová";
  draft.personal.rc = "9455121234";
  draft.residence.origin = "Košice";
  draft.studyWork.studentStatus = "partTime";
  return draft;
}

describe("draft persistence (Sprint 3.2)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a draft through localStorage", () => {
    saveDraft(filledDraft());

    const restored = loadDraft();

    expect(restored).not.toBeNull();
    expect(restored?.personal.firstName).toBe("Mária");
    expect(restored?.personal.rc).toBe("9455121234");
    expect(restored?.residence.origin).toBe("Košice");
    expect(restored?.studyWork.studentStatus).toBe("partTime");
  });

  it("returns null when nothing has been saved", () => {
    expect(loadDraft()).toBeNull();
  });

  it("survives corrupt JSON instead of breaking the form", () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, "{ not json");

    expect(loadDraft()).toBeNull();
  });

  it("ignores a stored value that is not an object", () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, '"a string"');

    expect(loadDraft()).toBeNull();
  });

  it("fills in sections an older build never wrote", () => {
    // Simulates a draft stored before a section existed.
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ personal: { firstName: "Ján" } }),
    );

    const restored = loadDraft();

    expect(restored?.personal.firstName).toBe("Ján");
    expect(restored?.personal.lastName).toBe("");
    expect(restored?.situation).toEqual({ currentSituation: "", additionalInfo: "" });
  });

  it("drops unknown fields rather than copying them into the draft", () => {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ personal: { firstName: "Ján", bogus: "x" } }),
    );

    expect(Object.keys(loadDraft()?.personal ?? {})).not.toContain("bogus");
  });

  it("ignores non-string values, so a mangled draft cannot inject objects", () => {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ personal: { firstName: { nested: true } } }),
    );

    expect(loadDraft()?.personal.firstName).toBe("");
  });

  it("clears the stored draft", () => {
    saveDraft(filledDraft());
    clearDraft();

    expect(loadDraft()).toBeNull();
    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("recognises an untouched draft", () => {
    expect(isDraftEmpty(createEmptyCandidateDraft())).toBe(true);
    expect(isDraftEmpty(filledDraft())).toBe(false);
  });

  it("treats a single filled field as worth keeping", () => {
    const draft = createEmptyCandidateDraft();
    draft.situation.additionalInfo = "mám mačku";

    expect(isDraftEmpty(draft)).toBe(false);
  });

  it("never throws when localStorage is unavailable", () => {
    // Some privacy modes throw on access; the form must keep working regardless.
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("SecurityError");
      });

    expect(() => loadDraft()).not.toThrow();
    expect(loadDraft()).toBeNull();

    getItem.mockRestore();
  });

  it("never throws when writing fails, e.g. on quota", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => saveDraft(filledDraft())).not.toThrow();

    setItem.mockRestore();
  });
});