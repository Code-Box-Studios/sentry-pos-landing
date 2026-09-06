import { AppShell } from "@/components/app/app-shell";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { setRefundPinAction } from "./actions";
import { RefundPinForm } from "./refund-pin-form";

const NAV = [
  { href: "/portal", label: "Businesses" },
  { href: "/portal/settings", label: "Settings" },
];

export default function PortalSettingsPage() {
  return (
    <AppShell title="Sentry" nav={NAV}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Settings</h1>
          <p className="mt-1 text-sm text-steel">
            These apply to your whole account, not to a single business.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Refund PIN</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-steel">
              A cashier enters this to authorise a refund or a void. It is shared by every
              branch and terminal on the account, and it is never shown again once set.
            </p>
            <RefundPinForm action={setRefundPinAction} />
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
