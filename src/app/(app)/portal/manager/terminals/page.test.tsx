import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("@/lib/api/manager", () => ({
  getManagerContext: async () => ({
    business: { id: "b", name: "Shop" },
    branches: [{ id: "br", name: "Main" }],
  }),
}));
vi.mock("@/lib/api/portal", () => ({
  listTerminals: async () => [
    {
      id: "t",
      name: "Till",
      code: "T1",
      branchId: "br",
      paired: true,
      lastSeenAt: null,
    },
  ],
}));
vi.mock("../../businesses/[businessId]/terminals/actions", () => ({
  unpairTerminalAction: vi.fn(),
}));
import TerminalsPage from "./page";
it("offers confirmed remote unpairing for assigned terminals", async () => {
  render(await TerminalsPage());
  expect(screen.getByRole("button", { name: "Unpair" })).toBeInTheDocument();
  expect(screen.queryByText(/only the owner can.*unpair/i)).toBeNull();
});
