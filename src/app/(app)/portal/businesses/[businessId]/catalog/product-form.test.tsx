import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "./product-form";
import type { FormState } from "@/lib/forms/form-state";
import type { Category, Product } from "@/lib/api/types";

const CATEGORIES: Category[] = [
  {
    id: "c-1",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    deletedAt: null,
    businessId: "b-1",
    name: "Drinks",
    sortOrder: 0,
  },
];

const PRODUCT: Product = {
  id: "p-1",
  businessId: "b-1",
  categoryId: "c-1",
  name: "Iced Latte",
  sku: "ICL",
  barcode: null,
  priceC: 12000,
  costC: 4500,
  soldBy: "unit",
  lowStockThreshold: null,
  imagePath: null,
  trackStock: false,
  trackExpiry: false,
  active: true,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  deletedAt: null,
  variants: [
    {
      id: "v-1",
      productId: "p-1",
      name: "Large",
      sku: null,
      barcode: null,
      priceC: 14000,
      costC: null,
    },
  ],
};

const noop = async (): Promise<FormState> => ({});

describe("ProductForm", () => {
  it("posts a new product with its business id", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ProductForm action={action} businessId="b-1" categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Name"), "Espresso");
    await userEvent.type(screen.getByLabelText("Price"), "95.00");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("businessId")).toBe("b-1");
    expect(formData.get("name")).toBe("Espresso");
    expect(formData.get("price")).toBe("95.00");
    expect(formData.get("id")).toBeNull();
  });

  it("shows an existing product in pesos, not centavos", () => {
    render(
      <ProductForm action={noop} businessId="b-1" categories={CATEGORIES} product={PRODUCT} />,
    );
    expect(screen.getByLabelText("Price")).toHaveValue("120.00");
    expect(screen.getByLabelText("Cost")).toHaveValue("45.00");
  });

  it("carries the product id when editing", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <ProductForm action={action} businessId="b-1" categories={CATEGORIES} product={PRODUCT} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save product" }));
    expect((action.mock.calls[0][1] as FormData).get("id")).toBe("p-1");
  });

  it("posts each existing variant with its id, so it updates rather than duplicating", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <ProductForm action={action} businessId="b-1" categories={CATEGORIES} product={PRODUCT} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save product" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.getAll("variantId")).toEqual(["v-1"]);
    expect(formData.getAll("variantName")).toEqual(["Large"]);
    expect(formData.getAll("variantPrice")).toEqual(["140.00"]);
  });

  it("posts a new variant with an empty id", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ProductForm action={action} businessId="b-1" categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Name"), "Tea");
    await userEvent.type(screen.getByLabelText("Price"), "80");
    await userEvent.click(screen.getByRole("button", { name: "Add variant" }));
    await userEvent.type(screen.getByLabelText("Variant"), "Iced");
    await userEvent.type(screen.getByLabelText("Variant price"), "85");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.getAll("variantId")).toEqual([""]);
    expect(formData.getAll("variantName")).toEqual(["Iced"]);
    expect(formData.getAll("variantPrice")).toEqual(["85"]);
  });

  it("stops posting a variant once it is removed, which is how the API deletes it", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <ProductForm action={action} businessId="b-1" categories={CATEGORIES} product={PRODUCT} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Save product" }));

    expect((action.mock.calls[0][1] as FormData).getAll("variantName")).toEqual([]);
  });

  it("defaults a new product to active and untracked", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ProductForm action={action} businessId="b-1" categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Name"), "Bread");
    await userEvent.type(screen.getByLabelText("Price"), "50");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("active")).toBe("on");
    expect(formData.get("trackStock")).toBeNull();
  });

  it("puts a duplicate-SKU conflict where it can be corrected", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ fieldErrors: { sku: "sku already exists" } }),
    );
    render(<ProductForm action={action} businessId="b-1" categories={CATEGORIES} />);

    await userEvent.click(screen.getByRole("button", { name: "Create product" }));
    expect(await screen.findByLabelText("SKU")).toHaveAccessibleDescription("sku already exists");
  });
});
