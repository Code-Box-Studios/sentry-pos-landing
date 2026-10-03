import "server-only";
import { apiFetch } from "./fetch";
export interface ManagerContext {
  userId: string;
  name: string;
  role: "manager";
  business: { id: string; name: string; dayStartTime: string };
  branches: { id: string; name: string; code: string }[];
}
export const getManagerContext = () =>
  apiFetch<ManagerContext>("/portal/manager/context");
export interface ManagerAlert {
  id: string;
  title: string;
  body: string;
  branchId: string;
  createdAt: string;
}
export const getManagerAlerts = () =>
  apiFetch<ManagerAlert[]>("/portal/manager/alerts");
export const getManagerTransferBranches = () =>
  apiFetch<{ id: string; name: string; businessId: string }[]>(
    "/portal/manager/transfer-branches",
  );
