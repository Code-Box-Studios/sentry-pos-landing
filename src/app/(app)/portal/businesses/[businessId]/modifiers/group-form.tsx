"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { centavosToPesos } from "@/lib/money";
import type { ModifierGroup } from "@/lib/api/types";

interface Row {
  key: string;
  id: string;
  name: string;
  delta: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function GroupForm({
  action,
  businessId,
  group,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  group?: ModifierGroup;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const suffix = group?.id ?? "new";
  const [rows, setRows] = useState<Row[]>(
    (group?.modifiers ?? []).map((m, i) => ({
      key: `existing-${m.id}-${i}`,
      id: m.id,
      name: m.name,
      delta: centavosToPesos(m.priceDeltaC),
    })),
  );
  const [nextKey, setNextKey] = useState(0);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      {group ? <input type="hidden" name="id" value={group.id} /> : null}

      {state.message ? <Alert>{state.message}</Alert> : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field name={`name-${suffix}`} label="Group name" error={state.fieldErrors?.name}>
            <Input name="name" defaultValue={group?.name} placeholder="Milk" />
          </Field>
        </div>
        <div className="w-24">
          <Field name={`minSelect-${suffix}`} label="Min" error={state.fieldErrors?.minSelect}>
            <Input name="minSelect" type="number" min={0} defaultValue={group?.minSelect ?? 0} />
          </Field>
        </div>
        <div className="w-24">
          <Field name={`maxSelect-${suffix}`} label="Max" error={state.fieldErrors?.maxSelect}>
            <Input name="maxSelect" type="number" min={0} defaultValue={group?.maxSelect ?? 1} />
          </Field>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.key} className="flex flex-wrap items-end gap-2 rounded-lg bg-surface p-3">
            <input type="hidden" name="modifierId" value={row.id} />
            <div className="min-w-40 flex-1">
              <Label htmlFor={`modifierName-${suffix}-${index}`}>Option</Label>
              <Input
                id={`modifierName-${suffix}-${index}`}
                name="modifierName"
                defaultValue={row.name}
                placeholder="Oat milk"
              />
            </div>
            <div className="w-32">
              <Label htmlFor={`modifierDelta-${suffix}-${index}`}>Price change</Label>
              <Input
                id={`modifierDelta-${suffix}-${index}`}
                name="modifierDelta"
                defaultValue={row.delta}
                inputMode="decimal"
                placeholder="15 or -10"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setRows([...rows, { key: `new-${nextKey}`, id: "", name: "", delta: "0.00" }]);
            setNextKey(nextKey + 1);
          }}
        >
          Add option
        </Button>
      </div>

      <SubmitButton label={group ? "Save group" : "Create group"} />
    </form>
  );
}
