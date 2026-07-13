import type { ReactNode } from "react";
import { SessionRouteState } from "@/components/session/SessionRouteState";

type SessionEmptyStateProps = {
  actionHref?: string;
  actionLabel?: string;
  body: ReactNode;
  eyebrow?: string;
  localNote?: ReactNode;
  title: ReactNode;
};

export function SessionEmptyState({
  actionHref = "/session/start",
  actionLabel = "Plan my next pizza",
  body,
  eyebrow = "Pizza Session",
  localNote,
  title,
}: SessionEmptyStateProps) {
  return (
    <SessionRouteState
      action={{ href: actionHref, label: actionLabel }}
      body={body}
      eyebrow={eyebrow}
      localNote={localNote}
      title={title}
      variant="no-session"
    />
  );
}
