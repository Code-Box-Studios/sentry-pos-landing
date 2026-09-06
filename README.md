# sentry-pos-landing

The public web surfaces for **Sentry**, a point-of-sale system for Philippine small businesses.
Three things live here:

| Path | What |
| --- | --- |
| `/` | the public marketing site |
| `/cms` | the [Payload CMS](https://payloadcms.com) that edits its copy |
| `/portal`, `/admin` | the **authenticated app** — the owner back-office and the platform admin panel |

This app is **server-rendered** and talks to Postgres, so it needs Docker running locally. It is
deployed independently of the POS terminal — see [Where this fits](#where-this-fits).

Behaviour is specified in [`landing-spec.md`](landing-spec.md) for the marketing site and in
[`docs/superpowers/specs/2026-09-06-bo-portal-platform-admin-design.md`](docs/superpowers/specs/2026-09-06-bo-portal-platform-admin-design.md)
for the authenticated app; the visual language is [`design-spec.md`](design-spec.md), with the
rendered pixel reference in [`design/landing.dc.html`](design/landing.dc.html).

## Getting started

```bash
docker compose up -d      # Postgres 17 on localhost:5433
cp .env.example .env      # then fill in PAYLOAD_SECRET
pnpm install
pnpm dev                  # http://localhost:3100
```

The dev port is **3100**, kept clear of the POS terminal's 3000 so both can run at once.

| Script | Does |
| --- | --- |
| `pnpm dev` | Next dev server on port 3100 |
| `pnpm build` | Production build — Payload reads the schema, so the database must be up |
| `pnpm test` | Vitest, single run |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:integration` | The opt-in live suite — see [Testing](#testing) |
| `pnpm lint` | ESLint |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after a collection or global changes |
| `pnpm payload migrate:create <name>` | New migration — needs a real interactive terminal |
| `pnpm payload migrate` | Apply pending migrations |

## Environment

All in [`.env.example`](.env.example):

| Variable | What it is |
| --- | --- |
| `DATABASE_URI` | Postgres connection string. Locally this is the `cms_user` role, which reaches the `cms` schema and nothing else. |
| `PAYLOAD_SECRET` | Signs Payload session tokens. Generate a real random value per environment — never reuse the dev one. |
| `API_URL` | Where the authenticated app reaches [`sentry-pos-be`](https://github.com/Code-Box-Studios/sentry-pos-be), e.g. `http://localhost:4000/v1`. **Server-side only — never prefix it `NEXT_PUBLIC_`.** The browser never calls the API directly and must not learn its address, let alone hold a token for it. |
| `NEXT_PUBLIC_APP_SIGNIN_URL` | Where the landing page's **Sign in** button points. Now `/login` in this same app. |

One variable belongs to the **backend**, not to this repo, and is easy to miss:
`APP_URL` in `sentry-pos-be` must be `http://localhost:3100` (the portal). Its code default is
`http://localhost:3000`, which is the POS terminal — left there, every invite and password-reset
email links to an app that has no such route.

## Local database

```bash
docker compose up -d      # start
docker compose down       # stop; add -v to wipe the volume and start clean
```

Host port **5433**, not 5432, to stay out of the way of other projects' containers.

| Role | Connection string | Reaches |
| --- | --- | --- |
| `sentry` | `postgresql://sentry:sentry_dev_password@localhost:5433/sentry` | everything |
| `cms_user` | `postgresql://cms_user:cms_dev_password@localhost:5433/sentry` | the `cms` schema only |

These credentials are development-only and intentionally committed; production values come from the
host's secret store.

The split mirrors the production topology in [`landing-spec.md`](landing-spec.md) §5: the CMS gets
its own schema and its own login, so a compromised marketing-CMS credential reaches page copy and
nothing else. `cms_user` is denied `CREATE` in `public` — see
[`docker/postgres-init/01-cms-schema.sql`](docker/postgres-init/01-cms-schema.sql).

The Compose project is named `sentry-pos` rather than `sentry-pos-landing`, deliberately: the
project name is what Docker uses to find the data volume, and renaming it would silently start
against an empty database.

## The authenticated app

`/portal` is the business owner's back-office; `/admin` is the Sentry platform admin panel. Both
live in the `(app)` route group, alongside `(frontend)` and `(payload)`, and both need
[`sentry-pos-be`](https://github.com/Code-Box-Studios/sentry-pos-be) running.

```bash
# in ../sentry-pos-be — check DATABASE_URL is on port 54400, not 5433
npm install && npm run db:up && npx prisma migrate deploy && npm run db:seed
npm run start:dev              # :4000

# here
pnpm dev                       # :3100 → http://localhost:3100/login
```

The seed prints a platform-admin password once. Sign in with it and the app walks you through
enrolling an authenticator — platform admins cannot sign in on a password alone.

### How auth works

The browser never holds an API token. Login posts to a Server Action, which calls the API
server-side and stores the tokens in **httpOnly cookies** (`sentry_at`, `sentry_rt` — deliberately
distinct from Payload's `payload-token`, which lives in this same app). Every API call is made by
the Next server through `apiFetch()`; the portal needs no CORS entry because the browser never
touches the API origin.

**Token refresh happens only in `src/middleware.ts`, and that is not a stylistic choice.** Next
forbids cookie writes during a Server Component render, so a refresh triggered by a page's own
data fetch could not persist its result. And the API rotates refresh tokens with reuse detection:
replaying a rotated token revokes *every* active session for that user. Two concurrent refreshes
therefore do not merely race — the loser signs the operator out everywhere. Middleware runs once
per request, before any render, and is the only place that can be relied on to do this once.
Middleware also skips refresh on prefetches, since a prefetch racing a real navigation is the one
way two refreshes could overlap.

### Development mail

The backend has no `RESEND_API_KEY` in development, so invites and password resets are **not
emailed** — `MailService` logs them and keeps them in an in-memory outbox. To accept an invite by
hand, read the link out of the backend's console output.

## Testing

Vitest with jsdom and Testing Library. The domain logic — error mapping, cookie handling,
middleware routing and refresh — is covered directly; screens are tested through user-visible
behaviour against stubbed actions rather than implementation details.

```bash
pnpm test
```

`pnpm test:integration` is a separate, opt-in suite that drives the real API and is skipped unless
`PORTAL_E2E_API_URL` is set. It proves the contract the unit suite cannot see: that every endpoint
the admin panel calls exists, accepts what we send, and returns what we expect.

```bash
PORTAL_E2E_API_URL=http://localhost:4000/v1 \
PORTAL_E2E_ADMIN_EMAIL=admin@sentry.local \
PORTAL_E2E_ADMIN_PASSWORD=... \
PORTAL_E2E_ADMIN_TOTP=123456 \
pnpm test:integration
```

The TOTP code is live for 30 seconds, so run it promptly. The admin must already have enrolled an
authenticator; the suite says so plainly if not.

## Editing the landing copy

Sign in to the CMS at http://localhost:3100/cms. In development the account is
`admin@sentry.local` / `sentry-demo`; change it under **Settings → CMS users**.

Copy lives in the `LandingContent` global, which tracks `design/landing.dc.html` section for
section. Saving triggers ISR revalidation, so the public page picks the change up without a
redeploy.

## Deploying

Target is **Vercel** (per `project-spec.md` §12 in the
[`sentry-pos-fe`](https://github.com/Code-Box-Studios/sentry-pos-fe) repo), on the apex domain.

- Build command `pnpm build`, install command `pnpm install`.
- Payload needs a real Postgres reachable at build and run time — a managed instance
  (Supabase, Neon, RDS), not the local container.
- Set all three environment variables above. `PAYLOAD_SECRET` must be a fresh random value.
- Apply migrations with `pnpm payload migrate` as a release step. Migrations live in
  [`src/migrations/`](src/migrations/).

## Where this fits

Sentry is split across repos by deployment surface, since each has different runtime needs:

| Repo | Surface | Shape |
| --- | --- | --- |
| **sentry-pos-landing** (this one) | the marketing site (apex) **and** the owner portal + admin panel (`app.`) | Next SSR + Payload + Postgres |
| [`sentry-pos-fe`](https://github.com/Code-Box-Studios/sentry-pos-fe) | the POS terminal, `pos.` | static Next export, no server |
| [`sentry-pos-be`](https://github.com/Code-Box-Studios/sentry-pos-be) | the API, `api.` | NestJS + Prisma + Postgres |

The repo name no longer describes everything in it — the authenticated app moved in here rather
than becoming a fourth deployment. The cost of that choice is a shared blast radius: a build break
in the marketing site takes the portal down with it, and vice versa.

**What the portal does not do yet:** catalog (products, variants, categories, modifier groups),
discounts, refund PIN, branches, stock and terminals. Those are planned in
[`docs/superpowers/plans/`](docs/superpowers/plans/). Dashboard, analytics, notifications, stock
transfers, CSV export and staff roles are further out — the API has no endpoints for them.

`project-spec.md` in `sentry-pos-fe` remains the system-wide source of truth for architecture,
tenancy and money rules. [`design-spec.md`](design-spec.md) is copied here so this repo stands on
its own — if you change the visual language, change it in both places.
