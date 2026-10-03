"use server";
import { ApiError, NetworkError } from "@/lib/api/errors";
import type { OperationState } from "./action-state";
import { revalidatePath } from "next/cache";
import { createCount, updateCount, postCount, transferStock } from "@/lib/api/inventory";
import { getBranch, listBranches, listProducts } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
import { parseQuantity } from "@/lib/money";
import { toOptions } from "../stock-options";
import { readPortalRole } from "@/lib/auth/portal-role";
import { getManagerContext, getManagerTransferBranches } from "@/lib/api/manager";
class InventoryInputError extends Error {}
function operationError(error: unknown): OperationState {
  if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500))
    return {
      uncertain: true,
      message:
        "The response was interrupted. These quantities are locked because the operation may already be saved. Retry to retrieve the result safely before starting another operation.",
    };
  return error instanceof InventoryInputError ? { message: error.message } : toFormState(error, []);
}
async function scope(form: FormData) {
  const businessId = String(form.get("businessId") ?? "");
  const branchId = String(form.get("branchId") ?? "");
  if (await readPortalRole() === "manager") {
    const context = await getManagerContext();
    if (context.business.id !== businessId || !context.branches.some((branch) => branch.id === branchId)) {
      throw new InventoryInputError("Choose a branch assigned to your manager account.");
    }
    return { businessId, branchId, isManager: true };
  }
  const branch = await getBranch(branchId);
  if (branch.businessId !== businessId)
    throw new InventoryInputError("The branch does not belong to this business.");
  return { businessId, branchId, isManager: false };
}
async function lines(form: FormData, businessId: string, allowZero: boolean) {
  const allowed = new Set(toOptions(await listProducts(businessId)).map((option) => option.value));
  const targets = form.getAll("target");
  const quantities = form.getAll("qty");
  const seen = new Set<string>();
  const result = [];
  for (let i = 0; i < targets.length; i++) {
    const raw = String(quantities[i] ?? "").trim();
    if (!raw) continue;
    const target = String(targets[i]);
    const qty = parseQuantity(raw);
    if (!allowed.has(target))
      throw new InventoryInputError("Choose a tracked product from this business.");
    if (seen.has(target)) throw new InventoryInputError("Each item can appear only once.");
    if (qty === null || qty < 0 || (!allowZero && qty === 0))
      throw new InventoryInputError(
        allowZero
          ? "Counts must be zero or greater, with at most 3 decimals."
          : "Transfer quantities must be above zero, with at most 3 decimals.",
      );
    seen.add(target);
    const [productId, variantId] = target.split(":");
    result.push({ productId, ...(variantId ? { variantId } : {}), qty });
  }
  if (!result.length) throw new InventoryInputError("Enter a quantity for at least one item.");
  return result;
}
function refresh(businessId: string, branchId: string) {
  revalidatePath(`/portal/businesses/${businessId}/branches/${branchId}/stock`);
  revalidatePath(`/portal/businesses/${businessId}/branches/${branchId}/stock/operations`);
  revalidatePath("/portal/analytics/inventory");
  revalidatePath("/portal/manager/stock");
}
export async function transferAction(_state: FormState, form: FormData): Promise<OperationState> {
  try {
    const { businessId, branchId, isManager } = await scope(form);
    const toBranchId = String(form.get("toBranchId") ?? "");
    const branches = isManager ? await getManagerTransferBranches() : await listBranches(businessId);
    if (toBranchId === branchId || !branches.some((branch) => branch.id === toBranchId))
      return { fieldErrors: { toBranchId: "Choose another branch in this business." } };
    const items = await lines(form, businessId, false);
    await transferStock(branchId, {
      id: String(form.get("id") ?? ""),
      toBranchId,
      lines: items,
      note: String(form.get("note") ?? ""),
    });
    refresh(businessId, branchId);
    refresh(businessId, toBranchId);
    return { done: true };
  } catch (error) {
    return operationError(error);
  }
}
export async function saveCountAction(_state: FormState, form: FormData): Promise<OperationState> {
  try {
    const { businessId, branchId } = await scope(form);
    const items = (await lines(form, businessId, true)).map(({ qty, ...target }) => ({
      ...target,
      countedQty: qty,
    }));
    const input = { notes: String(form.get("note") ?? ""), items };
    const id = String(form.get("id") ?? "");
    if (form.get("editing") === "yes") await updateCount(branchId, id, input);
    else await createCount(branchId, { id, ...input });
    refresh(businessId, branchId);
    return { done: true };
  } catch (error) {
    return operationError(error);
  }
}
export async function postCountAction(_state: FormState, form: FormData): Promise<OperationState> {
  if (form.get("confirmation") !== "on")
    return { message: "Confirm that posting replaces stock with these physical counts." };
  try {
    const { businessId, branchId } = await scope(form);
    await postCount(branchId, String(form.get("id") ?? ""));
    refresh(businessId, branchId);
    return { done: true };
  } catch (error) {
    return toFormState(error, []);
  }
}
