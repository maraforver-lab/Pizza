"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomActionBar, buttonClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { SessionExperienceLevelBadge } from "@/components/session/SessionExperienceLevelBadge";
import { SessionRouteState } from "@/components/session/SessionRouteState";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import { getExperienceLevelConfig } from "@/lib/experience-levels";
import { queueCloudActivePizzaSessionSave } from "@/lib/cloud-pizza-session-client";
import { buildContextualReturnHref } from "@/lib/contextual-return";
import { getDoughGuideLinkForSessionStep } from "@/lib/dough-guide-links";
import {
  type PizzaSession,
  type PizzaSessionPizzaMix,
  type PizzaSessionPizzaMixType,
} from "@/lib/pizza-session";
import { formatSessionPlannedTime } from "@/lib/session-time-display";
import { getPizzaSessionBakingTroubleshootingLink } from "@/lib/pizza-session-troubleshooting-links";
import { formatTimelineLiveTiming } from "@/lib/timeline-live-timing";
import {
  formatRuntimeClockTime,
  hasStepActuallyStarted,
  isRuntimeDoughWorkStep,
  startPizzaSessionTimelineStep,
  type RuntimePizzaSessionTimelineStep,
} from "@/lib/pizza-session-step-runtime";
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
import {
  adjustPizzaMixAllocation,
  normalizePizzaMixForCount,
  PIZZA_MIX_OPTIONS,
  savePizzaSessionMenuMix,
} from "@/lib/pizza-session-shopping-list";

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

function kitchenStepIcon(step?: { id: string }): DoughToolsIconName {
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
  return "check";
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

function queueKitchenProgressSync(updated: PizzaSession) {
  void queueCloudActivePizzaSessionSave(updated).catch(() => {
    // The local session remains current; route-level sync can retry on the next render.
  });
}

function pizzaMixTotal(mix?: PizzaSessionPizzaMix) {
  return Object.values(mix ?? {}).reduce((total, value) => total + Math.max(0, Math.floor(Number(value) || 0)), 0);
}

function pizzaMixSummary(pizzaCount: number | undefined, mix?: PizzaSessionPizzaMix) {
  if (!pizzaCount || pizzaCount < 1 || !mix) return "Pizza menu not ready";
  const normalized = normalizePizzaMixForCount(pizzaCount, mix);
  const selected = PIZZA_MIX_OPTIONS
    .filter((option) => (normalized[option.id] ?? 0) > 0)
    .map((option) => `${normalized[option.id]} ${option.name}`)
    .join(" · ");
  return `${pizzaCount} pizzas: ${selected || "Pizza mix not ready"}`;
}

function kitchenBakePhaseStarted(session: PizzaSession, currentStep?: { id: string }) {
  const bakeRuntime = session.stepRuntime?.["bake-pizza"];
  const bakeStep = session.timeline?.steps.find((step) => step.id === "bake-pizza");
  return session.currentStep === "bake"
    || currentStep?.id === "bake-pizza"
    || Boolean(bakeRuntime?.actualStartedAt || bakeRuntime?.actualCompletedAt)
    || bakeStep?.status === "done";
}

function isOvenTroubleshootingStep(step?: { id: string }) {
  return step?.id === "preheat-oven" || step?.id === "bake-pizza";
}

function kitchenStartActionLabel(step?: { id: string }) {
  if (step?.id === "mix-dough") return "Start mixing now";
  if (step?.id === "ball-dough") return "Start balling now";
  return "Start this step";
}

function kitchenCompleteActionLabel(step?: { id: string }) {
  if (step?.id === "mix-dough") return "Mark mixing complete →";
  if (step?.id === "ball-dough") return "Mark balling complete →";
  return "Mark step as done →";
}

const bakingTroubleshootingLink = getPizzaSessionBakingTroubleshootingLink("Something looks wrong? Open baking troubleshooting");

export default function SessionKitchenPage() {
  const [ready, setReady] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [confirmEarlyCompletion, setConfirmEarlyCompletion] = useState(false);
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [draftPizzaMix, setDraftPizzaMix] = useState<PizzaSessionPizzaMix | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuDialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    try {
      setSession(getActivePizzaSession() ?? null);
      setCurrentTime(new Date());
    } catch {
      setRouteError(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setInterval(() => setCurrentTime(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    if (!menuEditorOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenuEditor();
        return;
      }
      if (event.key === "Tab" && menuDialogRef.current) {
        const focusable = Array.from(menuDialogRef.current.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])",
        ));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => menuDialogRef.current?.focus(), 0);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuEditorOpen]);

  const kitchenState = useMemo(() => getKitchenModeState(session ?? undefined), [session]);

  if (routeError) {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Start a new plan" }}
        body="Something interrupted the local session check. Try again, or start a fresh pizza plan."
        eyebrow="Kitchen Mode"
        onRetry={() => window.location.reload()}
        title="We couldn’t open Kitchen Mode."
        variant="error"
      />
    );
  }

  if (!ready) {
    return (
      <SessionRouteState
        body="Checking this browser for an active pizza plan before opening guided cooking."
        eyebrow="Kitchen Mode"
        title="Opening Kitchen Mode"
        variant="checking"
      />
    );
  }

  if (!session || (!kitchenState.ok && kitchenState.missingReason === "no-session")) {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Create my plan" }}
        body="Create your pizza plan and preparation timeline before starting guided cooking."
        eyebrow="Kitchen Mode"
        title="Kitchen Mode is not ready yet"
        variant="no-session"
      />
    );
  }

  if (!kitchenState.ok && kitchenState.missingReason === "missing-timeline") {
    return (
      <SessionRouteState
        action={{ href: "/session/timeline", label: "Build my timeline" }}
        body="Create your pizza plan and preparation timeline before starting guided cooking."
        eyebrow="Kitchen Mode"
        title="Kitchen Mode is not ready yet"
        variant="step-unavailable"
      />
    );
  }

  if (!kitchenState.ok) {
    return (
      <SessionRouteState
        action={{ href: "/session/timeline", label: "Open timeline" }}
        body="Kitchen Mode could not find the next practical task for this session."
        eyebrow="Kitchen Mode"
        onRetry={() => window.location.reload()}
        title="We couldn’t open Kitchen Mode."
        variant="error"
      />
    );
  }

  const currentStep = kitchenState.currentStep;
  const currentRuntimeStep = currentStep as RuntimePizzaSessionTimelineStep | undefined;
  const kitchenMode = getKitchenModeForStep(currentStep);
  const taskPresentation = getKitchenTaskPresentation(currentStep, session);
  const nextTaskPresentation = getKitchenTaskPresentation(kitchenState.nextStep, session);
  const ingredients = doughKitchenIngredientLines(session.recipeSnapshot);
  const pizzaCount = session.pizzaCount ?? session.recipeSnapshot?.balls;
  const waitInfo = currentTime ? getKitchenStepWaitInfo(currentStep, currentTime) : getKitchenStepWaitInfo(undefined);
  const currentLiveTiming = formatTimelineLiveTiming(currentStep?.scheduledAt, currentTime ?? new Date());
  const nextLiveTiming = formatTimelineLiveTiming(kitchenState.nextStep?.scheduledAt, currentTime ?? new Date());
  const currentStepIsWaiting = currentStep?.kind === "passive";
  const currentStepIsRuntimeWork = isRuntimeDoughWorkStep(currentStep);
  const currentStepHasStarted = hasStepActuallyStarted(session, currentStep?.id);
  const doughGuideLink = getDoughGuideLinkForSessionStep(currentStep, "/session/kitchen");
  const ovenTroubleshootingLink = isOvenTroubleshootingStep(currentStep) ? bakingTroubleshootingLink : null;
  const doughGuideHref = doughGuideLink ? buildContextualReturnHref(doughGuideLink.href) : null;
  const ovenTroubleshootingHref = ovenTroubleshootingLink ? buildContextualReturnHref(ovenTroubleshootingLink.href) : null;
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
  const lockedPizzaCount = pizzaCount && pizzaCount > 0 ? Math.floor(pizzaCount) : undefined;
  const confirmedPizzaMix = lockedPizzaCount
    ? normalizePizzaMixForCount(lockedPizzaCount, session.pizzaMix, session.pizzaPreset)
    : undefined;
  const currentPizzaMixSummary = pizzaMixSummary(lockedPizzaCount, confirmedPizzaMix);
  const draftNormalizedMix = lockedPizzaCount && draftPizzaMix
    ? normalizePizzaMixForCount(lockedPizzaCount, draftPizzaMix)
    : undefined;
  const draftAllocatedCount = pizzaMixTotal(draftNormalizedMix);
  const menuLocked = kitchenBakePhaseStarted(session, currentStep);
  const menuCanEdit = Boolean(lockedPizzaCount && lockedPizzaCount > 0 && !menuLocked);

  const closeMenuEditor = () => {
    setMenuEditorOpen(false);
    setDraftPizzaMix(null);
    setMenuError(null);
    window.setTimeout(() => menuTriggerRef.current?.focus(), 0);
  };

  const openMenuEditor = () => {
    if (!lockedPizzaCount || lockedPizzaCount < 1) {
      setMenuError("Pizza menu needs a saved pizza count before it can be changed.");
      return;
    }
    setDraftPizzaMix(normalizePizzaMixForCount(lockedPizzaCount, session.pizzaMix, session.pizzaPreset));
    setMenuError(null);
    setMenuEditorOpen(true);
  };

  const adjustDraftPizzaMix = (pizzaType: PizzaSessionPizzaMixType, delta: number) => {
    if (!lockedPizzaCount || !draftNormalizedMix) return;
    setDraftPizzaMix(adjustPizzaMixAllocation(draftNormalizedMix, pizzaType, delta, lockedPizzaCount));
  };

  const saveMenuChanges = () => {
    if (!lockedPizzaCount || !draftNormalizedMix) {
      setMenuError("Pizza menu needs a valid locked pizza count before it can be saved.");
      return;
    }
    if (draftAllocatedCount !== lockedPizzaCount) {
      setMenuError("The selected pizza mix must match the locked total.");
      return;
    }
    const latestSession = getActivePizzaSession();
    if (!latestSession || latestSession.id !== session.id) {
      setMenuError("This pizza session changed in another tab. Reload Kitchen Mode before changing the menu.");
      return;
    }
    if (kitchenBakePhaseStarted(latestSession, currentStep)) {
      setMenuError("Menu is locked once baking starts.");
      return;
    }
    const now = new Date();
    const { session: updatedSession, result } = savePizzaSessionMenuMix(latestSession, draftNormalizedMix, undefined, now);
    if (!updatedSession || !result.ok) {
      setMenuError("Could not update the pizza menu. Check the pizza count and try again.");
      return;
    }
    queueKitchenProgressSync(updatedSession);
    setCurrentTime(now);
    setSession(updatedSession);
    setMenuEditorOpen(false);
    setDraftPizzaMix(null);
    setMenuError(null);
    window.setTimeout(() => menuTriggerRef.current?.focus(), 0);
  };

  const completeCurrentStep = () => {
    if (!session || !currentStep) return;
    const updated = completeKitchenTimelineStep(session, currentStep.id);
    if (!updated) return;
    queueKitchenProgressSync(updated);
    setConfirmEarlyCompletion(false);
    setSession(updated);
  };

  const startCurrentStep = () => {
    if (!session || !currentStep || !currentStepIsRuntimeWork) return;
    const now = new Date();
    const updated = startPizzaSessionTimelineStep(session, currentStep.id, undefined, now);
    if (!updated) return;
    queueKitchenProgressSync(updated);
    setCurrentTime(now);
    setSession(updated);
  };

  const markDone = () => {
    if (!currentStep) return;
    if (currentStepIsRuntimeWork && !currentStepHasStarted) {
      startCurrentStep();
      return;
    }
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
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-ink/45">
                        Kitchen Mode
                      </span>
                      <span className="rounded-full bg-leaf/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-leaf">
                        Step {kitchenState.currentIndex + 1}/{kitchenState.totalCount}
                      </span>
                      <SessionExperienceLevelBadge level={session.experienceLevel} />
                      {waitInfo.isTooEarly && waitInfo.waitLabel && (
                        <span className="rounded-full bg-tomato/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-tomato">
                          {waitInfo.waitLabel}
                        </span>
                      )}
                    </div>
                    <div className="mt-5 flex min-w-0 items-start gap-3">
                      <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ${kitchenStepIconTone(currentStep)}`} aria-hidden="true">
                        <DoughToolsIcon name={kitchenStepIcon(currentStep)} size={32} strokeWidth={2.1} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Current step</p>
                        <h1 id="current-kitchen-task" className="mt-2 font-display text-4xl font-semibold leading-none sm:text-6xl">{taskPresentation.title}</h1>
                      </div>
                    </div>
                  </div>

                  <section className="mt-5 rounded-[1.5rem] border border-leaf/15 bg-cream/70 p-4 shadow-sm sm:p-5" aria-labelledby="kitchen-current-timing-heading">
                    <p id="kitchen-current-timing-heading" className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">
                      {currentRuntimeStep?.runtimeEndsAt ? "Running until" : "Planned for"}
                    </p>
                    <p className="mt-2 font-display text-4xl font-semibold leading-none text-ink sm:text-5xl">
                      {formatSessionPlannedTime(currentStep.scheduledAt, currentTime ?? new Date())}
                    </p>
                    {currentRuntimeStep?.runtimeStartsAt && (
                      <p className="mt-2 text-xs font-bold leading-5 text-ink/50">
                        Planned for {formatRuntimeClockTime(currentRuntimeStep.plannedScheduledAt)}
                        {" · "}
                        Actually started at {formatRuntimeClockTime(currentRuntimeStep.runtimeStartsAt)}
                      </p>
                    )}
                    {currentStepIsRuntimeWork && currentStepHasStarted && (
                      <p className="mt-2 text-xs font-bold leading-5 text-ink/50">
                        Started at {formatRuntimeClockTime(session.stepRuntime?.[currentStep.id]?.actualStartedAt)}
                      </p>
                    )}
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
                    <div className="mt-4 flex items-start gap-2 border-t border-ink/10 pt-3 text-sm font-extrabold leading-6 text-ink/65" aria-label="Compact next-step preview">
                      {kitchenState.nextStep && (
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 ${kitchenStepIconTone(kitchenState.nextStep)}`} aria-hidden="true">
                          <DoughToolsIcon name={kitchenStepIcon(kitchenState.nextStep)} size={16} strokeWidth={2.1} />
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
                      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ${kitchenStepIconTone(currentStep)}`} aria-hidden="true">
                        <DoughToolsIcon name={kitchenStepIcon(currentStep)} size={24} strokeWidth={2.1} />
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

                      <details className="rounded-[1.25rem] border border-ink/10 bg-white/70 p-4">
                        <summary className="cursor-pointer text-sm font-extrabold text-ink/65 marker:text-tomato">
                          More guidance
                        </summary>
                        <div className="mt-4 grid gap-3">
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
                              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">What this should look like</p>
                              <p className="mt-2 text-sm font-bold leading-6 text-ink/60 sm:text-base">{taskPresentation.helperCopy}</p>
                            </div>
                          )}

                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            {doughGuideLink && doughGuideHref && (
                              <Link
                                href={doughGuideHref}
                                aria-label={doughGuideLink.ariaLabel}
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white/80 px-4 text-sm font-extrabold text-ink/60 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-fit"
                              >
                                {doughGuideLink.label}
                              </Link>
                            )}

                            {ovenTroubleshootingLink && ovenTroubleshootingHref && (
                              <Link
                                href={ovenTroubleshootingHref}
                                aria-label={ovenTroubleshootingLink.ariaLabel}
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white/80 px-4 text-sm font-extrabold text-ink/60 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-fit"
                              >
                                {ovenTroubleshootingLink.label}
                              </Link>
                            )}
                          </div>
                        </div>
                      </details>
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
                    <p className="mt-2 text-sm leading-6 text-ink/60">Keep sauce, cheese and toppings ready, then follow the current task.</p>
                  </section>
                )}

                <section className="mt-5 rounded-[1.25rem] border border-ink/10 bg-white/70 p-4" aria-labelledby="kitchen-menu-summary-heading">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p id="kitchen-menu-summary-heading" className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Pizza menu</p>
                      <p className="mt-1 text-sm font-extrabold leading-6 text-ink">{currentPizzaMixSummary}</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-ink/50">
                        {menuLocked
                          ? "Menu is locked once baking starts."
                          : lockedPizzaCount
                            ? "Total pizzas are locked for this session."
                            : "Pizza menu needs a saved pizza count before it can be changed."}
                      </p>
                    </div>
                    {menuError && !menuEditorOpen && (
                      <p className="rounded-2xl bg-tomato/10 px-3 py-2 text-xs font-extrabold text-tomato" role="status">
                        {menuError}
                      </p>
                    )}
                  </div>
                </section>

                {currentStep.quietHoursWarning && (
                  <p className="mt-5 rounded-2xl bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato">
                    Quiet-hours warning: {currentStep.quietHoursWarning}
                  </p>
                )}

                <BottomActionBar
                  back={(
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        ref={menuTriggerRef}
                        type="button"
                        onClick={openMenuEditor}
                        disabled={!menuCanEdit}
                        className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}
                      >
                        Change pizza menu
                      </button>
                      <Link href="/session/timeline" className={buttonClass({ className: "w-full sm:w-auto", variant: "tertiary" })}>
                        View full schedule
                      </Link>
                    </div>
                  )}
                  primary={(
                    <button
                      type="button"
                      onClick={markDone}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
                    >
                      {currentStepIsRuntimeWork && !currentStepHasStarted
                        ? kitchenStartActionLabel(currentStep)
                        : kitchenCompleteActionLabel(currentStep)}
                    </button>
                  )}
                />

                {menuEditorOpen && draftNormalizedMix && lockedPizzaCount && (
                  <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="kitchen-menu-editor-heading">
                    <div
                      ref={menuDialogRef}
                      tabIndex={-1}
                      className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white p-5 text-ink shadow-card focus:outline-none"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Pizza menu</p>
                          <h2 id="kitchen-menu-editor-heading" className="mt-2 font-display text-3xl font-semibold leading-none">Change pizza menu</h2>
                        </div>
                        <button
                          type="button"
                          onClick={closeMenuEditor}
                          aria-label="Close pizza menu editor"
                          className={buttonClass({ className: "min-h-10 min-w-10 px-3", variant: "icon" })}
                        >
                          <DoughToolsIcon name="close" size={20} strokeWidth={2.1} />
                        </button>
                      </div>
                      <p className="mt-3 text-sm font-bold leading-6 text-ink/60">
                        Total pizzas: {lockedPizzaCount} — locked. Total pizzas are locked for this session.
                      </p>
                      <div className="mt-4 grid gap-2">
                        {PIZZA_MIX_OPTIONS.map((option) => {
                          const quantity = draftNormalizedMix[option.id] ?? 0;
                          const canDecrease = option.id !== "margherita" && quantity > 0;
                          const canIncrease = option.id === "margherita"
                            ? PIZZA_MIX_OPTIONS.some((entry) => entry.id !== "margherita" && (draftNormalizedMix[entry.id] ?? 0) > 0)
                            : (draftNormalizedMix.margherita ?? 0) > 0;

                          return (
                            <div key={option.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-ink/10 bg-cream/60 p-3">
                              <div className="min-w-0">
                                <p className="text-sm font-extrabold text-ink">{option.name}</p>
                              </div>
                              <div className="grid grid-cols-[2.75rem_2.25rem_2.75rem] items-center gap-2" aria-label={`${option.name}: ${quantity} selected`}>
                                <button
                                  type="button"
                                  onClick={() => adjustDraftPizzaMix(option.id, -1)}
                                  disabled={!canDecrease}
                                  aria-label={`Decrease ${option.name} count`}
                                  className={buttonClass({ className: "min-h-11 min-w-11 px-0", variant: "icon" })}
                                >
                                  <DoughToolsIcon name="remove" size={20} strokeWidth={2.1} />
                                </button>
                                <span className="text-center text-lg font-extrabold tabular-nums">{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => adjustDraftPizzaMix(option.id, 1)}
                                  disabled={!canIncrease}
                                  aria-label={`Increase ${option.name} count`}
                                  className={buttonClass({ className: "min-h-11 min-w-11 px-0", variant: "icon" })}
                                >
                                  <DoughToolsIcon name="add" size={20} strokeWidth={2.1} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className={`mt-3 rounded-2xl px-3 py-2 text-xs font-extrabold ${
                        draftAllocatedCount === lockedPizzaCount ? "bg-leaf/10 text-leaf" : "bg-tomato/10 text-tomato"
                      }`} role="status">
                        Selected {draftAllocatedCount}/{lockedPizzaCount} pizzas.
                      </p>
                      {menuError && (
                        <p className="mt-3 rounded-2xl bg-tomato/10 px-3 py-2 text-sm font-bold leading-6 text-tomato" role="alert">
                          {menuError}
                        </p>
                      )}
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={closeMenuEditor}
                          className={buttonClass({ variant: "secondary" })}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={saveMenuChanges}
                          disabled={draftAllocatedCount !== lockedPizzaCount}
                          className={buttonClass()}
                        >
                          Save changes
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {confirmEarlyCompletion && waitInfo.waitLabel && (
                  <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="early-kitchen-step-heading">
                    <div className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white p-5 text-ink shadow-card">
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
                    <Link href="/session/timeline" className={buttonClass({ className: "w-full sm:w-auto", variant: "tertiary" })}>
                      View full schedule
                    </Link>
                  )}
                  primary={(
                    <Link href="/session/review" className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
                      Review my pizza
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
