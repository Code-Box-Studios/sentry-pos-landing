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
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Set refund PIN"}
    </Button>
  );
}

export function RefundPinForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="max-w-sm space-y-4" noValidate>
      {state.done ? <Alert tone="info">Refund PIN updated.</Alert> : null}
      {state.message ? <Alert>{state.message}</Alert> : null}

      <Field
        name="pin"
        label="New refund PIN"
        error={state.fieldErrors?.pin}
        hint="Exactly 6 digits. Four wrong attempts lock a terminal for five minutes."
      >
        <Input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          className="font-mono tracking-widest"
        />
      </Field>

      <Field name="confirm" label="Confirm PIN" error={state.fieldErrors?.confirm}>
        <Input
          name="confirm"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          className="font-mono tracking-widest"
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
