import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * One figure and its comparison.
 *
 * A Server Component that renders a value the caller has ALREADY formatted, so
 * it holds no money logic of its own and cannot disagree with the rest of the
 * portal about what a null means.
 */
export function KpiCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
        {hint ? <p className="mt-1 text-xs text-steel">{hint}</p> : null}
      </CardBody>
    </Card>
  );
}
