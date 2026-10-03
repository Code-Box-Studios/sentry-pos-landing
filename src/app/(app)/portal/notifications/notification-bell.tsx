import Link from "next/link";
import { Bell } from "lucide-react";
import { listNotifications } from "@/lib/api/notifications";
export async function NotificationBell() {
  const { unreadCount } = await listNotifications({ unreadOnly: true, pageSize: 1 });
  return (
    <Link
      className="inline-flex items-center gap-2 text-sm text-brand-green-dark"
      href="/portal/notifications"
      aria-label={`${unreadCount} unread notifications`}
    >
      <Bell size={18} aria-hidden="true" />
      {unreadCount} unread
    </Link>
  );
}
