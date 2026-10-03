"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { closeAccount, resetDemo } from "@/lib/api/lifecycle";
import { getBusiness } from "@/lib/api/portal";
import { clearSession } from "@/lib/auth/session";
import { toFormState, type FormState } from "@/lib/forms/form-state";
export async function closeAccountAction(_state: FormState, form: FormData): Promise<FormState> {
  if (form.get("confirmation") !== "CLOSE MY ACCOUNT")
    return { fieldErrors: { confirmation: "Type CLOSE MY ACCOUNT exactly to confirm." } };
  const jar = await cookies();
  const exportId = jar.get("sentry_export_id")?.value;
  if (!exportId) return { message: "Download your account export first, then confirm closure." };
  let purgeAfter: string;
  try {
    ({ purgeAfter } = await closeAccount(exportId));
  } catch (error) {
    return toFormState(error, []);
  }
  await clearSession();
  jar.set("sentry_export_id", "", { path: "/portal/settings", maxAge: 0 });
  redirect(`/account-closed?purgeAfter=${encodeURIComponent(purgeAfter)}`);
}
export async function resetDemoAction(_state: FormState, form: FormData): Promise<FormState> {
  if (form.get("confirmation") !== "RESET DEMO")
    return { fieldErrors: { confirmation: "Type RESET DEMO exactly to confirm." } };
  const businessId = String(form.get("businessId") ?? "");
  let newId: string;
  try {
    const business = await getBusiness(businessId);
    if (!business.isDemo) return { message: "Only a demo business can be reset." };
    ({ businessId: newId } = await resetDemo(businessId, String(form.get("id") ?? "")));
  } catch (error) {
    return toFormState(error, []);
  }
  revalidatePath("/portal/businesses");
  redirect(`/portal/businesses/${newId}`);
}
