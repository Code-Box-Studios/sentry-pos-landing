"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Filters live in the URL rather than in component state: a filtered catalog is then a
 * link you can send to someone, and it survives a reload and the back button.
 */
export function ProductFilters({
  categories,
  q = "",
  categoryId = "",
}: {
  categories: { id: string; name: string }[];
  q?: string;
  categoryId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const params = new URLSearchParams();
        for (const key of ["q", "categoryId"]) {
          const value = String(data.get(key) ?? "").trim();
          if (value) params.set(key, value);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
      }}
    >
      <div className="min-w-48 flex-1">
        <Field name="q" label="Search">
          <Input name="q" defaultValue={q} placeholder="Name, SKU or barcode" />
        </Field>
      </div>

      <div className="min-w-40">
        <Field name="categoryId" label="Category">
          <select
            name="categoryId"
            defaultValue={categoryId}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Button type="submit" variant="secondary">
        Apply
      </Button>
    </form>
  );
}
