import type { RecipeIngredients, YeastType } from "@/lib/saved-recipes";
import {
  calculateCanonicalYeastRequirement,
  CANONICAL_YEAST_FACTORS_FROM_FRESH,
  canonicalYeastTypeFromRecipeYeastType,
  recommendedFermentationProcessForMinutes,
  type CanonicalFermentationProcess,
} from "@/lib/yeast-fermentation-model";

export type QuickAdvancedDoughToolsInput = {
  targetDoughTemperatureCelsius: number;
  flourTemperatureCelsius: number;
  roomTemperatureCelsius: number;
  prefermentTemperatureCelsius: number;
  mixerFrictionCelsius: number;
  reverseFermentationHours: number;
  yeastConversionFrom: YeastType;
  yeastConversionTo: YeastType;
  yeastConversionAmountGrams: number;
  customIngredientsEnabled: boolean;
  oilPercent: number;
  sugarPercent: number;
  maltPercent: number;
  flourBlendEnabled: boolean;
  flourBlendPrimaryPercent: number;
  flourBlendSecondaryPercent: number;
};

export type QuickWaterTemperatureResult = {
  targetDoughTemperatureCelsius: number;
  requiredWaterTemperatureCelsius: number;
  factorCount: number;
  flourTemperatureCelsius: number;
  roomTemperatureCelsius: number;
  prefermentTemperatureCelsius?: number;
  mixerFrictionCelsius: number;
};

export type QuickYeastConversionResult = {
  from: YeastType;
  to: YeastType;
  inputGrams: number;
  convertedGrams: number;
};

export type QuickReverseFermentationResult = {
  targetHours: number;
  estimatedHoursFromCurrentYeast: number | null;
  yeastGramsForTargetHours: number;
};

export type QuickCustomIngredientResult = {
  enabled: boolean;
  oilGrams: number;
  sugarGrams: number;
  maltGrams: number;
};

export type QuickFlourBlendResult = {
  enabled: boolean;
  primaryFlourGrams: number;
  secondaryFlourGrams: number;
};

export type QuickAdvancedDoughToolsResult = {
  waterTemperature: QuickWaterTemperatureResult;
  yeastConversion: QuickYeastConversionResult;
  reverseFermentation: QuickReverseFermentationResult;
  customIngredients: QuickCustomIngredientResult;
  flourBlend: QuickFlourBlendResult;
};

export const quickAdvancedDoughToolsDefaults: QuickAdvancedDoughToolsInput = {
  targetDoughTemperatureCelsius: 24,
  flourTemperatureCelsius: 20,
  roomTemperatureCelsius: 22,
  prefermentTemperatureCelsius: 20,
  mixerFrictionCelsius: 3,
  reverseFermentationHours: 24,
  yeastConversionFrom: "idy",
  yeastConversionTo: "ady",
  yeastConversionAmountGrams: 1,
  customIngredientsEnabled: false,
  oilPercent: 0,
  sugarPercent: 0,
  maltPercent: 0,
  flourBlendEnabled: false,
  flourBlendPrimaryPercent: 100,
  flourBlendSecondaryPercent: 0,
};

type CommercialRecipeYeastType = "cy" | "idy" | "ady";

const yeastConversionFactors: Record<YeastType, number> = {
  cy: CANONICAL_YEAST_FACTORS_FROM_FRESH.fresh,
  ady: CANONICAL_YEAST_FACTORS_FROM_FRESH.active_dry,
  idy: CANONICAL_YEAST_FACTORS_FROM_FRESH.instant_dry,
  ssd: 0,
  lsd: 0,
};

const commercialYeastTypes: CommercialRecipeYeastType[] = ["idy", "ady", "cy"];

const clamp = (value: number, min: number, max: number) => (
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min
);

function normalizeYeastType(value: YeastType, fallback: CommercialRecipeYeastType): CommercialRecipeYeastType {
  return commercialYeastTypes.includes(value as CommercialRecipeYeastType)
    ? value as CommercialRecipeYeastType
    : fallback;
}

export function normalizeQuickAdvancedDoughToolsInput(
  input: QuickAdvancedDoughToolsInput,
): QuickAdvancedDoughToolsInput {
  const primary = clamp(input.flourBlendPrimaryPercent, 0, 100);

  return {
    targetDoughTemperatureCelsius: clamp(input.targetDoughTemperatureCelsius, 10, 35),
    flourTemperatureCelsius: clamp(input.flourTemperatureCelsius, 0, 35),
    roomTemperatureCelsius: clamp(input.roomTemperatureCelsius, 0, 35),
    prefermentTemperatureCelsius: clamp(input.prefermentTemperatureCelsius, 0, 35),
    mixerFrictionCelsius: clamp(input.mixerFrictionCelsius, 0, 20),
    reverseFermentationHours: clamp(input.reverseFermentationHours, 1, 96),
    yeastConversionFrom: normalizeYeastType(input.yeastConversionFrom, "idy"),
    yeastConversionTo: normalizeYeastType(input.yeastConversionTo, "ady"),
    yeastConversionAmountGrams: clamp(input.yeastConversionAmountGrams, 0, 500),
    customIngredientsEnabled: Boolean(input.customIngredientsEnabled),
    oilPercent: clamp(input.oilPercent, 0, 20),
    sugarPercent: clamp(input.sugarPercent, 0, 20),
    maltPercent: clamp(input.maltPercent, 0, 10),
    flourBlendEnabled: Boolean(input.flourBlendEnabled),
    flourBlendPrimaryPercent: primary,
    flourBlendSecondaryPercent: 100 - primary,
  };
}

export function calculateWaterTemperature(
  input: Pick<QuickAdvancedDoughToolsInput,
    "targetDoughTemperatureCelsius"
    | "flourTemperatureCelsius"
    | "roomTemperatureCelsius"
    | "prefermentTemperatureCelsius"
    | "mixerFrictionCelsius">,
  includePrefermentTemperature: boolean,
): QuickWaterTemperatureResult {
  const factorCount = includePrefermentTemperature ? 4 : 3;
  const desiredFactorSum = input.targetDoughTemperatureCelsius * factorCount;
  const prefermentTemperature = includePrefermentTemperature ? input.prefermentTemperatureCelsius : 0;
  const requiredWaterTemperatureCelsius = desiredFactorSum
    - input.flourTemperatureCelsius
    - input.roomTemperatureCelsius
    - prefermentTemperature
    - input.mixerFrictionCelsius;

  return {
    targetDoughTemperatureCelsius: input.targetDoughTemperatureCelsius,
    requiredWaterTemperatureCelsius,
    factorCount,
    flourTemperatureCelsius: input.flourTemperatureCelsius,
    roomTemperatureCelsius: input.roomTemperatureCelsius,
    ...(includePrefermentTemperature ? { prefermentTemperatureCelsius: input.prefermentTemperatureCelsius } : {}),
    mixerFrictionCelsius: input.mixerFrictionCelsius,
  };
}

export function convertQuickYeast(
  from: YeastType,
  to: YeastType,
  amountGrams: number,
): QuickYeastConversionResult {
  const normalizedFrom = normalizeYeastType(from, "idy");
  const normalizedTo = normalizeYeastType(to, "ady");
  const safeAmount = clamp(amountGrams, 0, 500);
  const freshYeastEquivalent = safeAmount / yeastConversionFactors[normalizedFrom];
  const convertedGrams = freshYeastEquivalent * yeastConversionFactors[normalizedTo];

  return {
    from: normalizedFrom,
    to: normalizedTo,
    inputGrams: safeAmount,
    convertedGrams,
  };
}

export function calculateQuickReverseFermentation(
  ingredients: RecipeIngredients,
  yeastType: YeastType,
  temperatureCelsius: number,
  targetHours: number,
): QuickReverseFermentationResult {
  const normalizedYeastType = normalizeYeastType(yeastType, "idy");
  const safeTemperature = clamp(temperatureCelsius, 0, 35);
  const safeHours = clamp(targetHours, 1, 96);
  const currentYeastPercent = ingredients.flour > 0 ? ingredients.leavener / ingredients.flour * 100 : 0;
  const targetMinutes = Math.round(safeHours * 60);
  const process = inferReverseFermentationProcess(targetMinutes, safeTemperature);
  const target = calculateCanonicalYeastRequirement({
    flourGrams: Math.max(ingredients.flour, 0),
    hydrationPercent: 0,
    saltPercent: 0,
    fermentationMinutes: targetMinutes,
    fermentationTemperatureC: safeTemperature,
    fermentationProcess: process,
    yeastType: canonicalYeastTypeFromRecipeYeastType(normalizedYeastType),
  });
  const yeastGramsForTargetHours = target.status === "ok" ? target.yeastGrams : 0;
  const estimatedHoursFromCurrentYeast = estimateCanonicalHoursForYeastPercent({
    yeastPercentOfFlour: currentYeastPercent,
    yeastType: normalizedYeastType,
    temperatureCelsius: safeTemperature,
    process,
  });

  return {
    targetHours: safeHours,
    estimatedHoursFromCurrentYeast,
    yeastGramsForTargetHours,
  };
}

function inferReverseFermentationProcess(
  targetMinutes: number,
  temperatureCelsius: number,
): CanonicalFermentationProcess {
  if (temperatureCelsius <= 8 && targetMinutes >= 24 * 60) return "cold";
  return recommendedFermentationProcessForMinutes(targetMinutes);
}

function estimateCanonicalHoursForYeastPercent(input: {
  yeastPercentOfFlour: number;
  yeastType: CommercialRecipeYeastType;
  temperatureCelsius: number;
  process: CanonicalFermentationProcess;
}) {
  if (!Number.isFinite(input.yeastPercentOfFlour) || input.yeastPercentOfFlour <= 0) return null;

  const minMinutes = input.process === "cold" ? 24 * 60 : 3 * 60;
  const maxMinutes = input.process === "cold" ? 72 * 60 : 24 * 60;
  let low = minMinutes;
  let high = maxMinutes;

  for (let index = 0; index < 32; index += 1) {
    const middle = (low + high) / 2;
    const result = calculateCanonicalYeastRequirement({
      flourGrams: 100,
      hydrationPercent: 0,
      saltPercent: 0,
      fermentationMinutes: middle,
      fermentationTemperatureC: input.temperatureCelsius,
      fermentationProcess: input.process,
      yeastType: canonicalYeastTypeFromRecipeYeastType(input.yeastType),
    });

    if (result.status !== "ok") return null;
    if (result.yeastPercentOfFlour > input.yeastPercentOfFlour) {
      low = middle;
    } else {
      high = middle;
    }
  }

  return (low + high) / 120;
}

export function calculateQuickCustomIngredients(
  ingredients: RecipeIngredients,
  input: Pick<QuickAdvancedDoughToolsInput, "customIngredientsEnabled" | "oilPercent" | "sugarPercent" | "maltPercent">,
): QuickCustomIngredientResult {
  if (!input.customIngredientsEnabled) {
    return { enabled: false, oilGrams: 0, sugarGrams: 0, maltGrams: 0 };
  }

  return {
    enabled: true,
    oilGrams: ingredients.flour * input.oilPercent / 100,
    sugarGrams: ingredients.flour * input.sugarPercent / 100,
    maltGrams: ingredients.flour * input.maltPercent / 100,
  };
}

export function calculateQuickFlourBlend(
  ingredients: RecipeIngredients,
  input: Pick<QuickAdvancedDoughToolsInput, "flourBlendEnabled" | "flourBlendPrimaryPercent">,
): QuickFlourBlendResult {
  if (!input.flourBlendEnabled) {
    return {
      enabled: false,
      primaryFlourGrams: ingredients.flour,
      secondaryFlourGrams: 0,
    };
  }

  const primaryPercent = clamp(input.flourBlendPrimaryPercent, 0, 100);
  const primaryFlourGrams = ingredients.flour * primaryPercent / 100;

  return {
    enabled: true,
    primaryFlourGrams,
    secondaryFlourGrams: ingredients.flour - primaryFlourGrams,
  };
}

export function calculateQuickAdvancedDoughTools(
  ingredients: RecipeIngredients,
  input: QuickAdvancedDoughToolsInput,
  yeastType: YeastType,
  fermentationTemperatureCelsius: number,
  includePrefermentTemperature: boolean,
): QuickAdvancedDoughToolsResult {
  const normalized = normalizeQuickAdvancedDoughToolsInput(input);

  return {
    waterTemperature: calculateWaterTemperature(normalized, includePrefermentTemperature),
    yeastConversion: convertQuickYeast(
      normalized.yeastConversionFrom,
      normalized.yeastConversionTo,
      normalized.yeastConversionAmountGrams,
    ),
    reverseFermentation: calculateQuickReverseFermentation(
      ingredients,
      yeastType,
      fermentationTemperatureCelsius,
      normalized.reverseFermentationHours,
    ),
    customIngredients: calculateQuickCustomIngredients(ingredients, normalized),
    flourBlend: calculateQuickFlourBlend(ingredients, normalized),
  };
}
