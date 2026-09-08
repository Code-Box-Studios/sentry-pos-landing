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
