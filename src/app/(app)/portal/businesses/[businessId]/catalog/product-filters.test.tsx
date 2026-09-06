import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilters } from "./product-filters";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/portal/businesses/b-1/catalog",
}));

const CATEGORIES = [
  { id: "c-1", name: "Drinks" },
  { id: "c-2", name: "Pastries" },
];

describe("ProductFilters", () => {
  it("puts the search term in the URL, so a filtered list can be shared", async () => {
    router.replace.mockClear();
    render(<ProductFilters categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Search"), "latte");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(router.replace).toHaveBeenCalledWith("/portal/businesses/b-1/catalog?q=latte");
  });

  it("combines a search with a category", async () => {
    router.replace.mockClear();
    render(<ProductFilters categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Search"), "latte");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "c-2");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    const target = router.replace.mock.calls[0][0] as string;
    expect(target).toContain("q=latte");
    expect(target).toContain("categoryId=c-2");
  });

  it("drops empty filters rather than leaving them in the URL", async () => {
    router.replace.mockClear();
    render(<ProductFilters categories={CATEGORIES} q="latte" />);

    await userEvent.clear(screen.getByLabelText("Search"));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(router.replace).toHaveBeenCalledWith("/portal/businesses/b-1/catalog");
  });

  it("shows the filters it was given", () => {
    render(<ProductFilters categories={CATEGORIES} q="latte" categoryId="c-1" />);
    expect(screen.getByLabelText("Search")).toHaveValue("latte");
    expect(screen.getByLabelText("Category")).toHaveValue("c-1");
  });
});
