import {
  type PizzaSession,
  type PizzaSessionRecipeSnapshot,
  type PizzaSessionStep,
  type PizzaSessionTimeline,
  type PizzaSessionTimelineStep,
} from "@/lib/pizza-session";
import { getPizzaSessionBakeProfileForSession } from "@/lib/pizza-session-bake-profile";
import { normalizeExperienceLevel, type ExperienceLevel } from "@/lib/experience-levels";
import { timelineStepsForPlanningSummaryDisplay } from "@/lib/pizza-session-timeline-display";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { updatePizzaSession } from "@/lib/pizza-session-storage";
import {
  deriveEffectiveKitchenSchedule,
  type EffectiveKitchenScheduleConflict,
  type RuntimePizzaSessionTimelineStep,
  runtimeMapWithStepCompletion,
} from "@/lib/pizza-session-step-runtime";
import { yeastTypeLabel } from "@/lib/yeast-types";

export type KitchenModeState =
  | { ok: false; missingReason: "no-session" | "missing-timeline" }
  | {
    ok: true;
    currentStep?: RuntimePizzaSessionTimelineStep;
    currentIndex: number;
    nextStep?: RuntimePizzaSessionTimelineStep;
    doneCount: number;
    executionConflict?: EffectiveKitchenScheduleConflict;
    totalCount: number;
  };

export type KitchenTaskInstruction = {
  shortInstruction: string;
  beginnerWhy: string;
  enthusiastWhy: string;
  pizzaNerdWhy: string;
};

export type KitchenExperienceGuidance = {
  instruction: string;
  whatToLookFor?: string;
  whyItMatters?: string;
  technicalNote?: string;
  reassuranceTip?: string;
};

type KitchenExperienceGuidanceByLevel = Record<ExperienceLevel, KitchenExperienceGuidance>;

export type KitchenIngredientLine = {
  label: string;
  value: string;
};

export type KitchenModeKind = "dough" | "service" | "complete" | "unknown";

export type KitchenStepWaitInfo = {
  isTooEarly: boolean;
  remainingMinutes: number;
  waitLabel?: string;
};

export type EarlyTimedKitchenCompletionWarning = {
  description: string;
  title: string;
};

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
    shortInstruction: "Weigh the ingredients, mix until no dry flour remains, then cover the dough. Up to 30 minutes is reserved; the rest starts after completion.",
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

const defaultExperienceGuidance: KitchenExperienceGuidanceByLevel = {
  beginner: {
    instruction: "Follow the current step, then mark it done when it matches the description above.",
    whatToLookFor: "The step should look finished before you move on.",
    reassuranceTip: "If you are unsure, slow down and check the dough or pizza before continuing.",
  },
  enthusiast: {
    instruction: "Use the current step as your checkpoint and compare what you see with the target state.",
    whatToLookFor: "Look for the texture, timing and readiness cues before moving forward.",
    whyItMatters: "Consistent checkpoints make the bake easier to repeat and improve.",
  },
  pizza_nerd: {
    instruction: "Use the stored timeline step as the execution checkpoint.",
    whatToLookFor: "Assess the physical state before relying on the clock alone.",
    technicalNote: "Kitchen Mode reads the stored timeline and guidance; it does not recalculate formulas or timings here.",
  },
};

const kitchenExperienceGuidance: Record<string, KitchenExperienceGuidanceByLevel> = {
  "mix-dough": {
    beginner: {
      instruction: "Mix until no dry flour remains, then cover the dough.",
      whatToLookFor: "The dough may look rough and sticky at first. That is normal.",
      reassuranceTip: "Do not add extra flour just because it feels messy.",
    },
    enthusiast: {
      instruction: "Mix until the flour is fully hydrated and the dough looks evenly combined.",
      whatToLookFor: "The mass should become more cohesive, even if it is not smooth yet.",
      whyItMatters: "Complete mixing makes later rests and folds more predictable.",
      reassuranceTip: "Stickiness is expected early; judge by dry flour pockets, not by how clean your hands feel.",
    },
    pizza_nerd: {
      instruction: "Build an even mix with no dry pockets while avoiding unnecessary oxidation or heat buildup.",
      whatToLookFor: "Target a cohesive dough mass with moderate early strength, not full gluten development.",
      technicalNote: "Assess dough temperature and hydration feel when available; do not mix only by the clock.",
    },
  },
  "rest-dough": {
    beginner: {
      instruction: "Leave the dough covered and let it relax.",
      whatToLookFor: "It should spread slightly and feel less tight after the rest.",
      reassuranceTip: "Nothing dramatic needs to happen during this step.",
    },
    enthusiast: {
      instruction: "Keep the dough covered so hydration can even out before the next handling step.",
      whatToLookFor: "The surface should look calmer and the dough should resist less when touched.",
      whyItMatters: "Resting reduces tearing and makes later shaping easier.",
    },
    pizza_nerd: {
      instruction: "Use this passive rest to let hydration and gluten relaxation catch up.",
      whatToLookFor: "Expect improved extensibility and less elastic snap-back.",
      technicalNote: "This is a structure-management step; avoid turning it into extra kneading unless the dough clearly needs strength.",
    },
  },
  "cold-ferment": {
    beginner: {
      instruction: "Keep the dough covered for the planned fermentation time.",
      whatToLookFor: "The dough should stay protected and slowly become a little puffier.",
      reassuranceTip: "Do not keep opening the container to check it.",
    },
    enthusiast: {
      instruction: "Keep the dough covered and follow the selected fermentation place and timing.",
      whatToLookFor: "Look for gradual rise, small bubbles and dough that still holds shape.",
      whyItMatters: "Fermentation develops flavor and gas while timing controls dough strength.",
    },
    pizza_nerd: {
      instruction: "Treat this as the controlled fermentation phase for the selected plan.",
      whatToLookFor: "Track expansion, gas, surface tension and whether the dough is holding structure.",
      technicalNote: "Use dough condition and actual temperature as control signals when available; do not infer cold handling for a room-temperature plan.",
    },
  },
  "room-ferment": {
    beginner: {
      instruction: "Keep the dough covered at room temperature for the planned time.",
      whatToLookFor: "It should slowly rise and look a little more alive.",
      reassuranceTip: "Room-temperature dough moves faster, so stay close to the planned timing.",
    },
    enthusiast: {
      instruction: "Keep the dough covered at a steady room temperature and watch its pace.",
      whatToLookFor: "Look for visible gas, slight doming and dough that is active but not collapsing.",
      whyItMatters: "Room fermentation is sensitive to temperature, so timing matters more.",
    },
    pizza_nerd: {
      instruction: "Manage the room-temperature fermentation against dough strength and ambient temperature.",
      whatToLookFor: "Balance gas production, extensibility and structure retention.",
      technicalNote: "Warm rooms accelerate fermentation; judge readiness by dough behavior rather than duration alone.",
    },
  },
  "ferment-dough": {
    beginner: {
      instruction: "Keep the dough covered and follow the planned fermentation timing.",
      whatToLookFor: "The dough should become a little puffier and more relaxed.",
      reassuranceTip: "If the plan is unclear, keep the dough covered and avoid extra handling.",
    },
    enthusiast: {
      instruction: "Follow the planned fermentation timing while checking the dough condition.",
      whatToLookFor: "Look for growth, gas and dough that still has enough strength.",
      whyItMatters: "Fermentation changes flavor, structure and how the dough opens later.",
    },
    pizza_nerd: {
      instruction: "Use the planned fermentation window as a guide and evaluate the dough state.",
      whatToLookFor: "Assess expansion, gas retention, elasticity and signs of weakening.",
      technicalNote: "When fermentation type is unknown, avoid assuming fridge-specific behavior.",
    },
  },
  "ball-dough": {
    beginner: {
      instruction: "Divide the dough and shape each piece into a smooth ball.",
      whatToLookFor: "Each ball should look round and sit seam-side down.",
      reassuranceTip: "If the dough tears, stop tightening and let it rest briefly.",
    },
    enthusiast: {
      instruction: "Shape the portions with enough surface tension to hold their form.",
      whatToLookFor: "The balls should be smooth, lightly tight and not tearing.",
      whyItMatters: "Good balling helps the dough open evenly and keeps gas in the rim.",
    },
    pizza_nerd: {
      instruction: "Build controlled surface tension without degassing more than needed.",
      whatToLookFor: "Target a tight skin, sealed seam and dough that still feels extensible.",
      technicalNote: "Ball timing affects gas retention, extensibility and final cornicione behavior.",
    },
  },
  "room-temperature-rest": {
    beginner: {
      instruction: "Keep the dough balls covered while they warm and relax.",
      whatToLookFor: "They should feel softer and easier to stretch.",
      reassuranceTip: "Do not leave them uncovered; dry skin makes opening harder.",
    },
    enthusiast: {
      instruction: "Let the balls relax at room temperature until they open without fighting back.",
      whatToLookFor: "Look for gentle spread, softness and slow spring-back when pressed.",
      whyItMatters: "Final rest makes shaping easier and reduces tearing.",
    },
    pizza_nerd: {
      instruction: "Use final rest to tune extensibility before opening.",
      whatToLookFor: "Assess spread, gas distribution, extensibility and resistance.",
      technicalNote: "Ball size, flour strength, dough temperature and room temperature all change the ideal rest.",
    },
  },
  "preheat-oven": {
    beginner: {
      instruction: "Heat the oven and baking surface before you open the dough.",
      whatToLookFor: "The oven should be fully hot before the pizza goes in.",
      reassuranceTip: "Starting too cold often gives pale crust and a soft bottom.",
    },
    enthusiast: {
      instruction: "Give the oven, stone, steel or pizza oven enough time to recover heat.",
      whatToLookFor: "The baking surface should be hot, not just the oven air.",
      whyItMatters: "Stored heat drives bottom bake and oven spring.",
    },
    pizza_nerd: {
      instruction: "Stabilize the baking environment before launch.",
      whatToLookFor: "Watch deck/surface heat, top heat and recovery between pizzas when you can.",
      technicalNote: "Surface temperature, heat balance and recovery time drive browning, lift and bake speed.",
    },
  },
  "prepare-sauce-toppings": {
    beginner: {
      instruction: "Get sauce, cheese and toppings ready before stretching.",
      whatToLookFor: "Everything should be within reach and not dripping wet.",
      reassuranceTip: "A ready topping setup keeps the dough from sitting too long.",
    },
    enthusiast: {
      instruction: "Prepare a restrained, organized topping setup before opening the dough.",
      whatToLookFor: "Wet toppings should be drained and cheese should be easy to portion.",
      whyItMatters: "Too much moisture or delay can make the pizza harder to launch and bake.",
    },
    pizza_nerd: {
      instruction: "Control topping moisture and load before the dough is opened.",
      whatToLookFor: "Match topping weight and wetness to oven power and bake duration.",
      technicalNote: "Slower ovens generally need a drier, lighter topping load than high-heat pizza ovens.",
    },
  },
  "bake-pizza": {
    beginner: {
      instruction: "Bake one pizza at a time and watch the color.",
      whatToLookFor: "The rim should brown, the cheese should melt and the bottom should be cooked.",
      reassuranceTip: "Rotate if one side browns much faster than the other.",
    },
    enthusiast: {
      instruction: "Launch cleanly, watch the rim and bottom, and rotate for even heat.",
      whatToLookFor: "Aim for a browned rim, set toppings and a bottom that is baked but not burned.",
      whyItMatters: "The bake locks in texture; small timing changes are very visible here.",
    },
    pizza_nerd: {
      instruction: "Manage top heat, bottom heat and rotation through the bake.",
      whatToLookFor: "Track rim color, leoparding, bottom bake, cheese melt and moisture release.",
      technicalNote: "Bake time depends on oven type, surface temperature, dough thickness and topping moisture.",
    },
  },
  "review-result": {
    beginner: {
      instruction: "Save one thing that worked and one thing to try next time.",
      whatToLookFor: "Focus on simple notes you will understand later.",
      reassuranceTip: "Even a short note makes the next bake easier.",
    },
    enthusiast: {
      instruction: "Record the result while the bake is still fresh in your mind.",
      whatToLookFor: "Capture handling, bake color, texture and anything you would adjust.",
      whyItMatters: "Specific notes make improvement repeatable.",
    },
    pizza_nerd: {
      instruction: "Log the variables that affected the result.",
      whatToLookFor: "Record timing, temperature, dough feel, opening behavior, bake color and moisture.",
      technicalNote: "Good notes turn one bake into useful comparative data for the next formula decision.",
    },
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
  session?: Pick<PizzaSession, "plannedFermentationHours" | "recipeSnapshot" | "pizzaCount" | "doughBallWeight" | "ovenType"> | null,
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
  const ovenPresentation = getKitchenOvenTaskPresentation(step, session);
  if (ovenPresentation) return ovenPresentation;

  return {
    title: step?.label ?? "Kitchen Mode",
    shortInstruction: isBallDough ? ballInstruction : instruction.shortInstruction,
    doneCondition: step ? kitchenDoneConditions[step.id] ?? "The step is complete and you are ready for the next task." : "You are ready for the next task.",
    helperCopy: step?.helperCopy,
  };
}

function getKitchenOvenTaskPresentation(
  step?: PizzaSessionTimelineStep,
  session?: Pick<PizzaSession, "recipeSnapshot" | "ovenType"> | null,
): KitchenTaskPresentation | undefined {
  if (step?.id !== "preheat-oven" && step?.id !== "bake-pizza") return undefined;
  const bakeProfile = getPizzaSessionBakeProfileForSession(session);
  if (step.id === "preheat-oven") {
    return {
      title: step.label,
      shortInstruction: bakeProfile.preheatInstruction,
      doneCondition: bakeProfile.ovenType === "home"
        ? "The home oven and baking surface are fully hot before opening the pizza."
        : "The oven and baking surface are fully hot before opening the pizza.",
      helperCopy: bakeProfile.surfaceGuidance ?? step.helperCopy,
    };
  }

  return {
    title: step.label,
    shortInstruction: bakeProfile.bakeInstruction,
    doneCondition: "The rim is browned, the bottom is baked, and the cheese is melted.",
    helperCopy: [bakeProfile.bakeTimeLabel, bakeProfile.rotationGuidance].filter(Boolean).join(" · ") || step.helperCopy,
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
    fermentationMode: recipe.ok
      ? recipe.continuousYeast?.recommendation.fermentationMode
      : undefined,
    now,
    anchorTime: session.timeline.anchorTime,
  });

  const effectiveSchedule = deriveEffectiveKitchenSchedule(
    displaySteps,
    session.stepRuntime,
    session.timeline.targetEatTime ?? session.targetEatTime ?? session.targetBakeTime,
  );
  const runtimeSteps = effectiveSchedule.steps;
  const currentStep = runtimeSteps.find((step) => step.status === "todo" && step.id !== "review-result");
  const currentIndex = currentStep
    ? runtimeSteps.findIndex((step) => step.id === currentStep.id)
    : runtimeSteps.length - 1;
  const nextStep = currentStep ? nextTodoAfter(runtimeSteps, currentStep.id) : undefined;
  const doneCount = runtimeSteps.filter((step) => step.status === "done").length;

  return {
    ok: true,
    currentStep,
    currentIndex,
    nextStep,
    doneCount,
    executionConflict: effectiveSchedule.conflict,
    totalCount: runtimeSteps.length,
  };
}

export function getKitchenTaskInstruction(step?: PizzaSessionTimelineStep): KitchenTaskInstruction {
  if (!step) return defaultInstruction;
  return kitchenTaskInstructions[step.id] ?? defaultInstruction;
}

function guidanceKeyForStep(
  step?: PizzaSessionTimelineStep,
  session?: Pick<PizzaSession, "plannedFermentationHours" | "recipeSnapshot"> | null,
) {
  if (!step) return undefined;
  if (isFermentationTimelineStep(step)) {
    const mode = resolveKitchenFermentationMode(session, step);
    if (mode === "room") return "room-ferment";
    if (mode === "cold") return "cold-ferment";
    return "ferment-dough";
  }
  return step.id;
}

export function getKitchenExperienceGuidance(
  step?: PizzaSessionTimelineStep,
  level?: unknown,
  session?: Pick<PizzaSession, "plannedFermentationHours" | "recipeSnapshot"> | null,
): KitchenExperienceGuidance {
  const normalizedLevel = normalizeExperienceLevel(level);
  const key = guidanceKeyForStep(step, session);
  const guidance = key ? kitchenExperienceGuidance[key] : undefined;
  return guidance?.[normalizedLevel] ?? defaultExperienceGuidance[normalizedLevel];
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

export function formatKitchenStepWaitLabel(remainingMinutes: number) {
  const safeMinutes = Math.max(0, Math.ceil(remainingMinutes));
  if (safeMinutes < 60) return `Wait ${safeMinutes} min`;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `Wait ${hours} h${minutes ? ` ${minutes} min` : ""}`;
}

export function formatKitchenRestCountdown(readyAt?: string, now = new Date()) {
  if (!readyAt) return "0:00 remaining";
  const ready = new Date(readyAt);
  if (!Number.isFinite(ready.getTime()) || !Number.isFinite(now.getTime())) return "0:00 remaining";
  const totalSeconds = Math.max(0, Math.ceil((ready.getTime() - now.getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} remaining`;
}

export function formatKitchenMixingWindowStatus(actualStartedAt?: string, now = new Date()) {
  const reservedMilliseconds = 30 * 60_000;
  const started = actualStartedAt ? new Date(actualStartedAt) : undefined;
  const startedAt = started && Number.isFinite(started.getTime()) ? started.getTime() : now.getTime();
  const remainingMilliseconds = startedAt + reservedMilliseconds - now.getTime();
  const durationLabel = (milliseconds: number) => {
    const safeMilliseconds = Math.max(0, milliseconds);
    if (safeMilliseconds > 0 && safeMilliseconds < 60_000) return "less than 1 min";
    const totalMinutes = Math.max(0, Math.ceil(safeMilliseconds / 60_000));
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return [hours ? `${hours} h` : "", minutes ? `${minutes} min` : ""].filter(Boolean).join(" ") || "0 min";
  };

  if (remainingMilliseconds <= 0) {
    const overdueMilliseconds = Math.abs(remainingMilliseconds);
    return overdueMilliseconds > 0 ? `${durationLabel(overdueMilliseconds)} overdue` : "0 min remaining";
  }

  return `${durationLabel(remainingMilliseconds)} remaining`;
}

export function formatKitchenPlannedDuration(totalMinutes?: number) {
  if (typeof totalMinutes !== "number" || !Number.isFinite(totalMinutes) || totalMinutes <= 0) return undefined;
  const safeMinutes = Math.round(totalMinutes);
  if (safeMinutes < 1) return "less than 1 min";
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return [hours ? `${hours} h` : "", minutes ? `${minutes} min` : ""].filter(Boolean).join(" ") || "0 min";
}

export function isRestDoughStep(step?: Pick<PizzaSessionTimelineStep, "id" | "label">) {
  return step?.id === "rest-dough" || step?.label.toLowerCase() === "rest dough";
}

function plannedMinutesBetweenSteps(
  first?: Pick<PizzaSessionTimelineStep, "scheduledAt">,
  second?: Pick<PizzaSessionTimelineStep, "scheduledAt">,
) {
  if (!first?.scheduledAt || !second?.scheduledAt) return undefined;
  const firstDate = new Date(first.scheduledAt);
  const secondDate = new Date(second.scheduledAt);
  if (!Number.isFinite(firstDate.getTime()) || !Number.isFinite(secondDate.getTime())) return undefined;
  const minutes = Math.round((secondDate.getTime() - firstDate.getTime()) / 60_000);
  return minutes > 0 ? minutes : undefined;
}

export function getKitchenPlannedFermentationDurationMinutes(steps?: readonly PizzaSessionTimelineStep[]) {
  if (!steps?.length) return undefined;
  const fermentStep = steps.find((step) => isFermentationTimelineStep(step));
  const ballStep = steps.find((step) => step.id === "ball-dough");
  return plannedMinutesBetweenSteps(fermentStep, ballStep);
}

export function getKitchenRestNextFermentationLabel(
  session?: Pick<PizzaSession, "plannedFermentationHours" | "recipeSnapshot"> | null,
  step?: PizzaSessionTimelineStep,
) {
  if (!isFermentationTimelineStep(step)) return "Fermentation";
  const mode = resolveKitchenFermentationMode(session, step);
  if (mode === "room") return "Room-temperature fermentation";
  if (mode === "cold") return "Cold fermentation";
  return "Fermentation";
}

export function getKitchenStepWaitInfo(
  step?: Pick<PizzaSessionTimelineStep, "scheduledAt">,
  now = new Date(),
): KitchenStepWaitInfo {
  if (!step?.scheduledAt) return { isTooEarly: false, remainingMinutes: 0 };
  const scheduledAt = new Date(step.scheduledAt);
  if (!Number.isFinite(scheduledAt.getTime()) || !Number.isFinite(now.getTime())) {
    return { isTooEarly: false, remainingMinutes: 0 };
  }
  const remainingMinutes = Math.ceil((scheduledAt.getTime() - now.getTime()) / 60_000);
  if (remainingMinutes <= 0) return { isTooEarly: false, remainingMinutes: 0 };
  return {
    isTooEarly: true,
    remainingMinutes,
    waitLabel: formatKitchenStepWaitLabel(remainingMinutes),
  };
}

export function shouldConfirmEarlyKitchenStepCompletion(
  step?: Pick<PizzaSessionTimelineStep, "scheduledAt">,
  now = new Date(),
) {
  return getKitchenStepWaitInfo(step, now).isTooEarly;
}

export function isBiologicalKitchenWaitStep(step?: Pick<PizzaSessionTimelineStep, "id">) {
  return Boolean(step && (
    step.id === "rest-dough"
    || step.id === "cold-ferment"
    || step.id === "room-ferment"
    || step.id === "ferment-dough"
    || step.id === "room-temperature-rest"
  ));
}

function earlyCompletionDurationLabel(remainingMinutes: number) {
  const safeMinutes = Math.max(0, Math.ceil(remainingMinutes));
  if (safeMinutes < 60) return `${safeMinutes} ${safeMinutes === 1 ? "minute" : "minutes"}`;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours} h${minutes ? ` ${minutes} min` : ""}`;
}

export function getEarlyTimedKitchenCompletionWarning(
  step: Pick<PizzaSessionTimelineStep, "id"> | undefined,
  remainingMinutes: number,
): EarlyTimedKitchenCompletionWarning {
  const duration = earlyCompletionDurationLabel(remainingMinutes);
  if (step?.id === "rest-dough") {
    return {
      title: `The dough still needs ${duration} of rest`,
      description: "Continuing early may reduce dough relaxation and affect the next stage.",
    };
  }

  if (step?.id === "room-temperature-rest") {
    return {
      title: `The dough balls still need ${duration} of proofing`,
      description: "Continuing early may make the dough harder to stretch.",
    };
  }

  return {
    title: `The dough still needs ${duration} of fermentation`,
    description: "Continuing early may affect dough development and the final result.",
  };
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
      stepRuntime: runtimeMapWithStepCompletion(session, stepId, now),
      currentStep: currentStepForTimelineStep(nextStep),
      status: statusForTimelineStep(nextStep),
    },
    storage,
    now,
  );
}

function grams(value?: number) {
  if (!Number.isFinite(value)) return undefined;
  const safeValue = value ?? 0;
  const rounded = safeValue >= 1 ? Math.round(safeValue) : Math.round(safeValue * 100) / 100;
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
