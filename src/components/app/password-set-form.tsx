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
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * Choosing a password against a single-use token. Shared by invite acceptance and reset
 * confirmation — the two flows differ only in wording and in which endpoint the action
 * calls.
 */
export function PasswordSetForm({
  action,
  token,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  token: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.message ? <Alert>{state.message}</Alert> : null}

      <Field
        name="password"
        label="New password"
        error={state.fieldErrors?.password}
        hint="At least 8 characters."
      >
        <Input name="password" type="password" autoComplete="new-password" autoFocus />
      </Field>

      <Field name="confirm" label="Confirm password" error={state.fieldErrors?.confirm}>
        <Input name="confirm" type="password" autoComplete="new-password" />
      </Field>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
