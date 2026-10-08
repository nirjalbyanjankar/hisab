"use client";
import type { Permission } from "@hisab/permissions";
import { roleLabel, type Session } from "../lib/api";
import { NAV, ICON_PATHS, type Tab } from "../lib/navigation";

export function Sidebar({
  session,
  tab,
  navigate,
  onSignOut,
}: {
  session: Session;
  tab: Tab;
  navigate: (tab: Tab) => void;
  onSignOut: () => void;
}) {
  const can = (permission: Permission) =>
    session.permissions.includes(permission);
  return (
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
      <nav aria-label="Workspace navigation">
        {(["Main Menu", "Settings"] as const).map((group) => (
          <div className="nav-group" key={group}>
            <span className="nav-label">{group}</span>
            {NAV.filter((item) =>
              group === "Settings"
                ? ["profile", "password", "access"].includes(item.key)
                : !["profile", "password", "access"].includes(item.key),
            ).map((item) => (
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
          </div>
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
        <button className="sign-out" type="button" onClick={() => onSignOut()}>
          Sign out ↗
        </button>
      </div>
    </aside>
  );
}
