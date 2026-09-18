import type { ChangeEvent } from "react";

import { cn } from "@/lib/utils";

interface FormFieldProps {
  /** Doubles as the DOM id, the `name`, and the key the Zod issues are read by. */
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: "text" | "tel" | "email" | "date" | "password";
  placeholder?: string;
  required?: boolean;
  /** Shown only once the field has been touched — see `useTenantForm.errorFor`. */
  error?: string;
  /** Persistent guidance, e.g. the Rodné číslo data-protection reminder (§7). */
  help?: string;
}

/**
 * One labelled text input, wired for accessibility (§8): a real `<label for>`,
 * the error linked through `aria-describedby` plus `aria-invalid`, and a
 * required marker that is announced rather than merely coloured.
 */
export function FormField({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  required = false,
  error,
  help,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const describedBy = [error === undefined ? null : errorId, help === undefined ? null : helpId]
    .filter((value) => value !== null)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.8rem] font-medium text-ink-3">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy === "" ? undefined : describedBy}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        onBlur={onBlur}
        className={cn(
          "w-full rounded-md border bg-surface px-3 py-2 text-[0.875rem] text-ink placeholder:text-subtle",
          error === undefined ? "border-border-2" : "border-danger bg-danger-light",
        )}
      />

      {help === undefined ? null : (
        <p id={helpId} className="text-[0.75rem] leading-relaxed text-muted">
          {help}
        </p>
      )}

      {error === undefined ? null : (
        <p id={errorId} role="alert" className="text-[0.75rem] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
