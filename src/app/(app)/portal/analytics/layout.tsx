import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { PORTAL_NAV } from "../businesses/page";
import { ANALYTICS_TABS } from "./scope";

/**
 * The frame every analytics tab renders inside.
 *
 * The tab strip lives here, but the SCOPE SELECTOR does not: a Next layout does
 * not re-render when only the search params change, so a selector placed here
 * would keep showing a stale selection after every change. Each page renders its
 * own.
 */
export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Sentry" nav={PORTAL_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Analytics</h1>
          <nav className="mt-3 flex gap-4 border-b border-hairline">
            {ANALYTICS_TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className="-mb-px border-b-2 border-transparent px-1 pb-2 text-sm text-steel hover:border-hairline hover:text-charcoal"
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
