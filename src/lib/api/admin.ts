import "server-only";
import { apiFetch } from "./fetch";
import type { ActorType, AuditEntry, Branch, Business, Owner, Paginated } from "./types";

/**
 * Platform-admin endpoints. Everything here sits behind `AdminGuard` on the API.
 *
 * The browse calls are READ-ONLY by contract, not merely by convention: platform scope
 * cannot write tenant data at all — the API's tenancy choke point throws
 * `platform_write_forbidden` if it tries. Do not add a mutation to this module.
 */

export function listOwners(): Promise<Owner[]> {
  return apiFetch<Owner[]>("/admin/owners");
}

export function getOwner(id: string): Promise<Owner> {
  return apiFetch<Owner>(`/admin/owners/${id}`);
}

export interface CreateOwnerInput {
  name: string;
  email: string;
  /** 1–1000. The API rejects anything outside that range with a 422. */
  maxBusinesses: number;
}

/** Also mints a single-use invite and emails it. The owner activates at /invite/accept. */
export function createOwner(input: CreateOwnerInput): Promise<Owner> {
  return apiFetch<Owner>("/admin/owners", { method: "POST", body: input });
}

export function updateOwner(
  id: string,
  input: { name?: string; maxBusinesses?: number },
): Promise<Owner> {
  return apiFetch<Owner>(`/admin/owners/${id}`, { method: "PATCH", body: input });
}

/**
 * `default` → status `suspended`: the portal locks, but an open shift may finish selling.
 * `hard` → status `hard_suspended`: everything stops immediately.
 */
export function suspendOwner(id: string, tier: "default" | "hard"): Promise<Owner> {
  return apiFetch<Owner>(`/admin/owners/${id}/suspend`, { method: "POST", body: { tier } });
}

export function reinstateOwner(id: string): Promise<Owner> {
  return apiFetch<Owner>(`/admin/owners/${id}/reinstate`, { method: "POST" });
}

export function listOwnerBusinesses(ownerId: string): Promise<Business[]> {
  return apiFetch<Business[]>(`/admin/owners/${ownerId}/businesses`);
}

export function listBusinessBranches(businessId: string): Promise<Branch[]> {
  return apiFetch<Branch[]>(`/admin/businesses/${businessId}/branches`);
}

export interface ActivityQuery {
  branchId?: string;
  actorType?: ActorType;
  action?: string;
  /** ISO date-times, inclusive. */
  from?: string;
  to?: string;
  page?: number;
  /** 1–200; the API defaults to 50. */
  pageSize?: number;
}

export function listBusinessActivity(
  businessId: string,
  query: ActivityQuery = {},
): Promise<Paginated<AuditEntry>> {
  return apiFetch<Paginated<AuditEntry>>(`/admin/businesses/${businessId}/activity-log`, {
    query: { ...query },
  });
}
