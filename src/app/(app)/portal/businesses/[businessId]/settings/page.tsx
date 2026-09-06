import Link from "next/link";
import { getBusiness } from "@/lib/api/portal";
import { saveBusinessSettingsAction } from "./actions";
import { BusinessSettingsForm } from "./business-settings-form";

export default async function BusinessSettingsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const business = await getBusiness(businessId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-steel">
          These apply to {business.name} only. The refund PIN is account-wide and lives in{" "}
          <Link href="/portal/settings" className="text-brand-green-dark hover:underline">
            account settings
          </Link>
          .
        </p>
      </div>

      <BusinessSettingsForm action={saveBusinessSettingsAction} business={business} />
    </div>
  );
}
