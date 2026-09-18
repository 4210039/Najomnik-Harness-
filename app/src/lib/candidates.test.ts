import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  createEmptyCandidateDraft,
  type CandidateDraft,
  type CandidateRow,
  type PersonalFields,
} from "./candidate";
import {
  CANDIDATES_TABLE,
  createCandidate,
  deleteCandidate,
  getCandidateById,
  listCandidates,
  submitApplication,
  updateCandidate,
  updateOwnerReview,
  type NewCandidate,
} from "./candidates";

/**
 * A row as PostgREST returns it. Deliberately minimal: the point of these tests
 * is the query the data layer builds and the shape it maps back, not the field
 * coverage of the mapper (that is `candidate.test.ts`).
 */
const CANDIDATE_ID = "6f1c8c2e-0f0a-4caa-9a2f-1b2c3d4e5f60";

const ROW: CandidateRow = {
  id: CANDIDATE_ID,
  created_at: "2026-09-01T09:00:00.000Z",
  updated_at: "2026-09-02T10:30:00.000Z",
  status: "pending",
  listing_id: null,
  first_name: "Mária",
  last_name: "Kováčová",
  dob: null,
  rc: null,
  op_number: null,
  passport_number: null,
  phone: "+421900111222",
  email: "maria@example.com",
  extra_contact: null,
  origin: "Košice",
  bratislava_years: null,
  student_status: null,
  school: null,
  year_level: null,
  employment_status: null,
  employer: null,
  employment_duration: null,
  must_have: null,
  nice_to_have: null,
  dream: null,
  likes: null,
  move_in_date: null,
  current_situation: null,
  additional_info: null,
  facebook_url: null,
  rating: null,
  notes: null,
};

/** A distinctive Rodné číslo, used to prove it never reaches an error message (§7). */
const SENSITIVE_RC = "9455121234";

/** The owner-only columns a tenant submission must never carry (migration 0001). */
const OWNER_COLUMNS = ["facebook_url", "rating", "notes"];

/** The insert payload as PostgREST receives it. */
function insertPayload(fake: ReturnType<typeof createFakeClient>): Record<string, unknown> {
  return (fake.argsFor("insert")?.[0] ?? {}) as Record<string, unknown>;
}

/** A filled-in application; `overrides` replace individual personal fields. */
function draft(overrides: Partial<PersonalFields> = {}): CandidateDraft {
  const empty = createEmptyCandidateDraft();

  return {
    ...empty,
    personal: {
      ...empty.personal,
      firstName: "Mária",
      lastName: "Kováčová",
      phone: "+421900111222",
      email: "maria@example.com",
      rc: SENSITIVE_RC,
      ...overrides,
    },
  };
}

interface FakeResponse {
  data: unknown;
  error: { message: string } | null;
}

interface RecordedCall {
  method: string;
  args: unknown[];
}

/**
 * Minimal stand-in for the PostgREST query builder: every method chains, the
 * chain is awaitable, and each call is recorded so the tests can assert on the
 * query that was actually built. Supabase's own builder is chained the same
 * way, which is why `client` is cast once rather than mocked per method.
 */
function createFakeClient(response: FakeResponse) {
  const calls: RecordedCall[] = [];
  const chain: Record<string, unknown> = {};

  for (const method of ["select", "insert", "update", "delete", "eq", "order"]) {
    chain[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    };
  }

  // The terminators are recorded like every other call, so a test can prove the
  // data layer used `maybeSingle` for a lookup (a plain `single` would raise on a
  // deleted id) and `single` after a write.
  for (const terminal of ["single", "maybeSingle"]) {
    chain[terminal] = (...args: unknown[]) => {
      calls.push({ method: terminal, args });
      return Promise.resolve(response);
    };
  }
  chain.then = (
    onFulfilled: (value: FakeResponse) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(response).then(onFulfilled, onRejected);

  const client = {
    from: (table: string) => {
      calls.push({ method: "from", args: [table] });
      return chain;
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    calls,
    methods: () => calls.map((call) => call.method),
    argsFor: (method: string) => calls.find((call) => call.method === method)?.args,
  };
}

describe("listCandidates", () => {
  it("reads the table in the owner sidebar's default order", async () => {
    const fake = createFakeClient({ data: [ROW], error: null });

    await listCandidates(fake.client);

    expect(fake.methods()).toEqual(["from", "select", "order"]);
    expect(fake.argsFor("from")).toEqual([CANDIDATES_TABLE]);
    expect(fake.argsFor("select")).toEqual(["*"]);
    expect(fake.argsFor("order")).toEqual(["created_at", { ascending: false }]);
  });

  it("maps rows into the canonical nested record", async () => {
    const fake = createFakeClient({ data: [ROW], error: null });

    const [candidate] = await listCandidates(fake.client);

    expect(candidate.personal.firstName).toBe("Mária");
    expect(candidate.status).toBe("pending");
    expect(candidate.owner.rating).toBe(0);
  });

  it("returns an empty list when the table has no rows", async () => {
    const fake = createFakeClient({ data: null, error: null });

    expect(await listCandidates(fake.client)).toEqual([]);
  });

  it("raises a descriptive error when the query fails (for example an RLS denial)", async () => {
    const fake = createFakeClient({
      data: null,
      error: { message: "permission denied for table candidates" },
    });

    await expect(listCandidates(fake.client)).rejects.toThrowError(
      /select on "candidates" failed: permission denied/,
    );
  });
});

describe("getCandidateById", () => {
  it("looks the row up by primary key and tolerates a missing id", async () => {
    const fake = createFakeClient({ data: ROW, error: null });

    await getCandidateById(CANDIDATE_ID, fake.client);

    // `maybeSingle`, not `single`: a deleted applicant must come back as null
    // rather than as a PostgREST "0 rows" error.
    expect(fake.methods()).toEqual(["from", "select", "eq", "maybeSingle"]);
    expect(fake.argsFor("select")).toEqual(["*"]);
    expect(fake.argsFor("eq")).toEqual(["id", CANDIDATE_ID]);
  });

  it("maps the row into the canonical nested record", async () => {
    const fake = createFakeClient({ data: ROW, error: null });

    const candidate = await getCandidateById(CANDIDATE_ID, fake.client);

    expect(candidate?.id).toBe(ROW.id);
    expect(candidate?.personal.lastName).toBe("Kováčová");
    expect(candidate?.owner.rating).toBe(0);
  });

  it("returns null when the id no longer exists", async () => {
    const fake = createFakeClient({ data: null, error: null });

    expect(await getCandidateById(CANDIDATE_ID, fake.client)).toBeNull();
  });

  it("raises a descriptive error when the read is denied", async () => {
    const fake = createFakeClient({
      data: null,
      error: { message: "permission denied for table candidates" },
    });

    await expect(getCandidateById(CANDIDATE_ID, fake.client)).rejects.toThrowError(
      /select on "candidates" failed: permission denied/,
    );
  });
});

describe("submitApplication (tenant path — anon role)", () => {
  it("inserts without reading back, because anon holds no SELECT grant", async () => {
    const fake = createFakeClient({ data: [ROW], error: null });

    await submitApplication(draft(), fake.client);

    // A `.select()` after the insert would be denied by RLS, so the chain must
    // stop at `insert`.
    expect(fake.methods()).toEqual(["from", "insert"]);
    expect(fake.argsFor("from")).toEqual([CANDIDATES_TABLE]);
  });

  it("resolves to nothing instead of pretending it knows the created id", async () => {
    const fake = createFakeClient({ data: [ROW], error: null });

    await expect(submitApplication(draft(), fake.client)).resolves.toBeUndefined();
  });

  it("leaves status to the column default and every owner column NULL", async () => {
    const fake = createFakeClient({ data: null, error: null });

    await submitApplication(draft(), fake.client);
    const payload = insertPayload(fake);

    expect(payload).not.toHaveProperty("status");
    for (const column of OWNER_COLUMNS) expect(payload).not.toHaveProperty(column);
  });

  it("drops a crafted owner block rather than storing a self-awarded rating", async () => {
    const fake = createFakeClient({ data: null, error: null });
    const rogue = { ...draft(), owner: { rating: 5, notes: "vložené" } } as unknown as NewCandidate;

    await submitApplication(rogue, fake.client);

    for (const column of OWNER_COLUMNS) expect(insertPayload(fake)).not.toHaveProperty(column);
  });

  it("trims the required fields and stores an empty answer as NULL", async () => {
    const fake = createFakeClient({ data: null, error: null });
    const application = draft({ firstName: "  Mária  " });
    application.apartment.mustHave = "parkovanie";

    await submitApplication(application, fake.client);
    const payload = insertPayload(fake);

    expect(payload.first_name).toBe("Mária");
    expect(payload.phone).toBe("+421900111222");
    expect(payload.rc).toBe(SENSITIVE_RC);
    expect(payload.must_have).toBe("parkovanie");
    expect(payload.nice_to_have).toBeNull();
    expect(payload.listing_id).toBeNull();
  });

  it("carries the listing id when the form came from a listing link (Sprint 9.3)", async () => {
    const fake = createFakeClient({ data: null, error: null });
    const listingId = "9b2f4c6d-1e3a-4b5c-8d7e-0f1a2b3c4d5e";

    await submitApplication({ ...draft(), listingId }, fake.client);

    expect(insertPayload(fake).listing_id).toBe(listingId);
  });

  it("never echoes Rodné číslo into the error it throws (§7)", async () => {
    const fake = createFakeClient({
      data: null,
      error: { message: "new row violates row-level security policy for table candidates" },
    });

    const failure = await submitApplication(draft(), fake.client).then(
      () => new Error("expected submitApplication to reject"),
      (error: unknown) => error as Error,
    );

    expect(failure.message).toMatch(/insert on "candidates" failed/);
    expect(failure.message).not.toContain(SENSITIVE_RC);
  });
});

describe("createCandidate (landlord path — authenticated role)", () => {
  it("inserts and asks the database to return the stored row", async () => {
    const fake = createFakeClient({ data: ROW, error: null });

    const created = await createCandidate(draft(), fake.client);

    expect(fake.methods()).toEqual(["from", "insert", "select", "single"]);
    expect(fake.argsFor("select")).toEqual(["*"]);
    expect(created.id).toBe(CANDIDATE_ID);
    expect(created.status).toBe("pending");
  });

  it("maps an insert failure onto the insert operation", async () => {
    const fake = createFakeClient({
      data: null,
      error: { message: 'null value in column "email" violates not-null constraint' },
    });

    await expect(createCandidate(draft(), fake.client)).rejects.toThrowError(
      /insert on "candidates" failed: null value in column/,
    );
  });
});

describe("updateCandidate", () => {
  it("flattens the patch into columns and scopes the write to one id", async () => {
    const fake = createFakeClient({ data: ROW, error: null });

    await updateCandidate(
      CANDIDATE_ID,
      { owner: { rating: 4.5 }, status: "shortlisted" },
      fake.client,
    );

    expect(fake.methods()).toEqual(["from", "update", "eq", "select", "single"]);
    expect(fake.argsFor("update")).toEqual([{ rating: 4.5, status: "shortlisted" }]);
    expect(fake.argsFor("eq")).toEqual(["id", CANDIDATE_ID]);
  });

  it("returns the stored row so callers render the server's updatedAt", async () => {
    const fake = createFakeClient({ data: ROW, error: null });

    const updated = await updateCandidate(CANDIDATE_ID, { status: "reviewing" }, fake.client);

    expect(updated.updatedAt).toBe(ROW.updated_at);
  });

  it("refuses an empty patch before it touches the network", async () => {
    const fake = createFakeClient({ data: ROW, error: null });

    await expect(updateCandidate(CANDIDATE_ID, {}, fake.client)).rejects.toThrowError(
      /refusing to send an empty patch/,
    );
    expect(fake.methods()).toEqual([]);
  });

  it("maps an update failure onto the update operation", async () => {
    const fake = createFakeClient({
      data: null,
      error: { message: "new row for relation \"candidates\" violates check constraint" },
    });

    await expect(
      updateCandidate(CANDIDATE_ID, { owner: { rating: 4.5 } }, fake.client),
    ).rejects.toThrowError(/update on "candidates" failed: new row for relation/);
  });
});

describe("updateOwnerReview (Sprint 4.3 — one write for the whole review)", () => {
  it("saves the pipeline stage, the rating, the notes and the Facebook link together", async () => {
    const fake = createFakeClient({ data: ROW, error: null });

    await updateOwnerReview(
      CANDIDATE_ID,
      {
        status: "shortlisted",
        rating: 4.5,
        notes: "Príjemný rozhovor.",
        facebookUrl: "https://facebook.com/maria",
      },
      fake.client,
    );

    expect(fake.argsFor("update")).toEqual([
      {
        status: "shortlisted",
        rating: 4.5,
        notes: "Príjemný rozhovor.",
        facebook_url: "https://facebook.com/maria",
      },
    ]);
    expect(fake.argsFor("eq")).toEqual(["id", CANDIDATE_ID]);
  });

  it("keeps a zero rating and clears the fields the owner emptied", async () => {
    const fake = createFakeClient({ data: ROW, error: null });

    await updateOwnerReview(
      CANDIDATE_ID,
      { status: "reviewing", rating: 0, notes: "", facebookUrl: "" },
      fake.client,
    );

    expect(fake.argsFor("update")).toEqual([
      { status: "reviewing", rating: 0, notes: null, facebook_url: null },
    ]);
  });
});

describe("deleteCandidate", () => {
  it("deletes exactly one row by id and reads nothing back", async () => {
    const fake = createFakeClient({ data: null, error: null });

    await deleteCandidate(CANDIDATE_ID, fake.client);

    expect(fake.methods()).toEqual(["from", "delete", "eq"]);
    expect(fake.argsFor("from")).toEqual([CANDIDATES_TABLE]);
    expect(fake.argsFor("eq")).toEqual(["id", CANDIDATE_ID]);
  });

  it("maps a delete failure onto the delete operation", async () => {
    const fake = createFakeClient({
      data: null,
      error: { message: "permission denied for table candidates" },
    });

    await expect(deleteCandidate(CANDIDATE_ID, fake.client)).rejects.toThrowError(
      /delete on "candidates" failed: permission denied/,
    );
  });
});

