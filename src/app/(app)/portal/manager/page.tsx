import Link from "next/link";
import { getManagerContext } from "@/lib/api/manager";
import { getDashboard } from "@/lib/api/analytics";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPesosOr } from "@/lib/money";
import { todayInManila } from "@/lib/analytics/range";
export default async function ManagerDashboard() {
  const [context, dashboard] = await Promise.all([
    getManagerContext(),
    getDashboard(),
  ]);
  const business = dashboard.businesses.find(
    (row) => row.businessId === context.business.id,
  );
  const today = todayInManila(new Date(), context.business.dayStartTime);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Today</h1>
        <p className="mt-1 text-sm text-steel">
          Operational view for your assigned branches · {today}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales</CardTitle>
          </CardHeader>
          <CardBody className="text-2xl font-semibold tabular-nums">
            {formatPesosOr(business?.today.salesC ?? 0)}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardBody className="text-2xl font-semibold tabular-nums">
            {business?.today.transactions ?? 0}
          </CardBody>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {context.branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader>
              <CardTitle>{branch.name}</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-steel">{branch.code}</p>
              <Link
                className="inline-flex min-h-11 items-center rounded-full bg-brand-green-soft px-4 text-sm font-medium text-brand-green-dark"
                href={`/portal/manager/stock?branchId=${branch.id}`}
              >
                Manage stock
              </Link>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
