/**
 * Decodes a JWT payload WITHOUT verifying its signature.
 *
 * Middleware uses this to route by role and to see how much life an access token has left.
 * Neither is a security decision: the API verifies every token it is given, and a forged
 * payload here buys nothing but a redirect to a page whose data fetch will 401. Keeping it
 * signature-free is what lets it run on the Edge runtime with no crypto and no secret.
 */
export interface AccessTokenPayload {
  sub: string;
  role: string;
  sid?: string;
  exp?: number;
  /** `"preauth"` on the short-lived token issued between password and TOTP. */
  kind?: string;
}

export function decodeJwtPayload(token: string): AccessTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const parsed: unknown = JSON.parse(atob(padded));
    if (typeof parsed !== "object" || parsed === null) return null;

    const p = parsed as Record<string, unknown>;
    // A payload without both of these cannot answer either question we ask of it.
    if (typeof p.sub !== "string" || typeof p.role !== "string") return null;

    return {
      sub: p.sub,
      role: p.role,
      sid: typeof p.sid === "string" ? p.sid : undefined,
      exp: typeof p.exp === "number" ? p.exp : undefined,
      kind: typeof p.kind === "string" ? p.kind : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * True when `token` is missing, unreadable, or expires within `skewSeconds`.
 *
 * The skew matters: a token with 5 seconds left would pass a naive check and then expire
 * between the guard and the page's own data fetch, producing a 401 on a request that had
 * just been waved through.
 */
export function needsRefresh(
  token: string | null,
  nowMs: number,
  skewSeconds = 120,
): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 - nowMs < skewSeconds * 1000;
}
