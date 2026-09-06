"use client";

import { Field } from "@/components/ui/field";
import type { StockOption } from "./stock-options";

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
