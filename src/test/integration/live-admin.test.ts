/**
 * The onboarding path, end to end, against a running sentry-pos-be.
 *
 * Opt-in: skipped unless PORTAL_E2E_API_URL is set. It talks to the API directly rather
 * than through `src/lib/api/`, because those modules read cookies through `next/headers`,
 * which has no meaning outside a request. What is under test here is the CONTRACT — that
 * every endpoint the admin panel calls exists, takes what we send it, and returns what we
 * expect. A drift in any of those is exactly the failure the unit suite cannot see.
 *
 *   cd ../sentry-pos-be && npm run start:dev
 *   PORTAL_E2E_API_URL=http://localhost:4000/v1 \
 *   PORTAL_E2E_ADMIN_EMAIL=admin@sentry.local \
 *   PORTAL_E2E_ADMIN_PASSWORD=... \
 *   PORTAL_E2E_ADMIN_TOTP=123456 \
 *   pnpm test:integration
 *
 * The TOTP code is a live six-digit value, so run this within its 30-second window.
 */
import { beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.PORTAL_E2E_API_URL;
const EMAIL = process.env.PORTAL_E2E_ADMIN_EMAIL;
const PASSWORD = process.env.PORTAL_E2E_ADMIN_PASSWORD;
const TOTP = process.env.PORTAL_E2E_ADMIN_TOTP;

const live = BASE && EMAIL && PASSWORD ? describe : describe.skip;

interface Envelope {
  code?: string;
  message?: string;
  requestId?: string;
}

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (init.token) headers.authorization = `Bearer ${init.token}`;

  const response = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const envelope = parsed as Envelope;
    throw new Error(
      `${init.method ?? "GET"} ${path} → ${response.status} ${envelope?.code}: ${envelope?.message}`,
    );
  }
  return parsed as T;
}

live("platform admin onboarding", () => {
  let accessToken: string;
  /** Unique per run so the suite can be run repeatedly without colliding on email. */
  const stamp = process.env.PORTAL_E2E_STAMP ?? String(process.pid);
  const ownerEmail = `portal-e2e-${stamp}@example.test`;

  beforeAll(async () => {
    const result = await call<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: { email: EMAIL, password: PASSWORD },
    });

    if (typeof result.accessToken === "string") {
      // An owner account, or an admin whose TOTP is somehow disabled.
      accessToken = result.accessToken;
      return;
    }

    // A platform admin gets a preauth token and nothing else, by design.
    expect(result.preAuthToken, "expected a preauth token for a platform admin").toBeTypeOf(
      "string",
    );
    if (result.totpSetupRequired) {
      throw new Error(
        "This admin has not enrolled TOTP yet. Complete /login/totp/setup in the browser first.",
      );
    }
    if (!TOTP) throw new Error("PORTAL_E2E_ADMIN_TOTP is required for a TOTP-enrolled admin.");

    const verified = await call<{ accessToken: string }>("/auth/totp/verify", {
      method: "POST",
      body: { preAuthToken: result.preAuthToken, code: TOTP },
    });
    accessToken = verified.accessToken;
  });

  it("rejects the owner list without a token", async () => {
    await expect(call("/admin/owners")).rejects.toThrow(/401|unauthorized/i);
  });

  it("lists owners", async () => {
    const owners = await call<unknown[]>("/admin/owners", { token: accessToken });
    expect(Array.isArray(owners)).toBe(true);
  });

  it("creates an owner, which mints an invite", async () => {
    const owner = await call<{ id: string; email: string; status: string; maxBusinesses: number }>(
      "/admin/owners",
      {
        method: "POST",
        body: { name: `Portal E2E ${stamp}`, email: ownerEmail, maxBusinesses: 2 },
        token: accessToken,
      },
    );

    expect(owner.id).toBeTypeOf("string");
    expect(owner.email).toBe(ownerEmail);
    expect(owner.status).toBe("active");
    expect(owner.maxBusinesses).toBe(2);
  });

  it("rejects a duplicate email with email_taken, not a 500", async () => {
    await expect(
      call("/admin/owners", {
        method: "POST",
        body: { name: "Duplicate", email: ownerEmail, maxBusinesses: 1 },
        token: accessToken,
      }),
    ).rejects.toThrow(/email_taken/);
  });

  it("rejects an out-of-range business limit as a validation error", async () => {
    await expect(
      call("/admin/owners", {
        method: "POST",
        body: { name: "Too many", email: `over-${stamp}@example.test`, maxBusinesses: 5000 },
        token: accessToken,
      }),
    ).rejects.toThrow(/validation/);
  });

  it("suspends and reinstates, moving the status both ways", async () => {
    const owners = await call<{ id: string; email: string }[]>("/admin/owners", {
      token: accessToken,
    });
    const target = owners.find((o) => o.email === ownerEmail);
    expect(target, "the owner created above should be in the list").toBeDefined();

    const suspended = await call<{ status: string; suspendedAt: string | null }>(
      `/admin/owners/${target!.id}/suspend`,
      { method: "POST", body: { tier: "default" }, token: accessToken },
    );
    expect(suspended.status).toBe("suspended");
    expect(suspended.suspendedAt).not.toBeNull();

    const reinstated = await call<{ status: string }>(`/admin/owners/${target!.id}/reinstate`, {
      method: "POST",
      token: accessToken,
    });
    expect(reinstated.status).toBe("active");
  });

  it("browses an owner's businesses", async () => {
    const owners = await call<{ id: string; email: string }[]>("/admin/owners", {
      token: accessToken,
    });
    const target = owners.find((o) => o.email === ownerEmail)!;
    const businesses = await call<unknown[]>(`/admin/owners/${target.id}/businesses`, {
      token: accessToken,
    });
    // Empty until the invite is accepted — the demo business is seeded on activation.
    expect(Array.isArray(businesses)).toBe(true);
  });

  it("returns the paginated envelope the activity table expects", async () => {
    const owners = await call<{ id: string; email: string }[]>("/admin/owners", {
      token: accessToken,
    });
    // Any owner with a business will do; skip cleanly if this database has none.
    for (const owner of owners) {
      const businesses = await call<{ id: string }[]>(`/admin/owners/${owner.id}/businesses`, {
        token: accessToken,
      });
      if (businesses.length === 0) continue;

      const activity = await call<Record<string, unknown>>(
        `/admin/businesses/${businesses[0].id}/activity-log?page=1&pageSize=5`,
        { token: accessToken },
      );
      expect(activity).toMatchObject({
        page: 1,
        pageSize: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(Array.isArray(activity.data)).toBe(true);
      return;
    }
  });

  it("refuses a refresh token it has already rotated", async () => {
    const login = await call<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: { email: EMAIL, password: PASSWORD },
    });
    // Only meaningful for an owner account, which gets a real pair from the password alone.
    if (typeof login.refreshToken !== "string") return;

    const first = await call<{ refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: { refreshToken: login.refreshToken },
    });
    expect(first.refreshToken).not.toBe(login.refreshToken);

    // Replaying the rotated token is what middleware must never cause.
    await expect(
      call("/auth/refresh", { method: "POST", body: { refreshToken: login.refreshToken } }),
    ).rejects.toThrow(/401|unauthorized/i);
  });
});
