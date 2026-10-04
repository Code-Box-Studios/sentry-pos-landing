import { SignInShell } from "./sign-in-shell";
import { loginAction } from "./actions";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <SignInShell>
      <LoginForm action={loginAction} next={next} />
    </SignInShell>
  );
}
