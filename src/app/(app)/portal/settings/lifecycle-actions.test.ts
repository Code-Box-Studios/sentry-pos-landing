import { beforeEach, expect, it, vi } from "vitest";
import { closeAccountAction, resetDemoAction } from "./lifecycle-actions";
const api = vi.hoisted(() => ({
  closeAccount: vi.fn(),
  resetDemo: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  clearSession: vi.fn(),
}));
vi.mock("@/lib/api/lifecycle", () => api);
vi.mock("@/lib/api/portal", () => ({ getBusiness: async () => ({ isDemo: false }) }));
vi.mock("@/lib/auth/session", () => ({ clearSession: api.clearSession }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: api.get, set: api.set }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(url);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("cannot close before a successful owner export", async () => {
  const form = new FormData();
  form.set("confirmation", "CLOSE MY ACCOUNT");
  expect(await closeAccountAction({}, form)).toHaveProperty("message");
  expect(api.closeAccount).not.toHaveBeenCalled();
});
it("requires typed confirmation even when an export exists", async () => {
  api.get.mockReturnValue({ value: "export" });
  expect(await closeAccountAction({}, new FormData())).toHaveProperty("fieldErrors.confirmation");
  expect(api.closeAccount).not.toHaveBeenCalled();
});
it("clears sessions only after the backend accepts closure", async () => {
  api.get.mockReturnValue({ value: "export" });
  api.closeAccount.mockResolvedValue({ purgeAfter: "2026-12-14T00:00:00Z" });
  const form = new FormData();
  form.set("confirmation", "CLOSE MY ACCOUNT");
  await expect(closeAccountAction({}, form)).rejects.toThrow("/account-closed");
  expect(api.clearSession).toHaveBeenCalledOnce();
});
it("refuses to reset a real business", async () => {
  const form = new FormData();
  form.set("confirmation", "RESET DEMO");
  form.set("businessId", "real");
  expect(await resetDemoAction({}, form)).toHaveProperty("message");
  expect(api.resetDemo).not.toHaveBeenCalled();
});
