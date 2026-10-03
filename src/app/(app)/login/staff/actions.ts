"use server";
import { redirect } from "next/navigation";
import { setupManager, setupStaffPassword } from "@/lib/api/auth";
import { writeSession } from "@/lib/auth/session";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function setupStaffAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const temporaryPin = String(form.get("temporaryPin") ?? "");
  const password = String(form.get("password") ?? "");
  const permanentPin = String(form.get("permanentPin") ?? "");
  const passwordOnly = form.get("mode") === "password";
  if (!email)
    return { fieldErrors: { email: "Enter the email your owner used." } };
  if (!/^\d{6}$/.test(temporaryPin))
    return {
      fieldErrors: {
        temporaryPin: "Enter your emailed six-digit temporary PIN.",
      },
    };
  if (password.length < 8)
    return { fieldErrors: { password: "Use at least eight characters." } };
  if (password !== form.get("confirmPassword"))
    return { fieldErrors: { confirmPassword: "Passwords do not match." } };
  if (!passwordOnly) {
    if (!/^\d{6}$/.test(permanentPin) || permanentPin === temporaryPin)
      return {
        fieldErrors: {
          permanentPin:
            "Choose a new six-digit terminal PIN, different from the temporary PIN.",
        },
      };
    if (permanentPin !== form.get("confirmPin"))
      return { fieldErrors: { confirmPin: "PINs do not match." } };
  }
  try {
    const input = { email, temporaryPin, password };
    const result = passwordOnly
      ? await setupStaffPassword(input)
      : await setupManager({ ...input, permanentPin });
    await writeSession(result.accessToken, result.refreshToken);
  } catch (error) {
    return toFormState(error, [
      "email",
      "temporaryPin",
      "password",
      "permanentPin",
    ]);
  }
  redirect("/portal/manager");
}
