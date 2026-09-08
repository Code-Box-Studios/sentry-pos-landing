/**
 * Pesos in, integer centavos out.
 *
 * The API speaks only integer centavos, and so does the POS terminal. Users type pesos.
 * This module is the single boundary between the two, because `Math.round(pesos * 100)` is
 * wrong often enough to matter: 1.1 * 100 is 110.00000000000001 and 8.2 * 100 is
 * 819.9999999999999. Parsing the decimal string digit by digit avoids float arithmetic
 * entirely.
 */

const PESO_PATTERN = /^(\d*)(?:\.(\d*))?$/;

/**
 * Returns integer centavos, or null when `input` is not a non-negative decimal number.
 * Strips a leading ₱, spaces and thousands separators first — all of which people type.
 */
export function pesosToCentavos(input: string): number | null {
  const cleaned = input.trim().replace(/^₱/, "").replace(/,/g, "").trim();
  if (cleaned === "") return null;

  const match = PESO_PATTERN.exec(cleaned);
  if (!match) return null;
  // A bare "." matches the pattern with both groups empty, and means nothing.
  if (match[1] === "" && (match[2] ?? "") === "") return null;

  const whole = match[1] === "" ? "0" : match[1];
  const fraction = match[2] ?? "";

  // Pad or round the fraction to exactly two digits without ever multiplying a float.
  const centavosPart = (fraction + "00").slice(0, 2);
  const thirdDigit = fraction.length > 2 ? Number(fraction[2]) : 0;

  const total = Number(whole) * 100 + Number(centavosPart);
  if (!Number.isFinite(total)) return null;

  // Half-up, matching the rounding rule the totals engine uses everywhere else.
  return thirdDigit >= 5 ? total + 1 : total;
}

/** Centavos → a fixed two-decimal string suitable for an input's value. */
export function centavosToPesos(centavosC: number): string {
  const sign = centavosC < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(centavosC));
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const PESO_FORMAT = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

/** Centavos → a display string with the peso sign. Never use this in an input's value. */
export function formatPesos(centavosC: number): string {
  return PESO_FORMAT.format(centavosC / 100);
}

/**
 * Quantities are decimals, not centavos — the API accepts at most 3 places
 * (`@IsNumber({ maxDecimalPlaces: 3 })`). Rejecting a 4th here turns a confusing 422 into
 * an inline message on the field.
 */
export function parseQuantity(input: string): number | null {
  const cleaned = input.trim().replace(/,/g, "");
  if (cleaned === "") return null;

  const match = PESO_PATTERN.exec(cleaned);
  if (!match) return null;
  if (match[1] === "" && (match[2] ?? "") === "") return null;
  if ((match[2]?.length ?? 0) > 3) return null;

  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** The one string the portal shows for a figure the API says is unknown. */
export const UNKNOWN = "—";

/**
 * Money, or `—` when the API says the figure is unknown.
 *
 * Every analytics money field is nullable, and a null is NOT a zero: an
 * uncosted product has an unknown margin, not a 100% one. Rendering it as
 * `₱0.00` would be a plausible-looking lie, so nulls stop here.
 */
export function formatPesosOr(
  centavosC: number | null,
  fallback: string = UNKNOWN,
): string {
  return centavosC === null ? fallback : formatPesos(centavosC);
}

/**
 * A ratio from the API rendered as a percentage.
 *
 * The API sends FRACTIONS (0.4 = 40%). This is the only place that conversion
 * happens — no component multiplies a ratio itself.
 */
export function formatPercentOr(
  fraction: number | null,
  fallback: string = UNKNOWN,
): string {
  return fraction === null ? fallback : `${(fraction * 100).toFixed(1)}%`;
}

/**
 * A margin comparison, in percentage POINTS.
 *
 * `marginPct` is already a ratio, so the API compares periods with
 * `changePoints` rather than a percentage change — "five points better", not
 * "12% better". The sign is explicit because the direction is the message.
 */
export function formatPointsOr(
  points: number | null,
  fallback: string = UNKNOWN,
): string {
  if (points === null) return fallback;
  const value = (points * 100).toFixed(1);
  return `${points > 0 ? "+" : ""}${value} pts`;
}
