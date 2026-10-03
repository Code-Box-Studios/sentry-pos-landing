import { beforeEach, expect, it, vi } from "vitest";
import { updateOwnerAction } from "./actions";
const updateOwner = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/admin", () => ({ updateOwner }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("rejects fractional or partially numeric limits instead of truncating them", async () => {
  for (const value of ["2.5", "2abc", "0", "1001"]) {
    const data = new FormData();
    data.set("name", "Owner");
    data.set("maxBusinesses", value);
    expect(await updateOwnerAction({}, data)).toHaveProperty("fieldErrors.maxBusinesses");
  }
  expect(updateOwner).not.toHaveBeenCalled();
});
it("saves the owner name and business limit", async () => {
  const data = new FormData();
  data.set("ownerId", "o1");
  data.set("name", " New name ");
  data.set("maxBusinesses", "4");
  expect(await updateOwnerAction({}, data)).toEqual({ done: true });
  expect(updateOwner).toHaveBeenCalledWith("o1", { name: "New name", maxBusinesses: 4 });
});
