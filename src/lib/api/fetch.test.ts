import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ accessToken: "session-access-token" as string | null }));
vi.mock("@/lib/auth/session", () => ({
  readAccessToken: () => Promise.resolve(session.accessToken),
}));

const { apiFetch, apiBaseUrl } = await import("./fetch");
const { ConflictError, NetworkError, UnauthorizedError, ValidationError } = await import(
  "./errors"
);

/**
 * One-shot fetch stub. Each call returns a freshly minted Response — a Response body can
 * only be read once, so reusing one across calls fails with "Body is unusable".
 */
function stubFetch(
  make: () => { status: number; body?: unknown; text?: string },
): ReturnType<typeof vi.fn> {
  const spy = vi.fn(() => {
    const { status, body, text } = make();
    const payload = text !== undefined ? text : body === undefined ? "" : JSON.stringify(body);
    return Promise.resolve(
      new Response(status === 204 ? null : payload, {
        status,
        headers: { "content-type": "application/json" },
      }),
    );
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

beforeEach(() => {
  session.accessToken = "session-access-token";
  vi.stubEnv("API_URL", "http://localhost:4000/v1");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("apiBaseUrl", () => {
  it("strips trailing slashes so paths concatenate cleanly", () => {
    vi.stubEnv("API_URL", "http://localhost:4000/v1///");
    expect(apiBaseUrl()).toBe("http://localhost:4000/v1");
  });

  it("throws a named error when API_URL is unset, rather than fetching a relative URL", () => {
    vi.stubEnv("API_URL", "");
    expect(() => apiBaseUrl()).toThrow(/API_URL/);
  });
});

describe("apiFetch", () => {
  it("attaches the session access token as a bearer", async () => {
    const spy = stubFetch(() => ({ status: 200, body: { ok: true } }));
    await apiFetch("/portal/businesses");
    const [url, init] = spy.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("http://localhost:4000/v1/portal/businesses");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer session-access-token");
  });

  it("prefers an explicit token over the cookie, for the preauth TOTP calls", async () => {
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await apiFetch("/auth/totp/setup", { method: "POST", token: "preauth-token" });
    const [, init] = spy.mock.calls[0] as unknown as [URL, RequestInit];
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer preauth-token");
  });

  it("sends no Authorization header when the endpoint takes no credentials", async () => {
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await apiFetch("/auth/login", {
      method: "POST",
      body: { email: "a@b.co", password: "x" },
      authenticated: false,
    });
    const [, init] = spy.mock.calls[0] as unknown as [URL, RequestInit];
    expect(new Headers(init.headers).get("authorization")).toBeNull();
    expect(init.body).toBe(JSON.stringify({ email: "a@b.co", password: "x" }));
  });

  it("fails before the network when a credentialed call has no session", async () => {
    session.accessToken = null;
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await expect(apiFetch("/portal/businesses")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("appends only the query params that have a value", async () => {
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await apiFetch("/admin/businesses/b-1/activity-log", {
      query: { page: 2, pageSize: 50, actorType: undefined },
    });
    const [url] = spy.mock.calls[0] as unknown as [URL];
    expect(url.search).toBe("?page=2&pageSize=50");
  });

  it("never caches — portal data is per-user and must not be shared", async () => {
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await apiFetch("/portal/businesses");
    const [, init] = spy.mock.calls[0] as unknown as [URL, RequestInit];
    expect(init.cache).toBe("no-store");
  });

  it("returns undefined for 204, which the reset endpoints answer with", async () => {
    stubFetch(() => ({ status: 204 }));
    await expect(
      apiFetch("/auth/password-reset/request", {
        method: "POST",
        body: { email: "a@b.co" },
        authenticated: false,
      }),
    ).resolves.toBeUndefined();
  });

  it("throws the mapped error for a failure envelope", async () => {
    stubFetch(() => ({
      status: 422,
      body: { code: "validation", message: "email must be an email", requestId: "req-9" },
    }));
    const err = await apiFetch("/admin/owners", { method: "POST", body: {} }).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).requestId).toBe("req-9");
  });

  it("maps a 409 onto ConflictError so a duplicate email lands on the field", async () => {
    stubFetch(() => ({
      status: 409,
      body: { code: "email_taken", message: "This email is already in use." },
    }));
    await expect(apiFetch("/admin/owners", { method: "POST", body: {} })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("survives a non-JSON error body instead of throwing a parse error", async () => {
    stubFetch(() => ({ status: 502, text: "<html>Bad Gateway</html>" }));
    const err = (await apiFetch("/portal/businesses").catch((e: unknown) => e)) as ConflictError;
    expect(err.code).toBe("internal_error");
    expect(err.status).toBe(502);
  });

  it("turns a transport failure into NetworkError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("fetch failed"))),
    );
    await expect(apiFetch("/portal/businesses")).rejects.toBeInstanceOf(NetworkError);
  });
});
