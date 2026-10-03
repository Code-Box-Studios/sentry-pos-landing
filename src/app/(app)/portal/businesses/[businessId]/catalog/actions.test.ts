import { beforeEach, expect, it, vi } from "vitest";
import { saveProductAction } from "./actions";
const api = vi.hoisted(() => ({
  createProduct: vi.fn(async () => ({ id: "product" })),
  updateProduct: vi.fn(async () => ({ id: "product" })),
}));
vi.mock("@/lib/api/portal", () => api);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));
beforeEach(() => vi.clearAllMocks());
function form(threshold: string) {
  const data = new FormData();
  data.set("businessId", "b1");
  data.set("name", "Rice");
  data.set("price", "25");
  data.set("lowStockThreshold", threshold);
  return data;
}
it("saves a fractional low-stock threshold", async () => {
  await expect(saveProductAction({}, form("0.125"))).rejects.toThrow("catalog/product");
  expect(api.createProduct).toHaveBeenCalledWith(
    "b1",
    expect.objectContaining({ lowStockThreshold: 0.125 }),
  );
});
it("clears the threshold when the owner empties it", async () => {
  const data = form("");
  data.set("id", "product");
  await expect(saveProductAction({}, data)).rejects.toThrow("catalog/product");
  expect(api.updateProduct).toHaveBeenCalledWith(
    "product",
    expect.objectContaining({ lowStockThreshold: null }),
  );
});
it("rejects negative or overprecise thresholds", async () => {
  for (const value of ["-1", "0.0001", "NaN"])
    expect(await saveProductAction({}, form(value))).toHaveProperty(
      "fieldErrors.lowStockThreshold",
    );
  expect(api.createProduct).not.toHaveBeenCalled();
});
