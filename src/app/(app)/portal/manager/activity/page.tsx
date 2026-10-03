import { getManagerContext } from "@/lib/api/manager";
import { listActivity } from "@/lib/api/portal";
import { ActivityTable } from "@/components/app/activity-table";
import { Pagination } from "@/components/app/pagination";
import { Card } from "@/components/ui/card";
export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; branchId?: string }>;
}) {
  const context = await getManagerContext();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const activity = await listActivity(context.business.id, {
    page,
    pageSize: 50,
    branchId: params.branchId,
  });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Activity</h1>
      <p className="text-sm text-steel">
        Operational activity in your assigned branches. Times are Manila.
      </p>
      <Card>
        <ActivityTable entries={activity.data} />
        <Pagination
          page={activity.page}
          totalPages={activity.totalPages}
          baseHref="/portal/manager/activity"
          query={{ branchId: params.branchId }}
        />
      </Card>
    </div>
  );
}
