import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityTable } from "./activity-table";
import type { AuditEntry } from "@/lib/api/types";

function entry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: "a-1",
    createdAt: "2026-03-01T16:30:00.000Z",
    actorType: "owner",
    actorId: "u-1",
    ownerId: "o-1",
    businessId: "b-1",
    branchId: null,
    action: "portal.product.create",
    entityType: "product",
    entityId: "p-1",
    changes: {},
    metadata: {},
    ...overrides,
  };
}

describe("ActivityTable", () => {
  it("shows each entry's action, actor and Manila timestamp", () => {
    render(<ActivityTable entries={[entry()]} />);
    expect(screen.getByText("portal.product.create")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    // 16:30 UTC is 00:30 the next day in Manila.
    expect(screen.getByText(/2 Mar 2026/)).toBeInTheDocument();
  });

  it("names each actor type in words rather than showing the enum", () => {
    render(
      <ActivityTable
        entries={[
          entry({ id: "a-1", actorType: "terminal" }),
          entry({ id: "a-2", actorType: "platform_admin" }),
        ]}
      />,
    );
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Platform admin")).toBeInTheDocument();
    expect(screen.queryByText("platform_admin")).not.toBeInTheDocument();
  });

  it("says so when there is nothing to show", () => {
    render(<ActivityTable entries={[]} />);
    expect(screen.getByText(/no activity/i)).toBeInTheDocument();
  });
});
