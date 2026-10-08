"use client";
import { ThemeSwitch } from "./theme-switch";
import { NotificationBell } from "./notification-bell";
import { Brand } from "./brand";
import type { Session } from "../lib/api";
import type { Tab } from "../lib/navigation";

export function Navbar({
  session,
  tab,
  navigate,
  theme,
  toggleTheme,
  notifications,
  onClearNotifications,
}: {
  session: Session;
  tab: Tab;
  navigate: (tab: Tab) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  notifications: string[];
  onClearNotifications: () => void;
}) {
  return (
    <header className="workspace-header">
      <Brand inverted={theme === "dark"} />
      <span className="header-divider" aria-hidden="true" />
      <span className="header-workspace-name">{session.organization.name}</span>
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
      <div className="header-actions">
        <ThemeSwitch theme={theme} toggleTheme={toggleTheme} />
        <NotificationBell
          notifications={notifications}
          onClearNotifications={onClearNotifications}
        />
      </div>
    </header>
  );
}
