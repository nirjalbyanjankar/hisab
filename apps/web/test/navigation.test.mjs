import { test } from "node:test";
import assert from "node:assert/strict";
import { NAV, NAV_SECTIONS, resolveTab, sectionForTab, tabHref } from "../lib/navigation.ts";

test("every sidebar destination belongs to exactly one section; access is top-only", () => {
  const tabs = NAV_SECTIONS.flatMap((section) => section.tabs);
  assert.equal(new Set(tabs).size, tabs.length);
  assert.deepEqual([...tabs].sort(), NAV.filter((item) => item.key !== "access").map((item) => item.key).sort());
  assert.equal(sectionForTab("access"), undefined);
});

test("top navigation tracks all pages in its section", () => {
  for (const tab of ["clients", "members"]) assert.equal(sectionForTab(tab).key, "people");
  for (const tab of ["invoices", "expenses", "retainers"]) assert.equal(sectionForTab(tab).key, "billing");
  for (const tab of ["profile", "password"]) assert.equal(sectionForTab(tab).key, "settings");
});

test("every destination round-trips through its URL", () => {
  for (const { key } of NAV) {
    const url = new URL(tabHref(key), "http://localhost");
    assert.equal(resolveTab(url.pathname, url.searchParams.get("section")), key);
  }
});

test("invoice routes override queries; legacy links and invalid queries are handled", () => {
  assert.equal(resolveTab("/invoices/new", "clients"), "invoices");
  assert.equal(resolveTab("/invoices", "access"), "invoices");
  assert.equal(resolveTab("/", "invoices"), "invoices");
  assert.equal(resolveTab("/", "access"), "access");
  assert.equal(resolveTab("/", "not-a-page"), "overview");
});
