import { expect, it, vi } from "vitest";
const { login, redirect } = vi.hoisted(() => ({ login: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/api/auth", () => ({ login }));
vi.mock("@/lib/auth/session", () => ({ writeSession: vi.fn(), writePreauthToken: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));
import { loginAction } from "./actions";
it("sends a manager to their workspace instead of the owner portal", async () => {
  login.mockResolvedValue({ accessToken: "token", refreshToken: "refresh", role: "manager" });
  for (const next of ["", "/portal/settings", "//elsewhere.test"]) {
    const data = new FormData(); data.set("email", "manager@example.test"); data.set("password", "password"); data.set("next", next);
    await loginAction({}, data);
    expect(redirect).toHaveBeenLastCalledWith("/portal/manager");
  }
});
