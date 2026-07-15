import type {
  PizzaSession,
  PizzaSessionStepRuntimeMap,
  PizzaSessionTimelineStep,
} from "@/lib/pizza-session";
import { updatePizzaSession } from "@/lib/pizza-session-storage";

export type RuntimePizzaSessionTimelineStep = PizzaSessionTimelineStep & {
  plannedScheduledAt?: string;
  runtimeStartsAt?: string;
  runtimeEndsAt?: string;
  runtimeSourceStepId?: string;
};

export type EffectiveKitchenScheduleConflict = {
  delayMinutes: number;
  originalTargetAt: string;
  readyAt: string;
};

export type EffectiveKitchenSchedule = {
  conflict?: EffectiveKitchenScheduleConflict;
  steps: RuntimePizzaSessionTimelineStep[];
};

const DOUGH_WORK_STEP_IDS = new Set(["mix-dough", "ball-dough"]);
const FERMENTATION_STEP_IDS = new Set(["cold-ferment", "room-ferment", "ferment-dough"]);
const FIXED_REST_MINUTES = 30;
const DEFAULT_BALL_WORK_MINUTES = 60;
const DEFAULT_BALL_REST_MINUTES = 120;

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function minutesBetween(start?: string, end?: string) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) return undefined;
  const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : undefined;
}

export function isRuntimeDoughWorkStep(step?: Pick<PizzaSessionTimelineStep, "id" | "kind"> | null) {
  return Boolean(step && step.kind === "active" && DOUGH_WORK_STEP_IDS.has(step.id));
}

export function runtimeForStep(session: Pick<PizzaSession, "stepRuntime"> | undefined, stepId?: string) {
  if (!session || !stepId) return undefined;
  return session.stepRuntime?.[stepId];
}

export function hasStepActuallyStarted(session: Pick<PizzaSession, "stepRuntime"> | undefined, stepId?: string) {
  return Boolean(runtimeForStep(session, stepId)?.actualStartedAt);
}

export function hasStepActuallyCompleted(session: Pick<PizzaSession, "stepRuntime"> | undefined, stepId?: string) {
  return Boolean(runtimeForStep(session, stepId)?.actualCompletedAt);
}

export function getRuntimeDependentWaitDurationMinutes(
  steps: readonly PizzaSessionTimelineStep[],
  waitStepId: string,
) {
  const waitIndex = steps.findIndex((step) => step.id === waitStepId);
  if (waitIndex < 0) return undefined;
  const waitStep = steps[waitIndex];
  const nextStep = steps.slice(waitIndex + 1).find((step) => step.scheduledAt);
  return minutesBetween(waitStep.scheduledAt, nextStep?.scheduledAt);
}

function stepById(steps: readonly PizzaSessionTimelineStep[], stepId: string) {
  return steps.find((step) => step.id === stepId);
}

function fermentationStep(steps: readonly PizzaSessionTimelineStep[]) {
  return steps.find((step) => FERMENTATION_STEP_IDS.has(step.id));
}

function plannedGapMinutes(
  first?: Pick<PizzaSessionTimelineStep, "scheduledAt">,
  second?: Pick<PizzaSessionTimelineStep, "scheduledAt">,
  fallbackMinutes?: number,
) {
  return minutesBetween(first?.scheduledAt, second?.scheduledAt) ?? fallbackMinutes;
}

function runtimeCompletion(runtime: PizzaSessionStepRuntimeMap | undefined, stepId: string) {
  return parseDate(runtime?.[stepId]?.actualCompletedAt);
}

function effectiveStep(
  step: PizzaSessionTimelineStep,
  scheduledAt: Date | undefined,
  runtimeStartsAt?: Date,
  sourceStepId?: string,
): RuntimePizzaSessionTimelineStep {
  if (!scheduledAt) return step;
  const nextScheduledAt = scheduledAt.toISOString();
  if (step.scheduledAt === nextScheduledAt && !runtimeStartsAt) return step;
  return {
    ...step,
    plannedScheduledAt: step.scheduledAt,
    scheduledAt: nextScheduledAt,
    runtimeStartsAt: runtimeStartsAt?.toISOString(),
    runtimeEndsAt: nextScheduledAt,
    runtimeSourceStepId: sourceStepId,
  };
}

function latestDate(...values: Array<Date | undefined>) {
  const dates = values.filter((value): value is Date => Boolean(value));
  if (!dates.length) return undefined;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

export function deriveEffectiveKitchenSchedule(
  steps: readonly PizzaSessionTimelineStep[],
  runtime?: PizzaSessionStepRuntimeMap,
  targetAt?: string,
): EffectiveKitchenSchedule {
  const mixStep = stepById(steps, "mix-dough");
  const restStep = stepById(steps, "rest-dough");
  const fermentStep = fermentationStep(steps);
  const ballStep = stepById(steps, "ball-dough");
  const ballRestStep = stepById(steps, "room-temperature-rest");
  const preheatStep = stepById(steps, "preheat-oven");
  const bakeStep = stepById(steps, "bake-pizza");

  const fermentationMinutes = plannedGapMinutes(fermentStep, ballStep);
  const ballWorkMinutes = plannedGapMinutes(ballStep, ballRestStep, DEFAULT_BALL_WORK_MINUTES) ?? DEFAULT_BALL_WORK_MINUTES;
  const ballRestMinutes = plannedGapMinutes(ballRestStep, preheatStep ?? bakeStep, DEFAULT_BALL_REST_MINUTES) ?? DEFAULT_BALL_REST_MINUTES;

  const mixCompletedAt = runtimeCompletion(runtime, "mix-dough");
  const restCompletedAt = restStep ? runtimeCompletion(runtime, restStep.id) : undefined;
  const fermentationCompletedAt = fermentStep ? runtimeCompletion(runtime, fermentStep.id) : undefined;
  const ballCompletedAt = runtimeCompletion(runtime, "ball-dough");

  const restStartsAt = mixCompletedAt;
  const restEndsAt = restStartsAt ? addMinutes(restStartsAt, FIXED_REST_MINUTES) : undefined;

  const fermentationStartsAt = restCompletedAt ?? restEndsAt;
  const fermentationEndsAt = fermentationStartsAt && fermentationMinutes
    ? addMinutes(fermentationStartsAt, fermentationMinutes)
    : undefined;

  const ballStartsAt = fermentationCompletedAt ?? fermentationEndsAt;
  const projectedBallEnd = ballStartsAt ? addMinutes(ballStartsAt, ballWorkMinutes) : undefined;
  const ballRestStartsAt = ballCompletedAt
    ?? projectedBallEnd
    ?? undefined;
  const ballRestEndsAt = ballRestStartsAt ? addMinutes(ballRestStartsAt, ballRestMinutes) : undefined;

  const effectiveSteps = steps.map((step) => {
    if (step.id === "rest-dough") {
      return effectiveStep(step, restEndsAt, restStartsAt, "mix-dough");
    }
    if (FERMENTATION_STEP_IDS.has(step.id)) {
      return effectiveStep(step, fermentationEndsAt, fermentationStartsAt, "rest-dough");
    }
    if (step.id === "ball-dough") {
      return effectiveStep(step, ballStartsAt, fermentationStartsAt, fermentStep?.id);
    }
    if (step.id === "room-temperature-rest") {
      return effectiveStep(step, ballRestEndsAt, ballRestStartsAt, "ball-dough");
    }
    return step;
  });

  const originalTarget = parseDate(targetAt) ?? parseDate(bakeStep?.scheduledAt);
  const biologicalReadyAt = latestDate(ballRestEndsAt, fermentationEndsAt);
  const conflict = originalTarget && biologicalReadyAt && biologicalReadyAt.getTime() > originalTarget.getTime()
    ? {
      delayMinutes: Math.ceil((biologicalReadyAt.getTime() - originalTarget.getTime()) / 60_000),
      originalTargetAt: originalTarget.toISOString(),
      readyAt: biologicalReadyAt.toISOString(),
    }
    : undefined;

  return { steps: effectiveSteps, conflict };
}

export function applyPizzaSessionStepRuntime(
  steps: readonly PizzaSessionTimelineStep[],
  runtime?: PizzaSessionStepRuntimeMap,
): RuntimePizzaSessionTimelineStep[] {
  return deriveEffectiveKitchenSchedule(steps, runtime).steps;
}

export function runtimeMapWithStepStart(
  session: PizzaSession,
  stepId: string,
  now: Date,
): PizzaSessionStepRuntimeMap {
  const existing = session.stepRuntime ?? {};
  const current = existing[stepId] ?? {};
  return {
    ...existing,
    [stepId]: {
      ...current,
      actualStartedAt: current.actualStartedAt ?? now.toISOString(),
    },
  };
}

export function startPizzaSessionTimelineStep(
  session: PizzaSession,
  stepId: string,
  storage?: Storage,
  now = new Date(),
) {
  return updatePizzaSession(
    session.id,
    { stepRuntime: runtimeMapWithStepStart(session, stepId, now) },
    storage,
    now,
  );
}

export function runtimeMapWithStepCompletion(
  session: PizzaSession,
  stepId: string,
  now: Date,
): PizzaSessionStepRuntimeMap {
  const existing = session.stepRuntime ?? {};
  const current = existing[stepId] ?? {};
  const timestamp = now.toISOString();
  return {
    ...existing,
    [stepId]: {
      ...current,
      actualStartedAt: current.actualStartedAt ?? timestamp,
      actualCompletedAt: current.actualCompletedAt ?? timestamp,
    },
  };
}

export function completePizzaSessionTimelineStepRuntime(
  session: PizzaSession,
  stepId: string,
  storage?: Storage,
  now = new Date(),
) {
  return updatePizzaSession(
    session.id,
    { stepRuntime: runtimeMapWithStepCompletion(session, stepId, now) },
    storage,
    now,
  );
}

export function formatRuntimeClockTime(value?: string) {
  const date = parseDate(value);
  if (!date) return "Time not set";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
