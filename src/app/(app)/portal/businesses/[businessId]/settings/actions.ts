"use server";

import { revalidatePath } from "next/cache";
import { updateBusiness, type BusinessInput } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = [
  "name",
  "type",
  "taxRate",
  "serviceChargeRate",
  "dayStartTime",
  "expiryWarningDays",
  "receiptHeader",
  "receiptFooter",
] as const;

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * The API takes rates as fractions in [0, 0.9999]; the form shows percentages, because "12"
 * is what a person means by 12% VAT. The column is Decimal(5,4), so 4 places is the limit —
 * rounding here rather than sending 0.12000000000000001 from a float divide.
 */
function rateFromPercent(raw: string): number | null {
  const percent = Number(raw.trim());
  if (!Number.isFinite(percent) || percent < 0 || percent > 99.99) return null;
  return Math.round((percent / 100) * 10_000) / 10_000;
}

export async function saveBusinessSettingsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");

  const taxRate = rateFromPercent(String(formData.get("taxRate") ?? ""));
  if (taxRate === null) {
    return { fieldErrors: { taxRate: "Enter a percentage between 0 and 99.99." } };
  }

  const serviceChargeRate = rateFromPercent(String(formData.get("serviceChargeRate") ?? "0"));
  if (serviceChargeRate === null) {
    return { fieldErrors: { serviceChargeRate: "Enter a percentage between 0 and 99.99." } };
  }

  const dayStartTime = String(formData.get("dayStartTime") ?? "").trim();
  if (!HHMM.test(dayStartTime)) {
    return { fieldErrors: { dayStartTime: "Use 24-hour HH:mm, for example 06:00." } };
  }

  const expiryWarningDays = Number.parseInt(String(formData.get("expiryWarningDays") ?? "7"), 10);
  if (!Number.isInteger(expiryWarningDays) || expiryWarningDays < 0 || expiryWarningDays > 365) {
    return { fieldErrors: { expiryWarningDays: "Enter a whole number of days, 0 to 365." } };
  }

  const typeRaw = String(formData.get("type") ?? "mixed");
  const type: BusinessInput["type"] =
    typeRaw === "retail" ? "retail" : typeRaw === "fnb" ? "fnb" : "mixed";

  try {
    await updateBusiness(businessId, {
      name: String(formData.get("name") ?? "").trim(),
      type,
      taxRate,
      serviceChargeRate,
      dayStartTime,
      expiryWarningDays,
      allowMiscItems: formData.get("allowMiscItems") === "on",
      receiptHeader: String(formData.get("receiptHeader") ?? ""),
      receiptFooter: String(formData.get("receiptFooter") ?? ""),
    });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/settings`);
  revalidatePath(`/portal/businesses/${businessId}`);
  return { done: true };
}
