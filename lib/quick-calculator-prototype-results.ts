import {
  calculateQuickDough,
  defaultQuickFermentationTemperature,
  quickCalculatorDefaults,
  type QuickCalculatorInput,
  type QuickCalculatorResult,
  type QuickFermentationDuration,
  type QuickFermentationEnvironment,
} from "@/lib/quick-calculator/quick-dough-calculator";
import type { QuickPrefermentMethod } from "@/lib/quick-calculator/quick-preferments";
import type { YeastType } from "@/lib/saved-recipes";

export type QuickCalculatorPrototypeEditableInput = Pick<
  QuickCalculatorInput,
  | "pizzaCount"
  | "doughBallWeightGrams"
  | "customIngredientsEnabled"
  | "flourBlendEnabled"
  | "flourBlendPrimaryPercent"
  | "flourTemperatureCelsius"
  | "fermentationDuration"
  | "fermentationEnvironment"
  | "fermentationTemperatureCelsius"
  | "hydrationPercent"
  | "maltPercent"
  | "mixerFrictionCelsius"
  | "oilPercent"
  | "prefermentMethod"
  | "prefermentHydrationPercent"
  | "prefermentInoculationPercent"
  | "prefermentedFlourPercent"
  | "reverseFermentationHours"
  | "roomTemperatureCelsius"
  | "saltPercent"
  | "sugarPercent"
  | "targetDoughTemperatureCelsius"
  | "wastePercent"
  | "yeastConversionAmountGrams"
  | "yeastConversionFrom"
  | "yeastConversionTo"
  | "yeastType"
>;

export const quickCalculatorPrototypeSampleInput = {
  pizzaCount: 4,
  doughBallWeightGrams: 260,
  customIngredientsEnabled: quickCalculatorDefaults.customIngredientsEnabled,
  flourBlendEnabled: quickCalculatorDefaults.flourBlendEnabled,
  flourBlendPrimaryPercent: quickCalculatorDefaults.flourBlendPrimaryPercent,
  flourTemperatureCelsius: quickCalculatorDefaults.flourTemperatureCelsius,
  fermentationDuration: "24h",
  fermentationEnvironment: "cold",
  fermentationTemperatureCelsius: defaultQuickFermentationTemperature("cold"),
  hydrationPercent: quickCalculatorDefaults.hydrationPercent,
  maltPercent: quickCalculatorDefaults.maltPercent,
  mixerFrictionCelsius: quickCalculatorDefaults.mixerFrictionCelsius,
  oilPercent: quickCalculatorDefaults.oilPercent,
  prefermentMethod: quickCalculatorDefaults.prefermentMethod,
  prefermentHydrationPercent: quickCalculatorDefaults.prefermentHydrationPercent,
  prefermentInoculationPercent: quickCalculatorDefaults.prefermentInoculationPercent,
  prefermentedFlourPercent: quickCalculatorDefaults.prefermentedFlourPercent,
  reverseFermentationHours: quickCalculatorDefaults.reverseFermentationHours,
  roomTemperatureCelsius: quickCalculatorDefaults.roomTemperatureCelsius,
  saltPercent: quickCalculatorDefaults.saltPercent,
  sugarPercent: quickCalculatorDefaults.sugarPercent,
  targetDoughTemperatureCelsius: quickCalculatorDefaults.targetDoughTemperatureCelsius,
  wastePercent: quickCalculatorDefaults.wastePercent,
  yeastConversionAmountGrams: quickCalculatorDefaults.yeastConversionAmountGrams,
  yeastConversionFrom: quickCalculatorDefaults.yeastConversionFrom,
  yeastConversionTo: quickCalculatorDefaults.yeastConversionTo,
  yeastType: quickCalculatorDefaults.yeastType,
} as const satisfies QuickCalculatorPrototypeEditableInput;

export function buildQuickCalculatorPrototypeInput(
  overrides: Partial<QuickCalculatorPrototypeEditableInput> = {},
): QuickCalculatorInput {
  const fermentationEnvironment = overrides.fermentationEnvironment
    ?? quickCalculatorPrototypeSampleInput.fermentationEnvironment;

  return {
    ...quickCalculatorDefaults,
    ...quickCalculatorPrototypeSampleInput,
    ...overrides,
    sizingMode: "ball-weight",
    pizzaStyle: "neapolitan",
    fermentationEnvironment,
    fermentationTemperatureCelsius: overrides.fermentationTemperatureCelsius
      ?? quickCalculatorPrototypeSampleInput.fermentationTemperatureCelsius
      ?? defaultQuickFermentationTemperature(fermentationEnvironment),
  };
}

export function calculateQuickCalculatorPrototypeResult(
  input: Partial<QuickCalculatorPrototypeEditableInput> = {},
): QuickCalculatorResult {
  return calculateQuickDough(buildQuickCalculatorPrototypeInput(input));
}

export function quickCalculatorPrototypeResultSignature(result: QuickCalculatorResult) {
  return {
    totalDough: Math.round(result.ingredients.total),
    doughBalls: result.input.pizzaCount,
    doughBallWeight: Math.round(result.sizing.doughWeightPerPieceGrams),
    flour: Math.round(result.ingredients.flour),
    water: Math.round(result.ingredients.water),
    salt: Math.round(result.ingredients.salt),
    yeast: Number(result.ingredients.leavener.toFixed(4)),
    hydration: result.input.hydrationPercent,
    saltPercent: result.input.saltPercent,
    duration: result.input.fermentationDuration as QuickFermentationDuration,
    environment: result.input.fermentationEnvironment as QuickFermentationEnvironment,
    temperature: result.input.fermentationTemperatureCelsius,
    waste: result.input.wastePercent,
    yeastType: result.input.yeastType as YeastType,
    preferment: result.input.prefermentMethod as QuickPrefermentMethod,
  };
}
