import { bindField } from "@/components/form/bindField";
import { FormField } from "@/components/form/FormField";
import { FormSection } from "@/components/form/FormSection";
import type { StepProps } from "@/components/form/stepProps";

/**
 * Step 2 — Pobyt.
 *
 * The label uses formal vykanie ("Odkiaľ ste?") because the form addresses the
 * applicant directly, matching the prototype's tenant form. The owner-facing
 * glossary in spec §6.2 uses the third person ("Odkiaľ pochádza?") — that is the
 * reading view, where the landlord reads about someone else.
 */
export function ResidenceStep(props: StepProps) {
  return (
    <FormSection icon="📍" title="Pôvod a súčasný pobyt">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Odkiaľ ste?"
          placeholder="napr. Slovensko, Košice"
          required
          {...bindField(props, "residence", "origin")}
        />
        <FormField
          label="Ako dlho pôsobíte v Bratislave?"
          placeholder="napr. 2 roky, od septembra 2024…"
          {...bindField(props, "residence", "bratislavaYears")}
        />
      </div>
    </FormSection>
  );
}