# Hisab API

NestJS 11 with environment checks, validation, Helmet, CORS, Swagger and graceful
database shutdown. Run `make run.api` from the root. Environment values are in `.env`.

Prisma config is `prisma.config.ts`, schema is `prisma/schema/schema.prisma`,
and migration history is `prisma/migrations`. The typed runtime client is
`src/database/client.ts`, built on the shared `database` package.

Health: `/api/v1/health`; database readiness: `/api/v1/health/ready`.
Swagger: `/api/docs` and `/api/docs-json` outside production.

See [development commands](../../knowledge/development.md) and
[authentication and tenant isolation](../../knowledge/authentication.md).

Authentication, global permission guards, tenant-scoped reads and client creation/updates
are implemented. JWT_SECRET is required. A basic frontend is available at localhost:3000. Domain financial writes, BullMQ
and storage integration remain.
