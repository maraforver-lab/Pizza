import type { YeastType } from "@/lib/saved-recipes";
import type {
  FermentationMode,
  PlanningFermentationSetupRecommendation,
  PlanningYeastGuidance,
  PlanningYeastRecommendation,
  PlanningYeastRiskLevel,
  UserLevel,
} from "@/lib/planning-types";

type PlanningYeastGuidanceInput = {
  yeastType?: YeastType;
  calculatedYeastGrams?: number;
  calculatedFlourGrams?: number;
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  recommendedFermentationMode: FermentationMode;
  fermentationSetupRecommendation?: PlanningFermentationSetupRecommendation | null;
  recommendedYeast: PlanningYeastRecommendation;
  roomTemperature: number;
  fridgeTemperature: number;
  userLevel: UserLevel;
};

const FRESH_EQUIVALENT_FACTORS: Record<Extract<YeastType, "cy" | "ady" | "idy">, number> = {
  cy: 1,
  ady: 0.52,
  idy: 0.414,
};

export function buildPlanningYeastGuidance(input: PlanningYeastGuidanceInput): PlanningYeastGuidance {
  const yeastType = input.yeastType ?? null;
  const calculatedYeastGrams = normalizePositiveNumber(input.calculatedYeastGrams);
  const flourGrams = normalizePositiveNumber(input.calculatedFlourGrams);
  const calculatedYeastPercentOfFlour = calculateYeastPercent(calculatedYeastGrams, flourGrams);
  const calculatedFreshYeastEquivalentPercent = calculateFreshEquivalentPercent(yeastType, calculatedYeastPercentOfFlour);
  const recommendedFreshYeastPercent = input.recommendedYeast.recommendedFreshYeastPercent;
  const selectedFermentationMode = input.selectedFermentationMode ?? input.fermentationSetupRecommendation?.selectedFermentationMode ?? null;
  const riskLevel = getYeastRiskLevel({
    yeastType,
    calculatedFreshYeastEquivalentPercent,
    recommendedFreshYeastPercent,
    availableFermentationHours: input.availableFermentationHours,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
  });
  const cautions = buildCautions({
    riskLevel,
    yeastType,
    calculatedFreshYeastEquivalentPercent,
    recommendedFreshYeastPercent,
    availableFermentationHours: input.availableFermentationHours,
    selectedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
  });
  const suggestedAdjustments = buildSuggestedAdjustments({
    riskLevel,
    calculatedFreshYeastEquivalentPercent,
    recommendedFreshYeastPercent,
    availableFermentationHours: input.availableFermentationHours,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
  });

  return {
    version: 1,
    yeastType,
    calculatedYeastGrams,
    flourGrams,
    calculatedYeastPercentOfFlour,
    calculatedFreshYeastEquivalentPercent,
    recommendedFreshYeastPercent,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    riskLevel,
    title: buildTitle(riskLevel),
    summary: buildSummary({
      riskLevel,
      yeastType,
      calculatedFreshYeastEquivalentPercent,
      recommendedFreshYeastPercent,
      availableFermentationHours: input.availableFermentationHours,
      selectedFermentationMode,
    }),
    cautions,
    suggestedAdjustments,
    technicalNote: buildTechnicalNote({
      userLevel: input.userLevel,
      yeastType,
      calculatedYeastPercentOfFlour,
      calculatedFreshYeastEquivalentPercent,
      recommendedFreshYeastPercent,
    }),
  };
}

function normalizePositiveNumber(value: number | undefined): number | null {
  if (!Number.isFinite(value) || value === undefined || value <= 0) return null;
  return round(value, 3);
}

function calculateYeastPercent(yeastGrams: number | null, flourGrams: number | null): number | null {
  if (yeastGrams === null || flourGrams === null || flourGrams <= 0) return null;
  return round((yeastGrams / flourGrams) * 100, 4);
}

function calculateFreshEquivalentPercent(
  yeastType: YeastType | null,
  yeastPercent: number | null,
): number | null {
  if (yeastPercent === null || !yeastType) return null;
  if (yeastType === "ssd" || yeastType === "lsd") return null;
  const factor = FRESH_EQUIVALENT_FACTORS[yeastType];
  return round(yeastPercent / factor, 4);
}

function getYeastRiskLevel(input: {
  yeastType: YeastType | null;
  calculatedFreshYeastEquivalentPercent: number | null;
  recommendedFreshYeastPercent: number | null;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
}): PlanningYeastRiskLevel {
  if (!input.yeastType || input.calculatedFreshYeastEquivalentPercent === null || input.recommendedFreshYeastPercent === null) {
    return "not_enough_information";
  }

  if (input.yeastType === "ssd" || input.yeastType === "lsd") return "not_enough_information";

  const ratio = input.calculatedFreshYeastEquivalentPercent / input.recommendedFreshYeastPercent;

  if (input.availableFermentationHours < 3) return "high_risk";
  if (ratio >= 2.5) return "high_risk";
  if (ratio <= 0.35 && input.availableFermentationHours < 8) return "high_risk";
  if (ratio >= 1.7) return "caution";
  if (ratio <= 0.55) return "caution";

  if (
    input.selectedFermentationMode === "room"
    && input.availableFermentationHours >= 24
    && input.roomTemperature >= 25
    && ratio > 1.25
  ) {
    return "high_risk";
  }

  if (
    (input.selectedFermentationMode === "cold" || input.recommendedFermentationMode === "cold")
    && input.availableFermentationHours >= 24
    && input.fridgeTemperature > 6
    && ratio > 1.2
  ) {
    return "caution";
  }

  if (ratio >= 0.75 && ratio <= 1.3) return "reasonable";
  return "low";
}

function buildTitle(riskLevel: PlanningYeastRiskLevel): string {
  switch (riskLevel) {
    case "reasonable":
      return "Yeast amount looks broadly reasonable";
    case "low":
      return "Yeast amount looks slightly conservative";
    case "caution":
      return "Yeast amount needs caution";
    case "high_risk":
      return "Yeast amount may be risky";
    case "not_enough_information":
      return "Yeast fit needs more context";
  }
}

function buildSummary(input: {
  riskLevel: PlanningYeastRiskLevel;
  yeastType: YeastType | null;
  calculatedFreshYeastEquivalentPercent: number | null;
  recommendedFreshYeastPercent: number | null;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
}): string {
  if (input.riskLevel === "not_enough_information") {
    if (input.yeastType === "ssd" || input.yeastType === "lsd") {
      return "Sourdough starter activity varies a lot, so v1 does not judge this yeast fit from grams alone.";
    }
    return "DoughTools needs a commercial yeast amount and flour weight before it can compare yeast fit.";
  }

  const plan = input.selectedFermentationMode ? `${input.selectedFermentationMode} plan` : "selected plan";
  const recommended = input.recommendedFreshYeastPercent === null
    ? "the conservative v1 yeast model"
    : `about ${input.recommendedFreshYeastPercent}% fresh yeast equivalent`;
  const actual = input.calculatedFreshYeastEquivalentPercent === null
    ? "the current yeast amount"
    : `about ${input.calculatedFreshYeastEquivalentPercent}% fresh yeast equivalent`;

  if (input.riskLevel === "reasonable") {
    return `For about ${round(input.availableFermentationHours, 1)} h before baking, ${actual} is broadly close to ${recommended} for this ${plan}.`;
  }

  if (input.riskLevel === "low") {
    return `For this ${plan}, ${actual} is a little conservative compared with ${recommended}. Watch dough condition rather than the clock.`;
  }

  if (input.riskLevel === "caution") {
    return `${actual} may need caution for about ${round(input.availableFermentationHours, 1)} h before baking. ${recommended} is the broad v1 reference.`;
  }

  return `${actual} may be risky for about ${round(input.availableFermentationHours, 1)} h before baking. The v1 reference is ${recommended}, so treat this as cautionary guidance.`;
}

function buildCautions(input: {
  riskLevel: PlanningYeastRiskLevel;
  yeastType: YeastType | null;
  calculatedFreshYeastEquivalentPercent: number | null;
  recommendedFreshYeastPercent: number | null;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  roomTemperature: number;
  fridgeTemperature: number;
}): string[] {
  const cautions: string[] = [];

  if (input.riskLevel === "not_enough_information") {
    cautions.push("Yeast guidance v1 does not silently change the recipe amount.");
    return cautions;
  }

  if (input.availableFermentationHours < 6 && input.calculatedFreshYeastEquivalentPercent !== null && input.recommendedFreshYeastPercent !== null) {
    if (input.calculatedFreshYeastEquivalentPercent < input.recommendedFreshYeastPercent * 0.55) {
      cautions.push("Very low yeast can make a short same-day plan slow or under-fermented.");
    }
  }

  if (input.availableFermentationHours >= 24 && input.calculatedFreshYeastEquivalentPercent !== null && input.recommendedFreshYeastPercent !== null) {
    if (input.calculatedFreshYeastEquivalentPercent > input.recommendedFreshYeastPercent * 1.7) {
      cautions.push("High yeast for a long plan may increase over-fermentation risk.");
    }
  }

  if (input.selectedFermentationMode === "room" && input.roomTemperature >= 25) {
    cautions.push("Warm room temperature may make the dough ferment faster than expected.");
  }

  if ((input.selectedFermentationMode === "cold" || input.selectedFermentationMode === "hybrid") && input.fridgeTemperature > 6) {
    cautions.push("Warm fridge temperature may make cold or hybrid fermentation move faster than expected.");
  }

  if (input.riskLevel === "high_risk" && cautions.length === 0) {
    cautions.push("The current yeast amount is far from the conservative v1 reference for this time window.");
  }

  return cautions;
}

function buildSuggestedAdjustments(input: {
  riskLevel: PlanningYeastRiskLevel;
  calculatedFreshYeastEquivalentPercent: number | null;
  recommendedFreshYeastPercent: number | null;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
}): string[] {
  if (input.riskLevel === "not_enough_information") {
    return ["Use the calculated recipe as-is, then judge dough activity and timing manually."];
  }

  const adjustments: string[] = [];

  if (
    input.calculatedFreshYeastEquivalentPercent !== null
    && input.recommendedFreshYeastPercent !== null
    && input.calculatedFreshYeastEquivalentPercent > input.recommendedFreshYeastPercent * 1.7
  ) {
    adjustments.push("Consider reducing yeast or shortening the warm part of the plan.");
  }

  if (
    input.calculatedFreshYeastEquivalentPercent !== null
    && input.recommendedFreshYeastPercent !== null
    && input.calculatedFreshYeastEquivalentPercent < input.recommendedFreshYeastPercent * 0.55
  ) {
    adjustments.push("Consider more time, a warmer proofing environment, or a slightly higher yeast amount.");
  }

  if (input.selectedFermentationMode && input.selectedFermentationMode !== input.recommendedFermentationMode) {
    adjustments.push(`Consider matching the fermentation setup closer to ${input.recommendedFermentationMode.replace("_", " ")}.`);
  }

  if (input.roomTemperature >= 25) adjustments.push("Keep the dough cooler or check it earlier.");
  if (input.fridgeTemperature > 6) adjustments.push("Use a colder fridge setting for long cold plans if possible.");

  if (adjustments.length === 0) {
    adjustments.push("Keep the recipe amount, but judge readiness by dough condition rather than time alone.");
  }

  return adjustments;
}

function buildTechnicalNote(input: {
  userLevel: UserLevel;
  yeastType: YeastType | null;
  calculatedYeastPercentOfFlour: number | null;
  calculatedFreshYeastEquivalentPercent: number | null;
  recommendedFreshYeastPercent: number | null;
}): string | null {
  if (input.userLevel !== "pizza_nerd") return null;

  return [
    "Pizza Nerd note: yeast guidance v1 compares commercial yeast as fresh yeast equivalent.",
    `Selected yeast type: ${input.yeastType ?? "unknown"}.`,
    `Recipe yeast percent: ${input.calculatedYeastPercentOfFlour ?? "unknown"}%.`,
    `Fresh yeast equivalent: ${input.calculatedFreshYeastEquivalentPercent ?? "unknown"}%.`,
    `Planning reference: ${input.recommendedFreshYeastPercent ?? "unknown"}%.`,
    "This is a broad risk screen, not a precise fermentation model.",
  ].join(" ");
}

function round(value: number, digits: number) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
