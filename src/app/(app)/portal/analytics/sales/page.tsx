import { loadScope, loadAnalyticsChoices } from "../load-scope";
import { ScopeSelector } from "@/components/app/scope-selector";
import { BarRow } from "@/components/charts/bar-row";
import { CalendarHeatmap } from "@/components/charts/calendar-heatmap";
import { TrendLine } from "@/components/charts/trend-line";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSalesBreakdowns,
  getSalesHeatmap,
  getSalesPatterns,
  getSalesTrend,
} from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { scopeQuery } from "../scope";

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    granularity?: "day" | "week" | "month";
  }>;
}) {
  const params = await searchParams;
  const scope = await loadScope(params);
  const granularity =
    params.granularity === "week" || params.granularity === "month" ? params.granularity : "day";

  const { businesses, branches, role } = await loadAnalyticsChoices(scope.businessId);

  let heatmap;
  let trend;
  let patterns;
  let breakdowns;
  try {
    [heatmap, trend, patterns, breakdowns] = await Promise.all([
      getSalesHeatmap(scope),
      getSalesTrend(scope, granularity),
      getSalesPatterns(scope),
      getSalesBreakdowns(scope),
    ]);
  } catch (error) {
    if (error instanceof ValidationError) {
      return (
        <div className="space-y-6">
          <ScopeSelector businesses={businesses} branches={branches} scope={scope} role={role} />
          <Alert>{error.message}</Alert>
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <ScopeSelector businesses={businesses} branches={branches} scope={scope} role={role} />

      <Card>
        <CardHeader>
          <CardTitle>Which days feed us</CardTitle>
        </CardHeader>
        <CardBody>
          <CalendarHeatmap
            title="Sales per business day"
            dayHref={(date) =>
              `/portal/analytics/sales?${scopeQuery({ ...scope, from: date, to: date })}#breakdowns`
            }
            days={heatmap.map((day) => ({ date: day.date, value: day.salesC }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend</CardTitle>
          <nav aria-label="Trend interval" className="flex gap-4 text-sm">
            {(["day", "week", "month"] as const).map((value) => (
              <a
                key={value}
                href={`?${scopeQuery(scope, { granularity: value })}`}
                aria-current={granularity === value ? "true" : undefined}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </a>
            ))}
          </nav>
        </CardHeader>
        <CardBody>
          <TrendLine
            title="Net sales over time"
            points={trend.map((bucket) => ({
              label: bucket.bucket,
              value: bucket.salesC,
            }))}
          />
          {role === "owner" && trend.some((bucket) => bucket.grossProfitC === null) && (
            <p className="text-sm text-steel">
              Profit is unknown for periods without recorded costs; those periods are omitted.
            </p>
          )}
          {role === "owner" && <TrendLine
            title="Gross profit over time"
            points={trend
              .filter((bucket) => bucket.grossProfitC !== null)
              .map((bucket) => ({ label: bucket.bucket, value: bucket.grossProfitC! }))}
          />}
        </CardBody>
      </Card>

      <div id="breakdowns" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hour of day</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by hour"
              rows={patterns.hourOfDay.map((row) => ({
                label: HOUR_LABELS[row.hour],
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day of week</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by weekday"
              rows={patterns.dayOfWeek.map((row) => ({
                label: DAY_LABELS[row.dayOfWeek],
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by payment method"
              rows={breakdowns.byPaymentMethod.map((row) => ({
                label: row.method,
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order type</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by order type"
              rows={breakdowns.byOrderType.map((row) => ({
                label: row.orderType,
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by branch"
              rows={breakdowns.byBranch.map((row) => ({
                label: row.name,
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4">
        {["sales-trend", "sales-patterns", "sales-breakdowns"].map((report) => (
          <a
            key={report}
            className="text-sm text-brand-green-dark hover:underline"
            href={`/portal/analytics/export?${scopeQuery(scope, { report, granularity })}`}
          >
            Download {report.replace("sales-", "")} CSV
          </a>
        ))}
      </div>
      <a
        href={`/portal/analytics/export?${scopeQuery(scope, {
          report: "sales-heatmap",
        })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download daily sales CSV
      </a>
    </div>
  );
}
