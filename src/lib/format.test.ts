import { describe, expect, it } from "vitest";
import { formatManilaDate, formatManilaDateTime } from "./format";

describe("Manila formatting", () => {
  it("shifts UTC into Asia/Manila, which is UTC+8", () => {
    // 2026-03-01T16:30:00Z is 2026-03-02 00:30 in Manila — a different calendar day.
    // The day-part is what this asserts; the "am"/"AM" casing is the runtime's ICU choice.
    expect(formatManilaDateTime("2026-03-01T16:30:00.000Z")).toMatch(/^2 Mar 2026, 12:30 [ap]m$/i);
  });

  it("formats a date without a time", () => {
    expect(formatManilaDate("2026-03-01T16:30:00.000Z")).toBe("2 Mar 2026");
  });

  it("keeps the same calendar day when the shift does not cross midnight", () => {
    expect(formatManilaDate("2026-03-01T01:00:00.000Z")).toBe("1 Mar 2026");
  });

  it("returns an em dash rather than 'Invalid Date' for an unusable value", () => {
    expect(formatManilaDateTime("not-a-date")).toBe("—");
    expect(formatManilaDate("")).toBe("—");
  });
});
