import { calculateDoughIngredients } from "@/lib/dough-calculator";
import type { FlourId } from "@/lib/flours";
import { flourIds } from "@/lib/flours";
import type { PizzaSession, PizzaSessionRecipeParams, PizzaSessionRecipeSnapshot } from "@/lib/pizza-session";
import { recipeParams } from "@/lib/recipe-url";
import type { Fermentation, OvenType, PizzaGoal, PizzaStyleId, RecipeIngredients, RecipeSettings, YeastType } from "@/lib/saved-recipes";
import { getActivePizzaSession, updatePizzaSession } from "@/lib/pizza-session-storage";

export type SessionRecipeBuildResult =
  | { ok: true; settings: RecipeSettings; ingredients: RecipeIngredients; recipeParams: PizzaSessionRecipeParams; recipeSnapshot: PizzaSessionRecipeSnapshot }
  | { ok: false; missingReason: "no-session" | "missing-path" | "missing-preset" | "missing-quantity" | "missing-flour" };

const flourChoiceToId: Record<string, FlourId> = {
  plain: "caputo-classica",
  bread: "caputo-cuoco",
  "tipo-00": "caputo-pizzeria",
};

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

function recipeSettingsFromSession(session: PizzaSession | undefined): SessionRecipeBuildResult {
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

  return { ok: true, settings, ingredients, recipeParams: recipeParamsObject, recipeSnapshot };
}

export function buildSessionRecipe(session: PizzaSession | undefined): SessionRecipeBuildResult {
  return recipeSettingsFromSession(session);
}

export function generateAndSaveActiveSessionRecipe(storage?: Storage, now = new Date()) {
  const session = getActivePizzaSession(storage);
  const result = buildSessionRecipe(session);
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
