"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionLocalOnlyNote } from "@/components/session/SessionLocalOnlyNote";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
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
import { buildSessionRecipe } from "@/lib/session-recipe";

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

function relativeFromNow(stepTime?: string) {
  if (!stepTime) return "Timing guide";
  const step = new Date(stepTime);
  const now = new Date();
  if (!Number.isFinite(step.getTime())) return "Timing guide";
  const diffMinutes = Math.round((step.getTime() - now.getTime()) / 60_000);
  if (Math.abs(diffMinutes) < 1) return "Now";
  const abs = Math.abs(diffMinutes);
  const days = Math.floor(abs / 1440);
  const hours = Math.floor((abs % 1440) / 60);
  const minutes = abs % 60;
  const parts = [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    !days && minutes ? `${minutes}m` : "",
  ].filter(Boolean).join(" ");
  return diffMinutes > 0 ? `In ${parts}` : `${parts} ago`;
}

function formatAvailableHours(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Time not available";
  if (value < 1) return `${Math.round(value * 60)} min`;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} h`;
}

function readablePlanningLabel(value?: string | null) {
  if (!value) return "Not enough information";
  return value.replaceAll("_", " ");
}

function planningRiskTone(risk?: string) {
  if (risk === "high_risk" || risk === "not_recommended") return "border-tomato/35 bg-tomato/[.08] text-tomato";
  if (risk === "caution") return "border-tomato/25 bg-tomato/[.06] text-tomato";
  if (risk === "not_enough_information") return "border-ink/10 bg-cream text-ink/65";
  return "border-leaf/25 bg-leaf/[.08] text-leaf";
}

function fermentationPlaceLabel(value?: string | null) {
  if (value === "cold") return "Fridge / cold fermentation";
  if (value === "hybrid") return "Room + fridge";
  if (value === "room") return "Room temperature";
  if (value === "not_recommended") return "Not recommended";
  return "Not enough information";
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
      href: "/session/kitchen?from=timeline",
      cta: "Start dough →",
      title: nextStep.label,
      subtext: "This is your next dough preparation step.",
      kind: "dough",
    };
  }

  if (nextStep && isServiceTimelineStep(nextStep)) {
    return {
      href: "/session/kitchen?from=timeline",
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
  }).sort((a, b) => {
    const aTime = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
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
  const sessionRecipeResult = useMemo(() => buildSessionRecipe(session ?? undefined), [session]);
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
  const planningInfo = sessionRecipeResult.ok ? sessionRecipeResult.planningInfo : null;
  const planningResult = planningInfo?.ok ? planningInfo.result : null;
  const combinedRisk = planningResult?.combinedRiskSummary;
  const startWindow = planningResult?.startWindowRecommendation;
  const fermentationSetup = planningResult?.fermentationSetupRecommendation;
  const temperatureGuidance = planningResult?.temperatureGuidance;
  const renderNextActionCard = () => (
    <div className="rounded-2xl border border-leaf/15 bg-white p-4 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Next up</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-ink">{nextAction.title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink/60">{nextAction.subtext}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-cream px-3 py-2 text-xs font-extrabold text-ink/60">
          {formatTimelineDate(nextUpTime)}
        </span>
        <span className="rounded-full bg-leaf/10 px-3 py-2 text-xs font-extrabold text-leaf">
          {shoppingIsNext ? `Before ${formatTimelineTime(nextUpTime)}` : formatTimelineTime(nextUpTime)}
        </span>
      </div>
      <Link
        href={nextAction.href}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
      >
        {nextAction.cta}
      </Link>
    </div>
  );

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 pb-24 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <SessionWorkspaceLayout activeStep={7}>
        <SessionStepHero
          step={7}
          label="Timeline"
          pageType="Timeline page"
          title="Your pizza timeline"
          body="Follow the key moments and you’ll always know what to do next."
          level={session.experienceLevel}
          hideMeta
          desktopAside={renderNextActionCard()}
        >
          <div className="lg:hidden">
            {renderNextActionCard()}
          </div>
        </SessionStepHero>

        <section aria-labelledby="timeline-planning-summary-heading" className="mt-5 rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Planning timing notes</p>
              <h2 id="timeline-planning-summary-heading" className="mt-2 font-display text-3xl font-semibold">Timeline planning summary</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                Timeline guidance is based on available session choices. It does not replace the timeline steps below or change Kitchen Mode.
              </p>
            </div>
            <span className={`w-fit rounded-full border px-3 py-2 text-xs font-extrabold capitalize ${planningRiskTone(combinedRisk?.overallRiskLevel ?? (planningResult ? "low" : "not_enough_information"))}`}>
              {readablePlanningLabel(combinedRisk?.overallRiskLevel ?? (planningResult ? "low" : "not_enough_information"))}
            </span>
          </div>

          {planningResult && combinedRisk ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <section className={`rounded-[1.25rem] border p-4 ${planningRiskTone(combinedRisk.overallRiskLevel)}`}>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] opacity-70">Timing risk</p>
                <p className="mt-2 text-sm font-extrabold leading-6 text-ink">{combinedRisk.primaryRiskReason}</p>
                <div className="mt-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-ink/65">
                  <span className="block text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">What to watch</span>
                  <span className="mt-1 block font-bold">{combinedRisk.suggestedFirstAdjustment ?? "No major timing adjustment needed from the available session choices."}</span>
                </div>
              </section>

              <dl className="grid gap-2 rounded-[1.25rem] border border-ink/10 bg-cream/70 p-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-xs font-extrabold text-ink/45">Bake target</dt>
                  <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">{formatDateTime(targetTime)}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-xs font-extrabold text-ink/45">Available time</dt>
                  <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">{formatAvailableHours(planningResult.availableFermentationHours)}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-xs font-extrabold text-ink/45">Start window</dt>
                  <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">{startWindow?.startWindowLabel ?? "Not enough information"}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-xs font-extrabold text-ink/45">Fermentation place</dt>
                  <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">{fermentationPlaceLabel(fermentationSetup?.recommendedFermentationMode)}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3 sm:col-span-2">
                  <dt className="text-xs font-extrabold text-ink/45">Fermentation temperature</dt>
                  <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">
                    {temperatureGuidance
                      ? `Room ${temperatureGuidance.roomTemperature} °C · Fridge ${temperatureGuidance.fridgeTemperature} °C`
                      : "Add dough plan details for stronger temperature guidance."}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="mt-4 rounded-[1.25rem] border border-ink/10 bg-cream p-4 text-sm leading-6 text-ink/65">
              Add bake time and dough plan details for stronger timing recommendations. The existing timeline below still uses your saved target time.
            </div>
          )}
        </section>

        {criticalMoments.length > 0 && (
          <section aria-labelledby="what-happens-when-heading" className="mt-5 rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Timing highlights</p>
                <h2 id="what-happens-when-heading" className="mt-2 font-display text-3xl font-semibold">What happens when</h2>
              </div>
              <p className="hidden max-w-md text-sm leading-6 text-ink/55 sm:block">The most important moments from your actual pizza timeline.</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white sm:mt-5">
              {criticalMoments.map((step) => (
                <article key={step.id} className="grid gap-3 border-b border-ink/10 p-4 last:border-b-0 sm:grid-cols-[8rem_1fr_auto] sm:items-center sm:gap-5 sm:p-5">
                  <div className="flex items-center justify-between gap-3 sm:block">
                    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{formatTimelineDate(step.scheduledAt)}</p>
                    <p className="text-sm font-extrabold text-leaf sm:mt-1">{formatTimelineTime(step.scheduledAt)}</p>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl font-semibold">{criticalMomentTitle(step)}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/60">{step.beginnerNote ?? step.description}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 sm:justify-self-end ${step.id === "bake-pizza" ? "bg-tomato/10 text-tomato ring-tomato/20" : "bg-leaf/10 text-leaf ring-leaf/20"}`}>
                    {relativeFromNow(step.scheduledAt)}
                  </span>
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
      </SessionWorkspaceLayout>
    </main>
  );
}
