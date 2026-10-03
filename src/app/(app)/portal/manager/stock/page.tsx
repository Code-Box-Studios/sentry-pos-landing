import { randomUUID } from "crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getManagerContext,
  getManagerTransferBranches,
} from "@/lib/api/manager";
import { getStock, listProducts } from "@/lib/api/portal";
import { listCounts, listTransfers, getExpiry } from "@/lib/api/inventory";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatManilaDateTime } from "@/lib/format";
import { toOptions } from "../../businesses/[businessId]/branches/[branchId]/stock/stock-options";
import { ReceiveForm } from "../../businesses/[businessId]/branches/[branchId]/stock/receive-form";
import { AdjustForm } from "../../businesses/[businessId]/branches/[branchId]/stock/adjust-form";
import {
  receiveStockAction,
  adjustStockAction,
} from "../../businesses/[businessId]/branches/[branchId]/stock/actions";
import {
  OperationForm,
  PostCountForm,
} from "../../businesses/[businessId]/branches/[branchId]/stock/operations/operation-forms";

export default async function ManagerStockPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const context = await getManagerContext();
  const params = await searchParams;
  const branchId = params.branchId ?? context.branches[0]?.id;
  const branch = context.branches.find((row) => row.id === branchId);
  if (!branch) notFound();
  const businessId = context.business.id;
  const [levels, products, counts, transfers, expiry, branches] =
    await Promise.all([
      getStock(branch.id),
      listProducts(businessId),
      listCounts(branch.id),
      listTransfers(branch.id),
      getExpiry(branch.id),
      getManagerTransferBranches(),
    ]);
  const options = toOptions(products);
  const props = { businessId, branchId: branch.id, options, branches };
  const itemName = (productId: string, variantId?: string | null) =>
    options.find(
      (option) =>
        option.value === `${productId}${variantId ? `:${variantId}` : ""}`,
    )?.label ?? "Archived item";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">
          Stock — {branch.name}
        </h1>
        <p className="mt-1 text-sm text-steel">
          Receive, adjust, transfer and count stock in your assigned branch.
        </p>
      </div>
      <nav
        aria-label="Assigned stock branches"
        className="flex flex-wrap gap-2"
      >
        {context.branches.map((row) => (
          <Link
            key={row.id}
            aria-current={row.id === branch.id ? "page" : undefined}
            href={`/portal/manager/stock?branchId=${row.id}`}
            className="rounded-full border border-hairline px-4 py-2 text-sm text-slate aria-[current=page]:bg-brand-green-soft aria-[current=page]:text-brand-green-dark"
          >
            {row.name}
          </Link>
        ))}
      </nav>
      <Card>
        <CardHeader>
          <CardTitle>Levels</CardTitle>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Product</TH>
              <TH>Variant</TH>
              <TH className="text-right">Quantity</TH>
            </TR>
          </THead>
          <TBody>
            {levels.map((level) => (
              <TR key={`${level.productId}:${level.variantId ?? ""}`}>
                <TD>{level.productName}</TD>
                <TD>{level.variantName ?? "—"}</TD>
                <TD className="text-right tabular-nums">{level.qty}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {!levels.length && <CardBody>No stock recorded yet.</CardBody>}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receive stock</CardTitle>
          </CardHeader>
          <CardBody>
            <ReceiveForm
              {...props}
              allowCost={false}
              action={receiveStockAction}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Adjust stock</CardTitle>
          </CardHeader>
          <CardBody>
            <AdjustForm {...props} action={adjustStockAction} />
          </CardBody>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transfer stock</CardTitle>
          </CardHeader>
          <CardBody>
            <OperationForm
              {...props}
              requestId={randomUUID()}
              mode="transfer"
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New physical count</CardTitle>
          </CardHeader>
          <CardBody>
            <OperationForm {...props} requestId={randomUUID()} mode="count" />
          </CardBody>
        </Card>
      </div>
      <h2 className="text-lg font-semibold text-ink">Count history</h2>
      {!counts.length && <p className="text-sm text-steel">No counts yet.</p>}
      {counts.map((count) => (
        <Card key={count.id}>
          <CardHeader>
            <CardTitle>
              {count.status === "draft" ? "Draft" : "Posted"} ·{" "}
              {formatManilaDateTime(count.createdAt)}
            </CardTitle>
          </CardHeader>
          <CardBody>
            {count.status === "draft" ? (
              <>
                <OperationForm
                  {...props}
                  count={count}
                  requestId={count.id}
                  mode="count"
                />
                <PostCountForm
                  businessId={businessId}
                  branchId={branch.id}
                  id={count.id}
                />
              </>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Item</TH>
                    <TH className="text-right">Counted</TH>
                    <TH className="text-right">Variance</TH>
                  </TR>
                </THead>
                <TBody>
                  {count.items.map((item) => (
                    <TR key={`${item.productId}:${item.variantId ?? ""}`}>
                      <TD>{itemName(item.productId, item.variantId)}</TD>
                      <TD className="text-right tabular-nums">
                        {item.countedQty}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {item.variance ?? "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardBody>
        </Card>
      ))}
      <Card>
        <CardHeader>
          <CardTitle>Transfers</CardTitle>
        </CardHeader>
        <CardBody>
          {!transfers.length ? (
            <p className="text-sm text-steel">No transfers yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>From</TH>
                  <TH>To</TH>
                  <TH>Items</TH>
                </TR>
              </THead>
              <TBody>
                {transfers.map((transfer) => (
                  <TR key={transfer.id}>
                    <TD>{formatManilaDateTime(transfer.createdAt)}</TD>
                    <TD>
                      {branches.find((row) => row.id === transfer.fromBranchId)
                        ?.name ?? "Archived branch"}
                    </TD>
                    <TD>
                      {branches.find((row) => row.id === transfer.toBranchId)
                        ?.name ?? "Archived branch"}
                    </TD>
                    <TD>
                      {transfer.lines
                        .map(
                          (line) =>
                            `${itemName(line.productId, line.variantId)} × ${line.qty}`,
                        )
                        .join(", ")}
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
          <CardTitle>Expiry batches</CardTitle>
        </CardHeader>
        <CardBody>
          {!expiry.batches.length ? (
            <p className="text-sm text-steel">No remaining expiry batches.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Item</TH>
                  <TH className="text-right">Remaining</TH>
                  <TH>Expires</TH>
                  <TH className="text-right">Days left</TH>
                </TR>
              </THead>
              <TBody>
                {expiry.batches.map((batch) => (
                  <TR key={batch.id}>
                    <TD>{itemName(batch.productId, batch.variantId)}</TD>
                    <TD className="text-right tabular-nums">
                      {batch.remainingQty}
                    </TD>
                    <TD>{batch.expiryDate.slice(0, 10)}</TD>
                    <TD className="text-right tabular-nums">
                      {batch.daysLeft}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
