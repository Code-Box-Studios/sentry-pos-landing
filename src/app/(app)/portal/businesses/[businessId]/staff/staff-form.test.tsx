import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffForm, OneTimePin } from "./staff-form";
import type { StaffFormAction } from "./action-state";

it("submits a cashier with checked branch assignments", async () => {
  const action = vi.fn<StaffFormAction>(async () => ({}));
  render(
    <StaffForm
      businessId="business"
      branches={[{ id: "branch", name: "Main" }]}
      action={action}
    />,
  );
  await userEvent.type(screen.getByLabelText("Name"), "Ana");
  await userEvent.click(screen.getByLabelText("Main"));
  await userEvent.click(
    screen.getByRole("button", { name: "Add staff member" }),
  );
  const data = action.mock.calls[0]?.[1] as unknown as FormData;
  expect(data.get("role")).toBe("cashier");
  expect(data.getAll("branchIds")).toEqual(["branch"]);
});
it("explains the emailed manager PIN and does not render a permanent PIN field", async () => {
  render(<StaffForm businessId="business" branches={[]} action={vi.fn()} />);
  await userEvent.selectOptions(screen.getByLabelText("Role"), "manager");
  expect(screen.getByText(/temporary PIN is emailed/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/permanent PIN/i)).not.toBeInTheDocument();
});
it("dismisses the one-time cashier PIN without a reveal-again control", async () => {
  const { rerender } = render(<OneTimePin pin="123456" />);
  expect(screen.getByText("123456")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "I have shared this PIN" }),
  );
  rerender(<OneTimePin pin="123456" />);
  expect(screen.queryByText("123456")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /reveal/i }),
  ).not.toBeInTheDocument();
});
it("keeps repeated staff form labels unique and uses pill actions", () => {
  render(
    <>
      <StaffForm
        businessId="business"
        branches={[{ id: "branch", name: "Main" }]}
        action={vi.fn()}
      />
      <StaffForm
        businessId="business"
        branches={[{ id: "branch", name: "Main" }]}
        action={vi.fn()}
      />
    </>,
  );
  const names = screen.getAllByLabelText("Name");
  expect(new Set(names.map((input) => input.id)).size).toBe(2);
  for (const button of screen.getAllByRole("button", {
    name: "Add staff member",
  }))
    expect(button).toHaveClass("rounded-full");
});
