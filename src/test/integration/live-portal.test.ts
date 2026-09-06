/**
 * The owner path, end to end, against a running sentry-pos-be.
 *
 * Opt-in: skipped unless PORTAL_E2E_API_URL is set. An owner signs in with a password alone,
 * so unlike the admin suite this needs no TOTP code and can run unattended.
 *
 *   cd ../sentry-pos-be && npm run start:dev
 *   PORTAL_E2E_API_URL=http://localhost:4000/v1 \
 *   PORTAL_E2E_OWNER_EMAIL=maria@kapediaria.ph \
 *   PORTAL_E2E_OWNER_PASSWORD=sentry-demo \
 *   pnpm test:integration
 *
 * It talks to the API directly rather than through `src/lib/api/`, because those modules
 * read cookies via `next/headers`, which has no meaning outside a request. What is under
 * test is the CONTRACT the portal depends on — above all the replace-set semantics, where a
 * mistake silently deletes a customer's variants.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const BASE = process.env.PORTAL_E2E_API_URL;
const EMAIL = process.env.PORTAL_E2E_OWNER_EMAIL;
const PASSWORD = process.env.PORTAL_E2E_OWNER_PASSWORD;

const live = BASE && EMAIL && PASSWORD ? describe : describe.skip;

interface Envelope {
  code?: string;
  message?: string;
}

let token = "";

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown; anonymous?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  if (!init.anonymous && token) headers.authorization = `Bearer ${token}`;

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

interface Variant {
  id: string;
  name: string;
  priceC: number;
}

interface Product {
  id: string;
  name: string;
  priceC: number;
  sku: string | null;
  variants: Variant[];
}

live("owner portal", () => {
  /** Unique per run so the suite can be run repeatedly against the same database. */
  const stamp = process.env.PORTAL_E2E_STAMP ?? String(process.pid);
  let businessId = "";
  let categoryId = "";
  let productId = "";
  const branchIds: string[] = [];

  beforeAll(async () => {
    const login = await call<Record<string, unknown>>("/auth/login", {
      method: "POST",
      body: { email: EMAIL, password: PASSWORD },
      anonymous: true,
    });

    // An owner is signed in outright — no TOTP step, unlike a platform admin.
    expect(login.accessToken, "an owner should get a token pair from a password alone").toBeTypeOf(
      "string",
    );
    expect(login.role).toBe("owner");
    token = login.accessToken as string;

    const businesses = await call<{ id: string; isDemo: boolean }[]>("/portal/businesses");
    expect(businesses.length, "the seeded owner should have at least one business").toBeGreaterThan(
      0,
    );
    // Work in the demo business when there is one, so a real catalog is left alone.
    businessId = (businesses.find((b) => b.isDemo) ?? businesses[0]).id;
  });

  afterAll(async () => {
    // Best-effort teardown; a failure here must not mask a real test failure.
    for (const id of branchIds) {
      await call(`/portal/branches/${id}`, { method: "DELETE" }).catch(() => undefined);
    }
    if (productId) {
      await call(`/portal/products/${productId}`, { method: "DELETE" }).catch(() => undefined);
    }
    if (categoryId) {
      await call(`/portal/categories/${categoryId}`, { method: "DELETE" }).catch(() => undefined);
    }
  });

  it("refuses the business list without a token", async () => {
    await expect(
      call("/portal/businesses", { anonymous: true }),
    ).rejects.toThrow(/401|unauthorized/i);
  });

  it("round-trips a category", async () => {
    const created = await call<{ id: string; name: string }>(
      `/portal/businesses/${businessId}/categories`,
      { method: "POST", body: { name: `E2E ${stamp}`, sortOrder: 99 } },
    );
    categoryId = created.id;
    expect(created.name).toBe(`E2E ${stamp}`);

    const list = await call<{ id: string }[]>(`/portal/businesses/${businessId}/categories`);
    expect(list.some((c) => c.id === categoryId)).toBe(true);

    const renamed = await call<{ name: string }>(`/portal/categories/${categoryId}`, {
      method: "PATCH",
      body: { name: `E2E ${stamp} renamed` },
    });
    expect(renamed.name).toBe(`E2E ${stamp} renamed`);
  });

  it("creates a product whose price survives the round trip exactly", async () => {
    const created = await call<Product>(`/portal/businesses/${businessId}/products`, {
      method: "POST",
      body: {
        categoryId,
        name: `E2E Product ${stamp}`,
        // 12050 centavos is ₱120.50 — a value naive float maths gets wrong.
        priceC: 12050,
        sku: `E2E-${stamp}`,
        trackStock: true,
        variants: [{ name: "Small", priceC: 10000 }],
      },
    });
    productId = created.id;

    expect(created.priceC).toBe(12050);
    expect(created.variants).toHaveLength(1);
    expect(created.variants[0].priceC).toBe(10000);

    const read = await call<Product>(`/portal/products/${productId}`);
    expect(read.priceC).toBe(12050);
  });

  it("rejects a duplicate SKU as a conflict, not a 500", async () => {
    await expect(
      call(`/portal/businesses/${businessId}/products`, {
        method: "POST",
        body: {
          categoryId,
          name: `E2E Duplicate ${stamp}`,
          priceC: 100,
          sku: `E2E-${stamp}`,
        },
      }),
    ).rejects.toThrow(/409|conflict|sku|taken/i);
  });

  it("adds a variant through the replace-set", async () => {
    const existing = await call<Product>(`/portal/products/${productId}`);
    const updated = await call<Product>(`/portal/products/${productId}`, {
      method: "PATCH",
      body: {
        variants: [
          { id: existing.variants[0].id, name: "Small", priceC: 10000 },
          { name: "Large", priceC: 14000 },
        ],
      },
    });

    expect(updated.variants).toHaveLength(2);
    expect(updated.variants.map((v) => v.name).sort()).toEqual(["Large", "Small"]);
  });

  it("deletes a variant left out of the replace-set", async () => {
    const existing = await call<Product>(`/portal/products/${productId}`);
    const small = existing.variants.find((v) => v.name === "Small");
    expect(small, "Small should still exist from the previous case").toBeDefined();

    const updated = await call<Product>(`/portal/products/${productId}`, {
      method: "PATCH",
      body: { variants: [{ id: small!.id, name: "Small", priceC: 10000 }] },
    });

    expect(updated.variants).toHaveLength(1);
    expect(updated.variants[0].name).toBe("Small");
  });

  it("leaves variants untouched when the key is omitted — the case a refactor breaks", async () => {
    const updated = await call<Product>(`/portal/products/${productId}`, {
      method: "PATCH",
      body: { name: `E2E Product ${stamp} renamed` },
    });

    expect(updated.name).toBe(`E2E Product ${stamp} renamed`);
    // Omitting `variants` must not be read as "no variants".
    expect(updated.variants).toHaveLength(1);
  });

  it("rejects a branch code that is too long", async () => {
    await expect(
      call(`/portal/businesses/${businessId}/branches`, {
        method: "POST",
        body: { name: "Too long", code: "TOOLONGCODE", address: "Somewhere" },
      }),
    ).rejects.toThrow(/validation/);
  });

  it("creates a branch and reads its stock", async () => {
    // A branch code must be 2-6 uppercase alphanumerics and unique per business.
    const code = `E${String(stamp).slice(-4).padStart(4, "0")}`;
    const branch = await call<{ id: string; code: string }>(
      `/portal/businesses/${businessId}/branches`,
      { method: "POST", body: { name: `E2E Branch ${stamp}`, code, address: "1 Test St" } },
    );
    branchIds.push(branch.id);
    expect(branch.code).toBe(code);

    const levels = await call<unknown[]>(`/portal/branches/${branch.id}/stock`);
    expect(Array.isArray(levels)).toBe(true);
  });

  it("refuses to hold stock against the parent of a product that has variants", async () => {
    // The rule `toOptions` encodes in the UI: a product with variants is only addressable
    // through them, so the picker never offers the bare product.
    await expect(
      call(`/portal/branches/${branchIds[0]}/stock/receive`, {
        method: "POST",
        body: { lines: [{ productId, qty: 1 }] },
      }),
    ).rejects.toThrow(/variantId is required/i);
  });

  it("receives stock against a variant and sees the level move", async () => {
    const branchId = branchIds[0];
    const product = await call<Product>(`/portal/products/${productId}`);
    const variantId = product.variants[0].id;

    await call(`/portal/branches/${branchId}/stock/receive`, {
      method: "POST",
      body: { lines: [{ productId, variantId, qty: 5, unitCostC: 8000 }] },
    });

    const levels = await call<{ variantId: string | null; qty: number }[]>(
      `/portal/branches/${branchId}/stock`,
    );
    expect(levels.find((l) => l.variantId === variantId)?.qty).toBe(5);
  });

  it("rejects a four-decimal quantity, matching parseQuantity's guard", async () => {
    const product = await call<Product>(`/portal/products/${productId}`);
    await expect(
      call(`/portal/branches/${branchIds[0]}/stock/adjustments`, {
        method: "POST",
        body: {
          productId,
          variantId: product.variants[0].id,
          newQty: 1.2345,
          reasonCategory: "count_correction",
        },
      }),
    ).rejects.toThrow(/validation/);
  });

  it("treats an adjustment as an absolute count, not a delta", async () => {
    const branchId = branchIds[0];
    const product = await call<Product>(`/portal/products/${productId}`);
    const variantId = product.variants[0].id;

    await call(`/portal/branches/${branchId}/stock/adjustments`, {
      method: "POST",
      body: { productId, variantId, newQty: 3, reasonCategory: "count_correction", note: "E2E" },
    });

    const levels = await call<{ variantId: string | null; qty: number }[]>(
      `/portal/branches/${branchId}/stock`,
    );
    // Was 5; setting newQty to 3 must leave 3, not 8.
    expect(levels.find((l) => l.variantId === variantId)?.qty).toBe(3);
  });

  it("round-trips a discount, keeping percent and fixed values distinct", async () => {
    const percent = await call<{ id: string; kind: string; value: number }>(
      `/portal/businesses/${businessId}/discounts`,
      { method: "POST", body: { name: `E2E % ${stamp}`, kind: "percent", value: 10, appliesTo: "line" } },
    );
    expect(percent.value).toBe(10);

    const fixed = await call<{ id: string; value: number }>(
      `/portal/businesses/${businessId}/discounts`,
      { method: "POST", body: { name: `E2E ₱ ${stamp}`, kind: "fixed", value: 5000, appliesTo: "order" } },
    );
    expect(fixed.value).toBe(5000);

    await call(`/portal/discounts/${percent.id}`, { method: "DELETE" });
    await call(`/portal/discounts/${fixed.id}`, { method: "DELETE" });
  });

  it("accepts a six-digit refund PIN and rejects a five-digit one", async () => {
    await expect(
      call("/portal/refund-pin", { method: "PUT", body: { pin: "12345" } }),
    ).rejects.toThrow(/validation/);

    // Restore the seeded PIN so the terminal's own suite keeps working.
    await call("/portal/refund-pin", { method: "PUT", body: { pin: "123456" } });
  });

  it("returns the paginated envelope the activity table expects", async () => {
    const activity = await call<Record<string, unknown>>(
      `/portal/businesses/${businessId}/activity-log?page=1&pageSize=5`,
    );
    expect(activity).toMatchObject({
      page: 1,
      pageSize: 5,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
    expect(Array.isArray(activity.data)).toBe(true);
  });

  it("refuses platform_admin as an actor filter on a tenant log", async () => {
    await expect(
      call(`/portal/businesses/${businessId}/activity-log?actorType=platform_admin`),
    ).rejects.toThrow(/validation/);
  });

  it("lists terminals", async () => {
    const terminals = await call<{ paired: boolean }[]>(
      `/portal/businesses/${businessId}/terminals`,
    );
    expect(Array.isArray(terminals)).toBe(true);
  });
});
