import { EmptyState } from "@/components/app/empty-state";
import { Pagination } from "@/components/app/pagination";
import { ScopeSelector } from "@/components/app/scope-selector";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  getInventoryMovements,
  getOnHand,
  getShrinkage,
} from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatManilaDateTime } from "@/lib/format";
import { formatPesosOr } from "@/lib/money";
import { readScope, scopeQuery } from "../scope";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const scope = readScope(params);
  const page = Number(params.page ?? "1");

  const [businesses, branches] = await Promise.all([
    listBusinesses(),
    scope.businessId ? listBranches(scope.businessId) : Promise.resolve([]),
  ]);

  let movements;
  let shrinkage;
  let onHand;
  try {
    [movements, shrinkage, onHand] = await Promise.all([
      getInventoryMovements(scope, { page }),
      getShrinkage(scope),
      getOnHand(scope),
    ]);
  } catch (error) {
    // The API refuses page x pageSize > 2000 with a 422 that already says to
    // narrow the scope; show its own words rather than inventing new ones.
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
          <CardTitle>Stock on hand</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {onHand.rows.length === 0 ? (
            <EmptyState
              title="No stock recorded"
              body="Receive stock against a branch to start counting it here."
            />
          ) : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Branch</TH>
                    <TH>Item</TH>
                    <TH className="text-right">Quantity</TH>
                    <TH className="text-right">Unit cost</TH>
                    <TH className="text-right">Value</TH>
                    <TH className="text-right">Days of stock</TH>
                  </TR>
                </THead>
                <TBody>
                  {onHand.rows.map((row) => (
                    <TR
                      key={`${row.branchId}:${row.productId}:${row.variantId ?? ""}`}
                    >
                      <TD className="text-steel">{row.branchName}</TD>
                      <TD className="text-charcoal">
                        {row.name}
                        {row.isLow ? (
                          <Badge tone="warn" className="ml-2">
                            low
                          </Badge>
                        ) : null}
                      </TD>
                      <TD className="text-right tabular-nums">{row.qty}</TD>
                      <TD className="text-right tabular-nums">
                        {formatPesosOr(row.unitCostC)}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {formatPesosOr(row.valueC)}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {/* Null means it never sold in this range — an unbounded
                            runway, which is not a number worth printing. */}
                        {row.daysOfStock === null
                          ? "—"
                          : row.daysOfStock.toFixed(1)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <p className="text-sm text-steel">
                Total value {formatPesosOr(onHand.totals.valueC)} ·{" "}
                {onHand.totals.uncostedItems} item
                {onHand.totals.uncostedItems === 1 ? "" : "s"} with no cost
                recorded, so their value is unknown rather than zero.
              </p>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shrinkage by reason</CardTitle>
        </CardHeader>
        <CardBody>
          {shrinkage.rows.length === 0 ? (
            <EmptyState
              title="No losses recorded"
              body="Only negative stock adjustments count as shrinkage."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Reason</TH>
                  <TH className="text-right">Units lost</TH>
                  <TH className="text-right">Value at cost</TH>
                  <TH className="text-right">Uncosted units</TH>
                </TR>
              </THead>
              <TBody>
                {shrinkage.rows.map((row) => (
                  <TR key={row.reasonCategory}>
                    <TD className="text-charcoal">{row.reasonCategory}</TD>
                    <TD className="text-right tabular-nums">{row.units}</TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.valueC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {row.uncostedUnits}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movement ledger</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {movements.data.length === 0 ? (
            <EmptyState
              title="No stock movements"
              body="Receiving, adjusting and selling all leave a row here."
            />
          ) : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>When</TH>
                    <TH>Branch</TH>
                    <TH>Item</TH>
                    <TH>Type</TH>
                    <TH className="text-right">Change</TH>
                    <TH>Reason</TH>
                    <TH>Who</TH>
                  </TR>
                </THead>
                <TBody>
                  {movements.data.map((movement) => (
                    <TR key={movement.id}>
                      <TD className="text-steel">
                        {formatManilaDateTime(movement.createdAt)}
                      </TD>
                      <TD className="text-steel">{movement.branchName}</TD>
                      <TD className="text-charcoal">
                        {movement.variantName
                          ? `${movement.productName} — ${movement.variantName}`
                          : movement.productName}
                      </TD>
                      <TD className="text-steel">{movement.type}</TD>
                      <TD className="text-right tabular-nums">
                        {movement.qtyDelta > 0
                          ? `+${movement.qtyDelta}`
                          : movement.qtyDelta}
                      </TD>
                      <TD className="text-steel">
                        {movement.reasonCategory ?? movement.note ?? "—"}
                      </TD>
                      {/* Null when no audit row matches — reported as unknown
                          rather than attributed to nobody in particular. */}
                      <TD className="text-steel">
                        {movement.actor?.actorType ?? "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination
                page={movements.page}
                totalPages={movements.totalPages}
                baseHref="/portal/analytics/inventory"
                query={{
                  from: scope.from,
                  to: scope.to,
                  businessId: scope.businessId,
                  branchId: scope.branchId,
                }}
              />
            </>
          )}
        </CardBody>
      </Card>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "inventory-on-hand" })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download stock-on-hand CSV
      </a>
    </div>
  );
}
