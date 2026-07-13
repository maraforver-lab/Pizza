import { getExperienceLevelConfig, type ExperienceLevel } from "@/lib/experience-levels";
import { type PizzaSession, type PizzaSessionTimeline, type PizzaSessionTimelineStep } from "@/lib/pizza-session";
import { getPizzaSessionBakeProfileForSession } from "@/lib/pizza-session-bake-profile";
import { timelineStepsForPlanningSummaryDisplay } from "@/lib/pizza-session-timeline-display";
import { getActivePizzaSession, updatePizzaSession } from "@/lib/pizza-session-storage";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { runtimeMapWithStepCompletion } from "@/lib/pizza-session-step-runtime";
import { yeastTypeLabel } from "@/lib/yeast-types";

export type PizzaSessionTimelineResult = {
  ok: boolean;
  timeline?: PizzaSessionTimeline;
  missingReason?: "no-session" | "missing-target-time" | "invalid-target-time";
  nextStep?: PizzaSessionTimelineStep;
  assumptions: string[];
};

type TimelineTemplateStep = {
  id: string;
  label: string;
  description: string;
  offsetMinutesFromTarget: number;
  kind: "active" | "passive";
  helperCopy: string;
  beginnerNote: string;
  enthusiastNote: string;
  pizzaNerdNote: string;
};

export const TIMELINE_ROUNDING_MINUTES = 15;
export const QUIET_HOURS_START = 22;
export const QUIET_HOURS_END = 7;
export const QUIET_HOURS_WARNING =
  "This active task falls inside the usual 22:00–07:00 quiet window. If that is not realistic, move the target time or prepare this step earlier.";

const DEFAULT_TIMELINE_ASSUMPTIONS = [
  "The target time is treated as the planned eating or baking moment saved in the Pizza Session.",
  "Timing is a practical guide, not a guarantee. Dough temperature, room temperature, flour strength and oven heat can shift the schedule.",
  "This first timeline version uses conservative default offsets and keeps detailed fermentation tuning in the existing tools.",
  "User-facing times are rounded to practical 15-minute increments.",
  "Active tasks try to avoid the 22:00–07:00 quiet window; passive fermentation or rest can continue overnight.",
];

const timelineTemplate: TimelineTemplateStep[] = [
  {
    id: "mix-dough",
    label: "Mix dough",
    description: "Combine flour, water, salt and yeast from your recipe setup.",
    offsetMinutesFromTarget: -30 * 60,
    kind: "active",
    helperCopy: "Start the dough early enough that it has time to rest and ferment before baking.",
    beginnerNote: "Do this first. Mix until there is no dry flour left.",
    enthusiastNote: "A short rest after mixing makes the dough easier to knead and handle.",
    pizzaNerdNote: "This offset assumes a cold-ferment style preparation. Adjust earlier for very low yeast or very strong flour.",
  },
  {
    id: "rest-dough",
    label: "Rest dough",
    description: "Let the mixed dough relax before stronger handling.",
    offsetMinutesFromTarget: -(29 * 60 + 30),
    kind: "passive",
    helperCopy: "Resting helps flour hydrate and makes the dough less tight.",
    beginnerNote: "Cover the dough and leave it alone for a short rest.",
    enthusiastNote: "This rest reduces kneading effort and improves handling.",
    pizzaNerdNote: "This is a practical autolyse/rest slot, not a strict formula requirement.",
  },
  {
    id: "cold-ferment",
    label: "Cold ferment",
    description: "Move the dough into a cool fermentation phase if your plan uses cold time.",
    offsetMinutesFromTarget: -28 * 60,
    kind: "passive",
    helperCopy: "Cold time slows fermentation and gives more scheduling flexibility.",
    beginnerNote: "Put the covered dough in the fridge if your recipe uses cold fermentation.",
    enthusiastNote: "Cold fermentation helps flavor and makes timing easier to control.",
    pizzaNerdNote: "Fridge temperature and actual dough temperature matter more than the fridge dial alone.",
  },
  {
    id: "ball-dough",
    label: "Ball dough",
    description: "Divide the dough and shape it into balls or portions.",
    offsetMinutesFromTarget: -4 * 60,
    kind: "active",
    helperCopy: "Balling creates the final portions and builds surface tension.",
    beginnerNote: "Make one dough ball per pizza, or one portion for pan pizza.",
    enthusiastNote: "Good balling makes opening the pizza easier later.",
    pizzaNerdNote: "Ball timing depends on gluten strength, hydration and how relaxed you want the dough at opening.",
  },
  {
    id: "room-temperature-rest",
    label: "Room temperature rest",
    description: "Let the dough warm and relax before opening.",
    offsetMinutesFromTarget: -3 * 60,
    kind: "passive",
    helperCopy: "Cold dough is harder to open. Give it time to become relaxed and workable.",
    beginnerNote: "Take the dough out before baking so it is not fridge-cold.",
    enthusiastNote: "Room rest improves extensibility and reduces tearing.",
    pizzaNerdNote: "The right rest depends on dough-ball size, container temperature and room temperature.",
  },
  {
    id: "preheat-oven",
    label: "Preheat oven",
    description: "Heat the oven, stone, steel or pizza oven before baking.",
    offsetMinutesFromTarget: -60,
    kind: "active",
    helperCopy: "A hot baking surface matters as much as the oven air temperature.",
    beginnerNote: "Start heating the oven before you open the pizza.",
    enthusiastNote: "Give stones and steels time to saturate with heat.",
    pizzaNerdNote: "Deck temperature, recovery time and bake style change the ideal preheat length.",
  },
  {
    id: "prepare-sauce-toppings",
    label: "Prepare sauce and toppings",
    description: "Get sauce, cheese and toppings ready before the dough is opened.",
    offsetMinutesFromTarget: -45,
    kind: "active",
    helperCopy: "Preparation keeps the pizza from sitting wet on the bench.",
    beginnerNote: "Have everything ready before stretching the dough.",
    enthusiastNote: "Dry wet toppings and keep the topping load realistic for your oven.",
    pizzaNerdNote: "Moisture load and bake duration are linked: longer bakes tolerate less wet topping.",
  },
  {
    id: "bake-pizza",
    label: "Bake pizza",
    description: "Open, top and bake the pizza.",
    offsetMinutesFromTarget: -10,
    kind: "active",
    helperCopy: "Bake close to the planned target time so the pizza is eaten fresh.",
    beginnerNote: "Open, top and bake one pizza at a time.",
    enthusiastNote: "Watch the bottom and rotate when needed for even color.",
    pizzaNerdNote: "Bake timing depends on oven type, stone temperature, dough thickness and topping moisture.",
  },
  {
    id: "review-result",
    label: "Review result",
    description: "After eating, write down what worked and what you would change.",
    offsetMinutesFromTarget: 20,
    kind: "active",
    helperCopy: "A short note makes the next bake easier to improve.",
    beginnerNote: "Write one thing that worked and one thing to try next time.",
    enthusiastNote: "Note handling, bake color, topping moisture and timing.",
    pizzaNerdNote: "Record variables while they are still fresh: temperature, timing, texture and oven behavior.",
  },
];

function parseTargetTime(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function stableDateIso(value?: string) {
  const date = parseTargetTime(value);
  return date?.toISOString();
}

function timelineAnchorTimeForSession(session: PizzaSession, now: Date) {
  if (session.doughStartMode !== "now") return undefined;
  return stableDateIso(session.timeline?.anchorTime) ?? now.toISOString();
}

export function buildPizzaSessionTimelineInputSignature(session: PizzaSession, anchorTime?: string) {
  const signatureParts = [
    ["targetEatTime", stableDateIso(session.targetEatTime)],
    ["targetBakeTime", stableDateIso(session.targetBakeTime)],
    ["doughStartMode", session.doughStartMode ?? "recommend"],
    ["doughStartAnchor", session.doughStartMode === "now" ? stableDateIso(anchorTime) : undefined],
    ["doughEarliestStartTime", session.doughStartMode === "later" ? stableDateIso(session.doughEarliestStartTime) : undefined],
    ["recipeFermentation", session.recipeSnapshot?.fermentation],
    ["plannedFermentationHours", session.plannedFermentationHours],
    ["pizzaCount", session.recipeSnapshot?.balls ?? session.pizzaCount],
    ["doughBallWeight", session.recipeSnapshot?.ballWeight ?? session.doughBallWeight],
    ["ovenType", session.recipeSnapshot?.oven ?? session.ovenType],
    ["pizzaStyle", session.recipeSnapshot?.pizzaStyle ?? session.pizzaStyle],
    ["pizzaPreset", session.recipeSnapshot?.pizzaPreset ?? session.pizzaPreset],
    ["yeastType", session.recipeSnapshot?.yeastType ?? session.yeastType],
  ];
  return JSON.stringify(signatureParts);
}

function hasUsableTimelineSnapshot(session?: PizzaSession, inputSignature?: string) {
  const timeline = session?.timeline;
  if (!timeline?.steps.length) return false;
  if (!inputSignature || timeline.inputSignature !== inputSignature) return false;
  return timeline.steps.every((step) => step.id && step.label && step.scheduledAt);
}

function scheduledAt(target: Date, offsetMinutes: number) {
  return new Date(target.getTime() + offsetMinutes * 60_000);
}

function roundToTimelineIncrement(date: Date) {
  const incrementMs = TIMELINE_ROUNDING_MINUTES * 60_000;
  return new Date(Math.round(date.getTime() / incrementMs) * incrementMs);
}

function isQuietHours(date: Date) {
  const hour = date.getHours();
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

function previousQuietHoursBoundary(date: Date) {
  const adjusted = new Date(date);
  if (adjusted.getHours() < QUIET_HOURS_END) adjusted.setDate(adjusted.getDate() - 1);
  adjusted.setHours(QUIET_HOURS_START - 1, 45, 0, 0);
  return adjusted;
}

function scheduleTemplateStep(target: Date, step: TimelineTemplateStep, session?: PizzaSession) {
  const bakeProfile = getPizzaSessionBakeProfileForSession(session);
  const offsetMinutesFromTarget = step.id === "preheat-oven"
    ? -bakeProfile.preheatDurationMinutes
    : step.offsetMinutesFromTarget;
  const rounded = roundToTimelineIncrement(scheduledAt(target, offsetMinutesFromTarget));
  if (step.kind === "passive" || !isQuietHours(rounded)) {
    return { scheduledAt: rounded.toISOString(), quietHoursWarning: undefined };
  }

  if (step.id === "bake-pizza" || step.id === "review-result") {
    return {
      scheduledAt: rounded.toISOString(),
      quietHoursWarning: QUIET_HOURS_WARNING,
    };
  }

  return {
    scheduledAt: previousQuietHoursBoundary(rounded).toISOString(),
    quietHoursWarning: undefined,
  };
}

function effectiveFermentationHoursForTimeline(
  session: PizzaSession,
  target: Date,
  planningNow: Date,
) {
  const recipe = buildSessionRecipe(session, planningNow);
  if (recipe.ok && recipe.continuousYeast?.appliedToIngredients) {
    const hours = recipe.continuousYeast.selectedFermentationHours;
    if (Number.isFinite(hours) && hours > 0) return {
      hours,
      fermentationMode: recipe.continuousYeast.recommendation.fermentationMode,
    };
  }

  if (
    typeof session.plannedFermentationHours === "number"
    && Number.isFinite(session.plannedFermentationHours)
    && session.plannedFermentationHours > 0
  ) {
    return {
      hours: session.plannedFermentationHours,
      fermentationMode: "cold" as const,
    };
  }

  const fallbackHours = (target.getTime() - planningNow.getTime()) / 3_600_000;
  return Number.isFinite(fallbackHours) && fallbackHours > 0 && fallbackHours <= 72
    ? { hours: fallbackHours, fermentationMode: undefined }
    : undefined;
}

function explicitLaterStartForSession(session: PizzaSession, target: Date, planningNow: Date) {
  if (session.doughStartMode !== "later") return undefined;
  const laterStart = parseTargetTime(session.doughEarliestStartTime);
  if (!laterStart || laterStart.getTime() >= target.getTime()) return undefined;
  return laterStart.getTime() < planningNow.getTime() ? planningNow : laterStart;
}

function selectedFermentationStartForSession(session: PizzaSession, target: Date, planningNow: Date) {
  const explicitStart = explicitLaterStartForSession(session, target, planningNow);
  if (explicitStart) return explicitStart;

  const effective = effectiveFermentationHoursForTimeline(session, target, planningNow);
  if (!effective) return undefined;

  const selectedStart = new Date(target.getTime() - effective.hours * 3_600_000);
  return selectedStart.getTime() < planningNow.getTime() ? planningNow : selectedStart;
}

function ovenTimelineStepCopy(
  step: TimelineTemplateStep,
  bakeProfile: ReturnType<typeof getPizzaSessionBakeProfileForSession>,
) {
  if (bakeProfile.ovenType === "pizza") return {};

  if (step.id === "preheat-oven") {
    return {
      description: "Heat the home oven, stone, steel or tray before baking.",
      helperCopy: `${bakeProfile.surfaceGuidance} Start early so the surface is fully hot.`,
      beginnerNote: "Start heating the home oven before you open the pizza.",
      enthusiastNote: "Give the stone, steel or tray enough time to soak up heat.",
      pizzaNerdNote: "Home ovens need a longer heat-soak window because surface heat and recovery are limited.",
    };
  }

  if (step.id === "bake-pizza") {
    return {
      description: "Open, top and bake the pizza in the home oven.",
      helperCopy: `Plan for ${bakeProfile.bakeTimeLabel}; keep toppings restrained and eat the pizza fresh.`,
      beginnerNote: "Bake one pizza at a time and watch the rim, bottom and cheese.",
      enthusiastNote: bakeProfile.rotationGuidance,
      pizzaNerdNote: "Balance top heat, bottom heat and moisture load during the longer home-oven bake.",
    };
  }

  return {};
}

function scheduleStepsFromDoughStart(
  steps: PizzaSessionTimelineStep[],
  doughStart: Date | undefined,
) {
  if (!doughStart) return steps;
  return steps.map((step) => {
    if (step.id === "mix-dough") {
      return { ...step, scheduledAt: doughStart.toISOString(), quietHoursWarning: undefined };
    }
    if (step.id === "rest-dough") {
      return { ...step, scheduledAt: new Date(doughStart.getTime() + 30 * 60_000).toISOString(), quietHoursWarning: undefined };
    }
    if (step.id === "cold-ferment" || step.id === "room-ferment" || step.id === "ferment-dough") {
      return { ...step, scheduledAt: new Date(doughStart.getTime() + 60 * 60_000).toISOString(), quietHoursWarning: undefined };
    }
    return step;
  });
}

export function getTimelineNote(step: PizzaSessionTimelineStep, level: ExperienceLevel) {
  if (level === "pizza_nerd") return step.pizzaNerdNote ?? step.helperCopy ?? step.description;
  if (level === "enthusiast") return step.enthusiastNote ?? step.helperCopy ?? step.description;
  return step.beginnerNote ?? step.helperCopy ?? step.description;
}

export function getNextTimelineStep(timeline?: PizzaSessionTimeline) {
  return timeline?.steps.find((step) => step.status === "todo");
}

export function generatePizzaSessionTimeline(
  session: PizzaSession | undefined,
  now = new Date(),
): PizzaSessionTimelineResult {
  if (!session) return { ok: false, missingReason: "no-session", assumptions: DEFAULT_TIMELINE_ASSUMPTIONS };
  const target = parseTargetTime(session.targetEatTime ?? session.targetBakeTime);
  if (!session.targetEatTime && !session.targetBakeTime) {
    return { ok: false, missingReason: "missing-target-time", assumptions: DEFAULT_TIMELINE_ASSUMPTIONS };
  }
  if (!target) return { ok: false, missingReason: "invalid-target-time", assumptions: DEFAULT_TIMELINE_ASSUMPTIONS };

  const existingStatuses = new Map(session.timeline?.steps.map((step) => [step.id, step.status]));
  const anchorTime = timelineAnchorTimeForSession(session, now);
  const signature = buildPizzaSessionTimelineInputSignature(session, anchorTime);
  const planningNow = parseTargetTime(anchorTime) ?? now;
  const effectiveFermentation = effectiveFermentationHoursForTimeline(session, target, planningNow);
  const selectedYeastLabel = yeastTypeLabel(session.recipeSnapshot?.yeastType ?? session.yeastType).toLowerCase();
  const bakeProfile = getPizzaSessionBakeProfileForSession(session);
  const templateSteps = timelineTemplate.map((step) => {
    const schedule = scheduleTemplateStep(target, step, session);
    const ovenStepCopy = ovenTimelineStepCopy(step, bakeProfile);
    return {
      id: step.id,
      label: step.label,
      description: step.id === "mix-dough"
        ? `Combine flour, water, salt and ${selectedYeastLabel} from your recipe setup.`
        : ovenStepCopy.description ?? step.description,
      scheduledAt: schedule.scheduledAt,
      status: existingStatuses.get(step.id) ?? "todo",
      kind: step.kind,
      quietHoursWarning: schedule.quietHoursWarning,
      helperCopy: ovenStepCopy.helperCopy ?? step.helperCopy,
      beginnerNote: ovenStepCopy.beginnerNote ?? step.beginnerNote,
      enthusiastNote: ovenStepCopy.enthusiastNote ?? step.enthusiastNote,
      pizzaNerdNote: ovenStepCopy.pizzaNerdNote ?? step.pizzaNerdNote,
    };
  });
  const steps = timelineStepsForPlanningSummaryDisplay({
    steps: templateSteps,
    session,
    fermentationMode: effectiveFermentation?.fermentationMode,
    now: planningNow,
    anchorTime,
    adjustSchedule: true,
  });
  const scheduledSteps = scheduleStepsFromDoughStart(
    steps,
    selectedFermentationStartForSession(session, target, planningNow),
  );
  const timeline: PizzaSessionTimeline = {
    generatedAt: now.toISOString(),
    anchorTime,
    inputSignature: signature,
    targetEatTime: session.targetEatTime ?? session.targetBakeTime,
    assumptions: DEFAULT_TIMELINE_ASSUMPTIONS,
    steps: scheduledSteps,
  };

  return {
    ok: true,
    timeline,
    nextStep: getNextTimelineStep(timeline),
    assumptions: timeline.assumptions ?? DEFAULT_TIMELINE_ASSUMPTIONS,
  };
}

export function generateAndSaveActivePizzaSessionTimeline(storage?: Storage, now = new Date()) {
  const session = getActivePizzaSession(storage);
  const anchorTime = session ? timelineAnchorTimeForSession(session, now) : undefined;
  const inputSignature = session ? buildPizzaSessionTimelineInputSignature(session, anchorTime) : undefined;
  if (hasUsableTimelineSnapshot(session, inputSignature)) {
    const timeline = session!.timeline!;
    return {
      session,
      result: {
        ok: true,
        timeline,
        nextStep: getNextTimelineStep(timeline),
        assumptions: timeline.assumptions ?? DEFAULT_TIMELINE_ASSUMPTIONS,
      },
    };
  }

  const result = generatePizzaSessionTimeline(session, now);
  if (!session || !result.timeline) return { session, result };

  const updated = updatePizzaSession(
    session.id,
    {
      timeline: result.timeline,
      currentStep: "timeline",
      status: session.status === "draft" ? "planning" : session.status,
    },
    storage,
    now,
  );

  return {
    session: updated ?? session,
    result: {
      ...result,
      nextStep: getNextTimelineStep(updated?.timeline ?? result.timeline),
    },
  };
}

export function markPizzaSessionTimelineStepDone(
  session: PizzaSession,
  stepId: string,
  storage?: Storage,
  now = new Date(),
) {
  const timeline = session.timeline;
  if (!timeline) return undefined;
  const steps = timeline.steps.map((step) => (
    step.id === stepId ? { ...step, status: "done" as const } : step
  ));

  return updatePizzaSession(
    session.id,
    {
      timeline: { ...timeline, steps },
      stepRuntime: runtimeMapWithStepCompletion(session, stepId, now),
      currentStep: "timeline",
    },
    storage,
    now,
  );
}

export function formatTimelinePlainText(session: PizzaSession, timeline: PizzaSessionTimeline) {
  const level = getExperienceLevelConfig(session.experienceLevel).label;
  const lines = [
    "DoughTools pizza timeline",
    `Guidance: ${level}`,
    `Target time: ${timeline.targetEatTime ?? session.targetEatTime ?? "not set"}`,
    "",
    ...timeline.steps.map((step) => {
      const time = step.scheduledAt ? new Date(step.scheduledAt).toLocaleString("en-GB") : "Time not set";
      return `${time} — ${step.label} (${step.status})`;
    }),
    "",
    "Timing is a practical guide. Adjust for your dough, room temperature and oven.",
  ];
  return lines.join("\n");
}
