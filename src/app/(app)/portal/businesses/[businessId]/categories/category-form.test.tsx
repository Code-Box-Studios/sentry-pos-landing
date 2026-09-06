import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryForm } from "./category-form";
import type { FormState } from "@/lib/forms/form-state";
import type { Category } from "@/lib/api/types";

const CATEGORY: Category = {
  id: "c-1",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  deletedAt: null,
  businessId: "b-1",
  name: "Drinks",
  sortOrder: 2,
};

describe("CategoryForm", () => {
  it("creates with the business id attached", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<CategoryForm action={action} businessId="b-1" />);

    await userEvent.type(screen.getByLabelText("Name"), "Pastries");
    await userEvent.click(screen.getByRole("button", { name: "Add category" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("businessId")).toBe("b-1");
    expect(formData.get("name")).toBe("Pastries");
  });

  it("edits an existing category, carrying its id", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<CategoryForm action={action} businessId="b-1" category={CATEGORY} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Drinks");
    expect(screen.getByLabelText("Order")).toHaveValue(2);

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "Beverages");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("id")).toBe("c-1");
    expect(formData.get("name")).toBe("Beverages");
  });

  it("shows a validation message against the name", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { name: "name should not be empty" },
      }),
    );
    render(<CategoryForm action={action} businessId="b-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Add category" }));
    expect(await screen.findByLabelText("Name")).toHaveAccessibleDescription(
      "name should not be empty",
    );
  });
});
