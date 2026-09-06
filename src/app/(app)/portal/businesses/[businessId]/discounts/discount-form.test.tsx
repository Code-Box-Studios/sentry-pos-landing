import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiscountForm } from "./discount-form";
import type { FormState } from "@/lib/forms/form-state";
import type { Discount } from "@/lib/api/types";

function discount(overrides: Partial<Discount> = {}): Discount {
  return {
    id: "d-1",
    businessId: "b-1",
    name: "Staff",
    kind: "percent",
    value: 10,
    appliesTo: "line",
    active: true,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("DiscountForm", () => {
  it("creates a percentage discount", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<DiscountForm action={action} businessId="b-1" />);

    await userEvent.type(screen.getByLabelText("Name"), "Happy hour");
    await userEvent.type(screen.getByLabelText("Percent"), "15");
    await userEvent.click(screen.getByRole("button", { name: "Add discount" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("businessId")).toBe("b-1");
    expect(formData.get("kind")).toBe("percent");
    expect(formData.get("value")).toBe("15");
    expect(formData.get("active")).toBe("on");
  });

  it("relabels the value field when the type changes, so the unit is never ambiguous", async () => {
    render(<DiscountForm action={vi.fn()} businessId="b-1" />);

    expect(screen.getByLabelText("Percent")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Type"), "fixed");
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.queryByLabelText("Percent")).not.toBeInTheDocument();
  });

  it("shows a fixed discount's centavos as pesos", () => {
    render(
      <DiscountForm
        action={vi.fn()}
        businessId="b-1"
        discount={discount({ kind: "fixed", value: 5000 })}
      />,
    );
    expect(screen.getByLabelText("Amount")).toHaveValue("50.00");
  });

  it("shows a percentage as a bare number, not as pesos", () => {
    render(<DiscountForm action={vi.fn()} businessId="b-1" discount={discount()} />);
    expect(screen.getByLabelText("Percent")).toHaveValue("10");
  });

  it("carries the id and scope when editing", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <DiscountForm
        action={action}
        businessId="b-1"
        discount={discount({ appliesTo: "order", active: false })}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("id")).toBe("d-1");
    expect(formData.get("appliesTo")).toBe("order");
    // An unchecked checkbox posts nothing at all.
    expect(formData.get("active")).toBeNull();
  });

  it("puts a value error on the value field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { value: "Enter a whole percentage between 1 and 100." },
      }),
    );
    render(<DiscountForm action={action} businessId="b-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Add discount" }));
    expect(await screen.findByLabelText("Percent")).toHaveAccessibleDescription(
      "Enter a whole percentage between 1 and 100.",
    );
  });
});
