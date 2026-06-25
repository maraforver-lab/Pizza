"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import {
  type PizzaSession,
  type PizzaSessionTimelineStep,
  pizzaSessionRecipeQuery,
} from "@/lib/pizza-session";
import {
  completeKitchenTimelineStep,
  getKitchenModeState,
  getKitchenTaskInstruction,
  isMixDoughStep,
  recipeSnapshotIngredientLines,
} from "@/lib/pizza-session-kitchen";
import {
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";

function formatDateTime(value?: string) {
  if (!value) return "Time not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Time not set";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function stepKindLabel(step?: PizzaSessionTimelineStep) {
  if (!step?.kind) return "Task";
  return step.kind === "passive" ? "Passive step" : "Active task";
}

function levelWhy(session: PizzaSession, step?: PizzaSessionTimelineStep) {
  const instruction = getKitchenTaskInstruction(step);
  if (session.experienceLevel === "pizza_nerd") return instruction.pizzaNerdWhy;
  if (session.experienceLevel === "enthusiast") return instruction.enthusiastWhy;
  return instruction.beginnerWhy;
}

function MissingState({
  title,
  copy,
  href,
  action,
}: {
  title: string;
  copy: string;
  href: string;
  action: string;
}) {
  return (
    <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white/85 p-6 shadow-card sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Kitchen Mode</p>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-none">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-ink/60">{copy}</p>
        <p className="mt-4 rounded-2xl bg-cream p-4 text-xs leading-5 text-ink/50">
          {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, reminders, notifications or account sync are active.
        </p>
        <Link href={href} className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
          {action}
        </Link>
      </div>
    </main>
  );
}

export default function SessionKitchenPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    setSession(getActivePizzaSession() ?? null);
    setReady(true);
  }, []);

  const kitchenState = useMemo(() => getKitchenModeState(session ?? undefined), [session]);
  const recipeQuery = session ? pizzaSessionRecipeQuery(session) : "";

  if (!ready) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
          Loading Kitchen Mode from this browser…
        </div>
      </main>
    );
  }

  if (!session || !kitchenState.ok && kitchenState.missingReason === "no-session") {
    return (
      <MissingState
        title="No active session yet."
        copy="Start a Pizza Session first, then Kitchen Mode can guide you through the saved local timeline."
        href="/session/start"
        action="Start Pizza Session →"
      />
    );
  }

  if (!kitchenState.ok && kitchenState.missingReason === "missing-timeline") {
    return (
      <MissingState
        title="Create a timeline first."
        copy="Kitchen Mode needs a session timeline so it knows the next practical task."
        href="/session/timeline"
        action="Create session timeline →"
      />
    );
  }

  if (!kitchenState.ok) return null;

  const currentStep = kitchenState.currentStep;
  const instruction = getKitchenTaskInstruction(currentStep);
  const ingredients = recipeSnapshotIngredientLines(session.recipeSnapshot);
  const missingRecipeSnapshot = !session.recipeSnapshot;
  const progressText = currentStep
    ? `Step ${kitchenState.currentIndex + 1} of ${kitchenState.totalCount}`
    : `${kitchenState.doneCount} of ${kitchenState.totalCount} steps done`;
  const donePercent = kitchenState.totalCount > 0
    ? Math.round((kitchenState.doneCount / kitchenState.totalCount) * 100)
    : 0;

  const markDone = () => {
    if (!session || !currentStep) return;
    const updated = completeKitchenTimelineStep(session, currentStep.id);
    if (!updated) {
      setSaveMessage("Could not update this local session. Please refresh and try again.");
      return;
    }
    setSession(updated);
    setSaveMessage(`${currentStep.label} marked done. Progress saved in this browser.`);
  };

  const timerHref = recipeQuery ? `/timer?${recipeQuery}` : "/timer";

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <section
          aria-labelledby="kitchen-mode-heading"
          className="grid gap-5 rounded-[2rem] bg-ink p-6 text-white shadow-2xl sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#e8c98a]">Pizza Session kitchen mode</p>
            <h1 id="kitchen-mode-heading" className="mt-3 font-display text-5xl font-semibold leading-none sm:text-6xl">
              {currentStep ? "What to do now" : "Kitchen session complete"}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
              A calm, local step-by-step view of your session timeline. It saves progress in this browser only.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <GuidanceModeBadge level={session.experienceLevel} />
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                {progressText}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-extrabold text-white/70">
                {donePercent}% done
              </span>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-72 lg:grid-cols-1">
            <Link href="/session/timeline" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-extrabold text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]">
              Review timeline →
            </Link>
            <Link href="/session/shopping" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c98a]">
              Open shopping list →
            </Link>
          </div>
        </section>

        {saveMessage && (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-ink/60 shadow-sm" role="status">
            {saveMessage}
          </p>
        )}

        {missingRecipeSnapshot && (
          <section className="mt-5 rounded-[1.5rem] border border-tomato/15 bg-tomato/10 p-5">
            <h2 className="font-display text-2xl font-semibold">Dough plan details are missing.</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Kitchen Mode can still show your timeline tasks, but exact ingredient amounts need a saved recipe snapshot.
            </p>
            <Link href="/session/recipe" className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-white px-4 text-sm font-extrabold text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
              Review dough plan →
            </Link>
          </section>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_22rem]">
          <article className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-card sm:p-7">
            {currentStep ? (
              <>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">
                  {stepKindLabel(currentStep)} · {formatDateTime(currentStep.scheduledAt)}
                </p>
                <h2 className="mt-3 font-display text-5xl font-semibold leading-none">{currentStep.label}</h2>
                <p className="mt-4 text-lg font-bold leading-7 text-ink/75">{instruction.shortInstruction}</p>
                {currentStep.description && (
                  <p className="mt-3 text-sm leading-6 text-ink/55">{currentStep.description}</p>
                )}

                {isMixDoughStep(currentStep) && ingredients.length > 0 && (
                  <section className="mt-6 rounded-[1.5rem] bg-cream p-5">
                    <h3 className="font-display text-2xl font-semibold">Use these dough numbers</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {ingredients.map((line) => (
                        <div key={line.label} className="rounded-2xl bg-white p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{line.label}</p>
                          <p className="mt-1 text-2xl font-extrabold">{line.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-6 rounded-[1.5rem] bg-leaf/10 p-5">
                  <h3 className="font-display text-2xl font-semibold">Why this matters</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{levelWhy(session, currentStep)}</p>
                </section>

                {currentStep.quietHoursWarning && (
                  <p className="mt-5 rounded-2xl bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato">
                    Quiet-hours warning: {currentStep.quietHoursWarning}
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={markDone}
                    className="min-h-14 rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                  >
                    Mark done
                  </button>
                  {currentStep.id === "bake-pizza" ? (
                    <Link href={timerHref} className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                      Open baking timer →
                    </Link>
                  ) : currentStep.id === "review-result" ? (
                    <Link href="/session/review" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                      Review this bake →
                    </Link>
                  ) : (
                    <Link href="/session/timeline" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                      Review full timeline →
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">All steps done</p>
                <h2 className="mt-3 font-display text-5xl font-semibold leading-none">Nice bake.</h2>
                <p className="mt-4 text-sm leading-6 text-ink/60">
                  Your local session timeline is complete. Add a note while the result is still fresh.
                </p>
                <Link href="/session/review" className="mt-6 inline-flex min-h-14 items-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  Review this bake →
                </Link>
              </>
            )}
          </article>

          <aside className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Next task</p>
            {kitchenState.nextStep ? (
              <>
                <h2 className="mt-2 font-display text-3xl font-semibold">{kitchenState.nextStep.label}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  {formatDateTime(kitchenState.nextStep.scheduledAt)}
                </p>
                <p className="mt-3 rounded-2xl bg-cream p-4 text-sm leading-6 text-ink/65">
                  {getKitchenTaskInstruction(kitchenState.nextStep).shortInstruction}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm leading-6 text-ink/60">
                No later todo task is available. Finish the current step and review the result.
              </p>
            )}
            <p className="mt-5 rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50">
              {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, reminders, notifications, tracking or public sharing is active.
            </p>
            <div className="mt-4 grid gap-2">
              <Link href="/session/recipe" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Review dough plan
              </Link>
              <Link href="/session/shopping" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Open shopping list
              </Link>
              <Link href={recipeQuery ? `/?${recipeQuery}` : "/"} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Open full Calculator
              </Link>
            </div>
          </aside>
        </section>

        <footer className="mt-10 border-t border-ink/10 py-6"><AppSignature /></footer>
      </div>
    </main>
  );
}
