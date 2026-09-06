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

const REASONS = [
  { value: "damage", label: "Damage" },
  { value: "expiry", label: "Expired" },
  { value: "theft_loss", label: "Theft or loss" },
  { value: "count_correction", label: "Count correction" },
  { value: "other", label: "Other" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="secondary" disabled={pending}>
      {pending ? "Adjusting…" : "Record adjustment"}
    </Button>
  );
}

export function AdjustForm({
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

      {state.done ? <Alert tone="info">Adjustment recorded.</Alert> : null}
      {state.message ? <Alert>{state.message}</Alert> : null}

      <TargetSelect id="adjust-target" options={options} error={state.fieldErrors?.target} />

      <Field
        name="newQty"
        label="New count"
        error={state.fieldErrors?.newQty}
        hint="The corrected total on the shelf — not the difference."
      >
        <Input name="newQty" inputMode="decimal" />
      </Field>

      <Field name="reasonCategory" label="Reason" error={state.fieldErrors?.reasonCategory}>
        <select
          name="reasonCategory"
          defaultValue="count_correction"
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {REASONS.map((reason) => (
            <option key={reason.value} value={reason.value}>
              {reason.label}
            </option>
          ))}
        </select>
      </Field>

      <Field name="note" label="Note" error={state.fieldErrors?.note} hint="Optional.">
        <Input name="note" />
      </Field>

      <SubmitButton />
    </form>
  );
}
