"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/api/auth";
import { writePreauthToken, writeSession } from "@/lib/auth/session";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["email", "password"] as const;

/** Only same-origin absolute paths are honoured, so `next` cannot become an open redirect. */
function safeNext(candidate: FormDataEntryValue | null, role: string): string {
  const home = role === "platform_admin" ? "/admin" : "/portal";
  if (typeof candidate !== "string") return home;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return home;
  const admin = candidate.startsWith("/admin");
  // Sending an owner to an admin URL would only bounce off middleware. Go home instead.
  return admin === (role === "platform_admin") ? candidate : home;
}

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      fieldErrors: {
        ...(email ? {} : { email: "Enter your email address." }),
        ...(password ? {} : { password: "Enter your password." }),
      },
    };
  }

  let destination: string;
  try {
    const result = await login(email, password);

    if ("accessToken" in result) {
      await writeSession(result.accessToken, result.refreshToken);
      destination = safeNext(formData.get("next"), result.role);
    } else {
      await writePreauthToken(result.preAuthToken);
      destination = "totpRequired" in result ? "/login/totp" : "/login/totp/setup";
    }
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  // redirect() signals by throwing, so it must sit outside the try — inside, the catch
  // would treat the navigation as a failure and re-render the form.
  redirect(destination);
}
