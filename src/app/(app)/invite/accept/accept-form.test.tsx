import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordSetForm } from "@/components/app/password-set-form";
import type { FormState } from "@/lib/forms/form-state";

describe("PasswordSetForm", () => {
  it("sends the token from the link along with the password", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<PasswordSetForm action={action} token="tok-123" submitLabel="Activate account" />);

    await userEvent.type(screen.getByLabelText("New password"), "correct-horse");
    await userEvent.type(screen.getByLabelText("Confirm password"), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: "Activate account" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("token")).toBe("tok-123");
    expect(formData.get("password")).toBe("correct-horse");
    expect(formData.get("confirm")).toBe("correct-horse");
  });

  it("shows a mismatch against the confirm field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { confirm: "The two passwords do not match." },
      }),
    );
    render(<PasswordSetForm action={action} token="t" submitLabel="Save password" />);

    await userEvent.type(screen.getByLabelText("New password"), "aaaaaaaa");
    await userEvent.type(screen.getByLabelText("Confirm password"), "bbbbbbbb");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByLabelText("Confirm password")).toHaveAccessibleDescription(
      "The two passwords do not match.",
    );
  });

  it("reports a dead link without hinting why it is dead", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ message: "This link is invalid or has expired." }),
    );
    render(<PasswordSetForm action={action} token="stale" submitLabel="Activate account" />);

    await userEvent.type(screen.getByLabelText("New password"), "correct-horse");
    await userEvent.type(screen.getByLabelText("Confirm password"), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: "Activate account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("invalid or has expired");
  });
});
