import "server-only";
import { apiFetch } from "./fetch";
export interface InventoryLine {
  productId: string;
  variantId?: string;
  qty: number;
}
export interface CountItem {
  id?: string;
  productId: string;
  variantId?: string | null;
  countedQty: number;
  expectedQty?: number | null;
  variance?: number | null;
}
export interface StockCount {
  id: string;
  branchId: string;
  status: "draft" | "posted";
  createdAt: string;
  postedAt: string | null;
  countedAt: string | null;
  notes: string | null;
  items: CountItem[];
}
export interface StockTransfer {
  id: string;
  fromBranchId: string;
  toBranchId: string;
  createdAt: string;
  note: string | null;
  lines: InventoryLine[];
}
export interface ExpiryReport {
  asOf: string;
  warningDays: number;
  batches: {
    id: string;
    productId: string;
    productName: string;
    variantId: string | null;
    variantName: string | null;
    receivedQty: number;
    remainingQty: number;
    expiryDate: string;
    daysLeft: number;
    unitCostC: number | null;
  }[];
}
const base = (branchId: string) => `/portal/branches/${branchId}/stock`;
export const listTransfers = (branchId: string) =>
  apiFetch<StockTransfer[]>(`${base(branchId)}/transfers`);
export const transferStock = (
  branchId: string,
  input: { id: string; toBranchId: string; lines: InventoryLine[]; note?: string },
) => apiFetch<StockTransfer>(`${base(branchId)}/transfers`, { method: "POST", body: input });
export const listCounts = (branchId: string) => apiFetch<StockCount[]>(`${base(branchId)}/counts`);
export const createCount = (
  branchId: string,
  input: { id: string; notes?: string; items: CountItem[] },
) => apiFetch<StockCount>(`${base(branchId)}/counts`, { method: "POST", body: input });
export const updateCount = (
  branchId: string,
  id: string,
  input: { notes?: string; items: CountItem[] },
) => apiFetch<StockCount>(`${base(branchId)}/counts/${id}`, { method: "PUT", body: input });
export const postCount = (branchId: string, id: string) =>
  apiFetch<StockCount>(`${base(branchId)}/counts/${id}/post`, { method: "POST" });
export const getExpiry = (branchId: string) => apiFetch<ExpiryReport>(`${base(branchId)}/expiry`);
