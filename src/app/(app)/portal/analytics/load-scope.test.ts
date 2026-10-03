import { expect, it, vi } from "vitest";
import { loadScope } from "./load-scope";
vi.mock("@/lib/api/portal", () => ({ getBusiness: async () => ({ dayStartTime: "06:00" }) }));
const { role } = vi.hoisted(() => ({ role: vi.fn(async () => "owner") }));
vi.mock("@/lib/auth/portal-role", () => ({ readPortalRole: role }));
vi.mock("@/lib/api/manager", () => ({ getManagerContext: async () => ({
  business: { id: "assigned", name: "Shop", dayStartTime: "06:00" }, branches: [{ id: "br1" }],
}) }));
it("ends the default report at the active business day", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-14T18:00:00Z"));
  expect(await loadScope({ businessId: "b1" })).toEqual({
    businessId: "b1",
    branchId: undefined,
    from: "2026-09-08",
    to: "2026-09-14",
  });
  vi.useRealTimers();
});
it("keeps explicitly selected dates", async () => {
  expect(await loadScope({ businessId: "b1", from: "2026-08-01", to: "2026-08-31" })).toMatchObject(
    { from: "2026-08-01", to: "2026-08-31" },
  );
});
it("binds a manager's default scope to their assigned business without an owner-only fetch", async () => {
  role.mockResolvedValueOnce("manager");
  expect(await loadScope({ from: "2026-09-01", to: "2026-09-14" })).toMatchObject({ businessId: "assigned" });
});
