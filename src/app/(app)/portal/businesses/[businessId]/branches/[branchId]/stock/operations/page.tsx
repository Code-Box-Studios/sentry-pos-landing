import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, TH, TD, TR } from "@/components/ui/table";
import { getBranch, listBranches, listProducts } from "@/lib/api/portal";
import { getExpiry, listCounts, listTransfers } from "@/lib/api/inventory";
import { formatManilaDateTime } from "@/lib/format";
import { toOptions } from "../stock-options";
import { OperationForm, PostCountForm } from "./operation-forms";
export default async function StockOperationsPage({
  params,
}: {
  params: Promise<{ businessId: string; branchId: string }>;
}) {
  const { businessId, branchId } = await params;
  const branch = await getBranch(branchId);
  if (branch.businessId !== businessId) notFound();
  const [branches, products, counts, transfers, expiry] = await Promise.all([
    listBranches(businessId),
    listProducts(businessId),
    listCounts(branchId),
    listTransfers(branchId),
    getExpiry(branchId),
  ]);
  const options = toOptions(products);
  const props = { businessId, branchId, options, branches };
  const itemName = (productId: string, variantId?: string | null) =>
    options.find((option) => option.value === `${productId}${variantId ? `:${variantId}` : ""}`)
      ?.label ?? "Archived item";
  return (
    <div className="space-y-6">
      <Link
        className="text-sm text-steel hover:underline"
        href={`/portal/businesses/${businessId}/branches/${branchId}/stock`}
      >
        ← Stock levels
      </Link>
      <h1 className="text-xl font-semibold">Inventory operations — {branch.name}</h1>
      <nav className="flex flex-wrap gap-4 text-sm text-brand-green-dark">
        <a href="#transfer">Transfer stock</a>
        <a href="#counts">Physical counts</a>
        <a href="#expiry">Expiry batches</a>
      </nav>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <span id="transfer">Transfer to another branch</span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            {branches.length < 2 && (
              <p className="mb-3 text-sm text-steel">Create another branch to transfer stock.</p>
            )}
            <OperationForm {...props} requestId={randomUUID()} mode="transfer" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <span id="counts">New physical count</span>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <OperationForm {...props} requestId={randomUUID()} mode="count" />
          </CardBody>
        </Card>
      </div>
      <h2 className="text-lg font-semibold">Count history</h2>
      {!counts.length && <p className="text-sm text-steel">No counts yet.</p>}
      {counts.map((count) => (
        <Card key={count.id}>
          <CardHeader>
            <CardTitle>
              {count.status === "draft" ? "Draft" : "Posted"} count ·{" "}
              {formatManilaDateTime(count.createdAt)}
            </CardTitle>
          </CardHeader>
          <CardBody>
            {count.status === "draft" ? (
              <>
                <OperationForm {...props} requestId={count.id} count={count} mode="count" />
                <PostCountForm businessId={businessId} branchId={branchId} id={count.id} />
              </>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Item</TH>
                    <TH>System quantity</TH>
                    <TH>Counted</TH>
                    <TH>Variance</TH>
                  </TR>
                </THead>
                <TBody>
                  {count.items.map((item) => (
                    <TR key={item.id ?? `${item.productId}:${item.variantId}`}>
                      <TD>{itemName(item.productId, item.variantId)}</TD>
                      <TD>{item.expectedQty ?? "—"}</TD>
                      <TD>{item.countedQty}</TD>
                      <TD>{item.variance ?? "—"}</TD>
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
          <CardTitle>Transfer history</CardTitle>
        </CardHeader>
        <CardBody>
          {!transfers.length ? (
            <p className="text-sm text-steel">No transfers yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>From → To</TH>
                  <TH>Items</TH>
                </TR>
              </THead>
              <TBody>
                {transfers.map((transfer) => (
                  <TR key={transfer.id}>
                    <TD>{formatManilaDateTime(transfer.createdAt)}</TD>
                    <TD>
                      {branches.find((b) => b.id === transfer.fromBranchId)?.name ??
                        "Archived branch"}{" "}
                      →{" "}
                      {branches.find((b) => b.id === transfer.toBranchId)?.name ??
                        "Archived branch"}
                    </TD>
                    <TD>
                      {transfer.lines
                        .map((line) => `${itemName(line.productId, line.variantId)}: ${line.qty}`)
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
          <CardTitle>
            <span id="expiry">Expiry batches</span>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-steel">
            Remaining stock expired or due within {expiry.warningDays} days. Oldest expiry is
            consumed first.
          </p>
          {!expiry.batches.length ? (
            <p className="text-sm text-steel">No expiring stock in this window.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Item</TH>
                  <TH>Expires</TH>
                  <TH>Remaining</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {expiry.batches.map((batch) => (
                  <TR key={batch.id}>
                    <TD>
                      {batch.productName}
                      {batch.variantName ? ` — ${batch.variantName}` : ""}
                    </TD>
                    <TD>{batch.expiryDate.slice(0, 10)}</TD>
                    <TD>{batch.remainingQty}</TD>
                    <TD>
                      {batch.daysLeft < 0
                        ? "Expired"
                        : batch.daysLeft === 0
                          ? "Expires today"
                          : `${batch.daysLeft} days left`}
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
