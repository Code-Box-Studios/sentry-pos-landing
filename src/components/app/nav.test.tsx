import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./nav";

const pathname = vi.hoisted(() => ({ current: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const ITEMS = [
  { href: "/admin", label: "Owners" },
  { href: "/admin/settings", label: "Settings" },
];

describe("Nav", () => {
  it("marks the section you are in", () => {
    pathname.current = "/admin/settings";
    render(<Nav items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Owners" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the section marked on a detail page beneath it", () => {
    pathname.current = "/admin/settings/deep";
    render(<Nav items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
  });

  it("does not light up the root on every page under it", () => {
    pathname.current = "/admin/settings";
    render(<Nav items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Owners" })).not.toHaveAttribute("aria-current");
  });
});
