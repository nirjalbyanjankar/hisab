"use client";
import { Brand } from "./brand";
import { WorkspaceIllustration } from "./workspace-illustration";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const formAreaRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousHeight = useRef<number | null>(null);
  const cardAnimation = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const card = cardRef.current;
    const area = formAreaRef.current;
    if (!card || !area) return;
    const fitCard = () => {
      const scale = Math.min(1, (area.clientHeight - 32) / card.offsetHeight);
      card.style.setProperty("--auth-card-scale", String(Math.max(0.1, scale)));
    };
    const observer = new ResizeObserver(fitCard);
    observer.observe(area);
    observer.observe(card);
    fitCard();
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const from =
      cardAnimation.current?.playState === "running"
        ? card.offsetHeight
        : previousHeight.current;
    cardAnimation.current?.cancel();
    const to = card.offsetHeight;
    previousHeight.current = to;
    if (
      from !== null &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      cardAnimation.current = card.animate(
        [
          { height: `${from}px`, overflow: "hidden" },
          { height: `${to}px`, overflow: "hidden" },
        ],
        { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  }, [signup]);

  function switchMode(next: boolean) {
    if (next === signup) return;
    previousHeight.current = cardRef.current?.offsetHeight ?? null;
    setSignup(next);
    setShowPassword(false);
    setError("");
  }

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
        <Brand inverted />
        <div className="business-visual">
          <WorkspaceIllustration />
        </div>
        <div className="story-copy">
          <span className="eyebrow light">Your business, connected</span>
          <h1>
            A clearer picture.
            <br />
            <em>A better workspace.</em>
          </h1>
          <p>
            From your first client to your next invoice. Keep your books,
            expenses, and team together in Hisab.
          </p>
        </div>
        <p className="story-foot">
          Clients · Invoices · Expenses · Retainers · Team
        </p>
      </section>
      <section className="auth-form-area" ref={formAreaRef}>
        <div
          className="auth-form-card"
          ref={cardRef}
          data-mode={signup ? "signup" : "login"}
        >
          <div className="auth-card-brand">
            <Brand />
          </div>
          <h2 key={signup ? "signup-heading" : "login-heading"}>
            {signup ? "Create your workspace" : "Log in to Hisab"}
          </h2>
          <p className="muted">
            {signup
              ? "Create your organization and its owner account."
              : "Sign in to your organization’s workspace."}
          </p>
          <div
            className="auth-tabs"
            aria-label="Account options"
            data-signup={signup}
          >
            <button
              type="button"
              disabled={busy}
              className={!signup ? "active" : ""}
              aria-pressed={!signup}
              onClick={() => switchMode(false)}
            >
              Sign in
            </button>
            <button
              type="button"
              disabled={busy}
              className={signup ? "active" : ""}
              aria-pressed={signup}
              onClick={() => switchMode(true)}
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
                <div className="password-field">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={signup ? 12 : 1}
                    maxLength={128}
                    placeholder={
                      signup ? "At least 12 characters" : "Your password"
                    }
                    autoComplete={signup ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <button className="button primary full" type="submit">
                {busy
                  ? "Please wait…"
                  : signup
                    ? "Create workspace →"
                    : "Log in →"}
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
