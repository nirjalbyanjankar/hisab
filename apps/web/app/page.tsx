"use client";
import { useState } from "react";
import type { Session } from "../lib/api";
import { AuthPanel } from "../components/auth-panel";
import { Workspace } from "../components/workspace";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [slug, setSlug] = useState("");
  const [notice, setNotice] = useState("");
  if (!session)
    return (
      <AuthPanel
        initialSlug={slug}
        notice={notice}
        onAuthenticated={(next) => {
          setSession(next);
          setSlug(next.organization.slug);
          setNotice("");
        }}
      />
    );
  return (
    <Workspace
      key={session.user.id}
      session={session}
      onProfileChange={(profile) =>
        setSession((current) =>
          current?.accessToken === session.accessToken
            ? { ...current, ...profile }
            : current,
        )
      }
      onSignOut={(expired = false) => {
        setSession((current) =>
          current?.accessToken === session.accessToken ? null : current,
        );
        setNotice(
          expired ? "Your session ended. Sign in again to continue." : "",
        );
      }}
    />
  );
}
