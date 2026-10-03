import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BusinessForm, DeleteBusinessForm } from "./business-form";
import type { FormState } from "@/lib/forms/form-state";
const actions = vi.hoisted(() => ({
  createBusinessAction: vi.fn<(state: FormState, form: FormData) => Promise<FormState>>(
    async () => ({}),
  ),
  deleteBusinessAction: vi.fn<(state: FormState, form: FormData) => Promise<FormState>>(
    async () => ({ fieldErrors: { confirmation: "Type the business name exactly to confirm." } }),
  ),
}));
vi.mock("./actions", () => actions);
it("lets an invited owner enter their business and reporting cutoff", async () => {
  render(<BusinessForm />);
  await userEvent.type(screen.getByLabelText("Business name"), "Kape");
  await userEvent.selectOptions(screen.getByLabelText("Business type"), "fnb");
  await userEvent.click(screen.getByRole("button", { name: "Create business" }));
  const data = actions.createBusinessAction.mock.calls[0][1];
  expect(data.get("name")).toBe("Kape");
  expect(data.get("type")).toBe("fnb");
  expect(data.get("dayStartTime")).toBe("00:00");
});
it("shows delete confirmation errors without removing the form", async () => {
  render(<DeleteBusinessForm id="b1" name="Kape" />);
  await userEvent.type(screen.getByLabelText("Confirm business name"), "wrong");
  await userEvent.click(screen.getByRole("button", { name: "Delete business" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Type the business name exactly");
  expect(actions.deleteBusinessAction.mock.calls[0][1].get("businessId")).toBe("b1");
});
