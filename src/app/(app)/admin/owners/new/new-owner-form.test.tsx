import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewOwnerForm } from "./new-owner-form";
import type { FormState } from "@/lib/forms/form-state";

describe("NewOwnerForm", () => {
  it("submits the three fields the API needs", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<NewOwnerForm action={action} />);

    await userEvent.type(screen.getByLabelText("Business owner name"), "Kape Diaria");
    await userEvent.type(screen.getByLabelText("Email address"), "maria@kapediaria.ph");
    await userEvent.clear(screen.getByLabelText("Business limit"));
    await userEvent.type(screen.getByLabelText("Business limit"), "3");
    await userEvent.click(screen.getByRole("button", { name: /create owner/i }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Kape Diaria");
    expect(formData.get("email")).toBe("maria@kapediaria.ph");
    expect(formData.get("maxBusinesses")).toBe("3");
  });

  it("puts a duplicate email on the email field, where it can be corrected", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { email: "This email is already in use." },
      }),
    );
    render(<NewOwnerForm action={action} />);

    await userEvent.type(screen.getByLabelText("Business owner name"), "X");
    await userEvent.type(screen.getByLabelText("Email address"), "taken@example.com");
    await userEvent.click(screen.getByRole("button", { name: /create owner/i }));

    expect(await screen.findByLabelText("Email address")).toHaveAccessibleDescription(
      "This email is already in use.",
    );
  });
});
