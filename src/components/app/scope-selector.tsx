"use client";

import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  PRESET_LABELS,
  resolvePreset,
  todayInManila,
  type RangePreset,
} from "@/lib/analytics/range";
import type { AnalyticsScope, Branch, Business } from "@/lib/api/types";

/**
 * Scope lives in the URL, not in a store.
 *
 * Three reasons that matter here: a filtered view is linkable, back and forward
 * work with no code, and the Server Components can read it straight from
 * `searchParams` — a client store would drag data fetching into the browser and
 * break the BFF, since `apiFetch` is server-only.
 *
 * Presets resolve to literal dates before they reach the URL, matching the API,
 * which takes no presets of its own.
 */
export function ScopeSelector({
  businesses,
  branches,
  scope,
}: {
  businesses: Business[];
  branches: Branch[];
  scope: AnalyticsScope;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function go(next: AnalyticsScope): void {
    const query = new URLSearchParams({ from: next.from, to: next.to });
    if (next.businessId) query.set("businessId", next.businessId);
    if (next.branchId) query.set("branchId", next.branchId);
    router.push(`${pathname}?${query.toString()}`);
  }

  const visibleBranches = scope.businessId
    ? branches.filter((branch) => branch.businessId === scope.businessId)
    : [];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-40 flex-1 text-sm">
        <span className="mb-1 block text-steel">Business</span>
        <Select
          aria-label="Business"
          value={scope.businessId ?? ""}
          onChange={(event) =>
            go({
              ...scope,
              businessId: event.target.value || undefined,
              // A branch without a business is a 422 on the API, so clearing
              // the business must clear the branch with it.
              branchId: undefined,
            })
          }
        >
          <option value="">All businesses</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </Select>
      </label>

      {scope.businessId ? (
        <label className="min-w-40 flex-1 text-sm">
          <span className="mb-1 block text-steel">Branch</span>
          <Select
            aria-label="Branch"
            value={scope.branchId ?? ""}
            onChange={(event) =>
              go({ ...scope, branchId: event.target.value || undefined })
            }
          >
            <option value="">All branches</option>
            {visibleBranches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      <label className="min-w-40 text-sm">
        <span className="mb-1 block text-steel">Range</span>
        <Select
          aria-label="Range"
          defaultValue="custom"
          onChange={(event) =>
            go({
              ...scope,
              ...resolvePreset(
                event.target.value as RangePreset,
                todayInManila(),
              ),
            })
          }
        >
          {(Object.keys(PRESET_LABELS) as RangePreset[]).map((preset) => (
            <option key={preset} value={preset}>
              {PRESET_LABELS[preset]}
            </option>
          ))}
        </Select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-steel">From</span>
        <Input
          aria-label="From"
          type="date"
          value={scope.from}
          onChange={(event) => go({ ...scope, from: event.target.value })}
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-steel">To</span>
        <Input
          aria-label="To"
          type="date"
          value={scope.to}
          onChange={(event) => go({ ...scope, to: event.target.value })}
        />
      </label>
    </div>
  );
}
