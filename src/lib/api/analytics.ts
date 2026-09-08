import "server-only";
import { apiFetch } from "./fetch";
import type {
  AnalyticsScope,
  BreakdownsReport,
  DashboardReport,
  HeatmapDay,
  OverviewReport,
  PatternsReport,
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
