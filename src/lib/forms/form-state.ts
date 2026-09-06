import {
  ApiError,
  ConflictError,
  LockedError,
  LoginInvalidError,
  NetworkError,
  ValidationError,
} from "@/lib/api/errors";

/** What every Server Action in this app returns to `useActionState`. */
export interface FormState {
  /** Form-level message, shown above the fields. */
  message?: string;
  /** Keyed by field name, shown under the matching input. */
  fieldErrors?: Record<string, string>;
  attemptsRemaining?: number;
  retryAfterSeconds?: number;
  /** Set by actions that succeed without navigating away. */
  done?: true;
}

export const EMPTY_FORM_STATE: FormState = {};

/**
 * Turns a thrown API error into something a form can render.
 *
 * Anything that is not an `ApiError` or `NetworkError` is re-thrown deliberately: a
 * TypeError from our own code is a bug, and swallowing it into a red message under an input
 * is how bugs get mistaken for user error and go unreported.
 */
export function toFormState(error: unknown, fields: readonly string[]): FormState {
  if (error instanceof NetworkError) {
    return { message: "Could not reach the Sentry API. Check your connection and try again." };
  }

  if (error instanceof ValidationError) {
    const { fieldErrors, formErrors } = error.forFields(fields);
    return {
      fieldErrors,
      message: formErrors.length > 0 ? formErrors.join(" ") : undefined,
    };
  }

  if (error instanceof LoginInvalidError) {
    return { message: error.message, attemptsRemaining: error.attemptsRemaining };
  }

  if (error instanceof LockedError) {
    return { message: error.message, retryAfterSeconds: error.retryAfterSeconds };
  }

  // A uniqueness collision is always about a specific value the user typed. Put it on that
  // input if we can identify it; `email` is the only unique field in this phase.
  if (error instanceof ConflictError && fields.includes("email")) {
    return { fieldErrors: { email: error.message } };
  }

  if (error instanceof ApiError) {
    return {
      message: error.requestId ? `${error.message} (reference ${error.requestId})` : error.message,
    };
  }

  throw error;
}
