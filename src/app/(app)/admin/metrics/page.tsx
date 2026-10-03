import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformMetrics } from "@/lib/api/admin";
export default async function PlatformMetricsPage() {
  const metrics = await getPlatformMetrics();
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Platform metrics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Owners", metrics.owners.total],
          ["Businesses", metrics.businesses],
          ["Branches", metrics.branches],
          ["Terminals", metrics.terminals],
          ["Open shifts", metrics.openShifts],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardBody className="text-2xl font-semibold tabular-nums">{value}</CardBody>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Owner access</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <p>Active: {metrics.owners.active}</p>
          <p>Suspended: {metrics.owners.suspended}</p>
          <p>Hard suspended: {metrics.owners.hardSuspended}</p>
          <p>Closed: {metrics.owners.closed}</p>
        </CardBody>
      </Card>
    </div>
  );
}
