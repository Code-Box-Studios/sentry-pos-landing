import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TotpForm } from "./totp-form";
import { SetupForm } from "./setup/setup-form";
import type { FormState } from "@/lib/forms/form-state";
import type { TotpEnableState } from "./actions";

describe("TotpForm", () => {
  it("submits the code", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<TotpForm action={action} />);

    await userEvent.type(screen.getByLabelText("Authentication code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect((action.mock.calls[0][1] as FormData).get("code")).toBe("123456");
  });

  it("accepts a recovery code, which is longer than six digits", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<TotpForm action={action} />);

    await userEvent.type(screen.getByLabelText("Authentication code"), "abcd-efgh-ijkl");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect((action.mock.calls[0][1] as FormData).get("code")).toBe("abcd-efgh-ijkl");
  });

  it("reports an invalid code", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ message: "TOTP code or recovery code is invalid." }),
    );
    render(<TotpForm action={action} />);

    await userEvent.type(screen.getByLabelText("Authentication code"), "000000");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("invalid");
  });
});

describe("SetupForm", () => {
  it("shows every recovery code once enrolment succeeds", async () => {
    const action = vi.fn(
      async (): Promise<TotpEnableState> => ({
        done: true,
        recoveryCodes: ["aaa-111", "bbb-222", "ccc-333"],
      }),
    );
    render(<SetupForm action={action} />);

    await userEvent.type(screen.getByLabelText("Six-digit code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Confirm and continue" }));

    expect(await screen.findByText("aaa-111")).toBeInTheDocument();
    expect(screen.getByText("bbb-222")).toBeInTheDocument();
    expect(screen.getByText("ccc-333")).toBeInTheDocument();
  });

  it("warns that the codes cannot be retrieved again", async () => {
    const action = vi.fn(
      async (): Promise<TotpEnableState> => ({ done: true, recoveryCodes: ["aaa-111"] }),
    );
    render(<SetupForm action={action} />);

    await userEvent.type(screen.getByLabelText("Six-digit code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Confirm and continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("shown once");
  });
});
