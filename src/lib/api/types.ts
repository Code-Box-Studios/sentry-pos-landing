/**
 * Response shapes, mirroring the Prisma models the API returns.
 *
 * Written by hand on purpose: the backend's `openapi.json` documents request bodies only, so
 * a generated client would type every response as `unknown`. Dates arrive as ISO strings
 * because they crossed JSON — never `Date`.
 */

export type OwnerStatus = "active" | "suspended" | "hard_suspended" | "closed";

export interface Owner {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  email: string;
  status: OwnerStatus;
  maxBusinesses: number;
  suspendedAt: string | null;
}

export type BusinessType = "retail" | "fnb" | "mixed";

export interface Business {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  ownerId: string;
  name: string;
  type: BusinessType;
  currency: string;
  /** Decimal(5,4) — serialises as a string, e.g. "0.1200". */
  taxRate: string;
  serviceChargeRate: string;
  allowMiscItems: boolean;
  isDemo: boolean;
  dayStartTime: string;
  expiryWarningDays: number;
  logoPath: string | null;
  receiptHeader: string;
  receiptFooter: string;
}

export interface Branch {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  businessId: string;
  name: string;
  /** Immutable after creation: it is part of every receipt number this branch issues. */
  code: string;
  address: string;
}

export type ActorType = "owner" | "terminal" | "platform_admin";

export interface AuditEntry {
  id: string;
  createdAt: string;
  actorType: ActorType;
  actorId: string | null;
  ownerId: string | null;
  businessId: string | null;
  branchId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: unknown;
  metadata: unknown;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

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
  /** 1-100 when kind is "percent"; centavos when kind is "fixed". */
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
