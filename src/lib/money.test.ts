import { describe, expect, it } from "vitest";
import {
  centavosToPesos,
  formatPercentOr,
  formatPesos,
  formatPesosOr,
  formatPointsOr,
  parseQuantity,
  pesosToCentavos,
} from "./money";

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

describe("formatPesosOr", () => {
  it("formats a number the way formatPesos does", () => {
    expect(formatPesosOr(125000)).toBe(formatPesos(125000));
  });

  // An unknown cost and a zero cost mean opposite things to an owner deciding
  // what to stock. This is the whole reason the function exists.
  it("renders null as an em dash, never as zero pesos", () => {
    expect(formatPesosOr(null)).toBe("—");
    expect(formatPesosOr(null)).not.toBe(formatPesos(0));
  });

  it("still formats a real zero", () => {
    expect(formatPesosOr(0)).toBe(formatPesos(0));
  });

  it("takes a custom fallback", () => {
    expect(formatPesosOr(null, "unknown")).toBe("unknown");
  });
});

describe("formatPercentOr", () => {
  // The API sends fractions. Rendering 0.4 as "0.4%" instead of "40.0%" would
  // be wrong by two orders of magnitude and look plausible on screen.
  it("multiplies the fraction by 100", () => {
    expect(formatPercentOr(0.4)).toBe("40.0%");
    expect(formatPercentOr(0.125)).toBe("12.5%");
  });

  it("keeps the sign on a fall", () => {
    expect(formatPercentOr(-0.25)).toBe("-25.0%");
  });

  it("renders null as an em dash, never as 0%", () => {
    expect(formatPercentOr(null)).toBe("—");
  });

  it("still formats a real zero", () => {
    expect(formatPercentOr(0)).toBe("0.0%");
  });
});

describe("formatPointsOr", () => {
  // Margin comparisons are already ratios, so the API sends POINTS, not a
  // percentage change. 0.05 here means "five points better".
  it("renders points with a sign", () => {
    expect(formatPointsOr(0.05)).toBe("+5.0 pts");
    expect(formatPointsOr(-0.02)).toBe("-2.0 pts");
  });

  it("renders null as an em dash", () => {
    expect(formatPointsOr(null)).toBe("—");
  });

  it("renders no change without a sign", () => {
    expect(formatPointsOr(0)).toBe("0.0 pts");
  });
});
