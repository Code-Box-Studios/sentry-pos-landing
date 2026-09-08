import { describe, expect, it } from "vitest";
import { toBars, toHeatmapWeeks, toPolyline } from "./geometry";

const BOX = { width: 100, height: 20 };

describe("toPolyline", () => {
  it("spreads points evenly across the width", () => {
    expect(toPolyline([0, 0, 0], BOX)).toBe("0,10 50,10 100,10");
  });

  it("puts the maximum at the top and the minimum at the bottom", () => {
    // SVG y grows downward, so the largest value must have the SMALLEST y.
    expect(toPolyline([0, 10], BOX)).toBe("0,20 100,0");
  });

  it("scales intermediate values proportionally", () => {
    expect(toPolyline([0, 5, 10], BOX)).toBe("0,20 50,10 100,0");
  });

  // A flat line has no range to scale by; dividing would give NaN and the SVG
  // would silently render nothing.
  it("draws a flat series along the middle rather than dividing by zero", () => {
    expect(toPolyline([7, 7, 7], BOX)).toBe("0,10 50,10 100,10");
  });

  it("returns an empty string for no points", () => {
    expect(toPolyline([], BOX)).toBe("");
  });

  it("places a single point in the middle", () => {
    expect(toPolyline([5], BOX)).toBe("0,10");
  });

  it("handles negative values", () => {
    expect(toPolyline([-10, 10], BOX)).toBe("0,20 100,0");
  });
});

describe("toBars", () => {
  it("scales each value against the maximum", () => {
    expect(toBars([0, 5, 10])).toEqual([0, 0.5, 1]);
  });

  // All-zero is the quiet-period case and must not produce NaN widths.
  it("returns zeros when every value is zero", () => {
    expect(toBars([0, 0])).toEqual([0, 0]);
  });

  it("returns an empty array for no values", () => {
    expect(toBars([])).toEqual([]);
  });
});

describe("toHeatmapWeeks", () => {
  const days = [
    { date: "2026-03-01", value: 0 }, // Sunday
    { date: "2026-03-02", value: 50 },
    { date: "2026-03-03", value: 100 },
  ];

  it("groups days into weeks starting on Sunday", () => {
    const weeks = toHeatmapWeeks(days);
    expect(weeks).toHaveLength(1);
    expect(weeks[0].map((c) => c.date)).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
    ]);
  });

  it("reports each day's weekday, so a grid can pad the first row", () => {
    expect(toHeatmapWeeks(days)[0][0].weekday).toBe(0);
  });

  it("scales intensity from 0 to 1 against the busiest day", () => {
    const weeks = toHeatmapWeeks(days);
    expect(weeks[0].map((c) => c.intensity)).toEqual([0, 0.5, 1]);
  });

  it("gives every day zero intensity when nothing sold", () => {
    const quiet = toHeatmapWeeks([
      { date: "2026-03-01", value: 0 },
      { date: "2026-03-02", value: 0 },
    ]);
    expect(quiet[0].map((c) => c.intensity)).toEqual([0, 0]);
  });

  it("starts a new week on the next Sunday", () => {
    const twoWeeks = toHeatmapWeeks([
      { date: "2026-03-06", value: 1 }, // Friday
      { date: "2026-03-07", value: 1 }, // Saturday
      { date: "2026-03-08", value: 1 }, // Sunday — new week
    ]);
    expect(twoWeeks).toHaveLength(2);
    expect(twoWeeks[1][0].date).toBe("2026-03-08");
  });

  it("returns no weeks for no days", () => {
    expect(toHeatmapWeeks([])).toEqual([]);
  });
});
