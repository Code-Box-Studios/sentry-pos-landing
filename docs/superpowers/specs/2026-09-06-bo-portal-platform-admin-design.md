# BO Portal & Platform Admin Panel — Design

**Date:** 2026-09-06
**Repo:** `sentry-pos-landing`
**Status:** approved, ready for planning

## 1. What this is

Two authenticated web surfaces, built as one Next.js application inside the existing
landing repo:

- **The BO portal** (`/portal/*`) — where a business owner manages their catalog,
  branches, stock, discounts, terminals and refund PIN. Today all of this is done by
  hand against the API; there is no UI.
- **The platform admin panel** (`/admin/*`) — where Sentry staff onboard owners, suspend
  and reinstate them, and read tenant data. Today the only route in is
  `prisma/bootstrap-admin.ts` plus curl.

Together they close the last gap between "the API works" and "a customer can be
onboarded without an engineer".

### Non-goals

Deliberately excluded, because the backend for them does not exist:

- Dashboard and Analytics screens (`analytics-spec.md`) — no endpoints
- Notifications and low-stock alerts — no endpoints
- Inter-branch stock transfers — no endpoints
- CSV export — no endpoints
- Staff accounts and roles (`staff-spec.md`) — a later phase
- Owner self-service signup — owners are created by a platform admin, by design
- Impersonation — `project-spec.md` §4 forbids it

When those endpoints land, each becomes its own spec.

## 2. Where it lives

The landing repo becomes a two-audience app, separated by Next route groups:

```
src/app/
  (frontend)/   →  /            public marketing site      [exists]
  (payload)/    →  /cms         Payload CMS admin          [exists]
  (app)/        →  /portal/*    owner back-office          [new]
                   /admin/*     platform admin             [new]
```

One Vercel project serves both: the apex domain serves the landing site, `app.` serves
the portal. Routing is by path, not by host — `app.sentry.ph/portal/…` and
`sentry.ph/portal/…` both resolve. Host-gating is a later refinement, not a correctness
requirement.

Two consequences of this choice, accepted:

- The repo name no longer describes its contents. Renaming to `sentry-pos-app` is
  cosmetic and can happen at any time.
- The public site and the authenticated back-office share a deploy and a blast radius.
  Route-group isolation and middleware guards contain it.

`design-spec.md` is now mirrored in three repos. Change it in all three or they drift.

## 3. Authentication

### The shape: a server-side proxy (BFF)

The browser never holds a token and never calls the API directly. Every API call is made
by the Next.js server on the user's behalf.

```
browser ──cookie──▶ Next.js server ──Bearer──▶ sentry-pos-be
```

- Login POSTs to a Next Route Handler. The handler calls `POST /v1/auth/login`
  server-side and writes the returned tokens as cookies with `httpOnly`, `secure`,
  `sameSite: "lax"`, `path: "/"`.
- A server-only `apiFetch()` reads the access cookie, attaches
  `Authorization: Bearer …`, and calls the API. It does **not** refresh; a 401 is thrown
  as `UnauthorizedError` and the surrounding layout redirects to `/login`.
- Server Components read through `apiFetch()`. Mutations go through Server Actions, which
  also call `apiFetch()`.

### Refresh lives in middleware, and only there

Two constraints force this, and together they rule out the more obvious
refresh-on-401-inside-`apiFetch()` design:

1. **Next 15 forbids cookie writes during a Server Component render.** A refresh triggered
   by a page's own data fetch could not persist the new tokens — the rotated pair would be
   used once and lost.
2. **The API rotates refresh tokens and detects reuse.** `POST /v1/auth/refresh` revokes
   the presented token and mints a new pair; presenting an already-revoked token revokes
   *every* active session for that user. Two concurrent refreshes with the same token
   therefore do not merely race — the loser logs the user out everywhere.

So refresh happens in exactly one place, `src/middleware.ts`, which runs once per request
before any render and can write cookies onto the response:

- Read `sentry_at` and decode its payload (base64url only — **no signature check**; the
  API is the authority, this is routing, not a security boundary).
- If it is absent or expires within 120 seconds, call `POST /v1/auth/refresh` with
  `sentry_rt`, write the new pair onto the response, and also set it on `request.cookies`
  so the render that follows sees the new token rather than the stale one.
- If refresh fails, clear both cookies and redirect to `/login?next=…`.
- **Skip refresh entirely for prefetch requests** (the `next-router-prefetch` header). A
  prefetch racing a real navigation is the one way two refreshes could overlap; a
  prefetched page that 401s is harmless, a revoked session is not.

Decoding the payload also yields `role`, which is what routes owners away from `/admin`
and admins away from `/portal`. The real enforcement remains the API's `PortalAuthGuard`
and `AdminGuard`.

Chosen over storing tokens in JS because the platform admin can read across every
tenant; an XSS on that surface would be a cross-tenant data breach. It also means the
portal needs no `CORS_ORIGINS` entry — the browser never touches the API origin.

The cost, accepted: every read is a server round-trip, so screens are Server Components
with client islands rather than a client-side SPA.

### Cookie names

`sentry_at` (access) and `sentry_rt` (refresh). Distinct from Payload's `payload-token`,
which lives in the same app — a collision would sign users out of the CMS.

### The two login paths

The API's `POST /v1/auth/login` returns one of three shapes:

| Response | Who | Next step |
| --- | --- | --- |
| `{ accessToken, refreshToken, role: "owner" }` | owner | set cookies → `/portal` |
| `{ totpRequired: true, preAuthToken }` | admin, TOTP enrolled | `/login/totp` |
| `{ totpSetupRequired: true, preAuthToken }` | admin, first login | `/login/totp/setup` |

The preauth token is short-lived (5 minutes) and accepted only by the TOTP endpoints. It
is stored in its own httpOnly cookie (`sentry_preauth`) for the duration of the TOTP step
and cleared on completion.

- **Setup** — `POST /v1/auth/totp/setup` returns `{ secret, otpauthUri }`. The page
  renders a QR from the `otpauthUri` and shows the secret for manual entry.
  `POST /v1/auth/totp/enable` with a 6-digit code returns 8 recovery codes, shown
  **once**, with a download and an explicit "I have saved these" confirmation.
- **Verify** — `POST /v1/auth/totp/verify` with `{ preAuthToken, code }` returns the full
  token pair. A recovery code is accepted in the same field.

### Other auth screens

- `/forgot` → `POST /v1/auth/password-reset/request`. Always renders the same "if that
  address exists, we sent a link" confirmation — the endpoint returns 204 either way,
  deliberately, and the UI must not undo that.
- `/password-reset/confirm?token=…` → `POST /v1/auth/password-reset/confirm`. The path is
  not free to choose: the API emails `${APP_URL}/password-reset/confirm?token=…`, so the
  route must match it exactly, and `APP_URL` on the backend must point at this app.
- `/invite/accept?token=…` → `POST /v1/auth/invite/accept`. This is how a new owner
  activates: sets a password, which activates the owner and seeds their demo business.
- Logout → `POST /v1/auth/logout` server-side, then clear cookies.

### Lockout

`login_locked` and `pin_locked` carry `retryAfterSeconds`. Both render as a countdown,
not a generic error — the user needs to know the lock is temporary and how long it is.

## 4. The API layer

A hand-written, server-only typed module: `src/lib/api/`.

`openapi.json` from the backend carries request schemas only — every response would be
`unknown`. Generation buys nothing, so the types are written by hand, mirroring the Nest
DTOs and service return types. This is the same conclusion the POS terminal reached for
its `PosApi` adapter.

```
src/lib/api/
  fetch.ts       apiFetch() — cookies, bearer, error mapping (refresh is middleware's)
  errors.ts      the { code, message, ...extra, requestId } envelope → typed errors
  types.ts       Business, Branch, Product, Category, ModifierGroup, Discount,
                 StockLevel, Terminal, ActivityEntry, Owner, …
  auth.ts        login, refresh, logout, totp*, invite, password reset
  portal.ts      businesses, branches, catalog, discounts, stock, terminals,
                 settings, activity log
  admin.ts       owners, tenant browse
```

Every module is server-only (`import "server-only"`), so a stray client import is a
build error rather than a leaked token.

### Error handling

The backend renders `{ code, message, ...extra, requestId }` with **no `statusCode`
field**. `errors.ts` maps `code` onto typed errors:

| code | UI treatment |
| --- | --- |
| `validation` | field-level messages on the form, parsed from `message` (see below) |
| `unauthorized` | redirect to `/login` (refresh already had its chance in middleware) |
| `forbidden` | "you don't have access to this" page |
| `not_found` | 404 screen |
| `conflict` | inline on the offending field (duplicate SKU, duplicate code) |
| `owner_suspended` | dedicated screen explaining the account is suspended |
| `login_locked` / `pin_locked` | countdown from `retryAfterSeconds` |
| anything else | error boundary with the `requestId` shown for support |

`requestId` is surfaced in every error state — it is the only handle support has to find
the server-side log.

**Validation errors carry no structured field data.** The exception filter joins
class-validator's message array into a single `; `-separated string and deletes
`statusCode` and `error`:

```json
{
  "code": "validation",
  "message": "email must be an email; name should not be empty",
  "requestId": "…"
}
```

Each segment begins with the property name, so `errors.ts` splits on `"; "` and takes the
leading token of each segment as the field. That mapping is best-effort by construction —
when a segment does not start with a known field name it falls through to a form-level
error rather than being dropped.

Note also that the pipe uses `whitelist: true` **without** `forbidNonWhitelisted`, so
unknown fields are silently stripped rather than rejected. A typo in a payload key
therefore fails silently. Request payload types must be exact.

## 5. Route map

```
/login                     email + password
/login/totp                admin: 6-digit code or recovery code
/login/totp/setup          admin first login: QR, verify, recovery codes
/forgot                    request a reset link
/password-reset/confirm?token=…   set a new password (path fixed by the emailed link)
/invite/accept?token=…     owner activation

/portal                                        business list (the owner's own)
/portal/businesses/:businessId                 overview + edit business
/portal/businesses/:businessId/catalog         products
/portal/businesses/:businessId/catalog/new
/portal/businesses/:businessId/catalog/:id     edit product, variants, modifier links
/portal/businesses/:businessId/categories
/portal/businesses/:businessId/modifiers       modifier groups
/portal/businesses/:businessId/discounts
/portal/businesses/:businessId/branches
/portal/businesses/:businessId/branches/:branchId
/portal/businesses/:businessId/branches/:branchId/stock
/portal/businesses/:businessId/terminals
/portal/businesses/:businessId/activity
/portal/settings                               refund PIN (owner-wide, not per-business)

/admin                     owner list
/admin/owners/new          create an owner (sends the invite)
/admin/owners/:id          owner detail, suspend / reinstate, their businesses
/admin/businesses/:id      read-only: branches and activity log
```

The business ID is in the URL rather than in session state. A URL is then a complete
address — shareable, bookmarkable, and correct in a second tab. The cost is a longer path
and a business switcher in the shell that rewrites the current route.

`/portal/settings` sits outside the business segment because `PUT /v1/portal/refund-pin`
is owner-scoped, not business-scoped.

## 6. Screens

### Portal shell

A left sidebar (business switcher, then the section nav) and a top bar (business name,
user menu). Collapses to a drawer under 1024px. The portal is a desktop-first surface —
the POS terminal is the tablet one.

### Catalog

The largest surface. A product carries a name, category, price (integer centavos),
`soldBy` (`each` or `weight`), `trackStock`, an optional SKU and barcode, and either a
flat price or variants.

- **Products list** — searchable and filterable by category, with price and stock status
  per row.
- **Product editor** — one form covering the base fields, a variants table (each with its
  own price, SKU, barcode), and modifier-group attachment.
- Money is entered in pesos and converted to integer centavos at the boundary. This
  mirrors the terminal's rule: **all money is integer centavos**, and variables carrying
  it end in `C`.
- **Categories** and **modifier groups** are their own list + editor screens.
  Modifier-group attachment to a product is a `PUT` of the whole set, not incremental
  add/remove.

### Branches, stock, terminals

- **Branches** — list, create, edit, delete. Each has a name and a short code (`MKT`)
  that becomes part of every receipt number, so the code is immutable after creation.
- **Stock** — per branch. A levels table for `trackStock` products, a "receive stock"
  form, and an adjustment form that requires a reason. Products with `trackStock: false`
  never appear.
- **Terminals** — list with pairing status and last-seen, plus remote unpair. Unpair is
  destructive and irreversible from the terminal's side; it gets a typed confirmation.

### Discounts and settings

- **Discounts** — percentage or fixed amount, active window, scope. The SC/PWD rule is
  the API's, not the portal's: a line takes SC/PWD *or* a promo, whichever is higher,
  never both.
- **Settings** — set the refund PIN. Owner-wide. Four wrong attempts on a terminal lock
  it for five minutes.

### Activity log

A filterable, paginated table of audit entries: actor, action, target, timestamp.
Timestamps are stored UTC and displayed Asia/Manila, matching the terminal.

### Platform admin

- **Owner list** — email, business count, status, created date. Filterable by status.
- **Create owner** — email and business name. Creates the owner and sends an invite; the
  owner activates via `/invite/accept`. This replaces `bootstrap-admin.ts` + curl as the
  onboarding path.
- **Owner detail** — status, businesses, suspend and reinstate. Suspension takes a reason
  and locks the owner out at login with `owner_suspended`; it is visible enough to be
  deliberate.
- **Tenant browse** — an owner's businesses, a business's branches, a business's activity
  log. **Read-only, with no edit affordances rendered at all** — `project-spec.md` §4
  puts platform admins outside tenant data mutation, and the API enforces it. The UI must
  not suggest otherwise.

## 7. UI foundation

shadcn/ui, restyled to the Sentry design language — the same approach as the POS
terminal, and the standing preference for this codebase.

- The 40 Sentry design tokens already exist in `src/app/globals.css` under Tailwind v4's
  `@theme` (`--color-brand-green: #00ed64`, `--color-ink: #001e2b`, the heat ramp, the
  radii). The palette is done.
- shadcn is **not** initialised in this repo — no `components.json`. Initialising it is a
  setup step, with the generated components' default palette rewired to the tokens above
  so nothing ships in shadcn's stock slate.
- Components needed: button, input, select, checkbox, switch, table, dialog, sheet,
  dropdown-menu, form, label, badge, tabs, toast, skeleton, alert, card, separator,
  command (for the business switcher).
- Fonts (Figtree, Source Code Pro) are already wired via `--font-sans` / `--font-mono`.

## 8. Testing

The repo currently has **no test runner at all** — no vitest, no jest, no `test` script.
Setting one up is part of the work: Vitest with jsdom and Testing Library, mirroring
`sentry-pos-fe`'s configuration.

The API is already covered by 229 e2e tests in `sentry-pos-be`. Portal tests therefore
target what is genuinely new here:

1. **The auth layer** — cookie flags are set correctly; middleware refreshes an expiring
   token and leaves a healthy one alone; it never refreshes on a prefetch; a failed
   refresh clears both cookies and redirects; the preauth cookie is cleared after TOTP;
   each role is redirected away from the other's surface.
2. **Error mapping** — every `code` in the table above maps to its typed error; a joined
   `validation` message splits back into per-field errors; an unrecognised segment becomes
   a form-level error instead of vanishing.
3. **Screen behaviour** — user-visible behaviour against a stubbed API module, not
   implementation details. Same discipline as the terminal's screen tests.
4. **Money conversion** — pesos ⇄ integer centavos at the form boundary, round-tripping
   exactly, including the values that break naive float arithmetic.

Plus an opt-in live suite gated on an env var, mirroring
`src/test/integration/live-api.test.ts` in `sentry-pos-fe`: log in as an admin, create an
owner, accept the invite, create a business, a category, a product, and a branch, then
confirm the product appears in the POS catalog endpoint. That single path is the real
proof that the portal and the terminal agree.

## 9. Build order

Five phases. Each is independently shippable and leaves the app working.

| # | Phase | Contains |
| --- | --- | --- |
| 1 | **Foundation + auth** | Vitest, shadcn, the `(app)` route group, `apiFetch()`, error mapping, cookies, middleware (guard + refresh), login, TOTP setup and verify, forgot/reset, invite accept, the app shell |
| 2 | **Platform admin** | Owner list, create owner, owner detail, suspend/reinstate, tenant browse |
| 3 | **Catalog** | Products, variants, categories, modifier groups |
| 4 | **Discounts + settings** | Discount CRUD, refund PIN |
| 5 | **Branches, stock, terminals** | Branch CRUD, stock levels, receive, adjust, terminal list and unpair, activity log |

Phase 2 comes before the catalog deliberately: it is what makes production onboarding
possible without a shell, so it unblocks the most.

## 10. Environment

| Variable | Purpose |
| --- | --- |
| `API_URL` | server-side base URL for `sentry-pos-be`, e.g. `http://localhost:4000/v1`. **Not** `NEXT_PUBLIC_` — the browser must never see it. |

No CORS change is needed on the backend, because the browser never calls it.

The backend's own `APP_URL` must point at this app (dev: `http://localhost:3100`) — it is
what the invite and password-reset emails link to. It defaults to `http://localhost:3000`,
which is the POS terminal; left there, every owner invite lands on the wrong app.

In development the backend has no `RESEND_API_KEY`, so invite and reset emails are not
sent — they are logged by `MailService` and pushed onto an in-memory `sentMailbox`. The
raw token has to be read out of the backend's console output to complete an invite by
hand.

## 11. Risks

- **Shared blast radius.** The marketing site and the authenticated back-office deploy
  together. A build break in one takes down the other. Mitigated by route-group isolation
  and middleware guards; inherent to the repo choice.
- **Payload cookie collision.** Payload's admin session lives in the same app. Distinct
  cookie names are required, not optional.
- **Silent field stripping.** `whitelist: true` without `forbidNonWhitelisted` means a
  mistyped payload key is dropped without error. Request types must be exact, and the
  live suite is what catches a drift here.
- **Refresh-token rotation is unforgiving.** Reuse of a rotated token revokes every
  session for that user, so any code path that could refresh concurrently is a
  logout-everywhere bug. Confining refresh to middleware — and skipping it on prefetches —
  is what keeps that single-threaded.
- **`design-spec.md` now triplicated.** Three copies, no mechanism keeping them in sync.
