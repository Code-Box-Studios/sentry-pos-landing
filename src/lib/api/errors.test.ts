import { describe, expect, it } from "vitest";
import {
  ApiError,
  ConflictError,
  ForbiddenError,
  InvalidTokenError,
  LockedError,
  LoginInvalidError,
  NotFoundError,
  OwnerSuspendedError,
  UnauthorizedError,
  ValidationError,
  toApiError,
} from "./errors";

describe("toApiError", () => {
  it("keeps code, message and requestId on the base error", () => {
    const err = toApiError(500, {
      code: "internal_error",
      message: "An unexpected error occurred.",
      requestId: "req-1",
    });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("internal_error");
    expect(err.status).toBe(500);
    expect(err.requestId).toBe("req-1");
  });

  it("maps each authorization code to its own class", () => {
    expect(toApiError(401, { code: "unauthorized", message: "x" })).toBeInstanceOf(
      UnauthorizedError,
    );
    expect(toApiError(403, { code: "forbidden", message: "x" })).toBeInstanceOf(ForbiddenError);
    expect(
      toApiError(403, { code: "platform_write_forbidden", message: "x" }),
    ).toBeInstanceOf(ForbiddenError);
    expect(toApiError(403, { code: "owner_suspended", message: "x" })).toBeInstanceOf(
      OwnerSuspendedError,
    );
    expect(toApiError(404, { code: "not_found", message: "x" })).toBeInstanceOf(NotFoundError);
    expect(toApiError(409, { code: "email_taken", message: "x" })).toBeInstanceOf(ConflictError);
    expect(toApiError(400, { code: "invalid_token", message: "x" })).toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it("carries attemptsRemaining off a failed login", () => {
    const err = toApiError(401, {
      code: "login_invalid",
      message: "Credentials are incorrect.",
      attemptsRemaining: 2,
    });
    expect(err).toBeInstanceOf(LoginInvalidError);
    expect((err as LoginInvalidError).attemptsRemaining).toBe(2);
  });

  it("carries retryAfterSeconds off a lockout", () => {
    const err = toApiError(423, {
      code: "login_locked",
      message: "Locked.",
      retryAfterSeconds: 300,
    });
    expect(err).toBeInstanceOf(LockedError);
    expect((err as LockedError).retryAfterSeconds).toBe(300);
  });

  it("falls back to a generic error when the body is not an envelope at all", () => {
    const err = toApiError(502, "<html>Bad Gateway</html>");
    expect(err.code).toBe("internal_error");
    expect(err.status).toBe(502);
  });
});

describe("ValidationError.forFields", () => {
  it("splits the joined message back into per-field errors", () => {
    const err = toApiError(422, {
      code: "validation",
      message: "email must be an email; name should not be empty",
    }) as ValidationError;

    expect(err).toBeInstanceOf(ValidationError);
    expect(err.forFields(["email", "name"])).toEqual({
      fieldErrors: {
        email: "email must be an email",
        name: "name should not be empty",
      },
      formErrors: [],
    });
  });

  it("keeps the first message when a field fails several rules", () => {
    const err = toApiError(422, {
      code: "validation",
      message:
        "password must be longer than or equal to 8 characters; password should not be empty",
    }) as ValidationError;

    expect(err.forFields(["password"]).fieldErrors.password).toBe(
      "password must be longer than or equal to 8 characters",
    );
  });

  it("promotes an unrecognised segment to a form-level error rather than dropping it", () => {
    const err = toApiError(422, {
      code: "validation",
      message: "maxBusinesses must not be greater than 1000; something entirely unexpected",
    }) as ValidationError;

    const result = err.forFields(["maxBusinesses"]);
    expect(result.fieldErrors.maxBusinesses).toBe("maxBusinesses must not be greater than 1000");
    expect(result.formErrors).toEqual(["something entirely unexpected"]);
  });

  it("treats an empty message as no segments", () => {
    const err = toApiError(422, { code: "validation", message: "" }) as ValidationError;
    expect(err.forFields(["email"])).toEqual({ fieldErrors: {}, formErrors: [] });
  });
});
