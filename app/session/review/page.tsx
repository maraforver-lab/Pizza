"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import type { PizzaSession } from "@/lib/pizza-session";
import {
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import {
  completeSessionReview,
  getSessionReviewCopy,
  saveSessionReview,
  SESSION_REVIEW_LOCAL_ONLY_COPY,
  sessionSummaryLines,
} from "@/lib/pizza-session-review";

function formatMaybeDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MissingReviewState() {
  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/85 p-6 shadow-card sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Session review</p>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-none">No active session to review.</h1>
        <p className="mt-4 text-sm leading-6 text-ink/60">
          Start a Pizza Session first, then come back here after Kitchen Mode to save what happened.
        </p>
        <p className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-5 text-ink/50">
          {PIZZA_SESSION_LOCAL_ONLY_COPY} Completed or archived sessions are not treated as active.
        </p>
        <Link href="/session/start" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
          Start Pizza Session →
        </Link>
      </div>
    </main>
  );
}

export default function SessionReviewPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [improveNextTime, setImproveNextTime] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en";
    const active = getActivePizzaSession() ?? null;
    setSession(active);
    setRating(active?.rating ?? 0);
    setNotes(active?.notes ?? "");
    setWhatWorked(active?.review?.whatWorked ?? "");
    setImproveNextTime(active?.review?.improveNextTime ?? "");
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
          Loading review from this browser…
        </div>
      </main>
    );
  }

  if (!session) return <MissingReviewState />;

  const copy = getSessionReviewCopy(session.experienceLevel);
  const summary = sessionSummaryLines(session);
  const reviewInput = { rating: rating || undefined, notes, whatWorked, improveNextTime };

  const saveReview = () => {
    const updated = saveSessionReview(session, reviewInput);
    if (!updated) {
      setMessage("Could not save this local review. Please refresh and try again.");
      return;
    }
    setSession(updated);
    setMessage("Review saved locally in this browser.");
  };

  const completeReview = () => {
    const updated = completeSessionReview(session, reviewInput);
    if (!updated) {
      setMessage("Could not complete this local session. Please refresh and try again.");
      return;
    }
    setSession(updated);
    setCompleted(true);
    setMessage("Session completed. Your review was saved locally.");
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <section
          aria-labelledby="session-review-heading"
          className="grid gap-5 rounded-[2rem] bg-ink p-6 text-white shadow-2xl sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#e8c98a]">Pizza Session review</p>
            <h1 id="session-review-heading" className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">
              {completed || session.status === "completed" ? "Session completed" : "Review this bake"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
              Save what happened, what worked and what you want to change next time.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <GuidanceModeBadge level={session.experienceLevel} />
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                {SESSION_REVIEW_LOCAL_ONLY_COPY}
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
            <Link href="/session/kitchen" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-extrabold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]">
              Open Kitchen Mode →
            </Link>
            <Link href="/journal" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]">
              Open Journal →
            </Link>
          </div>
        </section>

        {message && (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-ink/60 shadow-sm" role="status">
            {message}
          </p>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-[22rem_1fr]">
          <aside className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Session summary</p>
            <dl className="mt-4 grid gap-3">
              {summary.map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-cream p-4">
                  <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{label}</dt>
                  <dd className="mt-1 text-sm font-bold text-ink/70">{label.includes("time") ? formatMaybeDate(value) : value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50">
              No cloud sync, account sync, public sharing, result cards or photo upload are active in this review step.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/session/recipe" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Review dough plan
              </Link>
              <Link href="/session/timeline" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Review timeline
              </Link>
            </div>
          </aside>

          <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-card sm:p-7" aria-labelledby="review-form-heading">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Local bake notes</p>
            <h2 id="review-form-heading" className="mt-2 font-display text-4xl font-semibold">{copy.heading}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/60">{copy.intro}</p>

            <div className="mt-6">
              <p id="rating-label" className="text-sm font-extrabold text-ink/70">Rate this bake</p>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="rating-label">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = rating === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      aria-label={`Rate this bake ${value} out of 5`}
                      onClick={() => setRating(value)}
                      className={`min-h-12 rounded-2xl px-4 text-sm font-extrabold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                        active ? "bg-tomato text-white ring-tomato" : "bg-cream text-ink/65 ring-ink/10"
                      }`}
                    >
                      {value} / 5
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="block">
                <span className="text-sm font-extrabold text-ink/70">What worked?</span>
                <textarea
                  value={whatWorked}
                  onChange={(event) => setWhatWorked(event.target.value)}
                  placeholder={copy.whatWorkedPlaceholder}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-ink/10 bg-cream p-4 text-sm leading-6 outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
                />
              </label>
              <label className="block">
                <span className="text-sm font-extrabold text-ink/70">What would you improve next time?</span>
                <textarea
                  value={improveNextTime}
                  onChange={(event) => setImproveNextTime(event.target.value)}
                  placeholder={copy.improvePlaceholder}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-ink/10 bg-cream p-4 text-sm leading-6 outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
                />
              </label>
              <label className="block">
                <span className="text-sm font-extrabold text-ink/70">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={copy.notesPlaceholder}
                  className="mt-2 min-h-28 w-full rounded-2xl border border-ink/10 bg-cream p-4 text-sm leading-6 outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={saveReview}
                disabled={completed || session.status === "completed"}
                className="min-h-14 rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:opacity-50"
              >
                Save review
              </button>
              <button
                type="button"
                onClick={completeReview}
                disabled={completed || session.status === "completed"}
                className="min-h-14 rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:opacity-50"
              >
                Complete session
              </button>
            </div>

            {(completed || session.status === "completed") && (
              <section className="mt-6 rounded-[1.5rem] bg-leaf/10 p-5" aria-labelledby="completed-session-heading">
                <h3 id="completed-session-heading" className="font-display text-3xl font-semibold">Session completed</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Your rating and notes were saved locally. This session will no longer appear as the active Continue Session card.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link href="/session/start" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-4 text-sm font-extrabold text-leaf focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                    Start a new Pizza Session →
                  </Link>
                  <Link href="/journal" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-sm font-extrabold text-leaf focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                    Open Journal →
                  </Link>
                  <Link href="/account" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-sm font-extrabold text-leaf focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                    Open My Pizzas →
                  </Link>
                  <Link href="/session/recipe" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-sm font-extrabold text-leaf focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                    Review dough plan →
                  </Link>
                </div>
              </section>
            )}
          </section>
        </section>

        <footer className="mt-10 border-t border-ink/10 py-6"><AppSignature /></footer>
      </div>
    </main>
  );
}
