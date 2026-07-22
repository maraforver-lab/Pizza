"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { SessionRouteState } from "@/components/session/SessionRouteState";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import type { PizzaSession } from "@/lib/pizza-session";
import {
  completeCloudBackedPizzaSession,
} from "@/lib/cloud-pizza-session-client";
import { resolveCanonicalActivePizzaSession } from "@/lib/canonical-active-pizza-session";
import {
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import {
  completeSessionReview,
} from "@/lib/pizza-session-review";
import {
  getPizzaSessionBakingTroubleshootingLink,
  getPizzaSessionToppingsTroubleshootingLink,
} from "@/lib/pizza-session-troubleshooting-links";

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

const bakingTroubleshootingLink = getPizzaSessionBakingTroubleshootingLink("Diagnose your pizza");
const toppingsTroubleshootingLink = getPizzaSessionToppingsTroubleshootingLink();

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

function sessionIsReviewable(session: PizzaSession) {
  if (session.currentStep === "review") return true;
  const actionableSteps = session.timeline?.steps.filter((step) => step.id !== "review-result") ?? [];
  return actionableSteps.length > 0 && actionableSteps.every((step) => step.status === "done" || step.status === "skipped");
}

function nearestReviewPrerequisiteHref(session: PizzaSession) {
  if (session.timeline?.steps.length) return "/session/kitchen";
  if (session.shoppingList) return "/session/timeline";
  if (session.recipeSnapshot) return "/session/shopping";
  return "/session/recipe";
}

function nearestReviewPrerequisiteLabel(session: PizzaSession) {
  const href = nearestReviewPrerequisiteHref(session);
  if (href === "/session/kitchen") return "Open Kitchen";
  if (href === "/session/timeline") return "Open Timeline";
  if (href === "/session/shopping") return "Open Shopping list";
  return "Open Dough Plan";
}

function MissingReviewState() {
  return (
    <SessionRouteState
      action={{ href: "/session/start", label: "Plan a pizza" }}
      body="Finish a pizza plan before opening its results and notes."
      eyebrow="Review"
      localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} Completed or archived pizza plans are not treated as active.`}
      title="Nothing to review yet"
      variant="no-session"
    />
  );
}

export default function SessionReviewPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [whatWorked, setWhatWorked] = useState<string[]>([]);
  const [improveNextTime, setImproveNextTime] = useState<string[]>([]);
  const [legacyWhatWorked, setLegacyWhatWorked] = useState("");
  const [legacyImproveNextTime, setLegacyImproveNextTime] = useState("");
  const [legacyNextTimeTry, setLegacyNextTimeTry] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [cloudCompletionRequired, setCloudCompletionRequired] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en";
    let mounted = true;
    async function openReview() {
      try {
        const canonical = await resolveCanonicalActivePizzaSession();
        if (!mounted) return;
        if (canonical.state === "error") {
          setRouteError(true);
          return;
        }
        const active = canonical.state === "active" ? canonical.session : getActivePizzaSession() ?? null;
      setSession(active);
      setCloudCompletionRequired(canonical.state === "active" && canonical.signedIn);
      setRating(active?.rating ?? 0);
      setNotes(active?.notes ?? "");
      setLegacyWhatWorked(active?.review?.whatWorked ?? "");
      setLegacyImproveNextTime(active?.review?.improveNextTime ?? "");
      setLegacyNextTimeTry(active?.review?.nextTimeTry ?? "");
      setWhatWorked(selectionsFromSavedText(active?.review?.whatWorked, workedWellOptions));
      setImproveNextTime(selectionsFromSavedText(active?.review?.improveNextTime, improveOptions));
      } catch {
        if (mounted) setRouteError(true);
      } finally {
        if (mounted) setReady(true);
      }
    }
    void openReview();
    return () => {
      mounted = false;
    };
  }, []);

  if (routeError) {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Plan a pizza" }}
        body="Something interrupted the local session check. Try again, or start a fresh pizza plan."
        eyebrow="Review"
        onRetry={() => window.location.reload()}
        title="We couldn’t open your review."
        variant="error"
      />
    );
  }

  if (!ready) {
    return (
      <SessionRouteState
        body="Checking this browser for an active pizza plan before opening results and notes."
        eyebrow="Review"
        title="Opening your review"
        variant="checking"
      />
    );
  }

  if (!session) return <MissingReviewState />;

  if (!sessionIsReviewable(session)) {
    return (
      <SessionRouteState
        action={{
          href: nearestReviewPrerequisiteHref(session),
          label: nearestReviewPrerequisiteLabel(session),
        }}
        body="Finish your pizza plan before opening its results and notes."
        eyebrow="Review"
        title="Nothing to review yet"
        variant="step-unavailable"
      />
    );
  }

  const reviewInput = {
    rating: rating || undefined,
    notes,
    whatWorked: whatWorked.length ? whatWorked.join("; ") : legacyWhatWorked,
    improveNextTime: improveNextTime.length ? improveNextTime.join("; ") : legacyImproveNextTime,
    nextTimeTry: legacyNextTimeTry,
  };

  const saveReview = async () => {
    if (saving) return;
    setSaving(true);
    let sessionForCompletion = session;
    let mustCompleteCloud = cloudCompletionRequired;
    if (session.status !== "completed") {
      const canonical = await resolveCanonicalActivePizzaSession();
      if (canonical.state === "error") {
        setSaving(false);
        setMessage("Could not verify your account session. Please try again before finishing.");
        return;
      }
      if (canonical.state === "active" && canonical.session.id !== session.id) {
        setSession(canonical.session);
        setCloudCompletionRequired(canonical.signedIn);
        setSaving(false);
        setMessage("Your active pizza plan changed. Review the current pizza plan before finishing.");
        return;
      }
      if (canonical.state !== "active") {
        setSaving(false);
        setMessage("Could not find the active pizza plan to finish.");
        return;
      }
      sessionForCompletion = canonical.session;
      mustCompleteCloud = canonical.signedIn;
      setCloudCompletionRequired(mustCompleteCloud);
    }

    const completed = completeSessionReview(sessionForCompletion, reviewInput);
    if (!completed) {
      setSaving(false);
      setMessage("Could not save this review. Please refresh and try again.");
      return;
    }
    setSession(completed);
    setMessage(null);
    if (mustCompleteCloud) {
      try {
        const cloudResult = await completeCloudBackedPizzaSession(completed);
        if ("skipped" in cloudResult) {
          throw new Error("Account session completion was skipped.");
        }
      } catch {
        setSaving(false);
        setMessage("Your review is saved in this browser, but account history could not be updated yet. Try finishing again.");
        return;
      }
    }
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      {session.status !== "completed" && <CloudPizzaSessionSync session={session} />}
      <SessionWorkspaceLayout activeStep={10} hideLocalSaveNote>
        <SessionStepHero
          step={10}
          label="Review"
          pageType="Learning page"
          title="Review your pizza"
          level={session.experienceLevel}
          levelCompactOnMobile
          hideMeta
        />

        {message && (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-ink/60 shadow-sm" role="status" aria-live="polite">
            {message}
          </p>
        )}

        <section className="mt-4 sm:mt-6">
          <section className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-7" aria-labelledby="review-form-heading">
            <h2 id="review-form-heading" className="sr-only">Review form</h2>
            <section className="mb-5 hidden rounded-[1.25rem] border border-leaf/15 bg-leaf/[.06] p-4 sm:mb-6 sm:block" aria-labelledby="review-photo-sharing-heading">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">After saving</p>
              <h3 id="review-photo-sharing-heading" className="mt-2 font-display text-2xl font-semibold">Add a pizza photo and share your bake</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
                If you’re signed in, you can also save a finished pizza photo as a memory after this review. DoughTools can create a share image with your bake and preparation parameters, so you can share the result with your network.
              </p>
            </section>

            <section className="mb-5 hidden rounded-[1.25rem] border border-ink/10 bg-cream/70 p-4 sm:mb-6 sm:block" aria-labelledby="review-troubleshooting-heading">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Did something go wrong?</p>
              <h3 id="review-troubleshooting-heading" className="mt-2 font-display text-2xl font-semibold">Diagnose your pizza</h3>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href={bakingTroubleshootingLink.href}
                  aria-label={bakingTroubleshootingLink.ariaLabel}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  {bakingTroubleshootingLink.label}
                </Link>
                <Link
                  href={toppingsTroubleshootingLink.href}
                  aria-label={toppingsTroubleshootingLink.ariaLabel}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                >
                  {toppingsTroubleshootingLink.label}
                </Link>
              </div>
            </section>

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

            <details className="mt-5 rounded-[1.25rem] border border-leaf/15 bg-leaf/[.06] p-4 sm:hidden">
              <summary className="cursor-pointer list-none text-sm font-extrabold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Add a photo and share
              </summary>
              <p className="mt-2 text-sm font-bold leading-6 text-ink/60">
                Save and share your finished pizza after the review.
              </p>
              <p className="mt-2 text-xs font-bold leading-5 text-ink/50">
                If you’re signed in, your finished pizza photo can be saved as a memory after this review, and DoughTools can create a share image with your bake details.
              </p>
            </details>

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
                  disabled={saving}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:opacity-60 sm:w-auto"
                >
                  {saving ? "Finishing and reviewing…" : "Finish and review"}
                </button>
              )}
            />
          </section>
        </section>
      </SessionWorkspaceLayout>
    </main>
  );
}
