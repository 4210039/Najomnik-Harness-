import type { ReactNode } from "react";

interface FormSectionProps {
  /** Decorative emoji — hidden from assistive tech, the title carries the meaning. */
  icon: string;
  title: string;
  children: ReactNode;
}

/**
 * One titled card inside a step, matching the prototype's `.section` /
 * `.section-title` / `.section-body` arrangement (§5.3), ported to Tailwind.
 */
export function FormSection({ icon, title, children }: FormSectionProps) {
  return (
    <section className="mt-5 rounded-lg border border-border bg-surface p-5 shadow-xs sm:p-6">
      <h3 className="flex items-center gap-2 border-b border-border pb-3 text-[0.95rem] font-semibold text-ink">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}
