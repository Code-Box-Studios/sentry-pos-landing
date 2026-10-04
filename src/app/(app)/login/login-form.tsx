"use client";

import { useActionState, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Users, type LucideIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SignInInput({
  icon: Icon,
  endAdornment,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon; endAdornment?: ReactNode }) {
  return (
    <div className="relative">
      <Icon aria-hidden="true" size={18} className="pointer-events-none absolute top-[19px] left-[17px] text-stone" />
      <Input
        {...props}
        className={`h-14 rounded-lg pl-[46px] focus-visible:border-brand-green-dark focus-visible:ring-3 focus-visible:ring-brand-green-dark/10 ${endAdornment ? "pr-[54px]" : "pr-4"}`}
      />
      {endAdornment}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-[52px] w-full gap-3 rounded-full bg-brand-green font-semibold text-ink hover:bg-brand-green-hover"
      disabled={pending}
    >
      {pending ? "Signing in…" : "Sign in"}
      {!pending ? <ArrowRight aria-hidden="true" size={18} /> : null}
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
  const [showPassword, setShowPassword] = useState(false);
  const lockMinutes = state.retryAfterSeconds
    ? Math.ceil(state.retryAfterSeconds / 60)
    : undefined;

  return (
    <>
      <form action={formAction} className="space-y-[22px] [&>div>div]:space-y-2.5" noValidate>
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

        <div>
          <Field name="email" label="Email address" error={state.fieldErrors?.email}>
            <SignInInput icon={Mail} name="email" type="email" autoComplete="username" placeholder="you@example.com" />
          </Field>
        </div>

        <div className="relative">
          <a href="/forgot" className="absolute top-0.5 right-0 text-xs font-medium text-brand-green-dark hover:underline hover:underline-offset-4">
            Forgot password?
          </a>
          <Field name="password" label="Password" error={state.fieldErrors?.password}>
            <SignInInput
              icon={LockKeyhole}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              endAdornment={
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  aria-controls="password"
                  onClick={() => setShowPassword((shown) => !shown)}
                  className="absolute top-1.5 right-1.5 h-11 w-11 rounded-lg p-0 text-steel hover:bg-surface hover:text-ink"
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                </Button>
              }
            />
          </Field>
        </div>

        <div className="pt-1.5"><SubmitButton /></div>
      </form>
      <div className="mt-8 flex items-center gap-3.5 border-t border-hairline pt-[25px]">
        <span className="grid size-[42px] shrink-0 place-items-center rounded-lg border border-hairline bg-surface text-steel">
          <Users aria-hidden="true" size={19} />
        </span>
        <div className="text-[13px] leading-[1.7]">
          <p className="text-steel">Have a temporary staff PIN?</p>
          <a href="/login/staff" className="inline-flex items-center gap-[5px] font-semibold text-brand-green-dark hover:underline hover:underline-offset-4">
            Set up your access<ArrowRight aria-hidden="true" size={13} />
          </a>
        </div>
      </div>
    </>
  );
}
