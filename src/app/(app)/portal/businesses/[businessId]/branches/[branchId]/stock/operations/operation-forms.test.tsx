import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Branch } from "@/lib/api/types";
import type { FormState } from "@/lib/forms/form-state";
import { OperationForm } from "./operation-forms";
const actions = vi.hoisted(() => ({
  transferAction: vi.fn<
    (state: FormState, data: FormData) => Promise<FormState & { uncertain?: true }>
  >(async () => ({ message: "Connection interrupted. Try again." })),
  saveCountAction: vi.fn<
    (state: FormState, data: FormData) => Promise<FormState & { uncertain?: true }>
  >(async () => ({})),
  postCountAction: vi.fn(),
}));
vi.mock("./actions", () => actions);
const props = {
  businessId: "b1",
  branchId: "source",
  requestId: "request-1",
  options: [{ value: "rice:small", label: "Rice — Small" }],
  branches: [
    { id: "source", name: "Main", businessId: "b1" },
    { id: "destination", name: "Annex", businessId: "b1" },
    { id: "foreign", name: "Foreign branch", businessId: "b2" },
  ] as Branch[],
};
beforeEach(() => vi.clearAllMocks());
it("offers destinations only within the current business", () => {
  render(<OperationForm {...props} mode="transfer" />);
  expect(screen.queryByRole("option", { name: "Foreign branch" })).toBeNull();
  expect(screen.queryByRole("option", { name: "Main" })).toBeNull();
  expect(screen.getByRole("option", { name: "Annex" })).toBeInTheDocument();
});
it("keeps the transfer identity when retrying after an uncertain response", async () => {
  render(<OperationForm {...props} mode="transfer" />);
  await userEvent.selectOptions(screen.getByLabelText("Destination branch"), "destination");
  await userEvent.type(screen.getByLabelText("Rice — Small quantity"), "0.25");
  await userEvent.click(screen.getByRole("button", { name: "Transfer stock" }));
  await screen.findByText("Connection interrupted. Try again.");
  await userEvent.click(screen.getByRole("button", { name: "Transfer stock" }));
  expect(actions.transferAction.mock.calls).toHaveLength(2);
  for (const [, data] of actions.transferAction.mock.calls) {
    expect(data.get("id")).toBe("request-1");
    expect(data.get("target")).toBe("rice:small");
    expect(data.get("qty")).toBe("0.25");
  }
});

it("locks an uncertain operation until the original payload is retried", async () => {
  actions.transferAction.mockResolvedValueOnce({
    uncertain: true,
    message: "Retry the original operation.",
  });
  render(<OperationForm {...props} mode="transfer" />);
  await userEvent.selectOptions(screen.getByLabelText("Destination branch"), "destination");
  await userEvent.type(screen.getByLabelText("Rice — Small quantity"), "2");
  await userEvent.click(screen.getByRole("button", { name: "Transfer stock" }));
  await screen.findByText("Retry the original operation.");
  expect(screen.getByLabelText("Destination branch")).toBeDisabled();
  expect(screen.getByLabelText("Rice — Small quantity")).toHaveAttribute("readonly");
  await userEvent.click(screen.getByRole("button", { name: "Retry original operation" }));
  expect(actions.transferAction.mock.calls[1][1].get("toBranchId")).toBe("destination");
  expect(actions.transferAction.mock.calls[1][1].get("qty")).toBe("2");
});
