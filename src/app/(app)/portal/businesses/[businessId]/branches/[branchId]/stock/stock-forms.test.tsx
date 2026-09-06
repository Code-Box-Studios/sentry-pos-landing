import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdjustForm } from "./adjust-form";
import { ReceiveForm } from "./receive-form";
import { toOptions } from "./target-select";
import type { FormState } from "@/lib/forms/form-state";
import type { Product } from "@/lib/api/types";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "p-1",
    businessId: "b-1",
    categoryId: "c-1",
    name: "Beans",
    sku: null,
    barcode: null,
    priceC: 50000,
    costC: null,
    soldBy: "weight",
    lowStockThreshold: null,
    imagePath: null,
    trackStock: true,
    trackExpiry: false,
    active: true,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    deletedAt: null,
    variants: [],
    ...overrides,
  };
}

const OPTIONS = [
  { value: "p-1", label: "Beans" },
  { value: "p-2:v-1", label: "Latte — Large" },
];

describe("toOptions", () => {
  it("offers a tracked product with no variants as itself", () => {
    expect(toOptions([product()])).toEqual([{ value: "p-1", label: "Beans" }]);
  });

  it("offers only the variants of a product that has them", () => {
    const withVariants = product({
      id: "p-2",
      name: "Latte",
      variants: [
        {
          id: "v-1",
          productId: "p-2",
          name: "Large",
          sku: null,
          barcode: null,
          priceC: 14000,
          costC: null,
        },
      ],
    });
    expect(toOptions([withVariants])).toEqual([{ value: "p-2:v-1", label: "Latte — Large" }]);
  });

  it("leaves out products that do not track stock", () => {
    expect(toOptions([product({ trackStock: false })])).toEqual([]);
  });
});

describe("ReceiveForm", () => {
  it("posts the branch, the target and the quantity", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <ReceiveForm action={action} businessId="b-1" branchId="br-1" options={OPTIONS} />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Product"), "p-1");
    await userEvent.type(screen.getByLabelText("Quantity received"), "2.5");
    await userEvent.type(screen.getByLabelText("Unit cost"), "120.00");
    await userEvent.click(screen.getByRole("button", { name: "Receive stock" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("branchId")).toBe("br-1");
    expect(formData.get("target")).toBe("p-1");
    expect(formData.get("qty")).toBe("2.5");
    expect(formData.get("unitCost")).toBe("120.00");
  });

  it("posts a variant target as productId:variantId", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <ReceiveForm action={action} businessId="b-1" branchId="br-1" options={OPTIONS} />,
    );

    await userEvent.selectOptions(screen.getByLabelText("Product"), "p-2:v-1");
    await userEvent.type(screen.getByLabelText("Quantity received"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Receive stock" }));

    expect((action.mock.calls[0][1] as FormData).get("target")).toBe("p-2:v-1");
  });

  it("shows a quantity error on the quantity field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { qty: "Enter a quantity above zero, with at most 3 decimals." },
      }),
    );
    render(
      <ReceiveForm action={action} businessId="b-1" branchId="br-1" options={OPTIONS} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Receive stock" }));
    expect(await screen.findByLabelText("Quantity received")).toHaveAccessibleDescription(
      /at most 3 decimals/,
    );
  });
});

describe("AdjustForm", () => {
  it("says plainly that the count is absolute, not a difference", () => {
    render(<AdjustForm action={vi.fn()} businessId="b-1" branchId="br-1" options={OPTIONS} />);
    expect(screen.getByText(/not the difference/i)).toBeInTheDocument();
  });

  it("posts the new count and the reason", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<AdjustForm action={action} businessId="b-1" branchId="br-1" options={OPTIONS} />);

    await userEvent.selectOptions(screen.getByLabelText("Product"), "p-1");
    await userEvent.type(screen.getByLabelText("New count"), "12");
    await userEvent.selectOptions(screen.getByLabelText("Reason"), "damage");
    await userEvent.type(screen.getByLabelText("Note"), "Dropped a sack");
    await userEvent.click(screen.getByRole("button", { name: "Record adjustment" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("newQty")).toBe("12");
    expect(formData.get("reasonCategory")).toBe("damage");
    expect(formData.get("note")).toBe("Dropped a sack");
  });

  it("offers every reason the API accepts", () => {
    render(<AdjustForm action={vi.fn()} businessId="b-1" branchId="br-1" options={OPTIONS} />);
    const values = Array.from(
      screen.getByLabelText("Reason").querySelectorAll("option"),
    ).map((option) => option.value);
    expect(values).toEqual([
      "damage",
      "expiry",
      "theft_loss",
      "count_correction",
      "other",
    ]);
  });
});
