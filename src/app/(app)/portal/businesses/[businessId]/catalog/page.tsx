import Link from "next/link";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listCategories, listProducts } from "@/lib/api/portal";
import { formatPesos } from "@/lib/money";
import { deleteProductAction } from "./actions";
import { ProductFilters } from "./product-filters";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ q?: string; categoryId?: string }>;
}) {
  const { businessId } = await params;
  const { q, categoryId } = await searchParams;

  const [products, categories] = await Promise.all([
    listProducts(businessId),
    listCategories(businessId),
  ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const needle = q?.trim().toLowerCase() ?? "";

  // Filtering client-side because the API has no search parameter. Catalogs are small
  // enough for this; when one is not, the filter belongs in the API, not in a paginator here.
  const visible = products.filter((product) => {
    if (categoryId && product.categoryId !== categoryId) return false;
    if (!needle) return true;
    const haystack = [
      product.name,
      product.sku ?? "",
      product.barcode ?? "",
      ...product.variants.flatMap((v) => [v.name, v.sku ?? "", v.barcode ?? ""]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Products</h1>
          <p className="mt-1 text-sm text-steel">
            {visible.length} of {products.length} shown.
          </p>
        </div>
        <Link href={`${base}/catalog/new`} className={buttonVariants()}>
          Add product
        </Link>
      </div>

      <ProductFilters
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        q={q}
        categoryId={categoryId}
      />

      <Card>
        {products.length === 0 ? (
          <EmptyState
            title="No products yet"
            body="Add your first product — it appears on every paired terminal straight away."
          />
        ) : visible.length === 0 ? (
          <EmptyState title="Nothing matches" body="Try a different search or category." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Category</TH>
                <TH>Price</TH>
                <TH>Stock</TH>
                <TH className="w-32" />
              </TR>
            </THead>
            <TBody>
              {visible.map((product) => (
                <TR key={product.id}>
                  <TD>
                    <Link
                      href={`${base}/catalog/${product.id}`}
                      className="font-medium text-brand-green-dark hover:underline"
                    >
                      {product.name}
                    </Link>
                    {!product.active ? (
                      <Badge tone="neutral" className="ml-2">
                        Inactive
                      </Badge>
                    ) : null}
                    {product.variants.length > 0 ? (
                      <span className="ml-2 text-xs text-stone">
                        {product.variants.length} variant
                        {product.variants.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </TD>
                  <TD className="text-steel">{categoryName.get(product.categoryId) ?? "—"}</TD>
                  <TD className="font-mono text-charcoal">{formatPesos(product.priceC)}</TD>
                  <TD className="text-steel">{product.trackStock ? "Tracked" : "Not tracked"}</TD>
                  <TD>
                    <ConfirmDelete
                      action={deleteProductAction}
                      name={product.name}
                      hidden={{ businessId, id: product.id }}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
