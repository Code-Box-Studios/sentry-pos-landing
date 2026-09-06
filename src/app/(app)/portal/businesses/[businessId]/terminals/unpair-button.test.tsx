import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnpairButton } from "./unpair-button";
import type { FormState } from "@/lib/forms/form-state";
import type { Terminal } from "@/lib/api/types";

function terminal(overrides: Partial<Terminal> = {}): Terminal {
  return {
    id: "t-1",
    branchId: "br-1",
    name: "Front till",
    code: "MKT-T1",
    pairedAt: "2026-03-01T00:00:00.000Z",
    lastSeenAt: "2026-03-02T00:00:00.000Z",
    paired: true,
    ...overrides,
  };
}

describe("UnpairButton", () => {
  it("offers nothing to click for an already-unpaired terminal", () => {
    render(<UnpairButton action={vi.fn()} businessId="b-1" terminal={terminal({ paired: false })} />);
    expect(screen.getByText("Not paired")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("does not unpair on the first click", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<UnpairButton action={action} businessId="b-1" terminal={terminal()} />);

    await userEvent.click(screen.getByRole("button", { name: "Unpair" }));
    expect(action).not.toHaveBeenCalled();
  });

  it("keeps the confirm disabled until the code is typed", async () => {
    render(<UnpairButton action={vi.fn()} businessId="b-1" terminal={terminal()} />);

    await userEvent.click(screen.getByRole("button", { name: "Unpair" }));
    expect(screen.getByRole("button", { name: "Unpair terminal" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Terminal code"), "MKT-T1");
    expect(screen.getByRole("button", { name: "Unpair terminal" })).toBeEnabled();
  });

  it("accepts the code in any case", async () => {
    render(<UnpairButton action={vi.fn()} businessId="b-1" terminal={terminal()} />);

    await userEvent.click(screen.getByRole("button", { name: "Unpair" }));
    await userEvent.type(screen.getByLabelText("Terminal code"), "mkt-t1");
    expect(screen.getByRole("button", { name: "Unpair terminal" })).toBeEnabled();
  });

  it("stays disabled for the wrong code", async () => {
    render(<UnpairButton action={vi.fn()} businessId="b-1" terminal={terminal()} />);

    await userEvent.click(screen.getByRole("button", { name: "Unpair" }));
    await userEvent.type(screen.getByLabelText("Terminal code"), "MKT-T2");
    expect(screen.getByRole("button", { name: "Unpair terminal" })).toBeDisabled();
  });

  it("submits the terminal once confirmed", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<UnpairButton action={action} businessId="b-1" terminal={terminal()} />);

    await userEvent.click(screen.getByRole("button", { name: "Unpair" }));
    await userEvent.type(screen.getByLabelText("Terminal code"), "MKT-T1");
    await userEvent.click(screen.getByRole("button", { name: "Unpair terminal" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("businessId")).toBe("b-1");
    expect(formData.get("id")).toBe("t-1");
  });

  it("warns that the device must be paired again in person", async () => {
    render(<UnpairButton action={vi.fn()} businessId="b-1" terminal={terminal()} />);
    await userEvent.click(screen.getByRole("button", { name: "Unpair" }));
    expect(screen.getByText(/paired again in person/i)).toBeInTheDocument();
  });

  it("backs out without unpairing", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<UnpairButton action={action} businessId="b-1" terminal={terminal()} />);

    await userEvent.click(screen.getByRole("button", { name: "Unpair" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Unpair" })).toBeInTheDocument();
  });
});
