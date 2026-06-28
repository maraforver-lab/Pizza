"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionLocalOnlyNote } from "@/components/session/SessionLocalOnlyNote";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import type { PizzaSession } from "@/lib/pizza-session";
import {
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import {
  getSessionReviewCopy,
  saveSessionReview,
  SESSION_REVIEW_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-review";

const ratingOptions = [
  { value: 1, label: "1 — Poor" },
  { value: 2, label: "2 — Okay" },
  { value: 3, label: "3 — Good" },
  { value: 4, label: "4 — Great" },
  { value: 5, label: "5 — Excellent" },
] as const;

function MissingReviewState() {
  return (
    <SessionEmptyState
      eyebrow="Pizza Session review"
      title="No pizza session to review"
      body="Start a Pizza Session first."
      localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} Completed or archived sessions are not treated as active.`}
    />
  );
}

export default function SessionReviewPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [improveNextTime, setImproveNextTime] = useState("");
  const [nextTimeTry, setNextTimeTry] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en";
    const active = getActivePizzaSession() ?? null;
    setSession(active);
    setRating(active?.rating ?? 0);
    setNotes(active?.notes ?? "");
    setWhatWorked(active?.review?.whatWorked ?? "");
    setImproveNextTime(active?.review?.improveNextTime ?? "");
    setNextTimeTry(active?.review?.nextTimeTry ?? "");
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
  const reviewInput = {
    rating: rating || undefined,
    notes,
    whatWorked,
    improveNextTime,
    nextTimeTry,
  };

  const saveReview = () => {
    const updated = saveSessionReview(session, reviewInput);
    if (!updated) {
      setMessage("Could not save this local review. Please refresh and try again.");
      return;
    }
    setSession(updated);
    setSaved(true);
    setMessage("Review saved in this browser.");
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <SessionWorkspaceLayout activeStep={10}>
        <SessionStepHero
          step={10}
          label="Review"
          pageType="Learning page"
          title="Review your pizza"
          body="Save what worked and what you want to improve next time."
          level={session.experienceLevel}
          desktopAside={(
            <>
              <strong className="block text-ink">Step 10: Review</strong>
              Finish the session by saving what worked and what to try next time.
            </>
          )}
        />

        {message && (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-ink/60 shadow-sm" role="status" aria-live="polite">
            {message}
          </p>
        )}

        <section className="mt-4 sm:mt-6">
          <section className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-7" aria-labelledby="review-form-heading">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Review and notes</p>
            <h2 id="review-form-heading" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{copy.heading}</h2>
            <p className="mt-2 text-xs leading-5 text-ink/60 sm:mt-3 sm:text-sm sm:leading-6">
              How did your pizza turn out? {copy.intro}
            </p>

            <div className="mt-6">
              <p id="rating-label" className="text-sm font-extrabold text-ink/70">Overall result</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5" role="group" aria-labelledby="rating-label">
                {ratingOptions.map((option) => {
                  const active = rating === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      aria-label={`Overall result: ${option.label}`}
                      onClick={() => setRating(option.value)}
                      className={`min-h-12 rounded-2xl px-4 text-sm font-extrabold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                        active ? "bg-tomato text-white ring-tomato" : "bg-cream text-ink/65 ring-ink/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5">
              <label className="block">
                <span className="text-sm font-extrabold text-ink/70">What worked well?</span>
                <textarea
                  value={whatWorked}
                  onChange={(event) => setWhatWorked(event.target.value)}
                  placeholder={copy.whatWorkedPlaceholder}
                  className="mt-2 min-h-20 w-full rounded-2xl border border-ink/10 bg-cream p-3.5 text-sm leading-6 outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10 sm:min-h-28 sm:p-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-extrabold text-ink/70">What would you improve?</span>
                <textarea
                  value={improveNextTime}
                  onChange={(event) => setImproveNextTime(event.target.value)}
                  placeholder={copy.improvePlaceholder}
                  className="mt-2 min-h-20 w-full rounded-2xl border border-ink/10 bg-cream p-3.5 text-sm leading-6 outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10 sm:min-h-28 sm:p-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-extrabold text-ink/70">Next time I want to try…</span>
                <textarea
                  value={nextTimeTry}
                  onChange={(event) => setNextTimeTry(event.target.value)}
                  placeholder={copy.nextTimeTryPlaceholder}
                  className="mt-2 min-h-20 w-full rounded-2xl border border-ink/10 bg-cream p-3.5 text-sm leading-6 outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10 sm:min-h-24 sm:p-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-extrabold text-ink/70">Free notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={copy.notesPlaceholder}
                  className="mt-2 min-h-20 w-full rounded-2xl border border-ink/10 bg-cream p-3.5 text-sm leading-6 outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10 sm:min-h-28 sm:p-4"
                />
              </label>
            </div>

            {!saved && (
              <BottomActionBar
                back={(
                  <Link href="/session/kitchen" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
                    Back
                  </Link>
                )}
                primary={(
                  <button
                    type="button"
                    onClick={saveReview}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
                  >
                    Save review →
                  </button>
                )}
              />
            )}

            {saved && (
              <section className="mt-6 rounded-[1.5rem] bg-leaf/10 p-5" aria-labelledby="after-save-heading">
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Saved locally</p>
                <h3 id="after-save-heading" className="mt-2 font-display text-3xl font-semibold">Review saved</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Your notes are saved in this browser.
                </p>
                <p className="mt-2 text-sm font-bold text-leaf" role="status" aria-live="polite">
                  Review saved in this browser.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <Link href="/session/start" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-leaf px-4 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                    Start a new Pizza Session →
                  </Link>
                  <Link href="/session/kitchen" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-sm font-extrabold text-leaf focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                    Back to Kitchen Mode
                  </Link>
                  <Link href="/session/timeline" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-leaf/20 bg-white px-4 text-sm font-extrabold text-leaf focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                    View timeline
                  </Link>
                </div>
              </section>
            )}

            <SessionLocalOnlyNote>
              {SESSION_REVIEW_LOCAL_ONLY_COPY} No photo upload, social sharing, cloud sync, account sync or public result page is active.
            </SessionLocalOnlyNote>
          </section>
        </section>
      </SessionWorkspaceLayout>
    </main>
  );
}
