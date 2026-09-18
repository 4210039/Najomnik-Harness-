import { bindField } from "@/components/form/bindField";
import { FormField } from "@/components/form/FormField";
import { FormSection } from "@/components/form/FormSection";
import type { StepProps } from "@/components/form/stepProps";
import { ToggleGroup, type ToggleOption } from "@/components/form/ToggleGroup";
import type { EmploymentStatus, StudentStatus } from "@/lib/candidate";

/**
 * The labels are the prototype's Slovak wording; the VALUES are the spec §3.3
 * enums, never the labels. Storing "Áno" instead of `tpp` is precisely the
 * divergence §12.1 of the instructions lists as a defect to fix.
 */
const STUDENT_OPTIONS: readonly ToggleOption[] = [
  { value: "fullTime", label: "Áno" },
  { value: "partTime", label: "Externé" },
  { value: "no", label: "Nie" },
];

const EMPLOYMENT_OPTIONS: readonly ToggleOption[] = [
  { value: "tpp", label: "Áno" },
  { value: "szco", label: "SZČO" },
  { value: "brigada", label: "Brigáda" },
  { value: "no", label: "Nie" },
];

const STUDYING_STATUSES: readonly StudentStatus[] = ["fullTime", "partTime"];
const WORKING_STATUSES: readonly EmploymentStatus[] = ["tpp", "szco", "brigada"];

/**
 * Step 3 — Štúdium & Práca.
 *
 * Two sections, as in the prototype. The follow-up questions are conditional:
 * "Kde študujete?" only appears once the applicant says they study, and the
 * employer questions only once they say they work. Both statuses stay optional
 * in the schema, so an applicant may advance without answering either — the
 * cross-field rules belong to the form, not to the data model (§6.3 note).
 */
export function StudyWorkStep(props: StepProps) {
  const { studentStatus, employmentStatus } = props.draft.studyWork;
  const isStudying = STUDYING_STATUSES.some((status) => status === studentStatus);
  const isWorking = WORKING_STATUSES.some((status) => status === employmentStatus);

  return (
    <>
      <FormSection icon="🎓" title="Štúdium">
        <ToggleGroup
          legend="Ste študent/ka?"
          name="studentStatus"
          value={studentStatus}
          options={STUDENT_OPTIONS}
          onChange={(value) =>
            props.update("studyWork", { studentStatus: value as StudentStatus })
          }
        />

        {isStudying ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Kde študujete?"
              placeholder="napr. UK Bratislava — právo"
              {...bindField(props, "studyWork", "school")}
            />
            <FormField
              label="Rok / ročník"
              placeholder="napr. 3. ročník, Bc."
              {...bindField(props, "studyWork", "yearLevel")}
            />
          </div>
        ) : null}
      </FormSection>

      <FormSection icon="💼" title="Zamestnanie">
        <ToggleGroup
          legend="Pracujete?"
          name="employmentStatus"
          value={employmentStatus}
          options={EMPLOYMENT_OPTIONS}
          onChange={(value) =>
            props.update("studyWork", { employmentStatus: value as EmploymentStatus })
          }
        />

        {isWorking ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Kde / u koho pracujete?"
              placeholder="firma, pozícia"
              {...bindField(props, "studyWork", "employer")}
            />
            <FormField
              label="Ako dlho?"
              placeholder="napr. 2 roky"
              {...bindField(props, "studyWork", "employmentDuration")}
            />
          </div>
        ) : null}
      </FormSection>
    </>
  );
}