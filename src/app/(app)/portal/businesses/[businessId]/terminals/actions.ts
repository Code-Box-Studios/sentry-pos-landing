"use server";

import { revalidatePath } from "next/cache";
import { unpairTerminal } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function unpairTerminalAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await unpairTerminal(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/terminals`);
  return { done: true };
}
