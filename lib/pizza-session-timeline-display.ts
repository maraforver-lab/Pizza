import type { PizzaSession, PizzaSessionTimelineStep } from "@/lib/pizza-session";
import type { PlanningResult } from "@/lib/planning-result";

type TimelineDisplayInput = {
  steps: PizzaSessionTimelineStep[];
  planningResult?: PlanningResult | null;
  session?: Pick<PizzaSession, "doughStartMode" | "doughEarliestStartTime" | "targetEatTime" | "targetBakeTime"> | null;
};

export type ResolvedSessionDoughStartTime = {
  mode: "now" | "later" | "recommend";
  label: string;
  startsAt?: string;
  warning?: string;
};

function parsePlanningDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function sameDayRoomPlanning(result?: PlanningResult | null) {
  return Boolean(
    result
    && result.fermentationSetupRecommendation?.recommendedSetup === "same_day_room"
    && result.fermentationSetupRecommendation.recommendedFermentationMode === "room"
    && result.startWindowRecommendation?.category === "start_now"
    && result.availableFermentationHours > 0
    && result.availableFermentationHours < 8,
  );
}

function targetFromInput(
  planningResult?: PlanningResult | null,
  session?: Pick<PizzaSession, "targetEatTime" | "targetBakeTime"> | null,
) {
  return parsePlanningDate(planningResult?.technicalDetails.selectedTimeWindow.desiredBakeDateTime)
    ?? parsePlanningDate(session?.targetEatTime)
    ?? parsePlanningDate(session?.targetBakeTime);
}

function currentFromPlanning(planningResult?: PlanningResult | null) {
  return parsePlanningDate(planningResult?.technicalDetails.selectedTimeWindow.currentDateTime);
}

export function resolveSessionDoughStartTime({
  planningResult,
  session,
}: {
  planningResult?: PlanningResult | null;
  session?: Pick<PizzaSession, "doughStartMode" | "doughEarliestStartTime" | "targetEatTime" | "targetBakeTime"> | null;
}): ResolvedSessionDoughStartTime {
  const mode = session?.doughStartMode ?? "recommend";
  const current = currentFromPlanning(planningResult);
  const target = targetFromInput(planningResult, session);

  if (mode === "now") {
    if (!current) {
      return {
        mode,
        label: "Dough start: now",
        warning: "DoughTools could not confirm the current planning time, so the displayed timeline keeps the existing schedule.",
      };
    }
    return {
      mode,
      label: "Dough start: now",
      startsAt: current.toISOString(),
    };
  }

  if (mode === "later") {
    const laterStart = parsePlanningDate(session?.doughEarliestStartTime);
    if (!laterStart) {
      return {
        mode,
        label: "Dough start: later",
        warning: "Set a valid earliest dough start time to anchor the dough tasks.",
      };
    }
    if (target && laterStart.getTime() >= target.getTime()) {
      return {
        mode,
        label: "Dough start: later",
        warning: "The earliest dough start time is after the bake target, so the timeline keeps a cautious fallback.",
      };
    }
    return {
      mode,
      label: "Dough start: later",
      startsAt: laterStart.toISOString(),
    };
  }

  return {
    mode,
    label: "Dough start: DoughTools recommendation",
  };
}

function sameDayScheduleIso(step: PizzaSessionTimelineStep, current: Date, target: Date) {
  const availableMinutes = minutesBetween(current, target);
  const safeBeforeTarget = (minutes: number) => addMinutes(target, -Math.min(minutes, Math.max(0, availableMinutes - 15))).toISOString();

  if (step.id === "mix-dough") return current.toISOString();
  if (step.id === "rest-dough") return addMinutes(current, Math.min(30, Math.max(0, availableMinutes - 180))).toISOString();
  if (step.id === "ball-dough") return safeBeforeTarget(180);
  if (step.id === "room-temperature-rest") return safeBeforeTarget(150);
  if (step.id === "preheat-oven") return safeBeforeTarget(60);
  if (step.id === "prepare-sauce-toppings") return safeBeforeTarget(45);
  if (step.id === "bake-pizza") return target.toISOString();
  if (step.id === "review-result") return addMinutes(target, 20).toISOString();
  return step.scheduledAt;
}

function safeColdStartIso(step: PizzaSessionTimelineStep, current: Date) {
  if (step.id === "mix-dough") return current.toISOString();
  if (step.id === "rest-dough") return addMinutes(current, 30).toISOString();
  if (step.id === "cold-ferment") return addMinutes(current, 60).toISOString();
  return step.scheduledAt;
}

function explicitDoughStartColdIso(step: PizzaSessionTimelineStep, start: Date) {
  if (step.id === "mix-dough") return start.toISOString();
  if (step.id === "rest-dough") return addMinutes(start, 30).toISOString();
  if (step.id === "cold-ferment") return addMinutes(start, 60).toISOString();
  return step.scheduledAt;
}

function shouldUseSameDayFromResolvedStart(start: Date, target: Date) {
  const hours = minutesBetween(start, target) / 60;
  return hours > 0 && hours < 8;
}

export function timelineStepsForPlanningSummaryDisplay({
  steps,
  planningResult,
  session,
}: TimelineDisplayInput): PizzaSessionTimelineStep[] {
  const current = currentFromPlanning(planningResult);
  const target = targetFromInput(planningResult, session);
  if (!current || !target) return steps;

  const resolvedStart = resolveSessionDoughStartTime({ planningResult, session });
  const explicitStart = resolvedStart.mode !== "recommend" ? parsePlanningDate(resolvedStart.startsAt) : undefined;
  if (explicitStart) {
    if (shouldUseSameDayFromResolvedStart(explicitStart, target)) {
      return steps.flatMap((step) => {
        if (step.id === "cold-ferment") return [];
        const scheduledAt = sameDayScheduleIso(step, explicitStart, target);
        const sameDayCopy = step.id === "rest-dough"
          ? {
            label: "Room fermentation",
            description: "Keep the dough covered at room temperature for this same-day plan.",
            helperCopy: "Same-day timing uses your dough start availability instead of a cold overnight step.",
            beginnerNote: "Keep the dough covered and let it rise at room temperature.",
            enthusiastNote: "Room fermentation is the practical fit when baking later today.",
            pizzaNerdNote: "This is display-only alignment with dough start availability; stored timeline status is unchanged.",
          }
          : step.id === "room-temperature-rest"
            ? {
              label: "Final room rest",
              description: "Let the dough finish relaxing at room temperature before opening.",
              helperCopy: "Same-day timing keeps this as a final room rest, not a cold-dough warm-up.",
              beginnerNote: "Keep the dough covered until it feels relaxed enough to open.",
              enthusiastNote: "Use this final rest to make the dough easier to stretch.",
              pizzaNerdNote: "The displayed room rest is aligned with dough start availability; stored timeline status is unchanged.",
            }
          : {};

        return [{
          ...step,
          ...sameDayCopy,
          scheduledAt,
          quietHoursWarning: undefined,
        }];
      });
    }

    return steps.map((step) => {
      if (!["mix-dough", "rest-dough", "cold-ferment"].includes(step.id)) return step;
      return {
        ...step,
        scheduledAt: explicitDoughStartColdIso(step, explicitStart),
        quietHoursWarning: undefined,
      };
    });
  }

  if (!sameDayRoomPlanning(planningResult)) {
    const startWindowCategory = planningResult?.startWindowRecommendation?.category;
    const canSafelyShiftPastStart = startWindowCategory === "day_before" || startWindowCategory === "evening_before";
    const hasPastDoughStart = steps.some((step) => (
      ["mix-dough", "rest-dough", "cold-ferment"].includes(step.id)
      && step.scheduledAt
      && new Date(step.scheduledAt).getTime() < current.getTime()
    ));
    if (!hasPastDoughStart || !canSafelyShiftPastStart) return steps;

    return steps.map((step) => {
      if (!["mix-dough", "rest-dough", "cold-ferment"].includes(step.id)) return step;
      return {
        ...step,
        scheduledAt: safeColdStartIso(step, current),
        quietHoursWarning: undefined,
      };
    });
  }

  return steps.flatMap((step) => {
    if (step.id === "cold-ferment") return [];
    const scheduledAt = sameDayScheduleIso(step, current, target);
    const sameDayCopy = step.id === "rest-dough"
      ? {
        label: "Room fermentation",
        description: "Keep the dough covered at room temperature for this same-day plan.",
        helperCopy: "Same-day timing uses room fermentation instead of a cold overnight step.",
        beginnerNote: "Keep the dough covered and let it rise at room temperature.",
        enthusiastNote: "Room fermentation is the practical fit when baking later today.",
        pizzaNerdNote: "This is display-only alignment with the planning summary; stored timeline status is unchanged.",
      }
      : step.id === "room-temperature-rest"
        ? {
          label: "Final room rest",
          description: "Let the dough finish relaxing at room temperature before opening.",
          helperCopy: "Same-day timing keeps this as a final room rest, not a cold-dough warm-up.",
          beginnerNote: "Keep the dough covered until it feels relaxed enough to open.",
          enthusiastNote: "Use this final rest to make the dough easier to stretch.",
          pizzaNerdNote: "The displayed room rest is aligned with same-day room fermentation; stored timeline status is unchanged.",
        }
      : {};

    return [{
      ...step,
      ...sameDayCopy,
      scheduledAt,
      quietHoursWarning: undefined,
    }];
  });
}
