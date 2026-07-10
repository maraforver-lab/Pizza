import type { PizzaSession, PizzaSessionTimelineStep } from "@/lib/pizza-session";
import type { PlanningResult } from "@/lib/planning-result";

type TimelineDisplayInput = {
  steps: PizzaSessionTimelineStep[];
  planningResult?: PlanningResult | null;
  session?: Pick<PizzaSession, "doughStartMode" | "doughEarliestStartTime" | "targetEatTime" | "targetBakeTime" | "plannedFermentationHours" | "recipeSnapshot" | "ovenType" | "pizzaStyle"> | null;
  now?: Date;
  anchorTime?: string;
  adjustSchedule?: boolean;
};

export type TimelineFermentationMode = "cold" | "room" | "unknown";

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

function fermentationModeFromPreset(value?: string): TimelineFermentationMode {
  if (!value) return "unknown";
  if (value.endsWith("-cold")) return "cold";
  if (value.endsWith("-room")) return "room";
  return "unknown";
}

export function resolveSessionTimelineFermentationMode(
  session?: Pick<PizzaSession, "plannedFermentationHours" | "recipeSnapshot" | "ovenType" | "pizzaStyle"> | null,
  planningResult?: PlanningResult | null,
): TimelineFermentationMode {
  const presetMode = fermentationModeFromPreset(session?.recipeSnapshot?.fermentation);
  if (presetMode !== "unknown") return presetMode;

  if (typeof session?.plannedFermentationHours === "number" && Number.isFinite(session.plannedFermentationHours)) {
    return "cold";
  }

  const selectedMode = planningResult?.fermentationSetupRecommendation?.selectedFermentationMode;
  if (selectedMode === "cold" || selectedMode === "room") return selectedMode;

  const recommendedMode = planningResult?.fermentationSetupRecommendation?.recommendedFermentationMode;
  if (recommendedMode === "cold" || recommendedMode === "room") return recommendedMode;

  if (session?.recipeSnapshot?.oven === "gas" || session?.ovenType === "gas" || session?.pizzaStyle === "pizza-oven") {
    return "room";
  }
  if (session?.recipeSnapshot?.oven === "home" || session?.ovenType === "home" || session?.pizzaStyle === "home-oven") {
    return "cold";
  }

  return "unknown";
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
  steps,
  now,
  anchorTime,
}: {
  planningResult?: PlanningResult | null;
  session?: Pick<PizzaSession, "doughStartMode" | "doughEarliestStartTime" | "targetEatTime" | "targetBakeTime"> | null;
  steps?: PizzaSessionTimelineStep[];
  now?: Date;
  anchorTime?: string;
}): ResolvedSessionDoughStartTime {
  const mode = session?.doughStartMode ?? "recommend";
  const current = currentFromPlanning(planningResult) ?? now;
  const target = targetFromInput(planningResult, session);

  if (mode === "now") {
    const anchoredStart = parsePlanningDate(anchorTime);
    if (anchoredStart) {
      return {
        mode,
        label: "Dough start: now",
        startsAt: anchoredStart.toISOString(),
      };
    }
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
    if (current && laterStart.getTime() < current.getTime()) {
      return {
        mode,
        label: "Dough start: start now",
        startsAt: current.toISOString(),
        warning: "The chosen dough start time has passed. Start now and DoughTools will use the time left until your pizza target.",
      };
    }
    return {
      mode,
      label: "Dough start: later",
      startsAt: laterStart.toISOString(),
    };
  }

  const idealStart = steps?.find((step) => step.id === "mix-dough")?.scheduledAt;
  const idealStartDate = parsePlanningDate(idealStart);
  if (
    current
    && target
    && idealStartDate
    && idealStartDate.getTime() < current.getTime()
    && current.getTime() < target.getTime()
  ) {
    return {
      mode,
      label: "Dough start: start now",
      startsAt: current.toISOString(),
      warning: "The ideal dough start time has passed. Start now and DoughTools will use the remaining time.",
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
  if (step.id === "room-ferment" || step.id === "ferment-dough") return addMinutes(current, 60).toISOString();
  if (step.id === "ball-dough") return safeBeforeTarget(180);
  if (step.id === "room-temperature-rest") return safeBeforeTarget(150);
  if (step.id === "preheat-oven") return safeBeforeTarget(60);
  if (step.id === "prepare-sauce-toppings") return safeBeforeTarget(45);
  if (step.id === "bake-pizza") return target.toISOString();
  if (step.id === "review-result") return addMinutes(target, 20).toISOString();
  return step.scheduledAt;
}

function safeFermentationStartIso(step: PizzaSessionTimelineStep, current: Date) {
  if (step.id === "mix-dough") return current.toISOString();
  if (step.id === "rest-dough") return addMinutes(current, 30).toISOString();
  if (step.id === "cold-ferment" || step.id === "room-ferment" || step.id === "ferment-dough") return addMinutes(current, 60).toISOString();
  return step.scheduledAt;
}

function explicitDoughStartFermentationIso(step: PizzaSessionTimelineStep, start: Date) {
  if (step.id === "mix-dough") return start.toISOString();
  if (step.id === "rest-dough") return addMinutes(start, 30).toISOString();
  if (step.id === "cold-ferment" || step.id === "room-ferment" || step.id === "ferment-dough") return addMinutes(start, 60).toISOString();
  return step.scheduledAt;
}

function shouldUseSameDayFromResolvedStart(start: Date, target: Date) {
  const hours = minutesBetween(start, target) / 60;
  return hours > 0 && hours < 8;
}

function roomFermentationCopy(step: PizzaSessionTimelineStep): Partial<PizzaSessionTimelineStep> {
  if (step.id === "cold-ferment" || step.id === "room-ferment" || step.id === "ferment-dough") {
    return {
      id: "room-ferment",
      label: "Room temperature ferment",
      description: "Keep the covered dough at room temperature for the planned fermentation time.",
      helperCopy: "Room temperature fermentation moves faster, so follow the planned timing closely.",
      beginnerNote: "Keep the dough covered and let it rise at room temperature.",
      enthusiastNote: "Room fermentation is the practical fit for this selected plan.",
      pizzaNerdNote: "Use the selected room-temperature plan; fridge timing is not part of this fermentation step.",
      quietHoursWarning: undefined,
    };
  }

  if (step.id === "room-temperature-rest") {
    return {
      label: "Final room rest",
      description: "Let the dough finish relaxing at room temperature before opening.",
      helperCopy: "This is a final room rest before baking, not a cold-dough warm-up.",
      beginnerNote: "Keep the dough covered until it feels relaxed enough to open.",
      enthusiastNote: "Use this final rest to make the dough easier to stretch.",
      pizzaNerdNote: "The final room rest improves extensibility before opening.",
    };
  }

  return {};
}

function coldFermentationCopy(step: PizzaSessionTimelineStep): Partial<PizzaSessionTimelineStep> {
  if (step.id === "cold-ferment" || step.id === "room-ferment" || step.id === "ferment-dough") {
    return {
      id: "cold-ferment",
      label: "Cold fermentation",
      description: "Keep the covered dough in the fridge for the planned cold fermentation time.",
      helperCopy: "Cold fermentation slows activity and gives more scheduling flexibility.",
      beginnerNote: "Keep the dough covered in the fridge at the planned temperature.",
      enthusiastNote: "Cold fermentation helps flavor and makes timing easier to control.",
      pizzaNerdNote: "Use the selected cold fermentation plan; room-temperature timing is not part of this fermentation step.",
      quietHoursWarning: undefined,
    };
  }

  return {};
}

function neutralFermentationCopy(step: PizzaSessionTimelineStep): Partial<PizzaSessionTimelineStep> {
  if (step.id === "cold-ferment" || step.id === "room-ferment" || step.id === "ferment-dough") {
    return {
      id: "ferment-dough",
      label: "Ferment dough",
      description: "Keep the dough covered and follow the planned fermentation timing.",
      helperCopy: "Fermentation timing affects dough strength, flavor, and readiness.",
      beginnerNote: "Keep the dough covered while it ferments.",
      enthusiastNote: "Follow the planned timing and watch dough condition.",
      pizzaNerdNote: "This neutral step is used when DoughTools cannot confirm room or cold fermentation.",
      quietHoursWarning: undefined,
    };
  }
  return {};
}

function displayCopyForFermentationMode(step: PizzaSessionTimelineStep, mode: TimelineFermentationMode) {
  if (mode === "cold") return coldFermentationCopy(step);
  if (mode === "room") return roomFermentationCopy(step);
  if (mode === "unknown") return neutralFermentationCopy(step);
  return {};
}

function normalizeStepsForFermentationMode(
  steps: PizzaSessionTimelineStep[],
  mode: TimelineFermentationMode,
) {
  let changed = false;
  const normalized = steps.map((step) => {
    const copy = displayCopyForFermentationMode(step, mode);
    if (!Object.keys(copy).length) return step;
    changed = true;
    return {
      ...step,
      ...copy,
    };
  });
  return changed ? normalized : steps;
}

export function timelineStepsForPlanningSummaryDisplay({
  steps,
  planningResult,
  session,
  now,
  anchorTime,
  adjustSchedule = false,
}: TimelineDisplayInput): PizzaSessionTimelineStep[] {
  const fermentationMode = resolveSessionTimelineFermentationMode(session, planningResult);
  const normalizedSteps = normalizeStepsForFermentationMode(steps, fermentationMode);
  if (!adjustSchedule) return normalizedSteps;

  const current = currentFromPlanning(planningResult) ?? now;
  const target = targetFromInput(planningResult, session);
  if (!current || !target) return normalizedSteps;

  const resolvedStart = resolveSessionDoughStartTime({ planningResult, session, steps: normalizedSteps, now, anchorTime });
  const explicitStart = parsePlanningDate(resolvedStart.startsAt);
  if (explicitStart) {
    if (fermentationMode === "room" && !shouldUseSameDayFromResolvedStart(explicitStart, target)) {
      return normalizedSteps.map((step) => {
        if (!["mix-dough", "rest-dough", "room-ferment"].includes(step.id)) return step;
        return {
          ...step,
          scheduledAt: explicitDoughStartFermentationIso(step, explicitStart),
          helperCopy: step.id === "mix-dough" && resolvedStart.warning
            ? resolvedStart.warning
            : step.helperCopy,
          quietHoursWarning: undefined,
        };
      });
    }

    if (shouldUseSameDayFromResolvedStart(explicitStart, target)) {
      return normalizedSteps.map((step) => {
        const scheduledAt = sameDayScheduleIso(step, explicitStart, target);
        const sameDayCopy = fermentationMode === "room"
          ? displayCopyForFermentationMode(step, fermentationMode)
          : step.id === "rest-dough"
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

        return {
          ...step,
          ...sameDayCopy,
          scheduledAt,
          quietHoursWarning: undefined,
        };
      });
    }

    return normalizedSteps.map((step) => {
      if (!["mix-dough", "rest-dough", "cold-ferment", "room-ferment", "ferment-dough"].includes(step.id)) return step;
      return {
        ...step,
        scheduledAt: explicitDoughStartFermentationIso(step, explicitStart),
        helperCopy: step.id === "mix-dough" && resolvedStart.warning
          ? resolvedStart.warning
          : step.helperCopy,
        quietHoursWarning: undefined,
      };
    });
  }

  if (!sameDayRoomPlanning(planningResult)) {
    const startWindowCategory = planningResult?.startWindowRecommendation?.category;
    const canSafelyShiftPastStart = startWindowCategory === "day_before" || startWindowCategory === "evening_before";
    const hasPastDoughStart = normalizedSteps.some((step) => (
      ["mix-dough", "rest-dough", "cold-ferment", "room-ferment", "ferment-dough"].includes(step.id)
      && step.scheduledAt
      && new Date(step.scheduledAt).getTime() < current.getTime()
    ));
    if (!hasPastDoughStart || !canSafelyShiftPastStart) return normalizedSteps;

    return normalizedSteps.map((step) => {
      if (!["mix-dough", "rest-dough", "cold-ferment", "room-ferment", "ferment-dough"].includes(step.id)) return step;
      return {
        ...step,
        scheduledAt: safeFermentationStartIso(step, current),
        quietHoursWarning: undefined,
      };
    });
  }

  return normalizedSteps.map((step) => {
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

    return {
      ...step,
      ...sameDayCopy,
      scheduledAt,
      quietHoursWarning: undefined,
    };
  });
}
