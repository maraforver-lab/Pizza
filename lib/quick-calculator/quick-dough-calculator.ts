import { calculateDoughIngredients } from "@/lib/dough-calculator";
import type { ExperienceLevel } from "@/lib/experience-levels";
import {
  calculateQuickAdvancedDoughTools,
  normalizeQuickAdvancedDoughToolsInput,
  quickAdvancedDoughToolsDefaults,
  type QuickAdvancedDoughToolsInput,
  type QuickAdvancedDoughToolsResult,
} from "@/lib/quick-calculator/advanced-dough-tools";
import {
  calculateQuickPizzaSizing,
  normalizeQuickPizzaSizingInput,
  type QuickPizzaSizingInput,
  type QuickPizzaSizingMode,
  type QuickPizzaSizingResult,
  type QuickPizzaStyleId,
} from "@/lib/quick-calculator/pizza-sizing";
import {
  calculateQuickPreferment,
  normalizeQuickPrefermentInput,
  type QuickPrefermentInput,
  type QuickPrefermentMethod,
  type QuickPrefermentResult,
} from "@/lib/quick-calculator/quick-preferments";
import type { Fermentation, RecipeIngredients, RecipeSettings, YeastType } from "@/lib/saved-recipes";

export type QuickFermentationDuration = "6h" | "12h" | "24h" | "48h";
export type QuickFermentationEnvironment = "room" | "cold";

export type QuickCalculatorInput = {
  pizzaCount: number;
  doughBallWeightGrams: number;
  sizingMode: QuickPizzaSizingMode;
  pizzaStyle: QuickPizzaStyleId;
  diameterCm: number;
  panWidthCm: number;
  panLengthCm: number;
  thicknessFactor: number;
  doughLoadingGramsPerSquareCm: number;
  customDoughWeightGrams: number;
  prefermentMethod: QuickPrefermentMethod;
  prefermentedFlourPercent: number;
  prefermentHydrationPercent: number;
  prefermentInoculationPercent: number;
  hydrationPercent: number;
  saltPercent: number;
  yeastType: YeastType;
  fermentationDuration: QuickFermentationDuration;
  fermentationEnvironment: QuickFermentationEnvironment;
  fermentationTemperatureCelsius: number;
  wastePercent: number;
} & QuickAdvancedDoughToolsInput;

export type QuickCalculatorResult = {
  input: QuickCalculatorInput;
  settings: RecipeSettings;
  ingredients: RecipeIngredients;
  sizing: QuickPizzaSizingResult;
  preferment: QuickPrefermentResult;
  advancedTools: QuickAdvancedDoughToolsResult;
  bakerPercentages: QuickCalculatorBakerPercentages;
  summaryText: string;
};

export type QuickCalculatorBakerPercentages = {
  flour: 100;
  water: number;
  salt: number;
  yeast: number;
};

export type QuickCalculatorControlGroup = "batch" | "formula" | "fermentation" | "advanced";

export type QuickCalculatorPresentation = {
  level: ExperienceLevel;
  badge: string;
  heading: string;
  description: string;
  visibleGroups: QuickCalculatorControlGroup[];
  collapsedGroups: QuickCalculatorControlGroup[];
  resultDetail: "simple" | "guided" | "technical";
  showExplanations: boolean;
  showTechnicalResult: boolean;
};

export const quickCalculatorDefaults: QuickCalculatorInput = {
  pizzaCount: 4,
  doughBallWeightGrams: 260,
  sizingMode: "ball-weight",
  pizzaStyle: "neapolitan",
  diameterCm: 32,
  panWidthCm: 30,
  panLengthCm: 40,
  thicknessFactor: 0.32,
  doughLoadingGramsPerSquareCm: 0.65,
  customDoughWeightGrams: 260,
  prefermentMethod: "direct",
  prefermentedFlourPercent: 0,
  prefermentHydrationPercent: 0,
  prefermentInoculationPercent: 0,
  hydrationPercent: 64,
  saltPercent: 2.8,
  yeastType: "idy",
  fermentationDuration: "24h",
  fermentationEnvironment: "cold",
  fermentationTemperatureCelsius: 4,
  wastePercent: 3,
  ...quickAdvancedDoughToolsDefaults,
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

export const quickCalculatorPresentations: Record<ExperienceLevel, QuickCalculatorPresentation> = {
  beginner: {
    level: "beginner",
    badge: "Beginner",
    heading: "Fast recipe, fewer decisions",
    description: "Start with pizza count, ball size, yeast and fermentation. Formula details stay available without crowding the page.",
    visibleGroups: ["batch", "fermentation"],
    collapsedGroups: ["formula", "advanced"],
    resultDetail: "simple",
    showExplanations: true,
    showTechnicalResult: false,
  },
  enthusiast: {
    level: "enthusiast",
    badge: "Enthusiast",
    heading: "Practical control",
    description: "Keep the main dough formula visible and tuck the finer temperature and extra-dough controls into an optional section.",
    visibleGroups: ["batch", "formula", "fermentation"],
    collapsedGroups: ["advanced"],
    resultDetail: "guided",
    showExplanations: true,
    showTechnicalResult: true,
  },
  pizza_nerd: {
    level: "pizza_nerd",
    badge: "Pizza Nerd",
    heading: "All variables exposed",
    description: "Show every Quick Calculator input and the technical percentage readout by default.",
    visibleGroups: ["batch", "formula", "fermentation", "advanced"],
    collapsedGroups: [],
    resultDetail: "technical",
    showExplanations: true,
    showTechnicalResult: true,
  },
};

export function getQuickCalculatorPresentation(level: ExperienceLevel): QuickCalculatorPresentation {
  return quickCalculatorPresentations[level] ?? quickCalculatorPresentations.beginner;
}

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
  const preferment = normalizeQuickPrefermentInput({
    method: input.prefermentMethod,
    prefermentedFlourPercent: input.prefermentedFlourPercent,
    prefermentHydrationPercent: input.prefermentHydrationPercent,
    prefermentInoculationPercent: input.prefermentInoculationPercent,
  } satisfies QuickPrefermentInput);
  const sizing = normalizeQuickPizzaSizingInput({
    sizingMode: input.sizingMode,
    pizzaStyle: input.pizzaStyle,
    quantity: input.pizzaCount,
    ballWeightGrams: input.doughBallWeightGrams,
    diameterCm: input.diameterCm,
    panWidthCm: input.panWidthCm,
    panLengthCm: input.panLengthCm,
    thicknessFactor: input.thicknessFactor,
    doughLoadingGramsPerSquareCm: input.doughLoadingGramsPerSquareCm,
    customDoughWeightGrams: input.customDoughWeightGrams,
  } satisfies QuickPizzaSizingInput);
  const advancedTools = normalizeQuickAdvancedDoughToolsInput({
    targetDoughTemperatureCelsius: input.targetDoughTemperatureCelsius ?? quickAdvancedDoughToolsDefaults.targetDoughTemperatureCelsius,
    flourTemperatureCelsius: input.flourTemperatureCelsius ?? quickAdvancedDoughToolsDefaults.flourTemperatureCelsius,
    roomTemperatureCelsius: input.roomTemperatureCelsius ?? quickAdvancedDoughToolsDefaults.roomTemperatureCelsius,
    prefermentTemperatureCelsius: input.prefermentTemperatureCelsius ?? quickAdvancedDoughToolsDefaults.prefermentTemperatureCelsius,
    mixerFrictionCelsius: input.mixerFrictionCelsius ?? quickAdvancedDoughToolsDefaults.mixerFrictionCelsius,
    reverseFermentationHours: input.reverseFermentationHours ?? quickAdvancedDoughToolsDefaults.reverseFermentationHours,
    yeastConversionFrom: input.yeastConversionFrom ?? quickAdvancedDoughToolsDefaults.yeastConversionFrom,
    yeastConversionTo: input.yeastConversionTo ?? quickAdvancedDoughToolsDefaults.yeastConversionTo,
    yeastConversionAmountGrams: input.yeastConversionAmountGrams ?? quickAdvancedDoughToolsDefaults.yeastConversionAmountGrams,
    customIngredientsEnabled: input.customIngredientsEnabled ?? quickAdvancedDoughToolsDefaults.customIngredientsEnabled,
    oilPercent: input.oilPercent ?? quickAdvancedDoughToolsDefaults.oilPercent,
    sugarPercent: input.sugarPercent ?? quickAdvancedDoughToolsDefaults.sugarPercent,
    maltPercent: input.maltPercent ?? quickAdvancedDoughToolsDefaults.maltPercent,
    flourBlendEnabled: input.flourBlendEnabled ?? quickAdvancedDoughToolsDefaults.flourBlendEnabled,
    flourBlendPrimaryPercent: input.flourBlendPrimaryPercent ?? quickAdvancedDoughToolsDefaults.flourBlendPrimaryPercent,
    flourBlendSecondaryPercent: input.flourBlendSecondaryPercent ?? quickAdvancedDoughToolsDefaults.flourBlendSecondaryPercent,
  } satisfies QuickAdvancedDoughToolsInput);

  return {
    pizzaCount: sizing.quantity,
    doughBallWeightGrams: sizing.ballWeightGrams,
    sizingMode: sizing.sizingMode,
    pizzaStyle: sizing.pizzaStyle,
    diameterCm: sizing.diameterCm,
    panWidthCm: sizing.panWidthCm,
    panLengthCm: sizing.panLengthCm,
    thicknessFactor: sizing.thicknessFactor,
    doughLoadingGramsPerSquareCm: sizing.doughLoadingGramsPerSquareCm,
    customDoughWeightGrams: sizing.customDoughWeightGrams,
    prefermentMethod: preferment.method,
    prefermentedFlourPercent: preferment.prefermentedFlourPercent,
    prefermentHydrationPercent: preferment.prefermentHydrationPercent,
    prefermentInoculationPercent: preferment.prefermentInoculationPercent,
    hydrationPercent: clampNumber(input.hydrationPercent, 40, 100),
    saltPercent: clampNumber(input.saltPercent, 0, 10),
    yeastType: yeastOption.value,
    fermentationDuration: durationOption.value,
    fermentationEnvironment: environmentOption.value,
    fermentationTemperatureCelsius: clampNumber(input.fermentationTemperatureCelsius, 0, 30),
    wastePercent: clampNumber(input.wastePercent, 0, 25),
    ...advancedTools,
  };
}

export function quickCalculatorInputToRecipeSettings(input: QuickCalculatorInput): RecipeSettings {
  const normalized = normalizeQuickCalculatorInput(input);
  const sizing = calculateQuickPizzaSizing({
    sizingMode: normalized.sizingMode,
    pizzaStyle: normalized.pizzaStyle,
    quantity: normalized.pizzaCount,
    ballWeightGrams: normalized.doughBallWeightGrams,
    diameterCm: normalized.diameterCm,
    panWidthCm: normalized.panWidthCm,
    panLengthCm: normalized.panLengthCm,
    thicknessFactor: normalized.thicknessFactor,
    doughLoadingGramsPerSquareCm: normalized.doughLoadingGramsPerSquareCm,
    customDoughWeightGrams: normalized.customDoughWeightGrams,
  });

  return {
    pizzas: normalized.pizzaCount,
    ballWeight: sizing.doughWeightPerPieceGrams,
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

export function buildQuickRecipePlainText(result: Pick<QuickCalculatorResult, "input" | "ingredients" | "sizing" | "preferment" | "advancedTools" | "bakerPercentages">) {
  const yeastLabel = quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Yeast";
  const environmentLabel = quickCalculatorEnvironmentOptions.find((option) => option.value === result.input.fermentationEnvironment)?.label ?? "Fermentation";
  const conversionFromLabel = quickCalculatorYeastOptions.find((option) => option.value === result.advancedTools.yeastConversion.from)?.label ?? "Yeast";
  const conversionToLabel = quickCalculatorYeastOptions.find((option) => option.value === result.advancedTools.yeastConversion.to)?.label ?? "Yeast";
  const lines = [
    "Quick Dough Calculator",
    `${result.input.pizzaCount} ${result.input.sizingMode === "pan" ? "pans" : "pizzas"} × ${Math.round(result.sizing.doughWeightPerPieceGrams)} g dough`,
    `${result.sizing.style.label} · ${result.input.sizingMode}`,
    `${result.preferment.label}`,
    `${result.input.hydrationPercent}% hydration · ${result.input.saltPercent}% salt · ${result.input.wastePercent}% extra dough`,
    `${result.input.fermentationDuration} · ${environmentLabel} · ${result.input.fermentationTemperatureCelsius} °C`,
    "",
    `Total dough: ${Math.round(result.ingredients.total)} g`,
    `Flour: ${Math.round(result.ingredients.flour)} g`,
    `Water: ${Math.round(result.ingredients.water)} g`,
    `Salt: ${Math.round(result.ingredients.salt)} g`,
    `${yeastLabel}: ${result.ingredients.leavener.toFixed(2)} g`,
    "",
    "Preferment",
    `Method: ${result.preferment.label}`,
    `Build flour: ${Math.round(result.preferment.build.flourGrams)} g`,
    `Build water: ${Math.round(result.preferment.build.waterGrams)} g`,
    result.preferment.build.starterGrams > 0
      ? `Levain build: ${Math.round(result.preferment.build.starterGrams)} g`
      : `Build yeast: ${result.preferment.build.commercialYeastGrams.toFixed(2)} g`,
    `Final flour addition: ${Math.round(result.preferment.finalDough.flourGrams)} g`,
    `Final water addition: ${Math.round(result.preferment.finalDough.waterGrams)} g`,
    "",
    "Advanced dough tools",
    `Target dough temperature: ${result.input.targetDoughTemperatureCelsius} °C`,
    `Water temperature estimate: ${Math.round(result.advancedTools.waterTemperature.requiredWaterTemperatureCelsius)} °C`,
    `Yeast conversion: ${result.advancedTools.yeastConversion.inputGrams.toFixed(2)} g ${conversionFromLabel} = ${result.advancedTools.yeastConversion.convertedGrams.toFixed(2)} g ${conversionToLabel}`,
    `Yeast for ${result.advancedTools.reverseFermentation.targetHours} h: ${result.advancedTools.reverseFermentation.yeastGramsForTargetHours.toFixed(2)} g`,
    ...(result.advancedTools.customIngredients.enabled ? [
      `Oil: ${Math.round(result.advancedTools.customIngredients.oilGrams)} g`,
      `Sugar: ${Math.round(result.advancedTools.customIngredients.sugarGrams)} g`,
      `Malt: ${Math.round(result.advancedTools.customIngredients.maltGrams)} g`,
      `Enhanced dough total: ${Math.round(
        result.ingredients.total
        + result.advancedTools.customIngredients.oilGrams
        + result.advancedTools.customIngredients.sugarGrams
        + result.advancedTools.customIngredients.maltGrams,
      )} g`,
    ] : []),
    ...(result.advancedTools.flourBlend.enabled ? [
      `Primary flour: ${Math.round(result.advancedTools.flourBlend.primaryFlourGrams)} g`,
      `Secondary flour: ${Math.round(result.advancedTools.flourBlend.secondaryFlourGrams)} g`,
    ] : []),
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
  const sizing = calculateQuickPizzaSizing({
    sizingMode: normalized.sizingMode,
    pizzaStyle: normalized.pizzaStyle,
    quantity: normalized.pizzaCount,
    ballWeightGrams: normalized.doughBallWeightGrams,
    diameterCm: normalized.diameterCm,
    panWidthCm: normalized.panWidthCm,
    panLengthCm: normalized.panLengthCm,
    thicknessFactor: normalized.thicknessFactor,
    doughLoadingGramsPerSquareCm: normalized.doughLoadingGramsPerSquareCm,
    customDoughWeightGrams: normalized.customDoughWeightGrams,
  });
  const preferment = calculateQuickPreferment(ingredients, {
    method: normalized.prefermentMethod,
    prefermentedFlourPercent: normalized.prefermentedFlourPercent,
    prefermentHydrationPercent: normalized.prefermentHydrationPercent,
    prefermentInoculationPercent: normalized.prefermentInoculationPercent,
  });
  const advancedTools = calculateQuickAdvancedDoughTools(
    ingredients,
    normalized,
    normalized.yeastType,
    normalized.fermentationTemperatureCelsius,
    normalized.prefermentMethod !== "direct",
  );
  const bakerPercentages = buildQuickCalculatorBakerPercentages(normalized, ingredients);

  return {
    input: normalized,
    settings,
    ingredients,
    sizing,
    preferment,
    advancedTools,
    bakerPercentages,
    summaryText: buildQuickRecipePlainText({ input: normalized, ingredients, sizing, preferment, advancedTools, bakerPercentages }),
  };
}
