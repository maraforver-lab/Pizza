"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import type { PizzaSession } from "@/lib/pizza-session";
import {
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import {
  saveSessionReview,
} from "@/lib/pizza-session-review";

const ratingOptions = [
  { value: 1, label: "1 — Poor" },
  { value: 2, label: "2 — Okay" },
  { value: 3, label: "3 — Good" },
  { value: 4, label: "4 — Great" },
  { value: 5, label: "5 — Excellent" },
] as const;

const workedWellOptions = [
  "Great crust",
  "Good oven spring",
  "Nice chew",
  "Good flavour",
  "Right amount of toppings",
  "Good cheese melt",
  "Easy to handle dough",
  "Timing worked well",
] as const;

const improveOptions = [
  "More fermentation",
  "Less fermentation",
  "Higher hydration",
  "Lower hydration",
  "Hotter oven",
  "Less toppings",
  "More salt",
  "Thinner stretch",
] as const;

function selectionsFromSavedText(savedText: string | undefined, options: readonly string[]) {
  if (!savedText) return [];
  return options.filter((option) => savedText.split(/[;,]/).map((part) => part.trim()).includes(option));
}

function toggleSelection(current: string[], option: string) {
  return current.includes(option)
    ? current.filter((value) => value !== option)
    : [...current, option];
}

function FeedbackChipGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="block">
      <legend className="text-sm font-extrabold text-ink/70">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(toggleSelection(selected, option))}
              className={`min-h-11 rounded-full px-4 py-2 text-left text-xs font-extrabold ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                active
                  ? "bg-tomato text-white ring-tomato"
                  : "bg-cream text-ink/65 ring-ink/10 hover:bg-tomato/10 hover:text-tomato"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

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
  const [whatWorked, setWhatWorked] = useState<string[]>([]);
  const [improveNextTime, setImproveNextTime] = useState<string[]>([]);
  const [legacyWhatWorked, setLegacyWhatWorked] = useState("");
  const [legacyImproveNextTime, setLegacyImproveNextTime] = useState("");
  const [legacyNextTimeTry, setLegacyNextTimeTry] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en";
    const active = getActivePizzaSession() ?? null;
    setSession(active);
    setRating(active?.rating ?? 0);
    setNotes(active?.notes ?? "");
    setLegacyWhatWorked(active?.review?.whatWorked ?? "");
    setLegacyImproveNextTime(active?.review?.improveNextTime ?? "");
    setLegacyNextTimeTry(active?.review?.nextTimeTry ?? "");
    setWhatWorked(selectionsFromSavedText(active?.review?.whatWorked, workedWellOptions));
    setImproveNextTime(selectionsFromSavedText(active?.review?.improveNextTime, improveOptions));
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

  const reviewInput = {
    rating: rating || undefined,
    notes,
    whatWorked: whatWorked.length ? whatWorked.join("; ") : legacyWhatWorked,
    improveNextTime: improveNextTime.length ? improveNextTime.join("; ") : legacyImproveNextTime,
    nextTimeTry: legacyNextTimeTry,
  };

  const saveReview = () => {
    const updated = saveSessionReview(session, reviewInput);
    if (!updated) {
      setMessage("Could not save this local review. Please refresh and try again.");
      return;
    }
    setSession(updated);
    setSaved(true);
    setMessage(null);
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <SessionWorkspaceLayout activeStep={10} hideLocalSaveNote>
        <SessionStepHero
          step={10}
          label="Review"
          pageType="Learning page"
          title="Review your pizza"
          level={session.experienceLevel}
          hideMeta
        />

        {message && !saved && (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-ink/60 shadow-sm" role="status" aria-live="polite">
            {message}
          </p>
        )}

        <section className="mt-4 sm:mt-6">
          <section className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-7" aria-labelledby="review-form-heading">
            <h2 id="review-form-heading" className="sr-only">Review form</h2>
            <div>
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
              <FeedbackChipGroup
                label="What worked well?"
                options={workedWellOptions}
                selected={whatWorked}
                onChange={setWhatWorked}
              />
              <FeedbackChipGroup
                label="What would you improve?"
                options={improveOptions}
                selected={improveNextTime}
                onChange={setImproveNextTime}
              />
              <label className="block">
                <span className="text-sm font-extrabold text-ink/70">Free notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add any extra notes about dough feel, oven heat, toppings, timing or serving."
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
                <h3 id="after-save-heading" className="font-display text-3xl font-semibold">Review saved</h3>
                <p className="mt-2 text-sm font-bold text-leaf" role="status" aria-live="polite">
                  Review saved in this browser.
                </p>
                <div className="mt-4">
                  <Link href="/session/start" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-leaf px-4 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf">
                    Start a new Pizza Session →
                  </Link>
                </div>
              </section>
            )}
          </section>
        </section>
      </SessionWorkspaceLayout>
    </main>
  );
}
