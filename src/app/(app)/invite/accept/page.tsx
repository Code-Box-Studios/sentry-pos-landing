import { AuthCard } from "@/components/app/auth-card";
import { PasswordSetForm } from "@/components/app/password-set-form";
import { Alert } from "@/components/ui/alert";
import { acceptInviteAction } from "./actions";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="Activate your account">
        <Alert>
          This link is missing its token. Open the link from your invitation email exactly as it
          was sent.
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Activate your account"
      subtitle="Choose a password to finish setting up your Sentry account."
    >
      <PasswordSetForm action={acceptInviteAction} token={token} submitLabel="Activate account" />
    </AuthCard>
  );
}
