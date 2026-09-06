import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDelete } from "./confirm-delete";
import type { FormState } from "@/lib/forms/form-state";

describe("ConfirmDelete", () => {
  it("does not delete on the first click", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(action).not.toHaveBeenCalled();
  });

  it("names what is about to be deleted", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText(/Drinks/)).toBeInTheDocument();
  });

  it("submits the hidden fields once confirmed", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect((action.mock.calls[0][1] as FormData).get("id")).toBe("c-1");
  });

  it("backs out without deleting", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("surfaces a refusal from the server, such as a category still in use", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ message: "Category still has products." }),
    );
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("still has products");
  });
});
