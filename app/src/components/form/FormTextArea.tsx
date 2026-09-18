import type { ChangeEvent } from "react";

import { cn } from "@/lib/utils";

interface FormTextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
}

/**
 * The multi-line sibling of `FormField`, sharing its accessibility contract:
 * real label, `aria-describedby`-linked error, `aria-invalid` when invalid.
 */
export function FormTextArea({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  rows = 3,
}: FormTextAreaProps) {
  const errorId = `${id}-error`;

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

      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={error === undefined ? undefined : errorId}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
        onBlur={onBlur}
        className={cn(
          "w-full resize-y rounded-md border bg-surface px-3 py-2 text-[0.875rem] leading-relaxed text-ink placeholder:text-subtle",
          error === undefined ? "border-border-2" : "border-danger bg-danger-light",
        )}
      />

      {error === undefined ? null : (
        <p id={errorId} role="alert" className="text-[0.75rem] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
