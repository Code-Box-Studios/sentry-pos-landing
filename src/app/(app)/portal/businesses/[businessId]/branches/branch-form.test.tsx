import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BranchForm } from "./branch-form";
import type { FormState } from "@/lib/forms/form-state";
import type { Branch } from "@/lib/api/types";

const BRANCH: Branch = {
  id: "br-1",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  deletedAt: null,
  businessId: "b-1",
  name: "Marikit",
  code: "MKT",
  address: "12 Marikit St",
};

describe("BranchForm", () => {
  it("creates a branch with its code and address", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<BranchForm action={action} businessId="b-1" />);

    await userEvent.type(screen.getByLabelText("Branch name"), "Bayanihan");
    await userEvent.type(screen.getByLabelText("Code"), "BYN");
    await userEvent.type(screen.getByLabelText("Address"), "8 Bayanihan Ave");
    await userEvent.click(screen.getByRole("button", { name: "Add branch" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("businessId")).toBe("b-1");
    expect(formData.get("name")).toBe("Bayanihan");
    expect(formData.get("code")).toBe("BYN");
    expect(formData.get("address")).toBe("8 Bayanihan Ave");
  });

  it("passes a lowercase code through — the action uppercases it", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<BranchForm action={action} businessId="b-1" />);

    await userEvent.type(screen.getByLabelText("Code"), "byn");
    await userEvent.click(screen.getByRole("button", { name: "Add branch" }));

    expect((action.mock.calls[0][1] as FormData).get("code")).toBe("byn");
  });

  it("shows an existing branch's code as read-only text, never as an input", () => {
    render(<BranchForm action={vi.fn()} businessId="b-1" branch={BRANCH} />);
    expect(screen.queryByLabelText("Code")).not.toBeInTheDocument();
    expect(screen.getByText("MKT")).toBeInTheDocument();
  });

  it("still posts the code when editing, so the action's guard passes", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<BranchForm action={action} businessId="b-1" branch={BRANCH} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("id")).toBe("br-1");
    expect(formData.get("code")).toBe("MKT");
  });

  it("puts a duplicate code on the code field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { code: "Use 2–6 uppercase letters or digits, for example MKT." },
      }),
    );
    render(<BranchForm action={action} businessId="b-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Add branch" }));
    expect(await screen.findByLabelText("Code")).toHaveAccessibleDescription(
      "Use 2–6 uppercase letters or digits, for example MKT.",
    );
  });
});
