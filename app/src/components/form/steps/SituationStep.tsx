import { bindField } from "@/components/form/bindField";
import { FormSection } from "@/components/form/FormSection";
import { FormTextArea } from "@/components/form/FormTextArea";
import type { StepProps } from "@/components/form/stepProps";

/**
 * Step 5 — Situácia.
 *
 * The last step before submission. Both fields are free text and optional, so
 * `canAdvance` is already true here; the gate that matters on this step is
 * `canSubmit`, which re-validates the whole application.
 */
export function SituationStep(props: StepProps) {
  return (
    <FormSection icon="📋" title="Aktuálna životná situácia">
      <FormTextArea
        label="Opíšte vašu aktuálnu bytovú situáciu"
        placeholder="Napr. bývam na internáte, zdieľam byt s 2 spolubývajúcimi, bývam u rodičov. Prečo hľadáte nový byt / prečo sa sťahujete…"
        rows={4}
        {...bindField(props, "situation", "currentSituation")}
      />
      <FormTextArea
        label="Čokoľvek ďalšie, čo by ste chceli prenajímateľovi povedať"
        placeholder="Napr. mám mačku, pracujem z domu, som nekuriaci, som tichý nájomca…"
        rows={4}
        {...bindField(props, "situation", "additionalInfo")}
      />
    </FormSection>
  );
}