"use server";
import { revalidatePath } from "next/cache";
import { readNotification, readAllNotifications } from "@/lib/api/notifications";
import { toFormState, type FormState } from "@/lib/forms/form-state";
export async function readNotificationAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    if (form.get("all") === "yes") await readAllNotifications();
    else await readNotification(String(form.get("id") ?? ""));
  } catch (error) {
    return toFormState(error, []);
  }
  revalidatePath("/portal", "layout");
  return { done: true };
}
