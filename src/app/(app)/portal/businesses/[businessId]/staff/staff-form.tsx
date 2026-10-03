"use client";
import { useActionState, useId, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button as BaseButton, type ButtonProps } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { StaffMember } from "@/lib/api/staff";
import type { StaffState, StaffFormAction } from "./action-state";

function Button({ className, ...props }: ButtonProps) {
  return (
    <BaseButton className={`rounded-full ${className ?? ""}`} {...props} />
  );
}

export function OneTimePin({ pin }: { pin: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed)
    return (
      <p className="text-sm text-steel">
        PIN hidden. Reset it to issue a fresh one if needed.
      </p>
    );
  return (
    <div
      role="status"
      className="space-y-3 rounded-xl border border-brand-green-dark/25 bg-brand-green-soft p-4"
    >
      <p className="text-sm font-semibold text-ink">
        Share this temporary PIN privately
      </p>
      <p className="font-mono text-3xl tracking-[0.3em] text-ink">{pin}</p>
      <p className="text-sm text-slate">
        Expires in 15 minutes. The cashier must choose a new six-digit PIN at
        the terminal. This PIN is shown only here.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setDismissed(true)}
      >
        I have shared this PIN
      </Button>
    </div>
  );
}
export function StaffForm({
  businessId,
  branches,
  action,
  member,
}: {
  businessId: string;
  branches: { id: string; name: string }[];
  action: StaffFormAction;
  member?: StaffMember;
}) {
  const [state, submit, pending] = useActionState<StaffState, FormData>(
    action,
    {},
  );
  const [role, setRole] = useState<StaffMember["role"]>(
    member?.role ?? "cashier",
  );
  const formId = useId();
  return (
    <form action={submit} className="space-y-4" noValidate>
      <input type="hidden" name="businessId" value={businessId} />
      {member && <input type="hidden" name="userId" value={member.userId} />}
      {state.message && <Alert>{state.message}</Alert>}
      {state.done && (
        <Alert tone="info">
          {state.staff?.role === "manager"
            ? "Staff access saved. Any new setup PIN has been emailed."
            : "Staff access saved."}
        </Alert>
      )}
      {state.temporaryPin && (
        <OneTimePin key={state.temporaryPin} pin={state.temporaryPin} />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          name={`${formId}-name`}
          label="Name"
          error={state.fieldErrors?.name}
        >
          <Input
            name="name"
            defaultValue={member?.name}
            maxLength={120}
            required
          />
        </Field>
        <Field
          name={`${formId}-role`}
          label="Role"
          error={state.fieldErrors?.role}
        >
          <Select
            name="role"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as StaffMember["role"])
            }
          >
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field
            name={`${formId}-email`}
            label={
              role === "manager" ? "Email address" : "Email address (optional)"
            }
            error={state.fieldErrors?.email}
          >
            <Input
              name="email"
              type="email"
              defaultValue={member?.email ?? ""}
              autoComplete="off"
              required={role === "manager"}
            />
          </Field>
        </div>
      </div>
      <p className="text-sm text-steel">
        {role === "manager"
          ? "A temporary PIN is emailed for first sign-in. The manager sets their portal password and a separate terminal PIN."
          : "Cashiers use the terminal only. A temporary PIN is shown once to you after creation or reset."}
      </p>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-ink">
          Assigned branches
        </legend>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {branches.map((branch) => (
            <label
              key={branch.id}
              className="flex min-h-11 items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name="branchIds"
                value={branch.id}
                defaultChecked={member?.branchIds.includes(branch.id)}
                className="size-4 accent-brand-green-dark"
              />
              {branch.name}
            </label>
          ))}
        </div>
        {state.fieldErrors?.branchIds && (
          <p role="alert" className="text-sm text-danger">
            {state.fieldErrors.branchIds}
          </p>
        )}
        {!branches.length && (
          <p className="text-sm text-steel">
            Add a branch before creating staff.
          </p>
        )}
      </fieldset>
      {member && (
        <p className="text-sm text-steel">
          Role or branch changes end existing staff sessions. Operational
          history is preserved.
        </p>
      )}
      <Button type="submit" disabled={pending || !branches.length}>
        {pending ? "Saving…" : member ? "Save access" : "Add staff member"}
      </Button>
    </form>
  );
}
export function StaffControls({
  businessId,
  member,
  action,
}: {
  businessId: string;
  member: StaffMember;
  action: StaffFormAction;
}) {
  const [state, submit, pending] = useActionState<StaffState, FormData>(
    action,
    {},
  );
  const active = member.status !== "deactivated";
  return (
    <form
      action={submit}
      className="mt-5 space-y-3 border-t border-hairline pt-4"
    >
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="userId" value={member.userId} />
      {state.message && <Alert>{state.message}</Alert>}
      {state.done && (
        <Alert tone="info">
          Access updated.{" "}
          {state.staff?.role === "manager"
            ? "Any new setup PIN has been emailed."
            : ""}
        </Alert>
      )}
      {state.temporaryPin && (
        <OneTimePin key={state.temporaryPin} pin={state.temporaryPin} />
      )}
      <label className="flex min-h-11 items-center gap-2 text-sm text-slate">
        <input type="checkbox" name="confirmation" className="size-4" />I
        confirm this access change and any session revocation.
      </label>
      <div className="flex flex-wrap gap-2">
        {active ? (
          <>
            <Button
              size="sm"
              variant="secondary"
              type="submit"
              name="intent"
              value="reset-pin"
              disabled={pending}
            >
              Reset terminal PIN
            </Button>
            {member.role === "manager" && (
              <Button
                size="sm"
                variant="secondary"
                type="submit"
                name="intent"
                value="reset-password"
                disabled={pending}
              >
                Reset portal password
              </Button>
            )}
            {member.status === "pending" && (
              <Button
                size="sm"
                variant="secondary"
                type="submit"
                name="intent"
                value="resend"
                disabled={pending}
              >
                {member.role === "manager"
                  ? "Resend setup email"
                  : "Issue fresh setup PIN"}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              type="submit"
              name="intent"
              value="deactivate"
              disabled={pending}
            >
              Deactivate
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            type="submit"
            name="intent"
            value="reactivate"
            disabled={pending}
          >
            Reactivate
          </Button>
        )}
      </div>
    </form>
  );
}
