"use client";

import { useEffect, useState } from "react";
import {
  cloudPizzaSessionHistorySummary,
  normalizeCloudPizzaSessionHistoryRow,
  sortCloudPizzaSessionHistoryRows,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";

type AccountPizzaSessionHistoryProps = {
  enabled: boolean;
};

export function AccountPizzaSessionHistory({ enabled }: AccountPizzaSessionHistoryProps) {
  const [sessions, setSessions] = useState<CloudPizzaSessionRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSessions([]);
      setReady(false);
      return;
    }

    let mounted = true;
    async function loadCompletedSessions() {
      try {
        const response = await fetch("/api/pizza-sessions/history", { method: "GET" });
        if (!response.ok) return;
        const payload = await response.json().catch(() => ({}));
        const rows = Array.isArray(payload.sessions)
          ? payload.sessions.flatMap((item: unknown) => {
            const row = normalizeCloudPizzaSessionHistoryRow(item);
            return row ? [row] : [];
          })
          : [];
        if (mounted) setSessions(sortCloudPizzaSessionHistoryRows(rows).slice(0, 5));
      } catch {
        if (mounted) setSessions([]);
      } finally {
        if (mounted) setReady(true);
      }
    }

    loadCompletedSessions();
    return () => {
      mounted = false;
    };
  }, [enabled]);

  if (!enabled) return null;

  if (!ready) {
    return (
      <section className="my-8 rounded-[2rem] border border-ink/10 bg-white p-5 text-sm font-bold text-ink/45 shadow-card sm:p-7">
        Loading pizza session history…
      </section>
    );
  }

  return (
    <section className="my-8 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7" aria-labelledby="pizza-session-history-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Completed sessions</p>
          <h2 id="pizza-session-history-heading" className="mt-2 font-display text-3xl font-semibold">
            Pizza session history
          </h2>
        </div>
        {sessions.length > 0 && (
          <p className="text-xs font-bold leading-5 text-ink/45">Showing your latest completed sessions.</p>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-ink/10 bg-cream/65 p-4">
          <h3 className="text-base font-extrabold text-ink">No completed pizza sessions yet</h3>
          <p className="mt-2 text-sm leading-6 text-ink/60">Finish a Pizza Session to save it here.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {sessions.map((session) => {
            const summary = cloudPizzaSessionHistorySummary(session);
            return (
              <article key={session.id} className="rounded-[1.5rem] border border-leaf/15 bg-leaf/[.06] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-ink">{summary.title}</h3>
                    <p className="mt-1 text-sm font-extrabold leading-6 text-leaf">{summary.statusLine}</p>
                  </div>
                  <span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-extrabold text-ink/55 ring-1 ring-ink/10">
                    Read-only summary
                  </span>
                </div>
                <div className="mt-4 grid gap-2 rounded-[1.25rem] border border-white/70 bg-white/80 p-4 text-sm leading-6 text-ink/62">
                  <p>{summary.doughLine}</p>
                  {summary.hydrationLine && <p>{summary.hydrationLine}</p>}
                  {summary.fermentationLine && <p>{summary.fermentationLine}</p>}
                  {summary.reviewLine && <p>{summary.reviewLine}</p>}
                  <p>{summary.bakeLine}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
