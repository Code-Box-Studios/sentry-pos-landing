"use client";

import { Field } from "@/components/ui/field";
import type { Product } from "@/lib/api/types";

export interface StockOption {
  value: string;
  label: string;
}

/**
 * Only tracked products can hold stock, so untracked ones never appear.
 *
 * A product with variants offers only its variants: stock is held per variant, so receiving
 * against the parent of a variant product is not something the data model allows.
 */
export function toOptions(products: Product[]): StockOption[] {
  return products
    .filter((product) => product.trackStock)
    .flatMap((product) =>
      product.variants.length === 0
        ? [{ value: product.id, label: product.name }]
        : product.variants.map((variant) => ({
            value: `${product.id}:${variant.id}`,
            label: `${product.name} — ${variant.name}`,
          })),
    );
}

export function TargetSelect({
  id,
  options,
  error,
}: {
  id: string;
  options: StockOption[];
  error?: string;
}) {
  return (
    <Field name={id} label="Product" error={error}>
      <select
        name="target"
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Choose a product…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
