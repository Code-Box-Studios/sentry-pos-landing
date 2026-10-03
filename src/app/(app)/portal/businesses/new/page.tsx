import { AppShell } from "@/components/app/app-shell";
import { PORTAL_NAV } from "@/components/app/portal-nav";
import { BusinessForm } from "./business-form";
export default function NewBusinessPage() {
  return (
    <AppShell title="Sentry" nav={PORTAL_NAV}>
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Create a business</h1>
        <BusinessForm />
      </div>
    </AppShell>
  );
}
