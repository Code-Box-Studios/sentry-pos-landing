"use server";
import { revalidatePath } from "next/cache";
import {
  createStaff,
  updateStaff,
  controlStaff,
  type StaffControl,
  type StaffInput,
} from "@/lib/api/staff";
import { toFormState } from "@/lib/forms/form-state";
import type { StaffState } from "./action-state";

const FIELDS = ["name", "role", "email", "branchIds"];
function refresh(businessId: string) {
  revalidatePath(`/portal/businesses/${businessId}/staff`);
}
export async function saveStaffAction(
  _state: StaffState,
  form: FormData,
): Promise<StaffState> {
  const businessId = String(form.get("businessId") ?? "");
  const userId = String(form.get("userId") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const role = String(form.get("role") ?? "");
  const email =
    String(form.get("email") ?? "")
      .trim()
      .toLowerCase() || null;
  const branchIds = [...new Set(form.getAll("branchIds").map(String))];
  if (!name) return { fieldErrors: { name: "Enter this person's name." } };
  if (role !== "manager" && role !== "cashier")
    return { fieldErrors: { role: "Choose manager or cashier." } };
  if (role === "manager" && !email)
    return {
      fieldErrors: { email: "Managers need an email for portal access." },
    };
  if (!branchIds.length)
    return { fieldErrors: { branchIds: "Assign at least one branch." } };
  const input: StaffInput = { name, role, email, branchIds };
  try {
    const result = userId
      ? await updateStaff(businessId, userId, input)
      : await createStaff(businessId, input);
    return { done: true, ...result };
  } catch (error) {
    return toFormState(error, FIELDS);
  } finally {
    // Delivery failure can leave a pending member. Show it so the owner can
    // resend/reset instead of creating another PIN-only identity.
    refresh(businessId);
  }
}
export async function staffControlAction(
  _state: StaffState,
  form: FormData,
): Promise<StaffState> {
  const businessId = String(form.get("businessId") ?? "");
  const userId = String(form.get("userId") ?? "");
  const intent = String(form.get("intent") ?? "");
  const allowed: readonly string[] = [
    "reset-pin",
    "reset-password",
    "resend",
    "deactivate",
    "reactivate",
  ];
  if (!allowed.includes(intent))
    return { message: "Choose a staff access action." };
  if (form.get("confirmation") !== "on")
    return { message: "Confirm this access change first." };
  try {
    return {
      done: true,
      ...(await controlStaff(businessId, userId, intent as StaffControl)),
    };
  } catch (error) {
    return toFormState(error, []);
  } finally {
    refresh(businessId);
  }
}
