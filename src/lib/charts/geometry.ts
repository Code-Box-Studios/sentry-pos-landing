/**
 * Chart maths, kept separate from the components that draw with it.
 *
 * Splitting geometry from rendering is what makes charts testable: the numbers
 * are asserted directly, and the components stay too boring to break. Nothing
 * here touches React, so it also runs in a plain node test.
 *
 * Every function has an all-equal / all-zero case, because a quiet period is
 * normal and a naive scale would divide by zero and render nothing at all.
 */

export interface Box {
  width: number;
  height: number;
}

/** `"x,y x,y …"` for an SVG `<polyline points>`, largest value at the top. */
export function toPolyline(values: number[], box: Box): string {
  if (values.length === 0) return "";

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min;
  const step = values.length === 1 ? 0 : box.width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = Math.round(index * step);
      // A flat series has no range: draw it down the middle rather than
      // dividing by zero.
      const y =
        range === 0
          ? box.height / 2
          : box.height - ((value - min) / range) * box.height;
      return `${x},${Math.round(y)}`;
    })
    .join(" ");
}

/** Each value as a 0–1 fraction of the largest, for bar widths. */
export function toBars(values: number[]): number[] {
  const max = Math.max(0, ...values);
  if (max === 0) return values.map(() => 0);
  return values.map((value) => value / max);
}

export interface HeatCell {
  date: string;
  value: number;
  /** 0–1 against the busiest day in the range. */
  intensity: number;
  /** 0 = Sunday, matching `Date#getUTCDay`. */
  weekday: number;
}

/**
 * Days grouped into weeks that start on Sunday, each carrying its shading.
 *
 * Dates are parsed as UTC — they are business-day strings from the API, not
 * instants, so a local-time parse would shift them a day.
 */
export function toHeatmapWeeks(
  days: { date: string; value: number }[],
): HeatCell[][] {
  if (days.length === 0) return [];

  const max = Math.max(0, ...days.map((d) => d.value));
  const weeks: HeatCell[][] = [];
  let current: HeatCell[] = [];

  for (const day of days) {
    const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
    if (weekday === 0 && current.length > 0) {
      weeks.push(current);
      current = [];
    }
    current.push({
      date: day.date,
      value: day.value,
      intensity: max === 0 ? 0 : day.value / max,
      weekday,
    });
  }
  weeks.push(current);

  return weeks;
}
