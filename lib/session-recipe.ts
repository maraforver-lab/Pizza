import { calculateDoughIngredients } from "@/lib/dough-calculator";
import {
  calculateContinuousYeastRecommendation,
  type ContinuousYeastFermentationMode,
  type ContinuousYeastModelResult,
  type ContinuousYeastType,
} from "@/lib/continuous-yeast-model";
import type { FlourId } from "@/lib/flours";
import { flourIds } from "@/lib/flours";
import { buildPlanningResult } from "@/lib/planning-engine";
import type { PlanningInput } from "@/lib/planning-input";
import type { FermentationMode } from "@/lib/planning-types";
import type { PizzaSession, PizzaSessionRecipeParams, PizzaSessionRecipeSnapshot } from "@/lib/pizza-session";
import { recipeParams } from "@/lib/recipe-url";
import type { Fermentation, OvenType, PizzaGoal, PizzaStyleId, RecipeIngredients, RecipeSettings, YeastType } from "@/lib/saved-recipes";
import { buildSessionFlourWGuidance, type SessionFlourWGuidance } from "@/lib/session-flour-w-guidance";
import { getActivePizzaSession, updatePizzaSession } from "@/lib/pizza-session-storage";
import { normalizeSessionYeastType } from "@/lib/yeast-types";

export type SessionRecipePlanningInfo =
  | { ok: true; result: ReturnType<typeof buildPlanningResult> }
  | { ok: false; missingReason: "missing-target-time" | "invalid-target-time" };

export type SessionRecipeContinuousYeastInfo = {
  recommendation: ContinuousYeastModelResult;
  appliedToIngredients: boolean;
  basisLabel: string;
  summary: string;
  availableFermentationHours: number;
  selectedFermentationHours: number;
  selectedByUser: boolean;
};

export type SessionRecipeBuildResult =
  | { ok: true; settings: RecipeSettings; ingredients: RecipeIngredients; recipeParams: PizzaSessionRecipeParams; recipeSnapshot: PizzaSessionRecipeSnapshot; planningInfo: SessionRecipePlanningInfo; continuousYeast: SessionRecipeContinuousYeastInfo | null; flourWGuidance: SessionFlourWGuidance | null }
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

function parseSessionDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function hoursBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / 3_600_000;
}

function continuousYeastTypeFromRecipe(yeastType: YeastType): ContinuousYeastType | null {
  if (yeastType === "cy") return "fresh_yeast";
  if (yeastType === "idy") return "instant_dry_yeast";
  if (yeastType === "ady") return "active_dry_yeast";
  return null;
}

function selectedSessionFlourLabel(value?: string) {
  if (value === "plain") return "All-purpose flour";
  if (value === "bread") return "Bread flour / strong flour";
  if (value === "tipo-00") return "Pizza flour / Tipo 00";
  if (value === "not-sure") return "Flour not specified";
  return "Pizza flour / Tipo 00";
}

function formatYeastBasisHours(hours: number | null) {
  if (hours === null || !Number.isFinite(hours)) return "the available fermentation window";
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} h`;
}

function validSessionPlannedFermentationHours(value: number | undefined, availableHours: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value < 24 || value > 72) return undefined;
  if (!Number.isFinite(availableHours) || availableHours < 24 || availableHours > 72) return undefined;
  return value <= availableHours ? value : undefined;
}

function validSessionHydrationPercent(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value >= 50 && value <= 80 ? value : fallback;
}

function defaultTemperatureForFermentationMode(mode: ContinuousYeastFermentationMode) {
  return mode === "cold" ? 4 : 22;
}

function validSessionFermentationTemperatureC(
  value: number | undefined,
  mode: ContinuousYeastFermentationMode,
) {
  if (typeof value !== "number" || !Number.isFinite(value)) return defaultTemperatureForFermentationMode(mode);
  if (mode === "cold") return value >= 2 && value <= 8 ? value : 4;
  return value >= 18 && value <= 26 ? value : 22;
}

function defaultSessionBallWeight({
  isPan,
  ovenType,
}: {
  isPan: boolean;
  ovenType: OvenType;
}) {
  return isPan ? 650 : ovenType === "gas" ? 260 : 270;
}

function sessionBallWeight({
  session,
  isPan,
  ovenType,
}: {
  session: PizzaSession;
  isPan: boolean;
  ovenType: OvenType;
}) {
  const defaultWeight = defaultSessionBallWeight({ isPan, ovenType });
  if (isPan) return defaultWeight;
  return session.doughBallWeight && session.doughBallWeight >= 180 && session.doughBallWeight <= 350
    ? session.doughBallWeight
    : defaultWeight;
}

function buildContinuousYeastBasisLabel(recommendation: ContinuousYeastModelResult) {
  return `${formatYeastBasisHours(recommendation.fermentationHours)} ${recommendation.fermentationMode} fermentation`;
}

function recipeIngredientsWithYeastPercent(settings: RecipeSettings, yeastPercentOfFlour: number): RecipeIngredients {
  const total = settings.pizzas * settings.ballWeight * (1 + settings.waste / 100);
  const flour = total / (1 + settings.hydration / 100 + settings.salt / 100 + yeastPercentOfFlour / 100);
  return {
    total,
    flour,
    water: flour * settings.hydration / 100,
    salt: flour * settings.salt / 100,
    leavener: flour * yeastPercentOfFlour / 100,
  };
}

function resolveDoughStartForRecipe(session: PizzaSession, now: Date, target: Date) {
  const mode = session.doughStartMode ?? "recommend";
  if (mode === "now") return now;
  if (mode === "later") {
    const laterStart = parseSessionDate(session.doughEarliestStartTime);
    if (laterStart && laterStart.getTime() > now.getTime() && laterStart.getTime() < target.getTime()) {
      return laterStart;
    }
    return now.getTime() < target.getTime() ? now : target;
  }
  return now.getTime() < target.getTime() ? now : target;
}

function buildSessionContinuousYeast({
  session,
  settings,
  baseIngredients,
  planningInfo,
  now,
}: {
  session: PizzaSession;
  settings: RecipeSettings;
  baseIngredients: RecipeIngredients;
  planningInfo: SessionRecipePlanningInfo;
  now: Date;
}): { ingredients: RecipeIngredients; continuousYeast: SessionRecipeContinuousYeastInfo | null } {
  const yeastType = continuousYeastTypeFromRecipe(settings.yeastType);
  const target = parseSessionDate(session.targetEatTime ?? session.targetBakeTime);
  if (!yeastType || !target) return { ingredients: baseIngredients, continuousYeast: null };

  const start = resolveDoughStartForRecipe(session, now, target);
  const availableFermentationHours = hoursBetween(start, target);
  const recommendedMode = planningInfo.ok
    ? planningInfo.result.fermentationSetupRecommendation?.recommendedFermentationMode
    : undefined;
  const mode: ContinuousYeastFermentationMode = recommendedMode === "room" ? "room" : "cold";
  const selectedFermentationHours = mode === "cold"
    ? validSessionPlannedFermentationHours(session.plannedFermentationHours, availableFermentationHours)
    : undefined;
  const fermentationHours = selectedFermentationHours ?? availableFermentationHours;
  const temperatureC = validSessionFermentationTemperatureC(
    session.fermentationTemperatureCOverride,
    mode,
  );
  const initialRecommendation = calculateContinuousYeastRecommendation({
    flourGrams: baseIngredients.flour,
    fermentationHours,
    fermentationMode: mode,
    temperatureC,
    yeastType,
  });

  if (initialRecommendation.status !== "ok" || initialRecommendation.yeastPercentOfFlour === null) {
    const basisLabel = buildContinuousYeastBasisLabel(initialRecommendation);
    const summary = initialRecommendation.status === "long_horizon_required"
      ? "Yeast is not calculated for the full long-horizon window. Use the 24h / 48h / 72h start plan closer to bake day."
      : initialRecommendation.warnings[0] ?? "Continuous yeast guidance needs a valid 3–72h fermentation window.";

    return {
      ingredients: baseIngredients,
      continuousYeast: {
        recommendation: initialRecommendation,
        appliedToIngredients: false,
        basisLabel,
        summary,
        availableFermentationHours,
        selectedFermentationHours: fermentationHours,
        selectedByUser: Boolean(selectedFermentationHours),
      },
    };
  }

  const continuousIngredients = recipeIngredientsWithYeastPercent(settings, initialRecommendation.yeastPercentOfFlour);
  const finalRecommendation = calculateContinuousYeastRecommendation({
    flourGrams: continuousIngredients.flour,
    fermentationHours,
    fermentationMode: mode,
    temperatureC,
    yeastType,
  });
  const basisLabel = buildContinuousYeastBasisLabel(finalRecommendation);

  return {
    ingredients: continuousIngredients,
    continuousYeast: {
      recommendation: finalRecommendation,
      appliedToIngredients: true,
      basisLabel,
      summary: `Yeast amount is calculated for about ${basisLabel}.`,
      availableFermentationHours,
      selectedFermentationHours: fermentationHours,
      selectedByUser: Boolean(selectedFermentationHours),
    },
  };
}

function buildFlourWGuidanceFromSession({
  session,
  continuousYeast,
}: {
  session: PizzaSession;
  continuousYeast: SessionRecipeContinuousYeastInfo | null;
}) {
  if (!continuousYeast) return null;
  return buildSessionFlourWGuidance({
    fermentationHours: continuousYeast.recommendation.fermentationHours,
    fermentationMode: continuousYeast.recommendation.fermentationMode,
    flourSituation: session.flourSituation,
    availableFlourWRanges: session.availableFlourWRanges,
    selectedFlourLabel: selectedSessionFlourLabel(session.flour),
  });
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
  const ballWeight = sessionBallWeight({ session, isPan, ovenType });
  const fermentation: Fermentation = isPan ? "48h-cold" : ovenType === "gas" ? "12h-room" : "24h-cold";
  const fermentationMode = fermentation.endsWith("cold") ? "cold" : "room";
  const temperature = validSessionFermentationTemperatureC(
    session.fermentationTemperatureCOverride,
    fermentationMode,
  );
  const defaultHydration = isPan ? 75 : ovenType === "gas" ? 64 : 64;
  const hydration = validSessionHydrationPercent(session.hydrationPercentOverride, defaultHydration);
  const pizzaStyleId = isPan ? "detroit" : presetToStyle[session.pizzaPreset] ?? (ovenType === "gas" ? "neapolitan" : "new-york");

  const settings: RecipeSettings = {
    pizzas: session.pizzaCount,
    ballWeight,
    waste: 3,
    hydration,
    salt: 2.8,
    yeastType: normalizeSessionYeastType(session.yeastType) satisfies YeastType,
    fermentation,
    temperature,
    goal,
    ovenType,
    flourId,
    pizzaStyleId,
  };
  const baseIngredients = calculateDoughIngredients(settings);
  const basePlanningInfo = planningInfoFromSessionRecipe({ session, settings, ingredients: baseIngredients, now });
  const continuousYeastResult = buildSessionContinuousYeast({
    session,
    settings,
    baseIngredients,
    planningInfo: basePlanningInfo,
    now,
  });
  const ingredients = continuousYeastResult.ingredients;
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
  const flourWGuidance = buildFlourWGuidanceFromSession({
    session,
    continuousYeast: continuousYeastResult.continuousYeast,
  });

  return {
    ok: true,
    settings,
    ingredients,
    recipeParams: recipeParamsObject,
    recipeSnapshot,
    planningInfo,
    continuousYeast: continuousYeastResult.continuousYeast,
    flourWGuidance,
  };
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
