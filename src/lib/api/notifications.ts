import "server-only";
import { apiFetch } from "./fetch";
export interface OwnerNotification {
  id: string;
  type: "low_stock" | "shift_unclosed" | "expiring_soon";
  title: string;
  body: string;
  businessId: string;
  branchId: string | null;
  entityId: string | null;
  readAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}
export interface NotificationPage {
  items: OwnerNotification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}
export const listNotifications = (
  options: { unreadOnly?: boolean; page?: number; pageSize?: number } = {},
) => apiFetch<NotificationPage>("/portal/notifications", { query: options });
export const readNotification = (id: string) =>
  apiFetch<{ ok: true }>(`/portal/notifications/${id}/read`, { method: "POST" });
export const readAllNotifications = () =>
  apiFetch<{ ok: true }>("/portal/notifications/read-all", { method: "POST" });
