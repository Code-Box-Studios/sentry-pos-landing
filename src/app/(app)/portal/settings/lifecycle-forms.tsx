"use client";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE } from "@/lib/forms/form-state";
import { closeAccountAction, resetDemoAction } from "./lifecycle-actions";
export function CloseAccountForm() {
  const [state, action, pending] = useActionState(closeAccountAction, EMPTY_FORM_STATE);
  return (
    <section className="space-y-4 rounded-lg border border-destructive p-4">
      <h2 className="font-semibold">Export data and close account</h2>
      <p className="text-sm text-steel">
        Download and check your export before closing. Closure immediately ends access for you and
        all paired terminals. Account data is retained for 90 days before scheduled deletion.
      </p>
      <a
        href="/portal/settings/export"
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download account export (ZIP)
      </a>
      <form action={action} className="max-w-xl space-y-3">
        {state.message && <Alert>{state.message}</Alert>}
        <Field
          name="closure-confirmation"
          label="Type CLOSE MY ACCOUNT to confirm"
          error={state.fieldErrors?.confirmation}
        >
          <Input name="confirmation" required autoComplete="off" />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Closing account…" : "Close my account"}
        </Button>
      </form>
    </section>
  );
}
export function ResetDemoForm({
  businessId,
  requestId,
}: {
  businessId: string;
  requestId: string;
}) {
  const [state, action, pending] = useActionState(resetDemoAction, EMPTY_FORM_STATE);
  return (
    <section className="space-y-3 rounded-lg border border-hairline p-4">
      <h2 className="font-semibold">Reset demo business</h2>
      <p className="text-sm text-steel">
        Replace this demo with a fresh training business. Demo transactions and changes are removed,
        and its terminals must be paired again.
      </p>
      <form action={action} className="max-w-xl space-y-3">
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="id" value={requestId} />
        {state.message && <Alert>{state.message}</Alert>}
        <Field
          name="demo-confirmation"
          label="Type RESET DEMO to confirm"
          error={state.fieldErrors?.confirmation}
        >
          <Input name="confirmation" required autoComplete="off" />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Resetting…" : "Reset demo"}
        </Button>
      </form>
    </section>
  );
}
