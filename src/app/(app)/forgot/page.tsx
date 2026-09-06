import { AuthCard } from "@/components/app/auth-card";
import { requestResetAction } from "./actions";
import { ForgotForm } from "./forgot-form";

export default function ForgotPage() {
  return (
    <AuthCard title="Reset your password" subtitle="We will email you a link to choose a new one.">
      <ForgotForm action={requestResetAction} />
    </AuthCard>
  );
}
