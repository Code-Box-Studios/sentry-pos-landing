"use server";

import { redirect } from "next/navigation";
import { acceptInvite } from "@/lib/api/auth";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function acceptInviteAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { fieldErrors: { password: "Use at least 8 characters." } };
  }
  if (password !== confirm) {
    return { fieldErrors: { confirm: "The two passwords do not match." } };
  }

  try {
    await acceptInvite(token, password);
  } catch (error) {
    return toFormState(error, ["password"]);
  }

  redirect("/login?activated=1");
}
