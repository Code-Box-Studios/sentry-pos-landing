import { AuthCard } from "@/components/app/auth-card";
import { StaffSetupForm } from "./setup-form";
import { setupStaffAction } from "./actions";
export default async function StaffSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const passwordOnly = (await searchParams).mode === "password";
  return (
    <AuthCard
      title={
        passwordOnly
          ? "Change your portal password"
          : "Set up your manager access"
      }
      subtitle="Use the temporary PIN your business owner emailed. Normal access begins only after setup is complete."
    >
      <StaffSetupForm action={setupStaffAction} passwordOnly={passwordOnly} />
    </AuthCard>
  );
}
