import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupForm } from "./group-form";
import type { FormState } from "@/lib/forms/form-state";
import type { ModifierGroup } from "@/lib/api/types";

const GROUP: ModifierGroup = {
  id: "g-1",
  businessId: "b-1",
  name: "Milk",
  minSelect: 0,
  maxSelect: 1,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  deletedAt: null,
  modifiers: [{ id: "m-1", groupId: "g-1", name: "Oat", priceDeltaC: 1500 }],
};

describe("GroupForm", () => {
  it("creates a group with its options", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<GroupForm action={action} businessId="b-1" />);

    await userEvent.type(screen.getByLabelText("Group name"), "Size");
    await userEvent.click(screen.getByRole("button", { name: "Add option" }));
    await userEvent.type(screen.getByLabelText("Option"), "Large");
    await userEvent.clear(screen.getByLabelText("Price change"));
    await userEvent.type(screen.getByLabelText("Price change"), "20");
    await userEvent.click(screen.getByRole("button", { name: "Create group" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Size");
    expect(formData.getAll("modifierName")).toEqual(["Large"]);
    expect(formData.getAll("modifierDelta")).toEqual(["20"]);
    expect(formData.getAll("modifierId")).toEqual([""]);
  });

  it("shows an existing option's delta in pesos and keeps its id", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<GroupForm action={action} businessId="b-1" group={GROUP} />);

    expect(screen.getByLabelText("Price change")).toHaveValue("15.00");

    await userEvent.click(screen.getByRole("button", { name: "Save group" }));
    expect((action.mock.calls[0][1] as FormData).getAll("modifierId")).toEqual(["m-1"]);
  });

  it("stops posting an option once removed", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<GroupForm action={action} businessId="b-1" group={GROUP} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Save group" }));

    expect((action.mock.calls[0][1] as FormData).getAll("modifierName")).toEqual([]);
  });

  it("reports a min above max against the max field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { maxSelect: "Maximum must be at least the minimum." },
      }),
    );
    render(<GroupForm action={action} businessId="b-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Create group" }));
    expect(await screen.findByLabelText("Max")).toHaveAccessibleDescription(
      "Maximum must be at least the minimum.",
    );
  });
});
