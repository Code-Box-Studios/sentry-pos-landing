import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RefundPinForm } from "./refund-pin-form";
import type { FormState } from "@/lib/forms/form-state";

describe("RefundPinForm", () => {
  it("posts both fields so the action can compare them", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<RefundPinForm action={action} />);

    await userEvent.type(screen.getByLabelText("New refund PIN"), "123456");
    await userEvent.type(screen.getByLabelText("Confirm PIN"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Set refund PIN" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("pin")).toBe("123456");
    expect(formData.get("confirm")).toBe("123456");
  });

  it("masks the PIN so it cannot be read over a shoulder", () => {
    render(<RefundPinForm action={vi.fn()} />);
    // A masked input has no textbox role, so query by the underlying element.
    expect(document.querySelector('input[name="pin"]')).toHaveAttribute("type", "password");
    expect(document.querySelector('input[name="confirm"]')).toHaveAttribute("type", "password");
  });

  it("shows a mismatch against the confirm field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { confirm: "The two PINs do not match." },
      }),
    );
    render(<RefundPinForm action={action} />);

    await userEvent.type(screen.getByLabelText("New refund PIN"), "123456");
    await userEvent.type(screen.getByLabelText("Confirm PIN"), "654321");
    await userEvent.click(screen.getByRole("button", { name: "Set refund PIN" }));

    expect(await screen.findByLabelText("Confirm PIN")).toHaveAccessibleDescription(
      "The two PINs do not match.",
    );
  });

  it("confirms success without echoing the PIN back", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({ done: true }));
    render(<RefundPinForm action={action} />);

    await userEvent.type(screen.getByLabelText("New refund PIN"), "123456");
    await userEvent.type(screen.getByLabelText("Confirm PIN"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Set refund PIN" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Refund PIN updated.");
    expect(alert).not.toHaveTextContent("123456");
  });
});
