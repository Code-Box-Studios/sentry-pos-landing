"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Checking…" : label}
    </Button>
  );
}

/**
 * One form for both the enrolment confirmation and the everyday sign-in check. The field
 * accepts a recovery code as well as a TOTP code — the API takes either in the same slot —
 * so it must not be constrained to six digits.
 */
export function TotpForm({
  action,
  label = "Verify",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  label?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const lockMinutes = state.retryAfterSeconds
    ? Math.ceil(state.retryAfterSeconds / 60)
    : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? (
        <Alert tone={state.retryAfterSeconds ? "warn" : "danger"}>
          {state.message}
          {lockMinutes ? <> Try again in {lockMinutes} minutes.</> : null}
        </Alert>
      ) : null}

      <Field
        name="code"
        label="Authentication code"
        error={state.fieldErrors?.code}
        hint="Six digits from your authenticator, or one of your recovery codes."
      >
        <Input
          name="code"
          inputMode="text"
          autoComplete="one-time-code"
          autoFocus
          className="font-mono tracking-widest"
        />
      </Field>

      <SubmitButton label={label} />
    </form>
  );
}
