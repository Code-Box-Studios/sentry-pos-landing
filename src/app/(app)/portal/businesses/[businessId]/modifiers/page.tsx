import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { listModifierGroups } from "@/lib/api/portal";
import { deleteModifierGroupAction, saveModifierGroupAction } from "./actions";
import { GroupForm } from "./group-form";

export default async function ModifiersPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const groups = await listModifierGroups(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Modifiers</h1>
        <p className="mt-1 text-sm text-steel">
          Options the cashier picks when adding a product — milk, size, extras. Attach a group
          to a product from that product&apos;s page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New group</CardTitle>
        </CardHeader>
        <CardBody>
          <GroupForm action={saveModifierGroupAction} businessId={businessId} />
        </CardBody>
      </Card>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            title="No modifier groups"
            body="Create one above if your products have options that change the price."
          />
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="flex items-center justify-between gap-4">
              <CardTitle>{group.name}</CardTitle>
              <ConfirmDelete
                action={deleteModifierGroupAction}
                name={group.name}
                hidden={{ businessId, id: group.id }}
              />
            </CardHeader>
            <CardBody>
              <GroupForm action={saveModifierGroupAction} businessId={businessId} group={group} />
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
