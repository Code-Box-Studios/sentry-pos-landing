/**
 * The analytics SCREENS, rendered by a running portal against a running API.
 *
 * Opt-in: skipped unless PORTAL_E2E_API_URL and owner credentials are set.
 *
 *   cd ../sentry-pos-be && npm run start:dev
 *   pnpm dev                       # the portal, on :3100
 *   PORTAL_E2E_API_URL=http://localhost:4000/v1 \
 *   PORTAL_E2E_OWNER_EMAIL=maria@kapediaria.ph \
 *   PORTAL_E2E_OWNER_PASSWORD=sentry-demo \
 *   pnpm test:integration
 *
 * This suite is deliberately different from `live-portal.test.ts`, which checks
 * the API contract and never renders anything. Here the point is that the PAGES
 * RENDER. Two faults this repo has actually shipped are invisible to both
 * `pnpm test` and `pnpm build` and visible only here:
 *
 *   - a Server Component calling a plain function exported from a `"use client"`
 *     module — it type-checks, builds clean, and throws at render;
 *   - a route that compiles but throws once real data reaches it.
 *
 * The session is assembled rather than driven through the login form: sign in to
 * the API for a real access token, then send it as the `sentry_at` cookie the
 * portal reads. That exercises the true middleware + Server Component path
 * without scripting a Server Action from outside the app.
 */
import { beforeAll, describe, expect, it } from "vitest";

/**
 * Hard-coded rather than imported from `@/lib/auth/session`: that module is
 * `server-only`, and this suite is an external HTTP client in a node
 * environment. If the cookie name ever changes, every route here 302s to
 * /login and the failure is immediate and obvious.
 */
const ACCESS_COOKIE = "sentry_at";

const API = process.env.PORTAL_E2E_API_URL;
const EMAIL = process.env.PORTAL_E2E_OWNER_EMAIL;
const PASSWORD = process.env.PORTAL_E2E_OWNER_PASSWORD;
const APP = process.env.PORTAL_E2E_APP_URL ?? "http://localhost:3100";

const live = API && EMAIL && PASSWORD ? describe : describe.skip;

let cookie = "";

async function signIn(): Promise<string> {
  const response = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!response.ok) {
    throw new Error(`login → ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { accessToken?: string };
  if (!body.accessToken) {
    throw new Error("login returned no accessToken — is this owner TOTP-gated?");
  }
  return body.accessToken;
}

/** A portal page, fetched with the session cookie the middleware expects. */
async function page(route: string): Promise<{ status: number; html: string }> {
  const response = await fetch(`${APP}${route}`, {
    headers: { cookie, accept: "text/html" },
    redirect: "manual",
  });
  return { status: response.status, html: await response.text() };
}

const ROUTES = [
  "/portal",
  "/portal/businesses",
  "/portal/analytics/overview",
  "/portal/analytics/sales",
  "/portal/analytics/products",
  "/portal/analytics/profit",
  "/portal/analytics/leaks",
  "/portal/analytics/inventory",
  "/portal/analytics/tax",
  "/portal/analytics/overview?from=2026-03-01&to=2026-03-07",
  "/portal/analytics/sales?from=2026-03-01&to=2026-03-07&granularity=week",
  "/portal/analytics/products?from=2026-03-01&to=2026-03-07&by=revenue",
  "/portal/analytics/inventory?from=2026-03-01&to=2026-03-07&page=1",
];

live("analytics screens (live)", () => {
  beforeAll(async () => {
    cookie = `${ACCESS_COOKIE}=${await signIn()}`;
  });

  it.each(ROUTES)("renders %s with a real session", async (route) => {
    const { status, html } = await page(route);
    expect(status).toBe(200);
    // A thrown Server Component still returns HTML; check for the error shell
    // rather than trusting the status alone.
    expect(html).not.toContain("Application error");
    expect(html).not.toContain("digest&quot;:&quot;");
  });

  it("shows the dashboard heading rather than the old business list", async () => {
    const { html } = await page("/portal");
    expect(html).toContain("Today");
  });

  it("keeps the full business list reachable, demo included", async () => {
    const { status, html } = await page("/portal/businesses");
    expect(status).toBe(200);
    expect(html).toContain("Businesses");
  });

  it("downloads a CSV through the export proxy", async () => {
    const response = await fetch(
      `${APP}/portal/analytics/export?report=overview&from=2026-03-01&to=2026-03-07`,
      { headers: { cookie }, redirect: "manual" },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    const csv = await response.text();
    expect(csv).toContain("metric,value,previous,change");
    expect(csv).toContain("Gross sales");
  });

  it("refuses an unknown report rather than proxying it", async () => {
    const response = await fetch(
      `${APP}/portal/analytics/export?report=../../admin/owners&from=2026-03-01&to=2026-03-07`,
      { headers: { cookie }, redirect: "manual" },
    );
    expect(response.status).toBe(400);
  });

  // The one error path a user can reach through the UI: the API bounds the
  // ledger merge, and the page shows the API's own words rather than its own.
  it("shows the API's message when paged past the merge bound", async () => {
    const { status, html } = await page(
      "/portal/analytics/inventory?from=2026-03-01&to=2026-03-07&page=999",
    );
    expect(status).toBe(200);
    expect(html).toContain("narrow the date range");
  });

  it("sends an unauthenticated visitor to the login page", async () => {
    const response = await fetch(`${APP}/portal/analytics/overview`, {
      redirect: "manual",
    });
    expect([302, 307]).toContain(response.status);
    expect(response.headers.get("location")).toContain("/login");
  });
});
