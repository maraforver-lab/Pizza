import {
  calculateQuickDough,
  defaultQuickFermentationTemperature,
  quickCalculatorDefaults,
  type QuickCalculatorInput,
  type QuickCalculatorResult,
  type QuickFermentationDuration,
  type QuickFermentationEnvironment,
} from "@/lib/quick-calculator/quick-dough-calculator";

export type QuickCalculatorPrototypeEditableInput = Pick<
  QuickCalculatorInput,
  | "pizzaCount"
  | "doughBallWeightGrams"
  | "fermentationDuration"
  | "fermentationEnvironment"
  | "hydrationPercent"
  | "saltPercent"
>;

export const quickCalculatorPrototypeSampleInput = {
  pizzaCount: 4,
  doughBallWeightGrams: 260,
  fermentationDuration: "24h",
  fermentationEnvironment: "cold",
  hydrationPercent: quickCalculatorDefaults.hydrationPercent,
  saltPercent: quickCalculatorDefaults.saltPercent,
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
    yeastType: "idy",
    prefermentMethod: "direct",
    fermentationEnvironment,
    fermentationTemperatureCelsius: defaultQuickFermentationTemperature(fermentationEnvironment),
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
  };
}
