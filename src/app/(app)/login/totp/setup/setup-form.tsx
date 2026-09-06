"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE } from "@/lib/forms/form-state";
import type { TotpEnableState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Confirming…" : "Confirm and continue"}
    </Button>
  );
}

export function SetupForm({
  action,
}: {
  action: (state: TotpEnableState, formData: FormData) => Promise<TotpEnableState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE as TotpEnableState);

  if (state.done && state.recoveryCodes) {
    return (
      <div className="space-y-4">
        <Alert tone="warn">
          These recovery codes are shown once and cannot be retrieved again. Save them somewhere
          safe — each one signs you in if you lose your authenticator.
        </Alert>
        <ul className="grid grid-cols-2 gap-2 rounded-lg border border-hairline bg-surface p-4 font-mono text-sm">
          {state.recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <Button
          className="w-full"
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          I have saved these — sign in
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? <Alert>{state.message}</Alert> : null}
      <Field
        name="code"
        label="Six-digit code"
        error={state.fieldErrors?.code}
        hint="From the app you just scanned the code with."
      >
        <Input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          className="font-mono tracking-widest"
        />
      </Field>
      <SubmitButton />
    </form>
  );
}
