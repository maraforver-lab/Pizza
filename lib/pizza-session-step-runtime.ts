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

const DOUGH_WORK_STEP_IDS = new Set(["mix-dough", "ball-dough"]);

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

export function applyPizzaSessionStepRuntime(
  steps: readonly PizzaSessionTimelineStep[],
  runtime?: PizzaSessionStepRuntimeMap,
): RuntimePizzaSessionTimelineStep[] {
  return steps.map((step, index) => {
    const previousStep = steps[index - 1];
    const previousRuntime = previousStep ? runtime?.[previousStep.id] : undefined;
    const waitDurationMinutes = step.kind === "passive"
      ? getRuntimeDependentWaitDurationMinutes(steps, step.id)
      : undefined;
    const completedPreviousWorkAt = parseDate(previousRuntime?.actualCompletedAt);
    const shouldRunFromPreviousCompletion = Boolean(
      completedPreviousWorkAt
      && waitDurationMinutes
      && previousStep
      && isRuntimeDoughWorkStep(previousStep),
    );

    if (!shouldRunFromPreviousCompletion || !completedPreviousWorkAt || !waitDurationMinutes || !previousStep) {
      return step;
    }

    const runtimeEndsAt = addMinutes(completedPreviousWorkAt, waitDurationMinutes).toISOString();
    return {
      ...step,
      plannedScheduledAt: step.scheduledAt,
      scheduledAt: runtimeEndsAt,
      runtimeStartsAt: completedPreviousWorkAt.toISOString(),
      runtimeEndsAt,
      runtimeSourceStepId: previousStep.id,
    };
  });
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
