"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import { getExperienceLevelConfig } from "@/lib/experience-levels";
import {
  type PizzaSession,
} from "@/lib/pizza-session";
import { formatSessionPlannedTime } from "@/lib/session-time-display";
import { formatTimelineLiveTiming } from "@/lib/timeline-live-timing";
import {
  completeKitchenTimelineStep,
  doughKitchenIngredientLines,
  getKitchenExperienceGuidance,
  getKitchenModeForStep,
  getKitchenModeState,
  getKitchenStepWaitInfo,
  getKitchenTaskPresentation,
  isMixDoughStep,
  shouldConfirmEarlyKitchenStepCompletion,
} from "@/lib/pizza-session-kitchen";
import { getActivePizzaSession } from "@/lib/pizza-session-storage";

function formatKitchenStepTime(value?: string) {
  if (!value) return "Time not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Time not set";
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("weekday")}, ${part("day")} ${part("month")} · ${part("hour")}:${part("minute")}`;
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

function kitchenStepIcon(step?: { id: string }) {
  if (step?.id === "mix-dough") return "🥣";
  if (step?.id === "rest-dough") return "⏳";
  if (step?.id === "cold-ferment") return "❄️";
  if (step?.id === "room-ferment" || step?.id === "ferment-dough") return "🌡️";
  if (step?.id === "ball-dough") return "🍞";
  if (step?.id === "room-temperature-rest") return "🌡️";
  if (step?.id === "preheat-oven") return "🔥";
  if (step?.id === "prepare-sauce-toppings") return "🍅";
  if (step?.id === "bake-pizza") return "🍕";
  if (step?.id === "review-result") return "📝";
  return "✓";
}

function kitchenStepIconTone(step?: { id: string }) {
  if (step?.id === "cold-ferment" || step?.id === "room-ferment" || step?.id === "ferment-dough" || step?.id === "room-temperature-rest") {
    return "bg-leaf/10 text-leaf ring-leaf/15";
  }
  if (step?.id === "preheat-oven" || step?.id === "bake-pizza") {
    return "bg-tomato/10 text-tomato ring-tomato/15";
  }
  return "bg-white text-ink ring-ink/10";
}

function levelModeLabel(label: string) {
  return `${label} mode`;
}

export default function SessionKitchenPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [backHref, setBackHref] = useState("/session/shopping");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [confirmEarlyCompletion, setConfirmEarlyCompletion] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en";
    setSession(getActivePizzaSession() ?? null);
    const source = new URLSearchParams(window.location.search).get("from");
    setBackHref(source ? kitchenBackHrefFromSource(source) : kitchenBackHrefFromReferrer(document.referrer));
    setCurrentTime(new Date());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setInterval(() => setCurrentTime(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, [ready]);

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
      />
    );
  }

  if (!kitchenState.ok) return null;

  const currentStep = kitchenState.currentStep;
  const kitchenMode = getKitchenModeForStep(currentStep);
  const taskPresentation = getKitchenTaskPresentation(currentStep, session);
  const nextTaskPresentation = getKitchenTaskPresentation(kitchenState.nextStep, session);
  const ingredients = doughKitchenIngredientLines(session.recipeSnapshot);
  const pizzaCount = session.pizzaCount ?? session.recipeSnapshot?.balls;
  const waitInfo = currentTime ? getKitchenStepWaitInfo(currentStep, currentTime) : getKitchenStepWaitInfo(undefined);
  const currentLiveTiming = formatTimelineLiveTiming(currentStep?.scheduledAt, currentTime ?? new Date());
  const nextLiveTiming = formatTimelineLiveTiming(kitchenState.nextStep?.scheduledAt, currentTime ?? new Date());
  const currentStepIsWaiting = currentStep?.kind === "passive";
  const nextStepSummary = kitchenState.nextStep
    ? `${nextTaskPresentation.title} · ${formatSessionPlannedTime(kitchenState.nextStep.scheduledAt, currentTime ?? new Date())}`
    : "Review your pizza session";
  const experience = getExperienceLevelConfig(session.experienceLevel);
  const levelGuidance = getKitchenExperienceGuidance(currentStep, session.experienceLevel, session);
  const levelGuidanceDetails = [
    levelGuidance.whatToLookFor && { label: "What to look for", value: levelGuidance.whatToLookFor },
    levelGuidance.whyItMatters && { label: "Why it matters", value: levelGuidance.whyItMatters },
    levelGuidance.technicalNote && { label: "Technical note", value: levelGuidance.technicalNote },
    levelGuidance.reassuranceTip && { label: "Keep in mind", value: levelGuidance.reassuranceTip },
  ].filter(Boolean) as { label: string; value: string }[];

  const completeCurrentStep = () => {
    if (!session || !currentStep) return;
    const updated = completeKitchenTimelineStep(session, currentStep.id);
    if (!updated) return;
    setConfirmEarlyCompletion(false);
    setSession(updated);
  };

  const markDone = () => {
    if (!currentStep) return;
    if (shouldConfirmEarlyKitchenStepCompletion(currentStep, new Date())) {
      setCurrentTime(new Date());
      setConfirmEarlyCompletion(true);
      return;
    }
    completeCurrentStep();
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-6 pb-28 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <CloudPizzaSessionSync session={session} />
      <SessionWorkspaceLayout activeStep={9} hideLocalSaveNote>
        <section>
          <article className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-7">
            {currentStep ? (
              <>
                <section aria-labelledby="current-kitchen-task">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-leaf/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-leaf">
                          Step {kitchenState.currentIndex + 1} of {kitchenState.totalCount}
                        </span>
                        <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-ink/45">
                          Kitchen Mode
                        </span>
                        {waitInfo.isTooEarly && waitInfo.waitLabel && (
                          <span className="rounded-full bg-tomato/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-tomato">
                            {waitInfo.waitLabel}
                          </span>
                        )}
                      </div>
                      <div className="mt-5 flex min-w-0 items-start gap-3">
                        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl ring-1 ${kitchenStepIconTone(currentStep)}`} aria-hidden="true">
                          {kitchenStepIcon(currentStep)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Current step</p>
                          <h1 id="current-kitchen-task" className="mt-2 font-display text-4xl font-semibold leading-none sm:text-6xl">{taskPresentation.title}</h1>
                        </div>
                      </div>
                    </div>
                    <div className={`rounded-[1.5rem] border p-4 shadow-sm ${experience.cardClassName}`}>
                      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">{levelModeLabel(experience.label)}</p>
                    </div>
                  </div>

                  <section className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-cream/70 p-4 shadow-sm sm:p-5" aria-labelledby="kitchen-current-timing-heading">
                    <p id="kitchen-current-timing-heading" className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Planned for</p>
                    <p className="mt-2 font-display text-4xl font-semibold leading-none text-ink sm:text-5xl">
                      {formatSessionPlannedTime(currentStep.scheduledAt, currentTime ?? new Date())}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-2 text-xs font-extrabold ${
                        currentLiveTiming.kind === "overdue"
                          ? "bg-tomato/10 text-tomato"
                          : currentLiveTiming.kind === "unknown"
                            ? "bg-white text-ink/55"
                            : "bg-leaf/10 text-leaf"
                      }`}>
                        {currentLiveTiming.label}
                      </span>
                      {currentLiveTiming.value && (
                        <span className="rounded-full bg-tomato/10 px-3 py-2 text-xs font-extrabold text-tomato">
                          {currentLiveTiming.value}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-start gap-2 border-t border-ink/10 pt-3 text-sm font-extrabold leading-6 text-ink/65">
                      {kitchenState.nextStep && (
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base ring-1 ${kitchenStepIconTone(kitchenState.nextStep)}`} aria-hidden="true">
                          {kitchenStepIcon(kitchenState.nextStep)}
                        </span>
                      )}
                      <p className="min-w-0">
                        <span className="uppercase tracking-[.14em] text-ink/40">{currentStepIsWaiting ? "Next action:" : "Next:"}</span>{" "}
                        {nextStepSummary}
                        {kitchenState.nextStep && nextLiveTiming.kind !== "unknown" && (
                          <span className="font-bold text-ink/45"> · {nextLiveTiming.label}{nextLiveTiming.value ? ` ${nextLiveTiming.value}` : ""}</span>
                        )}
                      </p>
                    </div>
                  </section>

                  {waitInfo.isTooEarly && waitInfo.waitLabel && (
                    <div className="mt-5 rounded-[1.25rem] border border-tomato/20 bg-tomato/[.08] p-4" role="status">
                      <p className="text-sm font-extrabold leading-6 text-tomato">
                        {waitInfo.waitLabel} before this step.
                      </p>
                      <p className="mt-1 text-sm font-bold leading-6 text-ink/65">
                        This step is scheduled for {formatKitchenStepTime(currentStep.scheduledAt)}.
                      </p>
                    </div>
                  )}

                  <section className="mt-5 rounded-[1.5rem] border border-white/80 bg-cream/75 p-4 shadow-sm sm:p-5" aria-labelledby="kitchen-step-guidance-heading">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl ring-1 ${kitchenStepIconTone(currentStep)}`} aria-hidden="true">
                        {kitchenStepIcon(currentStep)}
                      </span>
                      <div className="min-w-0">
                        <p id="kitchen-step-guidance-heading" className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Step guidance</p>
                        <h2 className="mt-2 font-display text-3xl font-semibold leading-none">What to do now</h2>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-[1.25rem] border border-tomato/15 bg-white/80 p-4">
                        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{currentStepIsWaiting ? "What is happening now" : "Do this"}</p>
                        <p className="mt-2 text-lg font-extrabold leading-7 text-ink sm:text-2xl sm:leading-8">{taskPresentation.shortInstruction}</p>
                      </div>

                      <div className="rounded-[1.25rem] bg-white/70 p-4">
                        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">You are done when</p>
                        <p className="mt-2 text-sm font-bold leading-6 text-ink/70 sm:text-base">{taskPresentation.doneCondition}</p>
                      </div>

                      <div className={`rounded-[1.25rem] border p-4 ${experience.cardClassName}`}>
                        <p id="kitchen-level-guidance-heading" className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">{experience.label} guidance</p>
                        <p className="mt-2 text-base font-extrabold leading-7 text-ink sm:text-lg">{levelGuidance.instruction}</p>
                        {levelGuidanceDetails.length > 0 && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {levelGuidanceDetails.map((item) => (
                              <div key={item.label} className="rounded-2xl bg-white/70 p-3.5">
                                <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-ink/40">{item.label}</p>
                                <p className="mt-1 text-sm font-bold leading-6 text-ink/70">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {taskPresentation.helperCopy && (
                        <div className="rounded-[1.25rem] border border-leaf/10 bg-white/65 p-4">
                          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Technique note</p>
                          <p className="mt-2 text-sm font-bold leading-6 text-ink/60 sm:text-base">{taskPresentation.helperCopy}</p>
                        </div>
                      )}
                    </div>
                  </section>
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

                {confirmEarlyCompletion && waitInfo.waitLabel && (
                  <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="early-kitchen-step-heading">
                    <div className="w-full max-w-md rounded-[1.5rem] border border-white/80 bg-white p-5 text-ink shadow-card">
                      <h2 id="early-kitchen-step-heading" className="font-display text-3xl font-semibold leading-none">This step is scheduled later</h2>
                      <p className="mt-3 text-sm font-bold leading-6 text-ink/65">
                        You should {waitInfo.waitLabel.toLowerCase()} before this step. Do you still want to continue?
                      </p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setConfirmEarlyCompletion(false)}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                        >
                          Go back
                        </button>
                        <button
                          type="button"
                          onClick={completeCurrentStep}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                        >
                          Continue anyway
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
