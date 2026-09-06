import { NextResponse, type NextRequest } from "next/server";
import { decodeJwtPayload, needsRefresh } from "@/lib/auth/jwt";

/**
 * The guard for `/portal` and `/admin`, and the ONLY place that refreshes a token.
 *
 * Two things force refresh to live here rather than in the data layer. Next forbids cookie
 * writes during a Server Component render, so a refresh triggered by a page's own fetch
 * could not persist its result. And the API rotates refresh tokens with reuse detection —
 * replaying a rotated token revokes every active session for that user — so two concurrent
 * refreshes do not merely race, the loser signs the operator out everywhere. Middleware
 * runs once per request, before any render, and can write to the response: exactly the
 * single-threaded choke point that behaviour needs.
 *
 * Role routing here is convenience, not security. The payload is decoded without checking
 * its signature; the API's PortalAuthGuard and AdminGuard are what actually enforce access.
 */

const ACCESS_COOKIE = "sentry_at";
const REFRESH_COOKIE = "sentry_rt";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const wantsAdmin = pathname.startsWith("/admin");

  let access = request.cookies.get(ACCESS_COOKIE)?.value ?? null;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value ?? null;
  let rotated: TokenPair | null = null;

  // A prefetch racing a real navigation is the one way two refreshes can overlap, and the
  // cost of that collision is every session revoked. A prefetched page that 401s costs
  // nothing — it is discarded before anyone sees it.
  const isPrefetch =
    request.headers.get("next-router-prefetch") !== null ||
    request.headers.get("purpose") === "prefetch";

  if (!isPrefetch && refresh && needsRefresh(access, Date.now())) {
    rotated = await requestRefresh(refresh);
    if (!rotated) return signOut(request, pathname + search);
    access = rotated.accessToken;
    // Make the render that follows see the new token rather than the stale one.
    request.cookies.set(ACCESS_COOKIE, rotated.accessToken);
    request.cookies.set(REFRESH_COOKIE, rotated.refreshToken);
  }

  if (!access) return redirectToLogin(request, pathname + search);

  const payload = decodeJwtPayload(access);
  // `kind: "preauth"` means the password step passed but TOTP did not. Every API guard
  // rejects it, so treat it as no session at all.
  if (!payload || payload.kind === "preauth") return signOut(request, pathname + search);

  const isAdmin = payload.role === "platform_admin";
  if (wantsAdmin && !isAdmin) {
    return NextResponse.redirect(new URL("/portal", request.nextUrl));
  }
  if (!wantsAdmin && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.nextUrl));
  }

  const response = NextResponse.next({ request: { headers: request.headers } });
  if (rotated) {
    setSessionCookie(response, ACCESS_COOKIE, rotated.accessToken);
    setSessionCookie(response, REFRESH_COOKIE, rotated.refreshToken);
  }
  return response;
}

function redirectToLogin(request: NextRequest, next: string): NextResponse {
  const url = new URL("/login", request.nextUrl);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

function signOut(request: NextRequest, next: string): NextResponse {
  const response = redirectToLogin(request, next);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

/** Returns the rotated pair, or null for any failure — expired, revoked, or unreachable. */
async function requestRefresh(refreshToken: string): Promise<TokenPair | null> {
  const base = process.env.API_URL?.trim().replace(/\/+$/, "");
  if (!base) return null;

  try {
    const response = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return null;
    const pair = body as Record<string, unknown>;
    if (typeof pair.accessToken !== "string" || typeof pair.refreshToken !== "string") {
      return null;
    }
    return { accessToken: pair.accessToken, refreshToken: pair.refreshToken };
  } catch {
    // The API being down must not turn into a 500 on every page. Sign out instead.
    return null;
  }
}

function setSessionCookie(response: NextResponse, name: string, value: string): void {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}
