import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { formatManilaDateTime } from "@/lib/format";
import type { ActorType, AuditEntry } from "@/lib/api/types";

const ACTOR_LABELS: Record<ActorType, string> = {
  owner: "Owner",
  terminal: "Terminal",
  platform_admin: "Platform admin",
};

export function ActivityTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-steel">No activity recorded yet.</p>;
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>When</TH>
          <TH>Actor</TH>
          <TH>Action</TH>
          <TH>Entity</TH>
        </TR>
      </THead>
      <TBody>
        {entries.map((entry) => (
          <TR key={entry.id}>
            <TD className="whitespace-nowrap text-steel">
              {formatManilaDateTime(entry.createdAt)}
            </TD>
            <TD className="text-steel">{ACTOR_LABELS[entry.actorType]}</TD>
            <TD className="font-mono text-xs text-charcoal">{entry.action}</TD>
            <TD className="text-steel">{entry.entityType}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
