"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomActionBar, buttonClass } from "@/components/design-system";
import { DoughToolsIcon } from "@/components/icons";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { clearKitchenBakeTimerState, KitchenBakeTimerPanel } from "@/components/session/KitchenBakeTimerPanel";
import { SessionExperienceLevelBadge } from "@/components/session/SessionExperienceLevelBadge";
import { SessionRouteState } from "@/components/session/SessionRouteState";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import { normalizeAccountPreferencesRow } from "@/lib/account-preferences";
import { resolveCanonicalActivePizzaSession } from "@/lib/canonical-active-pizza-session";
import { getExperienceLevelConfig } from "@/lib/experience-levels";
import { queueCloudActivePizzaSessionSave } from "@/lib/cloud-pizza-session-client";
import { buildContextualReturnHref } from "@/lib/contextual-return";
import { getDoughGuideLinkForSessionStep } from "@/lib/dough-guide-links";
import {
  type PizzaSession,
  type PizzaSessionPizzaMix,
  type PizzaSessionPizzaMixType,
} from "@/lib/pizza-session";
import { getPizzaSessionBakingTroubleshootingLink } from "@/lib/pizza-session-troubleshooting-links";
import { formatTimelineLiveTiming } from "@/lib/timeline-live-timing";
import { getPizzaSessionBakeProfileForSession } from "@/lib/pizza-session-bake-profile";
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
  formatKitchenMixingWindowStatus,
  formatKitchenFermentationCountdown,
  formatKitchenPlannedDuration,
  formatKitchenRestCountdown,
  getKitchenFermentationMobileSummary,
  getKitchenExperienceGuidance,
  getKitchenModeForStep,
  getKitchenModeState,
  getKitchenPlannedFermentationDurationMinutes,
  getKitchenRestNextFermentationLabel,
  getKitchenStepWaitInfo,
  getKitchenTaskPresentation,
  getEarlyTimedKitchenCompletionWarning,
  isMixDoughStep,
  isBiologicalKitchenWaitStep,
  isKitchenFermentationStep,
  isRestDoughStep,
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

function kitchenProgressPercent(currentIndex: number, totalCount: number) {
  if (!totalCount || totalCount < 1) return 0;
  return Math.min(100, Math.max(0, ((currentIndex + 1) / totalCount) * 100));
}

const duplicateDoneCueStepIds = new Set(["mix-dough"]);

function shouldShowKitchenCompletionCue(stepId: string | undefined, instruction: string, doneCondition: string) {
  if (!doneCondition.trim()) return false;
  if (stepId && duplicateDoneCueStepIds.has(stepId)) return false;
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const normalizedInstruction = normalize(instruction);
  const normalizedCondition = normalize(doneCondition);
  return normalizedCondition.length > 0 && !normalizedInstruction.includes(normalizedCondition);
}

function formatKitchenDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60_000));
  if (totalMinutes < 1) return "less than 1 min";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours ? `${hours} h` : "", minutes ? `${minutes} min` : ""].filter(Boolean).join(" ") || "0 min";
}

function formatKitchenOverdueValue(value?: string) {
  if (!value) return "Overdue";
  return `${value.replace("−", "").trim()} overdue`;
}

function compactKitchenTiming(
  step: RuntimePizzaSessionTimelineStep | undefined,
  session: PizzaSession,
  liveTiming: ReturnType<typeof formatTimelineLiveTiming>,
  now: Date,
  hasStarted: boolean,
) {
  const plannedClock = formatRuntimeClockTime(step?.scheduledAt);
  const actualStartedAt = step?.id ? session.stepRuntime?.[step.id]?.actualStartedAt : undefined;
  if (hasStarted && actualStartedAt) {
    const started = new Date(actualStartedAt);
    const elapsed = Number.isFinite(started.getTime()) ? formatKitchenDuration(now.getTime() - started.getTime()) : undefined;
    return {
      primary: elapsed ? `Active for ${elapsed}` : "Step active",
      secondary: `Started ${formatRuntimeClockTime(actualStartedAt)}`,
    };
  }
  if (liveTiming.kind === "overdue") {
    return {
      primary: formatKitchenOverdueValue(liveTiming.value),
      secondary: `Planned ${plannedClock}`,
    };
  }
  if (liveTiming.kind === "future") {
    return {
      primary: liveTiming.label,
      secondary: `Planned ${plannedClock}`,
    };
  }
  if (liveTiming.kind === "ready") {
    return {
      primary: "Ready now",
      secondary: `Planned ${plannedClock}`,
    };
  }
  return {
    primary: "Timing not set",
    secondary: "Follow the saved timeline order.",
  };
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
  if (step?.id === "mix-dough") return "Mixing complete";
  if (step?.id === "rest-dough") return "Rest complete";
  if (step?.id === "cold-ferment" || step?.id === "room-ferment" || step?.id === "ferment-dough") return "Fermentation complete";
  if (step?.id === "ball-dough") return "Balling complete";
  if (step?.id === "room-temperature-rest") return "Ball rest complete";
  if (step?.id === "preheat-oven") return "Oven preheated";
  if (step?.id === "prepare-sauce-toppings") return "Sauce and toppings ready";
  if (step?.id === "bake-pizza") return "Done baking? Review session";
  return "Step complete";
}

const bakingTroubleshootingLink = getPizzaSessionBakingTroubleshootingLink("Something looks wrong? Open baking troubleshooting");
const EARLY_COMPLETION_PREFERENCE_ENFORCED = false;

type EarlyCompletionPreferenceState = {
  allowEarlyTimedStepCompletion: boolean;
  loaded: boolean;
  signedIn: boolean;
};

const defaultEarlyCompletionPreference: EarlyCompletionPreferenceState = {
  allowEarlyTimedStepCompletion: false,
  loaded: false,
  signedIn: false,
};

export default function SessionKitchenPage() {
  const [ready, setReady] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [confirmEarlyCompletion, setConfirmEarlyCompletion] = useState(false);
  const [menuEditorOpen, setMenuEditorOpen] = useState(false);
  const [draftPizzaMix, setDraftPizzaMix] = useState<PizzaSessionPizzaMix | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [earlyCompletionPreference, setEarlyCompletionPreference] = useState<EarlyCompletionPreferenceState>(defaultEarlyCompletionPreference);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const menuDialogRef = useRef<HTMLDivElement | null>(null);
  const primaryActionRef = useRef<HTMLButtonElement | null>(null);
  const earlyDialogRef = useRef<HTMLDivElement | null>(null);
  const earlyKeepWaitingRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    let mounted = true;
    async function openKitchen() {
      try {
        const canonical = await resolveCanonicalActivePizzaSession();
        if (!mounted) return;
        if (canonical.state === "error") {
          setRouteError(true);
          return;
        }
        setSession(canonical.state === "active" ? canonical.session : null);
        setCurrentTime(new Date());
      } catch {
        if (mounted) setRouteError(true);
      } finally {
        if (mounted) setReady(true);
      }
    }
    void openKitchen();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setInterval(() => setCurrentTime(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    let mounted = true;
    async function loadEarlyCompletionPreference() {
      try {
        const response = await fetch("/api/account/preferences", { method: "GET" });
        if (response.status === 401) {
          if (mounted) setEarlyCompletionPreference({ ...defaultEarlyCompletionPreference, loaded: true });
          return;
        }
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not load account preferences.");
        const preferences = normalizeAccountPreferencesRow(payload.preferences);
        if (mounted) {
          setEarlyCompletionPreference({
            allowEarlyTimedStepCompletion: preferences.allowEarlyTimedStepCompletion,
            loaded: true,
            signedIn: true,
          });
        }
      } catch {
        if (mounted) setEarlyCompletionPreference({ ...defaultEarlyCompletionPreference, loaded: true });
      }
    }

    loadEarlyCompletionPreference();
    return () => {
      mounted = false;
    };
  }, []);

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

  useEffect(() => {
    if (!confirmEarlyCompletion) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallbackFocus = primaryActionRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setConfirmEarlyCompletion(false);
        return;
      }
      if (event.key === "Tab" && earlyDialogRef.current) {
        const focusable = Array.from(earlyDialogRef.current.querySelectorAll<HTMLElement>(
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
    window.setTimeout(() => earlyKeepWaitingRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.setTimeout(() => {
        if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
        else fallbackFocus?.focus();
      }, 0);
    };
  }, [confirmEarlyCompletion]);

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
  const now = currentTime ?? new Date();
  const currentLiveTiming = formatTimelineLiveTiming(currentStep?.scheduledAt, now);
  const nextLiveTiming = formatTimelineLiveTiming(kitchenState.nextStep?.scheduledAt, now);
  const currentStepIsRuntimeWork = isRuntimeDoughWorkStep(currentStep);
  const currentStepHasStarted = hasStepActuallyStarted(session, currentStep?.id);
  const currentStepIsBiologicalWait = isBiologicalKitchenWaitStep(currentStep);
  const currentStepIsMixDough = isMixDoughStep(currentStep);
  const currentStepIsRestDough = isRestDoughStep(currentStep);
  const currentStepIsFermentation = isKitchenFermentationStep(currentStep);
  const currentStepIsBakePizza = currentStep?.id === "bake-pizza";
  const currentStepCompletionBlocked = currentStepIsBiologicalWait && waitInfo.isTooEarly;
  const accountAllowsEarlyTimedCompletion = !EARLY_COMPLETION_PREFERENCE_ENFORCED
    || (
      earlyCompletionPreference.signedIn
      && earlyCompletionPreference.allowEarlyTimedStepCompletion
    );
  const currentStepCanConfirmEarlyCompletion = currentStepCompletionBlocked && accountAllowsEarlyTimedCompletion;
  const primaryActionDisabled = currentStepCompletionBlocked && !currentStepCanConfirmEarlyCompletion;
  const bakeProfile = getPizzaSessionBakeProfileForSession(session);
  const showBakeTimer = currentStep?.id === "bake-pizza";
  const showToppingBalanceLink = currentStep?.id === "prepare-sauce-toppings";
  const doughGuideLink = getDoughGuideLinkForSessionStep(currentStep, "/session/kitchen");
  const ovenTroubleshootingLink = isOvenTroubleshootingStep(currentStep) ? bakingTroubleshootingLink : null;
  const doughGuideHref = doughGuideLink ? buildContextualReturnHref(doughGuideLink.href) : null;
  const ovenTroubleshootingHref = ovenTroubleshootingLink ? buildContextualReturnHref(ovenTroubleshootingLink.href) : null;
  const nextStepSummary = kitchenState.nextStep
    ? `${nextTaskPresentation.title} at ${formatRuntimeClockTime(kitchenState.nextStep.scheduledAt)}`
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
  const progressPercent = kitchenProgressPercent(kitchenState.currentIndex, kitchenState.totalCount);
  const progressLabel = `Step ${kitchenState.currentIndex + 1} of ${kitchenState.totalCount}`;
  const timing = compactKitchenTiming(currentRuntimeStep, session, currentLiveTiming, now, currentStepHasStarted);
  const compactMobileStatusHiddenClass = currentStepIsMixDough || currentStepIsRestDough || currentStepIsFermentation || currentStepIsBakePizza ? "max-sm:hidden " : "";
  const compactTimingHiddenClass = currentStepIsBakePizza ? "hidden " : compactMobileStatusHiddenClass;
  const timedWaitMobileHiddenClass = currentStepIsRestDough || currentStepIsFermentation ? "max-sm:hidden " : "";
  const restMobileHiddenClass = currentStepIsRestDough ? "max-sm:hidden " : "";
  const mixMobileHiddenClass = currentStepIsMixDough ? "max-sm:hidden " : "";
  const mixWindowStatus = formatKitchenMixingWindowStatus(
    currentStepIsMixDough ? session.stepRuntime?.[currentStep?.id ?? ""]?.actualStartedAt : undefined,
    now,
  );
  const restCountdown = formatKitchenRestCountdown(currentStep?.scheduledAt, now);
  const restReadyClock = formatRuntimeClockTime(currentStep?.scheduledAt);
  const restNextFermentationLabel = getKitchenRestNextFermentationLabel(session, kitchenState.nextStep);
  const restNextFermentationDuration = formatKitchenPlannedDuration(
    getKitchenPlannedFermentationDurationMinutes(session.timeline?.steps),
  );
  const fermentationMobileSummary = getKitchenFermentationMobileSummary(session, currentStep);
  const fermentationCountdown = formatKitchenFermentationCountdown(currentStep?.scheduledAt, now);
  const earlyCompletionWarning = currentStepCanConfirmEarlyCompletion
    ? getEarlyTimedKitchenCompletionWarning(currentStep, waitInfo.remainingMinutes)
    : undefined;
  const showCompletionCue = shouldShowKitchenCompletionCue(
    currentStep?.id,
    taskPresentation.shortInstruction,
    taskPresentation.doneCondition,
  );
  const moreGuidanceDisclosure = (
    <details className="mt-4 rounded-[1.25rem] border border-ink/10 bg-white/70 p-4">
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

        {showToppingBalanceLink && (
          <div className="rounded-[1.25rem] border border-ink/10 bg-white/65 p-4">
            <p className="text-sm font-bold leading-6 text-ink/60">
              Review sauce, cheese and topping amounts if the pizza may become too wet or heavily loaded.
            </p>
            <Link
              href="/toppings"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white/80 px-4 text-sm font-extrabold text-ink/60 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-fit"
            >
              Check topping balance
            </Link>
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
  );

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
    const now = new Date();
    setCompletionError(null);
    const result = completeKitchenTimelineStep(session, currentStep, undefined, now);
    if (!result.ok) {
      setConfirmEarlyCompletion(false);
      setCurrentTime(now);
      setCompletionError("We couldn’t complete this step. Your progress is still safe. Try again.");
      return;
    }
    const updated = result.session;
    if (result.completedStepId === "bake-pizza") clearKitchenBakeTimerState(session.id);
    queueKitchenProgressSync(updated);
    setConfirmEarlyCompletion(false);
    setCurrentTime(now);
    setSession(updated);
  };

  const startCurrentStep = () => {
    if (!session || !currentStep || !currentStepIsRuntimeWork) return;
    const now = new Date();
    const updated = startPizzaSessionTimelineStep(session, currentStep.id, undefined, now);
    if (!updated) return;
    setCompletionError(null);
    queueKitchenProgressSync(updated);
    setCurrentTime(now);
    setSession(updated);
  };

  const markDone = () => {
    if (!currentStep) return;
    setCompletionError(null);
    if (currentStepCompletionBlocked) {
      setCurrentTime(new Date());
      if (currentStepCanConfirmEarlyCompletion) {
        setConfirmEarlyCompletion(true);
      }
      return;
    }
    if (currentStepIsRuntimeWork && !currentStepHasStarted) {
      startCurrentStep();
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
                  <div className="min-w-0 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <SessionExperienceLevelBadge level={session.experienceLevel} compact />
                      <p className={`${compactMobileStatusHiddenClass}text-xs font-extrabold uppercase tracking-[.16em] text-ink/45`}>{kitchenState.currentIndex + 1} / {kitchenState.totalCount}</p>
                    </div>

                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-ink/10"
                      role="progressbar"
                      aria-label={`Kitchen progress: ${progressLabel}`}
                      aria-valuemin={1}
                      aria-valuemax={kitchenState.totalCount}
                      aria-valuenow={kitchenState.currentIndex + 1}
                    >
                      <div className="h-full rounded-full bg-ink/65" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="min-w-0">
                      <p className={`${compactMobileStatusHiddenClass}text-xs font-extrabold uppercase tracking-[.18em] text-tomato`}>Current step</p>
                      <h1 id="current-kitchen-task" className="mt-2 font-display text-4xl font-semibold leading-none sm:text-6xl">
                        {currentStepIsRestDough ? (
                          <>
                            <span className="sm:hidden">Dough is resting</span>
                            <span className="max-sm:hidden">{taskPresentation.title}</span>
                          </>
                        ) : currentStepIsMixDough ? (
                          <>
                            <span className="sm:hidden">Mix the dough</span>
                            <span className="max-sm:hidden">{taskPresentation.title}</span>
                          </>
                        ) : currentStepIsFermentation ? (
                          <>
                            <span className="sm:hidden">{fermentationMobileSummary.title}</span>
                            <span className="max-sm:hidden">{taskPresentation.title}</span>
                          </>
                        ) : taskPresentation.title}
                      </h1>
                    </div>

                    {currentStepIsMixDough && (
                      <div id="kitchen-mix-mobile-status" className="grid gap-3 border-y border-ink/10 py-3 sm:hidden" aria-label="Mix dough status" aria-live="polite">
                        <div className="flex items-start gap-3">
                          <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tomato/10 text-tomato" aria-hidden="true">
                            <DoughToolsIcon name="mixing-bowl" size={20} strokeWidth={2.1} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-base font-extrabold leading-6 text-ink">Start mixing now</p>
                            <p className="mt-1 font-display text-4xl font-semibold leading-none tabular-nums text-ink">{mixWindowStatus}</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-ink/65">You have up to 30 minutes to mix the dough.</p>
                          </div>
                        </div>
                        <p className="text-sm font-extrabold leading-6 text-ink/65">
                          <span className="text-ink">Next:</span> Dough rest for 30 min
                        </p>
                      </div>
                    )}

                    {currentStepIsRestDough && (
                      <div id="kitchen-rest-mobile-status" className="grid gap-3 border-y border-ink/10 py-3 sm:hidden" aria-label="Dough rest status" aria-live="polite">
                        <div>
                          <p className="font-display text-4xl font-semibold leading-none tabular-nums text-ink">{restCountdown}</p>
                          <p className="mt-1 text-sm font-extrabold leading-6 text-ink/55">Ready at {restReadyClock}</p>
                        </div>
                        <div className="grid gap-1 text-sm font-bold leading-6 text-ink/65">
                          <p><span className="font-extrabold text-ink">Next:</span> {restNextFermentationLabel}</p>
                          {restNextFermentationDuration && (
                            <p><span className="font-extrabold text-ink">Planned duration:</span> {restNextFermentationDuration}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {currentStepIsFermentation && (
                      <div id="kitchen-fermentation-mobile-status" className="grid gap-3 border-y border-ink/10 py-3 sm:hidden" aria-label="Fermentation status" aria-live="polite">
                        <div>
                          <p className="text-sm font-bold leading-6 text-ink/65">{fermentationMobileSummary.location}</p>
                          <p className="mt-2 font-display text-4xl font-semibold leading-none tabular-nums text-ink">{fermentationCountdown}</p>
                        </div>
                        <div className="grid gap-1 text-sm font-bold leading-6 text-ink/65">
                          <p>Before leaving the dough to ferment, develop it briefly as instructed by folding, stretching or kneading.</p>
                          <p>{fermentationMobileSummary.prepInstruction}</p>
                          <p><span className="font-extrabold text-ink">Next:</span> Divide and shape the dough into balls</p>
                        </div>
                      </div>
                    )}

                    <div className={`${compactTimingHiddenClass}grid gap-2 border-y border-ink/10 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center`}>
                      <div aria-live="polite">
                        <p className={`text-lg font-extrabold leading-7 sm:text-xl ${
                          currentLiveTiming.kind === "overdue" ? "text-tomato" : "text-ink"
                        }`}>
                          {timing.primary}
                        </p>
                        <p className="text-xs font-bold leading-5 text-ink/50">{timing.secondary}</p>
                      </div>
                      <p className="text-sm font-extrabold leading-6 text-ink/60 sm:text-right" aria-label="Compact next-step preview">
                        <span className="text-ink/40">Next:</span> {nextStepSummary}
                        {kitchenState.nextStep && nextLiveTiming.kind !== "unknown" && (
                          <span className="font-bold text-ink/45"> · {nextLiveTiming.label}{nextLiveTiming.value ? ` ${nextLiveTiming.value}` : ""}</span>
                        )}
                      </p>
                    </div>

                    {kitchenState.executionConflict && (
                      <div className="rounded-[1.25rem] border border-tomato/20 bg-tomato/[.08] p-4" role="status">
                        <p className="text-sm font-extrabold leading-6 text-tomato">
                          This dough process is running {formatKitchenDuration(kitchenState.executionConflict.delayMinutes * 60_000)} late.
                        </p>
                        <p className="mt-1 text-sm font-bold leading-6 text-ink/65">
                          Dough readiness is now {formatKitchenStepTime(kitchenState.executionConflict.readyAt)}. Original target: {formatKitchenStepTime(kitchenState.executionConflict.originalTargetAt)}.
                        </p>
                      </div>
                    )}

                    <section className="rounded-[1.25rem] bg-cream/80 p-4" aria-labelledby="kitchen-step-guidance-heading">
                      <p id="kitchen-step-guidance-heading" className="sr-only">Current task instruction</p>
                      {currentStepIsMixDough && (
                        <div className="grid gap-3 sm:hidden">
                          <p className="text-lg font-extrabold leading-7 text-ink">Weigh the ingredients and mix until no dry flour remains. Cover the dough when finished.</p>
                          <p className="text-sm font-bold leading-6 text-ink/65">When the dough is mixed, press Mixing complete. The 30-minute dough rest starts from that moment.</p>
                        </div>
                      )}
                      <p className={`${mixMobileHiddenClass}${currentStepIsFermentation ? "max-sm:hidden " : ""}text-lg font-extrabold leading-7 text-ink sm:text-2xl sm:leading-8`}>{taskPresentation.shortInstruction}</p>
                      {currentStepIsRestDough && (
                        <p className="mt-2 text-sm font-bold leading-6 text-ink/65 sm:hidden">
                          Keep the dough covered until the timer reaches zero.
                        </p>
                      )}
                      {showCompletionCue && (
                        <p className={`${timedWaitMobileHiddenClass}mt-2 text-sm font-bold leading-6 text-ink/65`}>
                          <span className="font-extrabold text-ink">Ready when:</span> {taskPresentation.doneCondition}
                        </p>
                      )}

                      {!currentStepIsBakePizza && moreGuidanceDisclosure}
                    </section>
                  </div>

                  {showBakeTimer && (
                    <KitchenBakeTimerPanel
                      sessionId={session.id}
                      durationSeconds={bakeProfile.bakeDurationSeconds}
                      durationLabel={bakeProfile.bakeTimeLabel}
                      ovenType={bakeProfile.ovenType}
                      ovenLabel={bakeProfile.label}
                      pizzaCount={lockedPizzaCount}
                    />
                  )}

                  {currentStepIsBakePizza && moreGuidanceDisclosure}

                  {!currentStepIsBakePizza && waitInfo.isTooEarly && waitInfo.waitLabel && (
                    <div id="kitchen-wait-status" className={`${timedWaitMobileHiddenClass}mt-5 rounded-[1.25rem] border border-tomato/20 bg-tomato/[.08] p-4`} role="status">
                      <p className="text-sm font-extrabold leading-6 text-tomato">
                        {waitInfo.waitLabel} before this step.
                      </p>
                      <p className="mt-1 text-sm font-bold leading-6 text-ink/65">
                        {currentStepIsBiologicalWait ? "This step is ready at" : "This step is scheduled for"} {formatKitchenStepTime(currentStep.scheduledAt)}.
                      </p>
                    </div>
                  )}
                </section>

                {kitchenMode === "dough" && isMixDoughStep(currentStep) && ingredients.length > 0 && (
                   <section className="mt-5 rounded-[1.25rem] bg-cream/80 p-4 sm:mt-6 sm:p-5" aria-labelledby="kitchen-needed-now-heading">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Needed now</p>
                    <h3 id="kitchen-needed-now-heading" className="mt-1 font-display text-2xl font-semibold">Dough ingredients</h3>
                     <dl className="mt-3 grid gap-2">
                       {ingredients.map((line) => (
                         <div key={line.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-ink/10 pb-2 last:border-b-0 last:pb-0">
                          <dt className="min-w-0 text-sm font-extrabold text-ink/65">{line.label}</dt>
                          <dd className="text-right text-lg font-extrabold tabular-nums text-ink">{line.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}

                {kitchenMode === "dough" && isMixDoughStep(currentStep) && ingredients.length === 0 && (
                   <section className="mt-5 rounded-[1.5rem] bg-cream p-4 sm:mt-6 sm:p-5">
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Needed now</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold">Ingredient amounts unavailable</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/60">Kitchen Mode can still guide the current task. Exact dough amounts need a saved recipe snapshot.</p>
                  </section>
                )}

                {currentStep.quietHoursWarning && (
                  <p className="mt-5 rounded-2xl bg-tomato/10 p-4 text-sm font-bold leading-6 text-tomato">
                    Quiet-hours warning: {currentStep.quietHoursWarning}
                  </p>
                )}

                {completionError && (
                  <div className="mt-5 rounded-[1.25rem] border border-tomato/20 bg-tomato/[.08] p-4" role="alert">
                    <p className="text-sm font-extrabold leading-6 text-tomato">{completionError}</p>
                    <button
                      type="button"
                      onClick={completeCurrentStep}
                      className="mt-3 inline-flex min-h-10 items-center justify-center rounded-2xl border border-tomato/25 bg-white px-4 text-sm font-extrabold text-tomato transition hover:border-tomato/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <BottomActionBar
                  className="max-sm:[&>div:first-child]:hidden"
                  back={(
                    <div className="grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-center">
                      <div className="min-w-0 rounded-2xl border border-ink/10 bg-white/70 px-3 py-2">
                        <p id="kitchen-menu-summary-heading" className="sr-only">Pizza menu</p>
                        <p className="truncate text-xs font-extrabold leading-5 text-ink">{currentPizzaMixSummary}</p>
                        <p className="text-[11px] font-bold leading-4 text-ink/45">
                          {menuLocked
                            ? "Menu locked once baking starts."
                            : lockedPizzaCount
                              ? "Locked total."
                              : "Needs saved pizza count."}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          ref={menuTriggerRef}
                          type="button"
                          onClick={openMenuEditor}
                          disabled={!menuCanEdit}
                          aria-describedby="kitchen-menu-summary-heading"
                          className={buttonClass({ className: "w-full sm:w-auto", variant: "secondary" })}
                        >
                          Change pizza menu
                        </button>
                        <Link href="/session/timeline" className={buttonClass({ className: "w-full sm:w-auto", variant: "tertiary" })}>
                          View full schedule
                        </Link>
                      </div>
                      {menuError && !menuEditorOpen && (
                        <p className="rounded-2xl bg-tomato/10 px-3 py-2 text-xs font-extrabold text-tomato sm:col-span-2" role="status">
                          {menuError}
                        </p>
                      )}
                    </div>
                  )}
                  primary={(
                    <button
                      ref={primaryActionRef}
                      type="button"
                      onClick={markDone}
                      disabled={primaryActionDisabled}
                      aria-describedby={currentStepCompletionBlocked ? "kitchen-wait-status" : undefined}
                      className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-ink/45 sm:w-auto"
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

                {confirmEarlyCompletion && earlyCompletionWarning && (
                  <div
                    className="fixed inset-0 z-[70] grid place-items-center bg-ink/40 px-4 py-6 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="early-kitchen-step-heading"
                    aria-describedby="early-kitchen-step-description"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) setConfirmEarlyCompletion(false);
                    }}
                  >
                    <div
                      ref={earlyDialogRef}
                      tabIndex={-1}
                      onMouseDown={(event) => event.stopPropagation()}
                      className="relative z-[71] max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white p-5 text-ink shadow-card focus:outline-none"
                    >
                      <h2 id="early-kitchen-step-heading" className="font-display text-3xl font-semibold leading-none">
                        {earlyCompletionWarning.title}
                      </h2>
                      <p id="early-kitchen-step-description" className="mt-3 text-sm font-bold leading-6 text-ink/65">
                        {earlyCompletionWarning.description}
                      </p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <button
                          ref={earlyKeepWaitingRef}
                          type="button"
                          onClick={() => setConfirmEarlyCompletion(false)}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                        >
                          Keep waiting
                        </button>
                        <button
                          type="button"
                          onClick={completeCurrentStep}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-tomato/25 bg-white px-5 text-sm font-extrabold text-tomato transition hover:border-tomato/45 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                        >
                          Mark complete early
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
                    <Link href="/session/timeline" className={buttonClass({ className: "max-sm:hidden w-full sm:w-auto", variant: "tertiary" })}>
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
