# Hisab API

NestJS 11 with environment checks, validation, Helmet, CORS, Swagger and graceful
database shutdown. Run `make run.api` from the root. Environment values are in `.env`.

Prisma config is `prisma.config.ts`, schema is `prisma/schema/schema.prisma`,
and migration history is `prisma/migrations`. The typed runtime client is
`src/database/client.ts`, built on the shared `database` package.

Health: `/api/v1/health`; database readiness: `/api/v1/health/ready`.
Swagger: `/api/docs` and `/api/docs-json` outside production.

See [development commands](../../knowledge/development.md). JWT authentication,
RBAC, tenant read filtering, domain routes, BullMQ, and storage integration remain.
