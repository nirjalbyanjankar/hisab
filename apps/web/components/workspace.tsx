"use client";
import { Brand } from "./brand";
import { useCallback, useEffect, useState } from "react";
import type { Permission } from "@hisab/permissions";
import {
  ApiError,
  apiRequest,
  errorMessage,
  roleLabel,
  type Client,
  type FinancialRecord,
  type Member,
  type Profile,
  type Session,
} from "../lib/api";
import { ClientsPanel, type WorkspaceApi } from "./clients-panel";
import { TeamPanel } from "./team-panel";
import { FinancialPanel } from "./financial-panel";

type Tab =
  "clients" | "members" | "invoices" | "expenses" | "retainers" | "access";
const NAV: { key: Tab; label: string; icon: string; permission: Permission }[] =
  [
    { key: "clients", label: "Clients", icon: "◈", permission: "clients:read" },
    {
      key: "invoices",
      label: "Invoices",
      icon: "▤",
      permission: "invoices:read",
    },
    {
      key: "expenses",
      label: "Expenses",
      icon: "↗",
      permission: "expenses:read",
    },
    {
      key: "retainers",
      label: "Retainers",
      icon: "↻",
      permission: "retainers:read",
    },
    { key: "members", label: "Team", icon: "♧", permission: "members:read" },
    {
      key: "access",
      label: "My access",
      icon: "◎",
      permission: "profile:read",
    },
  ];
const ICON_PATHS: Record<Tab, string> = {
  clients:
    "M4 3h12v14H4z M8 7a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M7 14v-1a3 3 0 0 1 6 0v1",
  invoices: "M5 2h10v16l-2-1-3 1-3-1-2 1z M8 6h4 M8 10h4",
  expenses: "M3 14l5-5 3 3 6-8 M12 4h5v5",
  retainers:
    "M16 7a6 6 0 0 0-10-2L3 8 M3 3v5h5 M4 13a6 6 0 0 0 10 2l3-3 M17 17v-5h-5",
  members:
    "M7 9a3 3 0 1 0 0-6a3 3 0 1 0 0 6 M2 17v-2a5 5 0 0 1 10 0v2 M14 4a3 3 0 0 1 0 6 M15 12a4 4 0 0 1 3 4v1",
  access: "M10 2l7 3v5c0 4-7 8-7 8S3 14 3 10V5z M7 10l2 2 4-4",
};

const DESCRIPTION: Record<Tab, string> = {
  clients: "The people and businesses you work with.",
  members: "The right people. The right permissions.",
  invoices: "Your organization’s invoice records.",
  expenses: "Keep an eye on your business spending.",
  retainers: "Your recurring client relationships.",
  access: "Your account and permissions in this organization.",
};
export function Workspace({
  session,
  onSignOut,
  onProfileChange,
}: {
  session: Session;
  onSignOut: (expired?: boolean) => void;
  onProfileChange: (profile: Profile) => void;
}) {
  const [tab, setTab] = useState<Tab>("clients");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<(Client | Member | FinancialRecord)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const can = (permission: Permission) =>
    session.permissions.includes(permission);
  const currentNav = NAV.find((item) => item.key === tab)!;
  const allowed = can(currentNav.permission);
  const api: WorkspaceApi = useCallback(
    async <T,>(
      path: string,
      options?: { method?: string; body?: unknown; signal?: AbortSignal },
    ) => {
      try {
        return await apiRequest<T>(path, {
          ...options,
          token: session.accessToken,
        });
      } catch (failure) {
        if (failure instanceof ApiError && failure.status === 401)
          onSignOut(true);
        throw failure;
      }
    },
    [session.accessToken, onSignOut],
  );
  useEffect(() => {
    if (tab === "access" || !allowed) return;
    const controller = new AbortController();
    api<(Client | Member | FinancialRecord)[]>(
      `/${tab}?limit=20&offset=${offset}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setRows(data);
          setLoading(false);
        }
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(failure));
          setLoadFailed(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [tab, offset, revision, api, allowed]);
  function navigate(next: Tab) {
    setTab(next);
    setOffset(0);
    setRows([]);
    setError("");
    setNotice("");
    setLoading(true);
    setLoadFailed(false);
  }
  function reload() {
    setLoadFailed(false);
    setLoading(true);
    setError("");
    setRevision((current) => current + 1);
  }
  function saved(message: string) {
    setNotice(message);
    reload();
  }
  async function refreshAccess() {
    setRefreshing(true);
    setError("");
    try {
      onProfileChange(await api<Profile>("/auth/me"));
      setNotice("Your access is up to date.");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setRefreshing(false);
    }
  }
  return (
    <div className="workspace-layout">
      <header className="workspace-header">
        <Brand />
        <span className="header-divider" aria-hidden="true" />
        <span className="header-workspace-name">
          {session.organization.name}
        </span>
        <nav className="header-shortcuts" aria-label="Quick navigation">
          <button
            type="button"
            onClick={() => navigate("clients")}
            aria-current={tab === "clients" ? "page" : undefined}
          >
            People
          </button>
          <button
            type="button"
            onClick={() => navigate("invoices")}
            aria-current={tab === "invoices" ? "page" : undefined}
          >
            Billing
          </button>
          <button
            type="button"
            onClick={() => navigate("access")}
            aria-current={tab === "access" ? "page" : undefined}
          >
            My access
          </button>
        </nav>
        <span className="role-badge">{roleLabel(session.role)}</span>
      </header>
      <aside className="sidebar">
        <h2 className="sidebar-title">Workspace</h2>
        <div className="organization-card">
          <span className="organization-icon">
            {session.organization.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{session.organization.name}</strong>
            <small>{session.organization.slug}</small>
          </div>
        </div>
        <span className="nav-label">Workspace</span>
        <nav aria-label="Workspace navigation">
          {NAV.map((item) => (
            <button
              type="button"
              key={item.key}
              aria-current={tab === item.key ? "page" : undefined}
              className={`nav-item ${tab === item.key ? "selected" : ""}`}
              onClick={() => navigate(item.key)}
            >
              <span aria-hidden="true">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={ICON_PATHS[item.key]} />
                </svg>
              </span>
              {item.label}
              {!can(item.permission) && (
                <span className="nav-lock" aria-label="Restricted">
                  •
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="account">
            <span className="avatar">
              {session.user.fullName.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{session.user.fullName}</strong>
              <small>{roleLabel(session.role)}</small>
            </div>
          </div>
          <button
            className="sign-out"
            type="button"
            onClick={() => onSignOut()}
          >
            Sign out ↗
          </button>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="topbar">
          <span>
            Workspace <span className="breadcrumb">/</span> {currentNav.label}
          </span>
          <span className="topbar-slug">{session.organization.slug}</span>
        </header>
        <div className="workspace-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{session.organization.name}</span>
              <h1>
                {currentNav.label === "My access"
                  ? "Your workspace access"
                  : currentNav.label}
              </h1>
              <p className="muted">{DESCRIPTION[tab]}</p>
            </div>
            {tab !== "access" && allowed && (
              <button
                className="button secondary"
                type="button"
                onClick={reload}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            )}
          </div>
          <div className="workspace-context">
            <span>
              <span className="context-dot" aria-hidden="true" />
              {session.organization.name}
            </span>
            <span>{roleLabel(session.role)} access</span>
            <span>{session.organization.currency}</span>
          </div>
          {error && (
            <div className="alert" role="alert">
              {error}
              <button
                type="button"
                className="text-button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          {!allowed ? (
            <section className="panel empty-state">
              <span className="empty-symbol">◎</span>
              <h3>This area needs additional access</h3>
              <p>
                Your {roleLabel(session.role)} role doesn’t include team
                management. Ask your owner or administrator if you need access.
              </p>
            </section>
          ) : tab === "access" ? (
            <section className="panel access-panel">
              <div className="panel-heading">
                <div>
                  <h3>{session.user.fullName}</h3>
                  <p className="muted">{session.user.email}</p>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={refreshAccess}
                  disabled={refreshing}
                >
                  {refreshing ? "Checking…" : "Refresh access"}
                </button>
              </div>
              <p className="access-description">
                Your access is tied to{" "}
                <strong>{session.organization.name}</strong>. Your team’s other
                organizations have separate accounts and records.
              </p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Area</th>
                      <th>View</th>
                      <th>Create</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["clients", "invoices", "expenses", "retainers"].map(
                      (area) => (
                        <tr key={area}>
                          <td className="capitalize">{area}</td>
                          {["read", "create", "update"].map((action) => (
                            <td key={action}>
                              <span
                                className={
                                  can(`${area}:${action}` as Permission)
                                    ? "permission-yes"
                                    : "permission-no"
                                }
                              >
                                {can(`${area}:${action}` as Permission)
                                  ? "✓ Allowed"
                                  : "— Not allowed"}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              <p className="field-hint">
                Team management:{" "}
                {can("members:manage") ? "Allowed" : "Not allowed"}. Refresh
                access after your role is changed.
              </p>
            </section>
          ) : loading ? (
            <section className="panel loading" role="status">
              <span className="spinner" />
              Loading {currentNav.label.toLowerCase()}…
            </section>
          ) : loadFailed ? (
            <section className="panel empty-state">
              <h3>We couldn’t load these records</h3>
              <p>Check the message above and try again.</p>
              <button
                type="button"
                className="button secondary"
                onClick={reload}
              >
                Try again
              </button>
            </section>
          ) : (
            <>
              {tab === "clients" && (
                <ClientsPanel
                  key={`${revision}-${offset}`}
                  clients={rows as Client[]}
                  canCreate={can("clients:create")}
                  canUpdate={can("clients:update")}
                  api={api}
                  onSaved={saved}
                  onError={(failure) => setError(errorMessage(failure))}
                />
              )}
              {tab === "members" && (
                <TeamPanel
                  members={rows as Member[]}
                  role={session.role}
                  api={api}
                  onSaved={saved}
                  onError={(failure) => setError(errorMessage(failure))}
                />
              )}
              {(tab === "invoices" ||
                tab === "expenses" ||
                tab === "retainers") && (
                <FinancialPanel
                  key={`${tab}-${revision}-${offset}`}
                  tab={tab}
                  rows={rows as FinancialRecord[]}
                  currency={session.organization.currency}
                  api={api}
                />
              )}
              <div className="pagination">
                <span>
                  {rows.length
                    ? `Showing ${offset + 1}–${offset + rows.length}`
                    : "No records on this page"}
                </span>
                <div>
                  <button
                    className="button secondary compact"
                    type="button"
                    disabled={offset === 0}
                    onClick={() => {
                      setOffset((value) => value - 20);
                      setLoading(true);
                      setError("");
                    }}
                  >
                    ← Previous
                  </button>
                  <button
                    className="button secondary compact"
                    type="button"
                    disabled={rows.length < 20}
                    onClick={() => {
                      setOffset((value) => value + 20);
                      setLoading(true);
                      setError("");
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
          <footer className="workspace-footer">
            Hisab <span>•</span> A little clarity goes a long way.
          </footer>
        </div>
      </main>
    </div>
  );
}
