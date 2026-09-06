"use server";

import { requestPasswordReset } from "@/lib/api/auth";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function requestResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { fieldErrors: { email: "Enter your email address." } };

  try {
    await requestPasswordReset(email);
  } catch (error) {
    return toFormState(error, ["email"]);
  }

  // The API answers 204 whether or not the address exists, specifically so this screen
  // cannot be used to discover who has an account. Never branch on the result.
  return { done: true };
}
