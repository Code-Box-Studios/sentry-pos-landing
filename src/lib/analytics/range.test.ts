import { describe, expect, it } from "vitest";
import { resolvePreset, todayInManila } from "./range";

const TODAY = "2026-03-15"; // a Sunday

describe("resolvePreset", () => {
  it("resolves today to a single day", () => {
    expect(resolvePreset("today", TODAY)).toEqual({ from: TODAY, to: TODAY });
  });

  it("resolves yesterday to the day before, both ends", () => {
    expect(resolvePreset("yesterday", TODAY)).toEqual({
      from: "2026-03-14",
      to: "2026-03-14",
    });
  });

  // Seven days INCLUDING today — an owner asking for "7 days" on the 15th means
  // the 9th through the 15th, not the 8th.
  it("resolves 7 days to a seven-day window ending today", () => {
    expect(resolvePreset("7d", TODAY)).toEqual({ from: "2026-03-09", to: TODAY });
  });

  it("resolves 30 days to a thirty-day window ending today", () => {
    expect(resolvePreset("30d", TODAY)).toEqual({ from: "2026-02-14", to: TODAY });
  });

  it("resolves this month from the first to today, not to month end", () => {
    expect(resolvePreset("month", TODAY)).toEqual({
      from: "2026-03-01",
      to: TODAY,
    });
  });

  it("leaves a custom range to the caller by returning today", () => {
    expect(resolvePreset("custom", TODAY)).toEqual({ from: TODAY, to: TODAY });
  });

  it("crosses a month boundary correctly", () => {
    expect(resolvePreset("7d", "2026-03-03")).toEqual({
      from: "2026-02-25",
      to: "2026-03-03",
    });
  });
});

describe("todayInManila", () => {
  // Manila is UTC+8 year-round. At 23:00 UTC it is already tomorrow there, and
  // defaulting the picker to "yesterday" would be quietly wrong every evening.
  it("is already the next day at 23:00 UTC", () => {
    expect(todayInManila(new Date("2026-03-14T23:00:00Z"))).toBe("2026-03-15");
  });

  it("is still the same day at 15:00 UTC", () => {
    expect(todayInManila(new Date("2026-03-15T15:00:00Z"))).toBe("2026-03-15");
  });
});
