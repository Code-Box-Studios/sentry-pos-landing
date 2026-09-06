import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BusinessSwitcher } from "./business-switcher";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const pathname = vi.hoisted(() => ({ current: "/portal/businesses/b-1/catalog" }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => pathname.current,
}));

const BUSINESSES = [
  { id: "b-1", name: "Kape Diaria" },
  { id: "b-2", name: "Kape Diaria (Demo)" },
];

describe("BusinessSwitcher", () => {
  it("shows the current business as selected", () => {
    pathname.current = "/portal/businesses/b-1/catalog";
    render(<BusinessSwitcher businesses={BUSINESSES} current="b-1" />);
    expect(screen.getByLabelText("Business")).toHaveValue("b-1");
  });

  it("stays on the same section when switching business", async () => {
    router.push.mockClear();
    pathname.current = "/portal/businesses/b-1/catalog";
    render(<BusinessSwitcher businesses={BUSINESSES} current="b-1" />);

    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-2");

    expect(router.push).toHaveBeenCalledWith("/portal/businesses/b-2/catalog");
  });

  it("does not carry a record id across to another business", async () => {
    router.push.mockClear();
    pathname.current = "/portal/businesses/b-1/catalog/p-99";
    render(<BusinessSwitcher businesses={BUSINESSES} current="b-1" />);

    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-2");

    // p-99 belongs to b-1. Landing on b-2's copy of that URL would 404 at best.
    expect(router.push).toHaveBeenCalledWith("/portal/businesses/b-2/catalog");
  });

  it("goes to the business root when there is no section", async () => {
    router.push.mockClear();
    pathname.current = "/portal/businesses/b-1";
    render(<BusinessSwitcher businesses={BUSINESSES} current="b-1" />);

    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-2");

    expect(router.push).toHaveBeenCalledWith("/portal/businesses/b-2");
  });

  it("renders nothing when there is only one business to choose from", () => {
    const { container } = render(<BusinessSwitcher businesses={[BUSINESSES[0]]} current="b-1" />);
    expect(container).toBeEmptyDOMElement();
  });
});
