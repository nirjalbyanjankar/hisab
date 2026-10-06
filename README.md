# Hisab

Multi-tenant invoice, expense, and retainer management in a pnpm/Turborepo monorepo.
The current implementation is a database foundation and NestJS API scaffold.

```sh
make install
make services.start
cp apps/api/.env.example apps/api/.env  # only when .env does not already exist
make build.packages
make prisma.migrate.dev
make run
```

Web runs on port 3000; API on port 3001; Swagger at `/api/docs` in development.
See [development commands](knowledge/development.md) and [repository map](REPOKB.md).
