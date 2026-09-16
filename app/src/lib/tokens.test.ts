// @vitest-environment node
// This suite parses the stylesheet off disk, so it needs Node’s `fs` and a
// real file path rather than the simulated browser DOM.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  REQUIRED_TOKEN_NAMES,
  baseRadius,
  colorTokens,
  radiusTokens,
  shadowTokens,
} from "./tokens";

/**
 * Guards the design system against drift between the CSS custom properties
 * (visual source of truth) and the mirrored JS token values (charts, PDF).
 *
 * If someone changes a colour in index.css without updating tokens.ts — or the
 * reverse — these tests fail.
 */
const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

/** Read a custom property's declared value out of the stylesheet. */
function readCssVar(name: string): string | undefined {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return match?.[1]?.trim();
}

/** Collapse whitespace so formatting differences don't cause false failures. */
function normalise(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("design tokens (spec §5.1)", () => {
  it("declares every required custom property", () => {
    const missing = REQUIRED_TOKEN_NAMES.filter((name) => readCssVar(name) === undefined);
    expect(missing).toEqual([]);
  });

  it("keeps every colour in sync between index.css and tokens.ts", () => {
    const mismatched = Object.entries(colorTokens)
      .filter(([name, expected]) => {
        const actual = readCssVar(name);
        return actual === undefined || actual.toLowerCase() !== expected.toLowerCase();
      })
      .map(([name, expected]) => `${name}: css=${readCssVar(name)} ts=${expected}`);

    expect(mismatched).toEqual([]);
  });

  it("keeps the radius scale in sync", () => {
    const mismatched = Object.entries(radiusTokens)
      .filter(([key, expected]) => readCssVar(`radius-${key}`) !== expected)
      .map(([key, expected]) => `radius-${key}: css=${readCssVar(`radius-${key}`)} ts=${expected}`);

    expect(mismatched).toEqual([]);
    expect(readCssVar("radius")).toBe(baseRadius);
  });

  it("keeps the shadow scale in sync", () => {
    const mismatched = Object.entries(shadowTokens)
      .filter(([key, expected]) => {
        const actual = readCssVar(`shadow-${key}`);
        return actual === undefined || normalise(actual) !== normalise(expected);
      })
      .map(([key, expected]) => `shadow-${key}: css=${readCssVar(`shadow-${key}`)} ts=${expected}`);

    expect(mismatched).toEqual([]);
  });

  it("uses the exact palette mandated by the specification", () => {
    // Spot-check the values most likely to be "improved" by accident.
    expect(colorTokens.accent).toBe("#3b5bdb");
    expect(colorTokens.ink).toBe("#0f1623");
    expect(colorTokens.violet).toBe("#7c3aed");
    expect(colorTokens.star).toBe("#f59e0b");
    expect(colorTokens["star-half"]).toBe("#fcd34d");
  });
});