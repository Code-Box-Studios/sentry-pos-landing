import "server-only";
import { apiFetch } from "./fetch";
import type {
  AnalyticsScope,
  BreakdownsReport,
  DashboardReport,
  HeatmapDay,
  LeaksReport,
  Movement,
  OnHandReport,
  OverviewReport,
  Paginated,
  PatternsReport,
  ProductTrendReport,
  ProfitReport,
  ShrinkageReport,
  SlowProductsReport,
  TaxReport,
  TopProductsReport,
  TrendBucket,
} from "./types";

/**
 * The analytics endpoints (analytics-spec §0–§6), behind `PortalAuthGuard`.
 *
 * Scope is the server's job: the guard pins every query to the signed-in owner,
 * so a `businessId` that is not theirs is a 404, never a leak. That is also why
 * these take a plain scope object — there is nothing to validate here that the
 * API does not validate better.
 *
 * `heatmap` and `trend` return BARE ARRAYS, not wrapped objects. The others
 * return a single report object.
 */

function scopeQuery(scope: AnalyticsScope): Record<string, string | undefined> {
  return {
    from: scope.from,
    to: scope.to,
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

/** §0. Takes no scope: it spans every non-demo business by design. */
export function getDashboard(): Promise<DashboardReport> {
  return apiFetch<DashboardReport>("/portal/dashboard");
}

export function getOverview(scope: AnalyticsScope): Promise<OverviewReport> {
  return apiFetch<OverviewReport>("/portal/analytics/overview", {
    query: scopeQuery(scope),
  });
}

export function getSalesHeatmap(scope: AnalyticsScope): Promise<HeatmapDay[]> {
  return apiFetch<HeatmapDay[]>("/portal/analytics/sales/heatmap", {
    query: scopeQuery(scope),
  });
}

export function getSalesTrend(
  scope: AnalyticsScope,
  granularity: "day" | "week" | "month" = "day",
): Promise<TrendBucket[]> {
  return apiFetch<TrendBucket[]>("/portal/analytics/sales/trend", {
    query: { ...scopeQuery(scope), granularity },
  });
}

export function getSalesPatterns(
  scope: AnalyticsScope,
): Promise<PatternsReport> {
  return apiFetch<PatternsReport>("/portal/analytics/sales/patterns", {
    query: scopeQuery(scope),
  });
}

export function getSalesBreakdowns(
  scope: AnalyticsScope,
): Promise<BreakdownsReport> {
  return apiFetch<BreakdownsReport>("/portal/analytics/sales/breakdowns", {
    query: scopeQuery(scope),
  });
}

export function getTopProducts(
  scope: AnalyticsScope,
  options: { by?: "units" | "revenue"; limit?: number } = {},
): Promise<TopProductsReport> {
  return apiFetch<TopProductsReport>("/portal/analytics/products/top", {
    query: { ...scopeQuery(scope), by: options.by, limit: options.limit },
  });
}

export function getSlowProducts(
  scope: AnalyticsScope,
  options: { limit?: number } = {},
): Promise<SlowProductsReport> {
  return apiFetch<SlowProductsReport>("/portal/analytics/products/slow", {
    query: { ...scopeQuery(scope), limit: options.limit },
  });
}

export function getProductTrend(
  productId: string,
  scope: AnalyticsScope,
  granularity: "day" | "week" | "month" = "day",
): Promise<ProductTrendReport> {
  return apiFetch<ProductTrendReport>(
    `/portal/analytics/products/${productId}/trend`,
    { query: { ...scopeQuery(scope), granularity } },
  );
}

export function getProfit(
  scope: AnalyticsScope,
  granularity: "day" | "week" | "month" = "day",
): Promise<ProfitReport> {
  return apiFetch<ProfitReport>("/portal/analytics/profit", {
    query: { ...scopeQuery(scope), granularity },
  });
}

export function getLeaks(scope: AnalyticsScope): Promise<LeaksReport> {
  return apiFetch<LeaksReport>("/portal/analytics/leaks", {
    query: scopeQuery(scope),
  });
}

/**
 * The ledger is PAGINATED, and the API refuses `page × pageSize > 2000` with a
 * 422 asking for a narrower scope — reports merge per business in memory, so the
 * depth is deliberately bounded.
 */
export function getInventoryMovements(
  scope: AnalyticsScope,
  options: {
    type?: string;
    productId?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<Paginated<Movement>> {
  return apiFetch<Paginated<Movement>>(
    "/portal/analytics/inventory/movements",
    {
      query: {
        ...scopeQuery(scope),
        type: options.type,
        productId: options.productId,
        page: options.page,
        pageSize: options.pageSize,
      },
    },
  );
}

export function getShrinkage(scope: AnalyticsScope): Promise<ShrinkageReport> {
  return apiFetch<ShrinkageReport>("/portal/analytics/inventory/shrinkage", {
    query: scopeQuery(scope),
  });
}

export function getOnHand(scope: AnalyticsScope): Promise<OnHandReport> {
  return apiFetch<OnHandReport>("/portal/analytics/inventory/on-hand", {
    query: scopeQuery(scope),
  });
}

export function getTax(scope: AnalyticsScope): Promise<TaxReport> {
  return apiFetch<TaxReport>("/portal/analytics/tax", {
    query: scopeQuery(scope),
  });
}
