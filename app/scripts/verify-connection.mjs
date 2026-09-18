/**
 * Verify the live Supabase connection — run with `npm run verify:connection`.
 *
 * WHAT IT PROVES
 *   1. `app/.env.local` carries both `VITE_*` variables and they parse.
 *   2. The landlord credentials sign in (`auth.signInWithPassword`).
 *   3. The `authenticated` role can SELECT `public.candidates` — the check that
 *      closes Sprint 1.2.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *   It asks for a COUNT (`head: true`), never rows, so no applicant data — least
 *   of all Rodné číslo (§7) — is loaded into this process or printed to a
 *   terminal that might end up in a screenshot.
 *
 * CREDENTIAL HANDLING
 *   The password is read with the echo switched off, so it never appears on
 *   screen, in the shell history, or in a screenshot. Nothing is written to disk.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
// `node:readline/promises` — the callback API's `question()` returns undefined
// rather than a promise, so importing from `node:readline` silently breaks.
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const ENV_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");

/** `--list` also prints the newest applications (see `printRecentSubmissions`). */
const WANT_LIST = process.argv.includes("--list");

/** Parse a dotenv-style file: `KEY=value`, `#` comments, optional quotes. */
function readEnvFile(path) {
  let contents = "";
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    return {};
  }

  const values = {};
  for (const line of contents.split("\n")) {
    const text = line.trim();
    if (text === "" || text.startsWith("#")) continue;

    const separator = text.indexOf("=");
    if (separator === -1) continue;

    let value = text.slice(separator + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);

    values[text.slice(0, separator).trim()] = value;
  }
  return values;
}

/**
 * ONE interface is shared by both questions. Creating a second interface after
 * closing the first does not work: `close()` ends stdin consumption, so the next
 * `question()` never resolves and Node exits silently with code 0 — which is
 * exactly what this script did the first time it ran.
 */
function createPrompt() {
  return createInterface({ input: process.stdin, output: process.stdout });
}

/** Ask a question, echoing what is typed. */
async function askVisible(rl, question) {
  return (await rl.question(question)).trim();
}

/**
 * Read the two answers from a pipe: email on the first line, password on the
 * second. Piped input is supported because it makes the script testable (and
 * usable from CI later); without this branch, readline sees EOF after the first
 * line, the second `question()` never resolves, and Node exits silently with
 * code 0.
 */
async function readPipedAnswers() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);

  const lines = Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
  return { email: (lines[0] ?? "").trim(), password: (lines[1] ?? "").trim() };
}

/** Ask for the credentials on a terminal, hiding the password. */
async function askCredentials() {
  const rl = createPrompt();
  try {
    const email = await askVisible(rl, "Landlord email: ");
    const password = await askHidden(rl, "Landlord password: ");
    return { email, password };
  } finally {
    rl.close(); // release stdin before the network calls
  }
}

/**
 * Ask a question with the typed characters hidden.
 *
 * `readline` has no public "quiet" mode, so the echo is suppressed by muting
 * `process.stdout.write` for the duration of the input. The prompt itself is
 * written directly, before the mute.
 */
async function askHidden(rl, question) {
  const write = process.stdout.write.bind(process.stdout);
  write(question);
  process.stdout.write = () => true;

  try {
    return (await rl.question("")).trim();
  } finally {
    process.stdout.write = write;
    write("\n");
  }
}

/**
 * Columns shown by `--list`. `rc` (Rodné číslo) is deliberately NOT selected, so
 * the sensitive value never leaves the database at all — it cannot be printed by
 * accident if it was never fetched (spec §7).
 */
const LIST_COLUMNS = [
  "status",
  "created_at",
  "first_name",
  "last_name",
  "email",
  "phone",
  "origin",
];
const LIST_LIMIT = 10;

/**
 * Print the newest applications so a locally submitted form can be confirmed
 * without the owner dashboard, which does not exist yet (Sprint 4.2).
 */
async function printRecentSubmissions(supabase) {
  const { data, error } = await supabase
    .from("candidates")
    .select(LIST_COLUMNS.join(", "))
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error) {
    fail(`Listing applications failed: ${error.message}`);
    return;
  }

  if (data.length === 0) {
    console.log("\nNo applications yet — submit the form, then run this again.\n");
    return;
  }

  console.log(`\nNewest ${data.length} application(s):\n`);
  for (const row of data) {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
    const when = new Date(row.created_at).toISOString().slice(0, 16).replace("T", " ");
    const contact = [row.email, row.phone].filter(Boolean).join("  ");
    const origin = row.origin ? `  (${row.origin})` : "";

    console.log(`  ${when}  ${String(row.status).padEnd(11)}  ${name}`);
    console.log(`                      ${contact}${origin}`);
  }

  console.log("\nNote: Rodné číslo is not selected here, by design (§7).\n");
}

/** Report a failure in the terms the person running the script needs. */
function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exitCode = 1;
}

async function main() {
  const env = readEnvFile(ENV_FILE);
  const url = env.VITE_SUPABASE_URL ?? "";
  const anonKey = env.VITE_SUPABASE_ANON_KEY ?? "";

  if (url === "" || anonKey === "") {
    fail(
      `VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing from ${ENV_FILE}.\n` +
        "   Copy app/.env.example to app/.env.local and fill both in.",
    );
    return;
  }

  console.log(`\nProject : ${url}`);
  console.log("Reading credentials (the password is not echoed).\n");

  const credentials = process.stdin.isTTY ? await askCredentials() : await readPipedAnswers();

  if (credentials.email === "" || credentials.password === "") {
    fail(
      "Both an email and a password are needed.\n" +
        "   Interactive: run `npm run verify:connection` in a terminal.\n" +
        "   Piped: send the email on the first line and the password on the second.",
    );
    return;
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const signIn = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (signIn.error) {
    fail(
      `Sign-in failed: ${signIn.error.message}\n` +
        '   "Invalid login credentials" -> the email or password is wrong.\n' +
        '   "Email not confirmed"       -> confirm the user in Authentication -> Users.',
    );
    return;
  }

  console.log(`Signed in as ${signIn.data.user.email}`);

  const { count, error: selectError } = await supabase
    .from("candidates")
    .select("*", { count: "exact", head: true });

  if (selectError) {
    fail(
      `Authenticated SELECT failed: ${selectError.message}\n` +
        "   The landlord role cannot read public.candidates — check the grants and\n" +
        "   RLS policies from migration 0001 (and re-read 0002 if it was just applied).",
    );
    await supabase.auth.signOut();
    return;
  }

  console.log(`Authenticated SELECT ok — public.candidates holds ${count ?? "an unknown number of"} row(s).`);

  if (WANT_LIST) {
    await printRecentSubmissions(supabase);
  } else if ((count ?? 0) > 0) {
    console.log(
      "   Re-run with --list to see the newest applications (Rodné číslo excluded).\n" +
        "   If the rows are the old verification probes, remove them in the SQL Editor:\n" +
        "     delete from public.candidates where last_name = 'RLS-PROBE-DELETE-ME';",
    );
  }

  await supabase.auth.signOut();
  console.log("\n✅ Sprint 1.2 verified: the landlord can reach the database.\n");
}

main().catch((error) => {
  fail(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
});
