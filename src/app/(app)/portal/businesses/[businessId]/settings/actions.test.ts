import { expect, it, vi } from "vitest";
const { updateBusiness } = vi.hoisted(() => ({ updateBusiness: vi.fn() }));
vi.mock("@/lib/api/portal", () => ({ updateBusiness }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveBusinessSettingsAction } from "./actions";
it("saves the owner's blind-close policy", async () => {
  const data = new FormData();
  for (const [key, value] of Object.entries({ businessId: "business", name: "Shop", type: "retail", taxRate: "12", dayStartTime: "00:00", blindCloseEnabled: "on" })) data.set(key, value);
  expect(await saveBusinessSettingsAction({}, data)).toEqual({ done: true });
  expect(updateBusiness).toHaveBeenCalledWith("business", expect.objectContaining({ blindCloseEnabled: true }));
});
