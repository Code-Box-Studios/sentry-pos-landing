"use server";

import { revalidatePath } from "next/cache";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["name", "sortOrder"] as const;

/** "" → undefined (omit the key); anything unparseable → NaN, which the caller rejects. */
function sortOrderFrom(formData: FormData): number | undefined {
  const raw = String(formData.get("sortOrder") ?? "").trim();
  if (raw === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export async function createCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = sortOrderFrom(formData);

  if (Number.isNaN(sortOrder)) {
    return { fieldErrors: { sortOrder: "Enter a whole number, or leave it blank." } };
  }

  try {
    await createCategory(businessId, { name, ...(sortOrder === undefined ? {} : { sortOrder }) });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/categories`);
  return { done: true };
}

export async function updateCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = sortOrderFrom(formData);

  if (Number.isNaN(sortOrder)) {
    return { fieldErrors: { sortOrder: "Enter a whole number, or leave it blank." } };
  }

  try {
    await updateCategory(id, { name, ...(sortOrder === undefined ? {} : { sortOrder }) });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/categories`);
  return { done: true };
}

export async function deleteCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteCategory(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/categories`);
  // Products reference categories, so their list can change shape too.
  revalidatePath(`/portal/businesses/${businessId}/catalog`);
  return { done: true };
}
