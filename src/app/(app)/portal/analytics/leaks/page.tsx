import { EmptyState } from "@/components/app/empty-state";
import { KpiCard } from "@/components/app/kpi-card";
import { ScopeSelector } from "@/components/app/scope-selector";
import { BarRow } from "@/components/charts/bar-row";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getLeaks } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatManilaDateTime } from "@/lib/format";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import type { StatusBucket } from "@/lib/api/types";
import { readScope, scopeQuery } from "../scope";

function ReasonTable({ bucket, noun }: { bucket: StatusBucket; noun: string }) {
  if (bucket.reasons.length === 0) {
    return (
      <EmptyState
        title={`No ${noun}`}
        body={`Nothing was ${noun} in this period.`}
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Reason</TH>
          <TH className="text-right">Count</TH>
          <TH className="text-right">Value</TH>
        </TR>
      </THead>
      <TBody>
        {bucket.reasons.map((reason) => (
          <TR key={reason.reason}>
            <TD className="text-charcoal">{reason.reason}</TD>
            <TD className="text-right tabular-nums">{reason.count}</TD>
            <TD className="text-right tabular-nums">
              {formatPesosOr(reason.valueC)}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export default async function LeaksPage({
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
    report = await getLeaks(scope);
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Order-level discounts"
          value={formatPesosOr(report.orderLevelDiscountC)}
          hint="Given on the whole order, not a line"
        />
        <KpiCard
          title="SC/PWD discounts"
          value={formatPesosOr(report.scPwd.discountC)}
          hint={`${report.scPwd.saleCount} sale${report.scPwd.saleCount === 1 ? "" : "s"} · ${formatPesosOr(report.scPwd.vatExemptSalesC)} VAT-exempt`}
        />
        <KpiCard
          title="Misc rings"
          value={formatPesosOr(report.miscLines.revenueC)}
          hint={`${formatPercentOr(report.miscLines.pctOfNetSales)} of net sales`}
        />
        <KpiCard
          title="Voids / refunds"
          value={`${report.voids.count} / ${report.refunds.count}`}
          hint={`${formatPesosOr(report.voids.valueC)} / ${formatPesosOr(report.refunds.valueC)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discounts by name</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {report.discountsByName.length === 0 ? (
            <EmptyState
              title="No named discounts used"
              body="Nothing on the discount list was applied in this period."
            />
          ) : (
            <>
              <BarRow
                title="Discount cost by name"
                rows={report.discountsByName.map((discount) => ({
                  label: discount.name,
                  value: discount.amountC,
                }))}
              />
              <Table>
                <THead>
                  <TR>
                    <TH>Discount</TH>
                    <TH>Kind</TH>
                    <TH className="text-right">Times used</TH>
                    <TH className="text-right">Amount</TH>
                  </TR>
                </THead>
                <TBody>
                  {report.discountsByName.map((discount) => (
                    <TR key={discount.discountId}>
                      <TD className="text-charcoal">{discount.name}</TD>
                      <TD className="text-steel">{discount.kind}</TD>
                      <TD className="text-right tabular-nums">
                        {discount.timesUsed}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {formatPesosOr(discount.amountC)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Voids by reason</CardTitle>
          </CardHeader>
          <CardBody>
            <ReasonTable bucket={report.voids} noun="voided" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refunds by reason</CardTitle>
          </CardHeader>
          <CardBody>
            <ReasonTable bucket={report.refunds} noun="refunded" />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drawer over / short</CardTitle>
        </CardHeader>
        <CardBody>
          {report.overShort.length === 0 ? (
            <EmptyState
              title="No shifts closed"
              body="Over/short appears once a shift has been counted and closed."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Branch</TH>
                  <TH>Closed</TH>
                  <TH className="text-right">Expected</TH>
                  <TH className="text-right">Counted</TH>
                  <TH className="text-right">Variance</TH>
                </TR>
              </THead>
              <TBody>
                {report.overShort.map((shift) => (
                  <TR key={shift.shiftId}>
                    <TD className="text-charcoal">{shift.branchName}</TD>
                    <TD className="text-steel">
                      {formatManilaDateTime(shift.closedAt)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(shift.expectedCashC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(shift.closingCashC)}
                    </TD>
                    <TD
                      className={
                        shift.varianceC !== null && shift.varianceC < 0
                          ? "text-right tabular-nums text-danger"
                          : "text-right tabular-nums"
                      }
                    >
                      {formatPesosOr(shift.varianceC)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "leaks" })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download CSV
      </a>
    </div>
  );
}
