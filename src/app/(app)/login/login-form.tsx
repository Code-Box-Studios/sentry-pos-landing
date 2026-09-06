"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : children}
    </Button>
  );
}

export function LoginForm({
  action,
  next,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  next?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const lockMinutes = state.retryAfterSeconds
    ? Math.ceil(state.retryAfterSeconds / 60)
    : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.message ? (
        <Alert tone={state.retryAfterSeconds ? "warn" : "danger"}>
          {state.message}
          {state.attemptsRemaining !== undefined ? (
            <>
              {" "}
              {state.attemptsRemaining} attempt{state.attemptsRemaining === 1 ? "" : "s"}{" "}
              remaining.
            </>
          ) : null}
          {lockMinutes ? (
            <>
              {" "}
              Try again in {lockMinutes} minute{lockMinutes === 1 ? "" : "s"}.
            </>
          ) : null}
        </Alert>
      ) : null}

      <Field name="email" label="Email address" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="username" autoFocus />
      </Field>

      <Field name="password" label="Password" error={state.fieldErrors?.password}>
        <Input name="password" type="password" autoComplete="current-password" />
      </Field>

      <SubmitButton>Sign in</SubmitButton>

      <p className="text-center text-sm">
        <a href="/forgot" className="text-brand-green-dark hover:underline">
          Forgot your password?
        </a>
      </p>
    </form>
  );
}
