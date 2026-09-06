"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createOwner } from "@/lib/api/admin";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["name", "email", "maxBusinesses"] as const;

export async function createOwnerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const raw = String(formData.get("maxBusinesses") ?? "1").trim();
  const maxBusinesses = Number.parseInt(raw, 10);

  if (!Number.isInteger(maxBusinesses) || maxBusinesses < 1 || maxBusinesses > 1000) {
    return { fieldErrors: { maxBusinesses: "Enter a whole number between 1 and 1000." } };
  }

  let ownerId: string;
  try {
    const owner = await createOwner({ name, email, maxBusinesses });
    ownerId = owner.id;
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath("/admin");
  redirect(`/admin/owners/${ownerId}?invited=1`);
}
