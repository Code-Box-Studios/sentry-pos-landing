import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OwnerStatusBadge } from "./owner-status-badge";
import type { OwnerStatus } from "@/lib/api/types";

describe("OwnerStatusBadge", () => {
  it("gives every status a readable label", () => {
    const statuses: OwnerStatus[] = ["active", "suspended", "hard_suspended", "closed"];
    for (const status of statuses) {
      const { unmount } = render(<OwnerStatusBadge status={status} />);
      // No raw enum value ever reaches the screen.
      expect(screen.queryByText(status)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("distinguishes the two suspension tiers", () => {
    const { unmount } = render(<OwnerStatusBadge status="suspended" />);
    expect(screen.getByText("Suspended")).toBeInTheDocument();
    unmount();
    render(<OwnerStatusBadge status="hard_suspended" />);
    expect(screen.getByText("Hard suspended")).toBeInTheDocument();
  });
});
