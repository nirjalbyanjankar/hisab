"use client";
import { useState, type FormEvent } from "react";
import { apiRequest, errorMessage, type Session } from "../lib/api";

export function AuthPanel({
  initialSlug,
  notice,
  onAuthenticated,
}: {
  initialSlug: string;
  notice: string;
  onAuthenticated: (session: Session) => void;
}) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const credentials = {
      organizationSlug: String(data.get("organizationSlug"))
        .trim()
        .toLowerCase(),
      email: String(data.get("email")).trim().toLowerCase(),
      password: String(data.get("password")),
    };
    try {
      const session = await apiRequest<Session>(
        signup ? "/auth/signup" : "/auth/login",
        {
          method: "POST",
          body: signup
            ? {
                ...credentials,
                organizationName: String(data.get("organizationName")),
                fullName: String(data.get("fullName")),
              }
            : credentials,
        },
      );
      onAuthenticated(session);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a className="brand" href="/" aria-label="Hisab home">
          <span className="brand-mark">h.</span> hisab
          <span className="brand-dot">.</span>
        </a>
        <div className="story-copy">
          <span className="eyebrow light">
            A clearer picture of your business
          </span>
          <h1>
            Your books.
            <br />
            Your people.
            <br />
            <em>One workspace.</em>
          </h1>
          <p>
            Keep clients, invoices, expenses, and retainers together. Give your
            team the access they need.
          </p>
          <div className="story-preview">
            <div className="preview-top">
              <span className="status-dot" /> Your organization’s workspace{" "}
              <span>↗</span>
            </div>
            <div className="preview-row">
              <span>Clients & relationships</span>
              <span>Organized</span>
            </div>
            <div className="preview-row">
              <span>Team permissions</span>
              <span>In your control</span>
            </div>
            <div className="preview-row">
              <span>Business records</span>
              <span>In one place</span>
            </div>
          </div>
        </div>
        <p className="story-foot">Built for teams. Made for clarity.</p>
      </section>
      <section className="auth-form-area">
        <div className="auth-form-card">
          <span className="eyebrow">Welcome to Hisab</span>
          <h2>{signup ? "Start your workspace" : "Good to see you again"}</h2>
          <p className="muted">
            {signup
              ? "Create your organization and its owner account."
              : "Sign in to your organization’s workspace."}
          </p>
          <div className="auth-tabs" aria-label="Account options">
            <button
              type="button"
              disabled={busy}
              className={!signup ? "active" : ""}
              onClick={() => {
                setSignup(false);
                setError("");
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              disabled={busy}
              className={signup ? "active" : ""}
              onClick={() => {
                setSignup(true);
                setError("");
              }}
            >
              Create organization
            </button>
          </div>
          {notice && (
            <p className="notice" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="alert" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={submit} key={signup ? "signup" : "login"}>
            <fieldset disabled={busy} className="form-fields">
              {signup && (
                <label>
                  Organization name
                  <input
                    name="organizationName"
                    required
                    maxLength={120}
                    placeholder="Acme Studio"
                    autoComplete="organization"
                  />
                </label>
              )}
              <label>
                Organization slug
                <input
                  name="organizationSlug"
                  required
                  defaultValue={initialSlug}
                  minLength={3}
                  maxLength={63}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  placeholder="acme-studio"
                  autoCapitalize="none"
                  autoComplete="off"
                />
                <span className="field-hint">
                  {signup
                    ? "A unique name using lowercase letters, numbers, and hyphens."
                    : "Use the slug you chose when creating your organization."}
                </span>
              </label>
              {signup && (
                <label>
                  Your name
                  <input
                    name="fullName"
                    required
                    maxLength={120}
                    placeholder="Full name"
                    autoComplete="name"
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={254}
                  placeholder="you@company.com"
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={signup ? 12 : 1}
                  maxLength={128}
                  placeholder={
                    signup ? "At least 12 characters" : "Your password"
                  }
                  autoComplete={signup ? "new-password" : "current-password"}
                />
              </label>
              <button className="button primary full" type="submit">
                {busy
                  ? "Please wait…"
                  : signup
                    ? "Create workspace →"
                    : "Sign in →"}
              </button>
            </fieldset>
          </form>
          <p className="auth-note">
            Each organization has its own accounts and business records.
          </p>
        </div>
      </section>
    </main>
  );
}
