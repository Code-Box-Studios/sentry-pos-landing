import "server-only";
import { apiFetch } from "./fetch";

export interface StaffMember {
  id: string;
  userId: string;
  name: string;
  role: "manager" | "cashier";
  email: string | null;
  status: "pending" | "active" | "deactivated";
  branchIds: string[];
  createdAt: string;
}
export interface StaffInput {
  name: string;
  role: StaffMember["role"];
  email: string | null;
  branchIds: string[];
}
export interface StaffResult {
  staff: StaffMember;
  temporaryPin?: string;
}
export type StaffControl =
  "reset-pin" | "reset-password" | "resend" | "deactivate" | "reactivate";
const base = (businessId: string) =>
  `/portal/businesses/${encodeURIComponent(businessId)}/staff`;
export const listStaff = (businessId: string) =>
  apiFetch<StaffMember[]>(base(businessId));
export const createStaff = (businessId: string, input: StaffInput) =>
  apiFetch<StaffResult>(base(businessId), { method: "POST", body: input });
export const updateStaff = (
  businessId: string,
  userId: string,
  input: StaffInput,
) =>
  apiFetch<StaffResult>(`${base(businessId)}/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: input,
  });
export async function controlStaff(
  businessId: string,
  userId: string,
  intent: StaffControl,
): Promise<StaffResult> {
  const result = await apiFetch<StaffResult | StaffMember>(
    `${base(businessId)}/${encodeURIComponent(userId)}/${intent}`,
    { method: "POST" },
  );
  return "staff" in result ? result : { staff: result };
}
