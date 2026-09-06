"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { formatPesos } from "@/lib/money";
import type { ModifierGroup } from "@/lib/api/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save modifiers"}
    </Button>
  );
}

/**
 * A checkbox per group. Unchecked boxes post nothing, so the submitted list is exactly the
 * desired set — which is what the PUT endpoint wants. Clearing every box clears every link.
 */
export function ModifierLinks({
  action,
  businessId,
  productId,
  groups,
  linked,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  productId: string;
  groups: ModifierGroup[];
  linked: string[];
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const checked = new Set(linked);

  if (groups.length === 0) {
    return <p className="text-sm text-steel">This business has no modifier groups yet.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="productId" value={productId} />

      {state.message ? <Alert>{state.message}</Alert> : null}
      {state.done ? <Alert tone="info">Modifiers saved.</Alert> : null}

      {groups.map((group) => (
        <label key={group.id} className="flex items-start gap-3">
          <input
            type="checkbox"
            name="groupId"
            value={group.id}
            defaultChecked={checked.has(group.id)}
            className="mt-1 size-4 rounded border-input accent-[var(--color-primary)]"
          />
          <span>
            <span className="block text-sm font-medium text-charcoal">{group.name}</span>
            <span className="block text-sm text-steel">
              {group.modifiers.length === 0
                ? "No options yet"
                : group.modifiers.map((m) => `${m.name} ${formatPesos(m.priceDeltaC)}`).join(" · ")}
            </span>
          </span>
        </label>
      ))}

      <SubmitButton />
    </form>
  );
}
