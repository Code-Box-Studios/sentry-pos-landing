# sentry-pos-landing

The public marketing site for **Sentry**, a point-of-sale system for Philippine small businesses.
Two things live here: the landing page at `/`, and the [Payload CMS](https://payloadcms.com) that
edits its copy at `/cms`.

This app is **server-rendered** and talks to Postgres, so it needs Docker running locally. It is
deployed independently of the POS terminal — see [Where this fits](#where-this-fits).

Behaviour is specified in [`landing-spec.md`](landing-spec.md); the visual language is
[`design-spec.md`](design-spec.md), with the rendered pixel reference in
[`design/landing.dc.html`](design/landing.dc.html).

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
| `pnpm lint` | ESLint |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after a collection or global changes |
| `pnpm payload migrate:create <name>` | New migration — needs a real interactive terminal |
| `pnpm payload migrate` | Apply pending migrations |

## Environment

Three variables, all in [`.env.example`](.env.example):

| Variable | What it is |
| --- | --- |
| `DATABASE_URI` | Postgres connection string. Locally this is the `cms_user` role, which reaches the `cms` schema and nothing else. |
| `PAYLOAD_SECRET` | Signs Payload session tokens. Generate a real random value per environment — never reuse the dev one. |
| `NEXT_PUBLIC_APP_SIGNIN_URL` | Where the landing page's **Sign in** button points. In production this is the owner portal (`app.` subdomain), which is not built yet; locally it points at the POS terminal so the button does something. |

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
| **sentry-pos-landing** (this one) | the marketing site, apex domain | Next SSR + Payload + Postgres |
| [`sentry-pos-fe`](https://github.com/Code-Box-Studios/sentry-pos-fe) | the POS terminal, `pos.` | static Next export, no server |
| [`sentry-pos-be`](https://github.com/Code-Box-Studios/sentry-pos-be) | the API, `api.` | NestJS + Prisma + Postgres |

The owner portal (`app.`) is not built yet.

`project-spec.md` in `sentry-pos-fe` remains the system-wide source of truth for architecture,
tenancy and money rules. [`design-spec.md`](design-spec.md) is copied here so this repo stands on
its own — if you change the visual language, change it in both places.
