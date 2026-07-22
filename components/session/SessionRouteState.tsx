"use client";

import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { SessionLocalOnlyNote } from "@/components/session/SessionLocalOnlyNote";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";

export const SESSION_ROUTE_STATE_KINDS = [
  "checking",
  "active",
  "no-session",
  "recoverable",
  "error",
  "step-unavailable",
] as const;

export type SessionRouteStateKind = typeof SESSION_ROUTE_STATE_KINDS[number];

type SessionRouteAction = {
  href: string;
  label: string;
};

type SessionRouteStateProps = {
  action?: SessionRouteAction;
  body: ReactNode;
  eyebrow?: string;
  localNote?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: SessionRouteAction;
  title: ReactNode;
  variant: Exclude<SessionRouteStateKind, "active">;
};

const iconByVariant: Record<Exclude<SessionRouteStateKind, "active">, DoughToolsIconName> = {
  checking: "timer",
  error: "warning",
  "no-session": "pizza",
  recoverable: "restore",
  "step-unavailable": "timeline",
};

function primaryActionClass() {
  return "inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato";
}

function secondaryActionClass() {
  return "inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato";
}

export function SessionRouteState({
  action,
  body,
  eyebrow = "Pizza plan",
  localNote,
  onRetry,
  retryLabel = "Try again",
  secondaryAction,
  title,
  variant,
}: SessionRouteStateProps) {
  const isChecking = variant === "checking";
  const isError = variant === "error";
  const showSecondaryAction = Boolean(secondaryAction && secondaryAction.href !== action?.href);

  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
      <Suspense fallback={null}>
        <SessionViewportReset />
      </Suspense>
      <section
        aria-busy={isChecking ? true : undefined}
        aria-live={isChecking ? "polite" : undefined}
        role={isChecking ? "status" : isError ? "alert" : undefined}
        className="mx-auto max-w-3xl rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-card sm:rounded-[2rem] sm:p-8"
      >
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cream text-tomato ring-1 ring-ink/5" aria-hidden="true">
          <DoughToolsIcon name={iconByVariant[variant]} size={24} strokeWidth={2.1} />
        </span>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-ink/60">{body}</p>
        {localNote && <SessionLocalOnlyNote>{localNote}</SessionLocalOnlyNote>}
        {!isChecking && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {action && (
              <Link href={action.href} className={primaryActionClass()}>
                {action.label}
              </Link>
            )}
            {isError && onRetry && (
              <button type="button" onClick={onRetry} className={secondaryActionClass()}>
                {retryLabel}
              </button>
            )}
            {showSecondaryAction && secondaryAction && (
              <Link href={secondaryAction.href} className={secondaryActionClass()}>
                {secondaryAction.label}
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
