import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listBranches, listTerminals } from "@/lib/api/portal";
import { formatManilaDateTime } from "@/lib/format";
import { unpairTerminalAction } from "./actions";
import { UnpairButton } from "./unpair-button";

export default async function TerminalsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [terminals, branches] = await Promise.all([
    listTerminals(businessId),
    listBranches(businessId),
  ]);

  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Terminals</h1>
        <p className="mt-1 text-sm text-steel">
          Every till paired to this business. Unpairing stops a device immediately.
        </p>
      </div>

      <Card>
        {terminals.length === 0 ? (
          <EmptyState
            title="No terminals yet"
            body="Pair a device from the terminal app using this business's pairing code."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH>Branch</TH>
                <TH>Last seen</TH>
                <TH>Status</TH>
                <TH className="w-56" />
              </TR>
            </THead>
            <TBody>
              {terminals.map((terminal) => (
                <TR key={terminal.id}>
                  <TD className="font-medium text-charcoal">{terminal.name}</TD>
                  <TD className="font-mono text-xs text-steel">{terminal.code}</TD>
                  <TD className="text-steel">{branchName.get(terminal.branchId) ?? "—"}</TD>
                  <TD className="text-steel">
                    {terminal.lastSeenAt ? formatManilaDateTime(terminal.lastSeenAt) : "—"}
                  </TD>
                  <TD>
                    <Badge tone={terminal.paired ? "success" : "neutral"}>
                      {terminal.paired ? "Paired" : "Not paired"}
                    </Badge>
                  </TD>
                  <TD>
                    <UnpairButton
                      action={unpairTerminalAction}
                      businessId={businessId}
                      terminal={terminal}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
