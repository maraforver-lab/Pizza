"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
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
  getTimelineNote,
} from "@/lib/pizza-session-timeline";
import {
  timelineStepsForPlanningSummaryDisplay,
} from "@/lib/pizza-session-timeline-display";
import { buildSessionFermentationDisplay } from "@/lib/session-fermentation-display";
import { getDoughStepPrimaryImageForTimelineStep } from "@/lib/dough-step-images";
import { getDoughGuideLinkForSessionStep } from "@/lib/dough-guide-links";
import { getPizzaSessionBakingTroubleshootingLink } from "@/lib/pizza-session-troubleshooting-links";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { formatSessionPlannedTime } from "@/lib/session-time-display";
import {
  formatEarlyTimelineStartTime,
  shouldWarnBeforeEarlyTimelineStart,
} from "@/lib/timeline-early-start-warning";
import { formatTimelineLiveTiming } from "@/lib/timeline-live-timing";

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

function timelineStepIcon(step?: PizzaSessionTimelineStep) {
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
  if (!step) return "✓";
  return "•";
}

function timelineStepIconTone(step?: PizzaSessionTimelineStep) {
  if (step?.id === "cold-ferment" || step?.id === "room-ferment" || step?.id === "ferment-dough" || step?.id === "room-temperature-rest") {
    return "bg-leaf/10 text-leaf ring-leaf/15";
  }
  if (step?.id === "preheat-oven" || step?.id === "bake-pizza") {
    return "bg-tomato/10 text-tomato ring-tomato/15";
  }
  return "bg-white text-ink ring-ink/10";
}

function TimelineStepMediaPanel({ step }: { step: PizzaSessionTimelineStep }) {
  const imagePath = timelineStepImagePath(step);

  return (
    <div className="relative h-full min-h-24 w-[5.5rem] shrink-0 overflow-hidden rounded-[1.35rem] bg-cream shadow-inner ring-1 ring-white/80 sm:min-h-36 sm:w-36" aria-hidden="true" data-testid="timeline-step-media-panel">
      <Image
        src={imagePath}
        alt=""
        fill
        sizes="(min-width: 640px) 144px, 88px"
        className="object-cover"
        loading="lazy"
        data-testid="timeline-step-media-image"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-ink/15" />
    </div>
  );
}

function timelineStepImagePath(step: PizzaSessionTimelineStep) {
  const doughStepImage = getDoughStepPrimaryImageForTimelineStep(step.id);
  if (doughStepImage) return doughStepImage.src;
  if (step.id === "preheat-oven") return "/images/timeline/preheat-oven.webp";
  if (step.id === "prepare-sauce-toppings") return "/images/timeline/prepare-toppings.webp";
  if (step.id === "bake-pizza") return "/images/timeline/bake-pizza.webp";
  if (step.id === "review-result") return "/images/timeline/review-result.webp";
  return getDoughStepPrimaryImageForTimelineStep("mix-dough")?.src ?? "/dough-guide/guide-step-03-mix.webp";
}

function isDoughTimelineStep(step?: PizzaSessionTimelineStep) {
  if (!step) return false;
  return [
    "mix-dough",
    "rest-dough",
    "cold-ferment",
    "room-ferment",
    "ferment-dough",
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

function fermentationPlaceLabel(value?: string | null) {
  if (value === "cold") return "Fridge / cold fermentation";
  if (value === "hybrid") return "Room + fridge";
  if (value === "room") return "Room temperature";
  if (value === "not_recommended") return "Not recommended";
  return "Fermentation details unavailable";
}

type ShoppingCheckpointState = "Check" | "Done";

function shoppingCheckpointState(session: PizzaSession | null): ShoppingCheckpointState {
  if (session?.shoppingList) return "Done";
  return "Check";
}

function nextActionForTimeline({
  nextStep,
  allStepsComplete,
}: {
  nextStep?: PizzaSessionTimelineStep;
  allStepsComplete: boolean;
}) {
  if (nextStep && isDoughTimelineStep(nextStep)) {
    return {
      href: "/session/kitchen?from=timeline",
      cta: "Start dough →",
      title: nextStep.label,
      subtext: "This is your next dough preparation step.",
      kind: "dough",
      scheduledAt: nextStep.scheduledAt,
    };
  }

  if (nextStep && isServiceTimelineStep(nextStep)) {
    return {
      href: "/session/kitchen?from=timeline",
      cta: "Continue baking →",
      title: nextStep.label,
      subtext: "Kitchen Mode will guide the active cooking steps.",
      kind: "service",
      scheduledAt: nextStep.scheduledAt,
    };
  }

  return {
    href: "/session/review",
    cta: "Review your pizza →",
    title: allStepsComplete ? "Review your pizza" : "Review your session",
    subtext: "Save what worked for next time.",
    kind: "review",
    scheduledAt: undefined,
  };
}

function actionableTimelineSteps(steps: PizzaSessionTimelineStep[]) {
  return steps.filter((step) => (
    step.id !== "review-result"
    && (isDoughTimelineStep(step) || isServiceTimelineStep(step))
  ));
}

function criticalMomentTitle(step: PizzaSessionTimelineStep) {
  if (step.id === "cold-ferment") return "Cold fermentation";
  if (step.id === "room-ferment") return "Room temperature ferment";
  if (step.id === "ferment-dough") return "Ferment dough";
  if (step.id === "room-temperature-rest" && step.label !== "Room temperature rest") return step.label;
  if (step.id === "room-temperature-rest") return "Take dough out";
  return step.label;
}

function getCriticalMoments(steps: PizzaSessionTimelineStep[]) {
  const preferredIds = [
    "cold-ferment",
    "room-ferment",
    "ferment-dough",
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

const bakingTroubleshootingLink = getPizzaSessionBakingTroubleshootingLink();

function ShoppingCheckpointRow({
  checkpointState,
}: {
  checkpointState: ShoppingCheckpointState;
}) {
  return (
    <article
      id="shopping-checkpoint"
      className="rounded-[1.25rem] border border-leaf/30 bg-leaf/[.08] p-4 shadow-sm sm:rounded-[1.5rem] sm:p-5"
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
            <h3 className="mt-1.5 font-display text-2xl font-semibold">Shopping review</h3>
            <p className="mt-1 text-sm leading-5 text-ink/60 sm:mt-2 sm:leading-6">Shopping should be handled before Timeline. Reopen it only if you need to adjust toppings or buy-list checks.</p>
            <p className="mt-2 hidden text-sm leading-6 text-ink/65 sm:block">Timeline stays focused on when to work; Shopping owns toppings and buy-list checks.</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${checkpointState === "Done" ? "bg-leaf/10 text-leaf ring-leaf/20" : "bg-white text-ink/55 ring-ink/10"}`}>
            {checkpointState}
          </span>
          <Link
            href="/session/shopping"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-leaf px-4 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Review shopping →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function SessionTimelinePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [missingReason, setMissingReason] = useState<string | null>(null);
  const [earlyStartStep, setEarlyStartStep] = useState<PizzaSessionTimelineStep | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    document.documentElement.lang = "en";
    const { session: updatedSession, result } = generateAndSaveActivePizzaSessionTimeline();
    setSession(updatedSession ?? null);
    setMissingReason(result.ok ? null : result.missingReason ?? "unknown");
    setReady(true);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 15_000);
    return () => window.clearInterval(interval);
  }, []);

  const timelineResult = useMemo(() => generatePizzaSessionTimeline(session ?? undefined), [session]);
  const sessionRecipeResult = useMemo(() => buildSessionRecipe(session ?? undefined), [session]);
  const timeline = session?.timeline ?? timelineResult.timeline;
  const targetTime = timeline?.targetEatTime ?? session?.targetEatTime ?? session?.targetBakeTime;

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

  const planningInfo = sessionRecipeResult.ok ? sessionRecipeResult.planningInfo : null;
  const planningResult = planningInfo?.ok ? planningInfo.result : null;
  const displayTimelineSteps = timelineStepsForPlanningSummaryDisplay({
    steps: timeline.steps,
    planningResult,
    session,
    fermentationMode: sessionRecipeResult.ok
      ? sessionRecipeResult.continuousYeast?.recommendation.fermentationMode
      : undefined,
    anchorTime: timeline.anchorTime,
  });
  const actionableSteps = actionableTimelineSteps(displayTimelineSteps);
  const currentActionStep = actionableSteps.find((step) => step.status === "todo");
  const currentActionIndex = currentActionStep
    ? actionableSteps.findIndex((step) => step.id === currentActionStep.id)
    : -1;
  const followingActionStep = currentActionIndex >= 0
    ? actionableSteps.slice(currentActionIndex + 1).find((step) => step.status === "todo")
    : undefined;
  const allStepsComplete = Boolean(actionableSteps.length && actionableSteps.every((step) => step.status === "done"));
  const checkpointState = shoppingCheckpointState(session);
  const firstServiceStepIndex = displayTimelineSteps.findIndex(isServiceTimelineStep);
  const shoppingCheckpointInsertIndex = firstServiceStepIndex >= 0
    ? firstServiceStepIndex
    : displayTimelineSteps.length;
  const nextAction = nextActionForTimeline({ nextStep: currentActionStep, allStepsComplete });
  const currentDoughGuideLink = getDoughGuideLinkForSessionStep(currentActionStep, "/session/timeline");
  const currentActionTime = currentActionStep?.scheduledAt ?? targetTime;
  const nextLiveTiming = formatTimelineLiveTiming(followingActionStep?.scheduledAt, currentTime);
  const currentLiveTiming = formatTimelineLiveTiming(currentActionTime, currentTime);
  const stepProgressLabel = currentActionStep && currentActionIndex >= 0
    ? `Step ${currentActionIndex + 1} of ${actionableSteps.length}`
    : allStepsComplete
      ? `Step ${actionableSteps.length} of ${actionableSteps.length}`
      : "Step timing unavailable";
  const criticalMoments = getCriticalMoments(displayTimelineSteps);
  const fermentationSetup = planningResult?.fermentationSetupRecommendation;
  const fermentationDisplay = sessionRecipeResult.ok
    ? buildSessionFermentationDisplay({
      session,
      snapshot: sessionRecipeResult.recipeSnapshot,
      basis: sessionRecipeResult.continuousYeast?.recommendation,
    })
    : buildSessionFermentationDisplay({ session, snapshot: session.recipeSnapshot });
  const fermentationPlanPlace = fermentationDisplay.placeTemperatureLabel
    ?? fermentationPlaceLabel(fermentationSetup?.recommendedFermentationMode);
  const handleNextAction = () => {
    if (
      nextAction.kind === "dough" &&
      shouldWarnBeforeEarlyTimelineStart(nextAction.scheduledAt)
    ) {
      setEarlyStartStep(currentActionStep ?? null);
      return;
    }

    router.push(nextAction.href);
  };
  const continueToKitchenAnyway = () => {
    setEarlyStartStep(null);
    router.push("/session/kitchen?from=timeline");
  };
  const nextStepSummary = followingActionStep
    ? `${followingActionStep.label} · ${formatSessionPlannedTime(followingActionStep.scheduledAt, currentTime)}`
    : allStepsComplete
      ? "Ready for Review"
      : "Next step not available";
  const renderNextActionCard = () => (
    <div className="max-w-2xl rounded-2xl border border-leaf/15 bg-cream/70 p-4 shadow-sm sm:p-5" data-testid="timeline-current-action-card">
      <section aria-labelledby="timeline-current-step-heading" className="min-w-0">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl ring-1 ${timelineStepIconTone(currentActionStep)}`} aria-hidden="true">
            {timelineStepIcon(currentActionStep)}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Now</p>
            <h2 id="timeline-current-step-heading" className="mt-2 font-display text-4xl font-semibold leading-none text-ink sm:text-5xl">
              {nextAction.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink/60">{nextAction.subtext}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Planned for</p>
          <p className="mt-1 font-display text-3xl font-semibold leading-none text-ink sm:text-4xl">
            {formatSessionPlannedTime(currentActionTime, currentTime)}
          </p>
        </div>
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
          <span className="rounded-full bg-white px-3 py-2 text-xs font-extrabold text-ink/55">
            {stepProgressLabel}
          </span>
        </div>
        <div className="mt-4 flex items-start gap-2 border-t border-ink/10 pt-3 text-sm font-extrabold leading-6 text-ink/65">
          {followingActionStep && (
            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base ring-1 ${timelineStepIconTone(followingActionStep)}`} aria-hidden="true">
              {timelineStepIcon(followingActionStep)}
            </span>
          )}
          <p className="min-w-0">
            <span className="uppercase tracking-[.14em] text-ink/40">Next:</span>{" "}
            {nextStepSummary}
            {followingActionStep && nextLiveTiming.kind !== "unknown" && (
              <span className="font-bold text-ink/45"> · {nextLiveTiming.label}{nextLiveTiming.value ? ` ${nextLiveTiming.value}` : ""}</span>
            )}
          </p>
        </div>
      </section>
      <button
        type="button"
        onClick={handleNextAction}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
      >
        {nextAction.cta}
      </button>
      {currentDoughGuideLink && (
        <Link
          href={currentDoughGuideLink.href}
          aria-label={currentDoughGuideLink.ariaLabel}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white/80 px-4 text-sm font-extrabold text-ink/60 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
        >
          {currentDoughGuideLink.label}
        </Link>
      )}
    </div>
  );

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 pb-24 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <CloudPizzaSessionSync session={session} />
      <SessionWorkspaceLayout activeStep={8} hideLocalSaveNote>
        <SessionStepHero
          step={8}
          label="Timeline"
          pageType="Timeline page"
          title="Your pizza timeline"
          body="Follow the key moments and you’ll always know what to do next."
          level={session.experienceLevel}
          hideMeta
        >
          {renderNextActionCard()}
        </SessionStepHero>

        <section aria-labelledby="timeline-planning-summary-heading" className="mt-5 rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-6">
          <div className="max-w-2xl">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Planning timing notes</p>
              <h2 id="timeline-planning-summary-heading" className="mt-2 font-display text-3xl font-semibold">Timeline planning summary</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                Timeline guidance is based on available session choices. It does not replace the timeline steps below or change Kitchen Mode.
              </p>
            </div>
          </div>

          {planningResult ? (
            <div className="mt-4 grid gap-3">
              <dl className="grid gap-2 rounded-[1.25rem] border border-ink/10 bg-cream/70 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-xs font-extrabold text-ink/45">Bake target</dt>
                  <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">{formatDateTime(targetTime)}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <dt className="text-xs font-extrabold text-ink/45">Available time</dt>
                  <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">{formatAvailableHours(planningResult.availableFermentationHours)}</dd>
                </div>
                <div className="rounded-2xl bg-white p-3 sm:col-span-2 lg:col-span-1">
                  <dt className="text-xs font-extrabold text-ink/45">Fermentation plan</dt>
                  <dd className="mt-1 text-sm font-extrabold leading-5 text-ink">{fermentationDisplay.label}</dd>
                  <dd className="mt-1 text-sm font-bold leading-5 text-ink/60">{fermentationPlanPlace}</dd>
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
            {displayTimelineSteps.map((step, index) => (
              <div key={step.id} className="grid gap-3">
                {index === shoppingCheckpointInsertIndex && (
                  <ShoppingCheckpointRow checkpointState={checkpointState} />
                )}
                <article
                  className={`rounded-[1.25rem] border p-3 shadow-sm sm:rounded-[1.5rem] sm:p-4 ${
                    step.id === currentActionStep?.id
                      ? "border-leaf/30 bg-leaf/[.08]"
                      : step.id === "bake-pizza"
                        ? "border-tomato/20 bg-tomato/[.05]"
                      : "border-white/80 bg-white/80"
                  }`}
                >
                  <div className="flex min-w-0 items-stretch gap-3 sm:gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-1 sm:p-1.5">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${statusClass(step.id === currentActionStep?.id ? "next" : step.id === "bake-pizza" ? "target" : step.status)}`}>
                          {statusLabel(step, currentActionStep)}
                        </span>
                        <span className="text-sm font-bold text-ink/55">
                          {relativeFromTarget(step.scheduledAt, targetTime)}
                        </span>
                      </div>
                      {step.id === "bake-pizza" && (
                        <Link
                          href={bakingTroubleshootingLink.href}
                          aria-label={bakingTroubleshootingLink.ariaLabel}
                          className="inline-flex min-h-10 w-fit items-center justify-center rounded-2xl border border-ink/10 bg-white/75 px-3 text-xs font-extrabold text-ink/55 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                        >
                          {bakingTroubleshootingLink.label}
                        </Link>
                      )}
                    </div>
                    <TimelineStepMediaPanel step={step} />
                  </div>
                </article>
              </div>
            ))}
            {shoppingCheckpointInsertIndex === displayTimelineSteps.length && (
              <ShoppingCheckpointRow checkpointState={checkpointState} />
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
              href="/session/shopping"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
            >
              Back
            </Link>
          )}
          primary={(
            <button
              type="button"
              onClick={handleNextAction}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
            >
              {nextAction.cta}
            </button>
          )}
        />

        {earlyStartStep && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 px-4 py-5 backdrop-blur-sm sm:items-center sm:py-8"
            role="presentation"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="early-timeline-start-title"
              aria-describedby="early-timeline-start-body"
              className="w-full max-w-lg rounded-[1.75rem] border border-white/80 bg-white p-5 text-ink shadow-card sm:rounded-[2rem] sm:p-6"
            >
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Timing check</p>
              <h2 id="early-timeline-start-title" className="mt-2 font-display text-3xl font-semibold">
                This step is scheduled for later
              </h2>
              <p id="early-timeline-start-body" className="mt-3 text-sm font-bold leading-6 text-ink/65">
                This dough step is planned for {formatEarlyTimelineStartTime(earlyStartStep.scheduledAt)}. Starting now may affect the fermentation schedule and final dough quality.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">
                <button
                  type="button"
                  onClick={continueToKitchenAnyway}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
                >
                  Start anyway
                </button>
                <button
                  type="button"
                  onClick={() => setEarlyStartStep(null)}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
                >
                  Go back
                </button>
              </div>
            </section>
          </div>
        )}

        <SessionLocalOnlyNote>
          {PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, push notifications or email reminders are active yet.
        </SessionLocalOnlyNote>
      </SessionWorkspaceLayout>
    </main>
  );
}
