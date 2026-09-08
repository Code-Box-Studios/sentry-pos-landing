# Portal Analytics — Product, Profit, Inventory and Tax Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the portal's Analytics section with the §3 products, §4 profit and leaks, §5 inventory and §6 tax tabs.

**Architecture:** Pages over the foundation plan 1 already built — the scope resolver, the chart primitives, the null-aware formatters and the CSV proxy. No new machinery: each tab is a Server Component that reads `searchParams`, calls one or more typed API functions, and renders tables and existing charts.

**Tech Stack:** Next 15 App Router (React Server Components), TypeScript, Tailwind v4, Vitest + React Testing Library, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-08-portal-analytics-ui-design.md`. Plan 2 of 2; plan 1 (`2026-09-08-portal-analytics-foundation.md`) shipped the foundation, §0 dashboard, §1 overview and §2 sales.

## Global Constraints

Every task's requirements implicitly include all of these. The first four are already enforced by shipped code — do not re-litigate them.

- **Money from the API is integer centavos, and `null` means UNKNOWN — never zero.** Render every nullable money field with `formatPesosOr`, which produces `—`.
- **Ratios from the API are FRACTIONS** (`0.4` = 40%). Render them with `formatPercentOr`, the only place that multiplies by 100.
- **Charts are Server Components** from `src/components/charts/`. No `"use client"`, no charting dependency.
- **A Server Component may not call a function exported from a `"use client"` module.** It compiles, builds clean, and throws at render. `readScope`/`scopeQuery` live in `analytics/scope.ts` for exactly this reason — import them from there, never from a page or layout.
- **Every tab renders its own `<ScopeSelector>`.** A Next layout does not re-render when only search params change, so a selector in the layout would show a stale selection.
- **Quantities are plain numbers**, not centavos. Render them directly; never pass them to a money formatter.
- **Next 15: `searchParams` is a Promise** and must be awaited.
- **Never add a Claude co-author trailer to a commit. Never run `git push`.** Commit directly on `main`.

**Commands:** `pnpm test`, `pnpm test:integration` (needs the API on :4000 and the portal on :3100), `pnpm lint`, `pnpm build`.

**Do not run `pnpm build` while `pnpm dev` is running** — it corrupts `.next/` and every route then 500s with `Cannot find module './vendor-chunks/…'`.

---

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/app/(app)/portal/analytics/products/page.tsx` | §3 top and slow sellers, with category rollup. |
| `src/app/(app)/portal/analytics/products/[productId]/page.tsx` | §3 per-product trend drill-down. |
| `src/app/(app)/portal/analytics/profit/page.tsx` | §4 profit over time, by product, by category. |
| `src/app/(app)/portal/analytics/leaks/page.tsx` | §4 discounts, SC/PWD, misc, voids, refunds, over/short. |
| `src/app/(app)/portal/analytics/inventory/page.tsx` | §5 movement ledger, shrinkage, stock on hand. |
| `src/app/(app)/portal/analytics/tax/page.tsx` | §6 tax summary. |

**Modified:**

| File | Change |
|---|---|
| `src/lib/api/types.ts` | Response types for §3–§6. |
| `src/lib/api/analytics.ts` | The eight remaining endpoint functions. |
| `src/app/(app)/portal/analytics/scope.ts` | Four more entries in `ANALYTICS_TABS`. |
| `src/test/integration/live-analytics.test.ts` | The new routes added to `ROUTES`. |

---

## Task 1: Types and API client for §3–§6

Mirrors the shipped API shapes exactly. Getting a field name wrong here surfaces as `undefined` on screen, not as a type error, because the API responses are untyped JSON at the boundary.

**Files:**
- Modify: `src/lib/api/types.ts`
- Modify: `src/lib/api/analytics.ts`

**Interfaces:**
- Consumes: `apiFetch`, `AnalyticsScope`, `Paginated<T>` (all existing).
- Produces (types): `SoldRow`, `CategorySales`, `TopProductsReport`, `SlowProductsReport`, `ProductTrendBucket`, `ProductTrendReport`, `MarginFigures`, `ProductMarginRow`, `CategoryMarginRow`, `ProfitBucket`, `ProfitReport`, `NamedDiscount`, `StatusBucket`, `OverShortEntry`, `LeaksReport`, `Movement`, `ShrinkageEntry`, `ShrinkageReport`, `OnHandEntry`, `OnHandReport`, `TaxBusinessRow`, `TaxTotals`, `TaxReport`.
- Produces (client): `getTopProducts`, `getSlowProducts`, `getProductTrend`, `getProfit`, `getLeaks`, `getInventoryMovements`, `getShrinkage`, `getOnHand`, `getTax`.

- [ ] **Step 1: Add the types**

Append to `src/lib/api/types.ts`:

```ts
// ---------------------------------------------------------------------------
// Analytics §3 — products sold
//
// Rows are keyed by (productId, variantId): a variant is what actually sells.
// MISC (open-price) lines are excluded by the API, so product revenue does NOT
// sum to net sales — that is deliberate, not a bug to chase.
// ---------------------------------------------------------------------------

export interface SoldRow {
  productId: string;
  variantId: string | null;
  name: string;
  /** A plain quantity, not centavos. */
  units: number;
  revenueC: number;
  grossProfitC: number | null;
  marginPct: number | null;
}

export interface CategorySales {
  categoryId: string;
  name: string;
  units: number;
  revenueC: number;
}

export interface TopProductsReport {
  from: string;
  to: string;
  by: "units" | "revenue";
  rows: SoldRow[];
  categories: CategorySales[];
}

export interface SlowProductsReport {
  from: string;
  to: string;
  bottom: SoldRow[];
  zeroSales: { productId: string; name: string; categoryName: string }[];
}

export interface ProductTrendBucket {
  bucket: string;
  units: number;
  revenueC: number;
  grossProfitC: number | null;
  marginPct: number | null;
}

export interface ProductTrendReport {
  productId: string;
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
  buckets: ProductTrendBucket[];
}

// ---------------------------------------------------------------------------
// Analytics §4 — profit and leaks
// ---------------------------------------------------------------------------

export interface MarginFigures {
  revenueC: number;
  /** UNKNOWN, not zero, when nothing in the group carried a cost. */
  costC: number | null;
  grossProfitC: number | null;
  marginPct: number | null;
}

export interface ProductMarginRow extends MarginFigures {
  productId: string;
  variantId: string | null;
  name: string;
}

export interface CategoryMarginRow extends MarginFigures {
  categoryId: string;
  name: string;
}

export interface ProfitBucket {
  bucket: string;
  grossProfitC: number | null;
  marginPct: number | null;
}

export interface ProfitReport {
  from: string;
  to: string;
  granularity: "day" | "week" | "month";
  overTime: ProfitBucket[];
  byProduct: ProductMarginRow[];
  byCategory: CategoryMarginRow[];
  costedRevenueC: number;
  uncostedRevenueC: number;
}

export interface NamedDiscount {
  discountId: string;
  name: string;
  kind: string;
  timesUsed: number;
  amountC: number;
}

export interface StatusBucket {
  count: number;
  valueC: number;
  reasons: { reason: string; count: number; valueC: number }[];
}

export interface OverShortEntry {
  shiftId: string;
  branchId: string;
  branchName: string;
  closedAt: string;
  expectedCashC: number | null;
  closingCashC: number | null;
  /** `closing − expected`, so negative is short. Null if either is unrecorded. */
  varianceC: number | null;
}

export interface LeaksReport {
  from: string;
  to: string;
  discountsByName: NamedDiscount[];
  /** The remainder of `sales.discount` that no line accounts for. */
  orderLevelDiscountC: number;
  scPwd: { discountC: number; vatExemptSalesC: number; saleCount: number };
  /** `pctOfNetSales` is a FRACTION, and null when there were no net sales. */
  miscLines: { revenueC: number; pctOfNetSales: number | null };
  voids: StatusBucket;
  refunds: StatusBucket;
  overShort: OverShortEntry[];
}

// ---------------------------------------------------------------------------
// Analytics §5 — inventory
// ---------------------------------------------------------------------------

export interface Movement {
  id: string;
  createdAt: string;
  branchId: string;
  branchName: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  type: string;
  /** Signed: negative is stock leaving. A plain quantity, not centavos. */
  qtyDelta: number;
  reasonCategory: string | null;
  unitCostC: number | null;
  note: string | null;
  /** From the audit trail; null when no audit row matches the movement. */
  actor: { actorType: string; actorId: string | null; action: string } | null;
}

export interface ShrinkageEntry {
  reasonCategory: string;
  units: number;
  /** Null when nothing in this reason bucket had a cost. */
  valueC: number | null;
  uncostedUnits: number;
}

export interface ShrinkageReport {
  from: string;
  to: string;
  rows: ShrinkageEntry[];
}

export interface OnHandEntry {
  branchId: string;
  branchName: string;
  productId: string;
  variantId: string | null;
  name: string;
  qty: number;
  unitCostC: number | null;
  valueC: number | null;
  lowStockThreshold: number | null;
  isLow: boolean;
  /** Null when the product did not sell in the range — an unbounded runway. */
  daysOfStock: number | null;
}

export interface OnHandReport {
  from: string;
  to: string;
  rows: OnHandEntry[];
  totals: { valueC: number; uncostedItems: number };
}

// ---------------------------------------------------------------------------
// Analytics §6 — tax
// ---------------------------------------------------------------------------

export interface TaxBusinessRow {
  businessId: string;
  name: string;
  /** A FRACTION (0.12 = 12%). */
  taxRate: number;
  vatableSalesC: number;
  vatC: number;
  vatExemptSalesC: number;
  scPwdDiscountC: number;
  serviceChargeC: number;
}

export interface TaxTotals {
  vatableSalesC: number;
  vatC: number;
  vatExemptSalesC: number;
  scPwdDiscountC: number;
  serviceChargeC: number;
}

export interface TaxReport {
  from: string;
  to: string;
  businesses: TaxBusinessRow[];
  /** Amounts only — deliberately no blended tax rate. */
  totals: TaxTotals;
}
```

- [ ] **Step 2: Add the client functions**

Append to `src/lib/api/analytics.ts`, and extend its type import with the new
names:

```ts
export function getTopProducts(
  scope: AnalyticsScope,
  options: { by?: "units" | "revenue"; limit?: number } = {},
): Promise<TopProductsReport> {
  return apiFetch<TopProductsReport>("/portal/analytics/products/top", {
    query: { ...scopeQuery(scope), by: options.by, limit: options.limit },
  });
}

export function getSlowProducts(
  scope: AnalyticsScope,
  options: { limit?: number } = {},
): Promise<SlowProductsReport> {
  return apiFetch<SlowProductsReport>("/portal/analytics/products/slow", {
    query: { ...scopeQuery(scope), limit: options.limit },
  });
}

export function getProductTrend(
  productId: string,
  scope: AnalyticsScope,
  granularity: "day" | "week" | "month" = "day",
): Promise<ProductTrendReport> {
  return apiFetch<ProductTrendReport>(
    `/portal/analytics/products/${productId}/trend`,
    { query: { ...scopeQuery(scope), granularity } },
  );
}

export function getProfit(
  scope: AnalyticsScope,
  granularity: "day" | "week" | "month" = "day",
): Promise<ProfitReport> {
  return apiFetch<ProfitReport>("/portal/analytics/profit", {
    query: { ...scopeQuery(scope), granularity },
  });
}

export function getLeaks(scope: AnalyticsScope): Promise<LeaksReport> {
  return apiFetch<LeaksReport>("/portal/analytics/leaks", {
    query: scopeQuery(scope),
  });
}

/**
 * The ledger is PAGINATED, and the API refuses `page × pageSize > 2000` with a
 * 422 asking for a narrower scope — reports merge per business in memory, so
 * the depth is deliberately bounded.
 */
export function getInventoryMovements(
  scope: AnalyticsScope,
  options: { type?: string; productId?: string; page?: number; pageSize?: number } = {},
): Promise<Paginated<Movement>> {
  return apiFetch<Paginated<Movement>>("/portal/analytics/inventory/movements", {
    query: {
      ...scopeQuery(scope),
      type: options.type,
      productId: options.productId,
      page: options.page,
      pageSize: options.pageSize,
    },
  });
}

export function getShrinkage(scope: AnalyticsScope): Promise<ShrinkageReport> {
  return apiFetch<ShrinkageReport>("/portal/analytics/inventory/shrinkage", {
    query: scopeQuery(scope),
  });
}

export function getOnHand(scope: AnalyticsScope): Promise<OnHandReport> {
  return apiFetch<OnHandReport>("/portal/analytics/inventory/on-hand", {
    query: scopeQuery(scope),
  });
}

export function getTax(scope: AnalyticsScope): Promise<TaxReport> {
  return apiFetch<TaxReport>("/portal/analytics/tax", {
    query: scopeQuery(scope),
  });
}
```

- [ ] **Step 3: Extend the CSV proxy allowlist**

The proxy forwards only report keys it knows, and plan 1 registered just the §0–§2
and §6 ones. Every tab from Task 2 onwards links to a download, so the keys have
to exist before those links do — otherwise the first one written 400s and looks
like a bug in the page. Add to `REPORTS` in
`src/app/(app)/portal/analytics/export/route.ts`:

```ts
  "products-top": "/portal/analytics/products/top",
  "products-slow": "/portal/analytics/products/slow",
  profit: "/portal/analytics/profit",
  leaks: "/portal/analytics/leaks",
  "inventory-movements": "/portal/analytics/inventory/movements",
  "inventory-shrinkage": "/portal/analytics/inventory/shrinkage",
  "inventory-on-hand": "/portal/analytics/inventory/on-hand",
```

- [ ] **Step 4: Verify it compiles**

```bash
pnpm lint && pnpm test
```

Expected: clean, existing suites still pass. No unit test for the client by
design — these are thin typed wrappers, and the thing worth checking (that the
shapes match a real API) is what Task 7's live pass asserts.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/analytics.ts "src/app/(app)/portal/analytics/export/route.ts"
git commit -m "feat: typed API client and CSV keys for the product, profit, inventory and tax reports"
```

---

## Task 2: Products tab (§3)

Top sellers, slow movers, the zero-sales list, and a drill-down per product.

**Files:**
- Create: `src/app/(app)/portal/analytics/products/page.tsx`
- Create: `src/app/(app)/portal/analytics/products/[productId]/page.tsx`

**Interfaces:**
- Consumes: `getTopProducts`, `getSlowProducts`, `getProductTrend` (Task 1); `readScope`, `scopeQuery` (`../scope`); `ScopeSelector`; `TrendLine`; `formatPesosOr`, `formatPercentOr`; `ValidationError`; `listBusinesses`, `listBranches`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the products page**

Create `src/app/(app)/portal/analytics/products/page.tsx`:

```tsx
import Link from "next/link";
import { ScopeSelector } from "@/components/app/scope-selector";
import { EmptyState } from "@/components/app/empty-state";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getSlowProducts, getTopProducts } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import type { SoldRow } from "@/lib/api/types";
import { readScope, scopeQuery } from "../scope";

/**
 * Misc (open-price) lines are excluded by the API, so these figures do not sum
 * to net sales. That is deliberate — an "Open item" row at the top of a
 * catalogue report answers nothing — and the note below says so on screen.
 */
function SoldTable({ rows, scope }: { rows: SoldRow[]; scope: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nothing sold in this period"
        body="Widen the date range, or check that this branch was trading."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Product</TH>
          <TH className="text-right">Units</TH>
          <TH className="text-right">Revenue</TH>
          <TH className="text-right">Gross profit</TH>
          <TH className="text-right">Margin</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((row) => (
          <TR key={`${row.productId}:${row.variantId ?? ""}`}>
            <TD>
              <Link
                href={`/portal/analytics/products/${row.productId}?${scope}`}
                className="font-medium text-brand-green-dark hover:underline"
              >
                {row.name}
              </Link>
            </TD>
            <TD className="text-right tabular-nums">{row.units}</TD>
            <TD className="text-right tabular-nums">
              {formatPesosOr(row.revenueC)}
            </TD>
            <TD className="text-right tabular-nums">
              {formatPesosOr(row.grossProfitC)}
            </TD>
            <TD className="text-right tabular-nums">
              {formatPercentOr(row.marginPct)}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    by?: "units" | "revenue";
  }>;
}) {
  const params = await searchParams;
  const scope = readScope(params);
  const by = params.by === "revenue" ? "revenue" : "units";

  const [businesses, branches] = await Promise.all([
    listBusinesses(),
    scope.businessId ? listBranches(scope.businessId) : Promise.resolve([]),
  ]);

  let top;
  let slow;
  try {
    [top, slow] = await Promise.all([
      getTopProducts(scope, { by }),
      getSlowProducts(scope),
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

  const query = scopeQuery(scope);

  return (
    <div className="space-y-6">
      <ScopeSelector businesses={businesses} branches={branches} scope={scope} />

      <Card>
        <CardHeader>
          <CardTitle>Top sellers</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex gap-3 text-sm">
            <Link
              href={`/portal/analytics/products?${scopeQuery(scope, { by: "units" })}`}
              className={
                by === "units"
                  ? "font-medium text-ink"
                  : "text-steel hover:underline"
              }
            >
              By units
            </Link>
            <Link
              href={`/portal/analytics/products?${scopeQuery(scope, { by: "revenue" })}`}
              className={
                by === "revenue"
                  ? "font-medium text-ink"
                  : "text-steel hover:underline"
              }
            >
              By revenue
            </Link>
          </div>
          <SoldTable rows={top.rows} scope={query} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By category</CardTitle>
        </CardHeader>
        <CardBody>
          {top.categories.length === 0 ? (
            <EmptyState title="No category sales" body="Nothing sold in this period." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Category</TH>
                  <TH className="text-right">Units</TH>
                  <TH className="text-right">Revenue</TH>
                </TR>
              </THead>
              <TBody>
                {top.categories.map((category) => (
                  <TR key={category.categoryId}>
                    <TD className="text-charcoal">{category.name}</TD>
                    <TD className="text-right tabular-nums">{category.units}</TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(category.revenueC)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slow movers</CardTitle>
        </CardHeader>
        <CardBody>
          <SoldTable rows={slow.bottom} scope={query} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sold nothing at all</CardTitle>
        </CardHeader>
        <CardBody>
          {slow.zeroSales.length === 0 ? (
            <EmptyState
              title="Everything sold"
              body="Every active product moved at least once in this period."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  <TH>Category</TH>
                </TR>
              </THead>
              <TBody>
                {slow.zeroSales.map((product) => (
                  <TR key={product.productId}>
                    <TD className="text-charcoal">{product.name}</TD>
                    <TD className="text-steel">{product.categoryName}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <p className="text-sm text-steel">
        Open-price (misc) lines are not products, so they are left out of these
        figures — which is why product revenue does not add up to net sales. They
        appear on the Leaks tab.
      </p>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "products-top" })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download CSV
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Write the per-product drill-down**

Create `src/app/(app)/portal/analytics/products/[productId]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendLine } from "@/components/charts/trend-line";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getProductTrend } from "@/lib/api/analytics";
import { NotFoundError } from "@/lib/api/errors";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import { readScope, scopeQuery } from "../../scope";

/**
 * One product over time. Variants are MERGED here, deliberately: the top-sellers
 * list splits them because a variant is what sells, but this view answers "how is
 * this product doing", which is a different question.
 */
export default async function ProductTrendPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    granularity?: "day" | "week" | "month";
  }>;
}) {
  const { productId } = await params;
  const query = await searchParams;
  const scope = readScope(query);
  const granularity = query.granularity ?? "day";

  let report;
  try {
    report = await getProductTrend(productId, scope, granularity);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/portal/analytics/products?${scopeQuery(scope)}`}
        className="text-sm text-steel hover:underline"
      >
        ← Products
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
        </CardHeader>
        <CardBody>
          <TrendLine
            title="Revenue for this product"
            points={report.buckets.map((bucket) => ({
              label: bucket.bucket,
              value: bucket.revenueC,
            }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By {granularity}</CardTitle>
        </CardHeader>
        <CardBody>
          <Table>
            <THead>
              <TR>
                <TH>Period</TH>
                <TH className="text-right">Units</TH>
                <TH className="text-right">Revenue</TH>
                <TH className="text-right">Gross profit</TH>
                <TH className="text-right">Margin</TH>
              </TR>
            </THead>
            <TBody>
              {report.buckets.map((bucket) => (
                <TR key={bucket.bucket}>
                  <TD className="text-charcoal">{bucket.bucket}</TD>
                  <TD className="text-right tabular-nums">{bucket.units}</TD>
                  <TD className="text-right tabular-nums">
                    {formatPesosOr(bucket.revenueC)}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {formatPesosOr(bucket.grossProfitC)}
                  </TD>
                  <TD className="text-right tabular-nums">
                    {formatPercentOr(bucket.marginPct)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
pnpm lint && pnpm build
```

Expected: clean. (Stop `pnpm dev` first.)

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/portal/analytics/products"
git commit -m "feat: products tab with top sellers, slow movers and a per-product trend"
```

---

## Task 3: Profit tab (§4)

Profit over time, by product and by category, with an honest statement of coverage.

**Files:**
- Create: `src/app/(app)/portal/analytics/profit/page.tsx`

**Interfaces:**
- Consumes: `getProfit` (Task 1); `readScope`, `scopeQuery`; `ScopeSelector`; `TrendLine`; `formatPesosOr`, `formatPercentOr`; `ValidationError`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the page**

Create `src/app/(app)/portal/analytics/profit/page.tsx`:

```tsx
import { ScopeSelector } from "@/components/app/scope-selector";
import { EmptyState } from "@/components/app/empty-state";
import { TrendLine } from "@/components/charts/trend-line";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getProfit } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import type { MarginFigures } from "@/lib/api/types";
import { readScope, scopeQuery } from "../scope";

/** The four money columns every margin table shares. */
function MarginCells({ row }: { row: MarginFigures }) {
  return (
    <>
      <TD className="text-right tabular-nums">{formatPesosOr(row.revenueC)}</TD>
      <TD className="text-right tabular-nums">{formatPesosOr(row.costC)}</TD>
      <TD className="text-right tabular-nums">
        {formatPesosOr(row.grossProfitC)}
      </TD>
      <TD className="text-right tabular-nums">
        {formatPercentOr(row.marginPct)}
      </TD>
    </>
  );
}

const MARGIN_HEADS = (
  <>
    <TH className="text-right">Revenue</TH>
    <TH className="text-right">Cost</TH>
    <TH className="text-right">Gross profit</TH>
    <TH className="text-right">Margin</TH>
  </>
);

export default async function ProfitPage({
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

  let report;
  try {
    report = await getProfit(scope, granularity);
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
          <CardTitle>Gross profit over time</CardTitle>
        </CardHeader>
        <CardBody>
          <TrendLine
            title="Gross profit"
            // A bucket with no costed line reports null; the chart needs a
            // number, and 0 is the honest plot for "nothing knowable earned".
            // The table beside it shows the null as an em dash.
            points={report.overTime.map((bucket) => ({
              label: bucket.bucket,
              value: bucket.grossProfitC ?? 0,
            }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By product</CardTitle>
        </CardHeader>
        <CardBody>
          {report.byProduct.length === 0 ? (
            <EmptyState
              title="Nothing sold in this period"
              body="Widen the date range, or check that this branch was trading."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Product</TH>
                  {MARGIN_HEADS}
                </TR>
              </THead>
              <TBody>
                {report.byProduct.map((row) => (
                  <TR key={`${row.productId}:${row.variantId ?? ""}`}>
                    <TD className="text-charcoal">{row.name}</TD>
                    <MarginCells row={row} />
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By category</CardTitle>
        </CardHeader>
        <CardBody>
          {report.byCategory.length === 0 ? (
            <EmptyState title="No category sales" body="Nothing sold in this period." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Category</TH>
                  {MARGIN_HEADS}
                </TR>
              </THead>
              <TBody>
                {report.byCategory.map((row) => (
                  <TR key={row.categoryId}>
                    <TD className="text-charcoal">{row.name}</TD>
                    <MarginCells row={row} />
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <p className="text-sm text-steel">
        Profit covers {formatPesosOr(report.costedRevenueC)} of sales;{" "}
        {formatPesosOr(report.uncostedRevenueC)} has no cost recorded, so its
        margin is unknown rather than zero.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
pnpm lint && pnpm build
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/portal/analytics/profit"
git commit -m "feat: profit tab over time, by product and by category"
```

---

## Task 4: Leaks tab (§4)

Where money goes that is not cost.

**Files:**
- Create: `src/app/(app)/portal/analytics/leaks/page.tsx`

**Interfaces:**
- Consumes: `getLeaks` (Task 1); `readScope`, `scopeQuery`; `ScopeSelector`; `BarRow`; `formatPesosOr`, `formatPercentOr`; `formatManilaDateTime`; `ValidationError`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the page**

Create `src/app/(app)/portal/analytics/leaks/page.tsx`:

```tsx
import { ScopeSelector } from "@/components/app/scope-selector";
import { EmptyState } from "@/components/app/empty-state";
import { BarRow } from "@/components/charts/bar-row";
import { KpiCard } from "@/components/app/kpi-card";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getLeaks } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatManilaDateTime } from "@/lib/format";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import type { StatusBucket } from "@/lib/api/types";
import { readScope } from "../scope";

function ReasonTable({ bucket, noun }: { bucket: StatusBucket; noun: string }) {
  if (bucket.reasons.length === 0) {
    return <EmptyState title={`No ${noun}`} body={`Nothing was ${noun} in this period.`} />;
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Reason</TH>
          <TH className="text-right">Count</TH>
          <TH className="text-right">Value</TH>
        </TR>
      </THead>
      <TBody>
        {bucket.reasons.map((reason) => (
          <TR key={reason.reason}>
            <TD className="text-charcoal">{reason.reason}</TD>
            <TD className="text-right tabular-nums">{reason.count}</TD>
            <TD className="text-right tabular-nums">
              {formatPesosOr(reason.valueC)}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export default async function LeaksPage({
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
    report = await getLeaks(scope);
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Order-level discounts"
          value={formatPesosOr(report.orderLevelDiscountC)}
          hint="Given on the whole order, not a line"
        />
        <KpiCard
          title="SC/PWD discounts"
          value={formatPesosOr(report.scPwd.discountC)}
          hint={`${report.scPwd.saleCount} sale${report.scPwd.saleCount === 1 ? "" : "s"} · ${formatPesosOr(report.scPwd.vatExemptSalesC)} VAT-exempt`}
        />
        <KpiCard
          title="Misc rings"
          value={formatPesosOr(report.miscLines.revenueC)}
          hint={`${formatPercentOr(report.miscLines.pctOfNetSales)} of net sales`}
        />
        <KpiCard
          title="Voids / refunds"
          value={`${report.voids.count} / ${report.refunds.count}`}
          hint={`${formatPesosOr(report.voids.valueC)} / ${formatPesosOr(report.refunds.valueC)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discounts by name</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {report.discountsByName.length === 0 ? (
            <EmptyState
              title="No named discounts used"
              body="Nothing on the discount list was applied in this period."
            />
          ) : (
            <>
              <BarRow
                title="Discount cost by name"
                rows={report.discountsByName.map((discount) => ({
                  label: discount.name,
                  value: discount.amountC,
                }))}
              />
              <Table>
                <THead>
                  <TR>
                    <TH>Discount</TH>
                    <TH>Kind</TH>
                    <TH className="text-right">Times used</TH>
                    <TH className="text-right">Amount</TH>
                  </TR>
                </THead>
                <TBody>
                  {report.discountsByName.map((discount) => (
                    <TR key={discount.discountId}>
                      <TD className="text-charcoal">{discount.name}</TD>
                      <TD className="text-steel">{discount.kind}</TD>
                      <TD className="text-right tabular-nums">
                        {discount.timesUsed}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {formatPesosOr(discount.amountC)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Voids by reason</CardTitle>
          </CardHeader>
          <CardBody>
            <ReasonTable bucket={report.voids} noun="voided" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refunds by reason</CardTitle>
          </CardHeader>
          <CardBody>
            <ReasonTable bucket={report.refunds} noun="refunded" />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drawer over / short</CardTitle>
        </CardHeader>
        <CardBody>
          {report.overShort.length === 0 ? (
            <EmptyState
              title="No shifts closed"
              body="Over/short appears once a shift has been counted and closed."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Branch</TH>
                  <TH>Closed</TH>
                  <TH className="text-right">Expected</TH>
                  <TH className="text-right">Counted</TH>
                  <TH className="text-right">Variance</TH>
                </TR>
              </THead>
              <TBody>
                {report.overShort.map((shift) => (
                  <TR key={shift.shiftId}>
                    <TD className="text-charcoal">{shift.branchName}</TD>
                    <TD className="text-steel">
                      {formatManilaDateTime(shift.closedAt)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(shift.expectedCashC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(shift.closingCashC)}
                    </TD>
                    <TD
                      className={
                        shift.varianceC !== null && shift.varianceC < 0
                          ? "text-right tabular-nums text-danger"
                          : "text-right tabular-nums"
                      }
                    >
                      {formatPesosOr(shift.varianceC)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
pnpm lint && pnpm build
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/portal/analytics/leaks"
git commit -m "feat: leaks tab for discounts, misc rings, voids, refunds and drawer variance"
```

---

## Task 5: Inventory tab (§5)

The movement ledger, shrinkage by reason, and stock on hand with a runway.

**Files:**
- Create: `src/app/(app)/portal/analytics/inventory/page.tsx`

**Interfaces:**
- Consumes: `getInventoryMovements`, `getShrinkage`, `getOnHand` (Task 1); `readScope`, `scopeQuery`; `ScopeSelector`; `Pagination` (`src/components/app/pagination.tsx`, props `{ page, totalPages, baseHref, query }`); `Badge`; `formatPesosOr`; `formatManilaDateTime`; `ValidationError`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the page**

Create `src/app/(app)/portal/analytics/inventory/page.tsx`:

```tsx
import { ScopeSelector } from "@/components/app/scope-selector";
import { EmptyState } from "@/components/app/empty-state";
import { Pagination } from "@/components/app/pagination";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  getInventoryMovements,
  getOnHand,
  getShrinkage,
} from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatManilaDateTime } from "@/lib/format";
import { formatPesosOr } from "@/lib/money";
import { readScope, scopeQuery } from "../scope";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    businessId?: string;
    branchId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const scope = readScope(params);
  const page = Number(params.page ?? "1");

  const [businesses, branches] = await Promise.all([
    listBusinesses(),
    scope.businessId ? listBranches(scope.businessId) : Promise.resolve([]),
  ]);

  let movements;
  let shrinkage;
  let onHand;
  try {
    [movements, shrinkage, onHand] = await Promise.all([
      getInventoryMovements(scope, { page }),
      getShrinkage(scope),
      getOnHand(scope),
    ]);
  } catch (error) {
    // The API refuses page x pageSize > 2000 with a 422 that already says to
    // narrow the scope; show its own words rather than inventing new ones.
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
          <CardTitle>Stock on hand</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {onHand.rows.length === 0 ? (
            <EmptyState
              title="No stock recorded"
              body="Receive stock against a branch to start counting it here."
            />
          ) : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Branch</TH>
                    <TH>Item</TH>
                    <TH className="text-right">Quantity</TH>
                    <TH className="text-right">Unit cost</TH>
                    <TH className="text-right">Value</TH>
                    <TH className="text-right">Days of stock</TH>
                  </TR>
                </THead>
                <TBody>
                  {onHand.rows.map((row) => (
                    <TR key={`${row.branchId}:${row.productId}:${row.variantId ?? ""}`}>
                      <TD className="text-steel">{row.branchName}</TD>
                      <TD className="text-charcoal">
                        {row.name}
                        {row.isLow ? (
                          <Badge tone="warn" className="ml-2">
                            low
                          </Badge>
                        ) : null}
                      </TD>
                      <TD className="text-right tabular-nums">{row.qty}</TD>
                      <TD className="text-right tabular-nums">
                        {formatPesosOr(row.unitCostC)}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {formatPesosOr(row.valueC)}
                      </TD>
                      <TD className="text-right tabular-nums">
                        {/* Null means it never sold in this range — an unbounded
                            runway, which is not a number worth printing. */}
                        {row.daysOfStock === null
                          ? "—"
                          : row.daysOfStock.toFixed(1)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <p className="text-sm text-steel">
                Total value {formatPesosOr(onHand.totals.valueC)} ·{" "}
                {onHand.totals.uncostedItems} item
                {onHand.totals.uncostedItems === 1 ? "" : "s"} with no cost
                recorded, so their value is unknown rather than zero.
              </p>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shrinkage by reason</CardTitle>
        </CardHeader>
        <CardBody>
          {shrinkage.rows.length === 0 ? (
            <EmptyState
              title="No losses recorded"
              body="Only negative stock adjustments count as shrinkage."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Reason</TH>
                  <TH className="text-right">Units lost</TH>
                  <TH className="text-right">Value at cost</TH>
                  <TH className="text-right">Uncosted units</TH>
                </TR>
              </THead>
              <TBody>
                {shrinkage.rows.map((row) => (
                  <TR key={row.reasonCategory}>
                    <TD className="text-charcoal">{row.reasonCategory}</TD>
                    <TD className="text-right tabular-nums">{row.units}</TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.valueC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {row.uncostedUnits}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movement ledger</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {movements.data.length === 0 ? (
            <EmptyState
              title="No stock movements"
              body="Receiving, adjusting and selling all leave a row here."
            />
          ) : (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>When</TH>
                    <TH>Branch</TH>
                    <TH>Item</TH>
                    <TH>Type</TH>
                    <TH className="text-right">Change</TH>
                    <TH>Reason</TH>
                    <TH>Who</TH>
                  </TR>
                </THead>
                <TBody>
                  {movements.data.map((movement) => (
                    <TR key={movement.id}>
                      <TD className="text-steel">
                        {formatManilaDateTime(movement.createdAt)}
                      </TD>
                      <TD className="text-steel">{movement.branchName}</TD>
                      <TD className="text-charcoal">
                        {movement.variantName
                          ? `${movement.productName} — ${movement.variantName}`
                          : movement.productName}
                      </TD>
                      <TD className="text-steel">{movement.type}</TD>
                      <TD className="text-right tabular-nums">
                        {movement.qtyDelta > 0
                          ? `+${movement.qtyDelta}`
                          : movement.qtyDelta}
                      </TD>
                      <TD className="text-steel">
                        {movement.reasonCategory ?? movement.note ?? "—"}
                      </TD>
                      {/* Null when no audit row matches — reported as unknown
                          rather than attributed to nobody in particular. */}
                      <TD className="text-steel">
                        {movement.actor?.actorType ?? "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination
                page={movements.page}
                totalPages={movements.totalPages}
                baseHref="/portal/analytics/inventory"
                query={{
                  from: scope.from,
                  to: scope.to,
                  businessId: scope.businessId,
                  branchId: scope.branchId,
                }}
              />
            </>
          )}
        </CardBody>
      </Card>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "inventory-on-hand" })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download stock-on-hand CSV
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
pnpm lint && pnpm build
```

Expected: clean. The `inventory-on-hand` CSV key this page links to was
registered in Task 1.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/portal/analytics/inventory"
git commit -m "feat: inventory tab with stock on hand, shrinkage and the movement ledger"
```

---

## Task 6: Tax tab (§6)

The accountant's view: one period, one table, one CSV.

**Files:**
- Create: `src/app/(app)/portal/analytics/tax/page.tsx`

**Interfaces:**
- Consumes: `getTax` (Task 1); `readScope`, `scopeQuery`; `ScopeSelector`; `formatPesosOr`, `formatPercentOr`; `ValidationError`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the page**

Create `src/app/(app)/portal/analytics/tax/page.tsx`:

```tsx
import { ScopeSelector } from "@/components/app/scope-selector";
import { EmptyState } from "@/components/app/empty-state";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getTax } from "@/lib/api/analytics";
import { ValidationError } from "@/lib/api/errors";
import { listBranches, listBusinesses } from "@/lib/api/portal";
import { formatPercentOr, formatPesosOr } from "@/lib/money";
import { readScope, scopeQuery } from "../scope";

/**
 * §6 Tax summary.
 *
 * A row per business, never a blended one: two businesses on different tax rates
 * have no shared rate, so the totals row sums the AMOUNTS and leaves the rate
 * column empty rather than averaging into a number that is true of neither.
 */
export default async function TaxPage({
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
    report = await getTax(scope);
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
          <CardTitle>
            VAT summary · {report.from} to {report.to}
          </CardTitle>
        </CardHeader>
        <CardBody>
          {report.businesses.length === 0 ? (
            <EmptyState
              title="Nothing to report"
              body="No completed sales fall in this period."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Business</TH>
                  <TH className="text-right">Tax rate</TH>
                  <TH className="text-right">VATable sales</TH>
                  <TH className="text-right">VAT</TH>
                  <TH className="text-right">VAT-exempt sales</TH>
                  <TH className="text-right">SC/PWD discounts</TH>
                  <TH className="text-right">Service charge</TH>
                </TR>
              </THead>
              <TBody>
                {report.businesses.map((row) => (
                  <TR key={row.businessId}>
                    <TD className="text-charcoal">{row.name}</TD>
                    <TD className="text-right tabular-nums">
                      {formatPercentOr(row.taxRate)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.vatableSalesC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.vatC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.vatExemptSalesC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.scPwdDiscountC)}
                    </TD>
                    <TD className="text-right tabular-nums">
                      {formatPesosOr(row.serviceChargeC)}
                    </TD>
                  </TR>
                ))}
                <TR>
                  <TD className="font-medium text-ink">Total</TD>
                  {/* No blended rate: the total row sums amounts only. */}
                  <TD className="text-right text-steel">—</TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.vatableSalesC)}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.vatC)}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.vatExemptSalesC)}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.scPwdDiscountC)}
                  </TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatPesosOr(report.totals.serviceChargeC)}
                  </TD>
                </TR>
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <a
        href={`/portal/analytics/export?${scopeQuery(scope, { report: "tax" })}`}
        className="inline-block text-sm text-brand-green-dark hover:underline"
      >
        Download CSV
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
pnpm lint && pnpm build
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/portal/analytics/tax"
git commit -m "feat: tax summary tab reported per business with no blended rate"
```

---

## Task 7: Register the tabs and extend the live pass

Until this task the four new pages exist but nothing links to them.

**Files:**
- Modify: `src/app/(app)/portal/analytics/scope.ts`
- Modify: `src/test/integration/live-analytics.test.ts`

**Interfaces:**
- Consumes: every route from Tasks 2–6.
- Produces: nothing.

- [ ] **Step 1: Add the tabs**

Replace `ANALYTICS_TABS` in `src/app/(app)/portal/analytics/scope.ts`:

```ts
export const ANALYTICS_TABS = [
  { href: "/portal/analytics/overview", label: "Overview" },
  { href: "/portal/analytics/sales", label: "Sales" },
  { href: "/portal/analytics/products", label: "Products" },
  { href: "/portal/analytics/profit", label: "Profit" },
  { href: "/portal/analytics/leaks", label: "Leaks" },
  { href: "/portal/analytics/inventory", label: "Inventory" },
  { href: "/portal/analytics/tax", label: "Tax" },
];
```

- [ ] **Step 2: Add the routes to the live pass**

Extend `ROUTES` in `src/test/integration/live-analytics.test.ts`:

```ts
const ROUTES = [
  "/portal",
  "/portal/businesses",
  "/portal/analytics/overview",
  "/portal/analytics/sales",
  "/portal/analytics/products",
  "/portal/analytics/profit",
  "/portal/analytics/leaks",
  "/portal/analytics/inventory",
  "/portal/analytics/tax",
  "/portal/analytics/overview?from=2026-03-01&to=2026-03-07",
  "/portal/analytics/sales?from=2026-03-01&to=2026-03-07&granularity=week",
  "/portal/analytics/products?from=2026-03-01&to=2026-03-07&by=revenue",
  "/portal/analytics/inventory?from=2026-03-01&to=2026-03-07&page=1",
];
```

and add a case for the paging bound, which is the one error path a user can
reach through the UI:

```ts
  it("shows the API's own message when paged past the merge bound", async () => {
    const { status, html } = await page(
      "/portal/analytics/inventory?from=2026-03-01&to=2026-03-07&page=999",
    );
    expect(status).toBe(200);
    expect(html).toContain("narrow the date range");
  });
```

- [ ] **Step 3: Run everything**

```bash
pnpm test && pnpm lint && pnpm build
```

Expected: all clean. Then, with the API on :4000 and the portal on :3100:

```bash
PORTAL_E2E_API_URL=http://localhost:4000/v1 \
PORTAL_E2E_OWNER_EMAIL=maria@kapediaria.ph \
PORTAL_E2E_OWNER_PASSWORD=sentry-demo \
pnpm test:integration
```

Expected: PASS. A 500 on any tab is a real render-time fault — read the dev
server output, which names the offending module. That is the whole reason this
suite exists; `pnpm build` cannot see it.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/portal/analytics/scope.ts" src/test/integration/live-analytics.test.ts
git commit -m "feat: link the product, profit, leaks, inventory and tax tabs"
```

---

## Self-review notes

**Spec coverage.** §3 top/slow/category and the per-product trend → Task 2. §4
profit → Task 3, leaks → Task 4. §5 movements, shrinkage, on-hand → Task 5. §6
tax → Task 6. Tab registration and the live pass → Task 7. Expiring-soon,
stock-take history and transfer history remain out of scope on both sides,
because no endpoint serves them.

**Three decisions a reviewer should check.**
1. The profit chart plots `grossProfitC ?? 0`. A null bucket cannot be drawn, and
   0 is the honest plot for "nothing knowable was earned"; the table beside it
   still shows the em dash, so the null is never hidden.
2. The products tab states on screen that misc lines are excluded, because
   otherwise the sums look wrong against the overview and someone will chase it.
3. Movement paging is capped by the API at `page × pageSize > 2000`. The page
   surfaces the API's own message rather than rewriting it.

**Interface consistency.** Every page imports `readScope`/`scopeQuery` from
`../scope` (or `../../scope` for the drill-down) — never from a layout or a
client module. `formatPesosOr`/`formatPercentOr` are the only money and ratio
formatters used. `MarginFigures` (Task 1) is shared by `ProductMarginRow` and
`CategoryMarginRow` and consumed by Task 3's `MarginCells`.

**Task order is a dependency order.** 1 → 2, 3, 4, 5, 6 → 7. Task 1 registers the CSV allowlist keys every later tab links to, so no download link is ever written before the key it needs exists.

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-08-portal-analytics-tabs.md`. Two execution options:

**1. Subagent-Driven (recommended)** — a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.
