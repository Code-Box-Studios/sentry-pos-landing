import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { NotFoundError } from "@/lib/api/errors";
import { getProduct, listCategories, listModifierGroups } from "@/lib/api/portal";
import { saveProductAction, setProductGroupsAction } from "../actions";
import { ProductForm } from "../product-form";
import { ModifierLinks } from "./modifier-links";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string; productId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { businessId, productId } = await params;
  const { saved } = await searchParams;

  let product;
  try {
    product = await getProduct(productId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [categories, groups] = await Promise.all([
    listCategories(businessId),
    listModifierGroups(businessId),
  ]);

  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/catalog`} className="text-sm text-steel hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">{product.name}</h1>
      </div>

      {saved ? (
        <Alert tone="info">Saved. Paired terminals pick this up on their next sync.</Alert>
      ) : null}

      <ProductForm
        action={saveProductAction}
        businessId={businessId}
        categories={categories}
        product={product}
      />

      <Card>
        <CardHeader>
          <CardTitle>Modifiers</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {/* Load-bearing, not decoration: the API has no read for a product's linked groups
              (they come back only from the PUT), so this list cannot show the current
              selection. Saving replaces every link, so silently starting empty would be data
              loss. Remove this when GET /portal/products/:id starts returning them. */}
          <Alert tone="warn">
            The API does not yet report which groups a product already has, so this list starts
            empty each time. Saving replaces every link on this product — tick every group it
            should have, not just the new one.
          </Alert>
          <ModifierLinks
            action={setProductGroupsAction}
            businessId={businessId}
            productId={product.id}
            groups={groups}
            linked={[]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
