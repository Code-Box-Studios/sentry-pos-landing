"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { centavosToPesos } from "@/lib/money";
import type { Discount } from "@/lib/api/types";

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function DiscountForm({
  action,
  businessId,
  discount,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  discount?: Discount;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [kind, setKind] = useState<"percent" | "fixed">(discount?.kind ?? "percent");
  const suffix = discount?.id ?? "new";

  // A percentage is a bare number; a fixed amount is centavos and shows as pesos.
  const defaultValue =
    discount === undefined
      ? ""
      : discount.kind === "percent"
        ? String(discount.value)
        : centavosToPesos(discount.value);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      {discount ? <input type="hidden" name="id" value={discount.id} /> : null}

      {state.message ? (
        <div className="w-full">
          <Alert>{state.message}</Alert>
        </div>
      ) : null}

      <div className="min-w-40 flex-1">
        <Field name={`name-${suffix}`} label="Name" error={state.fieldErrors?.name}>
          <Input name="name" defaultValue={discount?.name} placeholder="Staff discount" />
        </Field>
      </div>

      <div className="w-36">
        <Field name={`kind-${suffix}`} label="Type">
          <select
            name="kind"
            defaultValue={kind}
            onChange={(event) => setKind(event.target.value === "fixed" ? "fixed" : "percent")}
            className={SELECT_CLASS}
          >
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </Field>
      </div>

      <div className="w-32">
        <Field
          name={`value-${suffix}`}
          label={kind === "percent" ? "Percent" : "Amount"}
          error={state.fieldErrors?.value}
        >
          <Input
            name="value"
            inputMode="decimal"
            defaultValue={defaultValue}
            placeholder={kind === "percent" ? "10" : "50.00"}
          />
        </Field>
      </div>

      <div className="w-36">
        <Field name={`appliesTo-${suffix}`} label="Applies to">
          <select
            name="appliesTo"
            defaultValue={discount?.appliesTo ?? "line"}
            className={SELECT_CLASS}
          >
            <option value="line">A line</option>
            <option value="order">Whole order</option>
            <option value="both">Either</option>
          </select>
        </Field>
      </div>

      <label className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={discount?.active ?? true}
          className="size-4 rounded border-input accent-[var(--color-primary)]"
        />
        <span className="text-sm text-charcoal">Active</span>
      </label>

      <SubmitButton label={discount ? "Save" : "Add discount"} />
    </form>
  );
}
