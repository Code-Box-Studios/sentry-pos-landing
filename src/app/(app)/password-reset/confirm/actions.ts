"use server";

import { redirect } from "next/navigation";
import { confirmPasswordReset } from "@/lib/api/auth";
import { clearSession } from "@/lib/auth/session";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function confirmResetAction(
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
    await confirmPasswordReset(token, password);
    // The API revokes every refresh token on a reset. Whatever is in this browser's cookies
    // is already dead — drop it rather than leaving a session that 401s on its next move.
    await clearSession();
  } catch (error) {
    return toFormState(error, ["password"]);
  }

  redirect("/login?reset=1");
}
