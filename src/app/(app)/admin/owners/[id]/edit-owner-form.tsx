"use client";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE } from "@/lib/forms/form-state";
import type { Owner } from "@/lib/api/types";
import { updateOwnerAction } from "./actions";
export function EditOwnerForm({ owner }: { owner: Owner }) {
  const [state, action, pending] = useActionState(updateOwnerAction, EMPTY_FORM_STATE);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="ownerId" value={owner.id} />
      {state.message && <Alert>{state.message}</Alert>}
      {state.done && <Alert tone="info">Account updated.</Alert>}
      <Field name="name" label="Owner name" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={owner.name} required />
      </Field>
      <Field name="maxBusinesses" label="Business limit" error={state.fieldErrors?.maxBusinesses}>
        <Input
          name="maxBusinesses"
          type="number"
          min="1"
          max="1000"
          step="1"
          defaultValue={owner.maxBusinesses}
          required
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save account"}
      </Button>
    </form>
  );
}
