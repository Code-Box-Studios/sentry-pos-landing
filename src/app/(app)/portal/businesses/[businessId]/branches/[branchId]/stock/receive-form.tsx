"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { TargetSelect } from "./target-select";
import type { StockOption } from "./stock-options";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Receiving…" : "Receive stock"}
    </Button>
  );
}

export function ReceiveForm({
  action,
  businessId,
  branchId,
  options,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  branchId: string;
  options: StockOption[];
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="branchId" value={branchId} />

      {state.done ? <Alert tone="info">Stock received.</Alert> : null}
      {state.message ? <Alert>{state.message}</Alert> : null}

      <TargetSelect id="receive-target" options={options} error={state.fieldErrors?.target} />

      <Field
        name="qty"
        label="Quantity received"
        error={state.fieldErrors?.qty}
        hint="At most 3 decimal places."
      >
        <Input name="qty" inputMode="decimal" />
      </Field>

      <Field
        name="unitCost"
        label="Unit cost"
        error={state.fieldErrors?.unitCost}
        hint="Optional. Overwrites the recorded cost when given."
      >
        <Input name="unitCost" inputMode="decimal" />
      </Field>

      <Field
        name="expiryDate"
        label="Expiry date"
        error={state.fieldErrors?.expiryDate}
        hint="Optional. Only for products that track expiry."
      >
        <Input name="expiryDate" type="date" />
      </Field>

      <SubmitButton />
    </form>
  );
}
