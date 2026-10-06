import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { JwtService } from "@nestjs/jwt";
import { createApplication } from "../dist/src/app.factory.js";
import { DATABASE } from "../dist/src/database.module.js";

const password = "Hisab-test-password-123";
test("authentication, tenant isolation, live roles and credential abuse protections", async (t) => {
  assert.match(
    new URL(process.env.DATABASE_URL).pathname,
    /^\/hisab_auth_test_/,
  );
  const app = await createApplication(true);
  await app.listen(0, "127.0.0.1");
  const db = app.get(DATABASE);
  const base = `${await app.getUrl()}/api/v1`;
  async function request(
    path,
    { method = "GET", token, body, headers = {} } = {},
  ) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  }
  async function expect(path, options, status) {
    const result = await request(path, options);
    assert.equal(
      result.status,
      status,
      `${path}: ${JSON.stringify(result.body)}`,
    );
    return result.body;
  }
  function withoutSecrets(body) {
    assert.doesNotMatch(JSON.stringify(body), /passwordHash|scrypt:/);
  }
  try {
    await t.test(
      "public health, protected-by-default routes and validated signup",
      async () => {
        await expect("/health", {}, 200);
        await expect("/auth/me", {}, 401);
        await expect("/clients", {}, 401);
        await expect(
          "/auth/signup",
          {
            method: "POST",
            body: {
              organizationSlug: "bad",
              organizationName: "Bad",
              email: "owner@example.test",
              password,
              fullName: "Owner",
              role: "OWNER",
            },
          },
          400,
        );
      },
    );
    const signup = (organizationSlug) =>
      expect(
        "/auth/signup",
        {
          method: "POST",
          body: {
            organizationSlug,
            organizationName: organizationSlug,
            email: "OWNER@example.test",
            password,
            fullName: "Owner",
          },
        },
        201,
      );
    const a = await signup("tenant-a");
    const b = await signup("tenant-b");
    assert.notEqual(a.user.id, b.user.id);
    assert.notEqual(a.organization.id, b.organization.id);
    assert.equal(a.role, "OWNER");
    withoutSecrets(a);
    await t.test("duplicate slug rolls back without orphan users", async () => {
      await expect(
        "/auth/signup",
        {
          method: "POST",
          body: {
            organizationSlug: "tenant-a",
            organizationName: "Duplicate",
            email: "duplicate@example.test",
            password,
            fullName: "Duplicate",
          },
        },
        409,
      );
      assert.equal(
        await db.orm.public.User.where({
          email: "duplicate@example.test",
        }).first(),
        null,
      );
    });
    const login = (
      organizationSlug,
      email = "owner@example.test",
      suppliedPassword = password,
    ) =>
      expect(
        "/auth/login",
        {
          method: "POST",
          body: { organizationSlug, email, password: suppliedPassword },
        },
        200,
      );
    const loggedIn = await login("TENANT-A");
    assert.equal(loggedIn.user.id, a.user.id);
    const tokenA = loggedIn.accessToken;
    const tokenB = b.accessToken;
    await t.test(
      "invalid credentials are generic and tokens are verified strictly",
      async () => {
        for (const body of [
          {
            organizationSlug: "tenant-a",
            email: "owner@example.test",
            password: "wrong",
          },
          {
            organizationSlug: "unknown-tenant",
            email: "owner@example.test",
            password,
          },
          {
            organizationSlug: "tenant-a",
            email: "unknown@example.test",
            password,
          },
        ]) {
          const error = await expect(
            "/auth/login",
            { method: "POST", body },
            401,
          );
          assert.equal(error.message, "Invalid credentials");
        }
        const jwt = new JwtService({ secret: process.env.JWT_SECRET });
        const claims = { sub: a.user.id, organizationId: a.organization.id };
        for (const invalid of [
          tokenA.slice(0, -8) + "tampered",
          jwt.sign(claims, {
            expiresIn: -1,
            issuer: "hisab",
            audience: "hisab-api",
          }),
          jwt.sign(claims, {
            expiresIn: 900,
            issuer: "other",
            audience: "hisab-api",
          }),
          jwt.sign(claims, {
            expiresIn: 900,
            issuer: "hisab",
            audience: "other",
          }),
          jwt.sign(
            { sub: a.user.id, organizationId: b.organization.id },
            { expiresIn: 900, issuer: "hisab", audience: "hisab-api" },
          ),
          jwt.sign(claims, { issuer: "hisab", audience: "hisab-api" }),
        ])
          await expect("/auth/me", { token: invalid }, 401);
      },
    );
    const member = (email, role, token = tokenA) =>
      expect(
        "/members",
        {
          method: "POST",
          token,
          body: { email, fullName: role, password, role },
        },
        201,
      );
    const viewer = await member("viewer@example.test", "FINANCE_VIEWER");
    const pm = await member("manager@example.test", "PROJECT_MANAGER");
    const admin = await member("admin@example.test", "ADMIN");
    const viewerSession = await login("tenant-a", viewer.user.email);
    const pmSession = await login("tenant-a", pm.user.email);
    const adminSession = await login("tenant-a", admin.user.email);
    const clientA = await expect(
      "/clients",
      {
        method: "POST",
        token: tokenA,
        body: { name: "Client A", email: "client-a@example.test" },
      },
      201,
    );
    const clientB = await expect(
      "/clients",
      {
        method: "POST",
        token: tokenB,
        body: { name: "Client B", email: "client-b@example.test" },
      },
      201,
    );
    await t.test(
      "tenant IDs cannot be injected and another tenant's IDs cannot be read or changed",
      async () => {
        await expect(
          "/clients",
          {
            method: "POST",
            token: tokenA,
            body: {
              name: "Injected",
              email: "bad@example.test",
              organizationId: b.organization.id,
            },
          },
          400,
        );
        await expect(`/clients/${clientB.id}`, { token: tokenA }, 404);
        await expect(
          `/clients/${clientB.id}`,
          { method: "PATCH", token: tokenA, body: { name: "Attack" } },
          404,
        );
        await expect(
          `/clients/${clientA.id}`,
          {
            method: "PATCH",
            token: tokenA,
            body: { organizationId: b.organization.id },
          },
          400,
        );
        await expect(
          `/clients/${clientA.id}`,
          { method: "PATCH", token: tokenA, body: { name: null } },
          400,
        );
        const rows = await expect(
          "/clients",
          {
            token: tokenA,
            headers: { "x-organization-id": b.organization.id },
          },
          200,
        );
        assert.deepEqual(
          rows.map((row) => row.id),
          [clientA.id],
        );
        await expect(
          `/members/${b.user.id}/role`,
          { method: "PATCH", token: tokenA, body: { role: "FINANCE_VIEWER" } },
          404,
        );
        await expect("/clients?organizationId=other", { token: tokenA }, 400);
        await expect("/clients?limit=101", { token: tokenA }, 400);
        withoutSecrets(await expect("/members", { token: tokenA }, 200));
      },
    );
    await t.test(
      "role permissions enforce reads, writes and privilege boundaries",
      async () => {
        await expect("/clients", { token: viewerSession.accessToken }, 200);
        await expect(
          "/clients",
          {
            method: "POST",
            token: viewerSession.accessToken,
            body: { name: "Denied", email: "denied@example.test" },
          },
          403,
        );
        await expect("/members", { token: viewerSession.accessToken }, 403);
        await expect(
          "/clients",
          {
            method: "POST",
            token: pmSession.accessToken,
            body: { name: "Allowed", email: "allowed@example.test" },
          },
          201,
        );
        await expect(
          "/members",
          {
            method: "POST",
            token: pmSession.accessToken,
            body: {
              email: "bad@example.test",
              fullName: "Bad",
              password,
              role: "ADMIN",
            },
          },
          403,
        );
        await expect(
          "/members",
          {
            method: "POST",
            token: adminSession.accessToken,
            body: {
              email: "bad@example.test",
              fullName: "Bad",
              password,
              role: "ADMIN",
            },
          },
          403,
        );
        await expect(
          "/members",
          {
            method: "POST",
            token: tokenA,
            body: {
              email: "bad@example.test",
              fullName: "Bad",
              password,
              role: "OWNER",
            },
          },
          400,
        );
        await expect(
          `/members/${a.user.id}/role`,
          {
            method: "PATCH",
            token: adminSession.accessToken,
            body: { role: "FINANCE_VIEWER" },
          },
          403,
        );
        await expect(
          `/clients/${clientA.id}`,
          {
            method: "PATCH",
            token: pmSession.accessToken,
            body: { name: "Updated" },
          },
          200,
        );
        await expect(
          `/members/${pm.user.id}/role`,
          { method: "PATCH", token: tokenA, body: { role: "FINANCE_VIEWER" } },
          200,
        );
        await expect(
          `/clients/${clientA.id}`,
          {
            method: "PATCH",
            token: pmSession.accessToken,
            body: { name: "Denied after demotion" },
          },
          403,
        );
        const me = await expect(
          "/auth/me",
          { token: pmSession.accessToken },
          200,
        );
        assert.equal(me.role, "FINANCE_VIEWER");
        await db.orm.public.Membership.where({
          userId: viewer.user.id,
          organizationId: a.organization.id,
        }).delete();
        await expect("/clients", { token: viewerSession.accessToken }, 401);
      },
    );
    await t.test(
      "financial-record lists and invoice items are scoped to the authenticated tenant",
      async () => {
        const ids = [];
        for (const [session, client] of [
          [a, clientA],
          [b, clientB],
        ]) {
          const organizationId = session.organization.id;
          const invoice = await db.orm.public.Invoice.create({
            organizationId,
            clientId: client.id,
            invoiceNumber: "INV-1",
            issueDate: Temporal.Now.instant(),
            dueDate: Temporal.Now.instant(),
            subtotal: "10.00",
            total: "10.00",
          });
          ids.push(invoice.id);
          await db.orm.public.InvoiceItem.create({
            organizationId,
            invoiceId: invoice.id,
            description: "Item",
            unitPrice: "10.00",
            amount: "10.00",
          });
          await db.orm.public.Expense.create({
            organizationId,
            title: "Expense",
            amount: "10.00",
            date: Temporal.Now.instant(),
          });
          await db.orm.public.Retainer.create({
            organizationId,
            clientName: client.name,
            monthlyAmount: "10.00",
          });
        }
        for (const route of [
          "/invoices",
          "/expenses",
          "/retainers",
          `/invoices/${ids[0]}/items`,
        ]) {
          const rows = await expect(route, { token: tokenA }, 200);
          assert.equal(rows.length, 1);
          assert.equal(rows[0].organizationId, a.organization.id);
        }
        await expect(`/invoices/${ids[1]}/items`, { token: tokenA }, 404);
      },
    );
    await t.test("login attempts are rate limited", async () => {
      let limited = false;
      for (let i = 0; i < 12; i++) {
        const response = await request("/auth/login", {
          method: "POST",
          body: {
            organizationSlug: "tenant-a",
            email: "owner@example.test",
            password: "wrong",
          },
        });
        if (response.status === 429) {
          limited = true;
          break;
        }
        assert.equal(response.status, 401);
      }
      assert.equal(limited, true);
    });
  } finally {
    await app.close();
  }
});
