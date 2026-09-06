import { ActivityTable } from "@/components/app/activity-table";
import { Pagination } from "@/components/app/pagination";
import { Card } from "@/components/ui/card";
import { listActivity, listBranches, type PortalActivityQuery } from "@/lib/api/portal";
import { ActivityFilters } from "./activity-filters";

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{
    page?: string;
    actorType?: string;
    action?: string;
    branchId?: string;
  }>;
}) {
  const { businessId } = await params;
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);

  // Only the two values the endpoint accepts; anything else is dropped rather than 422'd.
  const actorType: PortalActivityQuery["actorType"] =
    filters.actorType === "owner" || filters.actorType === "terminal"
      ? filters.actorType
      : undefined;

  const [activity, branches] = await Promise.all([
    listActivity(businessId, {
      page,
      pageSize: 50,
      actorType,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.branchId ? { branchId: filters.branchId } : {}),
    }),
    listBranches(businessId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Activity</h1>
        <p className="mt-1 text-sm text-steel">
          Everything done in this business, by you and by your terminals. Times are Manila.
        </p>
      </div>

      <ActivityFilters
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        actorType={filters.actorType}
        action={filters.action}
        branchId={filters.branchId}
      />

      <Card>
        <ActivityTable entries={activity.data} />
        <Pagination
          page={activity.page}
          totalPages={activity.totalPages}
          baseHref={`/portal/businesses/${businessId}/activity`}
          query={{
            actorType: filters.actorType,
            action: filters.action,
            branchId: filters.branchId,
          }}
        />
      </Card>
    </div>
  );
}
