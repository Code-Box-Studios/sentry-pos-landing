import { beforeEach, expect, it, vi } from "vitest";
import { setupStaffAction } from "./actions";
const api = vi.hoisted(() => ({
  setupManager: vi.fn(),
  setupStaffPassword: vi.fn(),
}));
const session = vi.hoisted(() => ({ writeSession: vi.fn() }));
vi.mock("@/lib/api/auth", () => api);
vi.mock("@/lib/auth/session", () => session);
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(path);
  },
}));
beforeEach(() => vi.clearAllMocks());
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    email: " MIA@EXAMPLE.TEST ",
    temporaryPin: "123456",
    password: "new-password",
    confirmPassword: "new-password",
    permanentPin: "654321",
    confirmPin: "654321",
  }))
    data.set(key, value);
  return data;
}
it("finishes both manager credentials before storing the httpOnly session", async () => {
  api.setupManager.mockResolvedValue({
    accessToken: "access",
    refreshToken: "refresh",
    role: "manager",
  });
  await expect(setupStaffAction({}, form())).rejects.toThrow("/portal/manager");
  expect(api.setupManager).toHaveBeenCalledWith({
    email: "mia@example.test",
    temporaryPin: "123456",
    password: "new-password",
    permanentPin: "654321",
  });
  expect(session.writeSession).toHaveBeenCalledWith("access", "refresh");
});
it("rejects unchanged temporary PIN and mismatched confirmations without a session", async () => {
  const data = form();
  data.set("permanentPin", "123456");
  data.set("confirmPin", "123456");
  expect(await setupStaffAction({}, data)).toHaveProperty(
    "fieldErrors.permanentPin",
  );
  data.set("permanentPin", "654321");
  data.set("confirmPassword", "wrong");
  expect(await setupStaffAction({}, data)).toHaveProperty(
    "fieldErrors.confirmPassword",
  );
  expect(session.writeSession).not.toHaveBeenCalled();
  expect(api.setupManager).not.toHaveBeenCalled();
});
it("uses password-only reset without changing the existing terminal PIN", async () => {
  const data = form();
  data.set("mode", "password");
  data.delete("permanentPin");
  data.delete("confirmPin");
  api.setupStaffPassword.mockResolvedValue({
    accessToken: "access",
    refreshToken: "refresh",
    role: "manager",
  });
  await expect(setupStaffAction({}, data)).rejects.toThrow("/portal/manager");
  expect(api.setupStaffPassword).toHaveBeenCalledWith({
    email: "mia@example.test",
    temporaryPin: "123456",
    password: "new-password",
  });
  expect(api.setupManager).not.toHaveBeenCalled();
});
