"use server";

import { revalidatePath } from "next/cache";
import {
  createModifierGroup,
  deleteModifierGroup,
  updateModifierGroup,
  type ModifierInput,
} from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
import { pesosToCentavos } from "@/lib/money";

const FIELDS = ["name", "minSelect", "maxSelect"] as const;

/**
 * A price delta may be negative — "no cheese, minus ₱10" is a real modifier — so the sign is
 * parsed off the front and reapplied, since pesosToCentavos rejects negatives by design.
 */
function deltaFrom(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const negative = trimmed.startsWith("-");
  const magnitude = pesosToCentavos(negative ? trimmed.slice(1) : trimmed);
  if (magnitude === null) return null;
  return negative ? -magnitude : magnitude;
}

function modifiersFrom(formData: FormData): { modifiers: ModifierInput[] } | { error: string } {
  const ids = formData.getAll("modifierId").map(String);
  const names = formData.getAll("modifierName").map(String);
  const deltas = formData.getAll("modifierDelta").map(String);

  const modifiers: ModifierInput[] = [];
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i].trim();
    if (name === "") continue;

    const priceDeltaC = deltaFrom(deltas[i] ?? "");
    if (priceDeltaC === null) {
      return { error: `Enter a price change for "${name}", for example 15 or -10.` };
    }

    const id = (ids[i] ?? "").trim();
    modifiers.push({ ...(id ? { id } : {}), name, priceDeltaC });
  }
  return { modifiers };
}

export async function saveModifierGroupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "").trim();

  const minSelect = Number.parseInt(String(formData.get("minSelect") ?? "0"), 10);
  const maxSelect = Number.parseInt(String(formData.get("maxSelect") ?? "1"), 10);
  if (!Number.isInteger(minSelect) || !Number.isInteger(maxSelect)) {
    return { fieldErrors: { minSelect: "Enter whole numbers." } };
  }
  if (minSelect > maxSelect) {
    return { fieldErrors: { maxSelect: "Maximum must be at least the minimum." } };
  }

  const result = modifiersFrom(formData);
  if ("error" in result) return { message: result.error };

  const input = {
    name: String(formData.get("name") ?? "").trim(),
    minSelect,
    maxSelect,
    modifiers: result.modifiers,
  };

  try {
    if (id) await updateModifierGroup(id, input);
    else await createModifierGroup(businessId, input);
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/modifiers`);
  return { done: true };
}

export async function deleteModifierGroupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteModifierGroup(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/modifiers`);
  return { done: true };
}
