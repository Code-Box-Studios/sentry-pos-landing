"use server";

import { revalidatePath } from "next/cache";
import { reinstateOwner, suspendOwner, updateOwner } from "@/lib/api/admin";
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

export async function updateOwnerAction(_state: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("ownerId") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const raw = String(form.get("maxBusinesses") ?? "");
  const maxBusinesses = Number(raw);
  if (!name) return { fieldErrors: { name: "Enter the owner's name." } };
  if (
    !/^\d+$/.test(raw) ||
    !Number.isInteger(maxBusinesses) ||
    maxBusinesses < 1 ||
    maxBusinesses > 1000
  )
    return { fieldErrors: { maxBusinesses: "Enter a whole number between 1 and 1000." } };
  try {
    await updateOwner(id, { name, maxBusinesses });
  } catch (error) {
    return toFormState(error, ["name", "maxBusinesses"]);
  }
  revalidatePath(`/admin/owners/${id}`);
  revalidatePath("/admin");
  return { done: true };
}
