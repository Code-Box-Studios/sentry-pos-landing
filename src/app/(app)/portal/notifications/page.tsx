import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { Pagination } from "@/components/app/pagination";
import { Card, CardBody } from "@/components/ui/card";
import { listNotifications } from "@/lib/api/notifications";
import { formatManilaDateTime } from "@/lib/format";
import { PORTAL_NAV } from "@/components/app/portal-nav";
import { ReadButton } from "./read-button";
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unreadOnly?: string }>;
}) {
  const params = await searchParams;
  const unreadOnly = params.unreadOnly === "true";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const report = await listNotifications({ page, pageSize: 20, unreadOnly });
  return (
    <AppShell title="Sentry" nav={PORTAL_NAV}>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">
          Notifications{" "}
          <span className="text-sm font-normal text-steel">{report.unreadCount} unread</span>
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/portal/notifications" className="text-brand-green-dark">
            All
          </Link>
          <Link href="/portal/notifications?unreadOnly=true" className="text-brand-green-dark">
            Unread
          </Link>
          {report.unreadCount > 0 && <ReadButton />}
        </div>
        {!report.items.length && (
          <p className="text-sm text-steel">
            {unreadOnly ? "You're all caught up." : "No notifications yet."}
          </p>
        )}
        {report.items.map((item) => {
          const href =
            item.type === "shift_unclosed"
              ? `/portal/businesses/${item.businessId}/terminals`
              : item.branchId
                ? `/portal/businesses/${item.businessId}/branches/${item.branchId}/stock${item.type === "expiring_soon" ? "/operations#expiry" : ""}`
                : `/portal/analytics/inventory?businessId=${item.businessId}`;
          return (
            <Card key={item.id}>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className={item.readAt ? "font-medium" : "font-semibold"}>
                    {item.title}
                    {!item.readAt && (
                      <span className="ml-2 text-xs text-brand-green-dark">Unread</span>
                    )}
                  </h2>
                  <time className="text-xs text-steel">{formatManilaDateTime(item.createdAt)}</time>
                </div>
                <p className="text-sm">{item.body}</p>
                <div className="flex items-center gap-4">
                  <Link className="text-sm text-brand-green-dark hover:underline" href={href}>
                    View details →
                  </Link>
                  {item.resolvedAt && <span className="text-xs text-steel">Resolved</span>}
                  {!item.readAt && <ReadButton id={item.id} />}
                </div>
              </CardBody>
            </Card>
          );
        })}
        <Pagination
          page={report.page}
          totalPages={Math.ceil(report.total / report.pageSize)}
          baseHref="/portal/notifications"
          query={{ unreadOnly: unreadOnly ? "true" : undefined }}
        />
      </div>
    </AppShell>
  );
}
