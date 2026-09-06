"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { Branch } from "@/lib/api/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function BranchForm({
  action,
  businessId,
  branch,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  branch?: Branch;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const suffix = branch?.id ?? "new";

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      {branch ? <input type="hidden" name="id" value={branch.id} /> : null}
      {/* An existing branch still posts its code so the action's validation passes; the
          action deliberately does not send it on to the API. */}
      {branch ? <input type="hidden" name="code" value={branch.code} /> : null}

      {state.message ? (
        <div className="w-full">
          <Alert>{state.message}</Alert>
        </div>
      ) : null}

      <div className="min-w-40 flex-1">
        <Field name={`name-${suffix}`} label="Branch name" error={state.fieldErrors?.name}>
          <Input name="name" defaultValue={branch?.name} placeholder="Marikit" />
        </Field>
      </div>

      {branch ? (
        <div className="w-28">
          <p className="text-sm font-medium text-charcoal">Code</p>
          <p className="mt-3 font-mono text-sm text-steel">{branch.code}</p>
        </div>
      ) : (
        <div className="w-28">
          <Field name="code-new" label="Code" error={state.fieldErrors?.code} hint="Permanent.">
            <Input name="code" placeholder="MKT" className="font-mono uppercase" />
          </Field>
        </div>
      )}

      <div className="min-w-56 flex-1">
        <Field name={`address-${suffix}`} label="Address" error={state.fieldErrors?.address}>
          <Input name="address" defaultValue={branch?.address} />
        </Field>
      </div>

      <SubmitButton label={branch ? "Save" : "Add branch"} />
    </form>
  );
}
