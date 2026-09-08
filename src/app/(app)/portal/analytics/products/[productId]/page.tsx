import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendLine } from "@/components/charts/trend-line";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getProductTrend } from "@/lib/api/analytics";
import { NotFoundError } from "@/lib/api/errors";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import { readScope, scopeQuery } from "../../scope";

/**
 * One product over time. Variants are MERGED here, deliberately: the top-sellers
 * list splits them because a variant is what sells, but this view answers "how is
 * this product doing", which is a different question.
 */
export default async function ProductTrendPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    granularity?: "day" | "week" | "month";
  }>;
}) {
  const { productId } = await params;
  const query = await searchParams;
  const scope = readScope(query);
  const granularity = query.granularity ?? "day";

  let report;
  try {
    report = await getProductTrend(productId, scope, granularity);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/portal/analytics/products?${scopeQuery(scope)}`}
        className="text-sm text-steel hover:underline"
      >
        ← Products
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
        </CardHeader>
        <CardBody>
          <TrendLine
            title="Revenue for this product"
            points={report.buckets.map((bucket) => ({
              label: bucket.bucket,
              value: bucket.revenueC,
            }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By {granularity}</CardTitle>
        </CardHeader>
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Period</TH>
                <TH className="text-right">Units</TH>
                <TH className="text-right">Revenue</TH>
                <TH className="text-right">Gross profit</TH>
                <TH className="text-right">Margin</TH>
              </TR>
            </THead>
            <TBody>
              {report.buckets.map((bucket) => (
                <TR key={bucket.bucket}>
                  <TD className="text-charcoal">{bucket.bucket}</TD>
                  <TD className="text-right tabular-nums">{bucket.units}</TD>
                  <TD className="text-right tabular-nums">
                    {formatPesosOr(bucket.revenueC)}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {formatPesosOr(bucket.grossProfitC)}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {formatPercentOr(bucket.marginPct)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
