import { beforeEach, expect, it, vi } from "vitest";
import { transferAction, saveCountAction, postCountAction } from "./actions";
const { readPortalRole } = vi.hoisted(() => ({ readPortalRole: vi.fn(async () => "owner") }));
vi.mock("@/lib/auth/portal-role", () => ({ readPortalRole }));
vi.mock("@/lib/api/manager", () => ({
  getManagerContext: async () => ({ business: { id: "business" }, branches: [{ id: "source" }] }),
  getManagerTransferBranches: async () => [{ id: "source" }, { id: "destination" }],
}));
const api = vi.hoisted(() => ({
  transferStock: vi.fn(),
  createCount: vi.fn(),
  updateCount: vi.fn(),
  postCount: vi.fn(),
}));
vi.mock("@/lib/api/inventory", () => api);
vi.mock("@/lib/api/portal", () => ({
  getBranch: async () => ({ businessId: "business" }),
  listBranches: async () => [{ id: "source" }, { id: "destination" }],
  listProducts: async () => [{ id: "p", name: "Rice", trackStock: true, variants: [] }],
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
function form() {
  const data = new FormData();
  data.set("businessId", "business");
  data.set("branchId", "source");
  data.set("id", "e3c1bffa-9760-4f53-9c63-3e099442150a");
  return data;
}
it("rejects a destination not in the business before transferring", async () => {
  const data = form();
  data.set("toBranchId", "other");
  data.append("target", "p");
  data.append("qty", "2");
  expect(await transferAction({}, data)).toHaveProperty("fieldErrors.toBranchId");
  expect(api.transferStock).not.toHaveBeenCalled();
});
it("rejects an unassigned manager source before changing inventory", async () => {
  readPortalRole.mockResolvedValueOnce("manager");
  const data = form(); data.set("branchId", "unassigned"); data.append("target", "p"); data.append("qty", "1");
  expect(await saveCountAction({}, data)).toHaveProperty("message");
  expect(api.createCount).not.toHaveBeenCalled();
});
it("preserves the request identity and fractional quantity", async () => {
  const data = form();
  data.set("toBranchId", "destination");
  data.append("target", "p");
  data.append("qty", "0.25");
  expect(await transferAction({}, data)).toEqual({ done: true });
  expect(api.transferStock).toHaveBeenCalledWith(
    "source",
    expect.objectContaining({ id: data.get("id"), lines: [{ productId: "p", qty: 0.25 }] }),
  );
});
it("accepts a zero physical count without changing stock until posted", async () => {
  const data = form();
  data.append("target", "p");
  data.append("qty", "0");
  expect(await saveCountAction({}, data)).toEqual({ done: true });
  expect(api.createCount).toHaveBeenCalledWith(
    "source",
    expect.objectContaining({ items: [{ productId: "p", countedQty: 0 }] }),
  );
  expect(api.postCount).not.toHaveBeenCalled();
});
it("requires explicit confirmation to post a count", async () => {
  expect(await postCountAction({}, form())).toHaveProperty("message");
  expect(api.postCount).not.toHaveBeenCalled();
});

beforeEach(() => vi.clearAllMocks());
it("rejects a physical count for a product outside the business", async () => {
  const data = form();
  data.append("target", "foreign-product");
  data.append("qty", "1");
  expect(await saveCountAction({}, data)).toHaveProperty("message");
  expect(api.createCount).not.toHaveBeenCalled();
});
it("rejects duplicate target rows without posting partial quantities", async () => {
  const data = form();
  data.set("toBranchId", "destination");
  data.append("target", "p");
  data.append("qty", "1");
  data.append("target", "p");
  data.append("qty", "2");
  expect(await transferAction({}, data)).toHaveProperty("message");
  expect(api.transferStock).not.toHaveBeenCalled();
});
it("routes edited drafts through update rather than creating a second count", async () => {
  const data = form();
  data.set("editing", "yes");
  data.append("target", "p");
  data.append("qty", "3");
  expect(await saveCountAction({}, data)).toEqual({ done: true });
  expect(api.updateCount).toHaveBeenCalledOnce();
  expect(api.createCount).not.toHaveBeenCalled();
});
