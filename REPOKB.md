# Hisab repository map

- `apps/api`: NestJS API, Prisma config, data contract, migrations, and seed entry point.
- `apps/web`: Next.js frontend (`@hisab/web`).
- `packages/database`: shared PostgreSQL runtime and Temporal setup.
- `packages/ui`, `packages/eslint-config`, `packages/typescript-config`: shared tooling.
- `services`: Compose infrastructure and SeaweedFS configuration directory.
- `knowledge`: development documentation and preserved starter docs app.

Prisma schema: `apps/api/prisma/schema/schema.prisma`.
Prisma migrations: `apps/api/prisma/migrations`.
Local service project: `hisab`; PostgreSQL volume: `hisab_postgres_data`.

Tenant foreign keys prevent cross-organization references. JWT auth, authorization,
tenant filtering on reads, financial retention rules, BullMQ, and S3 integration
remain to be implemented. Users are scoped to organizations with per-tenant email uniqueness.
