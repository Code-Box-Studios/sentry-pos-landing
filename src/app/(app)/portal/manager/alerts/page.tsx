import { getManagerAlerts, getManagerContext } from "@/lib/api/manager";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { formatManilaDateTime } from "@/lib/format";
export default async function AlertsPage() {
  const [context, alerts] = await Promise.all([
    getManagerContext(),
    getManagerAlerts(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Low-stock alerts</h1>
      <p className="text-sm text-steel">
        Unresolved stock alerts for your assigned branches.
      </p>
      {alerts.map((alert) => (
        <Card key={alert.id}>
          <CardHeader>
            <CardTitle>{alert.title}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            <p className="text-sm text-slate">{alert.body}</p>
            <p className="text-xs text-steel">
              {context.branches.find((branch) => branch.id === alert.branchId)
                ?.name ?? "Archived branch"}{" "}
              · {formatManilaDateTime(alert.createdAt)}
            </p>
          </CardBody>
        </Card>
      ))}
      {!alerts.length && (
        <Card>
          <CardBody>No unresolved low-stock alerts.</CardBody>
        </Card>
      )}
    </div>
  );
}
