"use server";

import { revalidatePath } from "next/cache";
import { reinstateOwner, suspendOwner } from "@/lib/api/admin";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function suspendOwnerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const ownerId = String(formData.get("ownerId") ?? "");
  const tier = String(formData.get("tier") ?? "");
  if (tier !== "default" && tier !== "hard") {
    return { message: "Choose which kind of suspension to apply." };
  }

  try {
    await suspendOwner(ownerId, tier);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  revalidatePath("/admin");
  return { done: true };
}

export async function reinstateOwnerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const ownerId = String(formData.get("ownerId") ?? "");

  try {
    await reinstateOwner(ownerId);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  revalidatePath("/admin");
  return { done: true };
}
