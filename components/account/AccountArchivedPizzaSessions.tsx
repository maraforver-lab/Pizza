"use client";

import { useEffect, useState } from "react";
import {
  cloudPizzaSessionArchivedSummary,
  normalizeCloudPizzaSessionArchivedRow,
  sortCloudPizzaSessionArchivedRows,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";

type AccountArchivedPizzaSessionsProps = {
  enabled: boolean;
  className?: string;
};

const ACCOUNT_ARCHIVED_COLLAPSED_LIMIT = 2;

export function AccountArchivedPizzaSessions({ enabled, className = "" }: AccountArchivedPizzaSessionsProps) {
  const [sessions, setSessions] = useState<CloudPizzaSessionRow[]>([]);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedDetailsId, setExpandedDetailsId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSessions([]);
      setReady(false);
      setExpanded(false);
      setExpandedDetailsId(null);
      return;
    }

    let mounted = true;
    async function loadArchivedSessions() {
      try {
        const response = await fetch("/api/pizza-sessions/archived", { method: "GET" });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        const rows = Array.isArray(payload.sessions)
          ? payload.sessions.flatMap((item: unknown) => {
            const row = normalizeCloudPizzaSessionArchivedRow(item);
            return row ? [row] : [];
          })
          : [];
        if (mounted) setSessions(sortCloudPizzaSessionArchivedRows(rows));
      } catch {
        if (mounted) setSessions([]);
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadArchivedSessions();
    return () => {
      mounted = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (sessions.length <= ACCOUNT_ARCHIVED_COLLAPSED_LIMIT) setExpanded(false);
  }, [sessions.length]);

  if (!enabled || !ready || sessions.length === 0) return null;

  const visibleSessions = expanded ? sessions : sessions.slice(0, ACCOUNT_ARCHIVED_COLLAPSED_LIMIT);
  const hiddenSessionCount = Math.max(0, sessions.length - ACCOUNT_ARCHIVED_COLLAPSED_LIMIT);
  const hasMoreSessions = hiddenSessionCount > 0;

  return (
    <section className={`rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7 ${className}`} aria-labelledby="archived-pizza-sessions-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">Archived sessions</p>
          <h2 id="archived-pizza-sessions-heading" className="mt-2 font-display text-3xl font-semibold">
            Archived pizza sessions
          </h2>
        </div>
        <p className="text-xs font-bold leading-5 text-ink/45">
          Unfinished sessions kept when a new pizza becomes active.
        </p>
      </div>

      <div id="account-archived-pizza-session-list" className="mt-5 grid gap-3">
        {visibleSessions.map((session) => {
          const summary = cloudPizzaSessionArchivedSummary(session);
          const detailsOpen = expandedDetailsId === session.id;
          return (
            <article key={session.id} className="rounded-[1.5rem] border border-ink/10 bg-cream/60 p-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <h3 className="[overflow-wrap:anywhere] font-display text-2xl font-semibold text-ink">{summary.title}</h3>
                  <p className="mt-1 text-sm font-extrabold leading-6 text-ink/55">{summary.archivedLine}</p>
                  <div className="mt-3 grid gap-1 text-sm leading-6 text-ink/62">
                    <p>{summary.doughLine}</p>
                    <p>{summary.bakeLine}</p>
                    <p>{summary.stepLine}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedDetailsId((current) => current === session.id ? null : session.id)}
                  aria-expanded={detailsOpen}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-xs font-extrabold text-ink/65 transition hover:border-ink/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  View session details
                </button>
              </div>
              {detailsOpen && (
                <div className="mt-4 rounded-[1.25rem] border border-white/80 bg-white/80 p-4 text-sm leading-6 text-ink/62">
                  <p>{summary.pizzaMenuLine}</p>
                  <p>{summary.doughLine}</p>
                  <p>{summary.bakeLine}</p>
                  <p>{summary.stepLine}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-ink/45">
                    Archived sessions are read-only in this version. Start a new pizza or continue the current active session from Account.
                  </p>
                </div>
              )}
            </article>
          );
        })}
        {hasMoreSessions && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="account-archived-pizza-session-list"
            onClick={() => setExpanded((current) => !current)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-cream/65 px-4 text-sm font-extrabold text-ink/70 transition hover:border-leaf/35 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {expanded ? "Show fewer archived sessions" : `Show ${hiddenSessionCount} more archived sessions`}
          </button>
        )}
      </div>
    </section>
  );
}
