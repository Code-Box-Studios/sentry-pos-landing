import { describe, expect, it } from "vitest";
import { toFormState } from "./form-state";
import { NetworkError, toApiError } from "@/lib/api/errors";

describe("toFormState", () => {
  it("puts validation messages on their fields", () => {
    const state = toFormState(
      toApiError(422, { code: "validation", message: "email must be an email" }),
      ["email", "password"],
    );
    expect(state.fieldErrors).toEqual({ email: "email must be an email" });
    expect(state.message).toBeUndefined();
  });

  it("raises an unmatched validation segment to the form so it is still seen", () => {
    const state = toFormState(
      toApiError(422, { code: "validation", message: "something odd happened" }),
      ["email"],
    );
    expect(state.fieldErrors).toEqual({});
    expect(state.message).toBe("something odd happened");
  });

  it("carries attemptsRemaining off a wrong password", () => {
    const state = toFormState(
      toApiError(401, {
        code: "login_invalid",
        message: "Credentials are incorrect.",
        attemptsRemaining: 2,
      }),
      ["email", "password"],
    );
    expect(state.message).toBe("Credentials are incorrect.");
    expect(state.attemptsRemaining).toBe(2);
  });

  it("carries retryAfterSeconds off a lockout", () => {
    const state = toFormState(
      toApiError(423, { code: "login_locked", message: "Locked.", retryAfterSeconds: 300 }),
      ["email"],
    );
    expect(state.retryAfterSeconds).toBe(300);
  });

  it("puts a duplicate-email conflict on the email field, where the user can fix it", () => {
    const state = toFormState(
      toApiError(409, { code: "email_taken", message: "This email is already in use." }),
      ["name", "email"],
    );
    expect(state.fieldErrors).toEqual({ email: "This email is already in use." });
  });

  it("explains a transport failure rather than showing a blank form", () => {
    const state = toFormState(new NetworkError(), ["email"]);
    expect(state.message).toMatch(/reach/i);
  });

  it("shows the requestId on an unrecognised failure, so support has a handle", () => {
    const state = toFormState(
      toApiError(500, {
        code: "internal_error",
        message: "An unexpected error occurred.",
        requestId: "req-42",
      }),
      ["email"],
    );
    expect(state.message).toContain("req-42");
  });

  it("re-throws anything that is not an API error — a bug must not look like a form error", () => {
    expect(() => toFormState(new TypeError("undefined is not a function"), [])).toThrow(TypeError);
  });
});
