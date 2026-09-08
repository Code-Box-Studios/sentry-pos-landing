import { EmptyState } from "@/components/app/empty-state";
import { ScopeSelector } from "@/components/app/scope-selector";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getTax } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import { readScope, scopeQuery } from "../scope";

/**
 * §6 Tax summary.
 *
 * A row per business, never a blended one: two businesses on different tax rates
 * have no shared rate, so the totals row sums the AMOUNTS and leaves the rate
 * column empty rather than averaging into a number that is true of neither.
 */
export default async function TaxPage({
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
    report = await getTax(scope);
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
          <CardTitle>
            VAT summary · {report.from} to {report.to}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {report.businesses.length === 0 ? (
            <EmptyState
              title="Nothing to report"
              body="No completed sales fall in this period."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Business</TH>
                  <TH className="text-right">Tax rate</TH>
                  <TH className="text-right">VATable sales</TH>
                  <TH className="text-right">VAT</TH>
                  <TH className="text-right">VAT-exempt sales</TH>
                  <TH className="text-right">SC/PWD discounts</TH>
                  <TH className="text-right">Service charge</TH>
                </TR>
              </THead>
              <TBody>
                {report.businesses.map((row) => (
                  <TR key={row.businessId}>
                    <TD className="text-charcoal">{row.name}</TD>
                    <TD className="text-right tabular-nums">
                      {formatPercentOr(row.taxRate)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.vatableSalesC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.vatC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.vatExemptSalesC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.scPwdDiscountC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.serviceChargeC)}
                    </TD>
                  </TR>
                ))}
                <TR>
                  <TD className="font-medium text-ink">Total</TD>
                  {/* No blended rate: the total row sums amounts only. */}
                  <TD className="text-right text-steel">—</TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.vatableSalesC)}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.vatC)}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.vatExemptSalesC)}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.scPwdDiscountC)}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.serviceChargeC)}
                  </TD>
                </TR>
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "tax" })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download CSV
      </a>
    </div>
  );
}
