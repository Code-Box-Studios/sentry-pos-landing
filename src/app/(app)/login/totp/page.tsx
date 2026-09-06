import { redirect } from "next/navigation";
import { AuthCard } from "@/components/app/auth-card";
import { readPreauthToken } from "@/lib/auth/session";
import { verifyTotpAction } from "./actions";
import { TotpForm } from "./totp-form";

export default async function TotpPage() {
  if (!(await readPreauthToken())) redirect("/login");

  return (
    <AuthCard
      title="Two-factor authentication"
      subtitle="Enter the code from your authenticator app to finish signing in."
    >
      <TotpForm action={verifyTotpAction} label="Verify" />
    </AuthCard>
  );
}
