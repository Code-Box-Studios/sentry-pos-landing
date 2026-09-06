import { AuthCard } from "@/components/app/auth-card";
import { loginAction } from "./actions";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthCard title="Sign in to Sentry">
      <LoginForm action={loginAction} next={next} />
    </AuthCard>
  );
}
