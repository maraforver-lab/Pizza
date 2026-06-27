"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionLocalOnlyNote } from "@/components/session/SessionLocalOnlyNote";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import {
  PIZZA_SESSION_LOCAL_ONLY_COPY,
} from "@/lib/pizza-session-storage";
import { type PizzaSession, type PizzaSessionTimelineStep } from "@/lib/pizza-session";
import {
  generateAndSaveActivePizzaSessionTimeline,
  generatePizzaSessionTimeline,
  getNextTimelineStep,
  getTimelineNote,
} from "@/lib/pizza-session-timeline";

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

function formatShortDateTime(value?: string) {
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

function formatTimelineDate(value?: string) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date not set";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatTimelineTime(value?: string) {
  if (!value) return "Time not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Time not set";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusClass(status: "next" | "target" | "checkpoint" | PizzaSessionTimelineStep["status"]) {
  if (status === "next" || status === "checkpoint") return "bg-leaf/10 text-leaf ring-leaf/20";
  if (status === "target") return "bg-tomato/10 text-tomato ring-tomato/20";
  if (status === "done") return "bg-leaf/10 text-leaf ring-leaf/20";
  if (status === "skipped") return "bg-ink/[.05] text-ink/45 ring-ink/10";
  return "bg-cream text-ink/55 ring-ink/10";
}

function timelineStepIcon(step: PizzaSessionTimelineStep) {
  if (step.id === "mix-dough") return "🥣";
  if (step.id === "rest-dough") return "⏳";
  if (step.id === "cold-ferment") return "❄️";
  if (step.id === "ball-dough") return "🍞";
  if (step.id === "room-temperature-rest") return "🌡️";
  if (step.id === "preheat-oven") return "🔥";
  if (step.id === "prepare-sauce-toppings") return "🍅";
  if (step.id === "bake-pizza") return "🍕";
  if (step.id === "review-result") return "📝";
  return "•";
}

function isDoughTimelineStep(step?: PizzaSessionTimelineStep) {
  if (!step) return false;
  return [
    "mix-dough",
    "rest-dough",
    "cold-ferment",
    "ball-dough",
    "room-temperature-rest",
  ].includes(step.id);
}

function isServiceTimelineStep(step?: PizzaSessionTimelineStep) {
  if (!step) return false;
  return [
    "preheat-oven",
    "prepare-sauce-toppings",
    "bake-pizza",
    "review-result",
  ].includes(step.id);
}

function statusLabel(step: PizzaSessionTimelineStep, nextStep?: PizzaSessionTimelineStep) {
  if (step.id === nextStep?.id) return "Next";
  if (step.status === "done") return "Done";
  if (step.status === "skipped") return "Skipped";
  if (step.id === "bake-pizza") return "Target time";
  return "Upcoming";
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

type ShoppingCheckpointState = "Upcoming" | "Next" | "Done";

function shoppingCheckpointState(session: PizzaSession | null, nextStep?: PizzaSessionTimelineStep): ShoppingCheckpointState {
  if (session?.shoppingList) return "Done";
  if (isDoughTimelineStep(nextStep)) return "Upcoming";
  if (isServiceTimelineStep(nextStep) || !nextStep) return "Next";
  return "Upcoming";
}

function nextActionForTimeline({
  nextStep,
  shoppingIsNext,
  allStepsComplete,
}: {
  nextStep?: PizzaSessionTimelineStep;
  shoppingIsNext: boolean;
  allStepsComplete: boolean;
}) {
  if (shoppingIsNext) {
    return {
      href: "/session/shopping",
      cta: "Open shopping list →",
      title: "Get pizza ingredients",
      subtext: "Get sauce, cheese and toppings before baking.",
      kind: "shopping",
    };
  }

  if (nextStep && isDoughTimelineStep(nextStep)) {
    return {
      href: "/session/kitchen",
      cta: "Start dough →",
      title: nextStep.label,
      subtext: "This is your next dough preparation step.",
      kind: "dough",
    };
  }

  if (nextStep && isServiceTimelineStep(nextStep)) {
    return {
      href: "/session/kitchen",
      cta: "Continue baking →",
      title: nextStep.label,
      subtext: "Kitchen Mode will guide the active cooking steps.",
      kind: "service",
    };
  }

  return {
    href: "/session/review",
    cta: "Review your pizza →",
    title: allStepsComplete ? "Review your pizza" : "Review your session",
    subtext: "Save what worked for next time.",
    kind: "review",
  };
}

function criticalMomentTitle(step: PizzaSessionTimelineStep) {
  if (step.id === "cold-ferment") return "Put dough in fridge";
  if (step.id === "room-temperature-rest") return "Take dough out";
  return step.label;
}

function getCriticalMoments(steps: PizzaSessionTimelineStep[]) {
  const preferredIds = [
    "cold-ferment",
    "room-temperature-rest",
    "preheat-oven",
    "bake-pizza",
  ];
  return preferredIds.flatMap((id) => {
    const step = steps.find((candidate) => candidate.id === id);
    return step ? [step] : [];
  });
}

function ShoppingCheckpointRow({
  checkpointState,
  shoppingIsNext,
}: {
  checkpointState: ShoppingCheckpointState;
  shoppingIsNext: boolean;
}) {
  return (
    <article
      id="shopping-checkpoint"
      className={`rounded-[1.25rem] border p-4 shadow-sm sm:rounded-[1.5rem] sm:p-5 ${
        shoppingIsNext
          ? "border-leaf/40 bg-leaf/[.12]"
          : "border-leaf/30 bg-leaf/[.08]"
      }`}
      aria-label="Shopping checkpoint"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm sm:h-12 sm:w-12 sm:text-2xl" aria-hidden="true">
            🛒
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">
              Shopping checkpoint
            </p>
            <h3 className="mt-1.5 font-display text-2xl font-semibold">Get pizza ingredients</h3>
            <p className="mt-1 text-sm leading-5 text-ink/60 sm:mt-2 sm:leading-6">Check sauce, cheese and toppings before baking.</p>
            <p className="mt-2 hidden text-sm leading-6 text-ink/65 sm:block">You can do this while the dough is resting or fermenting.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${checkpointState === "Done" || shoppingIsNext ? "bg-leaf/10 text-leaf ring-leaf/20" : "bg-white text-ink/55 ring-ink/10"}`}>
            {checkpointState}
          </span>
          <Link
            href="/session/shopping"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-leaf px-4 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Open shopping list →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function SessionTimelinePage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [missingReason, setMissingReason] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    const { session: updatedSession, result } = generateAndSaveActivePizzaSessionTimeline();
    setSession(updatedSession ?? null);
    setMissingReason(result.ok ? null : result.missingReason ?? "unknown");
    setReady(true);
  }, []);

  const timelineResult = useMemo(() => generatePizzaSessionTimeline(session ?? undefined), [session]);
  const timeline = session?.timeline ?? timelineResult.timeline;
  const nextStep = getNextTimelineStep(timeline);
  const targetTime = timeline?.targetEatTime ?? session?.targetEatTime ?? session?.targetBakeTime;
  const allStepsComplete = Boolean(timeline?.steps.length && timeline.steps.every((step) => step.status === "done"));
  const checkpointState = shoppingCheckpointState(session, nextStep);
  const shoppingIsNext = checkpointState === "Next";
  const firstServiceStepIndex = timeline?.steps.findIndex(isServiceTimelineStep) ?? -1;
  const shoppingCheckpointInsertIndex = timeline
    ? firstServiceStepIndex >= 0
      ? firstServiceStepIndex
      : timeline.steps.length
    : -1;

  if (!ready) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
          Loading your local pizza timeline…
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <SessionEmptyState
        title="No active pizza session"
        body="Start a Pizza Session first. DoughTools will save the session locally in this browser on this device."
      />
    );
  }

  if (!timeline || missingReason) {
    return (
      <SessionEmptyState
        eyebrow="Your pizza timeline"
        title="Choose a target time first."
        body="A backward schedule needs a planned eating or baking time. Return to the session starter and set a target time."
        actionLabel="Return to Start Pizza Session →"
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No reminders, cloud sync or account sync are active yet.`}
      />
    );
  }

  const nextAction = nextActionForTimeline({ nextStep, shoppingIsNext, allStepsComplete });
  const firstServiceStep = firstServiceStepIndex >= 0 ? timeline.steps[firstServiceStepIndex] : undefined;
  const nextUpTime = shoppingIsNext ? firstServiceStep?.scheduledAt ?? targetTime : nextStep?.scheduledAt ?? targetTime;
  const criticalMoments = getCriticalMoments(timeline.steps);

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 pb-24 text-ink sm:px-6 sm:py-9">
      <div className="mx-auto max-w-5xl">
        <SessionStepHero
          step={7}
          label="Timeline"
          pageType="Timeline page"
          title="Your pizza timeline"
          body="Follow the key moments and you’ll always know what to do next."
          level={session.experienceLevel}
          desktopAside={(
            <>
              <strong className="block text-ink">Step 7: Timeline</strong>
              This page is for timing. Kitchen Mode is where you do the active cooking steps.
            </>
          )}
        />

        <section aria-labelledby="next-up-heading" className="mt-4 rounded-[1.5rem] border border-leaf/20 bg-white p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Next up</p>
              <h2 id="next-up-heading" className="mt-2 font-display text-3xl font-semibold">{nextAction.title}</h2>
              <p className="mt-1 text-sm leading-5 text-ink/60 sm:mt-2 sm:leading-6">{nextAction.subtext}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-cream px-3 py-2 text-xs font-extrabold text-ink/60">
                  {formatTimelineDate(nextUpTime)}
                </span>
                <span className="rounded-full bg-leaf/10 px-3 py-2 text-xs font-extrabold text-leaf">
                  {shoppingIsNext ? `Before ${formatTimelineTime(nextUpTime)}` : formatTimelineTime(nextUpTime)}
                </span>
              </div>
            </div>
            <div className="hidden rounded-2xl bg-cream p-4 text-sm leading-6 text-ink/65 sm:block">
              <span className="block text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Recommended action</span>
              <span className="mt-1 block font-extrabold text-ink">{nextAction.cta}</span>
            </div>
          </div>
        </section>

        {criticalMoments.length > 0 && (
          <section aria-labelledby="critical-moments-heading" className="mt-5 rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Critical moments</p>
                <h2 id="critical-moments-heading" className="mt-2 font-display text-3xl font-semibold">Don’t miss these moments</h2>
              </div>
              <p className="hidden max-w-md text-sm leading-6 text-ink/55 sm:block">These are pulled from your actual timeline, not a separate checklist.</p>
            </div>
            <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
              {criticalMoments.map((step) => (
                <article key={step.id} className={`rounded-[1.25rem] border p-3.5 sm:p-4 ${step.id === "room-temperature-rest" ? "border-tomato/30 bg-tomato/[.08]" : step.id === "bake-pizza" ? "border-tomato/20 bg-tomato/[.06]" : "border-leaf/15 bg-leaf/[.06]"}`}>
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{formatTimelineDate(step.scheduledAt)}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{criticalMomentTitle(step)}</h3>
                  <p className="mt-1 text-sm font-extrabold text-leaf">{formatTimelineTime(step.scheduledAt)}</p>
                  <p className="mt-1 text-xs leading-5 text-ink/60 sm:mt-2 sm:text-sm sm:leading-6">{step.beginnerNote ?? step.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="full-timeline-heading" className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Full timeline</p>
            <h2 id="full-timeline-heading" className="mt-2 font-display text-3xl font-semibold">Full timeline</h2>
            <p className="mt-2 hidden text-sm leading-6 text-ink/55 sm:block">
              This overview is for planning. Use Kitchen Mode when you are ready to work through each task.
            </p>
          </div>

          <section className="grid min-w-0 gap-3" aria-label="Pizza timeline steps">
            {timeline.steps.map((step, index) => (
              <div key={step.id} className="grid gap-3">
                {index === shoppingCheckpointInsertIndex && (
                  <ShoppingCheckpointRow checkpointState={checkpointState} shoppingIsNext={shoppingIsNext} />
                )}
                <article
                  className={`rounded-[1.25rem] border p-4 shadow-sm sm:rounded-[1.5rem] sm:p-5 ${
                    step.id === nextStep?.id && !shoppingIsNext
                      ? "border-leaf/30 bg-leaf/[.08]"
                      : step.id === "bake-pizza"
                        ? "border-tomato/20 bg-tomato/[.05]"
                        : "border-white/80 bg-white/80"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cream text-xl sm:h-12 sm:w-12 sm:text-2xl" aria-hidden="true">
                        {timelineStepIcon(step)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/35">
                          Step {index + 1} · {formatShortDateTime(step.scheduledAt)}
                        </p>
                        <h3 className="mt-1.5 font-display text-2xl font-semibold">{step.label}</h3>
                        <p className="mt-1 text-xs leading-5 text-ink/60 sm:mt-2 sm:text-sm sm:leading-6">{step.description}</p>
                        <p className="mt-3 hidden text-sm leading-6 text-ink/65 sm:block">{getTimelineNote(step, session.experienceLevel)}</p>
                      </div>
                      {step.quietHoursWarning && (
                        <p className="mt-3 rounded-2xl bg-tomato/10 p-3 text-sm font-bold leading-6 text-tomato">
                          Quiet-hours warning: {step.quietHoursWarning}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${statusClass(step.id === nextStep?.id && !shoppingIsNext ? "next" : step.id === "bake-pizza" ? "target" : step.status)}`}>
                        {statusLabel(step, shoppingIsNext ? undefined : nextStep)}
                      </span>
                      <span className="text-sm font-bold text-ink/55">
                        {relativeFromTarget(step.scheduledAt, targetTime)}
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            ))}
            {shoppingCheckpointInsertIndex === timeline.steps.length && (
              <ShoppingCheckpointRow checkpointState={checkpointState} shoppingIsNext={shoppingIsNext} />
            )}
          </section>
        </section>

        <details className="mt-5 rounded-[1.5rem] border border-ink/10 bg-white/60 p-4 lg:hidden">
          <summary className="cursor-pointer font-display text-2xl font-semibold">Timing assumptions</summary>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/60">
            {(timeline.assumptions ?? []).map((assumption) => (
              <li key={assumption} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </details>

        <section className="mt-6 hidden rounded-[1.5rem] border border-ink/10 bg-white/60 p-4 lg:block lg:p-5">
          <h2 className="font-display text-2xl font-semibold">Timing assumptions</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/60">
            {(timeline.assumptions ?? []).map((assumption) => (
              <li key={assumption} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-tomato" aria-hidden="true" />
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </section>

        <BottomActionBar
          back={(
            <Link
              href="/session/recipe"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
            >
              Back
            </Link>
          )}
          primary={(
            <Link
              href={nextAction.href}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
            >
              {nextAction.cta}
            </Link>
          )}
        />

        <SessionLocalOnlyNote>
          {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, push notifications or email reminders are active yet.
        </SessionLocalOnlyNote>
      </div>
    </main>
  );
}
