# Portal Foundation & Platform Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authenticated shell for Sentry — cookie-based BFF auth, the login and TOTP flows, and the platform admin panel — so a Sentry operator can onboard an owner end-to-end without a shell.

**Architecture:** A new `(app)` route group inside the existing `sentry-pos-landing` Next.js app. The browser never holds an API token: a Next Route Handler / Server Action calls `sentry-pos-be` server-side and stores the tokens in httpOnly cookies. Middleware owns token refresh and role routing. All API access goes through a hand-written, server-only typed module under `src/lib/api/`.

**Tech Stack:** Next.js 15.5 (App Router, React 19), TypeScript strict, Tailwind v4, shadcn-style primitives in `src/components/ui/`, Vitest + Testing Library, pnpm.

**Spec:** [`docs/superpowers/specs/2026-09-06-bo-portal-platform-admin-design.md`](../specs/2026-09-06-bo-portal-platform-admin-design.md)

## Global Constraints

- **Package manager is pnpm.** If the standalone binary is blocked, run `corepack pnpm <command>`.
- **The dev server runs on port 3100** (`next dev -p 3100`). The backend runs on 4000, the POS terminal on 3000.
- **`API_URL` is server-only** — never `NEXT_PUBLIC_`. Default for dev: `http://localhost:4000/v1`.
- **Every module under `src/lib/api/` and `src/lib/auth/session.ts` starts with `import "server-only";`** so a stray client import is a build error, not a leaked token.
- **The API error envelope is `{ code, message, ...extra, requestId }` with no `statusCode` field.** Never branch on HTTP status where a `code` exists.
- **Validation errors arrive as one `; `-joined string**, not a structured array.
- **Refresh happens only in `src/middleware.ts`.** The API rotates refresh tokens and treats reuse as an attack — a second concurrent refresh revokes every session for that user. No other code path may call `/auth/refresh`.
- **Cookie names are `sentry_at`, `sentry_rt`, `sentry_preauth`** — never `payload-token`, which Payload CMS owns in this same app.
- **Money is integer centavos** everywhere it appears; variables holding it end in `C`.
- **Timestamps are stored UTC, displayed Asia/Manila.**
- **Do not run `git push`.** Commit only.
- **Do not add Claude/AI attribution or `Co-Authored-By` trailers to commits.**
- **Do not modify anything under `src/app/(frontend)/`, `src/app/(payload)/`, `src/collections/`, or `src/payload.config.ts`.** The marketing site and CMS are out of scope.

## File Structure

| File | Responsibility |
| --- | --- |
| `vitest.config.ts` | Test runner: jsdom, `@` alias, `server-only` stubbed |
| `src/test/setup.ts` | Testing Library cleanup |
| `src/test/empty-module.ts` | Stub that `server-only` aliases to under test |
| `src/lib/auth/jwt.ts` | Signature-free JWT payload decode + expiry check (Edge-safe) |
| `src/lib/api/errors.ts` | Error taxonomy; maps `code` → typed error; splits validation messages |
| `src/lib/auth/session.ts` | Reads/writes/clears the three auth cookies |
| `src/lib/api/fetch.ts` | `apiFetch()` — URL, bearer, JSON, error mapping |
| `src/middleware.ts` | Route guard, role routing, and the only refresh call site |
| `src/lib/utils.ts` | `cn()` |
| `src/components/ui/*` | Primitives (button, input, label, alert, card, badge, table) |
| `src/lib/api/auth.ts` | Login, logout, TOTP, invite, password reset |
| `src/lib/api/admin.ts` | Owners CRUD, suspend/reinstate, tenant browse |
| `src/lib/api/types.ts` | Shared response types mirroring the Prisma models |
| `src/lib/forms/form-state.ts` | Maps a thrown `ApiError` into a Server Action's form state |
| `src/app/(app)/login/*` | Login, TOTP verify, TOTP setup |
| `src/app/(app)/forgot/*`, `.../password-reset/confirm/*`, `.../invite/accept/*` | Recovery + activation |
| `src/app/(app)/admin/*` | Owner list, create, detail, tenant browse |
| `src/components/app/*` | Shell chrome — sidebar, top bar, sign-out |

---

### Task 1: Test harness and the JWT decoder

Sets up Vitest and delivers the first tested unit: the payload decoder middleware needs.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/test/empty-module.ts`
- Create: `src/lib/auth/jwt.ts`
- Test: `src/lib/auth/jwt.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `decodeJwtPayload(token: string): AccessTokenPayload | null`
  - `needsRefresh(token: string | null, nowMs: number, skewSeconds?: number): boolean`
  - `interface AccessTokenPayload { sub: string; role: string; sid?: string; exp?: number; kind?: string }`

- [ ] **Step 1: Install the test dependencies**

```bash
pnpm add -D vitest@^3.2.7 @vitejs/plugin-react@^5.2.0 jsdom@^30.0.1 \
  @testing-library/react@^16.3.2 @testing-library/jest-dom@^7.0.1 \
  @testing-library/user-event@^14.6.5 vite@^7.3.6
```

- [ ] **Step 2: Add the test scripts to `package.json`**

In the `"scripts"` block, after `"lint": "eslint",` add:

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  // tsconfig.json sets `jsx: "preserve"` for Next; esbuild would otherwise fall back to the
  // classic runtime and blow up on an undefined `React`.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` throws by design when a bundler resolves its browser entry. Vitest's
      // jsdom environment picks exactly that entry, so every server module would fail to
      // import. Alias it to an empty module — the guard still works in the real build.
      "server-only": path.resolve(__dirname, "./src/test/empty-module.ts"),
    },
  },
});
```

- [ ] **Step 4: Create `src/test/empty-module.ts`**

```ts
/** Stands in for the `server-only` package under test. See vitest.config.ts. */
export {};
```

- [ ] **Step 5: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 6: Write the failing test — `src/lib/auth/jwt.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { decodeJwtPayload, needsRefresh } from "./jwt";

/** Builds an unsigned token whose payload is `payload`. The signature is never checked. */
function makeToken(payload: Record<string, unknown>): string {
  const seg = (o: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${seg({ alg: "HS256", typ: "JWT" })}.${seg(payload)}.not-a-real-signature`;
}

describe("decodeJwtPayload", () => {
  it("reads sub, role, sid, exp and kind", () => {
    const token = makeToken({ sub: "u-1", role: "owner", sid: "s-1", exp: 1893456000 });
    expect(decodeJwtPayload(token)).toEqual({
      sub: "u-1",
      role: "owner",
      sid: "s-1",
      exp: 1893456000,
      kind: undefined,
    });
  });

  it("surfaces a preauth token's kind so callers can reject it", () => {
    const token = makeToken({ sub: "u-1", role: "platform_admin", kind: "preauth" });
    expect(decodeJwtPayload(token)?.kind).toBe("preauth");
  });

  it("returns null for a token that is not three segments", () => {
    expect(decodeJwtPayload("nonsense")).toBeNull();
    expect(decodeJwtPayload("a.b")).toBeNull();
  });

  it("returns null when the payload is not decodable JSON", () => {
    expect(decodeJwtPayload("aaa.!!!not-base64!!!.ccc")).toBeNull();
  });

  it("returns null when sub or role is missing — an unusable payload is no payload", () => {
    expect(decodeJwtPayload(makeToken({ role: "owner" }))).toBeNull();
    expect(decodeJwtPayload(makeToken({ sub: "u-1" }))).toBeNull();
  });
});

describe("needsRefresh", () => {
  const now = 1_700_000_000_000; // fixed clock; never Date.now() in a test

  it("is true when there is no token at all", () => {
    expect(needsRefresh(null, now)).toBe(true);
  });

  it("is true when the token carries no exp", () => {
    expect(needsRefresh(makeToken({ sub: "u", role: "owner" }), now)).toBe(true);
  });

  it("is false for a token with plenty of life left", () => {
    const exp = Math.floor(now / 1000) + 600;
    expect(needsRefresh(makeToken({ sub: "u", role: "owner", exp }), now)).toBe(false);
  });

  it("is true inside the skew window, so the token never expires mid-render", () => {
    const exp = Math.floor(now / 1000) + 60; // 60s left, default skew is 120s
    expect(needsRefresh(makeToken({ sub: "u", role: "owner", exp }), now)).toBe(true);
  });

  it("is true for an already-expired token", () => {
    const exp = Math.floor(now / 1000) - 1;
    expect(needsRefresh(makeToken({ sub: "u", role: "owner", exp }), now)).toBe(true);
  });
});
```

- [ ] **Step 7: Run the test to verify it fails**

Run: `pnpm test src/lib/auth/jwt.test.ts`
Expected: FAIL — cannot resolve `./jwt`.

- [ ] **Step 8: Create `src/lib/auth/jwt.ts`**

```ts
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
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 10 tests.

- [ ] **Step 10: Verify lint and the production build still work**

Run: `pnpm lint && pnpm build`
Expected: both succeed. The build must still produce the marketing site and CMS unchanged.

- [ ] **Step 11: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/test src/lib/auth
git commit -m "test: add vitest harness and a signature-free JWT payload decoder"
```

---

### Task 2: The error taxonomy

Turns the API's `{ code, message }` envelope into typed errors, and recovers per-field messages from the single joined validation string.

**Files:**
- Create: `src/lib/api/errors.ts`
- Test: `src/lib/api/errors.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `class ApiError extends Error { code: string; status: number; requestId?: string }`
  - `class UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `OwnerSuspendedError`, `InvalidTokenError` — all `extends ApiError`
  - `class LoginInvalidError extends ApiError { attemptsRemaining: number }`
  - `class LockedError extends ApiError { retryAfterSeconds: number }`
  - `class ValidationError extends ApiError { segments: string[]; forFields(fields): { fieldErrors: Record<string,string>; formErrors: string[] } }`
  - `class NetworkError extends Error`
  - `toApiError(status: number, body: unknown): ApiError`

- [ ] **Step 1: Write the failing test — `src/lib/api/errors.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  ApiError,
  ConflictError,
  ForbiddenError,
  InvalidTokenError,
  LockedError,
  LoginInvalidError,
  NotFoundError,
  OwnerSuspendedError,
  UnauthorizedError,
  ValidationError,
  toApiError,
} from "./errors";

describe("toApiError", () => {
  it("keeps code, message and requestId on the base error", () => {
    const err = toApiError(500, {
      code: "internal_error",
      message: "An unexpected error occurred.",
      requestId: "req-1",
    });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe("internal_error");
    expect(err.status).toBe(500);
    expect(err.requestId).toBe("req-1");
  });

  it("maps each authorization code to its own class", () => {
    expect(toApiError(401, { code: "unauthorized", message: "x" })).toBeInstanceOf(
      UnauthorizedError,
    );
    expect(toApiError(403, { code: "forbidden", message: "x" })).toBeInstanceOf(ForbiddenError);
    expect(
      toApiError(403, { code: "platform_write_forbidden", message: "x" }),
    ).toBeInstanceOf(ForbiddenError);
    expect(toApiError(403, { code: "owner_suspended", message: "x" })).toBeInstanceOf(
      OwnerSuspendedError,
    );
    expect(toApiError(404, { code: "not_found", message: "x" })).toBeInstanceOf(NotFoundError);
    expect(toApiError(409, { code: "email_taken", message: "x" })).toBeInstanceOf(ConflictError);
    expect(toApiError(400, { code: "invalid_token", message: "x" })).toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it("carries attemptsRemaining off a failed login", () => {
    const err = toApiError(401, {
      code: "login_invalid",
      message: "Credentials are incorrect.",
      attemptsRemaining: 2,
    });
    expect(err).toBeInstanceOf(LoginInvalidError);
    expect((err as LoginInvalidError).attemptsRemaining).toBe(2);
  });

  it("carries retryAfterSeconds off a lockout", () => {
    const err = toApiError(423, {
      code: "login_locked",
      message: "Locked.",
      retryAfterSeconds: 300,
    });
    expect(err).toBeInstanceOf(LockedError);
    expect((err as LockedError).retryAfterSeconds).toBe(300);
  });

  it("falls back to a generic error when the body is not an envelope at all", () => {
    const err = toApiError(502, "<html>Bad Gateway</html>");
    expect(err.code).toBe("internal_error");
    expect(err.status).toBe(502);
  });
});

describe("ValidationError.forFields", () => {
  it("splits the joined message back into per-field errors", () => {
    const err = toApiError(422, {
      code: "validation",
      message: "email must be an email; name should not be empty",
    }) as ValidationError;

    expect(err).toBeInstanceOf(ValidationError);
    expect(err.forFields(["email", "name"])).toEqual({
      fieldErrors: {
        email: "email must be an email",
        name: "name should not be empty",
      },
      formErrors: [],
    });
  });

  it("keeps the first message when a field fails several rules", () => {
    const err = toApiError(422, {
      code: "validation",
      message: "password must be longer than or equal to 8 characters; password should not be empty",
    }) as ValidationError;

    expect(err.forFields(["password"]).fieldErrors.password).toBe(
      "password must be longer than or equal to 8 characters",
    );
  });

  it("promotes an unrecognised segment to a form-level error rather than dropping it", () => {
    const err = toApiError(422, {
      code: "validation",
      message: "maxBusinesses must not be greater than 1000; something entirely unexpected",
    }) as ValidationError;

    const result = err.forFields(["maxBusinesses"]);
    expect(result.fieldErrors.maxBusinesses).toBe("maxBusinesses must not be greater than 1000");
    expect(result.formErrors).toEqual(["something entirely unexpected"]);
  });

  it("treats an empty message as no segments", () => {
    const err = toApiError(422, { code: "validation", message: "" }) as ValidationError;
    expect(err.forFields(["email"])).toEqual({ fieldErrors: {}, formErrors: [] });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/api/errors.test.ts`
Expected: FAIL — cannot resolve `./errors`.

- [ ] **Step 3: Create `src/lib/api/errors.ts`**

```ts
/**
 * The client half of the API's error contract.
 *
 * `sentry-pos-be` renders every failure as `{ code, message, ...extra, requestId }` — with
 * no `statusCode` field, deliberately. `code` is the stable identifier; the HTTP status is
 * carried here only so an unmapped code still has something to report. Branch on `code`.
 */

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** 401. The session is gone or was never there. */
export class UnauthorizedError extends ApiError {}

/** 403 for every "you may not do this" that is not a suspension. */
export class ForbiddenError extends ApiError {}

/** 403 with its own screen: the owner account itself is suspended. */
export class OwnerSuspendedError extends ApiError {}

export class NotFoundError extends ApiError {}

/** 409 — a unique constraint lost. Belongs inline on the offending field. */
export class ConflictError extends ApiError {}

/** 400 — an invite or reset link that is unknown, used, or expired. */
export class InvalidTokenError extends ApiError {}

/** 401 on a wrong password, carrying how many tries remain before the lockout. */
export class LoginInvalidError extends ApiError {
  constructor(
    message: string,
    status: number,
    requestId: string | undefined,
    readonly attemptsRemaining: number,
  ) {
    super("login_invalid", message, status, requestId);
  }
}

/** 423 — locked out. Render the countdown, not a generic failure. */
export class LockedError extends ApiError {
  constructor(
    code: string,
    message: string,
    status: number,
    requestId: string | undefined,
    readonly retryAfterSeconds: number,
  ) {
    super(code, message, status, requestId);
  }
}

/**
 * 422. The API's global ValidationPipe emits an array of class-validator strings, and the
 * exception filter joins them with `"; "` before sending — so there is no structured field
 * data to read. Each segment does begin with its property name, which is what `forFields`
 * exploits to put messages back on the right inputs.
 */
export class ValidationError extends ApiError {
  readonly segments: string[];

  constructor(message: string, status: number, requestId?: string) {
    super("validation", message, status, requestId);
    this.segments = message
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  /**
   * Assigns each segment to a field by its leading word. A segment whose first word is not
   * one of `fields` becomes a form-level error — best-effort by construction, but nothing
   * the API said is ever thrown away.
   */
  forFields(fields: readonly string[]): {
    fieldErrors: Record<string, string>;
    formErrors: string[];
  } {
    const known = new Set(fields);
    const fieldErrors: Record<string, string> = {};
    const formErrors: string[] = [];

    for (const segment of this.segments) {
      const field = segment.split(" ")[0];
      if (known.has(field)) {
        // First message wins: class-validator lists rules in declaration order, and the
        // first failure is the one closest to what the user actually typed.
        if (!(field in fieldErrors)) fieldErrors[field] = segment;
      } else {
        formErrors.push(segment);
      }
    }

    return { fieldErrors, formErrors };
  }
}

/** The API could not be reached at all — DNS, TLS, connection refused, timeout. */
export class NetworkError extends Error {
  constructor(message = "Could not reach the Sentry API.", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "NetworkError";
  }
}

/** Maps one error response onto its class. Unknown codes stay as a plain `ApiError`. */
export function toApiError(status: number, body: unknown): ApiError {
  const envelope: Record<string, unknown> =
    typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const code = typeof envelope.code === "string" ? envelope.code : "internal_error";
  const message =
    typeof envelope.message === "string" ? envelope.message : "An unexpected error occurred.";
  const requestId = typeof envelope.requestId === "string" ? envelope.requestId : undefined;
  const numeric = (key: string): number =>
    typeof envelope[key] === "number" ? (envelope[key] as number) : 0;

  switch (code) {
    case "validation":
      return new ValidationError(message, status, requestId);

    case "login_invalid":
      return new LoginInvalidError(message, status, requestId, numeric("attemptsRemaining"));

    case "login_locked":
    case "pin_locked":
      return new LockedError(code, message, status, requestId, numeric("retryAfterSeconds"));

    case "unauthorized":
    case "totp_invalid":
      return new UnauthorizedError(code, message, status, requestId);

    case "owner_suspended":
      return new OwnerSuspendedError(code, message, status, requestId);

    case "forbidden":
    case "platform_write_forbidden":
    case "tenant_scope_violation":
    case "max_businesses_reached":
      return new ForbiddenError(code, message, status, requestId);

    case "not_found":
      return new NotFoundError(code, message, status, requestId);

    case "email_taken":
    case "conflict":
    case "stock_conflict":
      return new ConflictError(code, message, status, requestId);

    case "invalid_token":
      return new InvalidTokenError(code, message, status, requestId);

    default:
      return new ApiError(code, message, status, requestId);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 20 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/errors.ts src/lib/api/errors.test.ts
git commit -m "feat: map the API error envelope onto typed errors"
```

---

### Task 3: Session cookies

The only place the three auth cookies are named or configured.

**Files:**
- Create: `src/lib/auth/session.ts`
- Test: `src/lib/auth/session.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `ACCESS_COOKIE = "sentry_at"`, `REFRESH_COOKIE = "sentry_rt"`, `PREAUTH_COOKIE = "sentry_preauth"`
  - `readAccessToken(): Promise<string | null>`, `readRefreshToken(): Promise<string | null>`, `readPreauthToken(): Promise<string | null>`
  - `writeSession(accessToken: string, refreshToken: string): Promise<void>`
  - `clearSession(): Promise<void>`
  - `writePreauthToken(token: string): Promise<void>`, `clearPreauthToken(): Promise<void>`

- [ ] **Step 1: Install `server-only`**

```bash
pnpm add server-only
```

- [ ] **Step 2: Write the failing test — `src/lib/auth/session.test.ts`**

```ts
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test src/lib/auth/session.test.ts`
Expected: FAIL — cannot resolve `./session`.

- [ ] **Step 4: Create `src/lib/auth/session.ts`**

```ts
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
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 28 tests.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/auth/session.ts src/lib/auth/session.test.ts
git commit -m "feat: hold the session in httpOnly cookies distinct from Payload's"
```

---

### Task 4: `apiFetch()`

The single door to `sentry-pos-be`. Attaches the bearer, parses JSON, and throws typed errors. It does **not** refresh — that is Task 5's job and only Task 5's.

**Files:**
- Create: `src/lib/api/fetch.ts`
- Test: `src/lib/api/fetch.test.ts`

**Interfaces:**
- Consumes: `toApiError`, `NetworkError`, `UnauthorizedError` from `./errors`; `readAccessToken` from `@/lib/auth/session`
- Produces:
  - `apiBaseUrl(): string`
  - `apiFetch<T>(path: string, init?: ApiRequestInit): Promise<T>`
  - `interface ApiRequestInit { method?: "GET"|"POST"|"PATCH"|"PUT"|"DELETE"; body?: unknown; token?: string; authenticated?: boolean; query?: Record<string, string | number | boolean | undefined> }`

- [ ] **Step 1: Write the failing test — `src/lib/api/fetch.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let accessToken: string | null = "session-access-token";
vi.mock("@/lib/auth/session", () => ({
  readAccessToken: () => Promise.resolve(accessToken),
}));

const { apiFetch, apiBaseUrl } = await import("./fetch");
const { ConflictError, NetworkError, UnauthorizedError, ValidationError } = await import(
  "./errors"
);

/** One-shot fetch stub. Each call returns a freshly minted Response — a Response body can
 *  only be read once, so reusing one across calls fails with "Body is unusable". */
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
  accessToken = "session-access-token";
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
    const [url, init] = spy.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://localhost:4000/v1/portal/businesses");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer session-access-token");
  });

  it("prefers an explicit token over the cookie, for the preauth TOTP calls", async () => {
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await apiFetch("/auth/totp/setup", { method: "POST", token: "preauth-token" });
    const [, init] = spy.mock.calls[0] as [URL, RequestInit];
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer preauth-token");
  });

  it("sends no Authorization header when the endpoint takes no credentials", async () => {
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await apiFetch("/auth/login", {
      method: "POST",
      body: { email: "a@b.co", password: "x" },
      authenticated: false,
    });
    const [, init] = spy.mock.calls[0] as [URL, RequestInit];
    expect(new Headers(init.headers).get("authorization")).toBeNull();
    expect(init.body).toBe(JSON.stringify({ email: "a@b.co", password: "x" }));
  });

  it("fails before the network when a credentialed call has no session", async () => {
    accessToken = null;
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await expect(apiFetch("/portal/businesses")).rejects.toBeInstanceOf(UnauthorizedError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("appends only the query params that have a value", async () => {
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await apiFetch("/admin/businesses/b-1/activity-log", {
      query: { page: 2, pageSize: 50, actorType: undefined },
    });
    const [url] = spy.mock.calls[0] as [URL];
    expect(url.search).toBe("?page=2&pageSize=50");
  });

  it("never caches — portal data is per-user and must not be shared", async () => {
    const spy = stubFetch(() => ({ status: 200, body: {} }));
    await apiFetch("/portal/businesses");
    const [, init] = spy.mock.calls[0] as [URL, RequestInit];
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
    const err = await apiFetch("/admin/owners", { method: "POST", body: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.requestId).toBe("req-9");
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
    const err = await apiFetch("/portal/businesses").catch((e) => e);
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/lib/api/fetch.test.ts`
Expected: FAIL — cannot resolve `./fetch`.

- [ ] **Step 3: Create `src/lib/api/fetch.ts`**

```ts
import "server-only";
import { readAccessToken } from "@/lib/auth/session";
import { NetworkError, UnauthorizedError, toApiError } from "./errors";

/**
 * The one door to `sentry-pos-be`.
 *
 * It deliberately does NOT refresh on a 401. The API rotates refresh tokens and treats a
 * replayed one as an attack — it revokes every active session for that user — so two
 * requests refreshing at once would log the operator out everywhere. Refresh therefore
 * happens in exactly one place, `src/middleware.ts`, which runs once per request. By the
 * time a call gets here the token is as fresh as it is going to be, and a 401 means the
 * session is genuinely finished.
 */

export function apiBaseUrl(): string {
  const raw = process.env.API_URL?.trim();
  if (!raw) {
    throw new Error(
      "API_URL is not set. The portal cannot reach sentry-pos-be without it — see .env.example.",
    );
  }
  return raw.replace(/\/+$/, "");
}

export interface ApiRequestInit {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** An explicit bearer, overriding the session cookie. The TOTP endpoints use the preauth token. */
  token?: string;
  /** False for endpoints that take no credentials: login, refresh, invite accept, password reset. */
  authenticated?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { method = "GET", body, token, authenticated = true, query } = init;

  const url = new URL(apiBaseUrl() + path);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers = new Headers({ accept: "application/json" });
  if (body !== undefined) headers.set("content-type", "application/json");

  const bearer = token ?? (authenticated ? await readAccessToken() : null);
  if (authenticated && !bearer) {
    // No point spending a round-trip to be told what we already know.
    throw new UnauthorizedError("unauthorized", "Your session has ended.", 401);
  }
  if (bearer) headers.set("authorization", `Bearer ${bearer}`);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Portal data is per-user and frequently mutated; a cached read here would be a
      // cross-user leak at worst and a stale screen at best.
      cache: "no-store",
    });
  } catch (cause) {
    throw new NetworkError(undefined, { cause });
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // A proxy or load balancer answering with HTML. Leave `parsed` null so the error path
      // falls back to a generic envelope rather than throwing a SyntaxError from here.
      parsed = null;
    }
  }

  if (!response.ok) throw toApiError(response.status, parsed);

  return parsed as T;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 41 tests.

- [ ] **Step 5: Create `.env.example`**

```bash
# The portal talks to sentry-pos-be server-side only. NEVER prefix this NEXT_PUBLIC_ —
# the browser must not learn the API's address, let alone hold a token for it.
API_URL=http://localhost:4000/v1

# Payload CMS (existing)
DATABASE_URI=postgres://cms_user:cms@localhost:5433/sentry_cms
PAYLOAD_SECRET=change-me
```

Check the existing `.env` / `.env.local` for the real Payload values before writing this file, and keep whatever is already documented there. Add `API_URL` to your own `.env.local` too.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/fetch.ts src/lib/api/fetch.test.ts .env.example
git commit -m "feat: add the server-side API client"
```

---

### Task 5: Middleware — the guard and the only refresh

**Files:**
- Create: `src/middleware.ts`
- Test: `src/middleware.test.ts`

**Interfaces:**
- Consumes: `decodeJwtPayload`, `needsRefresh` from `@/lib/auth/jwt`
- Produces: the `middleware` export and its `config.matcher`. Nothing imports from it.

- [ ] **Step 1: Write the failing test — `src/middleware.test.ts`**

```ts
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
    expect(res.status).toBe(307);
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
    const [url, init] = spy.mock.calls[0] as [string | URL, RequestInit];
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test src/middleware.test.ts`
Expected: FAIL — cannot resolve `./middleware`.

- [ ] **Step 3: Create `src/middleware.ts`**

```ts
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
    if (!rotated) return signOut(request);
    access = rotated.accessToken;
    // Make the render that follows see the new token rather than the stale one.
    request.cookies.set(ACCESS_COOKIE, rotated.accessToken);
    request.cookies.set(REFRESH_COOKIE, rotated.refreshToken);
  }

  if (!access) return redirectToLogin(request);

  const payload = decodeJwtPayload(access);
  // `kind: "preauth"` means the password step passed but TOTP did not. Every API guard
  // rejects it, so treat it as no session at all.
  if (!payload || payload.kind === "preauth") return signOut(request);

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

  function redirectToLogin(req: NextRequest): NextResponse {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  function signOut(req: NextRequest): NextResponse {
    const response = redirectToLogin(req);
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }
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
    maxAge: 60 * 60 * 24 * 30,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 51 tests.

Note: `src/middleware.ts` and `src/lib/auth/session.ts` duplicate the cookie names and flags. That is deliberate — middleware runs on the Edge runtime and cannot import `server-only` modules, and `session.ts` imports `next/headers`, which does not exist there. The test above asserts both halves independently so a change to one that is not mirrored in the other fails.

- [ ] **Step 5: Verify the build**

Run: `pnpm lint && pnpm build`
Expected: both succeed, and the build output lists `ƒ Middleware`.

- [ ] **Step 6: Commit**

```bash
git add src/middleware.ts src/middleware.test.ts
git commit -m "feat: guard the portal and refresh tokens in middleware"
```

---

### Task 6: UI foundation

shadcn/ui's structure and API — `src/components/ui/`, `cn()`, `cva` variants — with the components written directly against the Sentry tokens rather than generated in shadcn's stock palette and recoloured afterwards. `components.json` is committed so the CLI can add the heavier primitives (dialog, select, command) in later phases.

**Files:**
- Modify: `package.json`, `src/app/globals.css`
- Create: `components.json`, `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`, `input.tsx`, `label.tsx`, `alert.tsx`, `card.tsx`, `badge.tsx`, `table.tsx`, `field.tsx`
- Test: `src/components/ui/ui.test.tsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `cn(...inputs: ClassValue[]): string`
  - `<Button variant?: "primary"|"secondary"|"ghost"|"destructive" size?: "sm"|"md">`, `buttonVariants`
  - `<Input>`, `<Label>`, `<Alert tone?: "danger"|"warn"|"info">`, `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardBody>`, `<Badge tone?: "neutral"|"success"|"warn"|"danger">`
  - `<Table>`, `<THead>`, `<TBody>`, `<TR>`, `<TH>`, `<TD>`
  - `<Field name label error? hint? children>` — label + control + error text, wired by id

- [ ] **Step 1: Install the styling dependencies**

```bash
pnpm add clsx tailwind-merge class-variance-authority lucide-react
```

- [ ] **Step 2: Create `components.json`**

Committed so `pnpm dlx shadcn@latest add <component>` works in later phases. Do **not** run `shadcn init` — it rewrites `globals.css` with its own palette and would flatten the Sentry tokens.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Add the semantic layer to `src/app/globals.css`**

Inside the existing `@theme inline { … }` block, immediately before the closing `}` (after `--radius-xl: 16px;`), add:

```css

  /* -----------------------------------------------------------------------------------------
     shadcn/ui semantic layer — portal only. Any primitive added by the shadcn CLI references
     these names, so every one of them resolves to a Sentry token from the block above.
     The values are repeated as literals rather than written as var(--color-ink): `@theme
     inline` does not emit its variables to :root, so a var() reference here would resolve to
     nothing at runtime. Each line names the token it mirrors — change both together.
     ----------------------------------------------------------------------------------------- */
  --color-background: #ffffff;            /* canvas */
  --color-foreground: #001e2b;            /* ink */
  --color-card: #ffffff;                  /* canvas */
  --color-card-foreground: #001e2b;       /* ink */
  --color-popover: #ffffff;               /* canvas */
  --color-popover-foreground: #001e2b;    /* ink */
  --color-primary: #00684a;               /* brand-green-dark — carries white text at AA */
  --color-primary-foreground: #ffffff;
  --color-secondary: #edf1f0;             /* surface-soft */
  --color-secondary-foreground: #001e2b;  /* ink */
  --color-muted: #f9fbfa;                 /* surface */
  --color-muted-foreground: #5c6c75;      /* steel */
  --color-accent: #e3fcf7;                /* brand-green-soft */
  --color-accent-foreground: #00684a;     /* brand-green-dark */
  --color-destructive: #b1371f;           /* danger */
  --color-destructive-foreground: #ffffff;
  --color-border: #e8edeb;                /* hairline */
  --color-input: #c1c7c6;                 /* hairline-strong */
  --color-ring: #00a35c;                  /* brand-green-mid */
  --radius: 12px;                         /* radius-lg */
```

The brand green `#00ed64` is deliberately **not** `--color-primary`: white text on it fails contrast. It stays available as `bg-brand-green` for accents.

- [ ] **Step 4: Create `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges class names, letting a caller's utility win over a component's default. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Write the failing test — `src/components/ui/ui.test.tsx`**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Alert } from "./alert";
import { Badge } from "./badge";
import { Button } from "./button";
import { Field } from "./field";
import { Input } from "./input";

describe("Button", () => {
  it("is a submit button when asked, so a form posts on Enter", () => {
    render(<Button type="submit">Sign in</Button>);
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Cancel</Button>);
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("type", "button");
  });

  it("keeps a caller's classes alongside its own", () => {
    render(<Button className="w-full">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveClass("w-full");
  });
});

describe("Field", () => {
  it("labels the control, so clicking the label focuses the input", () => {
    render(
      <Field name="email" label="Email address">
        <Input name="email" />
      </Field>,
    );
    expect(screen.getByLabelText("Email address")).toBe(
      screen.getByRole("textbox"),
    );
  });

  it("announces an error and marks the control invalid", () => {
    render(
      <Field name="email" label="Email address" error="email must be an email">
        <Input name="email" />
      </Field>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("email must be an email");
    expect(screen.getByRole("alert")).toHaveTextContent("email must be an email");
  });

  it("shows a hint when there is no error, and hides it once there is one", () => {
    const { rerender } = render(
      <Field name="pin" label="Refund PIN" hint="Six digits.">
        <Input name="pin" />
      </Field>,
    );
    expect(screen.getByText("Six digits.")).toBeInTheDocument();

    rerender(
      <Field name="pin" label="Refund PIN" hint="Six digits." error="pin is too short">
        <Input name="pin" />
      </Field>,
    );
    expect(screen.queryByText("Six digits.")).not.toBeInTheDocument();
  });
});

describe("Alert", () => {
  it("is announced to assistive tech", () => {
    render(<Alert tone="danger">Something went wrong.</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong.");
  });
});

describe("Badge", () => {
  it("renders its label", () => {
    render(<Badge tone="danger">suspended</Badge>);
    expect(screen.getByText("suspended")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `pnpm test src/components/ui/ui.test.tsx`
Expected: FAIL — cannot resolve `./alert`.

- [ ] **Step 7: Create `src/components/ui/button.tsx`**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-brand-green-mid",
        secondary: "bg-secondary text-secondary-foreground hover:bg-hairline",
        ghost: "text-slate hover:bg-surface-soft",
        destructive: "bg-destructive text-destructive-foreground hover:bg-danger",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/**
 * `type` defaults to "button". HTML defaults it to "submit", which turns every incidental
 * button inside a form into a submit — a real source of accidental posts.
 */
export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

- [ ] **Step 8: Create `src/components/ui/input.tsx`**

```tsx
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground",
        "placeholder:text-stone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 9: Create `src/components/ui/label.tsx`**

```tsx
import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-charcoal", className)} {...props} />;
}
```

- [ ] **Step 10: Create `src/components/ui/field.tsx`**

```tsx
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Label } from "./label";

export interface FieldProps {
  /** Must match the control's `name`; it is also the id the label points at. */
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/**
 * Label, control and error text, wired together by id.
 *
 * The control is cloned to receive `id`, `aria-invalid` and `aria-describedby` so callers
 * cannot forget them — an unlabelled input and an error only sighted users can see are the
 * two failures that show up over and over in hand-wired forms.
 */
export function Field({ name, label, error, hint, children }: FieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: name,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-steel">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 11: Create `src/components/ui/alert.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  danger: "border-danger/30 bg-danger-bg text-danger",
  warn: "border-warn-text/25 bg-warn-bg text-warn-text",
  info: "border-hairline bg-surface text-slate",
} as const;

export function Alert({
  tone = "danger",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="alert" className={cn("rounded-lg border px-3 py-2 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 12: Create `src/components/ui/badge.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-surface-soft text-slate",
  success: "bg-brand-green-soft text-brand-green-dark",
  warn: "bg-warn-bg text-warn-text",
  danger: "bg-danger-bg text-danger",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 13: Create `src/components/ui/card.tsx`**

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-hairline bg-card", className)} {...props} />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-hairline px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold text-ink", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}
```

- [ ] **Step 14: Create `src/components/ui/table.tsx`**

```tsx
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  // Wide tables scroll inside their own container; the page never scrolls sideways.
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-hairline text-left", className)} {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-hairline-soft last:border-0", className)} {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-4 py-2.5 text-xs font-semibold text-steel", className)} {...props} />
  );
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 text-charcoal", className)} {...props} />;
}
```

- [ ] **Step 15: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 59 tests.

- [ ] **Step 16: Verify the marketing site still builds unchanged**

Run: `pnpm lint && pnpm build`
Expected: both succeed. The new tokens are additive; no existing page should change.

- [ ] **Step 17: Commit**

```bash
git add package.json pnpm-lock.yaml components.json src/lib/utils.ts src/components/ui src/app/globals.css
git commit -m "feat: add the portal UI primitives on the Sentry tokens"
```

---

### Task 7: Auth API module, form state, and the login screen

**Files:**
- Create: `src/lib/api/auth.ts`, `src/lib/forms/form-state.ts`
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/login/page.tsx`, `src/app/(app)/login/actions.ts`, `src/app/(app)/login/login-form.tsx`
- Create: `src/components/app/auth-card.tsx`
- Test: `src/lib/forms/form-state.test.ts`, `src/app/(app)/login/login-form.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` (Task 4); `writeSession`, `writePreauthToken` (Task 3); `Field`, `Input`, `Button`, `Alert` (Task 6)
- Produces:
  - `type LoginResult = { accessToken: string; refreshToken: string; role: string } | { totpRequired: true; preAuthToken: string } | { totpSetupRequired: true; preAuthToken: string }`
  - `login`, `logout`, `totpSetup`, `totpEnable`, `totpVerify`, `acceptInvite`, `requestPasswordReset`, `confirmPasswordReset` in `@/lib/api/auth`
  - `interface FormState { message?: string; fieldErrors?: Record<string, string>; attemptsRemaining?: number; retryAfterSeconds?: number; done?: true }`
  - `EMPTY_FORM_STATE: FormState`
  - `toFormState(error: unknown, fields: readonly string[]): FormState`
  - `<AuthCard title subtitle? children>`

- [ ] **Step 1: Create `src/lib/api/auth.ts`**

```ts
import "server-only";
import { apiFetch } from "./fetch";

/**
 * The three shapes `POST /v1/auth/login` can answer with. An owner is signed in outright;
 * a platform admin only ever gets a 5-minute preauth token, because the API refuses to
 * issue an access token to an admin on a password alone.
 */
export type LoginResult =
  | { accessToken: string; refreshToken: string; role: string }
  | { totpRequired: true; preAuthToken: string }
  | { totpSetupRequired: true; preAuthToken: string };

export function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: { email, password },
    authenticated: false,
  });
}

export function logout(refreshToken: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
    authenticated: false,
  });
}

/** Authenticates with the preauth token, not the session — there is no session yet. */
export function totpSetup(preAuthToken: string): Promise<{ secret: string; otpauthUri: string }> {
  return apiFetch("/auth/totp/setup", { method: "POST", token: preAuthToken });
}

export function totpEnable(
  preAuthToken: string,
  code: string,
): Promise<{ recoveryCodes: string[] }> {
  return apiFetch("/auth/totp/enable", { method: "POST", body: { code }, token: preAuthToken });
}

/** The preauth token rides in the body here, not the header — the API verifies it by hand. */
export function totpVerify(
  preAuthToken: string,
  code: string,
): Promise<{ accessToken: string; refreshToken: string; role: string }> {
  return apiFetch("/auth/totp/verify", {
    method: "POST",
    body: { preAuthToken, code },
    authenticated: false,
  });
}

export function acceptInvite(token: string, password: string): Promise<{ ok: true }> {
  return apiFetch("/auth/invite/accept", {
    method: "POST",
    body: { token, password },
    authenticated: false,
  });
}

/** Always resolves, whether or not the address exists. Do not let the UI reveal which. */
export function requestPasswordReset(email: string): Promise<void> {
  return apiFetch("/auth/password-reset/request", {
    method: "POST",
    body: { email },
    authenticated: false,
  });
}

export function confirmPasswordReset(token: string, password: string): Promise<void> {
  return apiFetch("/auth/password-reset/confirm", {
    method: "POST",
    body: { token, password },
    authenticated: false,
  });
}
```

- [ ] **Step 2: Write the failing test — `src/lib/forms/form-state.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { toFormState } from "./form-state";
import { NetworkError, toApiError } from "@/lib/api/errors";

describe("toFormState", () => {
  it("puts validation messages on their fields", () => {
    const state = toFormState(
      toApiError(422, { code: "validation", message: "email must be an email" }),
      ["email", "password"],
    );
    expect(state.fieldErrors).toEqual({ email: "email must be an email" });
    expect(state.message).toBeUndefined();
  });

  it("raises an unmatched validation segment to the form so it is still seen", () => {
    const state = toFormState(
      toApiError(422, { code: "validation", message: "something odd happened" }),
      ["email"],
    );
    expect(state.fieldErrors).toEqual({});
    expect(state.message).toBe("something odd happened");
  });

  it("carries attemptsRemaining off a wrong password", () => {
    const state = toFormState(
      toApiError(401, {
        code: "login_invalid",
        message: "Credentials are incorrect.",
        attemptsRemaining: 2,
      }),
      ["email", "password"],
    );
    expect(state.message).toBe("Credentials are incorrect.");
    expect(state.attemptsRemaining).toBe(2);
  });

  it("carries retryAfterSeconds off a lockout", () => {
    const state = toFormState(
      toApiError(423, { code: "login_locked", message: "Locked.", retryAfterSeconds: 300 }),
      ["email"],
    );
    expect(state.retryAfterSeconds).toBe(300);
  });

  it("puts a duplicate-email conflict on the email field, where the user can fix it", () => {
    const state = toFormState(
      toApiError(409, { code: "email_taken", message: "This email is already in use." }),
      ["name", "email"],
    );
    expect(state.fieldErrors).toEqual({ email: "This email is already in use." });
  });

  it("explains a transport failure rather than showing a blank form", () => {
    const state = toFormState(new NetworkError(), ["email"]);
    expect(state.message).toMatch(/reach/i);
  });

  it("shows the requestId on an unrecognised failure, so support has a handle", () => {
    const state = toFormState(
      toApiError(500, {
        code: "internal_error",
        message: "An unexpected error occurred.",
        requestId: "req-42",
      }),
      ["email"],
    );
    expect(state.message).toContain("req-42");
  });

  it("re-throws anything that is not an API error — a bug must not look like a form error", () => {
    expect(() => toFormState(new TypeError("undefined is not a function"), [])).toThrow(TypeError);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm test src/lib/forms/form-state.test.ts`
Expected: FAIL — cannot resolve `./form-state`.

- [ ] **Step 4: Create `src/lib/forms/form-state.ts`**

```ts
import {
  ApiError,
  ConflictError,
  LockedError,
  LoginInvalidError,
  NetworkError,
  ValidationError,
} from "@/lib/api/errors";

/** What every Server Action in this app returns to `useActionState`. */
export interface FormState {
  /** Form-level message, shown above the fields. */
  message?: string;
  /** Keyed by field name, shown under the matching input. */
  fieldErrors?: Record<string, string>;
  attemptsRemaining?: number;
  retryAfterSeconds?: number;
  /** Set by actions that succeed without navigating away. */
  done?: true;
}

export const EMPTY_FORM_STATE: FormState = {};

/**
 * Turns a thrown API error into something a form can render.
 *
 * Anything that is not an `ApiError` or `NetworkError` is re-thrown deliberately: a
 * TypeError from our own code is a bug, and swallowing it into a red message under an input
 * is how bugs get mistaken for user error and go unreported.
 */
export function toFormState(error: unknown, fields: readonly string[]): FormState {
  if (error instanceof NetworkError) {
    return { message: "Could not reach the Sentry API. Check your connection and try again." };
  }

  if (error instanceof ValidationError) {
    const { fieldErrors, formErrors } = error.forFields(fields);
    return {
      fieldErrors,
      message: formErrors.length > 0 ? formErrors.join(" ") : undefined,
    };
  }

  if (error instanceof LoginInvalidError) {
    return { message: error.message, attemptsRemaining: error.attemptsRemaining };
  }

  if (error instanceof LockedError) {
    return { message: error.message, retryAfterSeconds: error.retryAfterSeconds };
  }

  // A uniqueness collision is always about a specific value the user typed. Put it on that
  // input if we can identify it; `email` is the only unique field in this phase.
  if (error instanceof ConflictError && fields.includes("email")) {
    return { fieldErrors: { email: error.message } };
  }

  if (error instanceof ApiError) {
    return {
      message: error.requestId
        ? `${error.message} (reference ${error.requestId})`
        : error.message,
    };
  }

  throw error;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 67 tests.

- [ ] **Step 6: Create `src/app/(app)/layout.tsx`**

The `(app)` group needs its own root: each top-level route group owns a full document. The
fonts are loaded the same way `(frontend)/layout.tsx` does, so the portal and the marketing
site render in the same typefaces.

```tsx
import type { Metadata } from "next";
import { Figtree, Source_Code_Pro } from "next/font/google";
import "../globals.css";

// Same stand-ins the marketing site and the terminal use — design-spec names Euclid
// Circular A, whose licensing is pending. Source Code Pro carries every peso figure.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-scp",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sentry",
  // The authenticated app must never appear in a search index.
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${figtree.variable} ${sourceCodePro.variable} min-h-screen bg-surface font-sans text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Create `src/components/app/auth-card.tsx`**

```tsx
import type { ReactNode } from "react";

/** The centred card every unauthenticated screen sits in. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-steel">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Create `src/app/(app)/login/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/api/auth";
import { writePreauthToken, writeSession } from "@/lib/auth/session";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["email", "password"] as const;

/** Only same-origin absolute paths are honoured, so `next` cannot become an open redirect. */
function safeNext(candidate: FormDataEntryValue | null, role: string): string {
  const home = role === "platform_admin" ? "/admin" : "/portal";
  if (typeof candidate !== "string") return home;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return home;
  const admin = candidate.startsWith("/admin");
  // Sending an owner to an admin URL would only bounce off middleware. Go home instead.
  return admin === (role === "platform_admin") ? candidate : home;
}

export async function loginAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      fieldErrors: {
        ...(email ? {} : { email: "Enter your email address." }),
        ...(password ? {} : { password: "Enter your password." }),
      },
    };
  }

  let destination: string;
  try {
    const result = await login(email, password);

    if ("accessToken" in result) {
      await writeSession(result.accessToken, result.refreshToken);
      destination = safeNext(formData.get("next"), result.role);
    } else {
      await writePreauthToken(result.preAuthToken);
      destination = "totpRequired" in result ? "/login/totp" : "/login/totp/setup";
    }
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  // redirect() signals by throwing, so it must sit outside the try — inside, the catch
  // would treat the navigation as a failure and re-render the form.
  redirect(destination);
}
```

A `"use server"` module may export **only** async functions. Do not re-export
`EMPTY_FORM_STATE` or the `FormState` type from here — the client imports both straight from
`@/lib/forms/form-state`. (`import type` is erased at compile time and is therefore fine.)

- [ ] **Step 9: Create `src/app/(app)/login/login-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : children}
    </Button>
  );
}

export function LoginForm({
  action,
  next,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  next?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.message ? (
        <Alert tone={state.retryAfterSeconds ? "warn" : "danger"}>
          {state.message}
          {state.attemptsRemaining !== undefined ? (
            <> {state.attemptsRemaining} attempt{state.attemptsRemaining === 1 ? "" : "s"} remaining.</>
          ) : null}
          {state.retryAfterSeconds ? (
            <> Try again in {Math.ceil(state.retryAfterSeconds / 60)} minute
              {Math.ceil(state.retryAfterSeconds / 60) === 1 ? "" : "s"}.</>
          ) : null}
        </Alert>
      ) : null}

      <Field name="email" label="Email address" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="username" autoFocus />
      </Field>

      <Field name="password" label="Password" error={state.fieldErrors?.password}>
        <Input name="password" type="password" autoComplete="current-password" />
      </Field>

      <SubmitButton>Sign in</SubmitButton>

      <p className="text-center text-sm">
        <a href="/forgot" className="text-brand-green-dark hover:underline">
          Forgot your password?
        </a>
      </p>
    </form>
  );
}
```

- [ ] **Step 10: Create `src/app/(app)/login/page.tsx`**

```tsx
import { AuthCard } from "@/components/app/auth-card";
import { loginAction } from "./actions";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthCard title="Sign in to Sentry">
      <LoginForm action={loginAction} next={next} />
    </AuthCard>
  );
}
```

- [ ] **Step 11: Write the login form test — `src/app/(app)/login/login-form.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";
import type { FormState } from "@/lib/forms/form-state";

describe("LoginForm", () => {
  it("submits what the user typed", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "maria@kapediaria.ph");
    await userEvent.type(screen.getByLabelText("Password"), "sentry-demo");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("email")).toBe("maria@kapediaria.ph");
    expect(formData.get("password")).toBe("sentry-demo");
  });

  it("carries the requested destination through the form", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<LoginForm action={action} next="/portal/settings" />);

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect((action.mock.calls[0][1] as FormData).get("next")).toBe("/portal/settings");
  });

  it("shows how many attempts remain after a wrong password", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        message: "Credentials are incorrect.",
        attemptsRemaining: 2,
      }),
    );
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Credentials are incorrect. 2 attempts remaining.",
    );
  });

  it("counts a lockout down in minutes instead of showing a bare failure", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ message: "Locked.", retryAfterSeconds: 300 }),
    );
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Try again in 5 minutes.");
  });

  it("puts a field error under its own input", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { email: "email must be an email" },
      }),
    );
    render(<LoginForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByLabelText("Email address")).toHaveAccessibleDescription(
      "email must be an email",
    );
  });
});
```

- [ ] **Step 12: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 72 tests.

- [ ] **Step 13: Verify the build**

Run: `pnpm lint && pnpm build`
Expected: both succeed; the build lists `/login` as a route.

- [ ] **Step 14: Commit**

```bash
git add src/lib/api/auth.ts src/lib/forms src/app/\(app\) src/components/app
git commit -m "feat: add the login screen and the auth API module"
```

---

### Task 8: TOTP setup and verification

A platform admin never signs in on a password alone. First login enrols an authenticator and issues recovery codes; every login after that asks for a code.

**Files:**
- Create: `src/app/(app)/login/totp/page.tsx`, `actions.ts`, `totp-form.tsx`
- Create: `src/app/(app)/login/totp/setup/page.tsx`, `setup-form.tsx`
- Create: `src/components/app/qr-code.tsx`
- Test: `src/app/(app)/login/totp/totp-form.test.tsx`

**Interfaces:**
- Consumes: `totpSetup`, `totpEnable`, `totpVerify` (Task 7); `readPreauthToken`, `clearPreauthToken`, `writeSession` (Task 3)
- Produces:
  - `verifyTotpAction(state: FormState, formData: FormData): Promise<FormState>`
  - `enableTotpAction(state: FormState, formData: FormData): Promise<FormState>` — returns `{ done: true, recoveryCodes }` on success
  - `<QrCode value: string size?: number>` — renders an `otpauth://` URI as an inline SVG

- [ ] **Step 1: Install a QR encoder**

```bash
pnpm add qrcode
pnpm add -D @types/qrcode
```

- [ ] **Step 2: Create `src/components/app/qr-code.tsx`**

```tsx
import { toString as qrToString } from "qrcode";

/**
 * Renders the otpauth URI as an inline SVG on the server. Doing it server-side keeps the
 * secret out of the client bundle and off the network as an image request.
 */
export async function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const svg = await qrToString(value, { type: "svg", margin: 1, width: size });
  return (
    <div
      aria-hidden="true"
      className="inline-block rounded-lg border border-hairline bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

- [ ] **Step 3: Create `src/app/(app)/login/totp/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { totpEnable, totpVerify } from "@/lib/api/auth";
import { clearPreauthToken, readPreauthToken, writeSession } from "@/lib/auth/session";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["code"] as const;

/**
 * A type, not a value — `"use server"` modules may export only async functions, and a type
 * export is erased before that rule is checked. Consumers must use `import type`.
 */
export interface TotpEnableState extends FormState {
  recoveryCodes?: string[];
}

export async function verifyTotpAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { fieldErrors: { code: "Enter the code from your authenticator." } };

  const preAuthToken = await readPreauthToken();
  if (!preAuthToken) {
    // The five-minute window closed. Start again rather than failing cryptically.
    redirect("/login?expired=1");
  }

  try {
    const { accessToken, refreshToken } = await totpVerify(preAuthToken, code);
    await writeSession(accessToken, refreshToken);
    await clearPreauthToken();
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  redirect("/admin");
}

/**
 * Enrolment. On success the recovery codes come back once and are handed to the client to
 * display — the session is deliberately NOT created here: the admin must confirm they have
 * saved the codes, then sign in again with their new authenticator.
 */
export async function enableTotpAction(
  _previous: TotpEnableState,
  formData: FormData,
): Promise<TotpEnableState> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { fieldErrors: { code: "Enter the six-digit code." } };

  const preAuthToken = await readPreauthToken();
  if (!preAuthToken) redirect("/login?expired=1");

  try {
    const { recoveryCodes } = await totpEnable(preAuthToken, code);
    return { done: true, recoveryCodes };
  } catch (error) {
    return toFormState(error, FIELDS);
  }
}
```

- [ ] **Step 4: Create `src/app/(app)/login/totp/totp-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Checking…" : label}
    </Button>
  );
}

/**
 * One form for both the enrolment confirmation and the everyday sign-in check. The field
 * accepts a recovery code as well as a TOTP code — the API takes either in the same slot —
 * so it must not be constrained to six digits.
 */
export function TotpForm({
  action,
  label = "Verify",
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  label?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? (
        <Alert tone={state.retryAfterSeconds ? "warn" : "danger"}>
          {state.message}
          {state.retryAfterSeconds ? (
            <> Try again in {Math.ceil(state.retryAfterSeconds / 60)} minutes.</>
          ) : null}
        </Alert>
      ) : null}

      <Field
        name="code"
        label="Authentication code"
        error={state.fieldErrors?.code}
        hint="Six digits from your authenticator, or one of your recovery codes."
      >
        <Input
          name="code"
          inputMode="text"
          autoComplete="one-time-code"
          autoFocus
          className="font-mono tracking-widest"
        />
      </Field>

      <SubmitButton label={label} />
    </form>
  );
}
```

- [ ] **Step 5: Create `src/app/(app)/login/totp/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/app/auth-card";
import { readPreauthToken } from "@/lib/auth/session";
import { verifyTotpAction } from "./actions";
import { TotpForm } from "./totp-form";

export default async function TotpPage() {
  if (!(await readPreauthToken())) redirect("/login");

  return (
    <AuthCard
      title="Two-factor authentication"
      subtitle="Enter the code from your authenticator app to finish signing in."
    >
      <TotpForm action={verifyTotpAction} label="Verify" />
    </AuthCard>
  );
}
```

- [ ] **Step 6: Create `src/app/(app)/login/totp/setup/setup-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE } from "@/lib/forms/form-state";
import type { TotpEnableState } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Confirming…" : "Confirm and continue"}
    </Button>
  );
}

export function SetupForm({
  action,
}: {
  action: (state: TotpEnableState, formData: FormData) => Promise<TotpEnableState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE as TotpEnableState);

  if (state.done && state.recoveryCodes) {
    return (
      <div className="space-y-4">
        <Alert tone="warn">
          These recovery codes are shown once and cannot be retrieved again. Save them
          somewhere safe — each one signs you in if you lose your authenticator.
        </Alert>
        <ul className="grid grid-cols-2 gap-2 rounded-lg border border-hairline bg-surface p-4 font-mono text-sm">
          {state.recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
        <Button
          className="w-full"
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          I have saved these — sign in
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? <Alert>{state.message}</Alert> : null}
      <Field
        name="code"
        label="Six-digit code"
        error={state.fieldErrors?.code}
        hint="From the app you just scanned the code with."
      >
        <Input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          className="font-mono tracking-widest"
        />
      </Field>
      <SubmitButton />
    </form>
  );
}
```

- [ ] **Step 7: Create `src/app/(app)/login/totp/setup/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/app/auth-card";
import { QrCode } from "@/components/app/qr-code";
import { totpSetup } from "@/lib/api/auth";
import { readPreauthToken } from "@/lib/auth/session";
import { enableTotpAction } from "../actions";
import { SetupForm } from "./setup-form";

export default async function TotpSetupPage() {
  const preAuthToken = await readPreauthToken();
  if (!preAuthToken) redirect("/login");

  const { secret, otpauthUri } = await totpSetup(preAuthToken);

  return (
    <AuthCard
      title="Set up two-factor authentication"
      subtitle="Platform admin accounts require an authenticator app. Scan this once, then confirm."
    >
      <div className="space-y-4">
        <div className="text-center">
          <QrCode value={otpauthUri} />
        </div>
        <div className="rounded-lg border border-hairline bg-surface px-3 py-2">
          <p className="text-xs text-steel">Or enter this key by hand</p>
          <p className="mt-1 font-mono text-sm break-all text-charcoal">{secret}</p>
        </div>
        <SetupForm action={enableTotpAction} />
      </div>
    </AuthCard>
  );
}
```

- [ ] **Step 8: Write the test — `src/app/(app)/login/totp/totp-form.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TotpForm } from "./totp-form";
import { SetupForm } from "./setup/setup-form";
import type { FormState } from "@/lib/forms/form-state";
import type { TotpEnableState } from "./actions";

describe("TotpForm", () => {
  it("submits the code", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<TotpForm action={action} />);

    await userEvent.type(screen.getByLabelText("Authentication code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect((action.mock.calls[0][1] as FormData).get("code")).toBe("123456");
  });

  it("accepts a recovery code, which is longer than six digits", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<TotpForm action={action} />);

    const field = screen.getByLabelText("Authentication code");
    await userEvent.type(field, "abcd-efgh-ijkl");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect((action.mock.calls[0][1] as FormData).get("code")).toBe("abcd-efgh-ijkl");
  });

  it("reports an invalid code", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ message: "TOTP code or recovery code is invalid." }),
    );
    render(<TotpForm action={action} />);

    await userEvent.type(screen.getByLabelText("Authentication code"), "000000");
    await userEvent.click(screen.getByRole("button", { name: "Verify" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("invalid");
  });
});

describe("SetupForm", () => {
  it("shows every recovery code once enrolment succeeds", async () => {
    const action = vi.fn(
      async (): Promise<TotpEnableState> => ({
        done: true,
        recoveryCodes: ["aaa-111", "bbb-222", "ccc-333"],
      }),
    );
    render(<SetupForm action={action} />);

    await userEvent.type(screen.getByLabelText("Six-digit code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Confirm and continue" }));

    expect(await screen.findByText("aaa-111")).toBeInTheDocument();
    expect(screen.getByText("bbb-222")).toBeInTheDocument();
    expect(screen.getByText("ccc-333")).toBeInTheDocument();
  });

  it("warns that the codes cannot be retrieved again", async () => {
    const action = vi.fn(
      async (): Promise<TotpEnableState> => ({ done: true, recoveryCodes: ["aaa-111"] }),
    );
    render(<SetupForm action={action} />);

    await userEvent.type(screen.getByLabelText("Six-digit code"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Confirm and continue" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("shown once");
  });
});
```

- [ ] **Step 9: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 77 tests.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/\(app\)/login src/components/app/qr-code.tsx
git commit -m "feat: enrol and verify platform-admin TOTP"
```

---

### Task 9: Invite acceptance and password recovery

The three token-driven screens. Their paths are **not** free to choose — the API emails
`${APP_URL}/invite/accept?token=…` and `${APP_URL}/password-reset/confirm?token=…`.

**Files:**
- Create: `src/app/(app)/invite/accept/page.tsx`, `actions.ts`, `accept-form.tsx`
- Create: `src/app/(app)/password-reset/confirm/page.tsx`, `actions.ts`, `reset-form.tsx`
- Create: `src/app/(app)/forgot/page.tsx`, `actions.ts`, `forgot-form.tsx`
- Test: `src/app/(app)/forgot/forgot-form.test.tsx`, `src/app/(app)/invite/accept/accept-form.test.tsx`

**Interfaces:**
- Consumes: `acceptInvite`, `requestPasswordReset`, `confirmPasswordReset` (Task 7)
- Produces:
  - `acceptInviteAction`, `requestResetAction`, `confirmResetAction` — all `(state: FormState, formData: FormData) => Promise<FormState>`
  - `<PasswordSetForm action token submitLabel>` — shared by invite acceptance and reset confirmation

- [ ] **Step 1: Create `src/app/(app)/forgot/actions.ts`**

```ts
"use server";

import { requestPasswordReset } from "@/lib/api/auth";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function requestResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { fieldErrors: { email: "Enter your email address." } };

  try {
    await requestPasswordReset(email);
  } catch (error) {
    return toFormState(error, ["email"]);
  }

  // The API answers 204 whether or not the address exists, specifically so this screen
  // cannot be used to discover who has an account. Never branch on the result.
  return { done: true };
}
```

- [ ] **Step 2: Create `src/app/(app)/forgot/forgot-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </Button>
  );
}

export function ForgotForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  if (state.done) {
    return (
      <Alert tone="info">
        If an account exists for that address, a reset link is on its way. The link expires in
        one hour.
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? <Alert>{state.message}</Alert> : null}
      <Field name="email" label="Email address" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="username" autoFocus />
      </Field>
      <SubmitButton />
      <p className="text-center text-sm">
        <a href="/login" className="text-brand-green-dark hover:underline">
          Back to sign in
        </a>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Create `src/app/(app)/forgot/page.tsx`**

```tsx
import { AuthCard } from "@/components/app/auth-card";
import { requestResetAction } from "./actions";
import { ForgotForm } from "./forgot-form";

export default function ForgotPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="We will email you a link to choose a new one."
    >
      <ForgotForm action={requestResetAction} />
    </AuthCard>
  );
}
```

- [ ] **Step 4: Create the shared password form — `src/components/app/password-set-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

/**
 * Choosing a password against a single-use token. Shared by invite acceptance and reset
 * confirmation — the two flows differ only in wording and in which endpoint the action
 * calls.
 */
export function PasswordSetForm({
  action,
  token,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  token: string;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      {state.message ? <Alert>{state.message}</Alert> : null}

      <Field
        name="password"
        label="New password"
        error={state.fieldErrors?.password}
        hint="At least 8 characters."
      >
        <Input name="password" type="password" autoComplete="new-password" autoFocus />
      </Field>

      <Field name="confirm" label="Confirm password" error={state.fieldErrors?.confirm}>
        <Input name="confirm" type="password" autoComplete="new-password" />
      </Field>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
```

- [ ] **Step 5: Create `src/app/(app)/invite/accept/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { acceptInvite } from "@/lib/api/auth";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function acceptInviteAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { fieldErrors: { password: "Use at least 8 characters." } };
  }
  if (password !== confirm) {
    return { fieldErrors: { confirm: "The two passwords do not match." } };
  }

  try {
    await acceptInvite(token, password);
  } catch (error) {
    return toFormState(error, ["password"]);
  }

  redirect("/login?activated=1");
}
```

- [ ] **Step 6: Create `src/app/(app)/invite/accept/page.tsx`**

```tsx
import { AuthCard } from "@/components/app/auth-card";
import { PasswordSetForm } from "@/components/app/password-set-form";
import { Alert } from "@/components/ui/alert";
import { acceptInviteAction } from "./actions";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="Activate your account">
        <Alert>
          This link is missing its token. Open the link from your invitation email exactly as
          it was sent.
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Activate your account"
      subtitle="Choose a password to finish setting up your Sentry account."
    >
      <PasswordSetForm action={acceptInviteAction} token={token} submitLabel="Activate account" />
    </AuthCard>
  );
}
```

- [ ] **Step 7: Create `src/app/(app)/password-reset/confirm/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { confirmPasswordReset } from "@/lib/api/auth";
import { clearSession } from "@/lib/auth/session";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function confirmResetAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { fieldErrors: { password: "Use at least 8 characters." } };
  }
  if (password !== confirm) {
    return { fieldErrors: { confirm: "The two passwords do not match." } };
  }

  try {
    await confirmPasswordReset(token, password);
    // The API revokes every refresh token on a reset. Whatever is in this browser's cookies
    // is already dead — drop it rather than leaving a session that 401s on its next move.
    await clearSession();
  } catch (error) {
    return toFormState(error, ["password"]);
  }

  redirect("/login?reset=1");
}
```

- [ ] **Step 8: Create `src/app/(app)/password-reset/confirm/page.tsx`**

```tsx
import { AuthCard } from "@/components/app/auth-card";
import { PasswordSetForm } from "@/components/app/password-set-form";
import { Alert } from "@/components/ui/alert";
import { confirmResetAction } from "./actions";

export default async function ConfirmResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="Choose a new password">
        <Alert>
          This link is missing its token. Open the link from your reset email exactly as it was
          sent, or <a href="/forgot" className="underline">request a new one</a>.
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <PasswordSetForm action={confirmResetAction} token={token} submitLabel="Save password" />
    </AuthCard>
  );
}
```

- [ ] **Step 9: Write the tests**

`src/app/(app)/forgot/forgot-form.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotForm } from "./forgot-form";
import type { FormState } from "@/lib/forms/form-state";

describe("ForgotForm", () => {
  it("gives the same answer whether or not the account exists", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({ done: true }));
    render(<ForgotForm action={action} />);

    await userEvent.type(screen.getByLabelText("Email address"), "nobody@nowhere.test");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("If an account exists");
    // No form remains to retry against, and nothing on screen says whether the address was real.
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
  });
});
```

`src/app/(app)/invite/accept/accept-form.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordSetForm } from "@/components/app/password-set-form";
import type { FormState } from "@/lib/forms/form-state";

describe("PasswordSetForm", () => {
  it("sends the token from the link along with the password", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<PasswordSetForm action={action} token="tok-123" submitLabel="Activate account" />);

    await userEvent.type(screen.getByLabelText("New password"), "correct-horse");
    await userEvent.type(screen.getByLabelText("Confirm password"), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: "Activate account" }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("token")).toBe("tok-123");
    expect(formData.get("password")).toBe("correct-horse");
    expect(formData.get("confirm")).toBe("correct-horse");
  });

  it("shows a mismatch against the confirm field", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { confirm: "The two passwords do not match." },
      }),
    );
    render(<PasswordSetForm action={action} token="t" submitLabel="Save password" />);

    await userEvent.type(screen.getByLabelText("New password"), "aaaaaaaa");
    await userEvent.type(screen.getByLabelText("Confirm password"), "bbbbbbbb");
    await userEvent.click(screen.getByRole("button", { name: "Save password" }));

    expect(await screen.findByLabelText("Confirm password")).toHaveAccessibleDescription(
      "The two passwords do not match.",
    );
  });

  it("reports a dead link without hinting why it is dead", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({ message: "This link is invalid or has expired." }),
    );
    render(<PasswordSetForm action={action} token="stale" submitLabel="Activate account" />);

    await userEvent.type(screen.getByLabelText("New password"), "correct-horse");
    await userEvent.type(screen.getByLabelText("Confirm password"), "correct-horse");
    await userEvent.click(screen.getByRole("button", { name: "Activate account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("invalid or has expired");
  });
});
```

- [ ] **Step 10: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — 81 tests.

- [ ] **Step 11: Point the backend at this app**

In `../sentry-pos-be/.env`, set `APP_URL=http://localhost:3100`. It defaults to
`http://localhost:3000`, which is the POS terminal — left there, every invite and reset
email links to an app that has no such route. Note this in the README in Task 14.

- [ ] **Step 12: Commit**

```bash
git add src/app/\(app\) src/components/app
git commit -m "feat: add invite acceptance and password recovery"
```

---

### Task 10: The application shell

Sidebar, top bar and sign-out, plus the layouts that wrap `/portal` and `/admin`.

**Files:**
- Create: `src/components/app/app-shell.tsx`, `src/components/app/sign-out.tsx`, `src/components/app/nav.tsx`
- Create: `src/app/(app)/admin/layout.tsx`, `src/app/(app)/portal/layout.tsx`, `src/app/(app)/portal/page.tsx`
- Create: `src/app/(app)/logout/route.ts`
- Create: `src/app/(app)/error.tsx`, `src/app/(app)/not-found.tsx`
- Test: `src/components/app/nav.test.tsx`

**Interfaces:**
- Consumes: `readRefreshToken`, `clearSession` (Task 3); `logout` (Task 7)
- Produces:
  - `<AppShell nav: NavItem[] title children>` — sidebar + top bar + main
  - `interface NavItem { href: string; label: string }`
  - `<Nav items: NavItem[]>` — marks the current section with `aria-current="page"`
  - `GET /logout` route handler

- [ ] **Step 1: Create `src/app/(app)/logout/route.ts`**

```ts
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
```

- [ ] **Step 2: Create `src/components/app/nav.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
}

/**
 * The current item is matched by prefix so a detail page keeps its section highlighted, but
 * an exact match is required for a section root — otherwise `/admin` would light up on
 * every admin page.
 */
export function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="space-y-0.5">
      {items.map((item) => {
        const current =
          pathname === item.href ||
          (item.href !== "/admin" && item.href !== "/portal" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition-colors",
              current
                ? "bg-brand-green-soft font-medium text-brand-green-dark"
                : "text-slate hover:bg-surface-soft",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Create `src/components/app/app-shell.tsx`**

```tsx
import type { ReactNode } from "react";
import { Nav, type NavItem } from "./nav";

/**
 * Desktop-first: the portal is a keyboard-and-mouse surface, the POS terminal is the tablet
 * one. Below `lg` the sidebar becomes a horizontal strip above the content rather than a
 * drawer — one fewer piece of state, and every section stays one tap away.
 */
export function AppShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-hairline bg-card p-4 lg:border-b-0 lg:border-r">
        <p className="px-3 pb-3 text-sm font-semibold tracking-tight text-ink">{title}</p>
        <Nav items={nav} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-end border-b border-hairline bg-card px-6 py-3">
          <a href="/logout" className="text-sm text-steel hover:text-charcoal hover:underline">
            Sign out
          </a>
        </header>
        <main className="min-w-0 flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/(app)/admin/layout.tsx`**

Only sections that exist get a nav item — a link to a route this plan does not build is a
link to a 404. Activity is reached from a business, not from the sidebar.

```tsx
import { AppShell } from "@/components/app/app-shell";

const NAV = [{ href: "/admin", label: "Owners" }];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Sentry — platform" nav={NAV}>
      {children}
    </AppShell>
  );
}
```

- [ ] **Step 5: Create `src/app/(app)/portal/layout.tsx` and a placeholder `page.tsx`**

The tenant surfaces land in the next plan; this establishes the shell and gives middleware
somewhere to send an owner.

```tsx
// src/app/(app)/portal/layout.tsx
import { AppShell } from "@/components/app/app-shell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell title="Sentry" nav={[{ href: "/portal", label: "Businesses" }]}>
      {children}
    </AppShell>
  );
}
```

```tsx
// src/app/(app)/portal/page.tsx
export default function PortalHomePage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold text-ink">Businesses</h1>
      <p className="text-sm text-steel">
        Catalog, branches, stock and terminals arrive in the next release.
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Create `src/app/(app)/error.tsx`**

```tsx
"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * The requestId is the only handle support has on the server-side log, so it is shown
 * whenever the API gave us one. `error.message` is safe to print: the API's exception filter
 * never puts internals in it.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const requestId = (error as { requestId?: string }).requestId;

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
      <Alert className="mt-4">{error.message || "An unexpected error occurred."}</Alert>
      {requestId ? (
        <p className="mt-3 font-mono text-xs text-steel">Reference: {requestId}</p>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
```

- [ ] **Step 7: Create `src/app/(app)/not-found.tsx`**

```tsx
export default function AppNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold text-ink">Not found</h1>
      <p className="mt-2 text-sm text-steel">
        That page does not exist, or it belongs to an account you cannot see.
      </p>
      <a href="/portal" className="mt-6 inline-block text-sm text-brand-green-dark hover:underline">
        Go back
      </a>
    </main>
  );
}
```

- [ ] **Step 8: Write the test — `src/components/app/nav.test.tsx`**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Nav } from "./nav";

const pathname = vi.hoisted(() => ({ current: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const ITEMS = [
  { href: "/admin", label: "Owners" },
  { href: "/admin/settings", label: "Settings" },
];

describe("Nav", () => {
  it("marks the section you are in", () => {
    pathname.current = "/admin/settings";
    render(<Nav items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Owners" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the section marked on a detail page beneath it", () => {
    pathname.current = "/admin/settings/deep";
    render(<Nav items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("aria-current", "page");
  });

  it("does not light up the root on every page under it", () => {
    pathname.current = "/admin/settings";
    render(<Nav items={ITEMS} />);
    expect(screen.getByRole("link", { name: "Owners" })).not.toHaveAttribute("aria-current");
  });
});
```

- [ ] **Step 9: Run the tests and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS — 84 tests; build lists `/login`, `/forgot`, `/portal`, `/admin`, `/logout`.

- [ ] **Step 10: Commit**

```bash
git add src/app/\(app\) src/components/app
git commit -m "feat: add the portal shell, sign-out and error boundaries"
```

---

### Task 11: Admin API module and the owner list

**Files:**
- Create: `src/lib/api/types.ts`, `src/lib/api/admin.ts`
- Create: `src/lib/format.ts`
- Create: `src/app/(app)/admin/page.tsx`, `src/components/app/owner-status-badge.tsx`
- Test: `src/lib/format.test.ts`, `src/components/app/owner-status-badge.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` (Task 4); `Table`/`Badge`/`Button` (Task 6)
- Produces:
  - `type OwnerStatus = "active" | "suspended" | "hard_suspended" | "closed"`
  - `interface Owner { id, createdAt, updatedAt, deletedAt, name, email, status, maxBusinesses, suspendedAt }`
  - `type BusinessType = "retail" | "fnb" | "mixed"`
  - `interface Business { id, createdAt, ownerId, name, type, currency, taxRate, serviceChargeRate, allowMiscItems, isDemo, dayStartTime, expiryWarningDays, logoPath, receiptHeader, receiptFooter }`
  - `interface Branch { id, createdAt, businessId, name, code, address }`
  - `interface AuditEntry { id, createdAt, actorType, actorId, ownerId, businessId, branchId, action, entityType, entityId, changes, metadata }`
  - `interface Paginated<T> { data: T[]; page: number; pageSize: number; total: number; totalPages: number }`
  - `listOwners()`, `getOwner(id)`, `createOwner(input)`, `updateOwner(id, input)`, `suspendOwner(id, tier)`, `reinstateOwner(id)`, `listOwnerBusinesses(ownerId)`, `listBusinessBranches(businessId)`, `listBusinessActivity(businessId, query)`
  - `formatManilaDateTime(iso: string): string`, `formatManilaDate(iso: string): string`
  - `<OwnerStatusBadge status: OwnerStatus>`

- [ ] **Step 1: Create `src/lib/api/types.ts`**

```ts
/**
 * Response shapes, mirroring the Prisma models the API returns.
 *
 * Written by hand on purpose: the backend's `openapi.json` documents request bodies only, so
 * a generated client would type every response as `unknown`. Dates arrive as ISO strings
 * because they crossed JSON — never `Date`.
 */

export type OwnerStatus = "active" | "suspended" | "hard_suspended" | "closed";

export interface Owner {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  name: string;
  email: string;
  status: OwnerStatus;
  maxBusinesses: number;
  suspendedAt: string | null;
}

export type BusinessType = "retail" | "fnb" | "mixed";

export interface Business {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  ownerId: string;
  name: string;
  type: BusinessType;
  currency: string;
  /** Decimal(5,4) — serialises as a string, e.g. "0.1200". */
  taxRate: string;
  serviceChargeRate: string;
  allowMiscItems: boolean;
  isDemo: boolean;
  dayStartTime: string;
  expiryWarningDays: number;
  logoPath: string | null;
  receiptHeader: string;
  receiptFooter: string;
}

export interface Branch {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  businessId: string;
  name: string;
  /** Immutable after creation: it is part of every receipt number this branch issues. */
  code: string;
  address: string;
}

export type ActorType = "owner" | "terminal" | "platform_admin";

export interface AuditEntry {
  id: string;
  createdAt: string;
  actorType: ActorType;
  actorId: string | null;
  ownerId: string | null;
  businessId: string | null;
  branchId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: unknown;
  metadata: unknown;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

- [ ] **Step 2: Create `src/lib/api/admin.ts`**

```ts
import "server-only";
import { apiFetch } from "./fetch";
import type { ActorType, AuditEntry, Branch, Business, Owner, Paginated } from "./types";

/**
 * Platform-admin endpoints. Everything here sits behind `AdminGuard` on the API.
 *
 * The browse calls are READ-ONLY by contract, not merely by convention: platform scope
 * cannot write tenant data at all — the API's tenancy choke point throws
 * `platform_write_forbidden` if it tries. Do not add a mutation to this module.
 */

export function listOwners(): Promise<Owner[]> {
  return apiFetch<Owner[]>("/admin/owners");
}

export function getOwner(id: string): Promise<Owner> {
  return apiFetch<Owner>(`/admin/owners/${id}`);
}

export interface CreateOwnerInput {
  name: string;
  email: string;
  /** 1–1000. The API rejects anything outside that range with a 422. */
  maxBusinesses: number;
}

/** Also mints a single-use invite and emails it. The owner activates at /invite/accept. */
export function createOwner(input: CreateOwnerInput): Promise<Owner> {
  return apiFetch<Owner>("/admin/owners", { method: "POST", body: input });
}

export function updateOwner(
  id: string,
  input: { name?: string; maxBusinesses?: number },
): Promise<Owner> {
  return apiFetch<Owner>(`/admin/owners/${id}`, { method: "PATCH", body: input });
}

/**
 * `default` → status `suspended`: the portal locks, but an open shift may finish selling.
 * `hard` → status `hard_suspended`: everything stops immediately.
 */
export function suspendOwner(id: string, tier: "default" | "hard"): Promise<Owner> {
  return apiFetch<Owner>(`/admin/owners/${id}/suspend`, { method: "POST", body: { tier } });
}

export function reinstateOwner(id: string): Promise<Owner> {
  return apiFetch<Owner>(`/admin/owners/${id}/reinstate`, { method: "POST" });
}

export function listOwnerBusinesses(ownerId: string): Promise<Business[]> {
  return apiFetch<Business[]>(`/admin/owners/${ownerId}/businesses`);
}

export function listBusinessBranches(businessId: string): Promise<Branch[]> {
  return apiFetch<Branch[]>(`/admin/businesses/${businessId}/branches`);
}

export interface ActivityQuery {
  branchId?: string;
  actorType?: ActorType;
  action?: string;
  /** ISO date-times, inclusive. */
  from?: string;
  to?: string;
  page?: number;
  /** 1–200; the API defaults to 50. */
  pageSize?: number;
}

export function listBusinessActivity(
  businessId: string,
  query: ActivityQuery = {},
): Promise<Paginated<AuditEntry>> {
  return apiFetch<Paginated<AuditEntry>>(`/admin/businesses/${businessId}/activity-log`, {
    query: { ...query },
  });
}
```

- [ ] **Step 3: Write the failing test — `src/lib/format.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { formatManilaDate, formatManilaDateTime } from "./format";

describe("Manila formatting", () => {
  it("shifts UTC into Asia/Manila, which is UTC+8", () => {
    // 2026-03-01T16:30:00Z is 2026-03-02 00:30 in Manila — a different calendar day.
    expect(formatManilaDateTime("2026-03-01T16:30:00.000Z")).toBe("2 Mar 2026, 12:30 AM");
  });

  it("formats a date without a time", () => {
    expect(formatManilaDate("2026-03-01T16:30:00.000Z")).toBe("2 Mar 2026");
  });

  it("keeps the same calendar day when the shift does not cross midnight", () => {
    expect(formatManilaDate("2026-03-01T01:00:00.000Z")).toBe("1 Mar 2026");
  });

  it("returns an em dash rather than 'Invalid Date' for an unusable value", () => {
    expect(formatManilaDateTime("not-a-date")).toBe("—");
    expect(formatManilaDate("")).toBe("—");
  });
});
```

- [ ] **Step 4: Create `src/lib/format.ts`**

```ts
/**
 * Timestamps are stored UTC and displayed Asia/Manila — the same rule the POS terminal
 * follows. The timezone is pinned explicitly rather than left to the viewer's locale so a
 * Sentry operator abroad reads the same clock as the business they are looking at.
 */

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function format(iso: string, formatter: Intl.DateTimeFormat): string {
  const date = new Date(iso);
  // A bad timestamp should read as absent, not as the words "Invalid Date" in a table cell.
  if (Number.isNaN(date.getTime())) return "—";
  return formatter.format(date);
}

export function formatManilaDateTime(iso: string): string {
  return format(iso, DATE_TIME);
}

export function formatManilaDate(iso: string): string {
  return format(iso, DATE_ONLY);
}
```

If the assertions in Step 3 fail only on separator or spacing (`en-GB` renders as
`2 Mar 2026, 12:30 am` on some ICU builds), fix the **test** to the runtime's actual output
rather than fighting the formatter — the behaviour under test is the timezone shift, not the
punctuation.

- [ ] **Step 5: Create `src/components/app/owner-status-badge.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import type { OwnerStatus } from "@/lib/api/types";

const PRESENTATION: Record<OwnerStatus, { label: string; tone: "success" | "warn" | "danger" | "neutral" }> = {
  active: { label: "Active", tone: "success" },
  suspended: { label: "Suspended", tone: "warn" },
  hard_suspended: { label: "Hard suspended", tone: "danger" },
  closed: { label: "Closed", tone: "neutral" },
};

export function OwnerStatusBadge({ status }: { status: OwnerStatus }) {
  const { label, tone } = PRESENTATION[status];
  return <Badge tone={tone}>{label}</Badge>;
}
```

- [ ] **Step 6: Write the test — `src/components/app/owner-status-badge.test.tsx`**

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OwnerStatusBadge } from "./owner-status-badge";
import type { OwnerStatus } from "@/lib/api/types";

describe("OwnerStatusBadge", () => {
  it("gives every status a readable label", () => {
    const statuses: OwnerStatus[] = ["active", "suspended", "hard_suspended", "closed"];
    for (const status of statuses) {
      const { unmount } = render(<OwnerStatusBadge status={status} />);
      // No raw enum value ever reaches the screen.
      expect(screen.queryByText(status)).not.toBeInTheDocument();
      unmount();
    }
  });

  it("distinguishes the two suspension tiers", () => {
    const { unmount } = render(<OwnerStatusBadge status="suspended" />);
    expect(screen.getByText("Suspended")).toBeInTheDocument();
    unmount();
    render(<OwnerStatusBadge status="hard_suspended" />);
    expect(screen.getByText("Hard suspended")).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Create `src/app/(app)/admin/page.tsx`**

```tsx
import Link from "next/link";
import { OwnerStatusBadge } from "@/components/app/owner-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listOwners } from "@/lib/api/admin";
import { formatManilaDate } from "@/lib/format";

export default async function AdminOwnersPage() {
  const owners = await listOwners();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Owners</h1>
          <p className="mt-1 text-sm text-steel">
            {owners.length} account{owners.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link href="/admin/owners/new" className={buttonVariants()}>
          Add owner
        </Link>
      </div>

      <Card>
        {owners.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-steel">
            No owners yet. Add the first one to send an invitation.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Status</TH>
                <TH>Businesses</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {owners.map((owner) => (
                <TR key={owner.id}>
                  <TD>
                    <Link
                      href={`/admin/owners/${owner.id}`}
                      className="font-medium text-brand-green-dark hover:underline"
                    >
                      {owner.name}
                    </Link>
                  </TD>
                  <TD className="text-steel">{owner.email}</TD>
                  <TD>
                    <OwnerStatusBadge status={owner.status} />
                  </TD>
                  <TD className="text-steel">up to {owner.maxBusinesses}</TD>
                  <TD className="text-steel">{formatManilaDate(owner.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 8: Run the tests and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS — 90 tests.

- [ ] **Step 9: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/admin.ts src/lib/format.ts src/lib/format.test.ts \
  src/components/app/owner-status-badge.tsx src/components/app/owner-status-badge.test.tsx \
  src/app/\(app\)/admin/page.tsx
git commit -m "feat: list owners in the platform admin panel"
```

---

### Task 12: Create an owner, and suspend or reinstate one

This is the task that replaces `prisma/bootstrap-admin.ts` plus curl as the onboarding path.

**Files:**
- Create: `src/app/(app)/admin/owners/new/page.tsx`, `actions.ts`, `new-owner-form.tsx`
- Create: `src/app/(app)/admin/owners/[id]/page.tsx`, `actions.ts`, `status-controls.tsx`
- Test: `src/app/(app)/admin/owners/new/new-owner-form.test.tsx`, `src/app/(app)/admin/owners/[id]/status-controls.test.tsx`

**Interfaces:**
- Consumes: `createOwner`, `getOwner`, `suspendOwner`, `reinstateOwner`, `listOwnerBusinesses` (Task 11)
- Produces:
  - `createOwnerAction(state: FormState, formData: FormData): Promise<FormState>`
  - `suspendOwnerAction(state: FormState, formData: FormData): Promise<FormState>` — reads `ownerId` and `tier`
  - `reinstateOwnerAction(state: FormState, formData: FormData): Promise<FormState>` — reads `ownerId`
  - `<StatusControls ownerId status suspendAction reinstateAction>`

- [ ] **Step 1: Create `src/app/(app)/admin/owners/new/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createOwner } from "@/lib/api/admin";
import { toFormState, type FormState } from "@/lib/forms/form-state";

const FIELDS = ["name", "email", "maxBusinesses"] as const;

export async function createOwnerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const raw = String(formData.get("maxBusinesses") ?? "1").trim();
  const maxBusinesses = Number.parseInt(raw, 10);

  if (!Number.isInteger(maxBusinesses) || maxBusinesses < 1 || maxBusinesses > 1000) {
    return { fieldErrors: { maxBusinesses: "Enter a whole number between 1 and 1000." } };
  }

  let owner;
  try {
    owner = await createOwner({ name, email, maxBusinesses });
  } catch (error) {
    return toFormState(error, FIELDS);
  }

  revalidatePath("/admin");
  redirect(`/admin/owners/${owner.id}?invited=1`);
}
```

- [ ] **Step 2: Create `src/app/(app)/admin/owners/new/new-owner-form.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create owner and send invite"}
    </Button>
  );
}

export function NewOwnerForm({
  action,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} className="max-w-md space-y-4" noValidate>
      {state.message ? <Alert>{state.message}</Alert> : null}

      <Field
        name="name"
        label="Business owner name"
        error={state.fieldErrors?.name}
        hint="How the account is identified in the platform panel."
      >
        <Input name="name" autoFocus />
      </Field>

      <Field
        name="email"
        label="Email address"
        error={state.fieldErrors?.email}
        hint="The invitation is sent here. It expires in seven days."
      >
        <Input name="email" type="email" />
      </Field>

      <Field
        name="maxBusinesses"
        label="Business limit"
        error={state.fieldErrors?.maxBusinesses}
        hint="How many businesses this owner may create. Demo businesses do not count."
      >
        <Input name="maxBusinesses" type="number" min={1} max={1000} defaultValue={1} />
      </Field>

      <SubmitButton />
    </form>
  );
}
```

- [ ] **Step 3: Create `src/app/(app)/admin/owners/new/page.tsx`**

```tsx
import Link from "next/link";
import { NewOwnerForm } from "./new-owner-form";
import { createOwnerAction } from "./actions";

export default function NewOwnerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-steel hover:underline">
          ← Owners
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Add an owner</h1>
        <p className="mt-1 text-sm text-steel">
          Creates the account and emails an invitation. The owner sets their own password;
          nobody here ever sees it.
        </p>
      </div>
      <NewOwnerForm action={createOwnerAction} />
    </div>
  );
}
```

- [ ] **Step 4: Create `src/app/(app)/admin/owners/[id]/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { reinstateOwner, suspendOwner } from "@/lib/api/admin";
import { toFormState, type FormState } from "@/lib/forms/form-state";

export async function suspendOwnerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const ownerId = String(formData.get("ownerId") ?? "");
  const tier = String(formData.get("tier") ?? "");
  if (tier !== "default" && tier !== "hard") {
    return { message: "Choose which kind of suspension to apply." };
  }

  try {
    await suspendOwner(ownerId, tier);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  revalidatePath("/admin");
  return { done: true };
}

export async function reinstateOwnerAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const ownerId = String(formData.get("ownerId") ?? "");

  try {
    await reinstateOwner(ownerId);
  } catch (error) {
    return toFormState(error, []);
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  revalidatePath("/admin");
  return { done: true };
}
```

- [ ] **Step 5: Create `src/app/(app)/admin/owners/[id]/status-controls.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EMPTY_FORM_STATE, type FormState } from "@/lib/forms/form-state";
import type { OwnerStatus } from "@/lib/api/types";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

function SubmitButton({
  label,
  variant,
}: {
  label: string;
  variant?: "primary" | "destructive" | "secondary";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? "Working…" : label}
    </Button>
  );
}

/**
 * Suspension is destructive to a live business, so it is two steps rather than one click:
 * the tier has to be chosen deliberately and then confirmed. Reinstatement is one click —
 * it only ever restores access.
 */
export function StatusControls({
  ownerId,
  status,
  suspendAction,
  reinstateAction,
}: {
  ownerId: string;
  status: OwnerStatus;
  suspendAction: Action;
  reinstateAction: Action;
}) {
  const [suspendState, suspend] = useActionState(suspendAction, EMPTY_FORM_STATE);
  const [reinstateState, reinstate] = useActionState(reinstateAction, EMPTY_FORM_STATE);
  const [tier, setTier] = useState<"default" | "hard" | null>(null);

  const suspended = status === "suspended" || status === "hard_suspended";
  const message = suspendState.message ?? reinstateState.message;

  return (
    <div className="space-y-3">
      {message ? <Alert>{message}</Alert> : null}

      {suspended ? (
        <form action={reinstate}>
          <input type="hidden" name="ownerId" value={ownerId} />
          <p className="mb-3 text-sm text-steel">
            This account is suspended. Reinstating restores portal and terminal access
            immediately.
          </p>
          <SubmitButton label="Reinstate account" />
        </form>
      ) : tier === null ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setTier("default")}>
            Suspend
          </Button>
          <Button variant="destructive" onClick={() => setTier("hard")}>
            Hard suspend
          </Button>
        </div>
      ) : (
        <form action={suspend} className="space-y-3">
          <input type="hidden" name="ownerId" value={ownerId} />
          <input type="hidden" name="tier" value={tier} />
          <Alert tone="warn">
            {tier === "hard"
              ? "A hard suspension stops every terminal immediately, mid-shift included."
              : "The portal locks straight away. An open shift may keep selling for up to 24 hours."}
          </Alert>
          <div className="flex gap-2">
            <SubmitButton
              label={tier === "hard" ? "Confirm hard suspension" : "Confirm suspension"}
              variant="destructive"
            />
            <Button variant="ghost" onClick={() => setTier(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `src/app/(app)/admin/owners/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { OwnerStatusBadge } from "@/components/app/owner-status-badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getOwner, listOwnerBusinesses } from "@/lib/api/admin";
import { NotFoundError } from "@/lib/api/errors";
import { formatManilaDateTime } from "@/lib/format";
import { reinstateOwnerAction, suspendOwnerAction } from "./actions";
import { StatusControls } from "./status-controls";

export default async function OwnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invited?: string }>;
}) {
  const { id } = await params;
  const { invited } = await searchParams;

  let owner;
  try {
    owner = await getOwner(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const businesses = await listOwnerBusinesses(id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-steel hover:underline">
          ← Owners
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-ink">{owner.name}</h1>
          <OwnerStatusBadge status={owner.status} />
        </div>
        <p className="mt-1 text-sm text-steel">{owner.email}</p>
      </div>

      {invited ? (
        <Alert tone="info">
          An invitation has been emailed to {owner.email}. It expires in seven days. In
          development no mail is sent — read the link from the backend&apos;s console output.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p className="text-steel">
              Business limit: <span className="text-charcoal">{owner.maxBusinesses}</span>
            </p>
            <p className="text-steel">
              Created:{" "}
              <span className="text-charcoal">{formatManilaDateTime(owner.createdAt)}</span>
            </p>
            {owner.suspendedAt ? (
              <p className="text-steel">
                Suspended:{" "}
                <span className="text-charcoal">{formatManilaDateTime(owner.suspendedAt)}</span>
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
          </CardHeader>
          <CardBody>
            <StatusControls
              ownerId={owner.id}
              status={owner.status}
              suspendAction={suspendOwnerAction}
              reinstateAction={reinstateOwnerAction}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Businesses</CardTitle>
        </CardHeader>
        {businesses.length === 0 ? (
          <CardBody>
            <p className="text-sm text-steel">
              None yet. A demo business appears once the owner activates their account.
            </p>
          </CardBody>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Type</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {businesses.map((business) => (
                <TR key={business.id}>
                  <TD>
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="font-medium text-brand-green-dark hover:underline"
                    >
                      {business.name}
                    </Link>
                    {business.isDemo ? <span className="ml-2 text-xs text-stone">demo</span> : null}
                  </TD>
                  <TD className="text-steel">{business.type}</TD>
                  <TD className="text-steel">{formatManilaDateTime(business.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 7: Write the tests**

`src/app/(app)/admin/owners/new/new-owner-form.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewOwnerForm } from "./new-owner-form";
import type { FormState } from "@/lib/forms/form-state";

describe("NewOwnerForm", () => {
  it("submits the three fields the API needs", async () => {
    const action = vi.fn(async (): Promise<FormState> => ({}));
    render(<NewOwnerForm action={action} />);

    await userEvent.type(screen.getByLabelText("Business owner name"), "Kape Diaria");
    await userEvent.type(screen.getByLabelText("Email address"), "maria@kapediaria.ph");
    await userEvent.clear(screen.getByLabelText("Business limit"));
    await userEvent.type(screen.getByLabelText("Business limit"), "3");
    await userEvent.click(screen.getByRole("button", { name: /create owner/i }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get("name")).toBe("Kape Diaria");
    expect(formData.get("email")).toBe("maria@kapediaria.ph");
    expect(formData.get("maxBusinesses")).toBe("3");
  });

  it("puts a duplicate email on the email field, where it can be corrected", async () => {
    const action = vi.fn(
      async (): Promise<FormState> => ({
        fieldErrors: { email: "This email is already in use." },
      }),
    );
    render(<NewOwnerForm action={action} />);

    await userEvent.type(screen.getByLabelText("Business owner name"), "X");
    await userEvent.type(screen.getByLabelText("Email address"), "taken@example.com");
    await userEvent.click(screen.getByRole("button", { name: /create owner/i }));

    expect(await screen.findByLabelText("Email address")).toHaveAccessibleDescription(
      "This email is already in use.",
    );
  });
});
```

`src/app/(app)/admin/owners/[id]/status-controls.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StatusControls } from "./status-controls";
import type { FormState } from "@/lib/forms/form-state";

const noop = async (): Promise<FormState> => ({});

describe("StatusControls", () => {
  it("does not suspend on a single click — the tier must be confirmed", async () => {
    const suspend = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <StatusControls
        ownerId="o-1"
        status="active"
        suspendAction={suspend}
        reinstateAction={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));
    expect(suspend).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm suspension" })).toBeInTheDocument();
  });

  it("sends the chosen tier once confirmed", async () => {
    const suspend = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <StatusControls
        ownerId="o-1"
        status="active"
        suspendAction={suspend}
        reinstateAction={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Hard suspend" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm hard suspension" }));

    const formData = suspend.mock.calls[0][1] as FormData;
    expect(formData.get("ownerId")).toBe("o-1");
    expect(formData.get("tier")).toBe("hard");
  });

  it("spells out what a hard suspension does before it is confirmed", async () => {
    render(
      <StatusControls ownerId="o-1" status="active" suspendAction={noop} reinstateAction={noop} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Hard suspend" }));
    expect(screen.getByRole("alert")).toHaveTextContent("stops every terminal immediately");
  });

  it("backs out of a pending suspension", async () => {
    const suspend = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <StatusControls
        ownerId="o-1"
        status="active"
        suspendAction={suspend}
        reinstateAction={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();
    expect(suspend).not.toHaveBeenCalled();
  });

  it("offers reinstatement — and only that — for a suspended owner", async () => {
    const reinstate = vi.fn(async (): Promise<FormState> => ({}));
    render(
      <StatusControls
        ownerId="o-1"
        status="hard_suspended"
        suspendAction={noop}
        reinstateAction={reinstate}
      />,
    );

    expect(screen.queryByRole("button", { name: "Suspend" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reinstate account" }));
    expect((reinstate.mock.calls[0][1] as FormData).get("ownerId")).toBe("o-1");
  });
});
```

- [ ] **Step 8: Run the tests and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS — 97 tests.

- [ ] **Step 9: Commit**

```bash
git add src/app/\(app\)/admin
git commit -m "feat: create, suspend and reinstate owners from the admin panel"
```

---

### Task 13: Read-only tenant browse

A platform admin can see a business's branches and activity log. Nothing on these screens
edits anything — `project-spec.md` §4 puts platform scope outside tenant writes, and the API
enforces it with `platform_write_forbidden`. The UI must not imply otherwise.

**Files:**
- Create: `src/app/(app)/admin/businesses/[id]/page.tsx`
- Create: `src/components/app/activity-table.tsx`, `src/components/app/pagination.tsx`
- Test: `src/components/app/activity-table.test.tsx`, `src/components/app/pagination.test.tsx`

**Interfaces:**
- Consumes: `listBusinessBranches`, `listBusinessActivity` (Task 11); `formatManilaDateTime` (Task 11)
- Produces:
  - `<ActivityTable entries: AuditEntry[]>`
  - `<Pagination page totalPages baseHref query?>` — renders previous/next links preserving other query params

- [ ] **Step 1: Write the failing tests**

`src/components/app/activity-table.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityTable } from "./activity-table";
import type { AuditEntry } from "@/lib/api/types";

function entry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: "a-1",
    createdAt: "2026-03-01T16:30:00.000Z",
    actorType: "owner",
    actorId: "u-1",
    ownerId: "o-1",
    businessId: "b-1",
    branchId: null,
    action: "portal.product.create",
    entityType: "product",
    entityId: "p-1",
    changes: {},
    metadata: {},
    ...overrides,
  };
}

describe("ActivityTable", () => {
  it("shows each entry's action, actor and Manila timestamp", () => {
    render(<ActivityTable entries={[entry()]} />);
    expect(screen.getByText("portal.product.create")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
    // 16:30 UTC is 00:30 the next day in Manila.
    expect(screen.getByText(/2 Mar 2026/)).toBeInTheDocument();
  });

  it("names each actor type in words rather than showing the enum", () => {
    render(
      <ActivityTable
        entries={[
          entry({ id: "a-1", actorType: "terminal" }),
          entry({ id: "a-2", actorType: "platform_admin" }),
        ]}
      />,
    );
    expect(screen.getByText("Terminal")).toBeInTheDocument();
    expect(screen.getByText("Platform admin")).toBeInTheDocument();
    expect(screen.queryByText("platform_admin")).not.toBeInTheDocument();
  });

  it("says so when there is nothing to show", () => {
    render(<ActivityTable entries={[]} />);
    expect(screen.getByText(/no activity/i)).toBeInTheDocument();
  });
});
```

`src/components/app/pagination.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("renders nothing at all for a single page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} baseHref="/admin/x" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers only Next on the first page", () => {
    render(<Pagination page={1} totalPages={3} baseHref="/admin/x" />);
    expect(screen.queryByRole("link", { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /next/i })).toHaveAttribute("href", "/admin/x?page=2");
  });

  it("offers only Previous on the last page", () => {
    render(<Pagination page={3} totalPages={3} baseHref="/admin/x" />);
    expect(screen.getByRole("link", { name: /previous/i })).toHaveAttribute(
      "href",
      "/admin/x?page=2",
    );
    expect(screen.queryByRole("link", { name: /next/i })).not.toBeInTheDocument();
  });

  it("keeps the other filters in the link, so paging does not reset them", () => {
    render(
      <Pagination
        page={2}
        totalPages={5}
        baseHref="/admin/x"
        query={{ actorType: "terminal", pageSize: "25" }}
      />,
    );
    const next = screen.getByRole("link", { name: /next/i }).getAttribute("href")!;
    expect(next).toContain("actorType=terminal");
    expect(next).toContain("pageSize=25");
    expect(next).toContain("page=3");
  });

  it("states where you are", () => {
    render(<Pagination page={2} totalPages={5} baseHref="/admin/x" />);
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test src/components/app`
Expected: FAIL — cannot resolve `./activity-table`.

- [ ] **Step 3: Create `src/components/app/pagination.tsx`**

```tsx
import Link from "next/link";

/** Links rather than buttons: a page of a list is a URL, and must survive a reload. */
export function Pagination({
  page,
  totalPages,
  baseHref,
  query = {},
}: {
  page: number;
  totalPages: number;
  baseHref: string;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (target: number): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, value);
    }
    params.set("page", String(target));
    return `${baseHref}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="text-brand-green-dark hover:underline">
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-steel">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={href(page + 1)} className="text-brand-green-dark hover:underline">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/app/activity-table.tsx`**

```tsx
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { formatManilaDateTime } from "@/lib/format";
import type { ActorType, AuditEntry } from "@/lib/api/types";

const ACTOR_LABELS: Record<ActorType, string> = {
  owner: "Owner",
  terminal: "Terminal",
  platform_admin: "Platform admin",
};

export function ActivityTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-steel">No activity recorded yet.</p>;
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>When</TH>
          <TH>Actor</TH>
          <TH>Action</TH>
          <TH>Entity</TH>
        </TR>
      </THead>
      <TBody>
        {entries.map((entry) => (
          <TR key={entry.id}>
            <TD className="whitespace-nowrap text-steel">
              {formatManilaDateTime(entry.createdAt)}
            </TD>
            <TD className="text-steel">{ACTOR_LABELS[entry.actorType]}</TD>
            <TD className="font-mono text-xs text-charcoal">{entry.action}</TD>
            <TD className="text-steel">{entry.entityType}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
```

- [ ] **Step 5: Create `src/app/(app)/admin/businesses/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTable } from "@/components/app/activity-table";
import { Pagination } from "@/components/app/pagination";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listBusinessActivity, listBusinessBranches } from "@/lib/api/admin";
import { NotFoundError } from "@/lib/api/errors";

export default async function AdminBusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  let branches;
  let activity;
  try {
    [branches, activity] = await Promise.all([
      listBusinessBranches(id),
      listBusinessActivity(id, { page, pageSize: 50 }),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-steel hover:underline">
          ← Owners
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Business</h1>
      </div>

      {/* Stated plainly, because there is deliberately nothing on this page to click. */}
      <Alert tone="info">
        Platform admins can read tenant data but never change it. Anything that needs editing
        must be done by the business owner in their own portal.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        {branches.length === 0 ? (
          <CardBody>
            <p className="text-sm text-steel">This business has no branches yet.</p>
          </CardBody>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH>Address</TH>
              </TR>
            </THead>
            <TBody>
              {branches.map((branch) => (
                <TR key={branch.id}>
                  <TD className="font-medium text-charcoal">{branch.name}</TD>
                  <TD className="font-mono text-xs text-steel">{branch.code}</TD>
                  <TD className="text-steel">{branch.address}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <ActivityTable entries={activity.data} />
        <Pagination
          page={activity.page}
          totalPages={activity.totalPages}
          baseHref={`/admin/businesses/${id}`}
        />
      </Card>
    </div>
  );
}
```

- [ ] **Step 6: Run the tests and build**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: PASS — 105 tests.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(app\)/admin src/components/app
git commit -m "feat: browse a tenant's branches and activity, read-only"
```

---

### Task 14: Live smoke suite and documentation

The unit suite proves the pieces; this proves the contract. It is opt-in, gated on an env
var, and it drives the whole onboarding path against a running backend.

**Files:**
- Create: `vitest.integration.config.ts`, `src/test/integration/live-admin.test.ts`
- Modify: `package.json`, `vitest.config.ts`
- Create: `README.md` (replace the Next.js starter content if it is still there)

**Interfaces:**
- Consumes: everything
- Produces: `pnpm test:integration`

- [ ] **Step 1: Exclude the integration directory from the default run**

In `vitest.config.ts`, add to the `test` block:

```ts
    // The live suite needs a real server and a node environment; it runs from
    // vitest.integration.config.ts (`pnpm test:integration`), never from the default run.
    exclude: [...configDefaults.exclude, "src/test/integration/**"],
```

and add `configDefaults` to the import: `import { configDefaults, defineConfig } from "vitest/config";`

- [ ] **Step 2: Create `vitest.integration.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // A real HTTP client against a real server — no DOM involved.
    environment: "node",
    include: ["src/test/integration/**/*.test.ts"],
    globals: true,
    testTimeout: 60000,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

- [ ] **Step 3: Add the script to `package.json`**

```json
    "test:integration": "vitest run -c vitest.integration.config.ts",
```

- [ ] **Step 4: Create `src/test/integration/live-admin.test.ts`**

```ts
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

    const reinstated = await call<{ status: string }>(
      `/admin/owners/${target!.id}/reinstate`,
      { method: "POST", token: accessToken },
    );
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
```

- [ ] **Step 5: Run the default suite to confirm the live tests are excluded**

Run: `pnpm test`
Expected: PASS — 105 tests; nothing from `src/test/integration/`.

- [ ] **Step 6: Run the live suite against a real backend**

```bash
# in ../sentry-pos-be
npm run db:up && npx prisma migrate deploy && npm run db:seed && npm run start:dev
```

Then here, with a real admin's credentials and a current TOTP code:

```bash
PORTAL_E2E_API_URL=http://localhost:4000/v1 \
PORTAL_E2E_ADMIN_EMAIL=... PORTAL_E2E_ADMIN_PASSWORD=... PORTAL_E2E_ADMIN_TOTP=... \
pnpm test:integration
```

Expected: PASS. If the admin has not yet enrolled TOTP, the suite says so — complete
`/login/totp/setup` in the browser first, which is itself the proof that Task 8 works.

**Report the real result.** If a test fails against the live API, that is a contract drift
worth fixing, not a test to loosen.

- [ ] **Step 7: Write `README.md`**

Replace the Next.js starter README. It must cover:

- What this repo now holds: the marketing site (`/`), Payload CMS (`/cms`), **and** the
  authenticated app — owner portal (`/portal`) and platform admin (`/admin`).
- `pnpm install`, `pnpm dev` (port 3100), `pnpm test`, `pnpm test:integration`, `pnpm lint`,
  `pnpm build`.
- Environment: `API_URL` is server-only and must never be `NEXT_PUBLIC_`; `DATABASE_URI` and
  `PAYLOAD_SECRET` for the CMS; and **the backend's own `APP_URL` must be
  `http://localhost:3100`**, because it is what invite and reset emails link to — it
  defaults to `http://localhost:3000`, which is the POS terminal.
- In development the backend has no `RESEND_API_KEY`, so invites and resets are not emailed:
  the link is logged to the backend's console. Read the token from there.
- The auth model in three sentences: httpOnly cookies, a server-side proxy, refresh only in
  middleware — and why the last one is not negotiable (rotation with reuse detection).
- Which surfaces exist and which are still to come (catalog, discounts, branches, stock,
  terminals — the next plan).
- A pointer to the spec and this plan.

- [ ] **Step 8: Run everything one last time**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all three succeed.

- [ ] **Step 9: Commit**

```bash
git add package.json vitest.config.ts vitest.integration.config.ts src/test/integration README.md
git commit -m "test: add the live admin smoke suite, and document the portal"
```

---

## Definition of done

- `pnpm test` green; `pnpm lint` clean; `pnpm build` succeeds.
- `pnpm test:integration` green against a running `sentry-pos-be`.
- An operator can, in a browser, with no shell: sign in as a platform admin, enrol TOTP, save
  recovery codes, create an owner, watch the invite go out, suspend and reinstate that owner,
  and read a tenant's branches and activity log.
- An owner can accept an invite, set a password, sign in, and land on `/portal`.
- The marketing site and the CMS are byte-for-byte unchanged in behaviour.

## What this plan deliberately leaves out

Phases 3–5 of the spec — catalog (products, variants, categories, modifier groups),
discounts, refund PIN, branches, stock and terminals — get their own plan, written against
the real signatures this one produces rather than guessed at in advance.

Two smaller pieces go with them, because neither has anywhere to appear until the portal
fetches tenant data:

- **The `owner_suspended` screen.** A suspended owner is stopped at login, where the message
  renders on the form; the dedicated in-app screen the spec describes belongs with the first
  portal page that actually reads tenant data.
- **A `forbidden` page.** Until then a 403 renders through the shared error boundary, which
  shows the API's message and the `requestId`.

