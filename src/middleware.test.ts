// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { middleware } = await import("./middleware");

const now = Date.now();

function makeToken(payload: Record<string, unknown>): string {
  const seg = (o: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${seg({ alg: "HS256", typ: "JWT" })}.${seg(payload)}.sig`;
}

/** A token with ten minutes left — comfortably outside the 120s refresh skew. */
function freshToken(role: string): string {
  return makeToken({ sub: "u-1", role, sid: "s-1", exp: Math.floor(now / 1000) + 600 });
}

function staleToken(role: string): string {
  return makeToken({ sub: "u-1", role, sid: "s-1", exp: Math.floor(now / 1000) - 10 });
}

function request(
  path: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {},
): NextRequest {
  const req = new NextRequest(new URL(`http://localhost:3100${path}`), { headers });
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value);
  return req;
}

beforeEach(() => {
  vi.stubEnv("API_URL", "http://localhost:4000/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("unauthenticated access", () => {
  it("sends a visitor with no cookies to the login page, remembering where they were going", async () => {
    const res = await middleware(request("/portal/businesses/b-1/catalog"));
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/portal/businesses/b-1/catalog");
  });
});

describe("role routing", () => {
  it("lets an owner through to the portal", async () => {
    const res = await middleware(request("/portal", { sentry_at: freshToken("owner") }));
    expect(res.headers.get("location")).toBeNull();
  });

  it("turns an owner away from the admin panel", async () => {
    const res = await middleware(request("/admin/owners", { sentry_at: freshToken("owner") }));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/portal");
  });

  it("turns a platform admin away from the tenant portal", async () => {
    const res = await middleware(
      request("/portal", { sentry_at: freshToken("platform_admin") }),
    );
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin");
  });

  it("rejects a preauth token outright — the TOTP step is not finished", async () => {
    const preauth = makeToken({
      sub: "u-1",
      role: "platform_admin",
      kind: "preauth",
      exp: Math.floor(now / 1000) + 600,
    });
    const res = await middleware(request("/admin", { sentry_at: preauth }));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });
});

describe("refresh", () => {
  it("refreshes an expiring token and writes the rotated pair back", async () => {
    const rotated = freshToken("owner");
    const spy = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ accessToken: rotated, refreshToken: "new-refresh" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    vi.stubGlobal("fetch", spy);

    const res = await middleware(
      request("/portal", { sentry_at: staleToken("owner"), sentry_rt: "old-refresh" }),
    );

    expect(spy).toHaveBeenCalledOnce();
    const [url, init] = spy.mock.calls[0] as unknown as [string | URL, RequestInit];
    expect(String(url)).toBe("http://localhost:4000/v1/auth/refresh");
    expect(init.body).toBe(JSON.stringify({ refreshToken: "old-refresh" }));

    expect(res.cookies.get("sentry_at")?.value).toBe(rotated);
    expect(res.cookies.get("sentry_rt")?.value).toBe("new-refresh");
    expect(res.headers.get("location")).toBeNull();
  });

  it("leaves a healthy token alone", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    await middleware(request("/portal", { sentry_at: freshToken("owner"), sentry_rt: "r" }));
    expect(spy).not.toHaveBeenCalled();
  });

  it("never refreshes on a prefetch — a prefetch racing a navigation is what revokes sessions", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    const res = await middleware(
      request(
        "/portal",
        { sentry_at: staleToken("owner"), sentry_rt: "r" },
        { "next-router-prefetch": "1" },
      ),
    );
    expect(spy).not.toHaveBeenCalled();
    // The stale token still routes; the page it prefetches will simply 401 and be discarded.
    expect(res.headers.get("location")).toBeNull();
  });

  it("clears both cookies and redirects when the refresh token is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ code: "unauthorized", message: "no" }), { status: 401 }),
        ),
      ),
    );
    const res = await middleware(
      request("/portal", { sentry_at: staleToken("owner"), sentry_rt: "revoked" }),
    );
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    expect(res.cookies.get("sentry_at")?.value).toBe("");
    expect(res.cookies.get("sentry_rt")?.value).toBe("");
  });

  it("redirects rather than throwing when the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("fetch failed"))),
    );
    const res = await middleware(
      request("/portal", { sentry_at: staleToken("owner"), sentry_rt: "r" }),
    );
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });
});
