"use client";
import { ThemeSwitch } from "./theme-switch";
import { NotificationBell } from "./notification-bell";
import { Brand } from "./brand";
import type { Session } from "../lib/api";
import Link from "next/link";
import { NAV_SECTIONS, sectionForTab, tabHref, type Tab } from "../lib/navigation";

export function Navbar({
  session,
  tab,
  theme,
  toggleTheme,
  notifications,
  onClearNotifications,
}: {
  session: Session;
  tab: Tab;
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
      <nav className="header-shortcuts" aria-label="Platform navigation">
        {NAV_SECTIONS.map((section) => (
          <Link
            key={section.key}
            href={tabHref(section.tabs[0]!)}
            aria-current={sectionForTab(tab)?.key === section.key ? "location" : undefined}
          >
            {section.label}
          </Link>
        ))}
        <Link href={tabHref("access")} aria-current={tab === "access" ? "page" : undefined}>
          My access
        </Link>
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
