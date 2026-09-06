import { AuthCard } from "@/components/app/auth-card";
import { PasswordSetForm } from "@/components/app/password-set-form";
import { Alert } from "@/components/ui/alert";
import { confirmResetAction } from "./actions";

export default async function ConfirmResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="Choose a new password">
        <Alert>
          This link is missing its token. Open the link from your reset email exactly as it was
          sent, or{" "}
          <a href="/forgot" className="underline">
            request a new one
          </a>
          .
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <PasswordSetForm action={confirmResetAction} token={token} submitLabel="Save password" />
    </AuthCard>
  );
}
