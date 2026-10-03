import { getManagerContext } from "@/lib/api/manager";
import { listProducts } from "@/lib/api/portal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatPesosOr } from "@/lib/money";
export default async function ProductsPage() {
  const context = await getManagerContext();
  const products = await listProducts(context.business.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Products</h1>
        <p className="mt-1 text-sm text-steel">
          Read-only catalog. Ask the business owner to change products,
          categories or prices.
        </p>
      </div>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Product</TH>
              <TH>SKU</TH>
              <TH className="text-right">Price</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {products.flatMap((product) =>
              product.variants.length
                ? product.variants.map((variant) => (
                    <TR key={variant.id}>
                      <TD>
                        {product.name} — {variant.name}
                      </TD>
                      <TD>{variant.sku ?? "—"}</TD>
                      <TD className="text-right tabular-nums">
                        {formatPesosOr(variant.priceC)}
                      </TD>
                      <TD>
                        <Badge tone={product.active ? "success" : "neutral"}>
                          {product.active ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                    </TR>
                  ))
                : [
                    <TR key={product.id}>
                      <TD>{product.name}</TD>
                      <TD>{product.sku ?? "—"}</TD>
                      <TD className="text-right tabular-nums">
                        {formatPesosOr(product.priceC)}
                      </TD>
                      <TD>
                        <Badge tone={product.active ? "success" : "neutral"}>
                          {product.active ? "Active" : "Inactive"}
                        </Badge>
                      </TD>
                    </TR>,
                  ],
            )}
          </TBody>
        </Table>
        {!products.length && (
          <p className="p-5 text-sm text-steel">No products yet.</p>
        )}
      </Card>
    </div>
  );
}
