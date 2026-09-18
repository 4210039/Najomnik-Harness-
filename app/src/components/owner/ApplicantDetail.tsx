import type { ReactNode } from "react";

import {
  describeAnswer,
  describeEmploymentStatus,
  describeStatus,
  describeStudentStatus,
  formatDate,
} from "@/components/owner/labels";
import type { Candidate } from "@/lib/candidate";

interface ApplicantDetailProps {
  candidate: Candidate;
}

/** Spec §7 requires this reminder wherever Rodné číslo is shown. */
const RC_HELP =
  "Rodné číslo uchovávajte v súlade s platnou legislatívou o ochrane osobných údajov.";

/** One label/value pair. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.7rem] font-semibold tracking-[0.04em] text-subtle uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 text-[0.85rem] leading-relaxed break-words whitespace-pre-line text-ink-2">
        {value}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-xs">
      <h3 className="border-b border-border pb-2 text-[0.95rem] font-semibold text-ink">{title}</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

/**
 * The full applicant record, owner-facing (Sprint 4.2).
 *
 * The ONLY place Rodné číslo is rendered, and it carries `print:hidden` so it is
 * excluded from printing — the `no-print` rule of §7, expressed as a Tailwind
 * variant rather than a bespoke class.
 *
 * Labels follow the §6.2 glossary's third person ("Odkiaľ pochádza?"), because
 * here the landlord reads *about* an applicant rather than addressing them.
 *
 * Rating and notes are Sprint 4.3; this view is deliberately read-only.
 */
export function ApplicantDetail({ candidate }: ApplicantDetailProps) {
  const { personal, residence, studyWork, apartment, situation, owner } = candidate;

  return (
    <div className="flex-1 overflow-y-auto bg-bg px-8 py-6">
      <div className="mx-auto flex max-w-[760px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-[1.4rem] leading-tight text-ink">
              {personal.firstName} {personal.lastName}
            </h2>
            <p className="mt-1 text-[0.78rem] text-muted">
              Prijatá {formatDate(candidate.createdAt)}
            </p>
          </div>
          <span className="rounded-full border border-accent-mid bg-accent-light px-3 py-1 text-[0.75rem] font-semibold text-accent">
            {describeStatus(candidate.status)}
          </span>
        </header>

        <Section title="Osobné údaje">
          <Field label="Meno" value={describeAnswer(personal.firstName)} />
          <Field label="Priezvisko" value={describeAnswer(personal.lastName)} />
          <Field label="Dátum narodenia" value={formatDate(personal.dob)} />
          <Field label="Telefón" value={describeAnswer(personal.phone)} />
          <Field label="E-mail" value={describeAnswer(personal.email)} />
          <Field label="Ďalší kontakt" value={describeAnswer(personal.extraContact)} />
          <Field label="Číslo OP" value={describeAnswer(personal.opNumber)} />
          <Field label="Číslo pasu" value={describeAnswer(personal.passportNumber)} />

          {/* §7: the only rendering of Rodné číslo, and never on paper. */}
          <div className="print:hidden">
            <Field label="Rodné číslo" value={describeAnswer(personal.rc)} />
            <p className="mt-1 text-[0.7rem] leading-relaxed text-muted">{RC_HELP}</p>
          </div>
        </Section>

        <Section title="Pôvod a pobyt">
          <Field label="Odkiaľ pochádza?" value={describeAnswer(residence.origin)} />
          <Field
            label="Ako dlho v Bratislave?"
            value={describeAnswer(residence.bratislavaYears)}
          />
        </Section>

        <Section title="Štúdium & Práca">
          <Field label="Ste študent/ka?" value={describeStudentStatus(studyWork.studentStatus)} />
          <Field label="Kde študuje?" value={describeAnswer(studyWork.school)} />
          <Field label="Rok / ročník" value={describeAnswer(studyWork.yearLevel)} />
          <Field
            label="Pracujete?"
            value={describeEmploymentStatus(studyWork.employmentStatus)}
          />
          <Field label="Kde / u koho pracuje?" value={describeAnswer(studyWork.employer)} />
          <Field label="Ako dlho?" value={describeAnswer(studyWork.employmentDuration)} />
        </Section>

        <Section title="Preferencie k bytu">
          <Field label="Nevyhnutné" value={describeAnswer(apartment.mustHave)} />
          <Field label="Uvítal by" value={describeAnswer(apartment.niceToHave)} />
          <Field label="Sen / ideál" value={describeAnswer(apartment.dream)} />
          <Field label="Čo sa mu páči na byte" value={describeAnswer(apartment.likes)} />
          <Field label="Kedy sa chce nasťahovať" value={formatDate(apartment.moveInDate)} />
        </Section>

        <Section title="Aktuálna životná situácia">
          <Field label="Bytová situácia" value={describeAnswer(situation.currentSituation)} />
          <Field label="Ďalšie informácie" value={describeAnswer(situation.additionalInfo)} />
        </Section>

        <p className="text-[0.78rem] leading-relaxed text-muted">
          Hodnotenie, poznámky a zmena stavu pribudnú v šprinte 4.3.
          {owner.notes === "" ? "" : ` Poznámka: ${owner.notes}`}
        </p>
      </div>
    </div>
  );
}