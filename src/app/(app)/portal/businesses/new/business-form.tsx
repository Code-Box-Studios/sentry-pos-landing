"use client";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EMPTY_FORM_STATE } from "@/lib/forms/form-state";
import { createBusinessAction, deleteBusinessAction } from "./actions";
export function BusinessForm() {
  const [state, action, pending] = useActionState(createBusinessAction, EMPTY_FORM_STATE);
  return (
    <form action={action} className="max-w-xl space-y-4">
      {state.message && <Alert>{state.message}</Alert>}
      <Field name="name" label="Business name" error={state.fieldErrors?.name}>
        <Input name="name" required maxLength={120} />
      </Field>
      <Field name="type" label="Business type" error={state.fieldErrors?.type}>
        <Select name="type" defaultValue="retail">
          <option value="retail">Retail</option>
          <option value="fnb">Food and drink</option>
          <option value="mixed">Mixed</option>
        </Select>
      </Field>
      <Field name="taxRate" label="VAT rate (%)" error={state.fieldErrors?.taxRate}>
        <Input
          name="taxRate"
          type="number"
          min="0"
          max="99.99"
          step="0.01"
          defaultValue="0"
          required
        />
      </Field>
      <Field
        name="dayStartTime"
        label="Business day starts at"
        error={state.fieldErrors?.dayStartTime}
        hint="Philippine time. Sales before this time belong to the previous business day."
      >
        <Input name="dayStartTime" type="time" defaultValue="00:00" required />
      </Field>
      <p className="text-sm text-steel">
        Currency: Philippine peso (PHP). Next, set up your first branch.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create business"}
      </Button>
    </form>
  );
}
export function DeleteBusinessForm({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useActionState(deleteBusinessAction, EMPTY_FORM_STATE);
  return (
    <form action={action} className="max-w-xl space-y-4 rounded-lg border border-destructive p-4">
      <h2 className="font-semibold">Delete business</h2>
      <p className="text-sm text-steel">
        This removes {name} from your account and disables access to its terminals. Type the
        business name to confirm.
      </p>
      <input type="hidden" name="businessId" value={id} />
      {state.message && <Alert>{state.message}</Alert>}
      <Field
        name="confirmation"
        label="Confirm business name"
        error={state.fieldErrors?.confirmation}
      >
        <Input name="confirmation" required autoComplete="off" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Deleting…" : "Delete business"}
      </Button>
    </form>
  );
}
