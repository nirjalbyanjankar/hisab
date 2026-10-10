import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addLine,
  removeLine,
  newLine,
  lineAmount,
  invoicePreview,
  validateInvoice,
  invoicePayload,
  canCreateInvoice,
} from "../features/invoices/schemas/invoice.schema.ts";
import { submissionGate } from "../features/invoices/hooks/submission-gate.ts";
import {
  createInvoice,
  rememberCreatedInvoice,
  recentlyCreatedInvoice,
} from "../features/invoices/api/invoices.ts";
const draft = () => ({
  clientId: "client-a",
  issueDate: "2026-10-10",
  dueDate: "2026-11-10",
  notes: " Note ",
  items: [
    { id: "a", description: "Design", quantity: "3", unitPrice: "0.10" },
    { id: "b", description: "Hosting", quantity: "2", unitPrice: "12.25" },
  ],
});
test("exact previews match backend amounts without floating point", () => {
  assert.equal(lineAmount(draft().items[0]), 30n);
  assert.equal(invoicePreview(draft().items), "24.80");
  assert.equal(
    invoicePreview([
      {
        id: "max",
        description: "Max",
        quantity: "1",
        unitPrice: "9999999999.99",
      },
    ]),
    "9999999999.99",
  );
  assert.equal(
    invoicePreview([
      {
        id: "max",
        description: "Max",
        quantity: "2",
        unitPrice: "9999999999.99",
      },
    ]),
    null,
  );
});
test("line actions retain one item and respect the 100-item limit", () => {
  const first = [newLine("a")];
  assert.equal(removeLine(first, "a").length, 1);
  const added = addLine(first, "b");
  assert.equal(added.length, 2);
  assert.equal(removeLine(added, "a")[0].id, "b");
  const many = Array.from({ length: 100 }, (_, i) => newLine(String(i)));
  assert.equal(addLine(many, "new").length, 100);
});
test("required client, calendar dates, item descriptions and supported precision are validated", () => {
  assert.deepEqual(validateInvoice(draft()), {});
  for (const patch of [
    { clientId: "" },
    { issueDate: "2026-02-30" },
    { dueDate: "2026-10-09" },
    { notes: "x".repeat(5001) },
    { items: [] },
  ])
    assert.ok(Object.keys(validateInvoice({ ...draft(), ...patch })).length);
  for (const patch of [
    { description: " " },
    { quantity: "0" },
    { quantity: "1.5" },
    { quantity: "2147483648" },
    { unitPrice: "-1" },
    { unitPrice: "0.001" },
    { unitPrice: "1e2" },
  ])
    assert.ok(
      Object.keys(
        validateInvoice({
          ...draft(),
          items: [{ ...draft().items[0], ...patch }],
        }),
      ).length,
    );
});
test("payload contains only permitted request fields and integer quantities", () => {
  const payload = invoicePayload(draft());
  assert.deepEqual(Object.keys(payload).sort(), [
    "clientId",
    "dueDate",
    "issueDate",
    "items",
    "notes",
  ]);
  assert.deepEqual(payload.items[0], {
    description: "Design",
    quantity: 3,
    unitPrice: "0.10",
  });
  assert.equal(payload.notes, "Note");
  assert.throws(() => invoicePayload({ ...draft(), clientId: "" }));
});
test("API failures retain input; success preserves the authoritative result for the tenant", async () => {
  const input = draft();
  const original = structuredClone(input);
  let call;
  const result = {
    id: "inv-a",
    organizationId: "org-a",
    invoiceNumber: "INV-a",
    status: "DRAFT",
    total: "24.80",
    items: [],
  };
  const api = async (path, options) => {
    call = { path, ...options };
    return result;
  };
  assert.equal(await createInvoice(api, invoicePayload(input)), result);
  assert.equal(call.path, "/invoices");
  assert.equal(call.method, "POST");
  await assert.rejects(
    createInvoice(async () => {
      throw Error("Offline");
    }, invoicePayload(input)),
    /Offline/,
  );
  assert.deepEqual(input, original);
  rememberCreatedInvoice(result);
  assert.equal(recentlyCreatedInvoice("org-a"), result);
  assert.equal(recentlyCreatedInvoice("org-b"), null);
});
test("permissions and a synchronous gate prevent forbidden or duplicated submissions", async () => {
  assert.equal(canCreateInvoice(["invoices:read"]), false);
  assert.equal(canCreateInvoice(["invoices:create"]), true);
  const gate = submissionGate();
  let finish;
  let calls = 0;
  const first = gate(() => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  assert.equal(
    await gate(async () => {
      calls++;
    }),
    undefined,
  );
  assert.equal(calls, 1);
  finish("saved");
  assert.equal(await first, "saved");
  await assert.rejects(
    gate(async () => {
      throw Error("Failed");
    }),
    /Failed/,
  );
  assert.equal(await gate(async () => "retry"), "retry");
});
