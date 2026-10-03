import { CloseAccountForm } from "./lifecycle-forms";
import { PORTAL_NAV } from "@/components/app/portal-nav";
import { AppShell } from "@/components/app/app-shell";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { setRefundPinAction } from "./actions";
import { RefundPinForm } from "./refund-pin-form";

export default function PortalSettingsPage() {
  return (
    <AppShell title="Sentry" nav={PORTAL_NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Settings</h1>
          <p className="mt-1 text-sm text-steel">
            These apply to your whole account, not to a single business.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Owner terminal PIN</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-steel">
              Your personal six-digit PIN unlocks your terminals and authorises your refunds.
              Enter it yourself to approve a cashier’s void, refund or stock adjustment.
              Staff use their own PINs; do not share yours. It is never shown again once set.
            </p>
            <RefundPinForm action={setRefundPinAction} />
          </CardBody>
        </Card>
        <CloseAccountForm />
      </div>
    </AppShell>
  );
}
