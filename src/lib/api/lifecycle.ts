import "server-only";
import { apiFetch } from "./fetch";
export const closeAccount = (exportId: string) =>
  apiFetch<{ closedAt: string; purgeAfter: string }>("/portal/account/closure", {
    method: "POST",
    body: { confirmation: "CLOSE MY ACCOUNT", exportId },
  });
export const resetDemo = (businessId: string, id: string) =>
  apiFetch<{ businessId: string }>(`/portal/businesses/${businessId}/demo-reset`, {
    method: "POST",
    body: { id, confirmation: "RESET DEMO" },
  });
