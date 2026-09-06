import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotForm } from "./forgot-form";
import type { FormState } from "@/lib/forms/form-state";

describe("ForgotForm", () => {
  it("gives the same answer whether or not the account exists", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({ done: true }));
    render(<ForgotForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "nobody@nowhere.test");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("If an account exists");
    // No form remains to retry against, and nothing on screen says whether the address was real.
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
  });
});
