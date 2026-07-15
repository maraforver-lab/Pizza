"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { buttonClass, cardClass, statusPillClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { SessionRouteState } from "@/components/session/SessionRouteState";
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
  applyPizzaSessionStepRuntime,
  formatRuntimeClockTime,
  hasStepActuallyStarted,
  isRuntimeDoughWorkStep,
  startPizzaSessionTimelineStep,
  type RuntimePizzaSessionTimelineStep,
} from "@/lib/pizza-session-step-runtime";
import {
  timelineStepsForPlanningSummaryDisplay,
} from "@/lib/pizza-session-timeline-display";
import { getDoughGuideLinkForSessionStep } from "@/lib/dough-guide-links";
import { getPizzaSessionBakingTroubleshootingLink } from "@/lib/pizza-session-troubleshooting-links";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { formatSessionPlannedTime } from "@/lib/session-time-display";
import {
  formatEarlyTimelineStartTime,
  shouldWarnBeforeEarlyTimelineStart,
} from "@/lib/timeline-early-start-warning";
import { formatTimelineLiveTiming } from "@/lib/timeline-live-timing";

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
  if (status === "next" || status === "checkpoint") return "bg-status-success/10 text-status-success ring-status-success/20";
  if (status === "target") return "bg-action-primary/10 text-action-primary ring-action-primary/20";
  if (status === "done") return "bg-status-success/10 text-status-success ring-status-success/20";
  if (status === "skipped") return "bg-ink/[.05] text-ink/45 ring-ink/10";
  return "bg-background-subtle text-ink/55 ring-ink/10";
}

function timelineStepIcon(step?: PizzaSessionTimelineStep): DoughToolsIconName {
  if (step?.id === "mix-dough") return "mixing-bowl";
  if (step?.id === "rest-dough") return "timer";
  if (step?.id === "cold-ferment") return "refrigerator";
  if (step?.id === "room-ferment" || step?.id === "ferment-dough") return "thermometer";
  if (step?.id === "ball-dough") return "pizza";
  if (step?.id === "room-temperature-rest") return "thermometer";
  if (step?.id === "preheat-oven") return "flame";
  if (step?.id === "prepare-sauce-toppings") return "chef-hat";
  if (step?.id === "bake-pizza") return "pizza";
  if (step?.id === "review-result") return "checklist";
  if (!step) return "check";
  return "timeline";
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

type ShoppingCheckpointState = "Check" | "Done";

function shoppingCheckpointState(session: PizzaSession | null): ShoppingCheckpointState {
  if (session?.shoppingList) return "Done";
  return "Check";
}

function timelineStartActionLabel() {
  return "Start Kitchen Mode";
}

function nextActionForTimeline({
  nextStep,
  allStepsComplete,
  session,
}: {
  nextStep?: PizzaSessionTimelineStep;
  allStepsComplete: boolean;
  session?: PizzaSession | null;
}) {
  if (nextStep && isDoughTimelineStep(nextStep)) {
    const isWorkStep = isRuntimeDoughWorkStep(nextStep);
    const hasStarted = hasStepActuallyStarted(session ?? undefined, nextStep.id);
    return {
      href: "/session/kitchen?from=timeline",
      cta: isWorkStep && !hasStarted ? timelineStartActionLabel() : "Start Kitchen Mode",
      title: nextStep.label,
      subtext: "This is your next dough preparation step.",
      kind: "dough",
      scheduledAt: nextStep.scheduledAt,
    };
  }

  if (nextStep && isServiceTimelineStep(nextStep)) {
    return {
      href: "/session/kitchen?from=timeline",
      cta: "Start Kitchen Mode",
      title: nextStep.label,
      subtext: "Kitchen Mode will guide the active cooking steps.",
      kind: "service",
      scheduledAt: nextStep.scheduledAt,
    };
  }

  return {
    href: "/session/review",
    cta: "Review my pizza",
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

const bakingTroubleshootingLink = getPizzaSessionBakingTroubleshootingLink();

function ShoppingCheckpointRow({
  checkpointState,
}: {
  checkpointState: ShoppingCheckpointState;
}) {
  return (
    <li
      id="shopping-checkpoint"
      className="flex min-w-0 items-start gap-3 rounded-[1.25rem] border border-leaf/15 bg-leaf/[.06] p-3 shadow-sm sm:p-4"
      aria-label="Shopping checkpoint"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-leaf ring-1 ring-leaf/15" aria-hidden="true">
        <DoughToolsIcon name="shopping-basket" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Shopping checkpoint</p>
        <h3 className="mt-1 font-display text-xl font-semibold">Shopping list</h3>
        <p className="mt-1 text-sm leading-5 text-ink/60">
          {checkpointState === "Done" ? "Checklist is ready for cooking." : "Use Back if you still need to check ingredients."}
        </p>
      </div>
      <span className={statusPillClass({ className: "shrink-0 px-3 py-2", variant: checkpointState === "Done" ? "success" : "archived" })}>
        {checkpointState}
      </span>
    </li>
  );
}

export default function SessionTimelinePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [missingReason, setMissingReason] = useState<string | null>(null);
  const [earlyStartStep, setEarlyStartStep] = useState<PizzaSessionTimelineStep | null>(null);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    document.documentElement.lang = "en";
    try {
      const { session: updatedSession, result } = generateAndSaveActivePizzaSessionTimeline();
      setSession(updatedSession ?? null);
      setMissingReason(result.ok ? null : result.missingReason ?? "unknown");
    } catch {
      setRouteError(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 15_000);
    return () => window.clearInterval(interval);
  }, []);

  const timelineResult = useMemo(() => generatePizzaSessionTimeline(session ?? undefined), [session]);
  const sessionRecipeResult = useMemo(() => buildSessionRecipe(session ?? undefined), [session]);
  const timeline = session?.timeline ?? timelineResult.timeline;
  const targetTime = timeline?.targetEatTime ?? session?.targetEatTime ?? session?.targetBakeTime;

  if (routeError) {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Start a new plan" }}
        body="Something interrupted the local session check. Try again, or start a fresh pizza plan."
        eyebrow="Timeline"
        onRetry={() => window.location.reload()}
        title="We couldn’t open your timeline."
        variant="error"
      />
    );
  }

  if (!ready) {
    return (
      <SessionRouteState
        body="Checking this browser for an active pizza plan before building the preparation schedule."
        eyebrow="Timeline"
        title="Opening your timeline"
        variant="checking"
      />
    );
  }

  if (!session) {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Plan my next pizza" }}
        body="Your preparation schedule is created after your pizza plan is ready."
        eyebrow="Timeline"
        title="No timeline yet"
        variant="no-session"
      />
    );
  }

  if (!timeline || missingReason) {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Complete my pizza plan" }}
        body="Complete your pizza plan first so DoughTools can build the preparation schedule."
        eyebrow="Timeline"
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No reminders, cloud sync or account sync are active yet.`}
        title="Your timeline is not ready yet."
        variant="step-unavailable"
      />
    );
  }

  const planningInfo = sessionRecipeResult.ok ? sessionRecipeResult.planningInfo : null;
  const planningResult = planningInfo?.ok ? planningInfo.result : null;
  const plannedDisplayTimelineSteps = timelineStepsForPlanningSummaryDisplay({
    steps: timeline.steps,
    planningResult,
    session,
    fermentationMode: sessionRecipeResult.ok
      ? sessionRecipeResult.continuousYeast?.recommendation.fermentationMode
      : undefined,
    anchorTime: timeline.anchorTime,
  });
  const displayTimelineSteps = applyPizzaSessionStepRuntime(plannedDisplayTimelineSteps, session.stepRuntime);
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
  const nextAction = nextActionForTimeline({ nextStep: currentActionStep, allStepsComplete, session });
  const currentDoughGuideLink = getDoughGuideLinkForSessionStep(currentActionStep, "/session/timeline");
  const currentActionTime = currentActionStep?.scheduledAt ?? targetTime;
  const nextLiveTiming = formatTimelineLiveTiming(followingActionStep?.scheduledAt, currentTime);
  const currentLiveTiming = formatTimelineLiveTiming(currentActionTime, currentTime);
  const stepProgressLabel = currentActionStep && currentActionIndex >= 0
    ? `Step ${currentActionIndex + 1} of ${actionableSteps.length}`
    : allStepsComplete
      ? `Step ${actionableSteps.length} of ${actionableSteps.length}`
      : "Step timing unavailable";
  const kitchenModeAvailability = nextAction.kind === "dough" && shouldWarnBeforeEarlyTimelineStart(nextAction.scheduledAt, currentTime)
    ? "Timing check first"
    : nextAction.kind === "review"
      ? "Review next"
      : "Ready when you confirm";
  const startCurrentRuntimeStepAndGoToKitchen = () => {
    if (currentActionStep && isRuntimeDoughWorkStep(currentActionStep) && !hasStepActuallyStarted(session, currentActionStep.id)) {
      const updated = startPizzaSessionTimelineStep(session, currentActionStep.id);
      if (updated) setSession(updated);
    }
    router.push(nextAction.href);
  };

  const handleNextAction = () => {
    if (
      nextAction.kind === "dough" &&
      shouldWarnBeforeEarlyTimelineStart(nextAction.scheduledAt)
    ) {
      setEarlyStartStep(currentActionStep ?? null);
      return;
    }

    startCurrentRuntimeStepAndGoToKitchen();
  };
  const continueToKitchenAnyway = () => {
    setEarlyStartStep(null);
    startCurrentRuntimeStepAndGoToKitchen();
  };
  const nextStepSummary = followingActionStep
    ? `${followingActionStep.label} · ${formatSessionPlannedTime(followingActionStep.scheduledAt, currentTime)}`
    : allStepsComplete
      ? "Ready for Review"
      : "Next step not available";
  const renderNextActionCard = () => (
    <div className={cardClass({ className: "p-4 shadow-sm sm:p-5", variant: "success" })} data-testid="timeline-current-action-card">
      <section aria-labelledby="timeline-current-step-heading" className="min-w-0">
        <dl className="mb-4 grid gap-2 rounded-[1.25rem] border border-leaf/15 bg-white/80 p-3 sm:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Target</dt>
            <dd className="mt-1 text-sm font-extrabold leading-5 text-ink">{formatShortDateTime(targetTime)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Schedule</dt>
            <dd className="mt-1 text-sm font-extrabold leading-5 text-ink">
              {currentLiveTiming.label}{currentLiveTiming.value ? ` ${currentLiveTiming.value}` : ""}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Kitchen Mode</dt>
            <dd className="mt-1 text-sm font-extrabold leading-5 text-ink">{kitchenModeAvailability}</dd>
          </div>
        </dl>
        <div className="flex min-w-0 items-start gap-3">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ${timelineStepIconTone(currentActionStep)}`} aria-hidden="true">
            <DoughToolsIcon name={timelineStepIcon(currentActionStep)} size={24} strokeWidth={2.1} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Now</p>
            <h2 id="timeline-current-step-heading" className="mt-2 font-display text-4xl font-semibold leading-none text-ink sm:text-5xl">
              {nextAction.title}
            </h2>
            <p className="mt-3 hidden text-sm leading-6 text-ink/60 sm:block">{nextAction.subtext}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">
            {(currentActionStep as RuntimePizzaSessionTimelineStep | undefined)?.runtimeEndsAt ? "Running until" : "Planned for"}
          </p>
          <p className="mt-1 font-display text-3xl font-semibold leading-none text-ink sm:text-4xl">
            {formatSessionPlannedTime(currentActionTime, currentTime)}
          </p>
          {(currentActionStep as RuntimePizzaSessionTimelineStep | undefined)?.runtimeStartsAt && (
            <p className="mt-2 text-xs font-bold leading-5 text-ink/50">
              Planned for {formatRuntimeClockTime((currentActionStep as RuntimePizzaSessionTimelineStep).plannedScheduledAt)}
              {" · "}
              Actually started at {formatRuntimeClockTime((currentActionStep as RuntimePizzaSessionTimelineStep).runtimeStartsAt)}
            </p>
          )}
          {currentActionStep && isRuntimeDoughWorkStep(currentActionStep) && hasStepActuallyStarted(session, currentActionStep.id) && (
            <p className="mt-2 text-xs font-bold leading-5 text-ink/50">
              Started at {formatRuntimeClockTime(session.stepRuntime?.[currentActionStep.id]?.actualStartedAt)}
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={statusPillClass({ className: "hidden px-3 py-2 sm:inline-flex", variant: "archived" })}>
            {stepProgressLabel}
          </span>
        </div>
        <div className="mt-4 flex items-start gap-2 border-t border-ink/10 pt-3 text-sm font-extrabold leading-6 text-ink/65">
          {followingActionStep && (
            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 ${timelineStepIconTone(followingActionStep)}`} aria-hidden="true">
              <DoughToolsIcon name={timelineStepIcon(followingActionStep)} size={16} strokeWidth={2.1} />
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
        className={buttonClass({ className: "mt-4 w-full px-4" })}
      >
        {nextAction.cta}
      </button>
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
          title="Timeline"
          body="Use this schedule to see the next required action, its planned time and the path into Kitchen Mode."
          level={session.experienceLevel}
          levelCompactOnMobile
          hideBodyOnMobile
          hideMeta
        >
          {renderNextActionCard()}
        </SessionStepHero>

        <section aria-labelledby="full-timeline-heading" className="mt-5 sm:mt-6">
          <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Schedule</p>
              <h2 id="full-timeline-heading" className="mt-2 font-display text-3xl font-semibold">Ordered steps</h2>
            </div>
            <p className="text-sm font-bold leading-5 text-ink/55 sm:text-right">
              {actionableSteps.length} action steps
            </p>
          </div>

          <ol className="grid min-w-0 gap-2" aria-label="Pizza timeline steps">
            {displayTimelineSteps.map((step, index) => (
              <Fragment key={step.id}>
                {index === shoppingCheckpointInsertIndex && (
                  <ShoppingCheckpointRow checkpointState={checkpointState} />
                )}
                <li
                  className={`grid min-w-0 gap-3 rounded-[1.25rem] border p-3 shadow-sm sm:grid-cols-[6.75rem_2.75rem_minmax(0,1fr)_auto] sm:items-start sm:p-4 ${
                    step.id === currentActionStep?.id
                      ? "border-leaf/30 bg-leaf/[.08]"
                      : step.id === "bake-pizza"
                        ? "border-tomato/20 bg-tomato/[.05]"
                      : "border-white/80 bg-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 sm:block">
                    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{formatTimelineDate(step.scheduledAt)}</p>
                    <p className="text-sm font-extrabold text-leaf sm:mt-1">{formatTimelineTime(step.scheduledAt)}</p>
                  </div>
                  <span className={`hidden h-11 w-11 place-items-center rounded-2xl ring-1 sm:grid ${timelineStepIconTone(step)}`} aria-hidden="true">
                    <DoughToolsIcon name={timelineStepIcon(step)} size={20} strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/35">Step {index + 1}</p>
                    <h3 className="mt-1 font-display text-2xl font-semibold">{step.label}</h3>
                    <p className="mt-1 text-sm leading-5 text-ink/60">{step.description}</p>
                    {(step as RuntimePizzaSessionTimelineStep).runtimeStartsAt && (
                      <p className="mt-2 text-xs font-extrabold leading-5 text-leaf">
                        Running from {formatRuntimeClockTime((step as RuntimePizzaSessionTimelineStep).runtimeStartsAt)}
                        {" until "}
                        {formatRuntimeClockTime((step as RuntimePizzaSessionTimelineStep).runtimeEndsAt)}
                      </p>
                    )}
                    <p className="mt-2 hidden text-sm leading-5 text-ink/55 lg:block">{getTimelineNote(step, session.experienceLevel)}</p>
                    {step.quietHoursWarning && (
                      <p className="mt-3 rounded-2xl bg-tomato/10 p-3 text-sm font-bold leading-6 text-tomato">
                        Quiet-hours warning: {step.quietHoursWarning}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${statusClass(step.id === currentActionStep?.id ? "next" : step.id === "bake-pizza" ? "target" : step.status)}`}>
                      {statusLabel(step, currentActionStep)}
                    </span>
                    <span className="text-sm font-bold text-ink/55">
                      {relativeFromTarget(step.scheduledAt, targetTime)}
                    </span>
                  </div>
                </li>
              </Fragment>
            ))}
            {shoppingCheckpointInsertIndex === displayTimelineSteps.length && (
              <ShoppingCheckpointRow checkpointState={checkpointState} />
            )}
          </ol>
        </section>

        <nav aria-label="Timeline navigation" className="mt-5 hidden justify-start border-t border-ink/10 pt-4 sm:mt-6 sm:flex">
          <Link
            href="/session/shopping"
            className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}
          >
            Back
          </Link>
        </nav>

        <section aria-labelledby="timeline-guidance-heading" className={cardClass({ className: "mt-4 p-4 shadow-sm sm:p-5", variant: "default" })}>
          <button
            type="button"
            aria-expanded={guidanceOpen}
            aria-controls="timeline-optional-guidance-panel"
            onClick={() => setGuidanceOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <span className="min-w-0">
              <span className="block text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Optional guidance</span>
              <span id="timeline-guidance-heading" className="mt-1 block font-display text-2xl font-semibold">Need help?</span>
            </span>
            <span className={statusPillClass({ className: "shrink-0 px-3 py-2", variant: "archived" })}>
              {guidanceOpen ? "Hide" : "Show"}
            </span>
          </button>
          {guidanceOpen && (
            <div id="timeline-optional-guidance-panel" className="mt-4 grid gap-2 sm:grid-cols-2">
              {currentDoughGuideLink && (
                <Link
                  href={currentDoughGuideLink.href}
                  aria-label={currentDoughGuideLink.ariaLabel}
                  className={buttonClass({ className: "w-full px-4", variant: "secondary" })}
                >
                  {currentDoughGuideLink.label}
                </Link>
              )}
              <Link
                href={bakingTroubleshootingLink.href}
                aria-label={bakingTroubleshootingLink.ariaLabel}
                className={buttonClass({ className: "w-full px-4", variant: "secondary" })}
              >
                {bakingTroubleshootingLink.label}
              </Link>
            </div>
          )}
        </section>

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
      </SessionWorkspaceLayout>
    </main>
  );
}
