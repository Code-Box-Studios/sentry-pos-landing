"use client";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

export function StaffSetupForm({
  action,
  passwordOnly = false,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  passwordOnly?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, EMPTY_FORM_STATE);
  return (
    <form action={submit} className="space-y-4" noValidate>
      <input
        type="hidden"
        name="mode"
        value={passwordOnly ? "password" : "manager"}
      />
      {state.message && <Alert>{state.message}</Alert>}
      <Field
        name="email"
        label="Email address"
        error={state.fieldErrors?.email}
      >
        <Input
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
        />
      </Field>
      <Field
        name="temporaryPin"
        label="Temporary PIN"
        error={state.fieldErrors?.temporaryPin}
        hint="From your setup email. Expires after 15 minutes."
      >
        <Input
          name="temporaryPin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          required
        />
      </Field>
      <Field
        name="password"
        label="New portal password"
        error={state.fieldErrors?.password}
      >
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      <Field
        name="confirmPassword"
        label="Confirm password"
        error={state.fieldErrors?.confirmPassword}
      >
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>
      {!passwordOnly && (
        <>
          <Field
            name="permanentPin"
            label="New terminal PIN"
            error={state.fieldErrors?.permanentPin}
            hint="Six digits. Use this only to unlock and approve actions at assigned terminals."
          >
            <Input
              name="permanentPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              required
            />
          </Field>
          <Field
            name="confirmPin"
            label="Confirm terminal PIN"
            error={state.fieldErrors?.confirmPin}
          >
            <Input
              name="confirmPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              required
            />
          </Field>
        </>
      )}
      <Button type="submit" className="w-full rounded-full" disabled={pending}>
        {pending
          ? "Setting up…"
          : passwordOnly
            ? "Change password and sign in"
            : "Set up access and sign in"}
      </Button>
      <p className="text-sm text-steel">
        Expired or already used? Ask your business owner to issue a new setup
        PIN.
      </p>
    </form>
  );
}
