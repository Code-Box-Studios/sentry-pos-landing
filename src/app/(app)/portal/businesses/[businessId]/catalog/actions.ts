"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createProduct,
  deleteProduct,
  setProductModifierGroups,
  updateProduct,
  type VariantInput,
} from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
import { pesosToCentavos } from "@/lib/money";

const PRODUCT_FIELDS = [
  "categoryId",
  "name",
  "sku",
  "barcode",
  "priceC",
  "costC",
  "soldBy",
  "lowStockThreshold",
] as const;

/** "" → undefined, so an untouched optional field is omitted rather than sent as empty. */
function optionalText(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? undefined : value;
}

/**
 * Reads the repeated variant inputs back into the replace-set the API expects. The form
 * posts parallel arrays (`variantId[]`, `variantName[]`, …); a row with a blank name is
 * treated as an empty row the user left behind, not as a variant to create.
 */
function variantsFrom(formData: FormData): { variants: VariantInput[] } | { error: string } {
  const ids = formData.getAll("variantId").map(String);
  const names = formData.getAll("variantName").map(String);
  const prices = formData.getAll("variantPrice").map(String);
  const skus = formData.getAll("variantSku").map(String);
  const barcodes = formData.getAll("variantBarcode").map(String);

  const variants: VariantInput[] = [];
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i].trim();
    if (name === "") continue;

    const priceC = pesosToCentavos(prices[i] ?? "");
    if (priceC === null) {
      return { error: `Enter a price for the variant "${name}".` };
    }

    const id = (ids[i] ?? "").trim();
    variants.push({
      ...(id ? { id } : {}),
      name,
      priceC,
      ...(skus[i]?.trim() ? { sku: skus[i].trim() } : {}),
      ...(barcodes[i]?.trim() ? { barcode: barcodes[i].trim() } : {}),
    });
  }
  return { variants };
}

export async function saveProductAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "").trim();

  const priceC = pesosToCentavos(String(formData.get("price") ?? ""));
  if (priceC === null) {
    return { fieldErrors: { priceC: "Enter a price, for example 120.50." } };
  }

  const rawCost = String(formData.get("cost") ?? "").trim();
  const costC = rawCost === "" ? undefined : pesosToCentavos(rawCost);
  if (costC === null) {
    return { fieldErrors: { costC: "Enter a cost, or leave it blank." } };
  }

  const variantResult = variantsFrom(formData);
  if ("error" in variantResult) return { message: variantResult.error };

  const sku = optionalText(formData, "sku");
  const barcode = optionalText(formData, "barcode");
  const soldBy = String(formData.get("soldBy") ?? "unit") === "weight" ? "weight" : "unit";

  const input = {
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    priceC,
    ...(costC === undefined ? {} : { costC }),
    ...(sku ? { sku } : {}),
    ...(barcode ? { barcode } : {}),
    soldBy: soldBy as "unit" | "weight",
    trackStock: formData.get("trackStock") === "on",
    trackExpiry: formData.get("trackExpiry") === "on",
    active: formData.get("active") === "on",
    // Replace-set: always send the full list, because this form always shows the full list.
    // A form that showed only some variants would have to omit the key instead.
    variants: variantResult.variants,
  };

  let productId: string;
  try {
    const saved = id ? await updateProduct(id, input) : await createProduct(businessId, input);
    productId = saved.id;
  } catch (error) {
    return toFormState(error, PRODUCT_FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/catalog`);
  redirect(`/portal/businesses/${businessId}/catalog/${productId}?saved=1`);
}

export async function deleteProductAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteProduct(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/catalog`);
  return { done: true };
}

export async function setProductGroupsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  // Every checkbox posts only when checked, so this IS the complete desired set.
  const groupIds = formData.getAll("groupId").map(String).filter(Boolean);

  try {
    await setProductModifierGroups(productId, groupIds);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/catalog/${productId}`);
  return { done: true };
}
