"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export function ForgotForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  if (state.done) {
    return (
      <Alert tone="info">
        If an account exists for that address, a reset link is on its way. The link expires in
        one hour.
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? <Alert>{state.message}</Alert> : null}
      <Field name="email" label="Email address" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="username" autoFocus />
      </Field>
      <SubmitButton />
      <p className="text-center text-sm">
        <a href="/login" className="text-brand-green-dark hover:underline">
          Back to sign in
        </a>
      </p>
    </form>
  );
}
