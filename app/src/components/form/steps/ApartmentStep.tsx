import { bindField } from "@/components/form/bindField";
import { FormField } from "@/components/form/FormField";
import { FormSection } from "@/components/form/FormSection";
import { FormTextArea } from "@/components/form/FormTextArea";
import type { StepProps } from "@/components/form/stepProps";

/**
 * Step 4 — Byt.
 *
 * "Kedy by ste chceli nasťahovať?" is a real `date` input, not the prototype's
 * free text ("od 1. septembra"). The column is a `date` and Sprint 5 filters on
 * a range, so the value has to be an ISO calendar date — the schema rejects
 * anything else with `INVALID_DATE_MESSAGE`.
 */
export function ApartmentStep(props: StepProps) {
  return (
    <FormSection icon="🏠" title="Preferencie k bytu">
      <FormTextArea
        label="Čo je pre vás v byte nevyhnutné?"
        placeholder="Napr. vlastná kúpeľňa, rýchly internet, tichá lokalita, povolenie mať zviera…"
        rows={3}
        {...bindField(props, "apartment", "mustHave")}
      />
      <FormTextArea
        label="Čo by ste uvítali, ale nie je podmienkou?"
        placeholder="Napr. balkón, parkovacie miesto, práčka v byte, bezbariérový prístup…"
        rows={3}
        {...bindField(props, "apartment", "niceToHave")}
      />
      <FormTextArea
        label="Čo by ste chceli mať (sen / ideál)?"
        placeholder="Napr. terasa, klimatizácia, smart home, pohľad na mesto…"
        rows={3}
        {...bindField(props, "apartment", "dream")}
      />
      <FormTextArea
        label="Čo sa vám páči na ponúkanom byte?"
        placeholder="napr. lokalita, súkromie, vybavenie, svetlosť, dispozícia…"
        rows={3}
        {...bindField(props, "apartment", "likes")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Kedy by ste chceli nasťahovať?"
          type="date"
          required
          {...bindField(props, "apartment", "moveInDate")}
        />
      </div>
    </FormSection>
  );
}