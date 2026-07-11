import { calculateDoughIngredients } from "@/lib/dough-calculator";
import type { Fermentation, RecipeIngredients, RecipeSettings, YeastType } from "@/lib/saved-recipes";

export type QuickCalculatorInput = {
  pizzaCount: number;
  doughBallWeightGrams: number;
  hydrationPercent: number;
  saltPercent: number;
  yeastType: YeastType;
  fermentation: Fermentation;
  fermentationTemperatureCelsius: number;
  wastePercent: number;
};

export type QuickCalculatorResult = {
  input: QuickCalculatorInput;
  settings: RecipeSettings;
  ingredients: RecipeIngredients;
};

export const quickCalculatorDefaults: QuickCalculatorInput = {
  pizzaCount: 4,
  doughBallWeightGrams: 260,
  hydrationPercent: 64,
  saltPercent: 2.8,
  yeastType: "idy",
  fermentation: "24h-cold",
  fermentationTemperatureCelsius: 4,
  wastePercent: 3,
};

export const quickCalculatorFermentationOptions: { value: Fermentation; label: string; temperatureCelsius: number }[] = [
  { value: "6h-room", label: "6 h room temperature", temperatureCelsius: 22 },
  { value: "12h-room", label: "12 h room temperature", temperatureCelsius: 22 },
  { value: "24h-room", label: "24 h room temperature", temperatureCelsius: 22 },
  { value: "24h-cold", label: "24 h cold fermentation", temperatureCelsius: 4 },
  { value: "48h-cold", label: "48 h cold fermentation", temperatureCelsius: 4 },
];

export const quickCalculatorYeastOptions: { value: YeastType; label: string }[] = [
  { value: "idy", label: "Instant dry yeast" },
  { value: "ady", label: "Active dry yeast" },
  { value: "cy", label: "Fresh yeast" },
  { value: "ssd", label: "Stiff sourdough starter" },
  { value: "lsd", label: "Liquid sourdough starter" },
];

const clampNumber = (value: number, min: number, max: number) => (
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
);

export function normalizeQuickCalculatorInput(input: QuickCalculatorInput): QuickCalculatorInput {
  const fermentationOption = quickCalculatorFermentationOptions.find((option) => option.value === input.fermentation)
    ?? quickCalculatorFermentationOptions.find((option) => option.value === quickCalculatorDefaults.fermentation)!;
  const yeastOption = quickCalculatorYeastOptions.find((option) => option.value === input.yeastType)
    ?? quickCalculatorYeastOptions.find((option) => option.value === quickCalculatorDefaults.yeastType)!;

  return {
    pizzaCount: Math.round(clampNumber(input.pizzaCount, 1, 50)),
    doughBallWeightGrams: clampNumber(input.doughBallWeightGrams, 100, 1000),
    hydrationPercent: clampNumber(input.hydrationPercent, 40, 100),
    saltPercent: clampNumber(input.saltPercent, 0, 10),
    yeastType: yeastOption.value,
    fermentation: fermentationOption.value,
    fermentationTemperatureCelsius: clampNumber(input.fermentationTemperatureCelsius, 0, 30),
    wastePercent: clampNumber(input.wastePercent, 0, 25),
  };
}

export function quickCalculatorInputToRecipeSettings(input: QuickCalculatorInput): RecipeSettings {
  const normalized = normalizeQuickCalculatorInput(input);

  return {
    pizzas: normalized.pizzaCount,
    ballWeight: normalized.doughBallWeightGrams,
    waste: normalized.wastePercent,
    hydration: normalized.hydrationPercent,
    salt: normalized.saltPercent,
    yeastType: normalized.yeastType,
    fermentation: normalized.fermentation,
    temperature: normalized.fermentationTemperatureCelsius,
    goal: "balanced",
    ovenType: "gas",
    flourId: "caputo-pizzeria",
    pizzaStyleId: "neapolitan",
  };
}

export function calculateQuickDough(input: QuickCalculatorInput): QuickCalculatorResult {
  const normalized = normalizeQuickCalculatorInput(input);
  const settings = quickCalculatorInputToRecipeSettings(normalized);

  return {
    input: normalized,
    settings,
    ingredients: calculateDoughIngredients(settings),
  };
}
