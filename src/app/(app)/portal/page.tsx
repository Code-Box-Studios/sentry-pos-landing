import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getDashboard } from "@/lib/api/analytics";
import { formatManilaDateTime } from "@/lib/format";
import { formatPesosOr } from "@/lib/money";
import { PORTAL_NAV } from "./businesses/page";

/**
 * The portal landing (analytics-spec §0).
 *
 * It deliberately spans every business and ignores the business switcher — it
 * is the one view that answers "is everything okay?" for the whole account.
 * Demo businesses are excluded by the API, which is why the complete list still
 * lives at /portal/businesses.
 */
export default async function DashboardPage() {
  const dashboard = await getDashboard();
  const pairedTerminals = dashboard.live.terminals.filter((t) => t.paired).length;

  return (
    <AppShell title="Sentry" nav={PORTAL_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Today</h1>
          <p className="mt-1 text-sm text-steel">
            Every business on your account, against the same day last week.
          </p>
        </div>

        {dashboard.businesses.length === 0 ? (
          <Card>
            <EmptyState
              title="Nothing to report yet"
              body="Once a business has a branch and its first sale, today's figures appear here. The demo business is excluded on purpose."
            />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {dashboard.businesses.map((business) => {
              const lowStock = dashboard.attention.lowStock.find(
                (l) => l.businessId === business.businessId,
              );
              const unclosed = dashboard.attention.unclosedShifts.find(
                (u) => u.businessId === business.businessId,
              );

              return (
                <Card key={business.businessId}>
                  <CardHeader>
                    <CardTitle>{business.name}</CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Figure
                        label="Sales"
                        now={formatPesosOr(business.today.salesC)}
                        then={formatPesosOr(business.sameDayLastWeek.salesC)}
                      />
                      <Figure
                        label="Gross profit"
                        now={formatPesosOr(business.today.grossProfitC)}
                        then={formatPesosOr(
                          business.sameDayLastWeek.grossProfitC,
                        )}
                      />
                      <Figure
                        label="Transactions"
                        now={String(business.today.transactions)}
                        then={String(business.sameDayLastWeek.transactions)}
                      />
                    </div>

                    <Sparkline
                      values={business.sparkline.map((point) => point.salesC)}
                      label={`${business.name} — last 7 days`}
                    />

                    {business.branches.length > 0 ? (
                      <Table>
                        <THead>
                          <TR>
                            <TH>Branch</TH>
                            <TH className="text-right">Sales</TH>
                            <TH className="text-right">Sales count</TH>
                          </TR>
                        </THead>
                        <TBody>
                          {business.branches.map((branch) => (
                            <TR key={branch.branchId}>
                              <TD className="text-charcoal">{branch.name}</TD>
                              <TD className="text-right tabular-nums">
                                {formatPesosOr(branch.salesC)}
                              </TD>
                              <TD className="text-right tabular-nums">
                                {branch.transactions}
                              </TD>
                            </TR>
                          ))}
                        </TBody>
                      </Table>
                    ) : null}

                    {(lowStock && lowStock.count > 0) ||
                    (unclosed && unclosed.count > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {lowStock && lowStock.count > 0 ? (
                          <Badge tone="warn">
                            {lowStock.count} low on stock
                          </Badge>
                        ) : null}
                        {unclosed && unclosed.count > 0 ? (
                          <Badge tone="warn">
                            {unclosed.count} shift
                            {unclosed.count === 1 ? "" : "s"} open over 24h
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}

                    <Link
                      href={`/portal/analytics/overview?businessId=${business.businessId}`}
                      className="inline-block text-sm text-brand-green-dark hover:underline"
                    >
                      Open analytics →
                    </Link>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Right now</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-steel">
              {dashboard.live.openShifts.length} shift
              {dashboard.live.openShifts.length === 1 ? "" : "s"} open ·{" "}
              {pairedTerminals} of {dashboard.live.terminals.length} terminals
              paired · {dashboard.live.unreadNotifications} unread notifications
            </p>
            {dashboard.live.openShifts.map((shift) => (
              <p key={shift.shiftId} className="text-charcoal">
                {shift.branchName} · {shift.terminalName} · opened{" "}
                {formatManilaDateTime(shift.openedAt)}
              </p>
            ))}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

/** Today's number with last week's beneath it, so the comparison needs no arrow. */
function Figure({
  label,
  now,
  then,
}: {
  label: string;
  now: string;
  then: string;
}) {
  return (
    <div>
      <p className="text-xs text-steel">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-ink">{now}</p>
      <p className="text-xs text-steel">was {then}</p>
    </div>
  );
}
