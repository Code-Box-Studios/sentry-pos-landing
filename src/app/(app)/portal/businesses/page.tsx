import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import type { NavItem } from "@/components/app/nav";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listBusinesses } from "@/lib/api/portal";
import { formatManilaDate } from "@/lib/format";

/**
 * The portal's top-level nav, shared by the dashboard, this list and every
 * analytics tab. One definition, so a new section cannot appear in some places
 * and not others.
 */
export const PORTAL_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/analytics/overview", label: "Analytics" },
  { href: "/portal/businesses", label: "Businesses" },
  { href: "/portal/settings", label: "Settings" },
];

/**
 * Every business on the account.
 *
 * This list is not redundant with the dashboard: the dashboard excludes DEMO
 * businesses, deliberately, so that training data stays out of the rollups.
 * Without this page a demo business would have no entry point anywhere in the
 * portal.
 */
export default async function BusinessListPage() {
  const businesses = await listBusinesses();

  return (
    <AppShell title="Sentry" nav={PORTAL_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Businesses</h1>
          <p className="mt-1 text-sm text-steel">
            Every business on your account, including the demo one. Choose one to
            manage its catalogue, branches and settings.
          </p>
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
                    <TD className="text-steel">
                      {formatManilaDate(business.createdAt)}
                    </TD>
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
