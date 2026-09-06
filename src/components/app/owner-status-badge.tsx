import { Badge } from "@/components/ui/badge";
import type { OwnerStatus } from "@/lib/api/types";

const PRESENTATION: Record<
  OwnerStatus,
  { label: string; tone: "success" | "warn" | "danger" | "neutral" }
> = {
  active: { label: "Active", tone: "success" },
  suspended: { label: "Suspended", tone: "warn" },
  hard_suspended: { label: "Hard suspended", tone: "danger" },
  closed: { label: "Closed", tone: "neutral" },
};

export function OwnerStatusBadge({ status }: { status: OwnerStatus }) {
  const { label, tone } = PRESENTATION[status];
  return <Badge tone={tone}>{label}</Badge>;
}
