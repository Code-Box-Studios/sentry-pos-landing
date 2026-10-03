"use server";
import { revalidatePath } from "next/cache";
import { uploadMedia, removeMedia } from "@/lib/api/media";
import { toFormState, type FormState } from "@/lib/forms/form-state";
export async function saveMediaAction(_state: FormState, form: FormData): Promise<FormState> {
  const kind = form.get("kind");
  const id = String(form.get("id") ?? "");
  if (kind !== "business" && kind !== "product") return { message: "Unknown image type." };
  try {
    if (form.get("operation") === "remove") await removeMedia(kind, id);
    else {
      const file = form.get("file");
      if (!(file instanceof File) || !file.size)
        return { fieldErrors: { file: "Choose an image." } };
      if (
        file.size > 4 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        return { fieldErrors: { file: "Use a JPEG, PNG or WebP image up to 4 MB." } };
      const body = new FormData();
      body.set("file", file);
      await uploadMedia(kind, id, body);
    }
  } catch (error) {
    return toFormState(error, ["file"]);
  }
  revalidatePath("/portal/businesses", "layout");
  return { done: true };
}
