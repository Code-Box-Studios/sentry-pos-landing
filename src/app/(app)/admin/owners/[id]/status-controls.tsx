"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { OwnerStatus } from "@/lib/api/types";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton({
  label,
  variant,
}: {
  label: string;
  variant?: "primary" | "destructive" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? "Working…" : label}
    </Button>
  );
}

/**
 * Suspension is destructive to a live business, so it is two steps rather than one click:
 * the tier has to be chosen deliberately and then confirmed. Reinstatement is one click —
 * it only ever restores access.
 */
export function StatusControls({
  ownerId,
  status,
  suspendAction,
  reinstateAction,
}: {
  ownerId: string;
  status: OwnerStatus;
  suspendAction: Action;
  reinstateAction: Action;
}) {
  const [suspendState, suspend] = useActionState(suspendAction, EMPTY_FORM_STATE);
  const [reinstateState, reinstate] = useActionState(reinstateAction, EMPTY_FORM_STATE);
  const [tier, setTier] = useState<"default" | "hard" | null>(null);

  const suspended = status === "suspended" || status === "hard_suspended";
  const message = suspendState.message ?? reinstateState.message;

  return (
    <div className="space-y-3">
      {message ? <Alert>{message}</Alert> : null}

      {suspended ? (
        <form action={reinstate}>
          <input type="hidden" name="ownerId" value={ownerId} />
          <p className="mb-3 text-sm text-steel">
            This account is suspended. Reinstating restores portal and terminal access
            immediately.
          </p>
          <SubmitButton label="Reinstate account" />
        </form>
      ) : tier === null ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setTier("default")}>
            Suspend
          </Button>
          <Button variant="destructive" onClick={() => setTier("hard")}>
            Hard suspend
          </Button>
        </div>
      ) : (
        <form action={suspend} className="space-y-3">
          <input type="hidden" name="ownerId" value={ownerId} />
          <input type="hidden" name="tier" value={tier} />
          <Alert tone="warn">
            {tier === "hard"
              ? "A hard suspension stops every terminal immediately, mid-shift included."
              : "The portal locks straight away. An open shift may keep selling for up to 24 hours."}
          </Alert>
          <div className="flex gap-2">
            <SubmitButton
              label={tier === "hard" ? "Confirm hard suspension" : "Confirm suspension"}
              variant="destructive"
            />
            <Button variant="ghost" onClick={() => setTier(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
