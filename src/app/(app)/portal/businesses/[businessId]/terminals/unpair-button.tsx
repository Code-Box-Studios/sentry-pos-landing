"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { Terminal } from "@/lib/api/types";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="destructive" disabled={disabled || pending}>
      {pending ? "Unpairing…" : "Unpair terminal"}
    </Button>
  );
}

/**
 * Unpairing is irreversible from the device's side — the terminal 401s on its next request
 * and someone has to physically re-pair it — so it takes a typed confirmation rather than a
 * single extra click.
 */
export function UnpairButton({
  action,
  businessId,
  terminal,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  terminal: Terminal;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState("");

  if (!terminal.paired) {
    return <span className="text-sm text-stone">Not paired</span>;
  }

  if (!armed) {
    return (
      <div className="space-y-2">
        {state.message ? <Alert>{state.message}</Alert> : null}
        <Button size="sm" variant="ghost" onClick={() => setArmed(true)}>
          Unpair
        </Button>
      </div>
    );
  }

  const inputId = `confirm-${terminal.id}`;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="id" value={terminal.id} />

      {state.message ? <Alert>{state.message}</Alert> : null}

      <p className="text-sm text-charcoal">
        This device stops working immediately and must be paired again in person. Type{" "}
        <span className="font-mono font-medium">{terminal.code}</span> to confirm.
      </p>

      <Label htmlFor={inputId}>Terminal code</Label>
      <Input
        id={inputId}
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        className="font-mono"
      />

      <div className="flex gap-2">
        <SubmitButton disabled={typed.trim().toUpperCase() !== terminal.code.toUpperCase()} />
        <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
