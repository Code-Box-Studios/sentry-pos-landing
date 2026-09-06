import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusControls } from "./status-controls";
import type { FormState } from "@/lib/forms/form-state";

const noop = async (): Promise<FormState> => ({});

describe("StatusControls", () => {
  it("does not suspend on a single click — the tier must be confirmed", async () => {
    const suspend = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <StatusControls
        ownerId="o-1"
        status="active"
        suspendAction={suspend}
        reinstateAction={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));
    expect(suspend).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm suspension" })).toBeInTheDocument();
  });

  it("sends the chosen tier once confirmed", async () => {
    const suspend = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <StatusControls
        ownerId="o-1"
        status="active"
        suspendAction={suspend}
        reinstateAction={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Hard suspend" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm hard suspension" }));

    const formData = suspend.mock.calls[0][1] as FormData;
    expect(formData.get("ownerId")).toBe("o-1");
    expect(formData.get("tier")).toBe("hard");
  });

  it("spells out what a hard suspension does before it is confirmed", async () => {
    render(
      <StatusControls ownerId="o-1" status="active" suspendAction={noop} reinstateAction={noop} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Hard suspend" }));
    expect(screen.getByRole("alert")).toHaveTextContent("stops every terminal immediately");
  });

  it("backs out of a pending suspension", async () => {
    const suspend = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <StatusControls
        ownerId="o-1"
        status="active"
        suspendAction={suspend}
        reinstateAction={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();
    expect(suspend).not.toHaveBeenCalled();
  });

  it("offers reinstatement — and only that — for a suspended owner", async () => {
    const reinstate = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <StatusControls
        ownerId="o-1"
        status="hard_suspended"
        suspendAction={noop}
        reinstateAction={reinstate}
      />,
    );

    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reinstate account" }));
    expect((reinstate.mock.calls[0][1] as FormData).get("ownerId")).toBe("o-1");
  });
});
