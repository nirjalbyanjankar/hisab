"use client";

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
} from "../../../lib/api";
import type { WorkspaceApi } from "../../../lib/api";
import { NAV, DESCRIPTION, type Tab } from "../../../lib/navigation";
import { Navbar } from "../../../components/navbar";
import { Sidebar } from "../../../components/sidebar";
import { Footer } from "../../../components/footer";
import WorkspaceLayout from "./layout";
import ClientsPage from "../clients/page";
import TeamPage from "../team/page";
import AccessPage from "../access/page";
import EditProfilePage from "../edit-profile/page";
import ChangePasswordPage from "../change-password/page";
import InvoicesPage from "../invoices/page";
import ExpensesPage from "../expenses/page";
import RetainersPage from "../retainers/page";

export default function WorkspacePage({
  session,
  onSignOut,
  onProfileChange,
}: {
  session: Session;
  onSignOut: (expired?: boolean) => void;
  onProfileChange: (profile: Profile) => void;
}) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem("hisab-theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {}
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [notifications, setNotifications] = useState<string[]>([]);
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("hisab-theme", next);
    } catch {}
  }
  function recordNotification(message: string) {
    setNotice(message);
    setNotifications((items) => [message, ...items].slice(0, 20));
  }
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
    if (["access", "profile", "password"].includes(tab) || !allowed) return;
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
    recordNotification(message);
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
  const CurrentSettingsPage =
    tab === "password" ? ChangePasswordPage : EditProfilePage;
  const CurrentFinancialPage =
    tab === "expenses"
      ? ExpensesPage
      : tab === "retainers"
        ? RetainersPage
        : InvoicesPage;
  return (
    <WorkspaceLayout theme={theme}>
      <Navbar
        session={session}
        tab={tab}
        navigate={navigate}
        theme={theme}
        toggleTheme={toggleTheme}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
      />
      <Sidebar
        session={session}
        tab={tab}
        navigate={navigate}
        onSignOut={() => onSignOut()}
      />
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
            {!["access", "profile", "password"].includes(tab) && allowed && (
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
          ) : tab === "profile" || tab === "password" ? (
            <CurrentSettingsPage
              key={tab}
              user={session.user}
              api={api}
              onProfileChange={onProfileChange}
              onSaved={recordNotification}
            />
          ) : tab === "access" ? (
            <AccessPage
              session={session}
              refreshAccess={refreshAccess}
              refreshing={refreshing}
            />
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
                <ClientsPage
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
                <TeamPage
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
                <CurrentFinancialPage
                  key={`${tab}-${revision}-${offset}`}
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
          <Footer />
        </div>
      </main>
    </WorkspaceLayout>
  );
}
