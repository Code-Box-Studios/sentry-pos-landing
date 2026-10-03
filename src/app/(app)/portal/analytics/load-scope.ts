import { getBusiness } from "@/lib/api/portal";
import { listBusinesses, listBranches } from "@/lib/api/portal";
import { getManagerContext } from "@/lib/api/manager";
import { readPortalRole } from "@/lib/auth/portal-role";
import { readScope } from "./scope";
export async function loadScope(params: Parameters<typeof readScope>[0]) {
  if ((await readPortalRole()) === "manager") {
    const context = await getManagerContext();
    // Keep explicitly forged scope for the API to reject, never fetch an owner-only business.
    return readScope(
      { ...params, businessId: params.businessId ?? context.business.id },
      context.business.dayStartTime,
    );
  }
  const business =
    params.businessId && (!params.from || !params.to)
      ? await getBusiness(params.businessId)
      : null;
  return readScope(params, business?.dayStartTime);
}
export async function loadAnalyticsChoices(businessId?: string) {
  if ((await readPortalRole()) === "manager") {
    const context = await getManagerContext();
    return {
      role: "manager" as const,
      businesses: [context.business],
      branches: context.branches.map((branch) => ({
        ...branch,
        businessId: context.business.id,
      })),
    };
  }
  const [businesses, branches] = await Promise.all([
    listBusinesses(),
    businessId ? listBranches(businessId) : Promise.resolve([]),
  ]);
  return { role: "owner" as const, businesses, branches };
}
