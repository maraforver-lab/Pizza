import type { PizzaSessionTimelineStep } from "@/lib/pizza-session";
import type { PlanningResult } from "@/lib/planning-result";

type TimelineDisplayInput = {
  steps: PizzaSessionTimelineStep[];
  planningResult?: PlanningResult | null;
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

export function timelineStepsForPlanningSummaryDisplay({
  steps,
  planningResult,
}: TimelineDisplayInput): PizzaSessionTimelineStep[] {
  const current = parsePlanningDate(planningResult?.technicalDetails.selectedTimeWindow.currentDateTime);
  const target = parsePlanningDate(planningResult?.technicalDetails.selectedTimeWindow.desiredBakeDateTime);
  if (!current || !target) return steps;

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
