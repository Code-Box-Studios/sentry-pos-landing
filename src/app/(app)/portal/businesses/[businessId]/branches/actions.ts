"use server";

import { revalidatePath } from "next/cache";
import { createBranch, deleteBranch, updateBranch } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["name", "code", "address"] as const;
const BRANCH_CODE = /^[A-Z0-9]{2,6}$/;

export async function saveBranchAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  if (!BRANCH_CODE.test(code)) {
    return { fieldErrors: { code: "Use 2–6 uppercase letters or digits, for example MKT." } };
  }

  try {
    // The code is part of every receipt number this branch has already issued, so it is
    // never sent on an update — the UI shows it read-only once the branch exists.
    if (id) await updateBranch(id, { name, address });
    else await createBranch(businessId, { name, code, address });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/branches`);
  return { done: true };
}

export async function deleteBranchAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteBranch(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/branches`);
  return { done: true };
}
