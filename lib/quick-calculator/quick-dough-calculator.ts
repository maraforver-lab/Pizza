import { calculateDoughIngredients } from "@/lib/dough-calculator";
import type { Fermentation, RecipeIngredients, RecipeSettings, YeastType } from "@/lib/saved-recipes";

export type QuickFermentationDuration = "6h" | "12h" | "24h" | "48h";
export type QuickFermentationEnvironment = "room" | "cold";

export type QuickCalculatorInput = {
  pizzaCount: number;
  doughBallWeightGrams: number;
  hydrationPercent: number;
  saltPercent: number;
  yeastType: YeastType;
  fermentationDuration: QuickFermentationDuration;
  fermentationEnvironment: QuickFermentationEnvironment;
  fermentationTemperatureCelsius: number;
  wastePercent: number;
};

export type QuickCalculatorResult = {
  input: QuickCalculatorInput;
  settings: RecipeSettings;
  ingredients: RecipeIngredients;
  bakerPercentages: QuickCalculatorBakerPercentages;
  summaryText: string;
};

export type QuickCalculatorBakerPercentages = {
  flour: 100;
  water: number;
  salt: number;
  yeast: number;
};

export const quickCalculatorDefaults: QuickCalculatorInput = {
  pizzaCount: 4,
  doughBallWeightGrams: 260,
  hydrationPercent: 64,
  saltPercent: 2.8,
  yeastType: "idy",
  fermentationDuration: "24h",
  fermentationEnvironment: "cold",
  fermentationTemperatureCelsius: 4,
  wastePercent: 3,
};

export const quickCalculatorDurationOptions: { value: QuickFermentationDuration; label: string }[] = [
  { value: "6h", label: "6 h" },
  { value: "12h", label: "12 h" },
  { value: "24h", label: "24 h" },
  { value: "48h", label: "48 h" },
];

export const quickCalculatorEnvironmentOptions: { value: QuickFermentationEnvironment; label: string; defaultTemperatureCelsius: number }[] = [
  { value: "room", label: "Room temperature", defaultTemperatureCelsius: 22 },
  { value: "cold", label: "Cold fermentation", defaultTemperatureCelsius: 4 },
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

export function quickFermentationToRecipePreset(input: Pick<QuickCalculatorInput, "fermentationDuration" | "fermentationEnvironment">): Fermentation {
  if (input.fermentationEnvironment === "cold") {
    if (input.fermentationDuration === "48h") return "48h-cold";
    return "24h-cold";
  }

  if (input.fermentationDuration === "6h") return "6h-room";
  if (input.fermentationDuration === "12h") return "12h-room";
  return "24h-room";
}

export function defaultQuickFermentationTemperature(environment: QuickFermentationEnvironment) {
  return quickCalculatorEnvironmentOptions.find((option) => option.value === environment)?.defaultTemperatureCelsius
    ?? quickCalculatorEnvironmentOptions[0].defaultTemperatureCelsius;
}

export function normalizeQuickCalculatorInput(input: QuickCalculatorInput): QuickCalculatorInput {
  const durationOption = quickCalculatorDurationOptions.find((option) => option.value === input.fermentationDuration)
    ?? quickCalculatorDurationOptions.find((option) => option.value === quickCalculatorDefaults.fermentationDuration)!;
  const environmentOption = quickCalculatorEnvironmentOptions.find((option) => option.value === input.fermentationEnvironment)
    ?? quickCalculatorEnvironmentOptions.find((option) => option.value === quickCalculatorDefaults.fermentationEnvironment)!;
  const yeastOption = quickCalculatorYeastOptions.find((option) => option.value === input.yeastType)
    ?? quickCalculatorYeastOptions.find((option) => option.value === quickCalculatorDefaults.yeastType)!;

  return {
    pizzaCount: Math.round(clampNumber(input.pizzaCount, 1, 50)),
    doughBallWeightGrams: clampNumber(input.doughBallWeightGrams, 100, 1000),
    hydrationPercent: clampNumber(input.hydrationPercent, 40, 100),
    saltPercent: clampNumber(input.saltPercent, 0, 10),
    yeastType: yeastOption.value,
    fermentationDuration: durationOption.value,
    fermentationEnvironment: environmentOption.value,
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
    fermentation: quickFermentationToRecipePreset(normalized),
    temperature: normalized.fermentationTemperatureCelsius,
    goal: "balanced",
    ovenType: "gas",
    flourId: "caputo-pizzeria",
    pizzaStyleId: "neapolitan",
  };
}

export function buildQuickCalculatorBakerPercentages(input: QuickCalculatorInput, ingredients: RecipeIngredients): QuickCalculatorBakerPercentages {
  return {
    flour: 100,
    water: input.hydrationPercent,
    salt: input.saltPercent,
    yeast: ingredients.flour > 0 ? ingredients.leavener / ingredients.flour * 100 : 0,
  };
}

export function buildQuickRecipePlainText(result: Pick<QuickCalculatorResult, "input" | "ingredients" | "bakerPercentages">) {
  const yeastLabel = quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Yeast";
  const environmentLabel = quickCalculatorEnvironmentOptions.find((option) => option.value === result.input.fermentationEnvironment)?.label ?? "Fermentation";
  const lines = [
    "Quick Dough Calculator",
    `${result.input.pizzaCount} pizzas × ${result.input.doughBallWeightGrams} g dough balls`,
    `${result.input.hydrationPercent}% hydration · ${result.input.saltPercent}% salt · ${result.input.wastePercent}% extra dough`,
    `${result.input.fermentationDuration} · ${environmentLabel} · ${result.input.fermentationTemperatureCelsius} °C`,
    "",
    `Total dough: ${Math.round(result.ingredients.total)} g`,
    `Flour: ${Math.round(result.ingredients.flour)} g`,
    `Water: ${Math.round(result.ingredients.water)} g`,
    `Salt: ${Math.round(result.ingredients.salt)} g`,
    `${yeastLabel}: ${result.ingredients.leavener.toFixed(2)} g`,
    "",
    "Baker's percentages",
    `Flour: ${result.bakerPercentages.flour}%`,
    `Water: ${result.bakerPercentages.water}%`,
    `Salt: ${result.bakerPercentages.salt}%`,
    `${yeastLabel}: ${result.bakerPercentages.yeast.toFixed(3)}%`,
  ];

  return lines.join("\n");
}

export function calculateQuickDough(input: QuickCalculatorInput): QuickCalculatorResult {
  const normalized = normalizeQuickCalculatorInput(input);
  const settings = quickCalculatorInputToRecipeSettings(normalized);
  const ingredients = calculateDoughIngredients(settings);
  const bakerPercentages = buildQuickCalculatorBakerPercentages(normalized, ingredients);

  return {
    input: normalized,
    settings,
    ingredients,
    bakerPercentages,
    summaryText: buildQuickRecipePlainText({ input: normalized, ingredients, bakerPercentages }),
  };
}
