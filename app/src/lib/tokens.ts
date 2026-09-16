/**
 * Canonical design tokens for JavaScript consumers (spec §5.1).
 *
 * Charts (Recharts), PDF export (react-pdf) and computed styles cannot read CSS
 * custom properties, so the palette is mirrored here. `tokens.test.ts` asserts
 * these values remain identical to the declarations in `index.css`, which means
 * drift becomes a failing test rather than a subtle visual bug.
 *
 * Keys are the exact custom-property suffixes used in index.css. Do NOT rename.
 */

export const colorTokens: Readonly<Record<string, string>> = {
  // Ink / Text
  ink: "#0f1623",
  "ink-2": "#1e2a3b",
  "ink-3": "#344054",
  muted: "#667085",
  subtle: "#98a2b3",

  // Surfaces
  bg: "#f5f6fa",
  surface: "#ffffff",
  "surface-2": "#f9fafb",
  "surface-3": "#f2f4f7",

  // Borders
  border: "#e4e7ec",
  "border-2": "#d0d5dd",

  // Accent — deep indigo
  accent: "#3b5bdb",
  "accent-hover": "#2f4ac7",
  "accent-light": "#eef2ff",
  "accent-mid": "#c5d0fa",

  // Status
  green: "#12b76a",
  "green-light": "#ecfdf3",
  danger: "#f04438",
  "danger-light": "#fef3f2",
  amber: "#f79009",
  "amber-light": "#fffaeb",
  star: "#f59e0b",
  "star-half": "#fcd34d",

  // Owner accent — deep violet
  violet: "#7c3aed",
  "violet-light": "#f5f3ff",
  "violet-border": "#ddd6fe",
};

/** Radius scale. Keys map to the `--radius-<key>` custom properties. */
export const radiusTokens: Readonly<Record<string, string>> = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "18px",
};

/** The bare `--radius` default. */
export const baseRadius = "10px";

/** Shadow scale. Keys map to the `--shadow-<key>` custom properties. */
export const shadowTokens: Readonly<Record<string, string>> = {
  xs: "0 1px 2px rgba(16, 24, 40, 0.05)",
  sm: "0 1px 3px rgba(16, 24, 40, 0.1), 0 1px 2px rgba(16, 24, 40, 0.06)",
  md: "0 4px 8px -2px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.06)",
  lg: "0 12px 40px -4px rgba(16, 24, 40, 0.12), 0 4px 12px -2px rgba(16, 24, 40, 0.08)",
};

/**
 * Every custom-property name the specification §5.1 requires to exist, so an
 * accidental deletion is caught rather than silently restyling the app.
 */
export const REQUIRED_TOKEN_NAMES: readonly string[] = [
  ...Object.keys(colorTokens),
  ...Object.keys(radiusTokens).map((key) => `radius-${key}`),
  "radius",
  ...Object.keys(shadowTokens).map((key) => `shadow-${key}`),
];