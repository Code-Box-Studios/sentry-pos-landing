"use server";

import { revalidatePath } from "next/cache";
import { adjustStock, receiveStock, type AdjustReason } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
import { parseQuantity, pesosToCentavos } from "@/lib/money";

const REASONS: AdjustReason[] = ["damage", "expiry", "theft_loss", "count_correction", "other"];

/**
 * The selects post `productId` or `productId:variantId` in one value, because a variant is
 * only meaningful alongside its product and two coupled selects would let them disagree.
 */
function splitTarget(raw: string): { productId: string; variantId?: string } | null {
  const [productId, variantId] = raw.split(":");
  if (!productId) return null;
  return variantId ? { productId, variantId } : { productId };
}

export async function receiveStockAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const branchId = String(formData.get("branchId") ?? "");

  const target = splitTarget(String(formData.get("target") ?? ""));
  if (!target) return { fieldErrors: { target: "Choose a product." } };

  const qty = parseQuantity(String(formData.get("qty") ?? ""));
  if (qty === null || qty <= 0) {
    return { fieldErrors: { qty: "Enter a quantity above zero, with at most 3 decimals." } };
  }

  const rawCost = String(formData.get("unitCost") ?? "").trim();
  const unitCostC = rawCost === "" ? undefined : pesosToCentavos(rawCost);
  if (unitCostC === null) {
    return { fieldErrors: { unitCost: "Enter a unit cost, or leave it blank." } };
  }

  const expiryDate = String(formData.get("expiryDate") ?? "").trim();

  try {
    await receiveStock(branchId, [
      {
        ...target,
        qty,
        ...(unitCostC === undefined ? {} : { unitCostC }),
        // The API wants an ISO date-time; a date input gives a bare date.
        ...(expiryDate ? { expiryDate: `${expiryDate}T00:00:00.000Z` } : {}),
      },
    ]);
  } catch (error) {
    return toFormState(error, ["qty", "unitCostC", "expiryDate"]);
  }

  revalidatePath(`/portal/businesses/${businessId}/branches/${branchId}/stock`);
  return { done: true };
}

export async function adjustStockAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const branchId = String(formData.get("branchId") ?? "");

  const target = splitTarget(String(formData.get("target") ?? ""));
  if (!target) return { fieldErrors: { target: "Choose a product." } };

  // NOT a delta — the absolute level you are correcting to. The API records the difference.
  const newQty = parseQuantity(String(formData.get("newQty") ?? ""));
  if (newQty === null) {
    return { fieldErrors: { newQty: "Enter the new count, with at most 3 decimals." } };
  }

  const reason = String(formData.get("reasonCategory") ?? "");
  if (!REASONS.includes(reason as AdjustReason)) {
    return { fieldErrors: { reasonCategory: "Choose a reason." } };
  }

  const note = String(formData.get("note") ?? "").trim();

  try {
    await adjustStock(branchId, {
      ...target,
      newQty,
      reasonCategory: reason as AdjustReason,
      ...(note ? { note } : {}),
    });
  } catch (error) {
    return toFormState(error, ["newQty", "note"]);
  }

  revalidatePath(`/portal/businesses/${businessId}/branches/${branchId}/stock`);
  return { done: true };
}
