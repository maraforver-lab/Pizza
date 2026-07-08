import {
  type PizzaSession,
  type PizzaSessionRecipeSnapshot,
  type PizzaSessionStep,
  type PizzaSessionTimeline,
  type PizzaSessionTimelineStep,
} from "@/lib/pizza-session";
import { timelineStepsForPlanningSummaryDisplay } from "@/lib/pizza-session-timeline-display";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { updatePizzaSession } from "@/lib/pizza-session-storage";
import { yeastTypeLabel } from "@/lib/yeast-types";

export type KitchenModeState =
  | { ok: false; missingReason: "no-session" | "missing-timeline" }
  | {
    ok: true;
    currentStep?: PizzaSessionTimelineStep;
    currentIndex: number;
    nextStep?: PizzaSessionTimelineStep;
    doneCount: number;
    totalCount: number;
  };

export type KitchenTaskInstruction = {
  shortInstruction: string;
  beginnerWhy: string;
  enthusiastWhy: string;
  pizzaNerdWhy: string;
};

export type KitchenIngredientLine = {
  label: string;
  value: string;
};

export type KitchenModeKind = "dough" | "service" | "complete" | "unknown";

export type KitchenTaskPresentation = {
  title: string;
  shortInstruction: string;
  doneCondition: string;
  helperCopy?: string;
};

type KitchenFermentationMode = "cold" | "room" | "unknown";

const defaultInstruction: KitchenTaskInstruction = {
  shortInstruction: "Follow the timeline step, then mark it done when you are ready to continue.",
  beginnerWhy: "One step at a time keeps the session calm.",
  enthusiastWhy: "A clear step sequence helps repeat the same bake later.",
  pizzaNerdWhy: "Kitchen Mode consumes the stored timeline and does not recalculate the schedule.",
};

export const kitchenTaskInstructions: Record<string, KitchenTaskInstruction> = {
  "mix-dough": {
    shortInstruction: "Weigh the ingredients, mix until no dry flour remains, then cover the dough.",
    beginnerWhy: "This creates the dough you will ferment, ball and bake later.",
    enthusiastWhy: "Careful weighing and complete mixing make the dough easier to repeat and diagnose.",
    pizzaNerdWhy: "Use the stored recipe snapshot here. Kitchen Mode shows saved dough numbers and does not change formulas.",
  },
  "rest-dough": {
    shortInstruction: "Keep the dough covered and let it relax.",
    beginnerWhy: "Resting makes the dough less tight.",
    enthusiastWhy: "A covered rest helps flour hydrate and makes later handling smoother.",
    pizzaNerdWhy: "This is a passive step. The stored timeline can cross quiet hours without requiring user action.",
  },
  "cold-ferment": {
    shortInstruction: "Move the covered dough to the fridge if your plan uses cold fermentation.",
    beginnerWhy: "Cold time slows the dough and gives flavor more time to develop.",
    enthusiastWhy: "Cold fermentation gives you more control over timing and handling.",
    pizzaNerdWhy: "Fridge temperature, container size and actual dough temperature can shift fermentation speed.",
  },
  "ball-dough": {
    shortInstruction: "Divide the dough into portions and shape each one into a smooth dough ball.",
    beginnerWhy: "One ball becomes one pizza.",
    enthusiastWhy: "Good balling builds surface tension and makes opening easier.",
    pizzaNerdWhy: "Ball timing changes extensibility, gas retention and final opening behavior.",
  },
  "room-temperature-rest": {
    shortInstruction: "Let the dough balls warm and relax while still covered.",
    beginnerWhy: "Cold dough is harder to stretch.",
    enthusiastWhy: "Room rest improves extensibility and lowers the chance of tearing.",
    pizzaNerdWhy: "The right room rest depends on ball size, dough temperature and flour strength.",
  },
  "preheat-oven": {
    shortInstruction: "Preheat the oven, stone, steel or pizza oven before opening the dough.",
    beginnerWhy: "A hot surface helps the pizza bake properly.",
    enthusiastWhy: "Stone or steel heat matters as much as oven air temperature.",
    pizzaNerdWhy: "Deck temperature and recovery time drive browning, spring and bake speed.",
  },
  "prepare-sauce-toppings": {
    shortInstruction: "Prepare sauce, cheese and toppings before stretching the dough.",
    beginnerWhy: "Having everything ready keeps the pizza from sitting wet.",
    enthusiastWhy: "Dry wet toppings and keep the topping load realistic for your oven.",
    pizzaNerdWhy: "Topping moisture and bake duration interact: slower ovens need a more restrained wet load.",
  },
  "bake-pizza": {
    shortInstruction: "Open, top and bake one pizza at a time. Watch color and rotate if needed.",
    beginnerWhy: "Bake close to the planned time so the pizza is eaten fresh.",
    enthusiastWhy: "Watch both the rim and the bottom; rotate when heat is uneven.",
    pizzaNerdWhy: "Bake time depends on oven type, stone temperature, dough thickness and topping moisture.",
  },
  "review-result": {
    shortInstruction: "Write one thing that worked and one thing to improve next time.",
    beginnerWhy: "A small note makes the next pizza easier.",
    enthusiastWhy: "Tracking handling, bake color and moisture helps you repeat good results.",
    pizzaNerdWhy: "Record timing, temperature, texture and oven behavior while the result is still fresh.",
  },
};

const coldFermentationPresentation: KitchenTaskPresentation = {
  title: "Cold ferment",
  shortInstruction: "Move the covered dough to the fridge if your plan uses cold fermentation.",
  doneCondition: "The dough is covered and resting in the fridge for the planned cold fermentation time.",
  helperCopy: "Cold time slows fermentation and gives more scheduling flexibility.",
};

const roomFermentationPresentation: KitchenTaskPresentation = {
  title: "Room temperature ferment",
  shortInstruction: "Keep the covered dough at room temperature for the planned fermentation time.",
  doneCondition: "The dough is covered and resting at room temperature on the planned schedule.",
  helperCopy: "Room temperature fermentation moves faster, so follow the planned timing closely.",
};

const neutralFermentationPresentation: KitchenTaskPresentation = {
  title: "Ferment dough",
  shortInstruction: "Keep the dough covered and follow the planned fermentation timing.",
  doneCondition: "The dough is covered and fermenting according to the planned timing.",
  helperCopy: "Fermentation timing affects dough strength, flavor, and readiness.",
};

const kitchenDoneConditions: Record<string, string> = {
  "mix-dough": "No dry flour remains and the dough is covered for the next rest.",
  "rest-dough": "The dough has relaxed and is still covered.",
  "ball-dough": "Each dough ball is smooth, tight, and placed seam-side down.",
  "room-temperature-rest": "The dough balls feel relaxed and ready to open without tearing.",
  "preheat-oven": "The oven and baking surface are fully hot before opening the pizza.",
  "prepare-sauce-toppings": "Sauce, cheese and toppings are ready before the dough is stretched.",
  "bake-pizza": "The rim is browned, the bottom is baked, and the cheese is melted.",
  "review-result": "Your notes capture what worked and what to adjust next time.",
};

function fermentationModeFromPreset(value?: string): KitchenFermentationMode {
  if (!value) return "unknown";
  if (value.endsWith("-cold")) return "cold";
  if (value.endsWith("-room")) return "room";
  return "unknown";
}

function isFermentationTimelineStep(step?: PizzaSessionTimelineStep) {
  if (!step) return false;
  const label = step.label.toLowerCase();
  return (
    step.id === "cold-ferment"
    || step.id === "room-ferment"
    || step.id === "ferment-dough"
    || label.includes("room fermentation")
    || label.includes("room temperature ferment")
    || label.includes("ferment dough")
  );
}

export function resolveKitchenFermentationMode(
  session?: Pick<PizzaSession, "plannedFermentationHours" | "recipeSnapshot"> | null,
  step?: PizzaSessionTimelineStep,
): KitchenFermentationMode {
  const label = step?.label.toLowerCase() ?? "";
  if (label.includes("room fermentation") || label.includes("room temperature ferment")) return "room";

  const presetMode = fermentationModeFromPreset(session?.recipeSnapshot?.fermentation);
  if (presetMode !== "unknown") return presetMode;

  if (typeof session?.plannedFermentationHours === "number" && Number.isFinite(session.plannedFermentationHours)) {
    return "cold";
  }

  return "unknown";
}

export function getKitchenFermentationStepCopy(
  session?: Pick<PizzaSession, "plannedFermentationHours" | "recipeSnapshot"> | null,
  step?: PizzaSessionTimelineStep,
): KitchenTaskPresentation {
  const mode = resolveKitchenFermentationMode(session, step);
  if (mode === "cold") return coldFermentationPresentation;
  if (mode === "room") return roomFermentationPresentation;
  return neutralFermentationPresentation;
}

export function getKitchenTaskPresentation(
  step?: PizzaSessionTimelineStep,
  session?: Pick<PizzaSession, "plannedFermentationHours" | "recipeSnapshot" | "pizzaCount" | "doughBallWeight"> | null,
): KitchenTaskPresentation {
  const instruction = getKitchenTaskInstruction(step);

  if (isFermentationTimelineStep(step)) {
    return getKitchenFermentationStepCopy(session, step);
  }

  const balls = session?.recipeSnapshot?.balls ?? session?.pizzaCount;
  const ballWeight = session?.recipeSnapshot?.ballWeight ?? session?.doughBallWeight;
  const isBallDough = step?.id === "ball-dough" || step?.label.toLowerCase() === "ball dough";
  const ballInstruction = balls && ballWeight
    ? `Shape ${balls} dough balls, ${ballWeight} g each.`
    : "Divide the dough into the planned portions and shape each one into a smooth dough ball.";

  return {
    title: step?.label ?? "Kitchen Mode",
    shortInstruction: isBallDough ? ballInstruction : instruction.shortInstruction,
    doneCondition: step ? kitchenDoneConditions[step.id] ?? "The step is complete and you are ready for the next task." : "You are ready for the next task.",
    helperCopy: step?.helperCopy,
  };
}

function nextTodoAfter(steps: PizzaSessionTimelineStep[], stepId: string) {
  const index = steps.findIndex((step) => step.id === stepId);
  return steps.slice(index + 1).find((step) => step.status === "todo" && step.id !== "review-result");
}

function currentStepForTimelineStep(step?: PizzaSessionTimelineStep): PizzaSessionStep {
  if (!step) return "review";
  if (step.id === "bake-pizza") return "bake";
  if (step.id === "review-result") return "review";
  return "prep";
}

function statusForTimelineStep(step?: PizzaSessionTimelineStep): PizzaSession["status"] {
  if (!step) return "reviewing";
  if (step.id === "bake-pizza") return "baking";
  if (step.id === "review-result") return "reviewing";
  return "preparing";
}

export function getKitchenModeState(session?: PizzaSession, now = new Date()): KitchenModeState {
  if (!session) return { ok: false, missingReason: "no-session" };
  if (!session.timeline?.steps.length) return { ok: false, missingReason: "missing-timeline" };

  const recipe = buildSessionRecipe(session, now);
  const planningResult = recipe.ok && recipe.planningInfo.ok ? recipe.planningInfo.result : null;
  const displaySteps = timelineStepsForPlanningSummaryDisplay({
    steps: session.timeline.steps,
    planningResult,
    session,
    now,
    anchorTime: session.timeline.anchorTime,
  });

  const currentStep = displaySteps.find((step) => step.status === "todo" && step.id !== "review-result");
  const currentIndex = currentStep
    ? displaySteps.findIndex((step) => step.id === currentStep.id)
    : displaySteps.length - 1;
  const nextStep = currentStep ? nextTodoAfter(displaySteps, currentStep.id) : undefined;
  const doneCount = displaySteps.filter((step) => step.status === "done").length;

  return {
    ok: true,
    currentStep,
    currentIndex,
    nextStep,
    doneCount,
    totalCount: displaySteps.length,
  };
}

export function getKitchenTaskInstruction(step?: PizzaSessionTimelineStep): KitchenTaskInstruction {
  if (!step) return defaultInstruction;
  return kitchenTaskInstructions[step.id] ?? defaultInstruction;
}

export function getKitchenModeForStep(step?: PizzaSessionTimelineStep): KitchenModeKind {
  if (!step) return "complete";
  const haystack = `${step.id} ${step.label}`.toLowerCase();

  if (
    haystack.includes("mix")
    || haystack.includes("rest-dough")
    || haystack.includes("cold-ferment")
    || haystack.includes("room-ferment")
    || haystack.includes("ferment-dough")
    || haystack.includes("ferment")
    || haystack.includes("ball")
    || haystack.includes("room-temperature")
    || haystack.includes("room temperature")
    || haystack.includes("warm")
  ) {
    return "dough";
  }

  if (
    haystack.includes("prepare-sauce")
    || haystack.includes("prepare sauce")
    || haystack.includes("topping")
    || haystack.includes("preheat")
    || haystack.includes("stretch")
    || haystack.includes("top")
    || haystack.includes("bake")
    || haystack.includes("serve")
    || haystack.includes("review")
  ) {
    return "service";
  }

  return "unknown";
}

export function completeKitchenTimelineStep(
  session: PizzaSession,
  stepId: string,
  storage?: Storage,
  now = new Date(),
) {
  const timeline = session.timeline;
  if (!timeline) return undefined;
  const targetStep = timeline.steps.find((step) => step.id === stepId);
  if (!targetStep) return undefined;

  const steps = timeline.steps.map((step) => (
    step.id === stepId ? { ...step, status: "done" as const } : step
  ));
  const nextStep = steps.find((step) => step.status === "todo");
  const updatedTimeline: PizzaSessionTimeline = { ...timeline, steps };

  return updatePizzaSession(
    session.id,
    {
      timeline: updatedTimeline,
      currentStep: currentStepForTimelineStep(nextStep),
      status: statusForTimelineStep(nextStep),
    },
    storage,
    now,
  );
}

function grams(value?: number) {
  if (!Number.isFinite(value)) return undefined;
  const rounded = Math.round((value ?? 0) * 100) / 100;
  return `${rounded} g`;
}

export function recipeSnapshotIngredientLines(snapshot?: PizzaSessionRecipeSnapshot): KitchenIngredientLine[] {
  if (!snapshot) return [];
  return [
    snapshot.totalDough ? { label: "Total dough", value: grams(snapshot.totalDough)! } : undefined,
    snapshot.flourAmount ? { label: "Flour", value: grams(snapshot.flourAmount)! } : undefined,
    snapshot.waterAmount ? { label: "Water", value: grams(snapshot.waterAmount)! } : undefined,
    snapshot.saltAmount ? { label: "Salt", value: grams(snapshot.saltAmount)! } : undefined,
    snapshot.leavenerAmount ? { label: `Yeast — ${yeastTypeLabel(snapshot.yeastType)}`, value: grams(snapshot.leavenerAmount)! } : undefined,
    snapshot.balls && snapshot.ballWeight
      ? { label: "Dough balls", value: `${snapshot.balls} × ${snapshot.ballWeight} g` }
      : undefined,
  ].flatMap((line) => line ? [line] : []);
}

export function doughKitchenIngredientLines(snapshot?: PizzaSessionRecipeSnapshot): KitchenIngredientLine[] {
  return recipeSnapshotIngredientLines(snapshot).filter((line) => (
    line.label === "Flour"
    || line.label === "Water"
    || line.label === "Salt"
    || line.label.startsWith("Yeast")
  ));
}

export function isMixDoughStep(step?: PizzaSessionTimelineStep) {
  return step?.id === "mix-dough" || step?.label.toLowerCase() === "mix dough";
}
