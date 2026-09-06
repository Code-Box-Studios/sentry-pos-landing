"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centavosToPesos } from "@/lib/money";
import type { Variant } from "@/lib/api/types";

interface Row {
  key: string;
  id: string;
  name: string;
  price: string;
  sku: string;
  barcode: string;
}

function toRow(variant: Variant, index: number): Row {
  return {
    key: `existing-${variant.id}-${index}`,
    id: variant.id,
    name: variant.name,
    price: centavosToPesos(variant.priceC),
    sku: variant.sku ?? "",
    barcode: variant.barcode ?? "",
  };
}

/**
 * Variants post as parallel arrays, which the Server Action zips back together. Removing a
 * row simply stops rendering it: the API treats an absent variant as deleted, so there is no
 * separate delete call to make.
 */
export function VariantRows({ initial }: { initial: Variant[] }) {
  const [rows, setRows] = useState<Row[]>(initial.map(toRow));
  const [nextKey, setNextKey] = useState(0);

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-sm text-steel">
          No variants. The product sells at its own price. Add variants for sizes or flavours
          that cost different amounts.
        </p>
      ) : null}

      {rows.map((row, index) => (
        <div key={row.key} className="flex flex-wrap items-end gap-2 rounded-lg bg-surface p-3">
          <input type="hidden" name="variantId" value={row.id} />

          <div className="min-w-40 flex-1">
            <Label htmlFor={`variantName-${index}`}>Variant</Label>
            <Input
              id={`variantName-${index}`}
              name="variantName"
              defaultValue={row.name}
              placeholder="Large"
            />
          </div>

          <div className="w-28">
            <Label htmlFor={`variantPrice-${index}`}>Variant price</Label>
            <Input
              id={`variantPrice-${index}`}
              name="variantPrice"
              defaultValue={row.price}
              inputMode="decimal"
            />
          </div>

          <div className="w-32">
            <Label htmlFor={`variantSku-${index}`}>Variant SKU</Label>
            <Input id={`variantSku-${index}`} name="variantSku" defaultValue={row.sku} />
          </div>

          <div className="w-36">
            <Label htmlFor={`variantBarcode-${index}`}>Variant barcode</Label>
            <Input
              id={`variantBarcode-${index}`}
              name="variantBarcode"
              defaultValue={row.barcode}
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
          setRows([
            ...rows,
            { key: `new-${nextKey}`, id: "", name: "", price: "", sku: "", barcode: "" },
          ]);
          setNextKey(nextKey + 1);
        }}
      >
        Add variant
      </Button>
    </div>
  );
}
