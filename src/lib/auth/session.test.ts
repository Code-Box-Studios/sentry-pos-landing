import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, { value: string; options: Record<string, unknown> }>();
const jar = {
  get: (name: string) => (store.has(name) ? { name, value: store.get(name)!.value } : undefined),
  set: (name: string, value: string, options: Record<string, unknown>) =>
    store.set(name, { value, options }),
  delete: (name: string) => store.delete(name),
};

vi.mock("next/headers", () => ({ cookies: () => Promise.resolve(jar) }));

const {
  ACCESS_COOKIE,
  PREAUTH_COOKIE,
  REFRESH_COOKIE,
  clearPreauthToken,
  clearSession,
  readAccessToken,
  readPreauthToken,
  readRefreshToken,
  writePreauthToken,
  writeSession,
} = await import("./session");

beforeEach(() => {
  store.clear();
});

describe("writeSession", () => {
  it("stores both tokens under the Sentry-specific names, never Payload's", async () => {
    await writeSession("access-token", "refresh-token");
    expect(ACCESS_COOKIE).toBe("sentry_at");
    expect(REFRESH_COOKIE).toBe("sentry_rt");
    expect(store.get("sentry_at")?.value).toBe("access-token");
    expect(store.get("sentry_rt")?.value).toBe("refresh-token");
    expect(store.has("payload-token")).toBe(false);
  });

  it("marks both cookies httpOnly, lax and site-wide", async () => {
    await writeSession("a", "r");
    for (const name of ["sentry_at", "sentry_rt"]) {
      expect(store.get(name)?.options).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  });

  it("gives both cookies the refresh token's 30-day life", async () => {
    await writeSession("a", "r");
    expect(store.get("sentry_at")?.options.maxAge).toBe(60 * 60 * 24 * 30);
    expect(store.get("sentry_rt")?.options.maxAge).toBe(60 * 60 * 24 * 30);
  });
});

describe("reads", () => {
  it("returns null rather than undefined when a cookie is absent", async () => {
    expect(await readAccessToken()).toBeNull();
    expect(await readRefreshToken()).toBeNull();
    expect(await readPreauthToken()).toBeNull();
  });

  it("round-trips what was written", async () => {
    await writeSession("a", "r");
    await writePreauthToken("p");
    expect(await readAccessToken()).toBe("a");
    expect(await readRefreshToken()).toBe("r");
    expect(await readPreauthToken()).toBe("p");
  });
});

describe("clearSession", () => {
  it("removes the preauth cookie too, so a half-finished TOTP never outlives the session", async () => {
    await writeSession("a", "r");
    await writePreauthToken("p");
    await clearSession();
    expect(store.size).toBe(0);
  });
});

describe("preauth", () => {
  it("expires in five minutes, matching the token the API mints", async () => {
    await writePreauthToken("p");
    expect(PREAUTH_COOKIE).toBe("sentry_preauth");
    expect(store.get("sentry_preauth")?.options.maxAge).toBe(300);
  });

  it("clears on its own without touching the session", async () => {
    await writeSession("a", "r");
    await writePreauthToken("p");
    await clearPreauthToken();
    expect(store.has("sentry_preauth")).toBe(false);
    expect(store.has("sentry_at")).toBe(true);
  });
});
