import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
const getLegalPages = vi.hoisted(() => vi.fn());
vi.mock("@/lib/legal", () => ({ getLegalPages }));
import { PolicyPage } from "./PolicyPage";
describe("public policies", () => {
  it("does not expose unpublished policy drafts or business details", async () => {
    getLegalPages.mockResolvedValue({ businessName: "Draft business", terms: { published: false, body: "PRIVATE DRAFT" } });
    render(await PolicyPage({ kind: "terms" }));
    expect(screen.getByText(/being prepared/)).toBeInTheDocument();
    expect(screen.queryByText("PRIVATE DRAFT")).not.toBeInTheDocument();
    expect(screen.queryByText("Draft business")).not.toBeInTheDocument();
  });
  it("renders published policy text as text rather than executable markup", async () => {
    getLegalPages.mockResolvedValue({ businessName: "Published business", contactEmail: "contact@example.test", privacy: { published: true, effectiveDate: "2026-09-15T00:00:00Z", body: "<script>bad()</script>\n\nSecond paragraph" } });
    const { container } = render(await PolicyPage({ kind: "privacy" }));
    expect(screen.getByText("<script>bad()</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText("Second paragraph")).toBeInTheDocument();
  });
});
