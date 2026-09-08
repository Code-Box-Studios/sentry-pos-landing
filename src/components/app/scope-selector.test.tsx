import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScopeSelector } from "./scope-selector";
import type { Branch, Business } from "@/lib/api/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/portal/analytics/overview",
}));

const businesses = [
  { id: "b-1", name: "Kape" },
  { id: "b-2", name: "Tindahan" },
] as Business[];

const branches = [
  { id: "br-1", businessId: "b-1", name: "Main" },
  { id: "br-2", businessId: "b-1", name: "Annex" },
] as Branch[];

const SCOPE = { from: "2026-03-01", to: "2026-03-07" };

function setup(scope = SCOPE) {
  push.mockClear();
  render(
    <ScopeSelector businesses={businesses} branches={branches} scope={scope} />,
  );
}

describe("ScopeSelector", () => {
  it("writes the chosen business into the URL", async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-1");
    expect(push).toHaveBeenCalledWith(expect.stringContaining("businessId=b-1"));
  });

  it("keeps the dates when the business changes", async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-1");
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("from=2026-03-01");
    expect(url).toContain("to=2026-03-07");
  });

  // The API rejects a branchId without a businessId, so the UI must never be
  // able to produce that combination.
  it("drops the branch when the business is cleared", async () => {
    push.mockClear();
    render(
      <ScopeSelector
        businesses={businesses}
        branches={branches}
        scope={{ ...SCOPE, businessId: "b-1", branchId: "br-1" }}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Business"), "");
    const url = push.mock.calls[0][0] as string;
    expect(url).not.toContain("branchId");
    expect(url).not.toContain("businessId");
  });

  it("offers no branch picker until a business is chosen", () => {
    setup();
    expect(screen.queryByLabelText("Branch")).toBeNull();
  });

  it("offers only that business's branches", () => {
    render(
      <ScopeSelector
        businesses={businesses}
        branches={branches}
        scope={{ ...SCOPE, businessId: "b-1" }}
      />,
    );
    const options = Array.from(
      screen.getByLabelText("Branch").querySelectorAll("option"),
    ).map((o) => o.textContent);
    expect(options).toEqual(["All branches", "Main", "Annex"]);
  });

  it("turns a preset into literal dates", async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText("Range"), "7d");
    const url = push.mock.calls[0][0] as string;
    expect(url).toMatch(/from=\d{4}-\d{2}-\d{2}/);
    expect(url).toMatch(/to=\d{4}-\d{2}-\d{2}/);
    expect(url).not.toContain("preset");
  });

  // `fireEvent.change` rather than `userEvent.type`: a date input takes a whole
  // value, and typing into it character by character fires a change per
  // keystroke with a partial (invalid) date.
  it("writes a custom date straight through", () => {
    setup();
    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2026-02-01" },
    });
    expect(push).toHaveBeenCalledWith(expect.stringContaining("from=2026-02-01"));
  });

  it("keeps the business and branch when only a date changes", () => {
    push.mockClear();
    render(
      <ScopeSelector
        businesses={businesses}
        branches={branches}
        scope={{ ...SCOPE, businessId: "b-1", branchId: "br-1" }}
      />,
    );
    fireEvent.change(screen.getByLabelText("To"), {
      target: { value: "2026-03-31" },
    });
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("to=2026-03-31");
    expect(url).toContain("businessId=b-1");
    expect(url).toContain("branchId=br-1");
  });
});
