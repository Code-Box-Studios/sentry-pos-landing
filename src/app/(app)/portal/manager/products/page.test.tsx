import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("@/lib/api/manager", () => ({
  getManagerContext: async () => ({ business: { id: "b", name: "Shop" } }),
}));
vi.mock("@/lib/api/portal", () => ({
  listProducts: async () => [
    {
      id: "p",
      name: "Milk",
      sku: "MILK",
      priceC: 5000,
      active: true,
      variants: [],
      trackStock: true,
    },
  ],
}));
import ProductsPage from "./page";
it("shows the read-only manager catalog without edit or cost controls", async () => {
  render(await ProductsPage());
  expect(screen.getByText("Milk")).toBeInTheDocument();
  expect(screen.queryByText(/cost|profit|margin/i)).toBeNull();
  expect(screen.queryByRole("button", { name: /save|delete|add/i })).toBeNull();
});
