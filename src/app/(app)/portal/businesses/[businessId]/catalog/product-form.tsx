"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { centavosToPesos } from "@/lib/money";
import type { Category, Product } from "@/lib/api/types";
import { VariantRows } from "./variant-rows";

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 rounded border-input accent-[var(--color-primary)]"
      />
      <span>
        <span className="block text-sm font-medium text-charcoal">{label}</span>
        <span className="block text-sm text-steel">{hint}</span>
      </span>
    </label>
  );
}

export function ProductForm({
  action,
  businessId,
  categories,
  product,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  categories: Category[];
  product?: Product;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="businessId" value={businessId} />
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {state.message ? <Alert>{state.message}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field name="name" label="Name" error={state.fieldErrors?.name}>
              <Input name="name" defaultValue={product?.name} autoFocus />
            </Field>
          </div>

          <Field name="categoryId" label="Category" error={state.fieldErrors?.categoryId}>
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? categories[0]?.id ?? ""}
              className={SELECT_CLASS}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field name="soldBy" label="Sold by">
            <select name="soldBy" defaultValue={product?.soldBy ?? "unit"} className={SELECT_CLASS}>
              <option value="unit">Each</option>
              <option value="weight">Weight</option>
            </select>
          </Field>

          <Field
            name="price"
            label="Price"
            error={state.fieldErrors?.priceC}
            hint="In pesos, VAT inclusive."
          >
            <Input
              name="price"
              inputMode="decimal"
              defaultValue={product ? centavosToPesos(product.priceC) : ""}
            />
          </Field>

          <Field name="cost" label="Cost" error={state.fieldErrors?.costC} hint="Optional.">
            <Input
              name="cost"
              inputMode="decimal"
              defaultValue={product?.costC != null ? centavosToPesos(product.costC) : ""}
            />
          </Field>

          <Field name="sku" label="SKU" error={state.fieldErrors?.sku} hint="Optional; unique.">
            <Input name="sku" defaultValue={product?.sku ?? ""} />
          </Field>

          <Field
            name="barcode"
            label="Barcode"
            error={state.fieldErrors?.barcode}
            hint="Optional; unique. Scanned at the counter."
          >
            <Input name="barcode" defaultValue={product?.barcode ?? ""} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behaviour</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Toggle
            name="active"
            label="Active"
            hint="Inactive products stay in reports but disappear from the terminal."
            defaultChecked={product?.active ?? true}
          />
          <Toggle
            name="trackStock"
            label="Track stock"
            hint="Counts quantity per branch and blocks a sale that would go negative."
            defaultChecked={product?.trackStock ?? false}
          />
          <Toggle
            name="trackExpiry"
            label="Track expiry"
            hint="Records an expiry date when stock is received."
            defaultChecked={product?.trackExpiry ?? false}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardBody>
          <VariantRows initial={product?.variants ?? []} />
        </CardBody>
      </Card>

      <SubmitButton label={product ? "Save product" : "Create product"} />
    </form>
  );
}
