"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The actor filter offers only Owner and Terminal. `platform_admin` is not an accepted value
 * on this endpoint, and platform rows are excluded from a tenant's log by the API's scoping
 * regardless — a business owner never sees Sentry staff activity.
 */
export function ActivityFilters({
  branches,
  actorType = "",
  action = "",
  branchId = "",
}: {
  branches: { id: string; name: string }[];
  actorType?: string;
  action?: string;
  branchId?: string;
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
        for (const key of ["actorType", "action", "branchId"]) {
          const value = String(data.get(key) ?? "").trim();
          if (value) params.set(key, value);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
      }}
    >
      <div className="w-40">
        <Field name="actorType" label="Actor">
          <select name="actorType" defaultValue={actorType} className={SELECT_CLASS}>
            <option value="">Anyone</option>
            <option value="owner">Owner</option>
            <option value="terminal">Terminal</option>
          </select>
        </Field>
      </div>

      <div className="w-48">
        <Field name="branchId" label="Branch">
          <select name="branchId" defaultValue={branchId} className={SELECT_CLASS}>
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="min-w-48 flex-1">
        <Field name="action" label="Action">
          <Input name="action" defaultValue={action} placeholder="portal.product.create" />
        </Field>
      </div>

      <Button type="submit" variant="secondary">
        Apply
      </Button>
    </form>
  );
}
