/**
 * Shared compile-time types.
 */

/** The two principals this app serves (spec §1). */
export type AppTab = "najomnik" | "vlastnik";

/** Slovak canonical step names, in order (spec §6.4). */
export const STEP_NAMES = [
  { id: 1, sk: "Osobné", en: "Personal" },
  { id: 2, sk: "Pobyt", en: "Residence" },
  { id: 3, sk: "Štúdium & Práca", en: "Studies & Work" },
  { id: 4, sk: "Byt", en: "Apartment" },
  { id: 5, sk: "Situácia", en: "Situation" },
] as const;

export type StepNumber = (typeof STEP_NAMES)[number]["id"];