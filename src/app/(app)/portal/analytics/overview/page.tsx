import { KpiCard } from "@/components/app/kpi-card";
import { ScopeSelector } from "@/components/app/scope-selector";
import { Alert } from "@/components/ui/alert";
import { getOverview } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatPercentOr, formatPesosOr, formatPointsOr } from "@/lib/money";
import type { Kpi, NullableKpi } from "@/lib/api/types";
import { readScope, scopeQuery } from "../scope";

/** "was ₱X · +12.0%" — the comparison in words, so no arrow needs decoding. */
function moneyHint(kpi: Kpi | NullableKpi): string {
  return `was ${formatPesosOr(kpi.previous)} · ${formatPercentOr(kpi.changePct)}`;
}

function countHint(kpi: Kpi): string {
  return `was ${kpi.previous} · ${formatPercentOr(kpi.changePct)}`;
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const scope = readScope(await searchParams);
  const [businesses, branches] = await Promise.all([
    listBusinesses(),
    scope.businessId ? listBranches(scope.businessId) : Promise.resolve([]),
  ]);

  let report;
  try {
    report = await getOverview(scope);
  } catch (error) {
    if (error instanceof ValidationError) {
      return (
        <div className="space-y-6">
          <ScopeSelector
            businesses={businesses}
            branches={branches}
            scope={scope}
          />
          <Alert>{error.message}</Alert>
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <ScopeSelector
        businesses={businesses}
        branches={branches}
        scope={scope}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Gross sales"
          value={formatPesosOr(report.grossSalesC.value)}
          hint={moneyHint(report.grossSalesC)}
        />
        <KpiCard
          title="Discounts given"
          value={formatPesosOr(report.discountsC.value)}
          hint={moneyHint(report.discountsC)}
        />
        <KpiCard
          title="Net sales"
          value={formatPesosOr(report.netSalesC.value)}
          hint={moneyHint(report.netSalesC)}
        />
        <KpiCard
          title="Gross profit"
          value={formatPesosOr(report.grossProfitC.value)}
          hint={moneyHint(report.grossProfitC)}
        />
        <KpiCard
          title="Margin"
          value={formatPercentOr(report.marginPct.value)}
          // A margin is already a ratio, so its comparison is in POINTS.
          hint={`was ${formatPercentOr(report.marginPct.previous)} · ${formatPointsOr(
            report.marginPct.changePoints,
          )}`}
        />
        <KpiCard
          title="Transactions"
          value={String(report.transactions.value)}
          hint={countHint(report.transactions)}
        />
        <KpiCard
          title="Average basket"
          value={formatPesosOr(report.averageBasketC.value)}
          hint={moneyHint(report.averageBasketC)}
        />
        <KpiCard
          title="Service charge"
          value={formatPesosOr(report.serviceChargeC.value)}
          hint={moneyHint(report.serviceChargeC)}
        />
        <KpiCard
          title="Voids / refunds"
          value={`${report.voidCount.value} / ${report.refundCount.value}`}
          hint={`was ${report.voidCount.previous} / ${report.refundCount.previous}`}
        />
      </div>

      <p className="text-sm text-steel">
        Profit covers {formatPesosOr(report.costedRevenueC)} of sales;{" "}
        {formatPesosOr(report.uncostedRevenueC)} has no cost recorded, so its
        margin is unknown.
      </p>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "overview" })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download CSV
      </a>
    </div>
  );
}
