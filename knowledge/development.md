# Development workflow

The lowercase root `makefile` follows the workflow of the reference project.
Run `make run.api` or `make run.web` to start one app, or `make run` for both.
`make build.packages` builds shared packages. `make lint`, `make lint.fix`, and
`make typecheck` run workspace checks. The API uses TypeScript watch mode to preserve
Nest decorator metadata. The API and shared database package use TypeScript 6 because the API ESLint parser
does not support TypeScript 7 and Prisma contract brands must resolve consistently
across those packages; the frontend and root retain TypeScript 7.

## Local services

`make services.start` runs `services/docker-compose.yml` as project `hisab`.
PostgreSQL uses port 5433 and the existing `hisab_postgres_data` volume. Redis uses
6379; SeaweedFS exposes S3 on 8333 and master on 9333. `make services.stop` stops
containers without deleting volumes. Copy `services/.env.example` to `services/.env`
if you need local overrides. Existing database credentials must stay consistent with
`apps/api/.env`; changing Compose variables does not change credentials in an initialized volume.

## Prisma 8

CLI `8.0.0-rc.19` is retained with PostgreSQL runtime `8.0.0-rc.13`, matching its bundled
ORM toolchain. The schema, config, emitted artifacts, and migrations now live under
`apps/api`. `packages/database` supplies the runtime, not schema ownership.

- `make prisma.format`: `prisma contract format`.
- `make prisma.generate`: `prisma contract emit` (typed contract, no v7 client generator).
- `make prisma.migrate.dev`: emit, plan, and apply; advance the local `db` ref.
- `make prisma.migrate.deploy`: apply committed migration packages only.
- `make db.sync`: direct local schema synchronization with `prisma db update`.
- `make db.verify`: verify the live schema and marker.

Commit emitted `schema.json`/`schema.d.ts` and reviewed migration packages. Do not use
legacy Prisma 7 `migrate dev`, `migrate deploy`, or `migrate reset` with this CLI.
Local `.env` values now belong to `apps/api/.env`. The previous database-package env
is preserved as gitignored `packages/database/.env.previous`.

## Seed and reset

Set `SEED_OWNER_PASSWORD` to at least 12 characters and run `make database.seed`.
The seed creates `hisab-demo`, `owner@hisab.test`, and an OWNER membership in one
transaction. Re-runs preserve existing rows and passwords. Passwords use the format
`scrypt:<salt>:<hash>`; future auth code must implement this verification format.

`PRISMA_RESET_CONFIRM=hisab_dev make prisma.reset` deletes the local public and
Prisma marker schemas, then replays migrations. It is restricted to the local
`hisab_dev` database on port 5433 and refuses production mode. Reset is never run
as part of installation, migrations, or seeding.

## Reference layout

`apps/docs` was preserved under `knowledge/starter-docs` and is excluded from the
workspace. The screenshot does not show the contents of the other project's API
or shared packages; those internals retain Hisab's implementation.
