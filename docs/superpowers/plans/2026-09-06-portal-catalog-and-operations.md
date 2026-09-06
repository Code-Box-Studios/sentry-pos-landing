# Portal Catalog & Operations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a business owner everything the API already supports — catalog, discounts, settings, branches, stock, terminals and their activity log — on top of the auth foundation built in the previous plan.

**Architecture:** New routes under the existing `(app)/portal` route group. Every read is a Server Component calling the server-only `PortalApi` module through `apiFetch()`; every write is a Server Action. The business id lives in the URL (`/portal/businesses/:businessId/…`), so a page is a complete address.

**Tech Stack:** Next.js 15.5 (App Router, React 19), TypeScript strict, Tailwind v4, the `src/components/ui/` primitives, Vitest + Testing Library, pnpm.

**Spec:** [`docs/superpowers/specs/2026-09-06-bo-portal-platform-admin-design.md`](../specs/2026-09-06-bo-portal-platform-admin-design.md)
**Predecessor:** [`2026-09-06-portal-foundation-and-admin.md`](2026-09-06-portal-foundation-and-admin.md) — auth, shell, error taxonomy, primitives. All of it is built and on `main`.

## Global Constraints

Everything from the predecessor plan still applies. Repeated here because it is load-bearing:

- **Package manager is pnpm**; dev server on **3100**; backend on **4000**.
- **`API_URL` is server-only** — never `NEXT_PUBLIC_`.
- **Every module under `src/lib/api/` starts with `import "server-only";`.**
- **The error envelope is `{ code, message, ...extra, requestId }` — no `statusCode`.** Branch on `code`.
- **Validation errors arrive as one `"; "`-joined string.** `ValidationError.forFields()` splits them.
- **A `"use server"` module may export only async functions.** Types are fine (erased); values are not.
- **Refresh is middleware's job alone.** Never call `/auth/refresh` from anywhere else.
- **Do not run `git push`.** Commit only.
- **Do not add Claude/AI attribution or `Co-Authored-By` trailers to commits.**
- **Do not modify `src/app/(frontend)/`, `src/app/(payload)/`, `src/collections/`, or `src/payload.config.ts`.**

New constraints for this plan:

- **All money is integer centavos** across the wire. Fields carrying it end in `C` (`priceC`, `costC`, `unitCostC`, `priceDeltaC`). Users type pesos; conversion happens at the form boundary and nowhere else.
- **`soldBy` is `"unit" | "weight"`** — the API's spelling. Not `each`.
- **Quantities allow at most 3 decimal places** (`@IsNumber({ maxDecimalPlaces: 3 })`). A 4-decimal quantity is a 422.
- **Variants and modifiers use replace-set semantics.** `PATCH` with a `variants` array replaces the whole list: entries with an `id` update, entries without create, and anything absent is soft-deleted. **Omitting the key entirely leaves them untouched** — that difference is the whole contract, and sending `variants: []` wipes them.
- **A branch `code` is 2–6 uppercase letters or digits** and appears in every receipt number that branch issues. Treat it as immutable in the UI after creation even though the API permits a PATCH.
- **The refund PIN is exactly 6 digits.**
- **Discounts have no scheduled window** — only an `active` boolean. Do not build a date picker for them.

## A note on how this plan is written

Tasks 1–7 give every file in full. From Task 8 onward, screens that are a **mechanical repeat
of a pattern already written out in full** — a list page in the shape of Task 4's categories
page, a form in the shape of Task 6's — are specified by their exact field names, copy,
validation rules and test cases rather than repeated verbatim. Every Server Action, every
piece of conversion logic and every non-obvious component is still given as literal code,
because those are where the bugs live.

If a described screen is ambiguous when you reach it, build it in the shape of the nearest
fully-written one and say so in the task's report — do not invent a new pattern.

## File Structure

| File | Responsibility |
| --- | --- |
| `src/lib/money.ts` | pesos ⇄ integer centavos, and peso formatting |
| `src/lib/api/types.ts` (extend) | Category, Product, Variant, ModifierGroup, Modifier, Discount, StockLevel, Terminal |
| `src/lib/api/portal.ts` | every tenant endpoint, grouped by resource |
| `src/components/app/business-switcher.tsx` | moves between businesses, keeping the current section |
| `src/components/app/confirm-delete.tsx` | the two-step delete used by every destructive list action |
| `src/app/(app)/portal/page.tsx` | business list |
| `src/app/(app)/portal/businesses/[businessId]/layout.tsx` | business-scoped shell + nav |
| `.../catalog/*` | products list, editor, delete |
| `.../categories/*`, `.../modifiers/*`, `.../discounts/*` | list + editor per resource |
| `.../branches/*`, `.../branches/[branchId]/stock/*` | branches, stock levels, receive, adjust |
| `.../terminals/*`, `.../activity/*` | terminal list + unpair, audit log |
| `.../settings/*` | business settings; `/portal/settings` for the owner-wide refund PIN |

---

### Task 1: Money conversion

Every price in this plan passes through here. It goes first because a rounding bug in it is invisible everywhere else.

**Files:**
- Create: `src/lib/money.ts`
- Test: `src/lib/money.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `pesosToCentavos(input: string): number | null` — null when unparseable
  - `centavosToPesos(centavosC: number): string` — always 2 decimal places, for a form value
  - `formatPesos(centavosC: number): string` — display, with the ₱ sign and thousands separators
  - `parseQuantity(input: string): number | null` — null when unparseable or over 3 decimals

- [ ] **Step 1: Write the failing test — `src/lib/money.test.ts`**

```ts
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
});

describe("centavosToPesos", () => {
  it("always gives two decimals, so a form value never looks half-filled", () => {
    expect(centavosToPesos(12000)).toBe("120.00");
    expect(centavosToPesos(5)).toBe("0.05");
    expect(centavosToPesos(0)).toBe("0.00");
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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/money.test.ts`
Expected: FAIL — cannot resolve `./money`.

- [ ] **Step 3: Create `src/lib/money.ts`**

```ts
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

  const whole = match[1] === "" ? "0" : match[1];
  const fraction = match[2] ?? "";
  if (whole === "0" && fraction === "" && cleaned !== "0") return null;

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
  if ((match[2]?.length ?? 0) > 3) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS. If `formatPesos` renders `PHP 1,250.00` rather than `₱1,250.00` on this
runtime's ICU build, fix the **test** to the actual output — the behaviour under test is the
grouping and the two decimals, not the glyph.

- [ ] **Step 5: Commit**

```bash
git add src/lib/money.ts src/lib/money.test.ts
git commit -m "feat: convert pesos to integer centavos without float arithmetic"
```

---

### Task 2: Portal types and API module

Every later task consumes this. No screens yet.

**Files:**
- Modify: `src/lib/api/types.ts`
- Create: `src/lib/api/portal.ts`

**Interfaces:**
- Consumes: `apiFetch` from `./fetch`
- Produces, in `types.ts`:
  - `interface Category { id, createdAt, updatedAt, deletedAt, businessId, name, sortOrder }`
  - `type SoldBy = "unit" | "weight"`
  - `interface Variant { id, productId, name, sku: string|null, barcode: string|null, priceC, costC: number|null }`
  - `interface Product { id, businessId, categoryId, name, sku, barcode, priceC, costC, soldBy, lowStockThreshold: number|null, imagePath: string|null, trackStock, trackExpiry, active, createdAt, updatedAt, deletedAt, variants: Variant[] }`
  - `interface Modifier { id, groupId, name, priceDeltaC }`
  - `interface ModifierGroup { id, businessId, name, minSelect, maxSelect, createdAt, updatedAt, deletedAt, modifiers: Modifier[] }`
  - `type DiscountKind = "percent" | "fixed"`, `type DiscountAppliesTo = "line" | "order" | "both"`
  - `interface Discount { id, businessId, name, kind, value, appliesTo, active, createdAt, updatedAt, deletedAt }`
  - `interface StockLevel { productId, productName, variantId: string|null, variantName: string|null, qty }`
  - `interface Terminal { id, branchId, name, code, pairedAt, lastSeenAt: string|null, paired }`
  - `interface StockMovement { id, productId, variantId: string|null, type, qtyDelta, unitCostC: number|null, refId }`
- Produces, in `portal.ts` — all `Promise`-returning:
  - `listBusinesses()`, `getBusiness(id)`, `createBusiness(input)`, `updateBusiness(id, input)`, `deleteBusiness(id)`
  - `listCategories(businessId)`, `createCategory(businessId, input)`, `updateCategory(id, input)`, `deleteCategory(id)`
  - `listProducts(businessId)`, `getProduct(id)`, `createProduct(businessId, input)`, `updateProduct(id, input)`, `deleteProduct(id)`
  - `listModifierGroups(businessId)`, `createModifierGroup(businessId, input)`, `updateModifierGroup(id, input)`, `deleteModifierGroup(id)`, `setProductModifierGroups(productId, groupIds)`
  - `listDiscounts(businessId)`, `createDiscount(businessId, input)`, `updateDiscount(id, input)`, `deleteDiscount(id)`
  - `setRefundPin(pin)`
  - `listBranches(businessId)`, `getBranch(id)`, `createBranch(businessId, input)`, `updateBranch(id, input)`, `deleteBranch(id)`
  - `getStock(branchId)`, `receiveStock(branchId, lines)`, `adjustStock(branchId, input)`
  - `listTerminals(businessId)`, `unpairTerminal(id)`
  - `listActivity(businessId, query)`

- [ ] **Step 1: Append to `src/lib/api/types.ts`**

```ts

export interface Category {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  businessId: string;
  name: string;
  sortOrder: number;
}

/** The API's spelling. Not "each" — the POS terminal's own vocabulary differs. */
export type SoldBy = "unit" | "weight";

export interface Variant {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  priceC: number;
  costC: number | null;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  priceC: number;
  costC: number | null;
  soldBy: SoldBy;
  lowStockThreshold: number | null;
  imagePath: string | null;
  trackStock: boolean;
  trackExpiry: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  variants: Variant[];
}

export interface Modifier {
  id: string;
  groupId: string;
  name: string;
  priceDeltaC: number;
}

export interface ModifierGroup {
  id: string;
  businessId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  modifiers: Modifier[];
}

export type DiscountKind = "percent" | "fixed";
export type DiscountAppliesTo = "line" | "order" | "both";

export interface Discount {
  id: string;
  businessId: string;
  name: string;
  kind: DiscountKind;
  /** 1–100 when kind is "percent"; centavos when kind is "fixed". */
  value: number;
  appliesTo: DiscountAppliesTo;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface StockLevel {
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  qty: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId: string | null;
  type: string;
  qtyDelta: number;
  unitCostC: number | null;
  refId: string;
}

export interface Terminal {
  id: string;
  branchId: string;
  name: string;
  code: string;
  pairedAt: string;
  lastSeenAt: string | null;
  /** False once remotely unpaired — the device 401s on its next request. */
  paired: boolean;
}
```

- [ ] **Step 2: Create `src/lib/api/portal.ts`**

```ts
import "server-only";
import { apiFetch } from "./fetch";
import type {
  ActorType,
  AuditEntry,
  Branch,
  Business,
  BusinessType,
  Category,
  Discount,
  DiscountAppliesTo,
  DiscountKind,
  ModifierGroup,
  Paginated,
  Product,
  SoldBy,
  StockLevel,
  StockMovement,
  Terminal,
} from "./types";

/**
 * Every tenant endpoint, behind `PortalAuthGuard` on the API. Scoping is the server's job:
 * the guard pins the request to the signed-in owner, so passing a businessId that is not
 * theirs is a 404, never a leak.
 *
 * Replace-set semantics run through this file. `variants`, `modifiers` and `groupIds` are
 * each a FULL desired list: present → replace, absent → leave alone, `[]` → clear. Sending
 * `variants: []` on a product that has variants deletes them, so build these payloads
 * deliberately rather than spreading a partial object into them.
 */

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------

export function listBusinesses(): Promise<Business[]> {
  return apiFetch<Business[]>("/portal/businesses");
}

export function getBusiness(id: string): Promise<Business> {
  return apiFetch<Business>(`/portal/businesses/${id}`);
}

export interface BusinessInput {
  name: string;
  type: BusinessType;
  /** A fraction in [0, 0.9999], not a percentage: 12% VAT is 0.12. */
  taxRate: number;
  serviceChargeRate?: number;
  /** "HH:mm", 24-hour. */
  dayStartTime?: string;
  allowMiscItems?: boolean;
  expiryWarningDays?: number;
  receiptHeader?: string;
  receiptFooter?: string;
}

export function createBusiness(input: BusinessInput): Promise<Business> {
  return apiFetch<Business>("/portal/businesses", { method: "POST", body: input });
}

export function updateBusiness(id: string, input: Partial<BusinessInput>): Promise<Business> {
  return apiFetch<Business>(`/portal/businesses/${id}`, { method: "PATCH", body: input });
}

export function deleteBusiness(id: string): Promise<Business> {
  return apiFetch<Business>(`/portal/businesses/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function listCategories(businessId: string): Promise<Category[]> {
  return apiFetch<Category[]>(`/portal/businesses/${businessId}/categories`);
}

export interface CategoryInput {
  name: string;
  sortOrder?: number;
}

export function createCategory(businessId: string, input: CategoryInput): Promise<Category> {
  return apiFetch<Category>(`/portal/businesses/${businessId}/categories`, {
    method: "POST",
    body: input,
  });
}

export function updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
  return apiFetch<Category>(`/portal/categories/${id}`, { method: "PATCH", body: input });
}

export function deleteCategory(id: string): Promise<Category> {
  return apiFetch<Category>(`/portal/categories/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface VariantInput {
  /** Present → update that variant. Absent → create a new one. */
  id?: string;
  name: string;
  sku?: string;
  barcode?: string;
  priceC: number;
  costC?: number;
}

export interface ProductInput {
  categoryId: string;
  name: string;
  sku?: string;
  barcode?: string;
  priceC: number;
  costC?: number;
  soldBy?: SoldBy;
  lowStockThreshold?: number;
  trackStock?: boolean;
  trackExpiry?: boolean;
  active?: boolean;
  imagePath?: string;
  /** Replace-set. Omit the key to leave existing variants untouched. */
  variants?: VariantInput[];
}

export function listProducts(businessId: string): Promise<Product[]> {
  return apiFetch<Product[]>(`/portal/businesses/${businessId}/products`);
}

export function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/portal/products/${id}`);
}

export function createProduct(businessId: string, input: ProductInput): Promise<Product> {
  return apiFetch<Product>(`/portal/businesses/${businessId}/products`, {
    method: "POST",
    body: input,
  });
}

export function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  return apiFetch<Product>(`/portal/products/${id}`, { method: "PATCH", body: input });
}

export function deleteProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/portal/products/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Modifier groups
// ---------------------------------------------------------------------------

export interface ModifierInput {
  id?: string;
  name: string;
  /** Centavos; negative for a price-reducing modifier. */
  priceDeltaC: number;
}

export interface ModifierGroupInput {
  name: string;
  minSelect?: number;
  maxSelect?: number;
  /** Replace-set, same rules as variants. */
  modifiers?: ModifierInput[];
}

export function listModifierGroups(businessId: string): Promise<ModifierGroup[]> {
  return apiFetch<ModifierGroup[]>(`/portal/businesses/${businessId}/modifier-groups`);
}

export function createModifierGroup(
  businessId: string,
  input: ModifierGroupInput,
): Promise<ModifierGroup> {
  return apiFetch<ModifierGroup>(`/portal/businesses/${businessId}/modifier-groups`, {
    method: "POST",
    body: input,
  });
}

export function updateModifierGroup(
  id: string,
  input: Partial<ModifierGroupInput>,
): Promise<ModifierGroup> {
  return apiFetch<ModifierGroup>(`/portal/modifier-groups/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteModifierGroup(id: string): Promise<ModifierGroup> {
  return apiFetch<ModifierGroup>(`/portal/modifier-groups/${id}`, { method: "DELETE" });
}

/** PUT, not PATCH: `groupIds` is the complete set of links. `[]` clears them all. */
export function setProductModifierGroups(productId: string, groupIds: string[]): Promise<unknown> {
  return apiFetch(`/portal/products/${productId}/modifier-groups`, {
    method: "PUT",
    body: { groupIds },
  });
}

// ---------------------------------------------------------------------------
// Discounts
// ---------------------------------------------------------------------------

export interface DiscountInput {
  name: string;
  kind: DiscountKind;
  /** 1–100 for "percent"; centavos for "fixed". */
  value: number;
  appliesTo: DiscountAppliesTo;
  active?: boolean;
}

export function listDiscounts(businessId: string): Promise<Discount[]> {
  return apiFetch<Discount[]>(`/portal/businesses/${businessId}/discounts`);
}

export function createDiscount(businessId: string, input: DiscountInput): Promise<Discount> {
  return apiFetch<Discount>(`/portal/businesses/${businessId}/discounts`, {
    method: "POST",
    body: input,
  });
}

export function updateDiscount(id: string, input: Partial<DiscountInput>): Promise<Discount> {
  return apiFetch<Discount>(`/portal/discounts/${id}`, { method: "PATCH", body: input });
}

export function deleteDiscount(id: string): Promise<Discount> {
  return apiFetch<Discount>(`/portal/discounts/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Owner-wide, not per business. Exactly 6 digits. */
export function setRefundPin(pin: string): Promise<unknown> {
  return apiFetch("/portal/refund-pin", { method: "PUT", body: { pin } });
}

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export interface BranchInput {
  name: string;
  /** 2–6 uppercase letters or digits. Part of every receipt number this branch issues. */
  code: string;
  address: string;
}

export function listBranches(businessId: string): Promise<Branch[]> {
  return apiFetch<Branch[]>(`/portal/businesses/${businessId}/branches`);
}

export function getBranch(id: string): Promise<Branch> {
  return apiFetch<Branch>(`/portal/branches/${id}`);
}

export function createBranch(businessId: string, input: BranchInput): Promise<Branch> {
  return apiFetch<Branch>(`/portal/businesses/${businessId}/branches`, {
    method: "POST",
    body: input,
  });
}

export function updateBranch(id: string, input: Partial<BranchInput>): Promise<Branch> {
  return apiFetch<Branch>(`/portal/branches/${id}`, { method: "PATCH", body: input });
}

export function deleteBranch(id: string): Promise<Branch> {
  return apiFetch<Branch>(`/portal/branches/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export interface ReceiveLine {
  productId: string;
  variantId?: string;
  /** Positive, at most 3 decimal places. */
  qty: number;
  /** Overwrites the product or variant cost when given. */
  unitCostC?: number;
  /** ISO date, for products with trackExpiry. */
  expiryDate?: string;
}

export type AdjustReason = "damage" | "expiry" | "theft_loss" | "count_correction" | "other";

export interface AdjustInput {
  productId: string;
  variantId?: string;
  /** The ABSOLUTE target level, not a delta. The API records the difference. */
  newQty: number;
  reasonCategory: AdjustReason;
  note?: string;
}

/** Only products with trackStock appear. */
export function getStock(branchId: string): Promise<StockLevel[]> {
  return apiFetch<StockLevel[]>(`/portal/branches/${branchId}/stock`);
}

export function receiveStock(
  branchId: string,
  lines: ReceiveLine[],
): Promise<{ operationId: string; movements: StockMovement[] }> {
  return apiFetch(`/portal/branches/${branchId}/stock/receive`, {
    method: "POST",
    body: { lines },
  });
}

export function adjustStock(branchId: string, input: AdjustInput): Promise<unknown> {
  return apiFetch(`/portal/branches/${branchId}/stock/adjustments`, {
    method: "POST",
    body: input,
  });
}

// ---------------------------------------------------------------------------
// Terminals and activity
// ---------------------------------------------------------------------------

export function listTerminals(businessId: string): Promise<Terminal[]> {
  return apiFetch<Terminal[]>(`/portal/businesses/${businessId}/terminals`);
}

/** Nulls the device token. The terminal 401s on its next request and must re-pair. */
export function unpairTerminal(id: string): Promise<Terminal> {
  return apiFetch<Terminal>(`/portal/terminals/${id}/unpair`, { method: "POST" });
}

export interface PortalActivityQuery {
  branchId?: string;
  /** The BO log never shows platform rows, so `platform_admin` is not accepted. */
  actorType?: Exclude<ActorType, "platform_admin">;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function listActivity(
  businessId: string,
  query: PortalActivityQuery = {},
): Promise<Paginated<AuditEntry>> {
  return apiFetch<Paginated<AuditEntry>>(`/portal/businesses/${businessId}/activity-log`, {
    query: { ...query },
  });
}
```

- [ ] **Step 3: Verify it type-checks and nothing regressed**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all pass. The module is not imported anywhere yet, so the build proves only that
it compiles — which is the point at this stage.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/portal.ts
git commit -m "feat: add the tenant API module and its response types"
```

---

### Task 3: Business list and the business-scoped shell

Replaces the `/portal` placeholder and gives every later screen its layout and navigation.

**Files:**
- Modify: `src/app/(app)/portal/page.tsx`, `src/app/(app)/portal/layout.tsx`
- Create: `src/app/(app)/portal/businesses/[businessId]/layout.tsx`, `.../page.tsx`
- Create: `src/components/app/business-switcher.tsx`
- Create: `src/components/app/empty-state.tsx`
- Test: `src/components/app/business-switcher.test.tsx`

**Interfaces:**
- Consumes: `listBusinesses`, `getBusiness` (Task 2); `AppShell`, `NavItem` (predecessor)
- Produces:
  - `<BusinessSwitcher businesses current>` — a select that navigates, preserving the section
  - `<EmptyState title body action?>` — the shared "nothing here yet" block

- [ ] **Step 1: Create `src/components/app/empty-state.tsx`**

```tsx
import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm font-medium text-charcoal">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-steel">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

- [ ] **Step 2: Write the failing test — `src/components/app/business-switcher.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BusinessSwitcher } from "./business-switcher";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const pathname = vi.hoisted(() => ({ current: "/portal/businesses/b-1/catalog" }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => pathname.current,
}));

const BUSINESSES = [
  { id: "b-1", name: "Kape Diaria" },
  { id: "b-2", name: "Kape Diaria (Demo)" },
];

describe("BusinessSwitcher", () => {
  it("shows the current business as selected", () => {
    render(<BusinessSwitcher businesses={BUSINESSES} current="b-1" />);
    expect(screen.getByLabelText("Business")).toHaveValue("b-1");
  });

  it("stays on the same section when switching business", async () => {
    router.push.mockClear();
    pathname.current = "/portal/businesses/b-1/catalog";
    render(<BusinessSwitcher businesses={BUSINESSES} current="b-1" />);

    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-2");

    expect(router.push).toHaveBeenCalledWith("/portal/businesses/b-2/catalog");
  });

  it("does not carry a record id across to another business", async () => {
    router.push.mockClear();
    pathname.current = "/portal/businesses/b-1/catalog/p-99";
    render(<BusinessSwitcher businesses={BUSINESSES} current="b-1" />);

    await userEvent.selectOptions(screen.getByLabelText("Business"), "b-2");

    // p-99 belongs to b-1. Landing on b-2's copy of that URL would 404 at best.
    expect(router.push).toHaveBeenCalledWith("/portal/businesses/b-2/catalog");
  });

  it("renders nothing when there is only one business to choose from", () => {
    const { container } = render(
      <BusinessSwitcher businesses={[BUSINESSES[0]]} current="b-1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test src/components/app/business-switcher.test.tsx`
Expected: FAIL — cannot resolve `./business-switcher`.

- [ ] **Step 4: Create `src/components/app/business-switcher.tsx`**

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";

/** The sections under a business. Checked in order, so a longer prefix must come first. */
const SECTIONS = [
  "catalog",
  "categories",
  "modifiers",
  "discounts",
  "branches",
  "terminals",
  "activity",
  "settings",
];

/**
 * Switching business keeps you in the same section but drops any record id — a product id
 * from one business is meaningless in another, and following it would 404 at best and show
 * someone else's row name at worst.
 */
export function BusinessSwitcher({
  businesses,
  current,
}: {
  businesses: { id: string; name: string }[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (businesses.length < 2) return null;

  const rest = pathname.split(`/portal/businesses/${current}`)[1] ?? "";
  const section = SECTIONS.find((s) => rest.startsWith(`/${s}`)) ?? "";

  return (
    <label className="block px-3 pb-3">
      <span className="mb-1 block text-xs font-medium text-steel">Business</span>
      <select
        value={current}
        onChange={(event) => {
          const target = `/portal/businesses/${event.target.value}${section ? `/${section}` : ""}`;
          router.push(target);
        }}
        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {businesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.name}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 5: Replace `src/app/(app)/portal/page.tsx`**

```tsx
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listBusinesses } from "@/lib/api/portal";
import { formatManilaDate } from "@/lib/format";

export default async function PortalHomePage() {
  const businesses = await listBusinesses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Businesses</h1>
        <p className="mt-1 text-sm text-steel">Choose a business to manage.</p>
      </div>

      <Card>
        {businesses.length === 0 ? (
          <EmptyState
            title="No businesses yet"
            body="A demo business is created when your account is activated. If you cannot see one, contact support."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Type</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {businesses.map((business) => (
                <TR key={business.id}>
                  <TD>
                    <Link
                      href={`/portal/businesses/${business.id}/catalog`}
                      className="font-medium text-brand-green-dark hover:underline"
                    >
                      {business.name}
                    </Link>
                    {business.isDemo ? (
                      <span className="ml-2 text-xs text-stone">demo</span>
                    ) : null}
                  </TD>
                  <TD className="text-steel">{business.type}</TD>
                  <TD className="text-steel">{formatManilaDate(business.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Replace `src/app/(app)/portal/layout.tsx` with a pass-through**

Next composes every layout in the chain, so a shell here **and** one in the business layout
would render two sidebars. The chrome therefore moves down a level: this layout does nothing,
and each of its children renders its own `AppShell`.

```tsx
/**
 * Deliberately chrome-free. `/portal` and `/portal/businesses/[businessId]` need different
 * sidebars, and a shell at this level would render in addition to — not instead of — theirs.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Then wrap the business list from Step 5 in its own shell: in
`src/app/(app)/portal/page.tsx`, add `import { AppShell } from "@/components/app/app-shell";`
and replace the outer `<div className="space-y-6">…</div>` with

```tsx
    <AppShell title="Sentry" nav={[{ href: "/portal", label: "Businesses" }]}>
      <div className="space-y-6">
        {/* …the heading and Card from Step 5, unchanged… */}
      </div>
    </AppShell>
```

- [ ] **Step 7: Create `src/app/(app)/portal/businesses/[businessId]/layout.tsx`**

```tsx
import { AppShell } from "@/components/app/app-shell";
import { BusinessSwitcher } from "@/components/app/business-switcher";
import { getBusiness, listBusinesses } from "@/lib/api/portal";
import { NotFoundError } from "@/lib/api/errors";
import { notFound } from "next/navigation";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  let business;
  try {
    business = await getBusiness(businessId);
  } catch (error) {
    // A business belonging to someone else reads as absent — the API scopes it away.
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const businesses = await listBusinesses();
  const base = `/portal/businesses/${businessId}`;

  return (
    <AppShell
      title={business.name}
      nav={[
        { href: base, label: "Overview" },
        { href: `${base}/catalog`, label: "Products" },
        { href: `${base}/categories`, label: "Categories" },
        { href: `${base}/modifiers`, label: "Modifiers" },
        { href: `${base}/discounts`, label: "Discounts" },
        { href: `${base}/branches`, label: "Branches" },
        { href: `${base}/terminals`, label: "Terminals" },
        { href: `${base}/activity`, label: "Activity" },
        { href: `${base}/settings`, label: "Settings" },
        { href: "/portal", label: "← All businesses" },
      ]}
      aside={
        <BusinessSwitcher
          businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
          current={businessId}
        />
      }
    >
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 8: Add the optional `aside` slot to `AppShell`**

In `src/components/app/app-shell.tsx`, add an optional `aside?: ReactNode` prop and render
it between the title and the nav:

```tsx
        <p className="px-3 pb-3 text-sm font-semibold tracking-tight text-ink">{title}</p>
        {aside}
        <Nav items={nav} />
```

Update the prop type and destructuring to match. The admin layout passes no `aside`, so it
is unaffected.

- [ ] **Step 9: Create the business overview page**

```tsx
// src/app/(app)/portal/businesses/[businessId]/page.tsx
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusiness, listBranches, listProducts } from "@/lib/api/portal";

export default async function BusinessOverviewPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, products, branches] = await Promise.all([
    getBusiness(businessId),
    listProducts(businessId),
    listBranches(businessId),
  ]);

  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-ink">{business.name}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-semibold text-ink">{products.length}</p>
            <Link href={`${base}/catalog`} className="mt-2 inline-block text-sm text-brand-green-dark hover:underline">
              Manage catalog
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branches</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-semibold text-ink">{branches.length}</p>
            <Link href={`${base}/branches`} className="mt-2 inline-block text-sm text-brand-green-dark hover:underline">
              Manage branches
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Run the tests, lint and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS, and the build lists `/portal`, `/portal/businesses/[businessId]`.

- [ ] **Step 11: Commit**

```bash
git add src/app/\(app\)/portal src/components/app
git commit -m "feat: list businesses and add the business-scoped portal shell"
```

---

### Task 4: Categories

The smallest full CRUD surface, and products depend on it. It establishes the list + inline
editor + confirmed-delete pattern that Tasks 5–10 repeat.

**Files:**
- Create: `src/components/app/confirm-delete.tsx`
- Create: `.../[businessId]/categories/page.tsx`, `actions.ts`, `category-form.tsx`, `category-list.tsx`
- Test: `src/components/app/confirm-delete.test.tsx`, `.../categories/category-form.test.tsx`

**Interfaces:**
- Consumes: `listCategories`, `createCategory`, `updateCategory`, `deleteCategory` (Task 2)
- Produces:
  - `<ConfirmDelete action name label? hidden?>` — two-step destructive submit
  - `createCategoryAction`, `updateCategoryAction`, `deleteCategoryAction` — `(state, formData) => Promise<FormState>`

- [ ] **Step 1: Write the failing test — `src/components/app/confirm-delete.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDelete } from "./confirm-delete";
import type { FormState } from "@/lib/forms/form-state";

describe("ConfirmDelete", () => {
  it("does not delete on the first click", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(action).not.toHaveBeenCalled();
  });

  it("names what is about to be deleted", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText(/Drinks/)).toBeInTheDocument();
  });

  it("submits the hidden fields once confirmed", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect((action.mock.calls[0][1] as FormData).get("id")).toBe("c-1");
  });

  it("backs out without deleting", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("surfaces a refusal from the server, such as a category still in use", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ message: "Category still has products." }),
    );
    render(<ConfirmDelete action={action} name="Drinks" hidden={{ id: "c-1" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("still has products");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/components/app/confirm-delete.test.tsx`
Expected: FAIL — cannot resolve `./confirm-delete`.

- [ ] **Step 3: Create `src/components/app/confirm-delete.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="destructive" disabled={pending}>
      {pending ? "Deleting…" : "Confirm delete"}
    </Button>
  );
}

/**
 * Two clicks to delete, with the record named in between. Deletion here is a soft delete on
 * the API side, but it removes the row from every terminal's catalog immediately, so it is
 * worth a beat of friction.
 */
export function ConfirmDelete({
  action,
  name,
  label = "Delete",
  hidden,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  name: string;
  label?: string;
  hidden: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <div className="space-y-2">
        {state.message ? <Alert>{state.message}</Alert> : null}
        <Button size="sm" variant="ghost" onClick={() => setArmed(true)}>
          {label}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      {Object.entries(hidden).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      {state.message ? <Alert>{state.message}</Alert> : null}
      <p className="text-sm text-charcoal">
        Delete <span className="font-medium">{name}</span>?
      </p>
      <div className="flex gap-2">
        <SubmitButton />
        <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Create `.../[businessId]/categories/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["name", "sortOrder"] as const;

function sortOrderFrom(formData: FormData): number | undefined {
  const raw = String(formData.get("sortOrder") ?? "").trim();
  if (raw === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export async function createCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = sortOrderFrom(formData);

  if (Number.isNaN(sortOrder)) {
    return { fieldErrors: { sortOrder: "Enter a whole number, or leave it blank." } };
  }

  try {
    await createCategory(businessId, { name, ...(sortOrder === undefined ? {} : { sortOrder }) });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/categories`);
  return { done: true };
}

export async function updateCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = sortOrderFrom(formData);

  if (Number.isNaN(sortOrder)) {
    return { fieldErrors: { sortOrder: "Enter a whole number, or leave it blank." } };
  }

  try {
    await updateCategory(id, { name, ...(sortOrder === undefined ? {} : { sortOrder }) });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/categories`);
  return { done: true };
}

export async function deleteCategoryAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteCategory(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/categories`);
  // Products reference categories, so their list can change shape too.
  revalidatePath(`/portal/businesses/${businessId}/catalog`);
  return { done: true };
}
```

- [ ] **Step 5: Create `.../categories/category-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { Category } from "@/lib/api/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

/** One form for both create and edit — `category` present means edit. */
export function CategoryForm({
  action,
  businessId,
  category,
  onDone,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  category?: Category;
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  if (state.done && onDone) onDone();

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      {category ? <input type="hidden" name="id" value={category.id} /> : null}

      {state.message ? (
        <div className="w-full">
          <Alert>{state.message}</Alert>
        </div>
      ) : null}

      <div className="min-w-48 flex-1">
        <Field name={`name-${category?.id ?? "new"}`} label="Name" error={state.fieldErrors?.name}>
          <Input name="name" defaultValue={category?.name} />
        </Field>
      </div>

      <div className="w-28">
        <Field
          name={`sortOrder-${category?.id ?? "new"}`}
          label="Order"
          error={state.fieldErrors?.sortOrder}
        >
          <Input name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0} />
        </Field>
      </div>

      <SubmitButton label={category ? "Save" : "Add category"} />
    </form>
  );
}
```

Note the `Field` `name` is suffixed with the row id: several of these render on one page, and
duplicate ids would make every label point at the first input.

- [ ] **Step 6: Create `.../categories/page.tsx`**

```tsx
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listCategories } from "@/lib/api/portal";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "./actions";
import { CategoryForm } from "./category-form";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const categories = await listCategories(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Categories</h1>
        <p className="mt-1 text-sm text-steel">
          Categories group products on the terminal. Order controls the tab order there.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a category</CardTitle>
        </CardHeader>
        <CardBody>
          <CategoryForm action={createCategoryAction} businessId={businessId} />
        </CardBody>
      </Card>

      <Card>
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" body="Add one above; every product needs one." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Category</TH>
                <TH className="w-40" />
              </TR>
            </THead>
            <TBody>
              {categories.map((category) => (
                <TR key={category.id}>
                  <TD>
                    <CategoryForm
                      action={updateCategoryAction}
                      businessId={businessId}
                      category={category}
                    />
                  </TD>
                  <TD>
                    <ConfirmDelete
                      action={deleteCategoryAction}
                      name={category.name}
                      hidden={{ businessId, id: category.id }}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Write `.../categories/category-form.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryForm } from "./category-form";
import type { FormState } from "@/lib/forms/form-state";
import type { Category } from "@/lib/api/types";

const CATEGORY: Category = {
  id: "c-1",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  deletedAt: null,
  businessId: "b-1",
  name: "Drinks",
  sortOrder: 2,
};

describe("CategoryForm", () => {
  it("creates with the business id attached", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<CategoryForm action={action} businessId="b-1" />);

    await userEvent.type(screen.getByLabelText("Name"), "Pastries");
    await userEvent.click(screen.getByRole("button", { name: "Add category" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("businessId")).toBe("b-1");
    expect(formData.get("name")).toBe("Pastries");
  });

  it("edits an existing category, carrying its id", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<CategoryForm action={action} businessId="b-1" category={CATEGORY} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Drinks");
    expect(screen.getByLabelText("Order")).toHaveValue(2);

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "Beverages");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("id")).toBe("c-1");
    expect(formData.get("name")).toBe("Beverages");
  });

  it("shows a validation message against the name", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { name: "name should not be empty" },
      }),
    );
    render(<CategoryForm action={action} businessId="b-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Add category" }));
    expect(await screen.findByLabelText("Name")).toHaveAccessibleDescription(
      "name should not be empty",
    );
  });
});
```

- [ ] **Step 8: Run the tests, lint and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app/\(app\)/portal src/components/app
git commit -m "feat: manage product categories"
```

---

### Task 5: Products list

Read-only list plus delete. The editor is Task 6 — it is the biggest form in the app and
deserves its own review.

**Files:**
- Create: `.../[businessId]/catalog/page.tsx`, `actions.ts`, `product-filters.tsx`
- Test: `.../catalog/product-filters.test.tsx`

**Interfaces:**
- Consumes: `listProducts`, `listCategories`, `deleteProduct` (Task 2); `formatPesos` (Task 1)
- Produces:
  - `deleteProductAction(state, formData)` — reads `businessId`, `id`
  - `<ProductFilters categories q? categoryId?>` — pushes `?q=&categoryId=` into the URL

- [ ] **Step 1: Write the failing test — `.../catalog/product-filters.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductFilters } from "./product-filters";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/portal/businesses/b-1/catalog",
}));

const CATEGORIES = [
  { id: "c-1", name: "Drinks" },
  { id: "c-2", name: "Pastries" },
];

describe("ProductFilters", () => {
  it("puts the search term in the URL, so a filtered list can be shared", async () => {
    router.replace.mockClear();
    render(<ProductFilters categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Search"), "latte");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(router.replace).toHaveBeenCalledWith("/portal/businesses/b-1/catalog?q=latte");
  });

  it("combines a search with a category", async () => {
    router.replace.mockClear();
    render(<ProductFilters categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Search"), "latte");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "c-2");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    const target = router.replace.mock.calls[0][0] as string;
    expect(target).toContain("q=latte");
    expect(target).toContain("categoryId=c-2");
  });

  it("drops empty filters rather than leaving them in the URL", async () => {
    router.replace.mockClear();
    render(<ProductFilters categories={CATEGORIES} q="latte" />);

    await userEvent.clear(screen.getByLabelText("Search"));
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(router.replace).toHaveBeenCalledWith("/portal/businesses/b-1/catalog");
  });

  it("shows the filters it was given", () => {
    render(<ProductFilters categories={CATEGORIES} q="latte" categoryId="c-1" />);
    expect(screen.getByLabelText("Search")).toHaveValue("latte");
    expect(screen.getByLabelText("Category")).toHaveValue("c-1");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/app/\(app\)/portal/businesses/\[businessId\]/catalog`
Expected: FAIL — cannot resolve `./product-filters`.

- [ ] **Step 3: Create `.../catalog/product-filters.tsx`**

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Filters live in the URL rather than in component state: a filtered catalog is then a
 * link you can send to someone, and it survives a reload and the back button.
 */
export function ProductFilters({
  categories,
  q = "",
  categoryId = "",
}: {
  categories: { id: string; name: string }[];
  q?: string;
  categoryId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const params = new URLSearchParams();
        for (const key of ["q", "categoryId"]) {
          const value = String(data.get(key) ?? "").trim();
          if (value) params.set(key, value);
        }
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname);
      }}
    >
      <div className="min-w-48 flex-1">
        <Field name="q" label="Search">
          <Input name="q" defaultValue={q} placeholder="Name, SKU or barcode" />
        </Field>
      </div>

      <div className="min-w-40">
        <Field name="categoryId" label="Category">
          <select
            name="categoryId"
            defaultValue={categoryId}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Button type="submit" variant="secondary">
        Apply
      </Button>
    </form>
  );
}
```

`Field` clones its child to add `id`, so the `<select>` above receives `id="categoryId"` and
the label resolves — the same mechanism the `Input` uses.

- [ ] **Step 4: Create `.../catalog/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { deleteProduct } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function deleteProductAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteProduct(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/catalog`);
  return { done: true };
}
```

- [ ] **Step 5: Create `.../catalog/page.tsx`**

```tsx
import Link from "next/link";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listCategories, listProducts } from "@/lib/api/portal";
import { formatPesos } from "@/lib/money";
import { deleteProductAction } from "./actions";
import { ProductFilters } from "./product-filters";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ q?: string; categoryId?: string }>;
}) {
  const { businessId } = await params;
  const { q, categoryId } = await searchParams;

  const [products, categories] = await Promise.all([
    listProducts(businessId),
    listCategories(businessId),
  ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const needle = q?.trim().toLowerCase() ?? "";

  // Filtering client-side because the API has no search parameter. Catalogs are small
  // enough for this; when one is not, the filter belongs in the API, not in a paginator here.
  const visible = products.filter((product) => {
    if (categoryId && product.categoryId !== categoryId) return false;
    if (!needle) return true;
    const haystack = [
      product.name,
      product.sku ?? "",
      product.barcode ?? "",
      ...product.variants.flatMap((v) => [v.name, v.sku ?? "", v.barcode ?? ""]),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });

  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Products</h1>
          <p className="mt-1 text-sm text-steel">
            {visible.length} of {products.length} shown.
          </p>
        </div>
        <Link href={`${base}/catalog/new`} className={buttonVariants()}>
          Add product
        </Link>
      </div>

      <ProductFilters
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        q={q}
        categoryId={categoryId}
      />

      <Card>
        {products.length === 0 ? (
          <EmptyState
            title="No products yet"
            body="Add your first product — it appears on every paired terminal straight away."
          />
        ) : visible.length === 0 ? (
          <EmptyState title="Nothing matches" body="Try a different search or category." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Category</TH>
                <TH>Price</TH>
                <TH>Stock</TH>
                <TH className="w-32" />
              </TR>
            </THead>
            <TBody>
              {visible.map((product) => (
                <TR key={product.id}>
                  <TD>
                    <Link
                      href={`${base}/catalog/${product.id}`}
                      className="font-medium text-brand-green-dark hover:underline"
                    >
                      {product.name}
                    </Link>
                    {!product.active ? (
                      <Badge tone="neutral" className="ml-2">
                        Inactive
                      </Badge>
                    ) : null}
                    {product.variants.length > 0 ? (
                      <span className="ml-2 text-xs text-stone">
                        {product.variants.length} variant
                        {product.variants.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </TD>
                  <TD className="text-steel">{categoryName.get(product.categoryId) ?? "—"}</TD>
                  <TD className="font-mono text-charcoal">{formatPesos(product.priceC)}</TD>
                  <TD className="text-steel">
                    {product.trackStock ? "Tracked" : "Not tracked"}
                  </TD>
                  <TD>
                    <ConfirmDelete
                      action={deleteProductAction}
                      name={product.name}
                      hidden={{ businessId, id: product.id }}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Run the tests, lint and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/portal
git commit -m "feat: list, search and delete products"
```

---

### Task 6: Product editor

Create and edit, including the variants replace-set. The largest form in the app.

**Files:**
- Create: `.../catalog/new/page.tsx`, `.../catalog/[productId]/page.tsx`
- Create: `.../catalog/product-form.tsx`, `.../catalog/variant-rows.tsx`
- Modify: `.../catalog/actions.ts`
- Test: `.../catalog/product-form.test.tsx`

**Interfaces:**
- Consumes: `createProduct`, `updateProduct`, `getProduct`, `listCategories` (Task 2); `pesosToCentavos`, `centavosToPesos` (Task 1)
- Produces:
  - `saveProductAction(state, formData)` — creates when `id` is absent, updates when present
  - `<ProductForm action categories product?>`
  - `<VariantRows initial>` — the add/remove variant editor

- [ ] **Step 1: Extend `.../catalog/actions.ts`**

Add to the existing file:

```ts
import { redirect } from "next/navigation";
import { createProduct, updateProduct, type VariantInput } from "@/lib/api/portal";
import { pesosToCentavos } from "@/lib/money";

const PRODUCT_FIELDS = [
  "categoryId",
  "name",
  "sku",
  "barcode",
  "priceC",
  "costC",
  "soldBy",
  "lowStockThreshold",
] as const;

/** "" → undefined, so an untouched optional field is omitted rather than sent as empty. */
function optionalText(formData: FormData, key: string): string | undefined {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? undefined : value;
}

/**
 * Reads the repeated variant inputs back into the replace-set the API expects. The form
 * posts parallel arrays (`variantId[]`, `variantName[]`, …); a row with a blank name is
 * treated as an empty row the user left behind, not as a variant to create.
 */
function variantsFrom(formData: FormData): { variants: VariantInput[] } | { error: string } {
  const ids = formData.getAll("variantId").map(String);
  const names = formData.getAll("variantName").map(String);
  const prices = formData.getAll("variantPrice").map(String);
  const skus = formData.getAll("variantSku").map(String);
  const barcodes = formData.getAll("variantBarcode").map(String);

  const variants: VariantInput[] = [];
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i].trim();
    if (name === "") continue;

    const priceC = pesosToCentavos(prices[i] ?? "");
    if (priceC === null) {
      return { error: `Enter a price for the variant "${name}".` };
    }

    const id = (ids[i] ?? "").trim();
    variants.push({
      ...(id ? { id } : {}),
      name,
      priceC,
      ...(skus[i]?.trim() ? { sku: skus[i].trim() } : {}),
      ...(barcodes[i]?.trim() ? { barcode: barcodes[i].trim() } : {}),
    });
  }
  return { variants };
}

export async function saveProductAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "").trim();

  const priceC = pesosToCentavos(String(formData.get("price") ?? ""));
  if (priceC === null) {
    return { fieldErrors: { priceC: "Enter a price, for example 120.50." } };
  }

  const rawCost = String(formData.get("cost") ?? "").trim();
  const costC = rawCost === "" ? undefined : pesosToCentavos(rawCost);
  if (costC === null) {
    return { fieldErrors: { costC: "Enter a cost, or leave it blank." } };
  }

  const variantResult = variantsFrom(formData);
  if ("error" in variantResult) return { message: variantResult.error };

  const soldBy = String(formData.get("soldBy") ?? "unit");
  const input = {
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    priceC,
    ...(costC === undefined ? {} : { costC }),
    ...(optionalText(formData, "sku") ? { sku: optionalText(formData, "sku") } : {}),
    ...(optionalText(formData, "barcode")
      ? { barcode: optionalText(formData, "barcode") }
      : {}),
    soldBy: soldBy === "weight" ? ("weight" as const) : ("unit" as const),
    trackStock: formData.get("trackStock") === "on",
    trackExpiry: formData.get("trackExpiry") === "on",
    active: formData.get("active") === "on",
    // Replace-set: always send the full list, because the form always shows the full list.
    variants: variantResult.variants,
  };

  let productId: string;
  try {
    const saved = id ? await updateProduct(id, input) : await createProduct(businessId, input);
    productId = saved.id;
  } catch (error) {
    return toFormState(error, PRODUCT_FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/catalog`);
  redirect(`/portal/businesses/${businessId}/catalog/${productId}?saved=1`);
}
```

Sending `variants` on **every** save is correct here and only here: this form always renders
every existing variant, so the posted list is genuinely the full desired set. Any future
form that shows a subset must omit the key instead, or it will delete what it did not show.

- [ ] **Step 2: Create `.../catalog/variant-rows.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { centavosToPesos } from "@/lib/money";
import type { Variant } from "@/lib/api/types";

interface Row {
  key: string;
  id: string;
  name: string;
  price: string;
  sku: string;
  barcode: string;
}

function toRow(variant: Variant, index: number): Row {
  return {
    key: `existing-${variant.id}-${index}`,
    id: variant.id,
    name: variant.name,
    price: centavosToPesos(variant.priceC),
    sku: variant.sku ?? "",
    barcode: variant.barcode ?? "",
  };
}

/**
 * Variants post as parallel arrays, which the Server Action zips back together. Removing a
 * row simply stops rendering it: the API treats an absent variant as deleted, so there is no
 * separate delete call to make.
 */
export function VariantRows({ initial }: { initial: Variant[] }) {
  const [rows, setRows] = useState<Row[]>(initial.map(toRow));
  const [nextKey, setNextKey] = useState(0);

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="text-sm text-steel">
          No variants. The product sells at its own price. Add variants for sizes or flavours
          that cost different amounts.
        </p>
      ) : null}

      {rows.map((row, index) => (
        <div key={row.key} className="flex flex-wrap items-end gap-2 rounded-lg bg-surface p-3">
          <input type="hidden" name="variantId" value={row.id} />

          <div className="min-w-40 flex-1">
            <Label htmlFor={`variantName-${index}`}>Variant</Label>
            <Input
              id={`variantName-${index}`}
              name="variantName"
              defaultValue={row.name}
              placeholder="Large"
            />
          </div>

          <div className="w-28">
            <Label htmlFor={`variantPrice-${index}`}>Price</Label>
            <Input
              id={`variantPrice-${index}`}
              name="variantPrice"
              defaultValue={row.price}
              inputMode="decimal"
            />
          </div>

          <div className="w-32">
            <Label htmlFor={`variantSku-${index}`}>SKU</Label>
            <Input id={`variantSku-${index}`} name="variantSku" defaultValue={row.sku} />
          </div>

          <div className="w-36">
            <Label htmlFor={`variantBarcode-${index}`}>Barcode</Label>
            <Input
              id={`variantBarcode-${index}`}
              name="variantBarcode"
              defaultValue={row.barcode}
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setRows([
            ...rows,
            { key: `new-${nextKey}`, id: "", name: "", price: "", sku: "", barcode: "" },
          ]);
          setNextKey(nextKey + 1);
        }}
      >
        Add variant
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create `.../catalog/product-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { centavosToPesos } from "@/lib/money";
import type { Category, Product } from "@/lib/api/types";
import { VariantRows } from "./variant-rows";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 rounded border-input accent-[var(--color-primary)]"
      />
      <span>
        <span className="block text-sm font-medium text-charcoal">{label}</span>
        <span className="block text-sm text-steel">{hint}</span>
      </span>
    </label>
  );
}

export function ProductForm({
  action,
  businessId,
  categories,
  product,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  categories: Category[];
  product?: Product;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="businessId" value={businessId} />
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {state.message ? <Alert>{state.message}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field name="name" label="Name" error={state.fieldErrors?.name}>
              <Input name="name" defaultValue={product?.name} autoFocus />
            </Field>
          </div>

          <Field name="categoryId" label="Category" error={state.fieldErrors?.categoryId}>
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? categories[0]?.id ?? ""}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field name="soldBy" label="Sold by">
            <select
              name="soldBy"
              defaultValue={product?.soldBy ?? "unit"}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="unit">Each</option>
              <option value="weight">Weight</option>
            </select>
          </Field>

          <Field
            name="price"
            label="Price"
            error={state.fieldErrors?.priceC}
            hint="In pesos, VAT inclusive."
          >
            <Input
              name="price"
              inputMode="decimal"
              defaultValue={product ? centavosToPesos(product.priceC) : ""}
            />
          </Field>

          <Field name="cost" label="Cost" error={state.fieldErrors?.costC} hint="Optional.">
            <Input
              name="cost"
              inputMode="decimal"
              defaultValue={product?.costC != null ? centavosToPesos(product.costC) : ""}
            />
          </Field>

          <Field name="sku" label="SKU" error={state.fieldErrors?.sku} hint="Optional; unique.">
            <Input name="sku" defaultValue={product?.sku ?? ""} />
          </Field>

          <Field
            name="barcode"
            label="Barcode"
            error={state.fieldErrors?.barcode}
            hint="Optional; unique. Scanned at the counter."
          >
            <Input name="barcode" defaultValue={product?.barcode ?? ""} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behaviour</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Toggle
            name="active"
            label="Active"
            hint="Inactive products stay in reports but disappear from the terminal."
            defaultChecked={product?.active ?? true}
          />
          <Toggle
            name="trackStock"
            label="Track stock"
            hint="Counts quantity per branch and blocks a sale that would go negative."
            defaultChecked={product?.trackStock ?? false}
          />
          <Toggle
            name="trackExpiry"
            label="Track expiry"
            hint="Records an expiry date when stock is received."
            defaultChecked={product?.trackExpiry ?? false}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardBody>
          <VariantRows initial={product?.variants ?? []} />
        </CardBody>
      </Card>

      <SubmitButton label={product ? "Save product" : "Create product"} />
    </form>
  );
}
```

- [ ] **Step 4: Create the two pages**

```tsx
// src/app/(app)/portal/businesses/[businessId]/catalog/new/page.tsx
import Link from "next/link";
import { EmptyState } from "@/components/app/empty-state";
import { Card } from "@/components/ui/card";
import { listCategories } from "@/lib/api/portal";
import { saveProductAction } from "../actions";
import { ProductForm } from "../product-form";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const categories = await listCategories(businessId);
  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/catalog`} className="text-sm text-steel hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Add a product</h1>
      </div>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            title="Add a category first"
            body="Every product belongs to a category, and this business has none yet."
            action={
              <Link
                href={`${base}/categories`}
                className="text-sm text-brand-green-dark hover:underline"
              >
                Go to categories
              </Link>
            }
          />
        </Card>
      ) : (
        <ProductForm
          action={saveProductAction}
          businessId={businessId}
          categories={categories}
        />
      )}
    </div>
  );
}
```

```tsx
// src/app/(app)/portal/businesses/[businessId]/catalog/[productId]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { NotFoundError } from "@/lib/api/errors";
import { getProduct, listCategories } from "@/lib/api/portal";
import { saveProductAction } from "../actions";
import { ProductForm } from "../product-form";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string; productId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { businessId, productId } = await params;
  const { saved } = await searchParams;

  let product;
  try {
    product = await getProduct(productId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const categories = await listCategories(businessId);
  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`${base}/catalog`} className="text-sm text-steel hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">{product.name}</h1>
      </div>

      {saved ? <Alert tone="info">Saved. Paired terminals pick this up on their next sync.</Alert> : null}

      <ProductForm
        action={saveProductAction}
        businessId={businessId}
        categories={categories}
        product={product}
      />
    </div>
  );
}
```

- [ ] **Step 5: Write `.../catalog/product-form.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductForm } from "./product-form";
import type { FormState } from "@/lib/forms/form-state";
import type { Category, Product } from "@/lib/api/types";

const CATEGORIES: Category[] = [
  {
    id: "c-1",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    deletedAt: null,
    businessId: "b-1",
    name: "Drinks",
    sortOrder: 0,
  },
];

const PRODUCT: Product = {
  id: "p-1",
  businessId: "b-1",
  categoryId: "c-1",
  name: "Iced Latte",
  sku: "ICL",
  barcode: null,
  priceC: 12000,
  costC: 4500,
  soldBy: "unit",
  lowStockThreshold: null,
  imagePath: null,
  trackStock: false,
  trackExpiry: false,
  active: true,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  deletedAt: null,
  variants: [
    { id: "v-1", productId: "p-1", name: "Large", sku: null, barcode: null, priceC: 14000, costC: null },
  ],
};

describe("ProductForm", () => {
  it("posts a new product with its business id", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ProductForm action={action} businessId="b-1" categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Name"), "Espresso");
    await userEvent.type(screen.getByLabelText("Price"), "95.00");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("businessId")).toBe("b-1");
    expect(formData.get("name")).toBe("Espresso");
    expect(formData.get("price")).toBe("95.00");
    expect(formData.get("id")).toBeNull();
  });

  it("shows an existing product in pesos, not centavos", () => {
    render(
      <ProductForm action={vi.fn()} businessId="b-1" categories={CATEGORIES} product={PRODUCT} />,
    );
    expect(screen.getByLabelText("Price")).toHaveValue("120.00");
    expect(screen.getByLabelText("Cost")).toHaveValue("45.00");
  });

  it("carries the product id when editing", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <ProductForm action={action} businessId="b-1" categories={CATEGORIES} product={PRODUCT} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save product" }));
    expect((action.mock.calls[0][1] as FormData).get("id")).toBe("p-1");
  });

  it("posts each existing variant with its id, so it updates rather than duplicating", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <ProductForm action={action} businessId="b-1" categories={CATEGORIES} product={PRODUCT} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save product" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.getAll("variantId")).toEqual(["v-1"]);
    expect(formData.getAll("variantName")).toEqual(["Large"]);
    expect(formData.getAll("variantPrice")).toEqual(["140.00"]);
  });

  it("posts a new variant with an empty id", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ProductForm action={action} businessId="b-1" categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Name"), "Tea");
    await userEvent.type(screen.getByLabelText("Price"), "80");
    await userEvent.click(screen.getByRole("button", { name: "Add variant" }));
    await userEvent.type(screen.getByLabelText("Variant"), "Iced");
    await userEvent.type(screen.getAllByLabelText("Price")[1], "85");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.getAll("variantId")).toEqual([""]);
    expect(formData.getAll("variantName")).toEqual(["Iced"]);
  });

  it("stops posting a variant once it is removed, which is how the API deletes it", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <ProductForm action={action} businessId="b-1" categories={CATEGORIES} product={PRODUCT} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Save product" }));

    expect((action.mock.calls[0][1] as FormData).getAll("variantName")).toEqual([]);
  });

  it("defaults a new product to active and untracked", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<ProductForm action={action} businessId="b-1" categories={CATEGORIES} />);

    await userEvent.type(screen.getByLabelText("Name"), "Bread");
    await userEvent.type(screen.getByLabelText("Price"), "50");
    await userEvent.click(screen.getByRole("button", { name: "Create product" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("active")).toBe("on");
    expect(formData.get("trackStock")).toBeNull();
  });

  it("puts a duplicate-SKU conflict where it can be corrected", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ fieldErrors: { sku: "sku already exists" } }),
    );
    render(<ProductForm action={action} businessId="b-1" categories={CATEGORIES} />);

    await userEvent.click(screen.getByRole("button", { name: "Create product" }));
    expect(await screen.findByLabelText("SKU")).toHaveAccessibleDescription(
      "sku already exists",
    );
  });
});
```

- [ ] **Step 6: Run the tests, lint and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS. If the "new variant" test cannot disambiguate the two **Price** labels, keep
`getAllByLabelText("Price")[1]` — the product price is first in the DOM, the variant's second.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/portal
git commit -m "feat: create and edit products, including variants"
```

---

### Task 7: Modifier groups and product links

**Files:**
- Create: `.../[businessId]/modifiers/page.tsx`, `actions.ts`, `group-form.tsx`
- Modify: `.../catalog/[productId]/page.tsx` (add the link editor), `.../catalog/actions.ts`
- Create: `.../catalog/[productId]/modifier-links.tsx`
- Test: `.../modifiers/group-form.test.tsx`

**Interfaces:**
- Consumes: `listModifierGroups`, `createModifierGroup`, `updateModifierGroup`, `deleteModifierGroup`, `setProductModifierGroups` (Task 2)
- Produces:
  - `saveModifierGroupAction`, `deleteModifierGroupAction`
  - `setProductGroupsAction(state, formData)` — reads `businessId`, `productId`, repeated `groupId`
  - `<GroupForm action businessId group?>`, `<ModifierLinks action businessId productId groups linked>`

- [ ] **Step 1: Create `.../modifiers/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import {
  createModifierGroup,
  deleteModifierGroup,
  updateModifierGroup,
  type ModifierInput,
} from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
import { pesosToCentavos } from "@/lib/money";

const FIELDS = ["name", "minSelect", "maxSelect"] as const;

/**
 * A price delta may be negative — "no cheese, minus ₱10" is a real modifier — so the sign is
 * parsed off the front and reapplied, since pesosToCentavos rejects negatives by design.
 */
function deltaFrom(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const negative = trimmed.startsWith("-");
  const magnitude = pesosToCentavos(negative ? trimmed.slice(1) : trimmed);
  if (magnitude === null) return null;
  return negative ? -magnitude : magnitude;
}

function modifiersFrom(formData: FormData): { modifiers: ModifierInput[] } | { error: string } {
  const ids = formData.getAll("modifierId").map(String);
  const names = formData.getAll("modifierName").map(String);
  const deltas = formData.getAll("modifierDelta").map(String);

  const modifiers: ModifierInput[] = [];
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i].trim();
    if (name === "") continue;

    const priceDeltaC = deltaFrom(deltas[i] ?? "");
    if (priceDeltaC === null) {
      return { error: `Enter a price change for "${name}", for example 15 or -10.` };
    }

    const id = (ids[i] ?? "").trim();
    modifiers.push({ ...(id ? { id } : {}), name, priceDeltaC });
  }
  return { modifiers };
}

export async function saveModifierGroupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "").trim();

  const minSelect = Number.parseInt(String(formData.get("minSelect") ?? "0"), 10);
  const maxSelect = Number.parseInt(String(formData.get("maxSelect") ?? "1"), 10);
  if (!Number.isInteger(minSelect) || !Number.isInteger(maxSelect)) {
    return { fieldErrors: { minSelect: "Enter whole numbers." } };
  }
  if (minSelect > maxSelect) {
    return { fieldErrors: { maxSelect: "Maximum must be at least the minimum." } };
  }

  const result = modifiersFrom(formData);
  if ("error" in result) return { message: result.error };

  const input = {
    name: String(formData.get("name") ?? "").trim(),
    minSelect,
    maxSelect,
    modifiers: result.modifiers,
  };

  try {
    if (id) await updateModifierGroup(id, input);
    else await createModifierGroup(businessId, input);
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/modifiers`);
  return { done: true };
}

export async function deleteModifierGroupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteModifierGroup(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/modifiers`);
  return { done: true };
}
```

- [ ] **Step 2: Create `.../modifiers/group-form.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { centavosToPesos } from "@/lib/money";
import type { ModifierGroup } from "@/lib/api/types";

interface Row {
  key: string;
  id: string;
  name: string;
  delta: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function GroupForm({
  action,
  businessId,
  group,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  group?: ModifierGroup;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const suffix = group?.id ?? "new";
  const [rows, setRows] = useState<Row[]>(
    (group?.modifiers ?? []).map((m, i) => ({
      key: `existing-${m.id}-${i}`,
      id: m.id,
      name: m.name,
      delta: centavosToPesos(m.priceDeltaC),
    })),
  );
  const [nextKey, setNextKey] = useState(0);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="businessId" value={businessId} />
      {group ? <input type="hidden" name="id" value={group.id} /> : null}

      {state.message ? <Alert>{state.message}</Alert> : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Field name={`name-${suffix}`} label="Group name" error={state.fieldErrors?.name}>
            <Input name="name" defaultValue={group?.name} placeholder="Milk" />
          </Field>
        </div>
        <div className="w-24">
          <Field name={`minSelect-${suffix}`} label="Min" error={state.fieldErrors?.minSelect}>
            <Input name="minSelect" type="number" min={0} defaultValue={group?.minSelect ?? 0} />
          </Field>
        </div>
        <div className="w-24">
          <Field name={`maxSelect-${suffix}`} label="Max" error={state.fieldErrors?.maxSelect}>
            <Input name="maxSelect" type="number" min={0} defaultValue={group?.maxSelect ?? 1} />
          </Field>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.key} className="flex flex-wrap items-end gap-2 rounded-lg bg-surface p-3">
            <input type="hidden" name="modifierId" value={row.id} />
            <div className="min-w-40 flex-1">
              <Label htmlFor={`modifierName-${suffix}-${index}`}>Option</Label>
              <Input
                id={`modifierName-${suffix}-${index}`}
                name="modifierName"
                defaultValue={row.name}
                placeholder="Oat milk"
              />
            </div>
            <div className="w-32">
              <Label htmlFor={`modifierDelta-${suffix}-${index}`}>Price change</Label>
              <Input
                id={`modifierDelta-${suffix}-${index}`}
                name="modifierDelta"
                defaultValue={row.delta}
                inputMode="decimal"
                placeholder="15 or -10"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
            >
              Remove
            </Button>
          </div>
        ))}

        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setRows([...rows, { key: `new-${nextKey}`, id: "", name: "", delta: "0.00" }]);
            setNextKey(nextKey + 1);
          }}
        >
          Add option
        </Button>
      </div>

      <SubmitButton label={group ? "Save group" : "Create group"} />
    </form>
  );
}
```

- [ ] **Step 3: Create `.../modifiers/page.tsx`**

```tsx
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { listModifierGroups } from "@/lib/api/portal";
import { deleteModifierGroupAction, saveModifierGroupAction } from "./actions";
import { GroupForm } from "./group-form";

export default async function ModifiersPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const groups = await listModifierGroups(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Modifiers</h1>
        <p className="mt-1 text-sm text-steel">
          Options the cashier picks when adding a product — milk, size, extras. Attach a group
          to a product from that product&apos;s page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New group</CardTitle>
        </CardHeader>
        <CardBody>
          <GroupForm action={saveModifierGroupAction} businessId={businessId} />
        </CardBody>
      </Card>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            title="No modifier groups"
            body="Create one above if your products have options that change the price."
          />
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="flex items-center justify-between gap-4">
              <CardTitle>{group.name}</CardTitle>
              <ConfirmDelete
                action={deleteModifierGroupAction}
                name={group.name}
                hidden={{ businessId, id: group.id }}
              />
            </CardHeader>
            <CardBody>
              <GroupForm action={saveModifierGroupAction} businessId={businessId} group={group} />
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add the link editor to the product page**

Append to `.../catalog/actions.ts`:

```ts
import { setProductModifierGroups } from "@/lib/api/portal";

export async function setProductGroupsAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  // Every checkbox posts only when checked, so this IS the complete desired set.
  const groupIds = formData.getAll("groupId").map(String).filter(Boolean);

  try {
    await setProductModifierGroups(productId, groupIds);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/catalog/${productId}`);
  return { done: true };
}
```

Create `.../catalog/[productId]/modifier-links.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { formatPesos } from "@/lib/money";
import type { ModifierGroup } from "@/lib/api/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save modifiers"}
    </Button>
  );
}

/**
 * A checkbox per group. Unchecked boxes post nothing, so the submitted list is exactly the
 * desired set — which is what the PUT endpoint wants. Clearing every box clears every link.
 */
export function ModifierLinks({
  action,
  businessId,
  productId,
  groups,
  linked,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  productId: string;
  groups: ModifierGroup[];
  linked: string[];
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const checked = new Set(linked);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-steel">
        This business has no modifier groups yet.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="productId" value={productId} />

      {state.message ? <Alert>{state.message}</Alert> : null}
      {state.done ? <Alert tone="info">Modifiers saved.</Alert> : null}

      {groups.map((group) => (
        <label key={group.id} className="flex items-start gap-3">
          <input
            type="checkbox"
            name="groupId"
            value={group.id}
            defaultChecked={checked.has(group.id)}
            className="mt-1 size-4 rounded border-input accent-[var(--color-primary)]"
          />
          <span>
            <span className="block text-sm font-medium text-charcoal">{group.name}</span>
            <span className="block text-sm text-steel">
              {group.modifiers.length === 0
                ? "No options yet"
                : group.modifiers
                    .map((m) => `${m.name} ${formatPesos(m.priceDeltaC)}`)
                    .join(" · ")}
            </span>
          </span>
        </label>
      ))}

      <SubmitButton />
    </form>
  );
}
```

Then in `.../catalog/[productId]/page.tsx`, load the groups and the product's current links
and render the editor under the form. The API has no "which groups does this product have"
read, so derive it: `listModifierGroups(businessId)` returns every group, and the product's
links come from `getProduct` only if the API includes them — it does **not**. Until an
endpoint exists, pass `linked={[]}` and note in the UI that saving replaces the whole set:

```tsx
      <Card>
        <CardHeader>
          <CardTitle>Modifiers</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Alert tone="warn">
            The API does not yet report which groups a product already has, so this list starts
            empty each time. Saving replaces every link on this product — tick every group it
            should have, not just the new one.
          </Alert>
          <ModifierLinks
            action={setProductGroupsAction}
            businessId={businessId}
            productId={product.id}
            groups={groups}
            linked={[]}
          />
        </CardBody>
      </Card>
```

That warning is load-bearing, not decoration: silently replacing links the user cannot see
would be data loss. Remove it when the API grows a read for `ProductGroupLinks`.

- [ ] **Step 5: Write `.../modifiers/group-form.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupForm } from "./group-form";
import type { FormState } from "@/lib/forms/form-state";
import type { ModifierGroup } from "@/lib/api/types";

const GROUP: ModifierGroup = {
  id: "g-1",
  businessId: "b-1",
  name: "Milk",
  minSelect: 0,
  maxSelect: 1,
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
  deletedAt: null,
  modifiers: [{ id: "m-1", groupId: "g-1", name: "Oat", priceDeltaC: 1500 }],
};

describe("GroupForm", () => {
  it("creates a group with its options", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<GroupForm action={action} businessId="b-1" />);

    await userEvent.type(screen.getByLabelText("Group name"), "Size");
    await userEvent.click(screen.getByRole("button", { name: "Add option" }));
    await userEvent.type(screen.getByLabelText("Option"), "Large");
    await userEvent.clear(screen.getByLabelText("Price change"));
    await userEvent.type(screen.getByLabelText("Price change"), "20");
    await userEvent.click(screen.getByRole("button", { name: "Create group" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Size");
    expect(formData.getAll("modifierName")).toEqual(["Large"]);
    expect(formData.getAll("modifierDelta")).toEqual(["20"]);
    expect(formData.getAll("modifierId")).toEqual([""]);
  });

  it("shows an existing option's delta in pesos and keeps its id", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<GroupForm action={action} businessId="b-1" group={GROUP} />);

    expect(screen.getByLabelText("Price change")).toHaveValue("15.00");

    await userEvent.click(screen.getByRole("button", { name: "Save group" }));
    expect((action.mock.calls[0][1] as FormData).getAll("modifierId")).toEqual(["m-1"]);
  });

  it("stops posting an option once removed", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<GroupForm action={action} businessId="b-1" group={GROUP} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Save group" }));

    expect((action.mock.calls[0][1] as FormData).getAll("modifierName")).toEqual([]);
  });

  it("reports a min above max against the max field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { maxSelect: "Maximum must be at least the minimum." },
      }),
    );
    render(<GroupForm action={action} businessId="b-1" />);

    await userEvent.click(screen.getByRole("button", { name: "Create group" }));
    expect(await screen.findByLabelText("Max")).toHaveAccessibleDescription(
      "Maximum must be at least the minimum.",
    );
  });
});
```

- [ ] **Step 6: Run the tests, lint and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/portal
git commit -m "feat: manage modifier groups and attach them to products"
```

---

### Task 8: Discounts, settings and the refund PIN

**Files:**
- Create: `.../[businessId]/discounts/page.tsx`, `actions.ts`, `discount-form.tsx`
- Create: `.../[businessId]/settings/page.tsx`, `actions.ts`, `business-settings-form.tsx`
- Create: `src/app/(app)/portal/settings/page.tsx`, `actions.ts`, `refund-pin-form.tsx`
- Test: `.../discounts/discount-form.test.tsx`, `src/app/(app)/portal/settings/refund-pin-form.test.tsx`

**Interfaces:**
- Consumes: `listDiscounts`, `createDiscount`, `updateDiscount`, `deleteDiscount`, `updateBusiness`, `setRefundPin` (Task 2)
- Produces:
  - `saveDiscountAction`, `deleteDiscountAction`
  - `saveBusinessSettingsAction`
  - `setRefundPinAction`
  - `<DiscountForm action businessId discount?>`, `<RefundPinForm action>`, `<BusinessSettingsForm action business>`

- [ ] **Step 1: Create `.../discounts/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createDiscount, deleteDiscount, updateDiscount } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
import { pesosToCentavos } from "@/lib/money";

const FIELDS = ["name", "kind", "value", "appliesTo"] as const;

export async function saveDiscountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "").trim();
  const kind = String(formData.get("kind") ?? "percent") === "fixed" ? "fixed" : "percent";
  const rawValue = String(formData.get("value") ?? "").trim();

  // `value` is dual-purpose: 1–100 for a percentage, centavos for a fixed amount. Getting
  // this wrong is a silent 100× error, so the two paths are parsed separately.
  let value: number | null;
  if (kind === "percent") {
    const percent = Number(rawValue);
    value = Number.isInteger(percent) && percent >= 1 && percent <= 100 ? percent : null;
    if (value === null) {
      return { fieldErrors: { value: "Enter a whole percentage between 1 and 100." } };
    }
  } else {
    value = pesosToCentavos(rawValue);
    if (value === null || value < 1) {
      return { fieldErrors: { value: "Enter an amount, for example 50.00." } };
    }
  }

  const appliesToRaw = String(formData.get("appliesTo") ?? "line");
  const appliesTo =
    appliesToRaw === "order" ? "order" : appliesToRaw === "both" ? "both" : "line";

  const input = {
    name: String(formData.get("name") ?? "").trim(),
    kind,
    value,
    appliesTo,
    active: formData.get("active") === "on",
  } as const;

  try {
    if (id) await updateDiscount(id, input);
    else await createDiscount(businessId, input);
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/discounts`);
  return { done: true };
}

export async function deleteDiscountAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteDiscount(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/discounts`);
  return { done: true };
}
```

- [ ] **Step 2: Create `.../discounts/discount-form.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import { centavosToPesos } from "@/lib/money";
import type { Discount } from "@/lib/api/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function DiscountForm({
  action,
  businessId,
  discount,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  discount?: Discount;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [kind, setKind] = useState<"percent" | "fixed">(discount?.kind ?? "percent");
  const suffix = discount?.id ?? "new";

  const defaultValue =
    discount === undefined
      ? ""
      : discount.kind === "percent"
        ? String(discount.value)
        : centavosToPesos(discount.value);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      {discount ? <input type="hidden" name="id" value={discount.id} /> : null}

      {state.message ? (
        <div className="w-full">
          <Alert>{state.message}</Alert>
        </div>
      ) : null}

      <div className="min-w-40 flex-1">
        <Field name={`name-${suffix}`} label="Name" error={state.fieldErrors?.name}>
          <Input name="name" defaultValue={discount?.name} placeholder="Staff discount" />
        </Field>
      </div>

      <div className="w-36">
        <Field name={`kind-${suffix}`} label="Type">
          <select
            name="kind"
            defaultValue={kind}
            onChange={(e) => setKind(e.target.value === "fixed" ? "fixed" : "percent")}
            className={SELECT_CLASS}
          >
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </Field>
      </div>

      <div className="w-32">
        <Field
          name={`value-${suffix}`}
          label={kind === "percent" ? "Percent" : "Amount"}
          error={state.fieldErrors?.value}
        >
          <Input
            name="value"
            inputMode="decimal"
            defaultValue={defaultValue}
            placeholder={kind === "percent" ? "10" : "50.00"}
          />
        </Field>
      </div>

      <div className="w-36">
        <Field name={`appliesTo-${suffix}`} label="Applies to">
          <select name="appliesTo" defaultValue={discount?.appliesTo ?? "line"} className={SELECT_CLASS}>
            <option value="line">A line</option>
            <option value="order">Whole order</option>
            <option value="both">Either</option>
          </select>
        </Field>
      </div>

      <label className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={discount?.active ?? true}
          className="size-4 rounded border-input accent-[var(--color-primary)]"
        />
        <span className="text-sm text-charcoal">Active</span>
      </label>

      <SubmitButton label={discount ? "Save" : "Add discount"} />
    </form>
  );
}
```

- [ ] **Step 3: Create `.../discounts/page.tsx`**

Mirror the categories page: a "New discount" card with `<DiscountForm action={saveDiscountAction} businessId={businessId} />`, then a `Card` containing either an `EmptyState` ("No discounts yet" / "Add one above. Discounts appear on the terminal for the cashier to apply.") or a `Table` whose rows each render a `DiscountForm` bound to that discount and a `ConfirmDelete` with `hidden={{ businessId, id: discount.id }}`. Add a line of body copy under the heading:

> A line takes either a senior/PWD discount or a promo, whichever is higher — never both.

- [ ] **Step 4: Create the owner-wide refund PIN screen**

`src/app/(app)/portal/settings/actions.ts`:

```ts
"use server";

import { setRefundPin } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function setRefundPinAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const pin = String(formData.get("pin") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!/^\d{6}$/.test(pin)) {
    return { fieldErrors: { pin: "The PIN must be exactly 6 digits." } };
  }
  if (pin !== confirm) {
    return { fieldErrors: { confirm: "The two PINs do not match." } };
  }

  try {
    await setRefundPin(pin);
  } catch (error) {
    return toFormState(error, ["pin"]);
  }

  return { done: true };
}
```

`src/app/(app)/portal/settings/refund-pin-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Set refund PIN"}
    </Button>
  );
}

export function RefundPinForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="max-w-sm space-y-4" noValidate>
      {state.done ? <Alert tone="info">Refund PIN updated.</Alert> : null}
      {state.message ? <Alert>{state.message}</Alert> : null}

      <Field
        name="pin"
        label="New refund PIN"
        error={state.fieldErrors?.pin}
        hint="Exactly 6 digits. Four wrong attempts lock a terminal for five minutes."
      >
        <Input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          className="font-mono tracking-widest"
        />
      </Field>

      <Field name="confirm" label="Confirm PIN" error={state.fieldErrors?.confirm}>
        <Input
          name="confirm"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          className="font-mono tracking-widest"
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
```

`src/app/(app)/portal/settings/page.tsx` wraps it in the `/portal` shell (the same
`AppShell` call the business list uses, since this route is outside a business), with the
heading "Settings" and body copy explaining the PIN is shared across every branch and
terminal on the account.

- [ ] **Step 5: Create the per-business settings screen**

`.../[businessId]/settings/actions.ts` calls `updateBusiness(businessId, …)` with the fields
the API accepts. Two conversions matter and must be commented in the code:

```ts
  // The API takes rates as fractions in [0, 0.9999]; the form shows percentages, because
  // "12" is what a person means by 12% VAT. Round to 4 places — the column is Decimal(5,4).
  const taxRate = Math.round((Number(rawTaxPercent) / 100) * 10_000) / 10_000;
```

Guard both rates with `Number.isFinite` and a 0–99.99 range check before dividing, and
return a field error rather than sending `NaN`. `dayStartTime` must match `HH:mm` — validate
with `/^([01]\d|2[0-3]):[0-5]\d$/` and say so inline rather than letting the API 422.

`business-settings-form.tsx` renders: name, type, tax rate (%), service charge (%), day start
time, expiry warning days, allow misc items, receipt header and receipt footer. Reuse
`Field`, `Input` and the `SELECT_CLASS` pattern above.

- [ ] **Step 6: Write the two tests**

`.../discounts/discount-form.test.tsx` must cover:
- creating a percentage discount posts `kind=percent` and the raw number
- switching the type to **Fixed amount** relabels the value field from "Percent" to "Amount"
- an existing fixed discount shows its value in pesos (`value: 5000` → `"50.00"`)
- an existing percentage discount shows the bare number (`value: 10` → `"10"`)
- a field error lands on the value input

`src/app/(app)/portal/settings/refund-pin-form.test.tsx` must cover:
- a matching 6-digit PIN posts both fields
- a mismatch shows on the confirm field
- the success state renders "Refund PIN updated"
- the input is `type="password"`, so a PIN is never shoulder-surfed

Write them in the same style as Task 4's tests: stub the action with `vi.fn()`, drive with
`userEvent`, assert on the `FormData` and on accessible descriptions.

- [ ] **Step 7: Run the tests, lint and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(app\)/portal
git commit -m "feat: manage discounts, business settings and the refund PIN"
```

---

### Task 9: Branches

**Files:**
- Create: `.../[businessId]/branches/page.tsx`, `actions.ts`, `branch-form.tsx`
- Test: `.../branches/branch-form.test.tsx`

**Interfaces:**
- Consumes: `listBranches`, `createBranch`, `updateBranch`, `deleteBranch` (Task 2)
- Produces: `saveBranchAction`, `deleteBranchAction`, `<BranchForm action businessId branch?>`

- [ ] **Step 1: Create `.../branches/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createBranch, deleteBranch, updateBranch } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["name", "code", "address"] as const;
const BRANCH_CODE = /^[A-Z0-9]{2,6}$/;

export async function saveBranchAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  if (!BRANCH_CODE.test(code)) {
    return { fieldErrors: { code: "Use 2–6 uppercase letters or digits, for example MKT." } };
  }

  try {
    // The code is part of every receipt number this branch has already issued, so it is
    // never sent on an update — the UI shows it read-only once the branch exists.
    if (id) await updateBranch(id, { name, address });
    else await createBranch(businessId, { name, code, address });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath(`/portal/businesses/${businessId}/branches`);
  return { done: true };
}

export async function deleteBranchAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await deleteBranch(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/branches`);
  return { done: true };
}
```

- [ ] **Step 2: Create `.../branches/branch-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { Branch } from "@/lib/api/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function BranchForm({
  action,
  businessId,
  branch,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  branch?: Branch;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const suffix = branch?.id ?? "new";

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="businessId" value={businessId} />
      {branch ? <input type="hidden" name="id" value={branch.id} /> : null}
      {/* An existing branch still posts its code so the action's validation passes; the
          action deliberately does not send it on to the API. */}
      {branch ? <input type="hidden" name="code" value={branch.code} /> : null}

      {state.message ? (
        <div className="w-full">
          <Alert>{state.message}</Alert>
        </div>
      ) : null}

      <div className="min-w-40 flex-1">
        <Field name={`name-${suffix}`} label="Branch name" error={state.fieldErrors?.name}>
          <Input name="name" defaultValue={branch?.name} placeholder="Marikit" />
        </Field>
      </div>

      {branch ? (
        <div className="w-28">
          <p className="text-sm font-medium text-charcoal">Code</p>
          <p className="mt-2 font-mono text-sm text-steel">{branch.code}</p>
        </div>
      ) : (
        <div className="w-28">
          <Field
            name="code-new"
            label="Code"
            error={state.fieldErrors?.code}
            hint="Cannot change."
          >
            <Input name="code" placeholder="MKT" className="font-mono uppercase" />
          </Field>
        </div>
      )}

      <div className="min-w-56 flex-1">
        <Field name={`address-${suffix}`} label="Address" error={state.fieldErrors?.address}>
          <Input name="address" defaultValue={branch?.address} />
        </Field>
      </div>

      <SubmitButton label={branch ? "Save" : "Add branch"} />
    </form>
  );
}
```

- [ ] **Step 3: Create `.../branches/page.tsx`**

Same shape as the categories page: a "New branch" card with `<BranchForm action={saveBranchAction} businessId={businessId} />`, then a card listing each branch as a `BranchForm` plus a `ConfirmDelete`, with a **Stock** link per row to `${base}/branches/${branch.id}/stock`. Under the heading, this copy:

> A branch code becomes part of every receipt number that branch issues (`MKT-T1-000318`), so it cannot be changed after the branch is created.

Empty state: title "No branches yet", body "A terminal pairs to a branch, so add at least one before setting up a till."

- [ ] **Step 4: Write `.../branches/branch-form.test.tsx`**

Cover: creating posts an uppercased code; a lowercase entry (`mkt`) still posts and the
action uppercases it; an existing branch shows its code as **text, not an input**; editing
posts `id` and `name` but the code field is not editable; a duplicate-code conflict shows on
the code field.

```tsx
  it("shows an existing branch's code as read-only text", () => {
    render(<BranchForm action={vi.fn()} businessId="b-1" branch={BRANCH} />);
    expect(screen.queryByLabelText("Code")).not.toBeInTheDocument();
    expect(screen.getByText("MKT")).toBeInTheDocument();
  });
```

- [ ] **Step 5: Run the tests, lint and build, then commit**

```bash
pnpm test && pnpm lint && pnpm build
git add src/app/\(app\)/portal
git commit -m "feat: manage branches"
```

---

### Task 10: Stock — levels, receiving and adjustments

**Files:**
- Create: `.../branches/[branchId]/stock/page.tsx`, `actions.ts`, `receive-form.tsx`, `adjust-form.tsx`
- Test: `.../stock/receive-form.test.tsx`, `.../stock/adjust-form.test.tsx`

**Interfaces:**
- Consumes: `getStock`, `receiveStock`, `adjustStock`, `getBranch`, `listProducts` (Task 2); `parseQuantity`, `pesosToCentavos` (Task 1)
- Produces:
  - `receiveStockAction`, `adjustStockAction`
  - `<ReceiveForm action businessId branchId products>`, `<AdjustForm action businessId branchId products>`
  - `interface StockOption { value: string; label: string }` — a `productId` or `productId:variantId` pair

- [ ] **Step 1: Create `.../stock/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { adjustStock, receiveStock, type AdjustReason } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";
import { parseQuantity, pesosToCentavos } from "@/lib/money";

const REASONS: AdjustReason[] = [
  "damage",
  "expiry",
  "theft_loss",
  "count_correction",
  "other",
];

/**
 * The selects post `productId` or `productId:variantId` in one value, because a variant is
 * only meaningful alongside its product and two coupled selects would let them disagree.
 */
function splitTarget(raw: string): { productId: string; variantId?: string } | null {
  const [productId, variantId] = raw.split(":");
  if (!productId) return null;
  return variantId ? { productId, variantId } : { productId };
}

export async function receiveStockAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const branchId = String(formData.get("branchId") ?? "");

  const target = splitTarget(String(formData.get("target") ?? ""));
  if (!target) return { fieldErrors: { target: "Choose a product." } };

  const qty = parseQuantity(String(formData.get("qty") ?? ""));
  if (qty === null || qty <= 0) {
    return { fieldErrors: { qty: "Enter a quantity above zero, with at most 3 decimals." } };
  }

  const rawCost = String(formData.get("unitCost") ?? "").trim();
  const unitCostC = rawCost === "" ? undefined : pesosToCentavos(rawCost);
  if (unitCostC === null) {
    return { fieldErrors: { unitCost: "Enter a unit cost, or leave it blank." } };
  }

  const expiryDate = String(formData.get("expiryDate") ?? "").trim();

  try {
    await receiveStock(branchId, [
      {
        ...target,
        qty,
        ...(unitCostC === undefined ? {} : { unitCostC }),
        // The API wants an ISO date-time; a date input gives a bare date.
        ...(expiryDate ? { expiryDate: `${expiryDate}T00:00:00.000Z` } : {}),
      },
    ]);
  } catch (error) {
    return toFormState(error, ["qty", "unitCostC", "expiryDate"]);
  }

  revalidatePath(`/portal/businesses/${businessId}/branches/${branchId}/stock`);
  return { done: true };
}

export async function adjustStockAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const branchId = String(formData.get("branchId") ?? "");

  const target = splitTarget(String(formData.get("target") ?? ""));
  if (!target) return { fieldErrors: { target: "Choose a product." } };

  // NOT a delta — the absolute level you are correcting to. The API records the difference.
  const newQty = parseQuantity(String(formData.get("newQty") ?? ""));
  if (newQty === null) {
    return { fieldErrors: { newQty: "Enter the new count, with at most 3 decimals." } };
  }

  const reason = String(formData.get("reasonCategory") ?? "");
  if (!REASONS.includes(reason as AdjustReason)) {
    return { fieldErrors: { reasonCategory: "Choose a reason." } };
  }

  const note = String(formData.get("note") ?? "").trim();

  try {
    await adjustStock(branchId, {
      ...target,
      newQty,
      reasonCategory: reason as AdjustReason,
      ...(note ? { note } : {}),
    });
  } catch (error) {
    return toFormState(error, ["newQty", "note"]);
  }

  revalidatePath(`/portal/businesses/${businessId}/branches/${branchId}/stock`);
  return { done: true };
}
```

- [ ] **Step 2: Create a shared target select**

Both forms need the same product/variant picker, so put it in
`.../stock/target-select.tsx`:

```tsx
"use client";

import { Field } from "@/components/ui/field";
import type { Product } from "@/lib/api/types";

export interface StockOption {
  value: string;
  label: string;
}

/** Only tracked products can hold stock, so untracked ones never appear. */
export function toOptions(products: Product[]): StockOption[] {
  return products
    .filter((product) => product.trackStock)
    .flatMap((product) =>
      product.variants.length === 0
        ? [{ value: product.id, label: product.name }]
        : product.variants.map((variant) => ({
            value: `${product.id}:${variant.id}`,
            label: `${product.name} — ${variant.name}`,
          })),
    );
}

export function TargetSelect({
  id,
  options,
  error,
}: {
  id: string;
  options: StockOption[];
  error?: string;
}) {
  return (
    <Field name={id} label="Product" error={error}>
      <select
        name="target"
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Choose a product…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
```

A product with variants offers only its variants: stock is held per variant, so receiving
against the parent of a variant product is not a thing the data model allows.

- [ ] **Step 3: Create `receive-form.tsx` and `adjust-form.tsx`**

Both follow the established shape — `useActionState`, hidden `businessId`/`branchId`, a
`TargetSelect`, `Field`-wrapped inputs, a `useFormStatus` submit button, and an
`Alert tone="info"` when `state.done`.

`ReceiveForm` fields: target, **Quantity received** (`name="qty"`, `inputMode="decimal"`),
**Unit cost** (`name="unitCost"`, optional, hint "Overwrites the recorded cost when given"),
**Expiry date** (`name="expiryDate"`, `type="date"`, optional, hint "Only for products that
track expiry").

`AdjustForm` fields: target, **New count** (`name="newQty"`, hint "The corrected total, not
the difference"), **Reason** (a select over the five reason values with human labels: Damage,
Expired, Theft or loss, Count correction, Other), **Note** (`name="note"`, optional).

The "not the difference" hint is required, not optional copy — `newQty` being absolute is the
single most misreadable part of this screen.

- [ ] **Step 4: Create `.../stock/page.tsx`**

Loads `getBranch(branchId)`, `getStock(branchId)` and `listProducts(businessId)` in parallel,
then renders: a heading naming the branch, a levels `Table` (Product, Variant, Quantity —
right-aligned, `font-mono`), and the two forms in `Card`s side by side on `lg`. Empty state
for the levels table: title "No stock recorded", body "Only products with stock tracking
switched on appear here. Receive stock below to start counting."

Wrap the `getBranch` call in the same `NotFoundError → notFound()` pattern the admin pages
use.

- [ ] **Step 5: Write the two tests**

`receive-form.test.tsx`:
- a product with no variants posts `target` as the bare product id
- a product with variants posts `productId:variantId`
- an untracked product never appears as an option (assert via `toOptions`)
- quantity, unit cost and expiry post as typed
- a field error lands on the quantity input

`adjust-form.test.tsx`:
- posts `newQty` and `reasonCategory`
- the reason select offers all five values
- the hint says the count is absolute — assert the form renders text matching `/not the difference/i`
- a note posts when given and the field is optional

- [ ] **Step 6: Run the tests, lint and build, then commit**

```bash
pnpm test && pnpm lint && pnpm build
git add src/app/\(app\)/portal
git commit -m "feat: view stock levels, receive stock and record adjustments"
```

---

### Task 11: Terminals and the activity log

**Files:**
- Create: `.../[businessId]/terminals/page.tsx`, `actions.ts`, `unpair-button.tsx`
- Create: `.../[businessId]/activity/page.tsx`, `activity-filters.tsx`
- Test: `.../terminals/unpair-button.test.tsx`

**Interfaces:**
- Consumes: `listTerminals`, `unpairTerminal`, `listActivity`, `listBranches` (Task 2); `ActivityTable`, `Pagination` (predecessor plan)
- Produces: `unpairTerminalAction`, `<UnpairButton action businessId terminal>`, `<ActivityFilters branches actorType? action? branchId?>`

- [ ] **Step 1: Create `.../terminals/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { unpairTerminal } from "@/lib/api/portal";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function unpairTerminalAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const businessId = String(formData.get("businessId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    await unpairTerminal(id);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/portal/businesses/${businessId}/terminals`);
  return { done: true };
}
```

- [ ] **Step 2: Create `.../terminals/unpair-button.tsx`**

Unpairing is irreversible from the device's side — the terminal 401s on its next request and
someone has to physically re-pair it — so it takes a typed confirmation rather than a single
extra click.

```tsx
"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { Terminal } from "@/lib/api/types";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="destructive" disabled={disabled || pending}>
      {pending ? "Unpairing…" : "Unpair terminal"}
    </Button>
  );
}

export function UnpairButton({
  action,
  businessId,
  terminal,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  businessId: string;
  terminal: Terminal;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState("");

  if (!terminal.paired) {
    return <span className="text-sm text-stone">Not paired</span>;
  }

  if (!armed) {
    return (
      <div className="space-y-2">
        {state.message ? <Alert>{state.message}</Alert> : null}
        <Button size="sm" variant="ghost" onClick={() => setArmed(true)}>
          Unpair
        </Button>
      </div>
    );
  }

  const inputId = `confirm-${terminal.id}`;

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="id" value={terminal.id} />

      {state.message ? <Alert>{state.message}</Alert> : null}

      <p className="text-sm text-charcoal">
        This device stops working immediately and must be paired again in person. Type{" "}
        <span className="font-mono font-medium">{terminal.code}</span> to confirm.
      </p>

      <Label htmlFor={inputId}>Terminal code</Label>
      <Input
        id={inputId}
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        className="font-mono"
      />

      <div className="flex gap-2">
        <SubmitButton disabled={typed.trim().toUpperCase() !== terminal.code.toUpperCase()} />
        <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create `.../terminals/page.tsx`**

A table of Name, Code, Branch, Last seen, Status, and the `UnpairButton`. Resolve branch
names from `listBranches(businessId)`. Show `paired` as a `Badge` — `success` "Paired" or
`neutral` "Not paired" — and render `lastSeenAt` with `formatManilaDateTime`, or an em dash
when null. Empty state: "No terminals yet" / "Pair a device from the terminal app using this
business's pairing code."

- [ ] **Step 4: Create `.../activity/page.tsx` and `activity-filters.tsx`**

Reuse `ActivityTable` and `Pagination` from the predecessor plan unchanged. `ActivityFilters`
follows `ProductFilters` from Task 5: a form that pushes `?actorType=&branchId=&action=&page=`
into the URL via `router.replace`, with a branch select built from `listBranches`.

The actor filter offers only **Owner** and **Terminal** — `platform_admin` is not an accepted
value on this endpoint, and platform rows are excluded from a tenant's log by the API's
scoping regardless.

Pass the current filters through to `Pagination`'s `query` prop so paging does not drop them.

- [ ] **Step 5: Write `.../terminals/unpair-button.test.tsx`**

Cover:
- an unpaired terminal renders "Not paired" and no button
- the first click does not submit
- the confirm button stays disabled until the code is typed
- a lowercase match still enables it (`mkt-t1` for `MKT-T1`)
- once enabled, submitting posts `businessId` and `id`
- Cancel returns to the idle state without submitting

- [ ] **Step 6: Run the tests, lint and build, then commit**

```bash
pnpm test && pnpm lint && pnpm build
git add src/app/\(app\)/portal
git commit -m "feat: list terminals, unpair them, and read the activity log"
```

---

### Task 12: Live coverage and documentation

**Files:**
- Create: `src/test/integration/live-portal.test.ts`
- Modify: `README.md`, `docs/superpowers/specs/2026-09-06-bo-portal-platform-admin-design.md`

**Interfaces:**
- Consumes: everything
- Produces: an owner-path live suite alongside the admin one

- [ ] **Step 1: Create `src/test/integration/live-portal.test.ts`**

Same shape as `live-admin.test.ts` — a local `call()` helper, `describe.skip` unless the env
is set — but signing in as an **owner**, who needs no TOTP:

```ts
/**
 * The owner path, end to end, against a running sentry-pos-be.
 *
 * Opt-in: skipped unless PORTAL_E2E_API_URL is set. An owner signs in with a password alone,
 * so unlike the admin suite this needs no TOTP code and can run unattended.
 *
 *   PORTAL_E2E_API_URL=http://localhost:4000/v1 \
 *   PORTAL_E2E_OWNER_EMAIL=maria@kapediaria.ph \
 *   PORTAL_E2E_OWNER_PASSWORD=sentry-demo \
 *   pnpm test:integration
 */
```

It must prove, in order:

1. **Sign-in returns a real token pair** — an owner gets `accessToken`, not a preauth token.
2. **The business list is non-empty**, and every business belongs to this owner.
3. **A category round-trips** — create, appears in the list, rename, delete.
4. **A product round-trips with a variant** — create with one variant, read it back, and
   assert `priceC` came back as the exact integer sent. This is the money-path proof.
5. **The variant replace-set behaves as documented** — PATCH with a second variant and both
   exist; PATCH with only the first and the second is gone; PATCH **omitting** `variants`
   entirely and the survivor is untouched. That third case is the one a refactor breaks.
6. **A duplicate SKU is a 409**, not a 500.
7. **A 4-decimal quantity is rejected** — `POST .../stock/adjustments` with `newQty: 1.2345`
   returns `validation`, confirming `parseQuantity`'s guard matches the API.
8. **Branch code validation matches** — `code: "toolongcode"` is a `validation` error.
9. **The refund PIN endpoint accepts exactly 6 digits** and rejects 5.
10. **Everything created is deleted at the end**, so the suite can run repeatedly against the
    same seeded database.

Give each created record a name suffixed with a per-run stamp (`process.env.PORTAL_E2E_STAMP ?? String(process.pid)`), exactly as the admin suite does.

- [ ] **Step 2: Run both live suites against a real backend**

```bash
# in ../sentry-pos-be
npm run db:up && npx prisma migrate deploy && npm run db:seed && npm run start:dev
```

```bash
PORTAL_E2E_API_URL=http://localhost:4000/v1 \
PORTAL_E2E_OWNER_EMAIL=maria@kapediaria.ph \
PORTAL_E2E_OWNER_PASSWORD=sentry-demo \
pnpm test:integration
```

**Report the real result.** A failure here is a contract drift worth fixing, not a test to
loosen. In particular, if case 5 fails, the replace-set handling in Task 6 is wrong and the
product editor is silently deleting variants.

- [ ] **Step 3: Update the README**

In the **What the portal does not do yet** list, remove catalog, discounts, refund PIN,
branches, stock and terminals — they exist now. Leave dashboard, analytics, notifications,
stock transfers, CSV export and staff roles, which still have no API. Add
`PORTAL_E2E_OWNER_EMAIL` / `PORTAL_E2E_OWNER_PASSWORD` to the Testing section.

Add one short subsection under **The authenticated app**, because it is the sharpest edge in
this plan:

> **Replace-set writes.** A product's `variants`, a modifier group's `modifiers` and a
> product's linked `groupIds` are each sent as the complete desired list. Present replaces,
> absent leaves alone, `[]` clears. A form that shows only some of them must omit the key
> rather than post a partial list — posting a subset deletes the rest.

- [ ] **Step 4: Update the spec's status line**

Change `**Status:** approved, ready for planning` to record what is built and what is not,
naming the two plans. Keep the non-goals list unchanged — none of it became possible.

- [ ] **Step 5: Run everything one last time**

```bash
pnpm test && pnpm lint && pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add src/test/integration README.md docs/superpowers/specs
git commit -m "test: cover the owner path live, and document the portal's surfaces"
```

---

## Definition of done

- `pnpm test` green; `pnpm lint` clean; `pnpm build` succeeds.
- Both live suites green against a running `sentry-pos-be`.
- An owner can, in a browser, with no shell: sign in, pick a business, create a category, create a product with variants and modifiers, set a discount, add a branch, receive and adjust stock, see their terminals, unpair one, read their activity log, and set the refund PIN.
- A product created in the portal appears in the POS terminal's catalog.
- The marketing site, the CMS and the admin panel are unchanged in behaviour.

## What this plan still leaves out

Dashboard, analytics, notifications and low-stock alerts, inter-branch stock transfers, CSV
export, staff accounts and roles, and product images. Every one of them needs backend work
that does not exist yet; each gets its own spec when it does.

One known gap inside what is built: the API has no read for a product's linked modifier
groups, so that editor cannot show the current selection and says so on screen. Remove the
warning in Task 7 Step 4 when `GET /portal/products/:id` starts returning them.

