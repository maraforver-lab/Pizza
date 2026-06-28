"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomActionBar, StatusPill } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionLocalOnlyNote } from "@/components/session/SessionLocalOnlyNote";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import {
  type PizzaSession,
  type PizzaSessionTimelineStep,
} from "@/lib/pizza-session";
import {
  completeKitchenTimelineStep,
  doughKitchenIngredientLines,
  getKitchenModeForStep,
  getKitchenModeState,
  getKitchenTaskInstruction,
  isMixDoughStep,
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function relativeFromTarget(stepTime?: string, targetTime?: string) {
  if (!stepTime || !targetTime) return "Timing guide";
  const step = new Date(stepTime);
  const target = new Date(targetTime);
  if (!Number.isFinite(step.getTime()) || !Number.isFinite(target.getTime())) return "Timing guide";
  const diffMinutes = Math.round((step.getTime() - target.getTime()) / 60_000);
  if (diffMinutes === 0) return "Target time";
  const abs = Math.abs(diffMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const parts = [
    hours ? `${hours}h` : "",
    minutes ? `${minutes}m` : "",
  ].filter(Boolean).join(" ");
  return `${parts || "0m"} ${diffMinutes < 0 ? "before" : "after"} target`;
}

function levelWhy(session: PizzaSession, step?: PizzaSessionTimelineStep) {
  const instruction = getKitchenTaskInstruction(step);
  if (session.experienceLevel === "pizza_nerd") return instruction.pizzaNerdWhy;
  if (session.experienceLevel === "enthusiast") return instruction.enthusiastWhy;
  return instruction.beginnerWhy;
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
      <SessionEmptyState
        eyebrow="Kitchen Mode"
        title="No active pizza session"
        body="Start a Pizza Session first, then Kitchen Mode will guide you through the next step."
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, reminders, notifications or account sync are active.`}
      />
    );
  }

  if (!kitchenState.ok && kitchenState.missingReason === "missing-timeline") {
    return (
      <SessionEmptyState
        eyebrow="Kitchen Mode"
        title="Create a timeline first."
        body="Kitchen Mode needs a session timeline so it knows the next practical task."
        actionHref="/session/timeline"
        actionLabel="Create session timeline →"
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, reminders, notifications or account sync are active.`}
      />
    );
  }

  if (!kitchenState.ok) return null;

  const currentStep = kitchenState.currentStep;
  const kitchenMode = getKitchenModeForStep(currentStep);
  const instruction = getKitchenTaskInstruction(currentStep);
  const ingredients = doughKitchenIngredientLines(session.recipeSnapshot);
  const targetTime = session.timeline?.targetEatTime ?? session.targetEatTime ?? session.targetBakeTime;
  const modeEyebrow = kitchenMode === "service" ? "Pizza Service Mode" : "Dough Kitchen Mode";
  const progressText = currentStep
    ? `Step ${kitchenState.currentIndex + 1} of ${kitchenState.totalCount}`
    : `${kitchenState.doneCount} of ${kitchenState.totalCount} steps done`;
  const donePercent = kitchenState.totalCount > 0
    ? Math.round((kitchenState.doneCount / kitchenState.totalCount) * 100)
    : 0;
  const heroProgressText = currentStep ? progressText : "All kitchen steps done";
  const heroDoneText = currentStep ? `${donePercent}% done` : "Ready for review";
  const pizzaCount = session.pizzaCount ?? session.recipeSnapshot?.balls;

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

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <SessionWorkspaceLayout activeStep={9}>
        <SessionStepHero
          step={9}
          label="Kitchen Mode"
          pageType="Execution page"
          title="Kitchen Mode"
          body="Follow one step at a time."
          level={session.experienceLevel}
          desktopAside={(
            <>
              <strong className="block text-ink">Step 9: Kitchen Mode</strong>
              This page is for doing the next task. The full schedule stays in Timeline.
            </>
          )}
        >
          <div className="hidden flex-wrap gap-2 sm:flex">
            <StatusPill className={kitchenMode === "service" ? "bg-tomato/10 text-tomato" : undefined}>
              {currentStep ? modeEyebrow : "Pizza session complete"}
            </StatusPill>
            <StatusPill>{heroProgressText}</StatusPill>
            <StatusPill>{heroDoneText}</StatusPill>
          </div>
        </SessionStepHero>

        {saveMessage && (
          <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold text-ink/60 shadow-sm" role="status">
            {saveMessage}
          </p>
        )}

        <section className="mt-4 sm:mt-6">
          <article className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-7">
            {currentStep ? (
              <>
                <section aria-labelledby="current-kitchen-task">
                  <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Current task</p>
                   <div className="mt-3 flex flex-wrap gap-2">
                     <StatusPill>{modeEyebrow}</StatusPill>
                    <StatusPill>Current step</StatusPill>
                    <StatusPill>{formatDateTime(currentStep.scheduledAt)}</StatusPill>
                  </div>
                   <h2 id="current-kitchen-task" className="mt-3 font-display text-4xl font-semibold leading-none sm:mt-4 sm:text-6xl">{currentStep.label}</h2>
                   <p className="mt-3 text-base font-bold leading-6 text-ink/75 sm:mt-4 sm:text-lg sm:leading-7">{instruction.shortInstruction}</p>
                  <p className="mt-3 text-sm leading-6 text-ink/55">{relativeFromTarget(currentStep.scheduledAt, targetTime)}</p>
                </section>

                {kitchenMode === "dough" && isMixDoughStep(currentStep) && ingredients.length > 0 && (
                   <section className="mt-5 rounded-[1.5rem] bg-cream p-4 sm:mt-6 sm:p-5">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Needed now</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold">Dough ingredients</h3>
                     <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3">
                       {ingredients.map((line) => (
                         <div key={line.label} className="rounded-2xl bg-white p-3.5 sm:p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{line.label}</p>
                          <p className="mt-1 text-2xl font-extrabold">{line.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {kitchenMode === "dough" && isMixDoughStep(currentStep) && ingredients.length === 0 && (
                   <section className="mt-5 rounded-[1.5rem] bg-cream p-4 sm:mt-6 sm:p-5">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Needed now</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold">Ingredient amounts unavailable</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/60">Kitchen Mode can still guide the current task. Exact dough amounts need a saved recipe snapshot.</p>
                  </section>
                )}

                {kitchenMode === "service" && (
                   <section className="mt-5 rounded-[1.5rem] bg-cream p-4 sm:mt-6 sm:p-5">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Needed now</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold">Pizza Service Mode</h3>
                    {pizzaCount && <p className="mt-2 text-sm font-extrabold text-ink/70">Pizza count: {pizzaCount} pizzas</p>}
                    <p className="mt-2 text-sm leading-6 text-ink/60">Keep sauce, cheese and toppings ready, then follow the current task.</p>
                  </section>
                )}

                 <section className="mt-5 rounded-[1.5rem] bg-leaf/10 p-4 sm:mt-6 sm:p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Instruction</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold">Do this now</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{levelWhy(session, currentStep)}</p>
                </section>

                {currentStep.quietHoursWarning && (
                  <p className="mt-5 rounded-2xl bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato">
                    Quiet-hours warning: {currentStep.quietHoursWarning}
                  </p>
                )}

                <BottomActionBar
                  back={(
                    <Link href="/session/shopping" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
                      Back
                    </Link>
                  )}
                  primary={(
                    <button
                      type="button"
                      onClick={markDone}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
                    >
                      Mark step as done →
                    </button>
                  )}
                />
              </>
            ) : (
              <>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">All steps done</p>
                 <h2 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">Pizza session complete</h2>
                <p className="mt-4 text-sm leading-6 text-ink/60">
                  Save what worked and what you want to improve next time.
                </p>
                <BottomActionBar
                  back={(
                    <Link href="/session/shopping" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
                      Back
                    </Link>
                  )}
                  primary={(
                    <Link href="/session/review" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
                      Review your pizza →
                    </Link>
                  )}
                />
              </>
            )}
          </article>
        </section>

        <SessionLocalOnlyNote>
          {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, reminders, notifications, tracking or public sharing is active.
        </SessionLocalOnlyNote>
      </SessionWorkspaceLayout>
    </main>
  );
}
