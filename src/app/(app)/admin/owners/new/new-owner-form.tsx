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
      {pending ? "Creating…" : "Create owner and send invite"}
    </Button>
  );
}

export function NewOwnerForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="max-w-md space-y-4" noValidate>
      {state.message ? <Alert>{state.message}</Alert> : null}

      <Field
        name="name"
        label="Business owner name"
        error={state.fieldErrors?.name}
        hint="How the account is identified in the platform panel."
      >
        <Input name="name" autoFocus />
      </Field>

      <Field
        name="email"
        label="Email address"
        error={state.fieldErrors?.email}
        hint="The invitation is sent here. It expires in seven days."
      >
        <Input name="email" type="email" />
      </Field>

      <Field
        name="maxBusinesses"
        label="Business limit"
        error={state.fieldErrors?.maxBusinesses}
        hint="How many businesses this owner may create. Demo businesses do not count."
      >
        <Input name="maxBusinesses" type="number" min={1} max={1000} defaultValue={1} />
      </Field>

      <SubmitButton />
    </form>
  );
}
