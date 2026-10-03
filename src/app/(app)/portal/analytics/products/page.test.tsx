import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductsPage from "./page";
vi.mock("@/lib/auth/portal-role", () => ({ readPortalRole: async () => "owner" }));
vi.mock("@/components/app/scope-selector", () => ({ ScopeSelector: () => null }));
vi.mock("@/lib/api/portal", () => ({
  listBusinesses: async () => [],
  listBranches: async () => [],
}));
vi.mock("@/lib/api/analytics", () => ({
  getTopProducts: async () => ({ rows: [], categories: [] }),
  getSlowProducts: async () => ({ bottom: [], zeroSales: [] }),
}));
it("offers a revenue-ranked CSV matching the selected product report and branch", async () => {
  render(
    await ProductsPage({
      searchParams: Promise.resolve({
        businessId: "business",
        branchId: "branch",
        from: "2026-09-01",
        to: "2026-09-14",
        by: "revenue",
      }),
    }),
  );
  const url = new URL(
    screen.getByRole("link", { name: "Download CSV" }).getAttribute("href")!,
    "http://portal.test",
  );
  expect(Object.fromEntries(url.searchParams)).toEqual({
    businessId: "business",
    branchId: "branch",
    from: "2026-09-01",
    to: "2026-09-14",
    by: "revenue",
    report: "products-top",
  });
});
