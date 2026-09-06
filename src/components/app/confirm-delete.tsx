"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="destructive" disabled={pending}>
      {pending ? "Deleting…" : "Confirm delete"}
    </Button>
  );
}

/**
 * Two clicks to delete, with the record named in between. Deletion here is a soft delete on
 * the API side, but it removes the row from every terminal's catalog immediately, so it is
 * worth a beat of friction.
 */
export function ConfirmDelete({
  action,
  name,
  label = "Delete",
  hidden,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  name: string;
  label?: string;
  hidden: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <div className="space-y-2">
        {state.message ? <Alert>{state.message}</Alert> : null}
        <Button size="sm" variant="ghost" onClick={() => setArmed(true)}>
          {label}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      {Object.entries(hidden).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      {state.message ? <Alert>{state.message}</Alert> : null}
      <p className="text-sm text-charcoal">
        Delete <span className="font-medium">{name}</span>?
      </p>
      <div className="flex gap-2">
        <SubmitButton />
        <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
