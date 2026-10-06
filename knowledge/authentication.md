# Authentication, tenancy and permissions

Users remain organization-scoped. Login requires organization slug, email and password.
The same email may have separate credentials in different organizations.

Start the API with `make run.api` and open `http://localhost:3001/api/docs`.
Create an organization with `POST /api/v1/auth/signup`:

```json
{
  "organizationName": "My Company",
  "organizationSlug": "my-company",
  "fullName": "Nirjal",
  "email": "owner@example.com",
  "password": "choose-a-unique-long-password"
}
```

Signup creates organization, user and OWNER membership in a single transaction.
Roles and organization IDs cannot be supplied in this payload. Organization slugs
and email addresses are normalized to lowercase.

Login: `POST /api/v1/auth/login` with `organizationSlug`, `email` and `password`.
Both return a 15-minute `accessToken`, safe user/organization details, current role
and permissions. Paste the token into Swagger's **Authorize** dialog, or send
`Authorization: Bearer <accessToken>`. Tokens are bound to issuer `hisab` and audience
`hisab-api`; only HS256 is accepted. Log in again after expiry. Refresh tokens,
password recovery and email verification are future work. A basic browser UI now
provides signup/login, client management, team roles and permission inspection.

`JWT_SECRET` is required and must contain at least 32 bytes. A private development
secret was added to the existing gitignored API `.env`. New environments must
provide their own random secret. For example, generate one locally with
`node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))'`.
Never use the local development secret in production.

Passwords are salted and hashed asynchronously with scrypt. New hashes include
explicit parameters; the original seed hash format is also accepted. Login errors
use the same message for unknown organizations, unknown users and wrong passwords.
Login is limited to 10 requests per minute per IP per API process; signup to 5.
A shared Redis throttle store is needed before running multiple API instances.

## Current endpoints

All paths below are under `/api/v1`.

| Endpoint                                          | Access                          |
| ------------------------------------------------- | ------------------------------- |
| `POST /auth/signup`, `POST /auth/login`           | Public, rate limited            |
| `GET /health`, `GET /health/ready`                | Public                          |
| `GET /auth/me`                                    | Any valid member                |
| `GET /clients`, `GET /clients/:id`                | All four roles                  |
| `POST /clients`, `PATCH /clients/:id`             | OWNER, ADMIN, PROJECT_MANAGER   |
| `GET /invoices`, `GET /invoices/:invoiceId/items` | All four roles                  |
| `GET /expenses`, `GET /retainers`                 | All four roles                  |
| `GET /members`                                    | OWNER, ADMIN                    |
| `POST /members`, `PATCH /members/:userId/role`    | Subject to the role rules below |

List routes accept `limit` (1–100, default 20) and `offset` (default 0).
Financial write workflows and deletion endpoints are not implemented yet.

## Role policy

The shared permission file is `packages/permissions/src/index.ts`.

| Role            | Business records                     | Team management                                  |
| --------------- | ------------------------------------ | ------------------------------------------------ |
| OWNER           | Full permissions                     | Create ADMIN, PROJECT_MANAGER, FINANCE_VIEWER    |
| ADMIN           | Full permissions                     | Create/manage PROJECT_MANAGER and FINANCE_VIEWER |
| PROJECT_MANAGER | Read, create and update; no deletion | None                                             |
| FINANCE_VIEWER  | Read only                            | None                                             |

Only OWNER can provision or manage administrators. Existing OWNER memberships cannot
be reassigned through these endpoints; ownership transfer is a separate future workflow.
New team accounts are created with a password through `POST /members`; invitation
email delivery is not implemented. Existing roles are read from the database on
**every protected request**. Membership removal rejects existing tokens on subsequent requests.

## Tenant isolation rules

Global authentication and permissions guards protect routes by default. A protected
route must declare `@RequirePermissions(...)`; a route with no policy is forbidden.
Only intentional public endpoints have `@Public()`.

Tenant context is derived from a verified token, checked against both User and
Membership, and attached to the request. Body/query/header values cannot select a
different organization. Domain controllers use the request-scoped
`TenantDatabaseService`, whose methods include tenant predicates and whitelist write
fields. Reads or updates by IDs belonging to another tenant return 404.
User and membership responses exclude password hashes.

Existing composite foreign keys enforce tenant consistency for linked records.
PostgreSQL RLS is not configured: isolation is enforced at the application layer.
New domain controllers must use tenant-scoped access and permission decorators;
raw SQL/background jobs must enforce their own explicit tenant context.

## Verification

```sh
pnpm exec turbo run build --filter=@hisab/api
pnpm --filter @hisab/api test
pnpm --filter @hisab/api test:e2e
make lint
make typecheck
```

The integration runner requires local Docker/PostgreSQL. It creates a uniquely named
temporary database, replays migrations, exercises actual HTTP requests, closes the
API, and removes that database. It never seeds or resets `hisab_dev`.
