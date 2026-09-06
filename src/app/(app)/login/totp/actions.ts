"use server";

import { redirect } from "next/navigation";
import { totpEnable, totpVerify } from "@/lib/api/auth";
import { clearPreauthToken, readPreauthToken, writeSession } from "@/lib/auth/session";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["code"] as const;

/**
 * A type, not a value — `"use server"` modules may export only async functions, and a type
 * export is erased before that rule is checked. Consumers must use `import type`.
 */
export interface TotpEnableState extends FormState {
  recoveryCodes?: string[];
}

export async function verifyTotpAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { fieldErrors: { code: "Enter the code from your authenticator." } };

  const preAuthToken = await readPreauthToken();
  // The five-minute window closed. Start again rather than failing cryptically.
  if (!preAuthToken) redirect("/login?expired=1");

  try {
    const { accessToken, refreshToken } = await totpVerify(preAuthToken, code);
    await writeSession(accessToken, refreshToken);
    await clearPreauthToken();
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  redirect("/admin");
}

/**
 * Enrolment. On success the recovery codes come back once and are handed to the client to
 * display — the session is deliberately NOT created here: the admin must confirm they have
 * saved the codes, then sign in again with their new authenticator.
 */
export async function enableTotpAction(
  _previous: TotpEnableState,
  formData: FormData,
): Promise<TotpEnableState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { fieldErrors: { code: "Enter the six-digit code." } };

  const preAuthToken = await readPreauthToken();
  if (!preAuthToken) redirect("/login?expired=1");

  try {
    const { recoveryCodes } = await totpEnable(preAuthToken, code);
    return { done: true, recoveryCodes };
  } catch (error) {
    return toFormState(error, FIELDS);
  }
}
