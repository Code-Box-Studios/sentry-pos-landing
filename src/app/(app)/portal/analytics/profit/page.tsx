import { EmptyState } from "@/components/app/empty-state";
import { ScopeSelector } from "@/components/app/scope-selector";
import { TrendLine } from "@/components/charts/trend-line";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getProfit } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import type { MarginFigures } from "@/lib/api/types";
import { readScope } from "../scope";

/** The four money columns every margin table shares. */
function MarginCells({ row }: { row: MarginFigures }) {
  return (
    <>
      <TD className="text-right tabular-nums">{formatPesosOr(row.revenueC)}</TD>
      <TD className="text-right tabular-nums">{formatPesosOr(row.costC)}</TD>
      <TD className="text-right tabular-nums">
        {formatPesosOr(row.grossProfitC)}
      </TD>
      <TD className="text-right tabular-nums">
        {formatPercentOr(row.marginPct)}
      </TD>
    </>
  );
}

const MARGIN_HEADS = (
  <>
    <TH className="text-right">Revenue</TH>
    <TH className="text-right">Cost</TH>
    <TH className="text-right">Gross profit</TH>
    <TH className="text-right">Margin</TH>
  </>
);

export default async function ProfitPage({
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
  const scope = readScope(params);
  const granularity = params.granularity ?? "day";

  const [businesses, branches] = await Promise.all([
    listBusinesses(),
    scope.businessId ? listBranches(scope.businessId) : Promise.resolve([]),
  ]);

  let report;
  try {
    report = await getProfit(scope, granularity);
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

      <Card>
        <CardHeader>
          <CardTitle>Gross profit over time</CardTitle>
        </CardHeader>
        <CardBody>
          <TrendLine
            title="Gross profit"
            // A bucket with no costed line reports null; a chart needs a number,
            // and 0 is the honest plot for "nothing knowable was earned". The
            // table below still shows the null as an em dash, so it is not hidden.
            points={report.overTime.map((bucket) => ({
              label: bucket.bucket,
              value: bucket.grossProfitC ?? 0,
            }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By product</CardTitle>
        </CardHeader>
        <CardBody>
          {report.byProduct.length === 0 ? (
            <EmptyState
              title="Nothing sold in this period"
              body="Widen the date range, or check that this branch was trading."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  {MARGIN_HEADS}
                </TR>
              </THead>
              <TBody>
                {report.byProduct.map((row) => (
                  <TR key={`${row.productId}:${row.variantId ?? ""}`}>
                    <TD className="text-charcoal">{row.name}</TD>
                    <MarginCells row={row} />
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By category</CardTitle>
        </CardHeader>
        <CardBody>
          {report.byCategory.length === 0 ? (
            <EmptyState
              title="No category sales"
              body="Nothing sold in this period."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Category</TH>
                  {MARGIN_HEADS}
                </TR>
              </THead>
              <TBody>
                {report.byCategory.map((row) => (
                  <TR key={row.categoryId}>
                    <TD className="text-charcoal">{row.name}</TD>
                    <MarginCells row={row} />
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <p className="text-sm text-steel">
        Profit covers {formatPesosOr(report.costedRevenueC)} of sales;{" "}
        {formatPesosOr(report.uncostedRevenueC)} has no cost recorded, so its
        margin is unknown rather than zero.
      </p>
    </div>
  );
}
