"use server";

import { setRefundPin } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function setRefundPinAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const pin = String(formData.get("pin") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!/^\d{6}$/.test(pin)) {
    return { fieldErrors: { pin: "The PIN must be exactly 6 digits." } };
  }
  if (pin !== confirm) {
    return { fieldErrors: { confirm: "The two PINs do not match." } };
  }

  try {
    await setRefundPin(pin);
  } catch (error) {
    return toFormState(error, ["pin"]);
  }

  return { done: true };
}
