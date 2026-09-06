import "server-only";
import { cookies } from "next/headers";

/**
 * The auth cookies, and the only place their names and flags are decided.
 *
 * The names matter more than they look: Payload CMS runs inside this same app and owns
 * `payload-token`. A collision would sign an operator out of the CMS every time they used
 * the portal, and vice versa.
 *
 * Nothing here is readable from JavaScript — every cookie is httpOnly. The browser holds a
 * session; only the server holds a token.
 */

export const ACCESS_COOKIE = "sentry_at";
export const REFRESH_COOKIE = "sentry_rt";
export const PREAUTH_COOKIE = "sentry_preauth";

/** Matches REFRESH_TTL_DAYS in the API. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/** Matches PREAUTH_TTL in the API — the window between password and TOTP. */
const PREAUTH_MAX_AGE = 300;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    // Plain HTTP in dev would drop a Secure cookie outright.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function readAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  return (await cookies()).get(REFRESH_COOKIE)?.value ?? null;
}

export async function readPreauthToken(): Promise<string | null> {
  return (await cookies()).get(PREAUTH_COOKIE)?.value ?? null;
}

/**
 * The access cookie gets the same 30-day life as the refresh cookie on purpose. The access
 * *token* still expires in 15 minutes — its own `exp` is the real boundary, and middleware
 * refreshes against it. Giving the cookie a 15-minute life instead would delete it while
 * the session was still perfectly valid.
 *
 * Only callable from a Server Action or Route Handler; Next forbids cookie writes during a
 * Server Component render.
 */
export async function writeSession(accessToken: string, refreshToken: string): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, cookieOptions(SESSION_MAX_AGE));
  jar.set(REFRESH_COOKIE, refreshToken, cookieOptions(SESSION_MAX_AGE));
}

/** Clears the preauth cookie as well — a dangling TOTP step must not survive a sign-out. */
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(PREAUTH_COOKIE);
}

export async function writePreauthToken(token: string): Promise<void> {
  (await cookies()).set(PREAUTH_COOKIE, token, cookieOptions(PREAUTH_MAX_AGE));
}

export async function clearPreauthToken(): Promise<void> {
  (await cookies()).delete(PREAUTH_COOKIE);
}
