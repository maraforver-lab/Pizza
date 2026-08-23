"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cloudPizzaSessionCustomName,
  cloudPizzaSessionHistorySummary,
  normalizeCloudPizzaSessionHistoryRow,
  sortCloudPizzaSessionHistoryRows,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession } from "@/lib/pizza-session";

type AccountPizzaSessionHistoryProps = {
  enabled: boolean;
  className?: string;
  latestOnly?: boolean;
};

export function AccountPizzaSessionHistory({ enabled, className = "", latestOnly = false }: AccountPizzaSessionHistoryProps) {
  const [sessions, setSessions] = useState<CloudPizzaSessionRow[]>([]);
  const [ready, setReady] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null);
  const [titleError, setTitleError] = useState("");

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
        if (mounted) setSessions(sortCloudPizzaSessionHistoryRows(rows));
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

  const deleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    setDeleteError("");
    try {
      const response = await fetch(`/api/pizza-sessions/history/${sessionId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete pizza plan.");
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setConfirmingDeleteId(null);
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "Could not delete pizza plan.");
    } finally {
      setDeletingId(null);
    }
  };

  const saveSessionTitle = async (sessionId: string, title: string) => {
    setSavingTitleId(sessionId);
    setTitleError("");
    try {
      const response = await fetch(`/api/pizza-sessions/history/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: title }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update pizza plan title.");
      const nextSession = normalizeCloudPizzaSessionHistoryRow(payload.session);
      if (!nextSession) throw new Error("Could not update pizza plan title.");
      setSessions((current) => current.map((session) => (session.id === sessionId ? nextSession : session)));
      setEditingTitleId(null);
      setTitleDrafts((current) => ({ ...current, [sessionId]: cloudPizzaSessionCustomName(nextSession) ?? "" }));
    } catch (caught) {
      setTitleError(caught instanceof Error ? caught.message : "Could not update pizza plan title.");
    } finally {
      setSavingTitleId(null);
    }
  };

  if (!ready) {
    return (
      <section className={`rounded-[2rem] border border-ink/10 bg-white p-5 text-sm font-bold text-ink/45 shadow-card sm:p-7 ${className}`}>
        Loading pizza plan history…
      </section>
    );
  }

  const latestCompletedSession = sessions[0] ?? null;

  if (latestOnly) {
    return (
      <section className={`rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7 ${className}`} aria-labelledby="latest-pizza-plan-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Latest pizza plan</p>
            <h2 id="latest-pizza-plan-heading" className="mt-2 font-display text-3xl font-semibold">
              Latest pizza plan
            </h2>
          </div>
          {sessions.length > 1 && (
            <p className="text-xs font-bold leading-5 text-ink/45">
              Newest by original plan creation date.
            </p>
          )}
        </div>

        {!latestCompletedSession ? (
          <div className="mt-5 rounded-[1.5rem] border border-ink/10 bg-cream/65 p-4">
            <h3 className="text-base font-extrabold text-ink">No completed pizza plans yet</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">Finish and review a pizza plan to save it here.</p>
            <Link
              href="/session/start"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              Plan a pizza
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {(() => {
              const summary = cloudPizzaSessionHistorySummary(latestCompletedSession);
              const sessionData = migratePizzaSession(latestCompletedSession.session_data);
              const photo = sessionData?.photo?.url;

              return (
                <article className="overflow-hidden rounded-[1.75rem] border border-leaf/20 bg-leaf/[.08] shadow-sm">
                  <div className={`grid gap-0 ${photo ? "md:grid-cols-[minmax(0,1fr)_11rem]" : ""}`}>
                    <div className="min-w-0 p-4 sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="[overflow-wrap:anywhere] font-display text-3xl font-semibold leading-tight text-ink">{summary.title}</h3>
                          <p className="mt-1 [overflow-wrap:anywhere] text-sm font-extrabold leading-6 text-leaf">{summary.statusLine}</p>
                        </div>
                        <span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-extrabold text-ink/55 ring-1 ring-ink/10">
                          Latest
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 [overflow-wrap:anywhere] rounded-[1.25rem] border border-white/70 bg-white/80 p-4 text-sm leading-6 text-ink/65">
                        <p>{summary.doughLine}</p>
                        {summary.fermentationLine && <p>{summary.fermentationLine}</p>}
                        {summary.bakeProfileLine && <p>{summary.bakeProfileLine}</p>}
                        <p>{summary.bakeLine}</p>
                      </div>
                      <Link
                        href={`/account/pizza-sessions/${latestCompletedSession.id}`}
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
                      >
                        Open plan
                      </Link>
                    </div>
                    {photo && (
                      <div className="min-h-44 overflow-hidden border-t border-white/80 bg-white/75 md:border-l md:border-t-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt="Latest completed pizza plan thumbnail"
                          className="h-full max-h-64 w-full object-cover md:max-h-none"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })()}
            {sessions.length > 1 ? (
              <Link
                href="/account/pizza-sessions"
                className="inline-flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream/65 px-4 text-sm font-extrabold text-ink/70 transition hover:border-leaf/35 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                <span>View all pizza plans ({sessions.length})</span>
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={`rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-card sm:rounded-[2rem] sm:p-7 ${className}`} aria-labelledby="pizza-session-history-heading">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-leaf">Completed pizza plans</p>
          <h2 id="pizza-session-history-heading" className="mt-1.5 font-display text-2xl font-semibold sm:mt-2 sm:text-3xl">
            Pizza plan history
          </h2>
        </div>
        {sessions.length > 0 && (
          <p className="text-xs font-bold leading-5 text-ink/45 sm:text-right">
            Showing all retained completed pizza plans, newest first.
          </p>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="mt-5 rounded-[1.5rem] border border-ink/10 bg-cream/65 p-4">
          <h3 className="text-base font-extrabold text-ink">No completed pizza plans yet</h3>
          <p className="mt-2 text-sm leading-6 text-ink/60">Finish and review a pizza plan to save it here.</p>
        </div>
      ) : (
        <div id="account-pizza-session-history-list" className="mt-4 grid gap-2.5">
          {sessions.map((session) => {
            const summary = cloudPizzaSessionHistorySummary(session);
            const sessionData = migratePizzaSession(session.session_data);
            const photo = sessionData?.photo?.url;
            const compactDoughLine = summary.doughLine
              .replace("dough balls", "balls")
              .replace("each", "");
            const compactFermentationLine = summary.fermentationLine
              ?.replace(/^Fermentation:\s*/, "")
              .replace(" fermentation", "");
            const compactBakeProfileLine = summary.bakeProfileLine
              ?.replace("Oven: ", "");
            const isConfirmingDelete = confirmingDeleteId === session.id;
            const isDeleting = deletingId === session.id;
            const customTitle = cloudPizzaSessionCustomName(session);
            const isEditingTitle = editingTitleId === session.id;
            const isSavingTitle = savingTitleId === session.id;
            const titleDraft = titleDrafts[session.id] ?? customTitle ?? "";
            return (
              <article key={session.id} className="rounded-[1.25rem] border border-leaf/15 bg-leaf/[.06] p-3 shadow-sm sm:p-3.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="[overflow-wrap:anywhere] font-display text-xl font-semibold leading-tight text-ink sm:text-2xl">{summary.title}</h3>
                        <p className="mt-1 [overflow-wrap:anywhere] text-xs font-extrabold leading-5 text-leaf sm:text-sm">{summary.statusLine}</p>
                      </div>
                      <Link
                        href={`/account/pizza-sessions/${session.id}`}
                        aria-label={`View pizza plan: ${summary.title}`}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-ink px-3 text-xs font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                      >
                        View
                        <span className="sr-only"> pizza plan</span>
                      </Link>
                    </div>
                    {isEditingTitle && (
                      <form
                        className="mt-3 rounded-[1.1rem] border border-white/80 bg-white/85 p-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveSessionTitle(session.id, titleDraft);
                        }}
                      >
                        <label htmlFor={`pizza-session-title-${session.id}`} className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">
                          Pizza plan name
                        </label>
                        <input
                          id={`pizza-session-title-${session.id}`}
                          value={titleDraft}
                          onChange={(event) => setTitleDrafts((current) => ({ ...current, [session.id]: event.target.value }))}
                          maxLength={80}
                          placeholder="Friday pizza night"
                          className="mt-2 min-h-11 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf/35 focus:ring-2 focus:ring-leaf/20"
                        />
                        {titleError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{titleError}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={isSavingTitle}
                            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-ink px-4 text-xs font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSavingTitle ? "Saving…" : "Save name"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTitleId(null);
                              setTitleError("");
                              setTitleDrafts((current) => ({ ...current, [session.id]: customTitle ?? "" }));
                            }}
                            className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-xs font-extrabold text-ink/65 transition hover:border-ink/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
                          >
                            Cancel
                          </button>
                          {customTitle && (
                            <button
                              type="button"
                              onClick={() => saveSessionTitle(session.id, "")}
                              disabled={isSavingTitle}
                              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-tomato/15 bg-white px-4 text-xs font-extrabold text-tomato transition hover:border-tomato/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Remove name
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 [overflow-wrap:anywhere] text-sm leading-5 text-ink/65">
                      <p>{compactDoughLine}</p>
                      {compactFermentationLine && <p>{compactFermentationLine}</p>}
                      {compactBakeProfileLine && <p>{compactBakeProfileLine}</p>}
                    </div>
                  </div>
                  {photo && (
                    <div className="w-full shrink-0 overflow-hidden rounded-[1rem] border border-white/80 bg-white/75 shadow-sm sm:w-28">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt="Completed pizza plan thumbnail"
                        className="aspect-[4/3] w-full object-cover sm:aspect-square"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
                {isConfirmingDelete && (
                  <div className="mt-3 rounded-[1.1rem] border border-tomato/15 bg-white/85 p-3">
                    <h4 className="text-sm font-extrabold text-ink">Delete this pizza plan?</h4>
                    <p className="mt-2 text-sm leading-6 text-ink/60">
                      This removes the completed pizza plan from your account history. This cannot be undone.
                    </p>
                    {deleteError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{deleteError}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingDeleteId(null);
                          setDeleteError("");
                        }}
                        className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-xs font-extrabold text-ink/65 transition hover:border-ink/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSession(session.id)}
                        disabled={isDeleting}
                        className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-tomato px-4 text-xs font-extrabold text-white transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? "Deleting…" : "Delete pizza plan"}
                      </button>
                    </div>
                  </div>
                )}
                {!isConfirmingDelete && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDeleteId(session.id);
                        setDeleteError("");
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-tomato/15 bg-white px-3 text-xs font-extrabold text-tomato transition hover:border-tomato/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTitleId(session.id);
                        setTitleError("");
                        setTitleDrafts((current) => ({ ...current, [session.id]: customTitle ?? "" }));
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-ink/10 bg-white px-3 text-xs font-extrabold text-ink/65 transition hover:border-ink/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                    >
                      Edit name
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
