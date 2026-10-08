import { roleLabel, type Session } from "../../../lib/api";
import {
  NAV,
  ICON_PATHS,
  DESCRIPTION,
  type Tab,
} from "../../../lib/navigation";
import OverviewLayout from "./layout";

export default function OverviewPage({
  session,
  navigate,
}: {
  session: Session;
  navigate: (tab: Tab) => void;
}) {
  const sections = NAV.filter(
    (item) =>
      ["clients", "invoices", "expenses", "retainers", "members"].includes(
        item.key,
      ) && session.permissions.includes(item.permission),
  );
  return (
    <OverviewLayout>
      <section className="panel overview-welcome">
        <span className="eyebrow">Your workspace</span>
        <h2>Welcome, {session.user.fullName}.</h2>
        <p className="muted">
          Everything you need to manage {session.organization.name}, in one
          place.
        </p>
        <dl className="overview-details">
          <div>
            <dt>Organization</dt>
            <dd>{session.organization.name}</dd>
          </div>
          <div>
            <dt>Your role</dt>
            <dd>{roleLabel(session.role)}</dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{session.organization.currency}</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby="overview-sections">
        <h3 id="overview-sections" className="overview-section-heading">
          Explore your workspace
        </h3>
        <div className="overview-links">
          {sections.map((item) => (
            <button
              type="button"
              key={item.key}
              className="panel overview-link"
              onClick={() => navigate(item.key)}
            >
              <span className="overview-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
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
              <strong>{item.label}</strong>
              <span className="muted">{DESCRIPTION[item.key]}</span>
              <span className="overview-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
      </section>
    </OverviewLayout>
  );
}
