# Portal Analytics — Foundation and Money Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the portal's analytics foundation — formatters, chart primitives, API client, scope selector, CSV proxy — and the three money views on top of it: the §0 dashboard, §1 overview and §2 sales.

**Architecture:** Server Components fetch through the existing server-only `apiFetch`; charts are hand-rolled inline SVG rendered on the server over pure geometry functions; scope lives in the URL so pages read it from `searchParams`; CSV downloads go through a route handler because the browser has no credentials of its own.

**Tech Stack:** Next 15 App Router (React Server Components), TypeScript, Tailwind v4, Vitest + React Testing Library, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-08-portal-analytics-ui-design.md`. Plan 1 of 2; plan 2 covers §3 products, §4 profit & leaks, §5 inventory, §6 tax.

## Global Constraints

Every task's requirements implicitly include all of these.

- **Money from the API is integer centavos, and `null` means UNKNOWN — never zero.** A null must never render as `₱0.00` or `0%`.
- **Ratios from the API are FRACTIONS** (`0.4` = 40%). The multiplication by 100 happens in exactly one place, `formatPercentOr`. No component does its own arithmetic on a ratio.
- **`marginPct` is a `MarginKpi`** — its comparison field is `changePoints` (percentage points), not `changePct`. Every other KPI uses `changePct`.
- **Date presets resolve in the portal, never in the API.** The API takes literal `from`/`to` only.
- **Charts are Server Components.** No `"use client"` in `src/components/charts/`, no charting dependency, nothing added to the bundle.
- **A Server Component may not call a function exported from a `"use client"` module.** It compiles and type-checks, then throws at render. Keep pure helpers in their own non-client module.
- **`apiFetch` is server-only** (`import "server-only"`). Client components never call it; the browser reaches the API only through a route handler or a Server Action.
- **Next 15: `params` and `searchParams` are Promises** and must be awaited.
- **Never add a Claude co-author trailer to a commit. Never run `git push`.** Commit directly on `main`.

**Commands:** `pnpm test` (unit), `pnpm test:integration` (live, needs the API and a real session), `pnpm lint`, `pnpm build`.

**Do not run `pnpm build` while `pnpm dev` is running** — it corrupts `.next/` and every route then 500s with `Cannot find module './vendor-chunks/…'`. Stop the dev server first, or `rm -rf .next` after.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/lib/charts/geometry.ts` | Pure chart maths: polyline points, heatmap weeks, bar scaling. No JSX. |
| `src/lib/charts/geometry.test.ts` | Unit tests for the above. |
| `src/lib/analytics/range.ts` | Date-range presets → literal `from`/`to`. Pure. |
| `src/lib/analytics/range.test.ts` | Unit tests for the above. |
| `src/lib/api/analytics.ts` | The analytics endpoints, server-only, mirroring `portal.ts` conventions. |
| `src/components/charts/sparkline.tsx` | Tiny inline trend, no axes. Server component. |
| `src/components/charts/trend-line.tsx` | Labelled line chart. Server component. |
| `src/components/charts/calendar-heatmap.tsx` | Month grid shaded by value. Server component. |
| `src/components/charts/bar-row.tsx` | Horizontal bars for hour/day/breakdown rows. Server component. |
| `src/components/charts/charts.test.tsx` | Rendering tests for all four. |
| `src/components/ui/select.tsx` | Styled `<select>`, matching `Input`'s conventions. |
| `src/components/app/scope-selector.tsx` | Client component writing scope to the URL. |
| `src/components/app/scope-selector.test.tsx` | Tests for its URL writing. |
| `src/components/app/kpi-card.tsx` | One KPI with its comparison. Server component. |
| `src/app/(app)/portal/businesses/page.tsx` | The full business list, moved off `/portal`. |
| `src/app/(app)/portal/analytics/layout.tsx` | Tab strip + scope selector, shared by every tab. |
| `src/app/(app)/portal/analytics/overview/page.tsx` | §1. |
| `src/app/(app)/portal/analytics/sales/page.tsx` | §2. |
| `src/app/(app)/portal/analytics/export/route.ts` | CSV proxy. |
| `src/test/integration/live-analytics.test.ts` | Live pass over the new routes. |

**Modified:**

| File | Change |
|---|---|
| `src/lib/money.ts` | Add `formatPesosOr`, `formatPercentOr`, `formatPointsOr`. |
| `src/lib/money.test.ts` | Tests for those. |
| `src/lib/api/types.ts` | Analytics response types. |
| `src/app/(app)/portal/page.tsx` | Becomes the §0 dashboard. |
| `src/components/ui/ui.test.tsx` | A `Select` case. |

---

## Task 1: Null-aware formatters

Every analytics money and ratio field is nullable, and `formatPesos` does not accept null. This is the single sharpest correctness rule on the portal side.

**Files:**
- Modify: `src/lib/money.ts`
- Test: `src/lib/money.test.ts`

**Interfaces:**
- Consumes: `formatPesos(centavosC: number): string` (existing, `src/lib/money.ts:54`).
- Produces:
  - `formatPesosOr(centavosC: number | null, fallback?: string): string`
  - `formatPercentOr(fraction: number | null, fallback?: string): string`
  - `formatPointsOr(points: number | null, fallback?: string): string`

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/money.test.ts`:

```ts
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
```

Add `formatPesosOr`, `formatPercentOr`, `formatPointsOr` to the file's existing import from `./money`.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm test money
```

Expected: FAIL — the three functions are not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/money.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm test money
```

Expected: PASS, whole file.

- [ ] **Step 5: Commit**

```bash
git add src/lib/money.ts src/lib/money.test.ts
git commit -m "feat: null-aware money and percentage formatters for analytics"
```

---

## Task 2: Chart geometry

Pure maths, no JSX, so the arithmetic behind every chart is asserted on numbers rather than inferred from rendered SVG.

**Files:**
- Create: `src/lib/charts/geometry.ts`
- Test: `src/lib/charts/geometry.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Box { width: number; height: number; padding?: number }`
  - `toPolyline(values: number[], box: Box): string`
  - `toBars(values: number[]): number[]` — each value as a 0–1 fraction of the maximum
  - `interface HeatCell { date: string; value: number; intensity: number; weekday: number }`
  - `toHeatmapWeeks(days: { date: string; value: number }[]): HeatCell[][]`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/charts/geometry.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm test geometry
```

Expected: FAIL — `Cannot find module './geometry'`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/charts/geometry.ts`:

```ts
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
 * instants, so a local-time parse would shift them a day in some zones.
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
pnpm test geometry
```

Expected: PASS, all suites.

- [ ] **Step 5: Commit**

```bash
git add src/lib/charts
git commit -m "feat: pure chart geometry for sparklines, bars and the calendar heatmap"
```

---

## Task 3: Chart components

Four Server Components, each thin JSX over Task 2's maths. No `"use client"`, no dependency, nothing added to the bundle.

**Files:**
- Create: `src/components/charts/sparkline.tsx`
- Create: `src/components/charts/trend-line.tsx`
- Create: `src/components/charts/calendar-heatmap.tsx`
- Create: `src/components/charts/bar-row.tsx`
- Test: `src/components/charts/charts.test.tsx`

**Interfaces:**
- Consumes: `toPolyline`, `toBars`, `toHeatmapWeeks`, `Box`, `HeatCell` (Task 2); `formatPesosOr` (Task 1).
- Produces:
  - `<Sparkline values={number[]} label={string} />`
  - `<TrendLine points={{ label: string; value: number }[]} title={string} />`
  - `<CalendarHeatmap days={{ date: string; value: number }[]} title={string} />`
  - `<BarRow rows={{ label: string; value: number }[]} title={string} />`

- [ ] **Step 1: Write the failing tests**

Create `src/components/charts/charts.test.tsx`:

```tsx
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
    expect(screen.getByText(/₱20\.00/)).toBeInTheDocument();
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
    render(<CalendarHeatmap days={days} title="Daily sales" />);
    expect(screen.getByTitle("2026-03-02 · ₱1.00")).toBeInTheDocument();
  });

  it("renders every day given, including quiet ones", () => {
    const { container } = render(<CalendarHeatmap days={days} title="Daily sales" />);
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
    expect(screen.getByText("₱75.00")).toBeInTheDocument();
  });

  it("scales the widest bar to full width", () => {
    const { container } = render(<BarRow rows={rows} title="By payment method" />);
    const bars = container.querySelectorAll("[data-bar]");
    expect(bars[0]).toHaveStyle({ width: "100%" });
    expect(bars[1]).toHaveStyle({ width: "33.33333333333333%" });
  });

  it("says so plainly when there is nothing to draw", () => {
    render(<BarRow rows={[]} title="By payment method" />);
    expect(screen.getByText(/nothing in this period/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
pnpm test charts
```

Expected: FAIL — none of the four modules exist.

- [ ] **Step 3: Write `Sparkline`**

Create `src/components/charts/sparkline.tsx`:

```tsx
import { toPolyline } from "@/lib/charts/geometry";

const BOX = { width: 120, height: 32 };

/**
 * A tiny trend with no axes — the shape of the week, not its numbers.
 *
 * A Server Component on purpose: it renders inside the request that fetched the
 * data, adds nothing to the bundle, and needs no charting dependency.
 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const points = toPolyline(values, BOX);

  return (
    <svg
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}
      className="h-8 w-full text-brand-green-dark"
      role="img"
      preserveAspectRatio="none"
    >
      <title>{label}</title>
      {points === "" ? null : (
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
```

- [ ] **Step 4: Write `TrendLine`**

Create `src/components/charts/trend-line.tsx`:

```tsx
import { toPolyline } from "@/lib/charts/geometry";
import { formatPesosOr } from "@/lib/money";

const BOX = { width: 600, height: 160 };

/**
 * A labelled line chart.
 *
 * The peak is printed beside the chart deliberately: a chart must never be the
 * only way to read a number, and this is the cheapest way to keep that true
 * without tooltips (which would make the whole thing a client component).
 */
export function TrendLine({
  points,
  title,
}: {
  points: { label: string; value: number }[];
  title: string;
}) {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-steel">No sales in this period.</p>;
  }

  const line = toPolyline(
    points.map((p) => p.value),
    BOX,
  );
  const peak = Math.max(...points.map((p) => p.value));

  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="h-40 w-full text-brand-green-dark"
        role="img"
        preserveAspectRatio="none"
      >
        <title>{title}</title>
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="flex justify-between text-xs text-steel">
        <span>{points[0].label}</span>
        <span>Peak {formatPesosOr(peak)}</span>
        <span>{points[points.length - 1].label}</span>
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 5: Write `CalendarHeatmap`**

Create `src/components/charts/calendar-heatmap.tsx`:

```tsx
import { toHeatmapWeeks } from "@/lib/charts/geometry";
import { formatPesosOr } from "@/lib/money";

/**
 * The month grid — "which days feed us" at a glance.
 *
 * Shading is an opacity over one brand colour rather than a colour ramp, so it
 * stays legible to colour-blind readers and needs no palette. Each cell carries
 * its date and amount in a `title`, so the figures are readable without a chart
 * library's tooltip.
 */
export function CalendarHeatmap({
  days,
  title,
}: {
  days: { date: string; value: number }[];
  title: string;
}) {
  if (days.length === 0) {
    return <p className="py-8 text-center text-sm text-steel">No sales in this period.</p>;
  }

  const weeks = toHeatmapWeeks(days);

  return (
    <figure className="space-y-2">
      <div className="flex gap-1" aria-label={title}>
        {weeks.map((week) => (
          <div key={week[0].date} className="flex flex-col gap-1">
            {/* Pad the first week so weekdays line up down the columns. */}
            {week[0].weekday > 0 && Array.from({ length: week[0].weekday }, (_, i) => (
              <div key={`pad-${i}`} className="h-4 w-4" />
            ))}
            {week.map((cell) => (
              <div
                key={cell.date}
                data-date={cell.date}
                title={`${cell.date} · ${formatPesosOr(cell.value)}`}
                className="h-4 w-4 rounded-sm bg-brand-green-dark"
                // A floor keeps a zero day visible as a cell rather than a hole.
                style={{ opacity: 0.12 + cell.intensity * 0.88 }}
              />
            ))}
          </div>
        ))}
      </div>
      <figcaption className="text-xs text-steel">{title}</figcaption>
    </figure>
  );
}
```

- [ ] **Step 6: Write `BarRow`**

Create `src/components/charts/bar-row.tsx`:

```tsx
import { toBars } from "@/lib/charts/geometry";
import { formatPesosOr } from "@/lib/money";

/**
 * Horizontal bars with their labels and amounts always visible — used for
 * hour-of-day, day-of-week and the payment/order-type breakdowns.
 *
 * Plain divs rather than SVG: these are rows of text with a bar behind them,
 * and HTML reflows on a narrow screen where an SVG would not.
 */
export function BarRow({
  rows,
  title,
}: {
  rows: { label: string; value: number }[];
  title: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-steel">Nothing in this period.</p>;
  }

  const widths = toBars(rows.map((r) => r.value));

  return (
    <figure className="space-y-2">
      <figcaption className="sr-only">{title}</figcaption>
      {rows.map((row, index) => (
        <div key={row.label} className="grid grid-cols-[6rem_1fr_6rem] items-center gap-3">
          <span className="truncate text-sm text-charcoal">{row.label}</span>
          <span className="h-2 rounded-full bg-hairline">
            <span
              data-bar=""
              className="block h-2 rounded-full bg-brand-green-dark"
              style={{ width: `${widths[index] * 100}%` }}
            />
          </span>
          <span className="text-right text-sm tabular-nums text-charcoal">
            {formatPesosOr(row.value)}
          </span>
        </div>
      ))}
    </figure>
  );
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
pnpm test charts
```

Expected: PASS, all four suites.

- [ ] **Step 8: Commit**

```bash
git add src/components/charts
git commit -m "feat: server-rendered sparkline, trend, heatmap and bar chart primitives"
```

---

## Task 4: Analytics types and API client

Mirrors the API's response shapes exactly. **The API's `Date` fields arrive as ISO strings over JSON** — typing them as `Date` would compile and then throw at the first `.getTime()`.

**Files:**
- Modify: `src/lib/api/types.ts`
- Create: `src/lib/api/analytics.ts`

**Interfaces:**
- Consumes: `apiFetch` (`src/lib/api/fetch.ts`), which already takes a `query` record.
- Produces (types): `Kpi`, `NullableKpi`, `MarginKpi`, `AnalyticsScope`, `DashboardReport`, `OverviewReport`, `HeatmapDay`, `TrendBucket`, `PatternsReport`, `BreakdownsReport`.
- Produces (client): `getDashboard()`, `getOverview(scope)`, `getSalesHeatmap(scope)`, `getSalesTrend(scope, granularity?)`, `getSalesPatterns(scope)`, `getSalesBreakdowns(scope)`.

- [ ] **Step 1: Add the types**

Append to `src/lib/api/types.ts`:

```ts
// ---------------------------------------------------------------------------
// Analytics (analytics-spec §0–§6)
//
// Money is integer centavos and `null` means UNKNOWN, never zero. Ratios are
// FRACTIONS (0.4 = 40%). `Date` fields on the API become ISO strings over JSON,
// so they are typed as `string` here — typing them as `Date` compiles and then
// throws on the first date method.
// ---------------------------------------------------------------------------

export interface Kpi {
  value: number;
  previous: number;
  /** A fraction of the previous period (0.5 = up by half). Null from a zero base. */
  changePct: number | null;
}

export interface NullableKpi {
  value: number | null;
  previous: number | null;
  changePct: number | null;
}

export interface MarginKpi {
  value: number | null;
  previous: number | null;
  /** Percentage POINTS, not a percentage change — a margin is already a ratio. */
  changePoints: number | null;
}

/** The scope every report but the dashboard takes. */
export interface AnalyticsScope {
  businessId?: string;
  /** Only meaningful with a businessId; the API rejects it alone. */
  branchId?: string;
  from: string;
  to: string;
}

export interface DayFigures {
  salesC: number;
  grossProfitC: number | null;
  transactions: number;
}

export interface DashboardBusiness {
  businessId: string;
  name: string;
  today: DayFigures;
  sameDayLastWeek: DayFigures;
  branches: (DayFigures & { branchId: string; name: string })[];
  sparkline: { date: string; salesC: number }[];
}

export interface DashboardReport {
  businesses: DashboardBusiness[];
  live: {
    openShifts: {
      shiftId: string;
      businessId: string;
      branchId: string;
      branchName: string;
      terminalName: string;
      openedAt: string;
    }[];
    terminals: {
      terminalId: string;
      businessId: string;
      branchId: string;
      name: string;
      code: string;
      lastSeenAt: string | null;
      paired: boolean;
    }[];
    unreadNotifications: number;
  };
  attention: {
    lowStock: { businessId: string; count: number }[];
    unclosedShifts: { businessId: string; count: number }[];
  };
}

export interface OverviewReport {
  from: string;
  to: string;
  grossSalesC: Kpi;
  discountsC: Kpi;
  netSalesC: Kpi;
  serviceChargeC: Kpi;
  transactions: Kpi;
  voidCount: Kpi;
  refundCount: Kpi;
  averageBasketC: NullableKpi;
  grossProfitC: NullableKpi;
  marginPct: MarginKpi;
  costedRevenueC: number;
  uncostedRevenueC: number;
}

export interface HeatmapDay {
  date: string;
  salesC: number;
  transactions: number;
}

export interface TrendBucket {
  bucket: string;
  salesC: number;
  grossProfitC: number | null;
  transactions: number;
}

export interface PatternsReport {
  hourOfDay: { hour: number; salesC: number; transactions: number }[];
  dayOfWeek: { dayOfWeek: number; salesC: number; transactions: number }[];
}

export interface BreakdownsReport {
  byPaymentMethod: { method: string; salesC: number; transactions: number }[];
  byOrderType: { orderType: string; salesC: number; transactions: number }[];
  byBranch: {
    branchId: string;
    name: string;
    salesC: number;
    transactions: number;
  }[];
}
```

- [ ] **Step 2: Write the client**

Create `src/lib/api/analytics.ts`:

```ts
import "server-only";
import { apiFetch } from "./fetch";
import type {
  AnalyticsScope,
  BreakdownsReport,
  DashboardReport,
  HeatmapDay,
  OverviewReport,
  PatternsReport,
  TrendBucket,
} from "./types";

/**
 * The analytics endpoints (analytics-spec §0–§6), behind `PortalAuthGuard`.
 *
 * Scope is the server's job: the guard pins every query to the signed-in owner,
 * so a `businessId` that is not theirs is a 404, never a leak. That is also why
 * these take a plain scope object — there is nothing to validate here that the
 * API does not validate better.
 *
 * `heatmap` and `trend` return BARE ARRAYS, not wrapped objects. The others
 * return a single report object.
 */

function scopeQuery(scope: AnalyticsScope): Record<string, string | undefined> {
  return {
    from: scope.from,
    to: scope.to,
    businessId: scope.businessId,
    branchId: scope.branchId,
  };
}

/** §0. Takes no scope: it spans every non-demo business by design. */
export function getDashboard(): Promise<DashboardReport> {
  return apiFetch<DashboardReport>("/portal/dashboard");
}

export function getOverview(scope: AnalyticsScope): Promise<OverviewReport> {
  return apiFetch<OverviewReport>("/portal/analytics/overview", {
    query: scopeQuery(scope),
  });
}

export function getSalesHeatmap(scope: AnalyticsScope): Promise<HeatmapDay[]> {
  return apiFetch<HeatmapDay[]>("/portal/analytics/sales/heatmap", {
    query: scopeQuery(scope),
  });
}

export function getSalesTrend(
  scope: AnalyticsScope,
  granularity: "day" | "week" | "month" = "day",
): Promise<TrendBucket[]> {
  return apiFetch<TrendBucket[]>("/portal/analytics/sales/trend", {
    query: { ...scopeQuery(scope), granularity },
  });
}

export function getSalesPatterns(scope: AnalyticsScope): Promise<PatternsReport> {
  return apiFetch<PatternsReport>("/portal/analytics/sales/patterns", {
    query: scopeQuery(scope),
  });
}

export function getSalesBreakdowns(
  scope: AnalyticsScope,
): Promise<BreakdownsReport> {
  return apiFetch<BreakdownsReport>("/portal/analytics/sales/breakdowns", {
    query: scopeQuery(scope),
  });
}
```

- [ ] **Step 3: Verify it compiles**

```bash
pnpm lint && pnpm test
```

Expected: clean, and the existing suites still pass. There is no unit test for
this module by design — it is a thin, typed wrapper over `apiFetch`, and the
thing worth testing (that the shapes match the API) is what the live suite in
Task 12 asserts against a real server.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/analytics.ts
git commit -m "feat: typed analytics API client mirroring the report shapes"
```

---

## Task 5: `Select` primitive

The scope selector needs a styled select, and the portal has none.

**Files:**
- Create: `src/components/ui/select.tsx`
- Test: `src/components/ui/ui.test.tsx`

**Interfaces:**
- Consumes: `cn` (`src/lib/utils`).
- Produces: `<Select {...SelectHTMLAttributes<HTMLSelectElement>} />`.

- [ ] **Step 1: Write the failing test**

Append to `src/components/ui/ui.test.tsx` (add `Select` to the imports):

```tsx
describe("Select", () => {
  it("renders its options and reports the chosen value", async () => {
    render(
      <Select aria-label="Business" defaultValue="b-2">
        <option value="b-1">One</option>
        <option value="b-2">Two</option>
      </Select>,
    );
    expect(screen.getByLabelText("Business")).toHaveValue("b-2");
  });

  it("marks itself invalid for the same styling the inputs use", () => {
    render(<Select aria-label="Business" aria-invalid="true" />);
    expect(screen.getByLabelText("Business")).toHaveAttribute("aria-invalid", "true");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
pnpm test ui
```

Expected: FAIL — `Select` is not exported.

- [ ] **Step 3: Write the implementation**

Create `src/components/ui/select.tsx`, matching `Input`'s classes so the two line up when they sit side by side:

```tsx
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
pnpm test ui
```

Expected: PASS, whole file.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/select.tsx src/components/ui/ui.test.tsx
git commit -m "feat: select primitive matching the input conventions"
```

---

## Task 6: Date presets and the scope selector

Scope lives in the URL. Presets resolve here, because the API takes literal dates only.

**Files:**
- Create: `src/lib/analytics/range.ts`
- Test: `src/lib/analytics/range.test.ts`
- Create: `src/components/app/scope-selector.tsx`
- Test: `src/components/app/scope-selector.test.tsx`

**Interfaces:**
- Consumes: `Select` (Task 5); `Business`, `Branch`, `AnalyticsScope` from `src/lib/api/types`.
- Produces:
  - `type RangePreset = "today" | "yesterday" | "7d" | "30d" | "month" | "custom"`
  - `PRESET_LABELS: Record<RangePreset, string>`
  - `resolvePreset(preset: RangePreset, today: string): { from: string; to: string }`
  - `todayInManila(now?: Date): string`
  - `<ScopeSelector businesses={Business[]} branches={Branch[]} scope={AnalyticsScope} />`

- [ ] **Step 1: Write the failing range tests**

Create `src/lib/analytics/range.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
pnpm test range
```

Expected: FAIL — `Cannot find module './range'`.

- [ ] **Step 3: Write the range module**

Create `src/lib/analytics/range.ts`:

```ts
/**
 * Date-range presets.
 *
 * These resolve HERE, not in the API. The API takes literal `from`/`to` dates
 * on purpose, so "today" is answered once — against the business day — rather
 * than by a second clock on the server.
 *
 * Dates are handled as `YYYY-MM-DD` strings in UTC arithmetic. They are day
 * labels, not instants; parsing them in local time would shift them a day.
 */

export type RangePreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "month"
  | "custom";

export const PRESET_LABELS: Record<RangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  custom: "Custom",
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Asia/Manila is a fixed UTC+8 — the Philippines has observed no DST since 1978. */
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

/** Today's date in Manila, which is what an owner means by "today". */
export function todayInManila(now: Date = new Date()): string {
  return new Date(now.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

export function resolvePreset(
  preset: RangePreset,
  today: string,
): { from: string; to: string } {
  switch (preset) {
    case "yesterday": {
      const day = addDays(today, -1);
      return { from: day, to: day };
    }
    // Inclusive of today: "7 days" on the 15th is the 9th through the 15th.
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      // To TODAY, not to month end — a report cannot cover days that have not
      // happened, and asking for them would just return zeros.
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "today":
    case "custom":
    default:
      return { from: today, to: today };
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
pnpm test range
```

Expected: PASS.

- [ ] **Step 5: Write the failing scope-selector test**

Create `src/components/app/scope-selector.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScopeSelector } from "./scope-selector";
import type { Branch, Business } from "@/lib/api/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/portal/analytics/overview",
}));

const businesses = [
  { id: "b-1", name: "Kape" },
  { id: "b-2", name: "Tindahan" },
] as Business[];

const branches = [
  { id: "br-1", businessId: "b-1", name: "Main" },
  { id: "br-2", businessId: "b-1", name: "Annex" },
] as Branch[];

const SCOPE = { from: "2026-03-01", to: "2026-03-07" };

function setup(scope = SCOPE) {
  push.mockClear();
  render(
    <ScopeSelector businesses={businesses} branches={branches} scope={scope} />,
  );
}

describe("ScopeSelector", () => {
  it("writes the chosen business into the URL", async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-1");
    expect(push).toHaveBeenCalledWith(
      expect.stringContaining("businessId=b-1"),
    );
  });

  it("keeps the dates when the business changes", async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-1");
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("from=2026-03-01");
    expect(url).toContain("to=2026-03-07");
  });

  // The API rejects a branchId without a businessId, so the UI must never be
  // able to produce that combination.
  it("drops the branch when the business is cleared", async () => {
    push.mockClear();
    render(
      <ScopeSelector
        businesses={businesses}
        branches={branches}
        scope={{ ...SCOPE, businessId: "b-1", branchId: "br-1" }}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Business"), "");
    const url = push.mock.calls[0][0] as string;
    expect(url).not.toContain("branchId");
    expect(url).not.toContain("businessId");
  });

  it("offers no branch picker until a business is chosen", () => {
    setup();
    expect(screen.queryByLabelText("Branch")).toBeNull();
  });

  it("offers only that business's branches", () => {
    render(
      <ScopeSelector
        businesses={businesses}
        branches={branches}
        scope={{ ...SCOPE, businessId: "b-1" }}
      />,
    );
    const options = Array.from(
      screen.getByLabelText("Branch").querySelectorAll("option"),
    ).map((o) => o.textContent);
    expect(options).toEqual(["All branches", "Main", "Annex"]);
  });

  it("turns a preset into literal dates", async () => {
    setup();
    await userEvent.selectOptions(screen.getByLabelText("Range"), "7d");
    const url = push.mock.calls[0][0] as string;
    expect(url).toMatch(/from=\d{4}-\d{2}-\d{2}/);
    expect(url).toMatch(/to=\d{4}-\d{2}-\d{2}/);
    expect(url).not.toContain("preset");
  });

  it("writes a custom date straight through", async () => {
    setup();
    const from = screen.getByLabelText("From");
    await userEvent.clear(from);
    await userEvent.type(from, "2026-02-01");
    expect(
      (push.mock.calls.at(-1)?.[0] as string) ?? "",
    ).toContain("from=2026-02-01");
  });
});
```

- [ ] **Step 6: Run to verify it fails**

```bash
pnpm test scope-selector
```

Expected: FAIL — `Cannot find module './scope-selector'`.

- [ ] **Step 7: Write the scope selector**

Create `src/components/app/scope-selector.tsx`:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  PRESET_LABELS,
  resolvePreset,
  todayInManila,
  type RangePreset,
} from "@/lib/analytics/range";
import type { AnalyticsScope, Branch, Business } from "@/lib/api/types";

/**
 * Scope lives in the URL, not in a store.
 *
 * Three reasons that matter here: a filtered view is linkable, back and forward
 * work with no code, and the Server Components can read it straight from
 * `searchParams` — a client store would drag data fetching into the browser and
 * break the BFF, since `apiFetch` is server-only.
 *
 * Presets resolve to literal dates before they reach the URL, matching the API,
 * which takes no presets of its own.
 */
export function ScopeSelector({
  businesses,
  branches,
  scope,
}: {
  businesses: Business[];
  branches: Branch[];
  scope: AnalyticsScope;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function go(next: AnalyticsScope): void {
    const query = new URLSearchParams({ from: next.from, to: next.to });
    if (next.businessId) query.set("businessId", next.businessId);
    if (next.branchId) query.set("branchId", next.branchId);
    router.push(`${pathname}?${query.toString()}`);
  }

  const visibleBranches = scope.businessId
    ? branches.filter((branch) => branch.businessId === scope.businessId)
    : [];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex-1 min-w-40 text-sm">
        <span className="mb-1 block text-steel">Business</span>
        <Select
          aria-label="Business"
          value={scope.businessId ?? ""}
          onChange={(event) =>
            go({
              ...scope,
              businessId: event.target.value || undefined,
              // A branch without a business is a 422 on the API, so clearing
              // the business must clear the branch with it.
              branchId: undefined,
            })
          }
        >
          <option value="">All businesses</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </Select>
      </label>

      {scope.businessId ? (
        <label className="flex-1 min-w-40 text-sm">
          <span className="mb-1 block text-steel">Branch</span>
          <Select
            aria-label="Branch"
            value={scope.branchId ?? ""}
            onChange={(event) =>
              go({ ...scope, branchId: event.target.value || undefined })
            }
          >
            <option value="">All branches</option>
            {visibleBranches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </label>
      ) : null}

      <label className="min-w-40 text-sm">
        <span className="mb-1 block text-steel">Range</span>
        <Select
          aria-label="Range"
          defaultValue="custom"
          onChange={(event) =>
            go({
              ...scope,
              ...resolvePreset(
                event.target.value as RangePreset,
                todayInManila(),
              ),
            })
          }
        >
          {(Object.keys(PRESET_LABELS) as RangePreset[]).map((preset) => (
            <option key={preset} value={preset}>
              {PRESET_LABELS[preset]}
            </option>
          ))}
        </Select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-steel">From</span>
        <Input
          aria-label="From"
          type="date"
          value={scope.from}
          onChange={(event) => go({ ...scope, from: event.target.value })}
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-steel">To</span>
        <Input
          aria-label="To"
          type="date"
          value={scope.to}
          onChange={(event) => go({ ...scope, to: event.target.value })}
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 8: Run the tests to verify they pass**

```bash
pnpm test scope-selector
```

Expected: PASS, all cases.

- [ ] **Step 9: Commit**

```bash
git add src/lib/analytics src/components/app/scope-selector.tsx src/components/app/scope-selector.test.tsx
git commit -m "feat: date-range presets and a URL-backed analytics scope selector"
```

---

## Task 7: CSV export proxy

The browser has no credentials of its own: tokens are httpOnly and `API_URL` is server-only. A route handler is the only way a download can carry the session.

**Files:**
- Create: `src/app/(app)/portal/analytics/export/route.ts`

**Interfaces:**
- Consumes: `apiBaseUrl` (`src/lib/api/fetch.ts`), `readAccessToken` (`src/lib/auth/session.ts`).
- Produces: `GET /portal/analytics/export?report=<key>&from=&to=&businessId=&branchId=&granularity=`

- [ ] **Step 1: Write the route handler**

Create `src/app/(app)/portal/analytics/export/route.ts`:

```ts
import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api/fetch";
import { readAccessToken } from "@/lib/auth/session";

/**
 * CSV downloads have to be proxied.
 *
 * The API's `?format=csv` needs a bearer token, but the portal keeps tokens in
 * httpOnly cookies and `API_URL` is server-only — deliberately never
 * `NEXT_PUBLIC_`. So the browser cannot call the API directly, and a plain
 * `<a href>` to it would download an unauthorised 401 page.
 *
 * This is a Route Handler rather than a Server Action for the same reason
 * `/logout` is: it returns a file with headers, with no form involved.
 *
 * `report` is matched against a FIXED ALLOWLIST and never used to build a path
 * from user input, so this cannot be turned into a general API tunnel.
 */
const REPORTS: Record<string, string> = {
  overview: "/portal/analytics/overview",
  "sales-heatmap": "/portal/analytics/sales/heatmap",
  "sales-trend": "/portal/analytics/sales/trend",
  "sales-patterns": "/portal/analytics/sales/patterns",
  "sales-breakdowns": "/portal/analytics/sales/breakdowns",
  tax: "/portal/analytics/tax",
};

/** Only these reach the API; anything else in the query is dropped. */
const FORWARDED = ["from", "to", "businessId", "branchId", "granularity"];

export async function GET(request: Request): Promise<Response> {
  const incoming = new URL(request.url).searchParams;
  const path = REPORTS[incoming.get("report") ?? ""];
  if (!path) {
    return NextResponse.json({ error: "Unknown report." }, { status: 400 });
  }

  const token = await readAccessToken();
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const target = new URL(apiBaseUrl() + path);
  for (const key of FORWARDED) {
    const value = incoming.get(key);
    if (value) target.searchParams.set(key, value);
  }
  target.searchParams.set("format", "csv");

  const upstream = await fetch(target, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "That export could not be generated." },
      { status: upstream.status },
    );
  }

  // Pass the API's own filename and type through — it already names the file
  // after the report and its date range.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "text/csv; charset=utf-8",
      "Content-Disposition":
        upstream.headers.get("Content-Disposition") ?? "attachment",
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 2: Verify it compiles and nothing regressed**

```bash
pnpm lint && pnpm test && pnpm build
```

Expected: all clean. (Stop `pnpm dev` first if it is running — a concurrent
build corrupts `.next/`.)

The handler is covered end-to-end by the live suite in Task 12 rather than by a
unit test: everything worth asserting about it — that the cookie is read, that
the API accepts the token, that the headers survive — needs a real server, and a
mocked test would only assert that the mock was called.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/portal/analytics/export/route.ts"
git commit -m "feat: proxy analytics CSV downloads so they carry the session"
```

---

## Task 8: Move the business list to `/portal/businesses`

The dashboard is about to take `/portal`, and it excludes demo businesses. Moving the list first means a demo business is never unreachable, not even for one commit.

**Files:**
- Create: `src/app/(app)/portal/businesses/page.tsx`
- Modify: `src/app/(app)/portal/page.tsx`

**Interfaces:**
- Consumes: `listBusinesses` (`src/lib/api/portal.ts`), `AppShell`, `EmptyState`, `Card`, table primitives.
- Produces: `PORTAL_NAV: NavItem[]` exported from `src/app/(app)/portal/businesses/page.tsx`, so the dashboard and the analytics layout share one nav definition.

- [ ] **Step 1: Move the page**

Copy the whole current body of `src/app/(app)/portal/page.tsx` to
`src/app/(app)/portal/businesses/page.tsx`, renaming the component to
`BusinessListPage`. Change its `NAV` const to the shared export and add the two
new entries:

```tsx
import type { NavItem } from "@/components/app/nav";

/**
 * The portal's top-level nav, shared by the dashboard, the business list and
 * every analytics tab. One definition so a new section cannot appear in some
 * places and not others.
 */
export const PORTAL_NAV: NavItem[] = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/analytics/overview", label: "Analytics" },
  { href: "/portal/businesses", label: "Businesses" },
  { href: "/portal/settings", label: "Settings" },
];
```

and use `nav={PORTAL_NAV}` in its `AppShell`.

Add a line under the heading naming what this page is for, since the dashboard
now carries the figures:

```tsx
<p className="mt-1 text-sm text-steel">
  Every business on your account, including the demo one. Choose one to manage
  its catalogue, branches and settings.
</p>
```

- [ ] **Step 2: Point `/portal` at it for now**

Replace the body of `src/app/(app)/portal/page.tsx` with a redirect, so the move
is a complete, working commit on its own and Task 9 has one clear job:

```tsx
import { redirect } from "next/navigation";

/** Task 9 replaces this with the dashboard (analytics-spec §0). */
export default function PortalHomePage() {
  redirect("/portal/businesses");
}
```

- [ ] **Step 3: Verify**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: clean. `/portal` redirects; `/portal/businesses` lists every business.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/portal"
git commit -m "refactor: move the business list to /portal/businesses"
```

---

## Task 9: The dashboard (§0)

"Is everything okay?" in zero clicks, across every business.

**Files:**
- Create: `src/components/app/kpi-card.tsx`
- Modify: `src/app/(app)/portal/page.tsx`

**Interfaces:**
- Consumes: `getDashboard` (Task 4), `Sparkline` (Task 3), `formatPesosOr`, `formatPercentOr` (Task 1), `PORTAL_NAV` (Task 8), `AppShell`, `Card`, `Badge`, `EmptyState`, table primitives.
- Produces: `<KpiCard title value hint? />`, used again by the overview.

- [ ] **Step 1: Write the KPI card**

Create `src/components/app/kpi-card.tsx`:

```tsx
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * One figure and its comparison. A Server Component — it renders a value that
 * was already formatted by the caller, so it holds no money logic of its own
 * and cannot disagree with the rest of the portal about what a null means.
 */
export function KpiCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
        {hint ? <p className="mt-1 text-xs text-steel">{hint}</p> : null}
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 2: Write the dashboard**

Replace `src/app/(app)/portal/page.tsx`:

```tsx
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { EmptyState } from "@/components/app/empty-state";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getDashboard } from "@/lib/api/analytics";
import { formatPesosOr } from "@/lib/money";
import { formatManilaDateTime } from "@/lib/format";
import { PORTAL_NAV } from "./businesses/page";

/**
 * The portal landing (analytics-spec §0).
 *
 * It deliberately spans every business and ignores the business switcher — it
 * is the one view that answers "is everything okay?" for the whole account.
 * Demo businesses are excluded by the API, which is why the full list still
 * lives at /portal/businesses.
 */
export default async function DashboardPage() {
  const dashboard = await getDashboard();

  return (
    <AppShell title="Sentry" nav={PORTAL_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Today</h1>
          <p className="mt-1 text-sm text-steel">
            Every business on your account, against the same day last week.
          </p>
        </div>

        {dashboard.businesses.length === 0 ? (
          <Card>
            <EmptyState
              title="Nothing to report yet"
              body="Once a business has a branch and its first sale, today's figures appear here."
            />
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {dashboard.businesses.map((business) => {
              const lowStock = dashboard.attention.lowStock.find(
                (l) => l.businessId === business.businessId,
              );
              const unclosed = dashboard.attention.unclosedShifts.find(
                (u) => u.businessId === business.businessId,
              );

              return (
                <Card key={business.businessId}>
                  <CardHeader>
                    <CardTitle>{business.name}</CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Figure
                        label="Sales"
                        now={formatPesosOr(business.today.salesC)}
                        then={formatPesosOr(business.sameDayLastWeek.salesC)}
                      />
                      <Figure
                        label="Gross profit"
                        now={formatPesosOr(business.today.grossProfitC)}
                        then={formatPesosOr(business.sameDayLastWeek.grossProfitC)}
                      />
                      <Figure
                        label="Transactions"
                        now={String(business.today.transactions)}
                        then={String(business.sameDayLastWeek.transactions)}
                      />
                    </div>

                    <Sparkline
                      values={business.sparkline.map((point) => point.salesC)}
                      label={`${business.name} — last 7 days`}
                    />

                    {business.branches.length > 0 ? (
                      <Table>
                        <THead>
                          <TR>
                            <TH>Branch</TH>
                            <TH className="text-right">Sales</TH>
                            <TH className="text-right">Sales count</TH>
                          </TR>
                        </THead>
                        <TBody>
                          {business.branches.map((branch) => (
                            <TR key={branch.branchId}>
                              <TD className="text-charcoal">{branch.name}</TD>
                              <TD className="text-right tabular-nums">
                                {formatPesosOr(branch.salesC)}
                              </TD>
                              <TD className="text-right tabular-nums">
                                {branch.transactions}
                              </TD>
                            </TR>
                          ))}
                        </TBody>
                      </Table>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {lowStock && lowStock.count > 0 ? (
                        <Badge>{lowStock.count} low on stock</Badge>
                      ) : null}
                      {unclosed && unclosed.count > 0 ? (
                        <Badge>{unclosed.count} shift open over 24h</Badge>
                      ) : null}
                    </div>

                    <Link
                      href={`/portal/analytics/overview?businessId=${business.businessId}`}
                      className="inline-block text-sm text-brand-green-dark hover:underline"
                    >
                      Open analytics →
                    </Link>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Right now</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <p className="text-steel">
              {dashboard.live.openShifts.length} shift
              {dashboard.live.openShifts.length === 1 ? "" : "s"} open ·{" "}
              {dashboard.live.terminals.filter((t) => t.paired).length} of{" "}
              {dashboard.live.terminals.length} terminals paired ·{" "}
              {dashboard.live.unreadNotifications} unread notifications
            </p>
            {dashboard.live.openShifts.map((shift) => (
              <p key={shift.shiftId} className="text-charcoal">
                {shift.branchName} · {shift.terminalName} · opened{" "}
                {formatManilaDateTime(shift.openedAt)}
              </p>
            ))}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

/** Today's number with last week's beneath it, so the comparison needs no arrow. */
function Figure({
  label,
  now,
  then,
}: {
  label: string;
  now: string;
  then: string;
}) {
  return (
    <div>
      <p className="text-xs text-steel">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-ink">{now}</p>
      <p className="text-xs text-steel">was {then}</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: clean. Task 12 checks it renders against real data — that is the step
that catches a render-time fault, which `build` does not.

- [ ] **Step 4: Commit**

```bash
git add src/components/app/kpi-card.tsx "src/app/(app)/portal/page.tsx"
git commit -m "feat: portal dashboard with per-business figures, sparklines and attention items"
```

---

## Task 10: Analytics layout and the overview tab (§1)

The shared frame every tab renders inside, plus the first tab.

**Files:**
- Create: `src/app/(app)/portal/analytics/layout.tsx`
- Create: `src/app/(app)/portal/analytics/overview/page.tsx`

**Interfaces:**
- Consumes: `ScopeSelector` (Task 6), `KpiCard` (Task 9), `getOverview` (Task 4), `listBusinesses`/`listBranches` (`src/lib/api/portal.ts`), `formatPesosOr`/`formatPercentOr`/`formatPointsOr` (Task 1), `PORTAL_NAV` (Task 8), `todayInManila` (Task 6).
- Produces:
  - `readScope(searchParams): AnalyticsScope` — exported from the layout's own module `src/app/(app)/portal/analytics/scope.ts`, **not** from the layout file, so a Server Component never imports from a module that might become a client one.
  - `ANALYTICS_TABS: { href: string; label: string }[]`

- [ ] **Step 1: Write the scope reader**

Create `src/app/(app)/portal/analytics/scope.ts`:

```ts
import { todayInManila } from "@/lib/analytics/range";
import type { AnalyticsScope } from "@/lib/api/types";

/**
 * The scope a tab is being asked about, read from the URL.
 *
 * Its own module rather than the layout's, because Server Components import it:
 * a plain function exported from a `"use client"` module type-checks and then
 * throws at render, and this repo has already been bitten by that once.
 *
 * Defaults to the last 7 days ending today in Manila, so a bare
 * `/portal/analytics/overview` is a working page rather than a validation error.
 */
export function readScope(params: {
  businessId?: string;
  branchId?: string;
  from?: string;
  to?: string;
}): AnalyticsScope {
  const today = todayInManila();
  const defaultFrom = new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  return {
    businessId: params.businessId,
    // The API rejects a branch without a business; never send that pair.
    branchId: params.businessId ? params.branchId : undefined,
    from: params.from ?? defaultFrom,
    to: params.to ?? today,
  };
}

/** The query string that carries a scope to another tab or to the CSV proxy. */
export function scopeQuery(
  scope: AnalyticsScope,
  extra: Record<string, string> = {},
): string {
  const query = new URLSearchParams({ from: scope.from, to: scope.to, ...extra });
  if (scope.businessId) query.set("businessId", scope.businessId);
  if (scope.branchId) query.set("branchId", scope.branchId);
  return query.toString();
}

export const ANALYTICS_TABS = [
  { href: "/portal/analytics/overview", label: "Overview" },
  { href: "/portal/analytics/sales", label: "Sales" },
];
```

Plan 2 appends its four tabs to `ANALYTICS_TABS`.

- [ ] **Step 2: Write the layout**

Create `src/app/(app)/portal/analytics/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { PORTAL_NAV } from "../businesses/page";
import { ANALYTICS_TABS } from "./scope";

/**
 * The frame every analytics tab renders inside.
 *
 * The tab strip lives here so switching tabs keeps the query string — Next
 * preserves it on a `Link` that carries it, and each page reads the same
 * `searchParams`. The scope selector itself is rendered per page rather than
 * here, because a layout does not re-render on a search-param change and would
 * show a stale selection.
 */
export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell title="Sentry" nav={PORTAL_NAV}>
      <div className="space-y-6">
        <nav className="flex gap-4 border-b border-hairline">
          {ANALYTICS_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="-mb-px border-b-2 border-transparent px-1 pb-2 text-sm text-steel hover:border-hairline hover:text-charcoal"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 3: Write the overview tab**

Create `src/app/(app)/portal/analytics/overview/page.tsx`:

```tsx
import { ScopeSelector } from "@/components/app/scope-selector";
import { KpiCard } from "@/components/app/kpi-card";
import { Alert } from "@/components/ui/alert";
import { getOverview } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatPercentOr, formatPesosOr, formatPointsOr } from "@/lib/money";
import type { Kpi, NullableKpi } from "@/lib/api/types";
import { readScope, scopeQuery } from "../scope";

/** "was ₱X · +12.0%" — the comparison in words, so no arrow needs decoding. */
function moneyHint(kpi: Kpi | NullableKpi): string {
  return `was ${formatPesosOr(kpi.previous)} · ${formatPercentOr(kpi.changePct)}`;
}

function countHint(kpi: Kpi): string {
  return `was ${kpi.previous} · ${formatPercentOr(kpi.changePct)}`;
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const scope = readScope(await searchParams);
  const [businesses, branches] = await Promise.all([
    listBusinesses(),
    scope.businessId ? listBranches(scope.businessId) : Promise.resolve([]),
  ]);

  let report;
  try {
    report = await getOverview(scope);
  } catch (error) {
    if (error instanceof ValidationError) {
      return (
        <div className="space-y-6">
          <ScopeSelector businesses={businesses} branches={branches} scope={scope} />
          <Alert>{error.message}</Alert>
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <ScopeSelector businesses={businesses} branches={branches} scope={scope} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Gross sales"
          value={formatPesosOr(report.grossSalesC.value)}
          hint={moneyHint(report.grossSalesC)}
        />
        <KpiCard
          title="Discounts given"
          value={formatPesosOr(report.discountsC.value)}
          hint={moneyHint(report.discountsC)}
        />
        <KpiCard
          title="Net sales"
          value={formatPesosOr(report.netSalesC.value)}
          hint={moneyHint(report.netSalesC)}
        />
        <KpiCard
          title="Gross profit"
          value={formatPesosOr(report.grossProfitC.value)}
          hint={moneyHint(report.grossProfitC)}
        />
        <KpiCard
          title="Margin"
          value={formatPercentOr(report.marginPct.value)}
          // A margin is already a ratio, so its comparison is in POINTS.
          hint={`was ${formatPercentOr(report.marginPct.previous)} · ${formatPointsOr(
            report.marginPct.changePoints,
          )}`}
        />
        <KpiCard
          title="Transactions"
          value={String(report.transactions.value)}
          hint={countHint(report.transactions)}
        />
        <KpiCard
          title="Average basket"
          value={formatPesosOr(report.averageBasketC.value)}
          hint={moneyHint(report.averageBasketC)}
        />
        <KpiCard
          title="Service charge"
          value={formatPesosOr(report.serviceChargeC.value)}
          hint={moneyHint(report.serviceChargeC)}
        />
        <KpiCard
          title="Voids / refunds"
          value={`${report.voidCount.value} / ${report.refundCount.value}`}
          hint={`was ${report.voidCount.previous} / ${report.refundCount.previous}`}
        />
      </div>

      <p className="text-sm text-steel">
        Profit covers {formatPesosOr(report.costedRevenueC)} of sales;{" "}
        {formatPesosOr(report.uncostedRevenueC)} has no cost recorded, so its
        margin is unknown.
      </p>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "overview" })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download CSV
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/portal/analytics"
git commit -m "feat: analytics layout and the overview tab"
```

---

## Task 11: The sales tab (§2)

Four views over the same sales: the calendar heatmap, the trend, hour and weekday patterns, and the three breakdowns.

**Files:**
- Create: `src/app/(app)/portal/analytics/sales/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–10; `getSalesHeatmap`, `getSalesTrend`, `getSalesPatterns`, `getSalesBreakdowns` (Task 4); `CalendarHeatmap`, `TrendLine`, `BarRow` (Task 3).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the page**

Create `src/app/(app)/portal/analytics/sales/page.tsx`:

```tsx
import { ScopeSelector } from "@/components/app/scope-selector";
import { BarRow } from "@/components/charts/bar-row";
import { CalendarHeatmap } from "@/components/charts/calendar-heatmap";
import { TrendLine } from "@/components/charts/trend-line";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSalesBreakdowns,
  getSalesHeatmap,
  getSalesPatterns,
  getSalesTrend,
} from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { readScope, scopeQuery } from "../scope";

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, "0")}:00`,
);
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    granularity?: "day" | "week" | "month";
  }>;
}) {
  const params = await searchParams;
  const scope = readScope(params);
  const granularity = params.granularity ?? "day";

  const [businesses, branches] = await Promise.all([
    listBusinesses(),
    scope.businessId ? listBranches(scope.businessId) : Promise.resolve([]),
  ]);

  let heatmap;
  let trend;
  let patterns;
  let breakdowns;
  try {
    [heatmap, trend, patterns, breakdowns] = await Promise.all([
      getSalesHeatmap(scope),
      getSalesTrend(scope, granularity),
      getSalesPatterns(scope),
      getSalesBreakdowns(scope),
    ]);
  } catch (error) {
    if (error instanceof ValidationError) {
      return (
        <div className="space-y-6">
          <ScopeSelector businesses={businesses} branches={branches} scope={scope} />
          <Alert>{error.message}</Alert>
        </div>
      );
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <ScopeSelector businesses={businesses} branches={branches} scope={scope} />

      <Card>
        <CardHeader>
          <CardTitle>Which days feed us</CardTitle>
        </CardHeader>
        <CardBody>
          <CalendarHeatmap
            title="Sales per business day"
            days={heatmap.map((day) => ({ date: day.date, value: day.salesC }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend</CardTitle>
        </CardHeader>
        <CardBody>
          <TrendLine
            title="Net sales over time"
            points={trend.map((bucket) => ({
              label: bucket.bucket,
              value: bucket.salesC,
            }))}
          />
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hour of day</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by hour"
              rows={patterns.hourOfDay.map((row) => ({
                label: HOUR_LABELS[row.hour],
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Day of week</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by weekday"
              rows={patterns.dayOfWeek.map((row) => ({
                label: DAY_LABELS[row.dayOfWeek],
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by payment method"
              rows={breakdowns.byPaymentMethod.map((row) => ({
                label: row.method,
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order type</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by order type"
              rows={breakdowns.byOrderType.map((row) => ({
                label: row.orderType,
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branch</CardTitle>
          </CardHeader>
          <CardBody>
            <BarRow
              title="Sales by branch"
              rows={breakdowns.byBranch.map((row) => ({
                label: row.name,
                value: row.salesC,
              }))}
            />
          </CardBody>
        </Card>
      </div>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, {
          report: "sales-heatmap",
        })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download daily sales CSV
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/portal/analytics/sales"
git commit -m "feat: sales tab with heatmap, trend, patterns and breakdowns"
```

---

## Task 12: Live pass over the new routes

The only check that catches the two faults this repo has actually hit: a Server Component calling into a `"use client"` module, and a route that compiles but throws at render. Neither `pnpm test` nor `pnpm build` sees either.

**Files:**
- Create: `src/test/integration/live-analytics.test.ts`

**Interfaces:**
- Consumes: the existing live-suite conventions in `src/test/integration/live-portal.test.ts` — the same env gating and sign-in helper.

- [ ] **Step 1: Write the live test**

Create `src/test/integration/live-analytics.test.ts`, following the gating and
sign-in helper already used by `live-portal.test.ts` in the same folder:

```ts
/**
 * Opt-in live pass over the analytics screens. Runs only with
 * `PORTAL_E2E_API_URL` and owner credentials set; `pnpm test` never runs it.
 *
 * Asserts the pages RENDER, not just that they compile. A Server Component
 * calling a function exported from a `"use client"` module type-checks, builds
 * clean, and throws only when a real request renders it — which is exactly the
 * fault this suite exists to catch.
 */
const ROUTES = [
  "/portal",
  "/portal/businesses",
  "/portal/analytics/overview",
  "/portal/analytics/sales",
  "/portal/analytics/overview?from=2026-03-01&to=2026-03-07",
];

describe.runIf(process.env.PORTAL_E2E_API_URL)("analytics screens (live)", () => {
  it.each(ROUTES)("renders %s with a real session", async (route) => {
    const response = await fetchWithSession(route);
    expect(response.status).toBe(200);
    const html = await response.text();
    // A Next error page still returns 200 in dev; check the shell rendered.
    expect(html).not.toContain("Application error");
  });

  it("downloads a CSV through the export proxy", async () => {
    const response = await fetchWithSession(
      "/portal/analytics/export?report=overview&from=2026-03-01&to=2026-03-07",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("attachment");
  });

  it("refuses an unknown report rather than proxying it", async () => {
    const response = await fetchWithSession(
      "/portal/analytics/export?report=../../admin/owners&from=2026-03-01&to=2026-03-07",
    );
    expect(response.status).toBe(400);
  });
});
```

`fetchWithSession` is the helper from `live-portal.test.ts`; import it or lift it
into a shared module in that folder if it is currently file-local.

- [ ] **Step 2: Run the live suite**

```bash
# In sentry-pos-be: npm run start:dev
# In sentry-pos-landing: pnpm dev
pnpm test:integration
```

Expected: PASS. A 500 on `/portal` or a tab is a real render-time fault — read
the dev-server output, which names the offending module.

- [ ] **Step 3: Run everything one last time**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: all clean. Stop `pnpm dev` before `pnpm build`.

- [ ] **Step 4: Commit**

```bash
git add src/test/integration/live-analytics.test.ts
git commit -m "test: live pass over the analytics screens and the CSV proxy"
```

---

## Self-review notes

**Spec coverage.** Null-aware formatters → Task 1. Chart geometry → Task 2.
Chart primitives → Task 3. Analytics API client → Task 4. `Select` → Task 5.
Scope selector and presets → Task 6. CSV proxy → Task 7. Business list kept
reachable → Task 8. §0 dashboard → Task 9. Analytics IA + §1 → Task 10. §2 →
Task 11. Live pass → Task 12. §3–§6 are plan 2, as the spec states.

**Two decisions a reviewer should check.**
1. `readScope` and `scopeQuery` live in `analytics/scope.ts`, not in
   `layout.tsx`, so Server Components never import from a file that could become
   a client module. This repo has already shipped that bug once.
2. The scope selector is rendered **per page**, not in the layout. A Next layout
   does not re-render when only search params change, so a selector in the
   layout would show a stale selection after every change.

**Interface consistency.** `formatPesosOr`/`formatPercentOr`/`formatPointsOr`
(Task 1) are used by Tasks 3, 9, 10, 11. `toPolyline`/`toBars`/`toHeatmapWeeks`
(Task 2) only by Task 3. `AnalyticsScope` (Task 4) by Tasks 6, 10, 11.
`PORTAL_NAV` (Task 8) by Tasks 9 and 10. `KpiCard` (Task 9) by Task 10.
`readScope`/`scopeQuery`/`ANALYTICS_TABS` (Task 10) by Tasks 10 and 11.

**Task order is a dependency order.** 1 → 3. 2 → 3. 4 → 9, 10, 11. 5 → 6. 6 →
10, 11. 8 → 9, 10. 3, 4 → 9. 9 → 10. 10 → 11. All → 12.

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-08-portal-analytics-foundation.md`. Two execution options:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

