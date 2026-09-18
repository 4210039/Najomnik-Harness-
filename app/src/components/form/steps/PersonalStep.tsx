import { bindField } from "@/components/form/bindField";
import { FormField } from "@/components/form/FormField";
import { FormSection } from "@/components/form/FormSection";
import type { StepProps } from "@/components/form/stepProps";

/** Spec §7 requires this reminder next to the Rodné číslo field; the prototype
 *  omitted it entirely (see §12.1 of the instructions). */
const RC_HELP =
  "Rodné číslo uchovávajte v súlade s platnou legislatívou o ochrane osobných údajov.";

/**
 * Step 1 — Osobné.
 *
 * Labels, placeholders and the row grouping come from the prototype's tenant
 * form, so the React port stays visually faithful. Only the required markers
 * differ: Rodné číslo is optional by specification (§7) and is never required.
 */
export function PersonalStep(props: StepProps) {
  return (
    <FormSection icon="👤" title="Osobné údaje">
      <div className="grid gap-5 sm:grid-cols-3">
        <FormField
          label="Meno"
          placeholder="Ján"
          required
          {...bindField(props, "personal", "firstName")}
        />
        <FormField
          label="Priezvisko"
          placeholder="Novák"
          required
          {...bindField(props, "personal", "lastName")}
        />
        <FormField label="Dátum narodenia" type="date" {...bindField(props, "personal", "dob")} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Rodné číslo"
          placeholder="RRMMDD/XXXX"
          help={RC_HELP}
          {...bindField(props, "personal", "rc")}
        />
        <FormField
          label="Číslo OP (občiansky preukaz)"
          placeholder="napr. EA 123456"
          {...bindField(props, "personal", "opNumber")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Číslo pasu"
          placeholder="napr. AA1234567"
          {...bindField(props, "personal", "passportNumber")}
        />
      </div>

      <div className="border-t border-border" />

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField
          label="Telefón"
          type="tel"
          placeholder="+421 9xx xxx xxx"
          required
          {...bindField(props, "personal", "phone")}
        />
        <FormField
          label="E-mail"
          type="email"
          placeholder="jan@email.sk"
          required
          {...bindField(props, "personal", "email")}
        />
        <FormField
          label="Ďalší kontakt"
          placeholder="napr. Telegram, WhatsApp"
          {...bindField(props, "personal", "extraContact")}
        />
      </div>
    </FormSection>
  );
}