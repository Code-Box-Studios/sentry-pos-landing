import type { Product } from "@/lib/api/types";

/**
 * Deliberately NOT in `target-select.tsx`: that file is `"use client"`, and a Server
 * Component may not call a function exported from a client module — Next throws
 * "Attempted to call toOptions() from the server". The page computes the options during its
 * own render, so the pure part lives here and the component imports the type back.
 */
export interface StockOption {
  value: string;
  label: string;
}

/**
 * Only tracked products can hold stock, so untracked ones never appear.
 *
 * A product with variants offers only its variants: stock is held per variant, and the API
 * rejects a receive or adjustment aimed at the parent with
 * `variantId is required for a product with variants`.
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
