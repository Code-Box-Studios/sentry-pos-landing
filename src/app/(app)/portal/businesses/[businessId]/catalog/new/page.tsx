import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { listCategories } from "@/lib/api/portal";
import { saveProductAction } from "../actions";
import { ProductForm } from "../product-form";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const categories = await listCategories(businessId);
  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/catalog`} className="text-sm text-steel hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Add a product</h1>
      </div>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            title="Add a category first"
            body="Every product belongs to a category, and this business has none yet."
            action={
              <Link
                href={`${base}/categories`}
                className="text-sm text-brand-green-dark hover:underline"
              >
                Go to categories
              </Link>
            }
          />
        </Card>
      ) : (
        <ProductForm action={saveProductAction} businessId={businessId} categories={categories} />
      )}
    </div>
  );
}
