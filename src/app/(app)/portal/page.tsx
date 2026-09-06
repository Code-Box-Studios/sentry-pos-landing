import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listBusinesses } from "@/lib/api/portal";
import { formatManilaDate } from "@/lib/format";

// Only routes that exist. `/portal/settings` (the refund PIN) joins this list when built.
const NAV = [{ href: "/portal", label: "Businesses" }];

export default async function PortalHomePage() {
  const businesses = await listBusinesses();

  return (
    <AppShell title="Sentry" nav={NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Businesses</h1>
          <p className="mt-1 text-sm text-steel">Choose a business to manage.</p>
        </div>

        <Card>
          {businesses.length === 0 ? (
            <EmptyState
              title="No businesses yet"
              body="A demo business is created when your account is activated. If you cannot see one, contact support."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Type</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {businesses.map((business) => (
                  <TR key={business.id}>
                    <TD>
                      <Link
                        href={`/portal/businesses/${business.id}`}
                        className="font-medium text-brand-green-dark hover:underline"
                      >
                        {business.name}
                      </Link>
                      {business.isDemo ? (
                        <span className="ml-2 text-xs text-stone">demo</span>
                      ) : null}
                    </TD>
                    <TD className="text-steel">{business.type}</TD>
                    <TD className="text-steel">{formatManilaDate(business.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
