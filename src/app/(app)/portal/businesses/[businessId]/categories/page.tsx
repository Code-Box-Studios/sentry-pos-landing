import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listCategories } from "@/lib/api/portal";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "./actions";
import { CategoryForm } from "./category-form";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const categories = await listCategories(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Categories</h1>
        <p className="mt-1 text-sm text-steel">
          Categories group products on the terminal. Order controls the tab order there.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a category</CardTitle>
        </CardHeader>
        <CardBody>
          <CategoryForm action={createCategoryAction} businessId={businessId} />
        </CardBody>
      </Card>

      <Card>
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" body="Add one above; every product needs one." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Category</TH>
                <TH className="w-40" />
              </TR>
            </THead>
            <TBody>
              {categories.map((category) => (
                <TR key={category.id}>
                  <TD>
                    <CategoryForm
                      action={updateCategoryAction}
                      businessId={businessId}
                      category={category}
                    />
                  </TD>
                  <TD>
                    <ConfirmDelete
                      action={deleteCategoryAction}
                      name={category.name}
                      hidden={{ businessId, id: category.id }}
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
