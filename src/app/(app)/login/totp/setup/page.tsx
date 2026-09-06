import { redirect } from "next/navigation";
import { AuthCard } from "@/components/app/auth-card";
import { QrCode } from "@/components/app/qr-code";
import { totpSetup } from "@/lib/api/auth";
import { readPreauthToken } from "@/lib/auth/session";
import { enableTotpAction } from "../actions";
import { SetupForm } from "./setup-form";

export default async function TotpSetupPage() {
  const preAuthToken = await readPreauthToken();
  if (!preAuthToken) redirect("/login");

  const { secret, otpauthUri } = await totpSetup(preAuthToken);

  return (
    <AuthCard
      title="Set up two-factor authentication"
      subtitle="Platform admin accounts require an authenticator app. Scan this once, then confirm."
    >
      <div className="space-y-4">
        <div className="text-center">
          <QrCode value={otpauthUri} />
        </div>
        <div className="rounded-lg border border-hairline bg-surface px-3 py-2">
          <p className="text-xs text-steel">Or enter this key by hand</p>
          <p className="mt-1 font-mono text-sm break-all text-charcoal">{secret}</p>
        </div>
        <SetupForm action={enableTotpAction} />
      </div>
    </AuthCard>
  );
}
