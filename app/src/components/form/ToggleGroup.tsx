import type { ChangeEvent } from "react";

export interface ToggleOption {
  /** The value stored in the record — a spec §3.3 enum member, never the label. */
  value: string;
  /** The Slovak label the applicant sees. */
  label: string;
}

interface ToggleGroupProps {
  legend: string;
  /** Radio group name; must be unique on the page. */
  name: string;
  value: string;
  options: readonly ToggleOption[];
  onChange: (value: string) => void;
}

/**
 * Radio pill group, replacing the prototype's clickable `<label>`s.
 *
 * Built on native `<input type="radio">` rather than buttons on purpose: it
 * gives arrow-key navigation, grouping and screen-reader semantics for free,
 * which is exactly what §8 requires. The inputs are visually hidden
 * (`.sr-only`) and the visible pill is styled through `peer-checked`.
 */
export function ToggleGroup({ legend, name, value, options, onChange }: ToggleGroupProps) {
  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="mb-2 text-[0.8rem] font-medium text-ink-3">{legend}</legend>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
              className="peer sr-only"
            />
            <span className="inline-block rounded-full border border-border-2 bg-surface px-4 py-1.5 text-[0.8125rem] font-medium text-ink-3 transition-colors peer-checked:border-accent peer-checked:bg-accent-light peer-checked:font-semibold peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-hover:border-border-2">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
