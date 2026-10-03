"use client";
import type { OperationState } from "./action-state";
import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EMPTY_FORM_STATE } from "@/lib/forms/form-state";
import type { Branch } from "@/lib/api/types";
import type { StockCount } from "@/lib/api/inventory";
import type { StockOption } from "../stock-options";
import { transferAction, saveCountAction, postCountAction } from "./actions";
interface Props {
  businessId: string;
  branchId: string;
  options: StockOption[];
  branches: Pick<Branch, "id" | "name" | "businessId">[];
  requestId: string;
  count?: StockCount;
}
export function OperationForm({
  businessId,
  branchId,
  options,
  branches,
  requestId,
  count,
  mode,
}: Props & { mode: "transfer" | "count" }) {
  const [state, action, pending] = useActionState<OperationState, FormData>(
    mode === "transfer" ? transferAction : saveCountAction,
    EMPTY_FORM_STATE,
  );
  const [id] = useState(requestId);
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState(count?.notes ?? "");
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      options.map((option) => {
        const item = count?.items.find(
          (item) =>
            `${item.productId}${item.variantId ? `:${item.variantId}` : ""}` === option.value,
        );
        return [option.value, item ? String(item.countedQty) : ""];
      }),
    ),
  );
  if (state.done && !count)
    return (
      <div className="space-y-3">
        <Alert tone="info">
          {mode === "transfer"
            ? "Stock transferred."
            : "Draft saved. Review it below before posting."}
        </Alert>
        <Button className="rounded-full"
          onClick={() => {
            window.location.reload();
          }}
        >
          Start another {mode}
        </Button>
      </div>
    );
  const destinations = branches.filter(
    (branch) => branch.businessId === businessId && branch.id !== branchId,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="id" value={count?.id ?? id} />
      {count && <input type="hidden" name="editing" value="yes" />}
      {state.message && <Alert>{state.message}</Alert>}
      {state.done && <Alert tone="info">Draft updated.</Alert>}
      {state.uncertain && mode === "transfer" && (
        <input type="hidden" name="toBranchId" value={destination} />
      )}
      {mode === "transfer" && (
        <Field name="toBranchId" label="Destination branch" error={state.fieldErrors?.toBranchId}>
          <Select
            name="toBranchId"
            required
            disabled={state.uncertain}
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="" disabled>
              Choose destination
            </option>
            {destinations.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <p className="text-sm text-steel">
        {mode === "count"
          ? "Enter the physical quantity for items counted. Leave uncounted items blank. Saving a draft does not change stock."
          : "Enter quantities to move. Leave other items blank. Both branches update together when you submit."}
      </p>
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {options.map((option) => {
          return (
            <label key={option.value} className="flex items-center justify-between gap-3 text-sm">
              <span>{option.label}</span>
              <input type="hidden" name="target" value={option.value} />
              <Input
                aria-label={`${option.label} quantity`}
                name="qty"
                readOnly={state.uncertain}
                type="number"
                min={mode === "count" ? "0" : "0.001"}
                step="0.001"
                value={quantities[option.value] ?? ""}
                onChange={(event) =>
                  setQuantities((current) => ({ ...current, [option.value]: event.target.value }))
                }
                className="max-w-36"
              />
            </label>
          );
        })}
      </div>
      <Field name={`note-${count?.id ?? mode}`} label="Notes">
        <Input
          name="note"
          readOnly={state.uncertain}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
        />
      </Field>
      <Button
        type="submit"
        className="rounded-full"
        disabled={pending || !options.length || (mode === "transfer" && !destinations.length)}
      >
        {pending
          ? "Saving…"
          : state.uncertain
            ? "Retry original operation"
            : mode === "transfer"
              ? "Transfer stock"
              : "Save draft count"}
      </Button>
    </form>
  );
}
export function PostCountForm({
  businessId,
  branchId,
  id,
}: {
  businessId: string;
  branchId: string;
  id: string;
}) {
  const [state, action, pending] = useActionState(postCountAction, EMPTY_FORM_STATE);
  return (
    <form action={action} className="mt-4 space-y-3 border-t pt-4">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="id" value={id} />
      {state.message && <Alert>{state.message}</Alert>}
      <label className="flex gap-2 text-sm">
        <input type="checkbox" name="confirmation" required />I have reviewed this saved draft.
        Posting replaces current stock with these physical quantities and cannot be undone.
      </label>
      <Button className="rounded-full" type="submit" disabled={pending}>
        {pending ? "Posting…" : "Post saved count"}
      </Button>
    </form>
  );
}
