import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listDiscounts } from "@/lib/api/portal";
import { deleteDiscountAction, saveDiscountAction } from "./actions";
import { DiscountForm } from "./discount-form";

export default async function DiscountsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const discounts = await listDiscounts(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Discounts</h1>
        <p className="mt-1 text-sm text-steel">
          A line takes either a senior/PWD discount or a promo, whichever is higher — never
          both.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New discount</CardTitle>
        </CardHeader>
        <CardBody>
          <DiscountForm action={saveDiscountAction} businessId={businessId} />
        </CardBody>
      </Card>

      <Card>
        {discounts.length === 0 ? (
          <EmptyState
            title="No discounts yet"
            body="Add one above. Discounts appear on the terminal for the cashier to apply."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Discount</TH>
                <TH className="w-40" />
              </TR>
            </THead>
            <TBody>
              {discounts.map((discount) => (
                <TR key={discount.id}>
                  <TD>
                    <DiscountForm
                      action={saveDiscountAction}
                      businessId={businessId}
                      discount={discount}
                    />
                  </TD>
                  <TD>
                    <ConfirmDelete
                      action={deleteDiscountAction}
                      name={discount.name}
                      hidden={{ businessId, id: discount.id }}
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
