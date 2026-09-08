import { addDays, todayInManila } from "@/lib/analytics/range";
import type { AnalyticsScope } from "@/lib/api/types";

/**
 * The scope a tab is being asked about, read from the URL.
 *
 * Its own module rather than the layout's, because Server Components import it:
 * a plain function exported from a `"use client"` module type-checks, builds
 * clean and then throws at render, and this repo has already been bitten by
 * that once.
 *
 * Defaults to the last 7 days ending today in Manila, so a bare
 * `/portal/analytics/overview` is a working page rather than a validation error.
 */
export function readScope(params: {
  businessId?: string;
  branchId?: string;
  from?: string;
  to?: string;
}): AnalyticsScope {
  const today = todayInManila();

  return {
    businessId: params.businessId,
    // The API rejects a branch without a business; never send that pair.
    branchId: params.businessId ? params.branchId : undefined,
    from: params.from ?? addDays(today, -6),
    to: params.to ?? today,
  };
}

/** The query string that carries a scope to another tab or to the CSV proxy. */
export function scopeQuery(
  scope: AnalyticsScope,
  extra: Record<string, string> = {},
): string {
  const query = new URLSearchParams({
    from: scope.from,
    to: scope.to,
    ...extra,
  });
  if (scope.businessId) query.set("businessId", scope.businessId);
  if (scope.branchId) query.set("branchId", scope.branchId);
  return query.toString();
}

export const ANALYTICS_TABS = [
  { href: "/portal/analytics/overview", label: "Overview" },
  { href: "/portal/analytics/sales", label: "Sales" },
  { href: "/portal/analytics/products", label: "Products" },
  { href: "/portal/analytics/profit", label: "Profit" },
  { href: "/portal/analytics/leaks", label: "Leaks" },
  { href: "/portal/analytics/inventory", label: "Inventory" },
  { href: "/portal/analytics/tax", label: "Tax" },
];
