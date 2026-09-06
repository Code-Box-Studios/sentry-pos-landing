import { describe, expect, it } from "vitest";
import { centavosToPesos, formatPesos, parseQuantity, pesosToCentavos } from "./money";

describe("pesosToCentavos", () => {
  it("converts a plain amount", () => {
    expect(pesosToCentavos("120")).toBe(12000);
    expect(pesosToCentavos("120.50")).toBe(12050);
    expect(pesosToCentavos("0.05")).toBe(5);
  });

  it("survives the values that break naive float maths", () => {
    // 1.1 * 100 is 110.00000000000001 in IEEE 754; 8.2 * 100 is 819.9999999999999.
    expect(pesosToCentavos("1.1")).toBe(110);
    expect(pesosToCentavos("8.2")).toBe(820);
    expect(pesosToCentavos("29.29")).toBe(2929);
    expect(pesosToCentavos("1.005")).toBe(101); // half-up, not banker's
  });

  it("accepts what a user actually types", () => {
    expect(pesosToCentavos(" 120.50 ")).toBe(12050);
    expect(pesosToCentavos("1,250.00")).toBe(125000);
    expect(pesosToCentavos("₱99")).toBe(9900);
    expect(pesosToCentavos(".5")).toBe(50);
  });

  it("returns null for anything that is not a number", () => {
    expect(pesosToCentavos("")).toBeNull();
    expect(pesosToCentavos("abc")).toBeNull();
    expect(pesosToCentavos("1.2.3")).toBeNull();
    expect(pesosToCentavos("-5")).toBeNull(); // no negative prices
  });

  it("rounds a third decimal place rather than truncating it", () => {
    expect(pesosToCentavos("10.999")).toBe(1100);
    expect(pesosToCentavos("10.994")).toBe(1099);
  });

  it("reads a plain zero", () => {
    expect(pesosToCentavos("0")).toBe(0);
    expect(pesosToCentavos("0.00")).toBe(0);
  });
});

describe("centavosToPesos", () => {
  it("always gives two decimals, so a form value never looks half-filled", () => {
    expect(centavosToPesos(12000)).toBe("120.00");
    expect(centavosToPesos(5)).toBe("0.05");
    expect(centavosToPesos(0)).toBe("0.00");
  });

  it("keeps the sign on a negative, for a price-reducing modifier", () => {
    expect(centavosToPesos(-1000)).toBe("-10.00");
  });

  it("round-trips through pesosToCentavos unchanged", () => {
    for (const c of [0, 1, 5, 99, 100, 12050, 125000, 100_000_000]) {
      expect(pesosToCentavos(centavosToPesos(c))).toBe(c);
    }
  });
});

describe("formatPesos", () => {
  it("shows the peso sign and groups thousands", () => {
    expect(formatPesos(125000)).toBe("₱1,250.00");
    expect(formatPesos(5)).toBe("₱0.05");
  });
});

describe("parseQuantity", () => {
  it("accepts up to three decimal places, which is what the API allows", () => {
    expect(parseQuantity("1")).toBe(1);
    expect(parseQuantity("0.5")).toBe(0.5);
    expect(parseQuantity("2.125")).toBe(2.125);
  });

  it("rejects a fourth decimal rather than letting the API 422", () => {
    expect(parseQuantity("2.1255")).toBeNull();
  });

  it("rejects negatives and nonsense", () => {
    expect(parseQuantity("-1")).toBeNull();
    expect(parseQuantity("abc")).toBeNull();
    expect(parseQuantity("")).toBeNull();
  });

  it("accepts zero, which is a valid corrected stock count", () => {
    expect(parseQuantity("0")).toBe(0);
  });
});
