"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { Business } from "@/lib/api/types";

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save settings"}
    </Button>
  );
}

/** The API stores a fraction; people think in percent. "0.1200" → "12". */
function toPercent(rate: string): string {
  const value = Number(rate) * 100;
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "0";
}

export function BusinessSettingsForm({
  action,
  business,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  business: Business;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="businessId" value={business.id} />

      {state.done ? <Alert tone="info">Settings saved.</Alert> : null}
      {state.message ? <Alert>{state.message}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Business</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Name" error={state.fieldErrors?.name}>
            <Input name="name" defaultValue={business.name} />
          </Field>

          <Field name="type" label="Type" error={state.fieldErrors?.type}>
            <select name="type" defaultValue={business.type} className={SELECT_CLASS}>
              <option value="retail">Retail</option>
              <option value="fnb">Food and drink</option>
              <option value="mixed">Mixed</option>
            </select>
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Money</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            name="taxRate"
            label="VAT rate (%)"
            error={state.fieldErrors?.taxRate}
            hint="Prices are VAT inclusive, so this is used to break the tax back out."
          >
            <Input name="taxRate" inputMode="decimal" defaultValue={toPercent(business.taxRate)} />
          </Field>

          <Field
            name="serviceChargeRate"
            label="Service charge (%)"
            error={state.fieldErrors?.serviceChargeRate}
            hint="Zero for most retail businesses."
          >
            <Input
              name="serviceChargeRate"
              inputMode="decimal"
              defaultValue={toPercent(business.serviceChargeRate)}
            />
          </Field>

          <div className="sm:col-span-2">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="allowMiscItems"
                defaultChecked={business.allowMiscItems}
                className="mt-1 size-4 rounded border-input accent-[var(--color-primary)]"
              />
              <span>
                <span className="block text-sm font-medium text-charcoal">
                  Allow miscellaneous items
                </span>
                <span className="block text-sm text-steel">
                  Lets a cashier ring up an ad-hoc item that is not in the catalog.
                </span>
              </span>
            </label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Day and stock</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            name="dayStartTime"
            label="Day starts at"
            error={state.fieldErrors?.dayStartTime}
            hint="24-hour HH:mm. A sale before this counts as the previous day."
          >
            <Input name="dayStartTime" defaultValue={business.dayStartTime} placeholder="06:00" />
          </Field>

          <Field
            name="expiryWarningDays"
            label="Expiry warning (days)"
            error={state.fieldErrors?.expiryWarningDays}
            hint="How far ahead an approaching expiry is flagged."
          >
            <Input
              name="expiryWarningDays"
              type="number"
              min={0}
              max={365}
              defaultValue={business.expiryWarningDays}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipt</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-steel">
            Receipts carry your branding only — never Sentry&apos;s.
          </p>

          <Field name="receiptHeader" label="Header" error={state.fieldErrors?.receiptHeader}>
            <Input name="receiptHeader" defaultValue={business.receiptHeader} />
          </Field>

          <Field name="receiptFooter" label="Footer" error={state.fieldErrors?.receiptFooter}>
            <Input name="receiptFooter" defaultValue={business.receiptFooter} />
          </Field>
        </CardBody>
      </Card>

      <SubmitButton />
    </form>
  );
}
