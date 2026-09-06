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
