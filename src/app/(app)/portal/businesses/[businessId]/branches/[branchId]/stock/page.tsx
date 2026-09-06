import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { NotFoundError } from "@/lib/api/errors";
import { getBranch, getStock, listProducts } from "@/lib/api/portal";
import { adjustStockAction, receiveStockAction } from "./actions";
import { AdjustForm } from "./adjust-form";
import { ReceiveForm } from "./receive-form";
import { toOptions } from "./target-select";

export default async function StockPage({
  params,
}: {
  params: Promise<{ businessId: string; branchId: string }>;
}) {
  const { businessId, branchId } = await params;

  let branch;
  let levels;
  let products;
  try {
    [branch, levels, products] = await Promise.all([
      getBranch(branchId),
      getStock(branchId),
      listProducts(businessId),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const options = toOptions(products);
  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/branches`} className="text-sm text-steel hover:underline">
          ← Branches
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Stock — {branch.name}</h1>
        <p className="mt-1 text-sm text-steel">
          Only products with stock tracking switched on are counted here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Levels</CardTitle>
        </CardHeader>
        {levels.length === 0 ? (
          <EmptyState
            title="No stock recorded"
            body="Receive stock below to start counting, or switch on tracking for a product first."
          />
        ) : (
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
                <TR key={`${level.productId}-${level.variantId ?? "base"}`}>
                  <TD className="font-medium text-charcoal">{level.productName}</TD>
                  <TD className="text-steel">{level.variantName ?? "—"}</TD>
                  <TD className="text-right font-mono text-charcoal">{level.qty}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {options.length === 0 ? (
        <Card>
          <EmptyState
            title="Nothing to receive"
            body="No product in this business tracks stock yet. Switch on Track stock for a product to count it here."
          />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Receive stock</CardTitle>
            </CardHeader>
            <CardBody>
              <ReceiveForm
                action={receiveStockAction}
                businessId={businessId}
                branchId={branchId}
                options={options}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adjust a count</CardTitle>
            </CardHeader>
            <CardBody>
              <AdjustForm
                action={adjustStockAction}
                businessId={businessId}
                branchId={branchId}
                options={options}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
