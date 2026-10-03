import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsTabs } from "./analytics-tabs";
vi.mock("next/navigation", () => ({
  usePathname: () => "/portal/analytics/products",
  useSearchParams: () =>
    new URLSearchParams(
      "businessId=b1&branchId=br1&from=2026-09-01&to=2026-09-14&by=revenue&page=8",
    ),
}));
it("keeps report scope on every tab without carrying incompatible filters", () => {
  render(<AnalyticsTabs />);
  for (const link of screen.getAllByRole("link")) {
    const url = new URL(link.getAttribute("href")!, "http://portal.test");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      businessId: "b1",
      branchId: "br1",
      from: "2026-09-01",
      to: "2026-09-14",
    });
  }
  expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute("aria-current", "page");
});
it("omits owner financial tabs for managers", () => {
  render(<AnalyticsTabs role="manager" />);
  expect(screen.queryByRole("link", { name: "Profit" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Leaks" })).toBeNull();
  expect(screen.getByRole("link", { name: "Inventory" })).toBeInTheDocument();
});
