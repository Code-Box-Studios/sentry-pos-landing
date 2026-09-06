import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("renders nothing at all for a single page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} baseHref="/admin/x" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers only Next on the first page", () => {
    render(<Pagination page={1} totalPages={3} baseHref="/admin/x" />);
    expect(screen.queryByRole("link", { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /next/i })).toHaveAttribute("href", "/admin/x?page=2");
  });

  it("offers only Previous on the last page", () => {
    render(<Pagination page={3} totalPages={3} baseHref="/admin/x" />);
    expect(screen.getByRole("link", { name: /previous/i })).toHaveAttribute(
      "href",
      "/admin/x?page=2",
    );
    expect(screen.queryByRole("link", { name: /next/i })).not.toBeInTheDocument();
  });

  it("keeps the other filters in the link, so paging does not reset them", () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        baseHref="/admin/x"
        query={{ actorType: "terminal", pageSize: "25" }}
      />,
    );
    const next = screen.getByRole("link", { name: /next/i }).getAttribute("href")!;
    expect(next).toContain("actorType=terminal");
    expect(next).toContain("pageSize=25");
    expect(next).toContain("page=3");
  });

  it("states where you are", () => {
    render(<Pagination page={2} totalPages={5} baseHref="/admin/x" />);
    expect(screen.getByText(/Page 2 of 5/)).toBeInTheDocument();
  });
});
