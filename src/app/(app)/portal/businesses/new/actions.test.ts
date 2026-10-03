import { expect, it, vi } from "vitest";
import { createBusinessAction, deleteBusinessAction } from "./actions";
const { createBusiness, deleteBusiness, getBusiness } = vi.hoisted(() => ({
  createBusiness: vi.fn(),
  deleteBusiness: vi.fn(),
  getBusiness: vi.fn(),
}));
vi.mock("@/lib/api/portal", () => ({ createBusiness, deleteBusiness, getBusiness }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));
it("creates a real business then opens its branch setup", async () => {
  createBusiness.mockResolvedValue({ id: "b1" });
  const form = new FormData();
  form.set("name", " Kape ");
  form.set("type", "fnb");
  form.set("taxRate", "12");
  form.set("dayStartTime", "06:00");
  await expect(createBusinessAction({}, form)).rejects.toThrow("/portal/businesses/b1/branches");
  expect(createBusiness).toHaveBeenCalledWith(
    expect.objectContaining({ name: "Kape", type: "fnb", taxRate: 0.12, dayStartTime: "06:00" }),
  );
});
it("requires the current business name before deleting", async () => {
  getBusiness.mockResolvedValue({ name: "Kape" });
  const form = new FormData();
  form.set("businessId", "b1");
  form.set("confirmation", "wrong");
  expect(await deleteBusinessAction({}, form)).toHaveProperty("fieldErrors.confirmation");
  expect(deleteBusiness).not.toHaveBeenCalled();
});
