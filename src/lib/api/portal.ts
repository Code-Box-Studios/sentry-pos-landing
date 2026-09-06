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
  /** Centavos; negative for a price-reducing modifier. */
  priceDeltaC: number;
  name: string;
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

export interface ProductGroupLinks {
  productId: string;
  groupIds: string[];
}

/**
 * PUT, not PATCH: `groupIds` is the complete set of links. `[]` clears them all.
 *
 * There is no matching GET — the API returns the links from this call and nowhere else — so
 * a screen cannot show which groups a product already has.
 */
export function setProductModifierGroups(
  productId: string,
  groupIds: string[],
): Promise<ProductGroupLinks> {
  return apiFetch<ProductGroupLinks>(`/portal/products/${productId}/modifier-groups`, {
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
  /** 1-100 for "percent"; centavos for "fixed". */
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
  /** 2-6 uppercase letters or digits. Part of every receipt number this branch issues. */
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
  /** ISO date-time, for products with trackExpiry. */
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
