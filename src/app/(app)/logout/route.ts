import { NextResponse } from "next/server";
import { logout } from "@/lib/api/auth";
import { clearSession, readRefreshToken } from "@/lib/auth/session";

/**
 * A Route Handler rather than a Server Action because it must clear cookies and redirect
 * with no form involved. The API call revokes the refresh token server-side; the local
 * cookies are cleared either way, so a signed-out browser never keeps a usable session even
 * if the API is unreachable.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const refreshToken = await readRefreshToken();
  if (refreshToken) {
    try {
      await logout(refreshToken);
    } catch {
      // An unreachable API must not trap someone in a session they asked to leave.
    }
  }
  await clearSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
