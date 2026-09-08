# Portal Analytics UI — Design

**Repo:** `sentry-pos-landing` · **Date:** 2026-09-08 · **Milestone:** 3

Builds the portal's **Analytics** section against the 15 endpoints shipped in
`sentry-pos-be` on 2026-09-08. Source of truth for what each view must show is
`analytics-spec.md` (mirrored in `sentry-pos-fe` and `sentry-pos-be`; not in this
repo). Companion: the API design at
`sentry-pos-be/docs/superpowers/specs/2026-09-06-portal-analytics-and-dashboard-design.md`.

## Goal

Give the owner the screens for numbers that currently exist only as JSON: the
dashboard landing, six report tabs, and a CSV download from each.

## What is already true

Facts established by reading the repo. The design depends on all of them.

| Fact | Where | Consequence |
|---|---|---|
| The portal is Server Components over a server-only `apiFetch` (BFF) | `src/lib/api/fetch.ts` | Pages fetch on the server; charts must not need client data fetching |
| UI primitives are `alert, badge, button, card, field, input, label, table` | `src/components/ui/` | No select, no tabs, no date picker — a `Select` has to be added |
| No charting library is installed | `package.json` | Charts are hand-rolled (decision below) |
| Server-rendered inline SVG is an established pattern | `src/components/app/qr-code.tsx` | Hand-rolled SVG charts fit the existing architecture |
| `/portal` is currently the business list | `src/app/(app)/portal/page.tsx` | That route is where §0's dashboard belongs |
| `formatPesos(centavosC: number)` does NOT accept null | `src/lib/money.ts:54` | Every analytics money field is `number \| null`; a null-aware formatter is required |
| A route handler precedent exists | `src/app/(app)/logout/route.ts` | The CSV proxy has a pattern to follow |
| Next 15: `params` and `searchParams` are Promises | existing pages | Every analytics page awaits `searchParams` |

### API facts that shape the UI

- **Margins and every ratio are FRACTIONS** (0.4 = 40%), not percentages.
- **Money is integer centavos**, and is `null` wherever the figure is unknown —
  never 0. Same for `daysOfStock`, `valueC`, `costC`, `pctOfNetSales`.
- **Date presets resolve in the portal.** The API accepts literal `from`/`to`
  dates only, deliberately, so "today" is answered once against a business day.
- **The dashboard takes no parameters.** It spans every non-demo business and
  ignores the business switcher by design.
- **`/analytics/inventory/movements` is paginated** (`Paginated<T>`), and returns
  422 when `page × pageSize > 2000`, asking for a narrower scope.

## Scope

Two plans. The split is where the shared machinery has been proven against real
screens rather than written speculatively.

**Plan 1 — foundation and the money views:** the analytics API client, the scope
selector, the chart primitives, the CSV export proxy, then §0 dashboard, §1
overview, §2 sales.

**Plan 2 — the remaining tabs:** §3 products, §4 profit & leaks, §5 inventory,
§6 tax. These add no new machinery; they are pages over primitives Plan 1 built.

Out of scope, because the API does not serve them: expiring-soon, stock-take
history and transfer history (all deferred to the backend's sub-project B), and
anything needing staff identity.

## Information architecture

**`/portal` becomes the dashboard (§0)**, replacing today's business list.
`analytics-spec.md` §0 calls it "the Portal Landing", it spans every business,
and each business card links through to that business. Nothing is lost — the
cards *are* the way in, and they carry today's figures as well as the name.

**Analytics is top-level, not nested under a business:**

```
/portal/analytics/overview
/portal/analytics/sales
/portal/analytics/products
/portal/analytics/profit
/portal/analytics/leaks
/portal/analytics/inventory
/portal/analytics/tax
```

This is forced by the spec's own scope selector — "all businesses → business →
branch". An all-businesses rollup has no home under `/portal/businesses/[id]`,
so nesting it there would make the default view unreachable.

A shared `layout.tsx` under `/portal/analytics` renders the tab strip and the
scope selector once, so switching tabs preserves scope.

## The scope selector is URL state

One client component that writes `?businessId=&branchId=&from=&to=`, read by
every tab's Server Component through `searchParams`.

URL state rather than a store or context, for three reasons that matter here: a
filtered view is linkable and pasteable, browser back/forward works without any
code, and the Server Components can read it directly — a client store would
force the data fetching into the client and break the BFF.

The selector holds: business (all / one), branch (only when a business is
chosen, mirroring the API's rule that `branchId` requires `businessId`), and a
date range with presets — today, yesterday, 7 days, 30 days, this month, custom.
**Presets resolve to literal dates in the browser**, matching the API contract.

`Select` joins `src/components/ui/` as a styled primitive, following the existing
`Input`/`Field` conventions so it participates in the same label and error
plumbing.

## Chart primitives

Four server components in `src/components/charts/`, each thin JSX over a **pure
geometry function** in its own module:

| Component | Geometry | Used by |
|---|---|---|
| `Sparkline` | `toPolyline(values, w, h)` | §0 per-business 7-day trend |
| `TrendLine` | `toPolyline` + axis ticks | §2 trend, §4 profit over time |
| `CalendarHeatmap` | `toHeatmapWeeks(days)` | §2 heatmap |
| `BarRow` | `toBars(values)` | §2 hour/day patterns, breakdowns |

Splitting geometry from rendering is what makes these testable: the maths is
asserted directly on numbers, and the components stay too boring to break. They
are **server components** — no client JS, no dependency, nothing added to the
bundle, and they render inside the same request that fetched the data.

Hover tooltips are deliberately not in this design. They would make every chart a
client component for a convenience the tables beside them already provide; if
pilots ask, a client wrapper can be added later without touching the geometry.

Accessibility: each chart carries a `<title>` and the underlying figures appear
in an adjacent table or `<figcaption>`, so a chart is never the only way to read
a number.

## CSV export has to be proxied

Every report accepts `?format=csv`, but the browser cannot call the API directly:
tokens are httpOnly cookies and `API_URL` is server-only, never `NEXT_PUBLIC_`.

So `src/app/(app)/portal/analytics/export/route.ts` takes the same query the page
holds plus a `report` key, calls the API server-side with `format=csv`, and
streams the body back with `Content-Type` and `Content-Disposition` preserved.
Export links are plain `<a href>` — no JavaScript, and the download works with
the session the user already has.

The route validates `report` against a fixed allowlist of the seven report keys.
It never forwards an arbitrary path, so the proxy cannot be turned into a general
API tunnel.

## Null is "—", everywhere

The single sharpest correctness rule on this side, mirroring the backend's:

- `formatPesosOr(value: number | null, fallback = "—")` and
  `formatPercentOr(fraction: number | null, fallback = "—")` join
  `src/lib/money.ts`.
- **Percent display multiplies the fraction by 100 in exactly one place** —
  `formatPercentOr`. No component does its own arithmetic on a ratio.
- A null must never render as `₱0.00` or `0%`. An unknown margin and a zero
  margin mean opposite things to an owner deciding what to stock.

This gets its own tests, because it is the failure that would look plausible on
screen and be wrong.

## Error handling

Follows the portal's existing conventions.

| Case | Behaviour |
|---|---|
| 404 from a scope the caller does not own | `notFound()` — the existing pattern in the stock and catalog pages |
| 422 validation (bad range, `branchId` without `businessId`) | Render the message above the report; the selector cannot normally produce one |
| 422 from movements paging past the bound | Show the API's message, which already says to narrow the scope |
| Empty result | The report's zero shape with an `EmptyState`, never an error — a quiet period is an answer |
| Owner suspended / unauthenticated | Handled upstream by middleware, unchanged |

## Testing

- **Vitest unit:** every geometry function (`toPolyline`, `toHeatmapWeeks`,
  `toBars`) on known inputs; `formatPesosOr` / `formatPercentOr` including the
  null cases and the fraction→percent conversion.
- **React Testing Library:** the scope selector writes the expected query string;
  choosing a preset produces literal dates; clearing a business also clears the
  branch.
- **Live integration** (`src/test/integration/`, the existing opt-in suite): a
  pass over every new route with a real session, asserting 200 and that a known
  seeded figure appears. This is the only check that catches the two faults this
  repo has already hit — a Server Component calling into a `"use client"` module,
  and a route that compiles but throws at render.

## Implementation order

Plan 1 builds bottom-up so each task is verifiable: money formatters → chart
geometry → chart components → analytics API client → `Select` → scope selector →
CSV proxy → dashboard → overview → sales. Plan 2 then adds four tabs over
finished parts.
