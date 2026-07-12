"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  completedPizzaSessionCustomTitle,
  cloudPizzaSessionHistorySummary,
  normalizeCloudPizzaSessionHistoryRow,
  sortCloudPizzaSessionHistoryRows,
  type CloudPizzaSessionRow,
} from "@/lib/cloud-pizza-sessions";
import { migratePizzaSession } from "@/lib/pizza-session";

type AccountPizzaSessionHistoryProps = {
  enabled: boolean;
};

export function AccountPizzaSessionHistory({ enabled }: AccountPizzaSessionHistoryProps) {
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

  const deleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    setDeleteError("");
    try {
      const response = await fetch(`/api/pizza-sessions/history/${sessionId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not delete pizza session.");
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setConfirmingDeleteId(null);
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : "Could not delete pizza session.");
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
        body: JSON.stringify({ title }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not update pizza session title.");
      const nextSession = normalizeCloudPizzaSessionHistoryRow(payload.session);
      if (!nextSession) throw new Error("Could not update pizza session title.");
      setSessions((current) => current.map((session) => (session.id === sessionId ? nextSession : session)));
      setEditingTitleId(null);
      setTitleDrafts((current) => ({ ...current, [sessionId]: completedPizzaSessionCustomTitle(nextSession) ?? "" }));
    } catch (caught) {
      setTitleError(caught instanceof Error ? caught.message : "Could not update pizza session title.");
    } finally {
      setSavingTitleId(null);
    }
  };

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
            const sessionData = migratePizzaSession(session.session_data);
            const photo = sessionData?.photo?.url;
            const isConfirmingDelete = confirmingDeleteId === session.id;
            const isDeleting = deletingId === session.id;
            const customTitle = completedPizzaSessionCustomTitle(session);
            const isEditingTitle = editingTitleId === session.id;
            const isSavingTitle = savingTitleId === session.id;
            const titleDraft = titleDrafts[session.id] ?? customTitle ?? "";
            return (
              <article key={session.id} className="rounded-[1.5rem] border border-leaf/15 bg-leaf/[.06] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="[overflow-wrap:anywhere] font-display text-2xl font-semibold text-ink">{summary.title}</h3>
                        <p className="mt-1 [overflow-wrap:anywhere] text-sm font-extrabold leading-6 text-leaf">{summary.statusLine}</p>
                      </div>
                      <span className="w-fit rounded-full bg-white px-3 py-2 text-xs font-extrabold text-ink/55 ring-1 ring-ink/10">
                        Read-only summary
                      </span>
                    </div>
                    {isEditingTitle && (
                      <form
                        className="mt-4 rounded-[1.25rem] border border-white/80 bg-white/85 p-4"
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveSessionTitle(session.id, titleDraft);
                        }}
                      >
                        <label htmlFor={`pizza-session-title-${session.id}`} className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">
                          Session title
                        </label>
                        <input
                          id={`pizza-session-title-${session.id}`}
                          value={titleDraft}
                          onChange={(event) => setTitleDrafts((current) => ({ ...current, [session.id]: event.target.value }))}
                          maxLength={80}
                          placeholder="Perjantain pizza-ilta"
                          className="mt-2 min-h-11 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm font-bold text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf/35 focus:ring-2 focus:ring-leaf/20"
                        />
                        {titleError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{titleError}</p>}
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <button
                            type="submit"
                            disabled={isSavingTitle}
                            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-ink px-4 text-xs font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSavingTitle ? "Saving…" : "Save title"}
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
                              Remove title
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                    <div className="mt-4 grid gap-2 [overflow-wrap:anywhere] rounded-[1.25rem] border border-white/70 bg-white/80 p-4 text-sm leading-6 text-ink/62">
                      <p>{summary.doughLine}</p>
                      {summary.hydrationLine && <p>{summary.hydrationLine}</p>}
                      {summary.fermentationLine && <p>{summary.fermentationLine}</p>}
                      {summary.reviewLine && <p>{summary.reviewLine}</p>}
                      <p>{summary.bakeLine}</p>
                      {summary.bakeProfileLine && <p>{summary.bakeProfileLine}</p>}
                    </div>
                  </div>
                  {photo && (
                    <div className="w-full shrink-0 overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/75 shadow-sm sm:w-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt="Completed pizza session thumbnail"
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
                {isConfirmingDelete && (
                  <div className="mt-4 rounded-[1.25rem] border border-tomato/15 bg-white/85 p-4">
                    <h4 className="text-sm font-extrabold text-ink">Delete this pizza session?</h4>
                    <p className="mt-2 text-sm leading-6 text-ink/60">
                      This removes the completed session from your account history. This cannot be undone.
                    </p>
                    {deleteError && <p role="alert" className="mt-3 text-sm font-extrabold text-tomato">{deleteError}</p>}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                        {isDeleting ? "Deleting…" : "Delete session"}
                      </button>
                    </div>
                  </div>
                )}
                {!isConfirmingDelete && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/account/pizza-sessions/${session.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-ink px-4 text-xs font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                    >
                      View session
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDeleteId(session.id);
                        setDeleteError("");
                      }}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-tomato/15 bg-white px-4 text-xs font-extrabold text-tomato transition hover:border-tomato/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
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
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-xs font-extrabold text-ink/65 transition hover:border-ink/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                    >
                      Edit title
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
