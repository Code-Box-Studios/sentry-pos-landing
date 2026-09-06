import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";
import type { FormState } from "@/lib/forms/form-state";

describe("LoginForm", () => {
  it("submits what the user typed", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "maria@kapediaria.ph");
    await userEvent.type(screen.getByLabelText("Password"), "sentry-demo");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("email")).toBe("maria@kapediaria.ph");
    expect(formData.get("password")).toBe("sentry-demo");
  });

  it("carries the requested destination through the form", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<LoginForm action={action} next="/portal/settings" />);

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect((action.mock.calls[0][1] as FormData).get("next")).toBe("/portal/settings");
  });

  it("shows how many attempts remain after a wrong password", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        message: "Credentials are incorrect.",
        attemptsRemaining: 2,
      }),
    );
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credentials are incorrect. 2 attempts remaining.",
    );
  });

  it("counts a lockout down in minutes instead of showing a bare failure", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ message: "Locked.", retryAfterSeconds: 300 }),
    );
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Try again in 5 minutes.");
  });

  it("puts a field error under its own input", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { email: "email must be an email" },
      }),
    );
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByLabelText("Email address")).toHaveAccessibleDescription(
      "email must be an email",
    );
  });
});
