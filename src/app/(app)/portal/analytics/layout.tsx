import type { ReactNode } from "react";
import { Suspense } from "react";
import { AnalyticsTabs } from "./analytics-tabs";
import { AppShell } from "@/components/app/app-shell";
import { portalNav } from "@/components/app/portal-nav";
import { readPortalRole } from "@/lib/auth/portal-role";

/**
 * The frame every analytics tab renders inside.
 *
 * The tab strip lives here, but the SCOPE SELECTOR does not: a Next layout does
 * not re-render when only the search params change, so a selector placed here
 * would keep showing a stale selection after every change. Each page renders its
 * own.
 */
export default async function AnalyticsLayout({ children }: { children: ReactNode }) {
  const role = (await readPortalRole()) ?? "owner";
  return (
    <AppShell title="Sentry" nav={portalNav(role)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Analytics</h1>
          <Suspense>
            <AnalyticsTabs role={role} />
          </Suspense>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
