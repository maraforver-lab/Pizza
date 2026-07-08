"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
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
  getKitchenTaskPresentation,
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

function kitchenBackHrefFromSource(value?: string | null) {
  if (value === "timeline") return "/session/timeline";
  if (value === "review") return "/session/review";
  return "/session/shopping";
}

function kitchenBackHrefFromReferrer(value?: string) {
  if (!value || typeof window === "undefined") return "/session/shopping";
  try {
    const url = new URL(value);
    if (url.origin !== window.location.origin) return "/session/shopping";
    if (url.pathname === "/session/timeline") return "/session/timeline";
    if (url.pathname === "/session/review") return "/session/review";
    if (url.pathname === "/session/shopping") return "/session/shopping";
  } catch {
    return "/session/shopping";
  }
  return "/session/shopping";
}

export default function SessionKitchenPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [backHref, setBackHref] = useState("/session/shopping");

  useEffect(() => {
    document.documentElement.lang = "en";
    setSession(getActivePizzaSession() ?? null);
    const source = new URLSearchParams(window.location.search).get("from");
    setBackHref(source ? kitchenBackHrefFromSource(source) : kitchenBackHrefFromReferrer(document.referrer));
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
  const taskPresentation = getKitchenTaskPresentation(currentStep, session);
  const ingredients = doughKitchenIngredientLines(session.recipeSnapshot);
  const targetTime = session.timeline?.targetEatTime ?? session.targetEatTime ?? session.targetBakeTime;
  const pizzaCount = session.pizzaCount ?? session.recipeSnapshot?.balls;

  const markDone = () => {
    if (!session || !currentStep) return;
    const updated = completeKitchenTimelineStep(session, currentStep.id);
    if (!updated) return;
    setSession(updated);
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <CloudPizzaSessionSync session={session} />
      <SessionWorkspaceLayout activeStep={9}>
        <SessionStepHero
          step={9}
          label="Kitchen Mode"
          pageType="Execution page"
          title="Kitchen Mode"
          body="Follow one step at a time."
          level={session.experienceLevel}
          hideMeta
        />

        <section className="mt-4 sm:mt-6">
          <article className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-7">
            {currentStep ? (
              <>
                <section aria-labelledby="current-kitchen-task">
                  <h2 id="current-kitchen-task" className="font-display text-4xl font-semibold leading-none sm:text-6xl">{taskPresentation.title}</h2>
                  <p className="mt-3 text-base font-bold leading-6 text-ink/75 sm:mt-4 sm:text-lg sm:leading-7">{taskPresentation.shortInstruction}</p>
                  <p className="mt-3 text-sm font-bold text-ink/55">{formatDateTime(currentStep.scheduledAt)}</p>
                  <p className="mt-3 text-sm leading-6 text-ink/55">{relativeFromTarget(currentStep.scheduledAt, targetTime)}</p>
                  {taskPresentation.helperCopy && (
                    <p className="mt-4 rounded-2xl bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato">
                      {taskPresentation.helperCopy}
                    </p>
                  )}
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
                    <h3 className="mt-2 font-display text-2xl font-semibold">Service reminders</h3>
                    {pizzaCount && <p className="mt-2 text-sm font-extrabold text-ink/70">Pizza count: {pizzaCount} pizzas</p>}
                    <p className="mt-2 text-sm leading-6 text-ink/60">Keep sauce, cheese and toppings ready, then follow the current task.</p>
                  </section>
                )}

                {currentStep.quietHoursWarning && (
                  <p className="mt-5 rounded-2xl bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato">
                    Quiet-hours warning: {currentStep.quietHoursWarning}
                  </p>
                )}

                <BottomActionBar
                  back={(
                    <Link href={backHref} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
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
                    <Link href={backHref} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
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
      </SessionWorkspaceLayout>
    </main>
  );
}
