# Shared database runtime

Exports the Prisma 8 PostgreSQL runtime factory and installs the Temporal polyfill
for Node 24. The application owns its contract and instantiates a typed client.

Hisab's schema, config, migrations and seed are in `apps/api`; run root Make targets.
See [development commands](../../knowledge/development.md).
