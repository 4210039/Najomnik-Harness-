import { useState } from "react";

import { FormField } from "@/components/form/FormField";

interface SignInFormProps {
  error: string;
  isSubmitting: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
}

/**
 * The landlord sign-in gate (Sprint 4.1).
 *
 * Replaces Phase 1's password prompt, which hashed the password into
 * localStorage with a hardcoded `admin123` fallback that anyone could read from
 * the page source (§12.1). This credential is verified by Supabase Auth, and the
 * resulting session is what satisfies the `authenticated` RLS policies.
 *
 * Both fields are required, so the button stays disabled until they are filled:
 * an empty submit could only ever produce a provider error.
 */
export function SignInForm({ error, isSubmitting, onSubmit }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isIncomplete = email.trim() === "" || password === "";

  return (
    <div className="mx-auto mt-14 w-full max-w-[380px] px-5">
      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-lg bg-violet text-lg font-bold text-white"
        >
          V
        </span>

        <h2 className="mt-4 font-serif text-[1.4rem] leading-tight text-ink">
          Prihlásenie prenajímateľa
        </h2>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">
          Táto časť je určená len prenajímateľovi. Prihláste sa prosím svojím účtom.
        </p>

        <form
          noValidate
          className="mt-6 flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (isIncomplete || isSubmitting) return;
            void onSubmit(email.trim(), password);
          }}
        >
          <FormField
            id="ownerEmail"
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="vas@email.sk"
            required
          />
          <FormField
            id="ownerPassword"
            label="Heslo"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />

          {error === "" ? null : (
            <p
              role="alert"
              className="rounded-md border border-danger bg-danger-light px-3 py-2 text-[0.82rem] font-medium text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isIncomplete || isSubmitting}
            className="cursor-pointer rounded-md bg-accent px-5 py-2.5 text-[0.875rem] font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle"
          >
            {isSubmitting ? "Prihlasujem…" : "Prihlásiť sa"}
          </button>
        </form>
      </div>
    </div>
  );
}