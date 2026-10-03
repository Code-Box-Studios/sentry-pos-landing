import { getManagerContext } from "@/lib/api/manager";
import { listTerminals } from "@/lib/api/portal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { formatManilaDateTime } from "@/lib/format";
import { UnpairButton } from "../../businesses/[businessId]/terminals/unpair-button";
import { unpairTerminalAction } from "../../businesses/[businessId]/terminals/actions";
export default async function TerminalsPage() {
  const context = await getManagerContext();
  const terminals = await listTerminals(context.business.id);
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">Terminals</h1>
      <p className="text-sm text-steel">
        Status for your assigned branches. You can remotely unpair a device; the
        owner must pair it again in person.
      </p>
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Terminal</TH>
              <TH>Branch</TH>
              <TH>Last seen</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {terminals.map((terminal) => (
              <TR key={terminal.id}>
                <TD>
                  {terminal.name} · {terminal.code}
                </TD>
                <TD>
                  {context.branches.find(
                    (branch) => branch.id === terminal.branchId,
                  )?.name ?? "Archived branch"}
                </TD>
                <TD>
                  {terminal.lastSeenAt
                    ? formatManilaDateTime(terminal.lastSeenAt)
                    : "—"}
                </TD>
                <TD>
                  <Badge tone={terminal.paired ? "success" : "neutral"}>
                    {terminal.paired ? "Paired" : "Not paired"}
                  </Badge>
                </TD>
                <TD>
                  <UnpairButton
                    businessId={context.business.id}
                    terminal={terminal}
                    action={unpairTerminalAction}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {!terminals.length && (
          <p className="p-5 text-sm text-steel">No assigned terminals.</p>
        )}
      </Card>
    </div>
  );
}
