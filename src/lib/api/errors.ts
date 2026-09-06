/**
 * The client half of the API's error contract.
 *
 * `sentry-pos-be` renders every failure as `{ code, message, ...extra, requestId }` — with
 * no `statusCode` field, deliberately. `code` is the stable identifier; the HTTP status is
 * carried here only so an unmapped code still has something to report. Branch on `code`.
 */

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** 401. The session is gone or was never there. */
export class UnauthorizedError extends ApiError {}

/** 403 for every "you may not do this" that is not a suspension. */
export class ForbiddenError extends ApiError {}

/** 403 with its own screen: the owner account itself is suspended. */
export class OwnerSuspendedError extends ApiError {}

export class NotFoundError extends ApiError {}

/** 409 — a unique constraint lost. Belongs inline on the offending field. */
export class ConflictError extends ApiError {}

/** 400 — an invite or reset link that is unknown, used, or expired. */
export class InvalidTokenError extends ApiError {}

/** 401 on a wrong password, carrying how many tries remain before the lockout. */
export class LoginInvalidError extends ApiError {
  constructor(
    message: string,
    status: number,
    requestId: string | undefined,
    readonly attemptsRemaining: number,
  ) {
    super("login_invalid", message, status, requestId);
  }
}

/** 423 — locked out. Render the countdown, not a generic failure. */
export class LockedError extends ApiError {
  constructor(
    code: string,
    message: string,
    status: number,
    requestId: string | undefined,
    readonly retryAfterSeconds: number,
  ) {
    super(code, message, status, requestId);
  }
}

/**
 * 422. The API's global ValidationPipe emits an array of class-validator strings, and the
 * exception filter joins them with `"; "` before sending — so there is no structured field
 * data to read. Each segment does begin with its property name, which is what `forFields`
 * exploits to put messages back on the right inputs.
 */
export class ValidationError extends ApiError {
  readonly segments: string[];

  constructor(message: string, status: number, requestId?: string) {
    super("validation", message, status, requestId);
    this.segments = message
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * Assigns each segment to a field by its leading word. A segment whose first word is not
   * one of `fields` becomes a form-level error — best-effort by construction, but nothing
   * the API said is ever thrown away.
   */
  forFields(fields: readonly string[]): {
    fieldErrors: Record<string, string>;
    formErrors: string[];
  } {
    const known = new Set(fields);
    const fieldErrors: Record<string, string> = {};
    const formErrors: string[] = [];

    for (const segment of this.segments) {
      const field = segment.split(" ")[0];
      if (known.has(field)) {
        // First message wins: class-validator lists rules in declaration order, and the
        // first failure is the one closest to what the user actually typed.
        if (!(field in fieldErrors)) fieldErrors[field] = segment;
      } else {
        formErrors.push(segment);
      }
    }

    return { fieldErrors, formErrors };
  }
}

/** The API could not be reached at all — DNS, TLS, connection refused, timeout. */
export class NetworkError extends Error {
  constructor(message = "Could not reach the Sentry API.", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "NetworkError";
  }
}

/** Maps one error response onto its class. Unknown codes stay as a plain `ApiError`. */
export function toApiError(status: number, body: unknown): ApiError {
  const envelope: Record<string, unknown> =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const code = typeof envelope.code === "string" ? envelope.code : "internal_error";
  const message =
    typeof envelope.message === "string" ? envelope.message : "An unexpected error occurred.";
  const requestId = typeof envelope.requestId === "string" ? envelope.requestId : undefined;
  const numeric = (key: string): number =>
    typeof envelope[key] === "number" ? (envelope[key] as number) : 0;

  switch (code) {
    case "validation":
      return new ValidationError(message, status, requestId);

    case "login_invalid":
      return new LoginInvalidError(message, status, requestId, numeric("attemptsRemaining"));

    case "login_locked":
    case "pin_locked":
      return new LockedError(code, message, status, requestId, numeric("retryAfterSeconds"));

    case "unauthorized":
    case "totp_invalid":
      return new UnauthorizedError(code, message, status, requestId);

    case "owner_suspended":
      return new OwnerSuspendedError(code, message, status, requestId);

    case "forbidden":
    case "platform_write_forbidden":
    case "tenant_scope_violation":
    case "max_businesses_reached":
      return new ForbiddenError(code, message, status, requestId);

    case "not_found":
      return new NotFoundError(code, message, status, requestId);

    case "email_taken":
    case "conflict":
    case "stock_conflict":
      return new ConflictError(code, message, status, requestId);

    case "invalid_token":
      return new InvalidTokenError(code, message, status, requestId);

    default:
      return new ApiError(code, message, status, requestId);
  }
}
