import type { CandidateDraft } from "@/lib/candidate";

import type { StepProps } from "./stepProps";

/**
 * Wire one field of a step to the form controller.
 *
 * WHY THIS EXISTS
 *   Hand-wiring every input would mean five props per field across ~25 fields —
 *   noise that hides the layout. The generic parameters keep it safe: the field
 *   name is checked against the section, so `bindField(props, "personal", "fone")`
 *   is a compile error rather than a silently ignored input.
 *
 * The single cast is unavoidable: TypeScript cannot prove that a computed key
 * `{ [field]: value }` satisfies `Partial<CandidateDraft[TSection]>` for a
 * generic `field`, even though it does by construction.
 */
export function bindField<
  TSection extends keyof CandidateDraft,
  TField extends keyof CandidateDraft[TSection] & string,
>(context: StepProps, section: TSection, field: TField) {
  return {
    /** The DOM id equals the field name, which is also the Zod issue path. */
    id: field,
    value: context.draft[section][field] as string,
    error: context.errorFor(field) || undefined,
    onBlur: () => context.markTouched(field),
    onChange: (value: string) =>
      context.update(section, { [field]: value } as Partial<CandidateDraft[TSection]>),
  };
}