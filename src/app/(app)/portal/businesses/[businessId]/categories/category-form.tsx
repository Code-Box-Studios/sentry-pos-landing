"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { Category } from "@/lib/api/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * One form for both create and edit — `category` present means edit.
 *
 * The Field names carry the row id because several of these render on one page, and
 * duplicate ids would make every label point at the first input.
 */
export function CategoryForm({
  action,
  businessId,
  category,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  category?: Category;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const suffix = category?.id ?? "new";

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      {state.message ? (
        <div className="w-full">
          <Alert>{state.message}</Alert>
        </div>
      ) : null}

      <div className="min-w-48 flex-1">
        <Field name={`name-${suffix}`} label="Name" error={state.fieldErrors?.name}>
          <Input name="name" defaultValue={category?.name} />
        </Field>
      </div>

      <div className="w-28">
        <Field name={`sortOrder-${suffix}`} label="Order" error={state.fieldErrors?.sortOrder}>
          <Input name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0} />
        </Field>
      </div>

      <SubmitButton label={category ? "Save" : "Add category"} />
    </form>
  );
}
