"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBusiness, deleteBusiness, getBusiness } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
export async function createBusinessAction(_state: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const type = String(form.get("type") ?? "");
  const rawTax = String(form.get("taxRate") ?? "");
  const tax = Number(rawTax);
  const dayStartTime = String(form.get("dayStartTime") ?? "00:00");
  if (!name) return { fieldErrors: { name: "Enter a business name." } };
  if (type !== "retail" && type !== "fnb" && type !== "mixed")
    return { fieldErrors: { type: "Choose a business type." } };
  if (!rawTax.trim() || !Number.isFinite(tax) || tax < 0 || tax > 99.99)
    return { fieldErrors: { taxRate: "Enter a percentage between 0 and 99.99." } };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dayStartTime))
    return { fieldErrors: { dayStartTime: "Use 24-hour HH:mm." } };
  let id: string;
  try {
    id = (await createBusiness({ name, type, taxRate: tax / 100, dayStartTime })).id;
  } catch (error) {
    return toFormState(error, ["name", "type", "taxRate", "dayStartTime"]);
  }
  revalidatePath("/portal");
  revalidatePath("/portal/businesses");
  redirect(`/portal/businesses/${id}/branches`);
}
export async function deleteBusinessAction(_state: FormState, form: FormData): Promise<FormState> {
  const id = String(form.get("businessId") ?? "");
  try {
    const business = await getBusiness(id);
    if (String(form.get("confirmation") ?? "") !== business.name)
      return { fieldErrors: { confirmation: "Type the business name exactly to confirm." } };
    await deleteBusiness(id);
  } catch (error) {
    return toFormState(error, []);
  }
  revalidatePath("/portal");
  revalidatePath("/portal/businesses");
  redirect("/portal/businesses");
}
