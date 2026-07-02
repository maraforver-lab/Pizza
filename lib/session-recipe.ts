import { calculateDoughIngredients } from "@/lib/dough-calculator";
import type { FlourId } from "@/lib/flours";
import { flourIds } from "@/lib/flours";
import { buildPlanningResult } from "@/lib/planning-engine";
import type { PlanningInput } from "@/lib/planning-input";
import type { FermentationMode } from "@/lib/planning-types";
import type { PizzaSession, PizzaSessionRecipeParams, PizzaSessionRecipeSnapshot } from "@/lib/pizza-session";
import { recipeParams } from "@/lib/recipe-url";
import type { Fermentation, OvenType, PizzaGoal, PizzaStyleId, RecipeIngredients, RecipeSettings, YeastType } from "@/lib/saved-recipes";
import { getActivePizzaSession, updatePizzaSession } from "@/lib/pizza-session-storage";

export type SessionRecipePlanningInfo =
  | { ok: true; result: ReturnType<typeof buildPlanningResult> }
  | { ok: false; missingReason: "missing-target-time" | "invalid-target-time" };

export type SessionRecipeBuildResult =
  | { ok: true; settings: RecipeSettings; ingredients: RecipeIngredients; recipeParams: PizzaSessionRecipeParams; recipeSnapshot: PizzaSessionRecipeSnapshot; planningInfo: SessionRecipePlanningInfo }
  | { ok: false; missingReason: "no-session" | "missing-path" | "missing-preset" | "missing-quantity" | "missing-flour" };

const flourChoiceToId: Record<string, FlourId> = {
  plain: "caputo-classica",
  bread: "caputo-cuoco",
  "tipo-00": "caputo-pizzeria",
};

// Compatibility bridge: `pizzaPreset` is retained as legacy topping/shopping
// data while the setup UI starts with oven + dough style. Older recipe
// generation still maps those presets to a dough-style fallback. Future
// dough-planning patches should replace this with an explicit dough style field
// without changing topping preset storage.
const presetToStyle: Partial<Record<string, PizzaStyleId>> = {
  margherita: "neapolitan",
  marinara: "neapolitan",
  diavola: "neapolitan",
  funghi: "new-york",
  "pepperoni-salami": "new-york",
  "simple-cheese": "neapolitan",
  hawaiian: "new-york",
  mushroom: "new-york",
  "meat-lovers": "new-york",
  "white-pizza": "new-york",
};

function safeFlourId(value?: string): FlourId | undefined {
  if (!value) return undefined;
  if (value === "not-sure") return "caputo-pizzeria";
  if (flourIds.includes(value as FlourId)) return value as FlourId;
  return flourChoiceToId[value];
}

function planningFermentationModeFromRecipe(fermentation: Fermentation): FermentationMode {
  return fermentation.endsWith("cold") ? "cold" : "room";
}

function doughStyleForPlanning(settings: RecipeSettings) {
  if (settings.pizzaStyleId === "detroit" || settings.pizzaStyleId === "sicilian") return "unsupported";
  if (settings.fermentation === "6h-room") return "same_day_neapolitan";
  if (settings.fermentation.endsWith("cold")) return "cold_neapolitan";
  return "neapolitan_direct";
}

function planningInfoFromSessionRecipe({
  session,
  settings,
  ingredients,
  now,
}: {
  session: PizzaSession;
  settings: RecipeSettings;
  ingredients: RecipeIngredients;
  now: Date;
}): SessionRecipePlanningInfo {
  const targetValue = session.targetEatTime ?? session.targetBakeTime;
  if (!targetValue) return { ok: false, missingReason: "missing-target-time" };
  const desiredBakeDateTime = new Date(targetValue);
  if (!Number.isFinite(desiredBakeDateTime.getTime())) {
    return { ok: false, missingReason: "invalid-target-time" };
  }

  const coldFermentation = settings.fermentation.endsWith("cold");
  const planningInput: PlanningInput = {
    currentDateTime: now,
    desiredBakeDateTime,
    userLevel: session.experienceLevel,
    ovenType: settings.ovenType === "gas" ? "pizza_oven" : "home_oven",
    roomTemperature: coldFermentation ? 22 : settings.temperature,
    fridgeTemperature: coldFermentation ? settings.temperature : 4,
    flourSelection: { type: "known_flour_id", flourId: settings.flourId },
    doughBallCount: settings.pizzas,
    doughBallWeight: settings.ballWeight,
    hydration: settings.hydration,
    salt: settings.salt,
    doughStyle: doughStyleForPlanning(settings),
    selectedFermentationMode: planningFermentationModeFromRecipe(settings.fermentation),
    mixingMethod: "hand_mixing",
    yeastType: settings.yeastType,
    calculatedFlourGrams: ingredients.flour,
    calculatedYeastGrams: ingredients.leavener,
  };

  return { ok: true, result: buildPlanningResult(planningInput) };
}

function recipeSettingsFromSession(session: PizzaSession | undefined, now = new Date()): SessionRecipeBuildResult {
  if (!session) return { ok: false, missingReason: "no-session" };
  if (!session.pizzaStyle) return { ok: false, missingReason: "missing-path" };
  if (!session.pizzaPreset) return { ok: false, missingReason: "missing-preset" };
  if (!session.pizzaCount || session.pizzaCount <= 0) return { ok: false, missingReason: "missing-quantity" };

  const flourId = safeFlourId(session.flour);
  if (!flourId) return { ok: false, missingReason: "missing-flour" };

  const isPan = session.pizzaStyle === "pan-tray" || session.ovenType === "pan";
  const isPizzaOven = session.pizzaStyle === "pizza-oven" || session.ovenType === "gas";
  const goal: PizzaGoal = isPan ? "pan" : isPizzaOven ? "balanced" : session.pizzaPreset === "funghi" ? "balanced" : "balanced";
  const ovenType: OvenType = isPizzaOven ? "gas" : "home";
  const ballWeight = isPan ? 650 : ovenType === "gas" ? 260 : 270;
  const fermentation: Fermentation = isPan ? "48h-cold" : ovenType === "gas" ? "12h-room" : "24h-cold";
  const temperature = fermentation.endsWith("cold") ? 4 : 22;
  const hydration = isPan ? 75 : ovenType === "gas" ? 64 : 64;
  const pizzaStyleId = isPan ? "detroit" : presetToStyle[session.pizzaPreset] ?? (ovenType === "gas" ? "neapolitan" : "new-york");

  const settings: RecipeSettings = {
    pizzas: session.pizzaCount,
    ballWeight,
    waste: 3,
    hydration,
    salt: 2.8,
    yeastType: "idy" satisfies YeastType,
    fermentation,
    temperature,
    goal,
    ovenType,
    flourId,
    pizzaStyleId,
  };
  const ingredients = calculateDoughIngredients(settings);
  const params = recipeParams(settings);
  params.set("pizzaPreset", session.pizzaPreset);
  const recipeParamsObject = Object.fromEntries(params.entries());
  const recipeSnapshot: PizzaSessionRecipeSnapshot = {
    balls: settings.pizzas,
    ballWeight: settings.ballWeight,
    waste: settings.waste,
    hydration: settings.hydration,
    salt: settings.salt,
    yeastType: settings.yeastType,
    fermentation: settings.fermentation,
    flour: settings.flourId,
    oven: settings.ovenType,
    pizzaStyle: settings.pizzaStyleId,
    pizzaPreset: session.pizzaPreset,
    totalDough: ingredients.total,
    flourAmount: ingredients.flour,
    waterAmount: ingredients.water,
    saltAmount: ingredients.salt,
    leavenerAmount: ingredients.leavener,
  };
  const planningInfo = planningInfoFromSessionRecipe({ session, settings, ingredients, now });

  return { ok: true, settings, ingredients, recipeParams: recipeParamsObject, recipeSnapshot, planningInfo };
}

export function buildSessionRecipe(session: PizzaSession | undefined, now = new Date()): SessionRecipeBuildResult {
  return recipeSettingsFromSession(session, now);
}

export function generateAndSaveActiveSessionRecipe(storage?: Storage, now = new Date()) {
  const session = getActivePizzaSession(storage);
  const result = buildSessionRecipe(session, now);
  if (!session || !result.ok) return { session, result };

  const updatedSession = updatePizzaSession(
    session.id,
    {
      currentStep: "recipe",
      status: "planning",
      recipeParams: result.recipeParams,
      recipeSnapshot: result.recipeSnapshot,
    },
    storage,
    now,
  );

  return { session: updatedSession, result };
}

export function sessionRecipeQuery(result: Extract<SessionRecipeBuildResult, { ok: true }>) {
  return new URLSearchParams(Object.entries(result.recipeParams).map(([key, value]) => [key, String(value)])).toString();
}
