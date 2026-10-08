import type { ReactNode, Ref } from "react";
import { Brand } from "../../../components/brand";
import { WorkspaceIllustration } from "../../../components/workspace-illustration";

export default function LoginLayout({
  signup = false,
  children,
  formAreaRef,
}: {
  signup?: boolean;
  children: ReactNode;
  formAreaRef: Ref<HTMLElement>;
}) {
  return (
    <main className={`auth-layout ${signup ? "registration-layout" : ""}`}>
      <section className="auth-story">
        <Brand inverted />
        {signup ? (
          <div className="registration-story">
            <span className="eyebrow light">
              A fresh start for your business
            </span>
            <h1>
              Less admin.
              <br />
              <em>More clarity.</em>
            </h1>
            <p>
              Set up your workspace and bring your clients, records, and team
              together.
            </p>
            <ul>
              <li>
                <span>01</span>
                <div>
                  <strong>Your people</strong>
                  <p>Clients and teammates, connected.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Your numbers</strong>
                  <p>Invoices, expenses, and retainers in one place.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Your workspace</strong>
                  <p>The right access for everyone on your team.</p>
                </div>
              </li>
            </ul>
          </div>
        ) : (
          <>
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
          </>
        )}
        <p className="story-foot">
          Clients · Invoices · Expenses · Retainers · Team
        </p>
      </section>
      <section className="auth-form-area" ref={formAreaRef}>
        {children}
      </section>
    </main>
  );
}
