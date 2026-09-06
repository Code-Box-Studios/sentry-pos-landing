"use server";

import { revalidatePath } from "next/cache";
import { createDiscount, deleteDiscount, updateDiscount } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
import { pesosToCentavos } from "@/lib/money";

const FIELDS = ["name", "kind", "value", "appliesTo"] as const;

export async function saveDiscountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "percent") === "fixed" ? "fixed" : "percent";
  const rawValue = String(formData.get("value") ?? "").trim();

  // `value` is dual-purpose: 1-100 for a percentage, centavos for a fixed amount. Getting
  // this wrong is a silent 100x error, so the two paths are parsed separately.
  let value: number;
  if (kind === "percent") {
    const percent = Number(rawValue);
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      return { fieldErrors: { value: "Enter a whole percentage between 1 and 100." } };
    }
    value = percent;
  } else {
    const centavos = pesosToCentavos(rawValue);
    if (centavos === null || centavos < 1) {
      return { fieldErrors: { value: "Enter an amount, for example 50.00." } };
    }
    value = centavos;
  }

  const appliesToRaw = String(formData.get("appliesTo") ?? "line");
  const appliesTo = appliesToRaw === "order" ? "order" : appliesToRaw === "both" ? "both" : "line";

  const input = {
    name: String(formData.get("name") ?? "").trim(),
    kind,
    value,
    appliesTo,
    active: formData.get("active") === "on",
  } as const;

  try {
    if (id) await updateDiscount(id, input);
    else await createDiscount(businessId, input);
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/discounts`);
  return { done: true };
}

export async function deleteDiscountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteDiscount(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/discounts`);
  return { done: true };
}
