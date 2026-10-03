import { listStaff } from "@/lib/api/staff";
import { listBranches } from "@/lib/api/portal";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { StaffForm, StaffControls } from "./staff-form";
import { saveStaffAction, staffControlAction } from "./actions";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [staff, branches] = await Promise.all([
    listStaff(businessId),
    listBranches(businessId),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Staff access</h1>
        <p className="mt-1 max-w-2xl text-sm text-steel">
          Give each person their own access. You can use your owner PIN at any
          of your terminals; you do not need a staff account.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add staff</CardTitle>
        </CardHeader>
        <CardBody>
          <StaffForm
            businessId={businessId}
            branches={branches}
            action={saveStaffAction}
          />
        </CardBody>
      </Card>
      <div className="space-y-4">
        {!staff.length && (
          <p className="text-sm text-steel">
            No staff yet. Managers use the portal and terminal; cashiers use
            assigned terminals only.
          </p>
        )}
        {staff.map((member) => (
          <Card key={member.userId}>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{member.name}</CardTitle>
              <div className="flex gap-2">
                <Badge>{member.role}</Badge>
                <Badge
                  tone={
                    member.status === "active"
                      ? "success"
                      : member.status === "pending"
                        ? "warn"
                        : "neutral"
                  }
                >
                  {member.status}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {member.status !== "deactivated" && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-brand-green-dark">
                    Edit name, role and branches
                  </summary>
                  <div className="mt-4">
                    <StaffForm
                      key={`${member.userId}:${member.role}:${member.branchIds.join(",")}`}
                      businessId={businessId}
                      branches={branches}
                      member={member}
                      action={saveStaffAction}
                    />
                  </div>
                </details>
              )}
              <p className="mt-3 text-sm text-steel">
                {member.branchIds
                  .map(
                    (id) =>
                      branches.find((branch) => branch.id === id)?.name ??
                      "Archived branch",
                  )
                  .join(" · ")}
              </p>
              <StaffControls
                businessId={businessId}
                member={member}
                action={staffControlAction}
              />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
