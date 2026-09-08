import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BarRow } from "./bar-row";
import { CalendarHeatmap } from "./calendar-heatmap";
import { Sparkline } from "./sparkline";
import { TrendLine } from "./trend-line";

describe("Sparkline", () => {
  it("draws a polyline through the values", () => {
    const { container } = render(<Sparkline values={[1, 5, 3]} label="7 days" />);
    expect(container.querySelector("polyline")).toHaveAttribute("points");
  });

  it("names itself for a screen reader", () => {
    render(<Sparkline values={[1, 2]} label="7 days" />);
    expect(screen.getByTitle("7 days")).toBeInTheDocument();
  });

  it("renders nothing but the frame when there is no data", () => {
    const { container } = render(<Sparkline values={[]} label="7 days" />);
    expect(container.querySelector("polyline")).toBeNull();
  });
});

describe("TrendLine", () => {
  const points = [
    { label: "2026-03-01", value: 1000 },
    { label: "2026-03-02", value: 2000 },
  ];

  it("draws the series and labels both ends", () => {
    const { container } = render(<TrendLine points={points} title="Sales" />);
    expect(container.querySelector("polyline")).toBeTruthy();
    expect(screen.getByText("2026-03-01")).toBeInTheDocument();
    expect(screen.getByText("2026-03-02")).toBeInTheDocument();
  });

  it("shows the peak as money so the chart is never the only source", () => {
    render(<TrendLine points={points} title="Sales" />);
    expect(screen.getByText(/20\.00/)).toBeInTheDocument();
  });

  it("says so plainly when there is nothing to draw", () => {
    render(<TrendLine points={[]} title="Sales" />);
    expect(screen.getByText(/no sales in this period/i)).toBeInTheDocument();
  });
});

describe("CalendarHeatmap", () => {
  const days = [
    { date: "2026-03-01", value: 0 },
    { date: "2026-03-02", value: 100 },
  ];

  it("renders one cell per day, titled with its date and amount", () => {
    const { container } = render(
      <CalendarHeatmap days={days} title="Daily sales" />,
    );
    const cell = container.querySelector('[data-date="2026-03-02"]');
    expect(cell?.getAttribute("title")).toContain("2026-03-02");
    expect(cell?.getAttribute("title")).toContain("1.00");
  });

  it("renders every day given, including quiet ones", () => {
    const { container } = render(
      <CalendarHeatmap days={days} title="Daily sales" />,
    );
    expect(container.querySelectorAll("[data-date]")).toHaveLength(2);
  });

  it("says so plainly when there is nothing to draw", () => {
    render(<CalendarHeatmap days={[]} title="Daily sales" />);
    expect(screen.getByText(/no sales in this period/i)).toBeInTheDocument();
  });
});

describe("BarRow", () => {
  const rows = [
    { label: "cash", value: 7500 },
    { label: "gcash", value: 2500 },
  ];

  it("labels each row and shows its amount", () => {
    render(<BarRow rows={rows} title="By payment method" />);
    expect(screen.getByText("cash")).toBeInTheDocument();
    expect(screen.getByText(/75\.00/)).toBeInTheDocument();
  });

  it("scales the widest bar to full width", () => {
    const { container } = render(<BarRow rows={rows} title="By payment method" />);
    const bars = container.querySelectorAll("[data-bar]");
    expect((bars[0] as HTMLElement).style.width).toBe("100%");
    expect((bars[1] as HTMLElement).style.width).toBe("33.33333333333333%");
  });

  it("says so plainly when there is nothing to draw", () => {
    render(<BarRow rows={[]} title="By payment method" />);
    expect(screen.getByText(/nothing in this period/i)).toBeInTheDocument();
  });
});
