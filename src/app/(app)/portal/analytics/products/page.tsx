import { loadScope, loadAnalyticsChoices } from "../load-scope";
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { ScopeSelector } from "@/components/app/scope-selector";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getSlowProducts, getTopProducts } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import type { SoldRow } from "@/lib/api/types";
import { scopeQuery } from "../scope";

/**
 * Misc (open-price) lines are excluded by the API, so these figures do not sum
 * to net sales. That is deliberate — an "Open item" row at the top of a
 * catalogue report answers nothing — and the note at the foot says so on screen
 * so nobody chases the difference.
 */
function SoldTable({ rows, scope, role }: { rows: SoldRow[]; scope: string; role: "owner" | "manager" }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing sold in this period"
        body="Widen the date range, or check that this branch was trading."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Product</TH>
          <TH className="text-right">Units</TH>
          <TH className="text-right">Revenue</TH>
          {role === "owner" && <TH className="text-right">Gross profit</TH>}
          {role === "owner" && <TH className="text-right">Margin</TH>}
        </TR>
      </THead>
      <TBody>
        {rows.map((row) => (
          <TR key={`${row.productId}:${row.variantId ?? ""}`}>
            <TD>
              <Link
                href={`/portal/analytics/products/${row.productId}?${scope}`}
                className="font-medium text-brand-green-dark hover:underline"
              >
                {row.name}
              </Link>
            </TD>
            <TD className="text-right tabular-nums">{row.units}</TD>
            <TD className="text-right tabular-nums">{formatPesosOr(row.revenueC)}</TD>
            {role === "owner" && <TD className="text-right tabular-nums">{formatPesosOr(row.grossProfitC)}</TD>}
            {role === "owner" && <TD className="text-right tabular-nums">{formatPercentOr(row.marginPct)}</TD>}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    by?: "units" | "revenue";
  }>;
}) {
  const params = await searchParams;
  const scope = await loadScope(params);
  const by = params.by === "revenue" ? "revenue" : "units";

  const { businesses, branches, role } = await loadAnalyticsChoices(scope.businessId);

  let top;
  let slow;
  try {
    [top, slow] = await Promise.all([getTopProducts(scope, { by }), getSlowProducts(scope)]);
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

  const query = scopeQuery(scope);

  return (
    <div className="space-y-6">
      <ScopeSelector businesses={businesses} branches={branches} scope={scope} role={role} />

      <Card>
        <CardHeader>
          <CardTitle>Top sellers</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex gap-3 text-sm">
            <Link
              href={`/portal/analytics/products?${scopeQuery(scope, { by: "units" })}`}
              className={by === "units" ? "font-medium text-ink" : "text-steel hover:underline"}
            >
              By units
            </Link>
            <Link
              href={`/portal/analytics/products?${scopeQuery(scope, { by: "revenue" })}`}
              className={by === "revenue" ? "font-medium text-ink" : "text-steel hover:underline"}
            >
              By revenue
            </Link>
          </div>
          <SoldTable rows={top.rows} scope={query} role={role} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By category</CardTitle>
        </CardHeader>
        <CardBody>
          {top.categories.length === 0 ? (
            <EmptyState title="No category sales" body="Nothing sold in this period." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Category</TH>
                  <TH className="text-right">Units</TH>
                  <TH className="text-right">Revenue</TH>
                </TR>
              </THead>
              <TBody>
                {top.categories.map((category) => (
                  <TR key={category.categoryId}>
                    <TD className="text-charcoal">{category.name}</TD>
                    <TD className="text-right tabular-nums">{category.units}</TD>
                    <TD className="text-right tabular-nums">{formatPesosOr(category.revenueC)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slow movers</CardTitle>
        </CardHeader>
        <CardBody>
          <SoldTable rows={slow.bottom} scope={query} role={role} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sold nothing at all</CardTitle>
        </CardHeader>
        <CardBody>
          {slow.zeroSales.length === 0 ? (
            <EmptyState
              title="Everything sold"
              body="Every active product moved at least once in this period."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Category</TH>
                </TR>
              </THead>
              <TBody>
                {slow.zeroSales.map((product) => (
                  <TR key={product.productId}>
                    <TD className="text-charcoal">{product.name}</TD>
                    <TD className="text-steel">{product.categoryName}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <p className="text-sm text-steel">
        Open-price (misc) lines are not products, so they are left out of these figures — which is
        why product revenue does not add up to net sales. {role === "owner" && "They appear on the Leaks tab."}
      </p>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "products-top", by })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download CSV
      </a>
    </div>
  );
}
