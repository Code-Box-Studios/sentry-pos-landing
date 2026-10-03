import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveStaffAction, staffControlAction } from "./actions";

const api = vi.hoisted(() => ({
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  controlStaff: vi.fn(),
}));
vi.mock("@/lib/api/staff", () => api);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
function form(role = "cashier") {
  const data = new FormData();
  data.set("businessId", "business");
  data.set("name", " Ana ");
  data.set("role", role);
  data.append("branchIds", "branch-1");
  data.append("branchIds", "branch-2");
  return data;
}
describe("staff actions", () => {
  it("creates a PIN-only cashier and returns the PIN only in the action result", async () => {
    api.createStaff.mockResolvedValueOnce({
      staff: { userId: "cashier" },
      temporaryPin: "123456",
    });
    expect(await saveStaffAction({}, form())).toMatchObject({
      done: true,
      temporaryPin: "123456",
    });
    expect(api.createStaff).toHaveBeenCalledWith("business", {
      name: "Ana",
      role: "cashier",
      email: null,
      branchIds: ["branch-1", "branch-2"],
    });
  });
  it("requires a manager email and at least one branch before calling the API", async () => {
    expect(await saveStaffAction({}, form("manager"))).toHaveProperty(
      "fieldErrors.email",
    );
    const data = form();
    data.delete("branchIds");
    expect(await saveStaffAction({}, data)).toHaveProperty(
      "fieldErrors.branchIds",
    );
    expect(api.createStaff).not.toHaveBeenCalled();
  });
  it("edits the selected human and normalizes manager email", async () => {
    api.updateStaff.mockResolvedValueOnce({ staff: { userId: "manager" } });
    const data = form("manager");
    data.set("userId", "manager");
    data.set("email", " MIA@EXAMPLE.TEST ");
    await saveStaffAction({}, data);
    expect(api.updateStaff).toHaveBeenCalledWith(
      "business",
      "manager",
      expect.objectContaining({ email: "mia@example.test" }),
    );
  });
  it("requires confirmation for resets and deactivation, and rejects unknown operations", async () => {
    const data = form();
    data.set("userId", "cashier");
    data.set("intent", "deactivate");
    expect(await staffControlAction({}, data)).toHaveProperty("message");
    data.set("confirmation", "on");
    api.controlStaff.mockResolvedValueOnce({ staff: { userId: "cashier" } });
    await staffControlAction({}, data);
    expect(api.controlStaff).toHaveBeenCalledWith(
      "business",
      "cashier",
      "deactivate",
    );
    data.set("intent", "delete");
    expect(await staffControlAction({}, data)).toHaveProperty("message");
    expect(api.controlStaff).toHaveBeenCalledTimes(1);
  });
});
