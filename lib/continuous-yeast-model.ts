import {
  calculateCanonicalYeastRequirement,
  CANONICAL_YEAST_FACTORS_FROM_FRESH,
  CANONICAL_YEAST_MAX_COLD_MINUTES,
  CANONICAL_YEAST_MIN_ROOM_MINUTES,
  COLD_REFERENCE_TEMPERATURE_C,
  ROOM_REFERENCE_TEMPERATURE_C,
  type CanonicalYeastType,
} from "@/lib/yeast-fermentation-model";

export const CONTINUOUS_YEAST_MIN_HOURS = 3;
export const CONTINUOUS_YEAST_MAX_HOURS = 72;
export const LONG_HORIZON_YEAST_WINDOWS_HOURS = [24, 48, 72] as const;

export type ContinuousYeastFermentationMode = "room" | "cold";
export type ContinuousYeastType = "fresh_yeast" | "instant_dry_yeast" | "active_dry_yeast";
export type ContinuousYeastStatus = "ok" | "too_short" | "long_horizon_required" | "not_enough_information";
export type ContinuousYeastRiskLevel = "low" | "caution" | "high_risk" | "not_enough_information";

export type ContinuousYeastModelInput = {
  flourGrams: number;
  fermentationHours: number;
  fermentationMode: ContinuousYeastFermentationMode;
  temperatureC: number;
  yeastType: ContinuousYeastType;
};

export type ContinuousYeastModelResult = {
  status: ContinuousYeastStatus;
  yeastType: ContinuousYeastType;
  flourGrams: number | null;
  fermentationHours: number | null;
  fermentationMode: ContinuousYeastFermentationMode;
  temperatureC: number | null;
  directScalingApplied: boolean;
  longHorizonFallbackRequired: boolean;
  longHorizonRecommendedWindowsHours: readonly number[];
  freshYeastEquivalentPercent: number | null;
  yeastPercentOfFlour: number | null;
  yeastAmountGrams: number | null;
  conversionFactorFromFresh: number;
  riskLevel: ContinuousYeastRiskLevel;
  warnings: string[];
  cautions: string[];
  assumptions: string[];
};

const CANONICAL_CONTINUOUS_YEAST_FACTORS: Record<ContinuousYeastType, number> = {
  fresh_yeast: CANONICAL_YEAST_FACTORS_FROM_FRESH.fresh,
  instant_dry_yeast: CANONICAL_YEAST_FACTORS_FROM_FRESH.instant_dry,
  active_dry_yeast: CANONICAL_YEAST_FACTORS_FROM_FRESH.active_dry,
};

export function calculateContinuousYeastRecommendation(
  input: ContinuousYeastModelInput,
): ContinuousYeastModelResult {
  const conversionFactorFromFresh = CANONICAL_CONTINUOUS_YEAST_FACTORS[input.yeastType];
  const baseResult = buildBaseResult(input, conversionFactorFromFresh);

  if (!Number.isFinite(input.flourGrams) || input.flourGrams <= 0 || !Number.isFinite(input.fermentationHours)) {
    return {
      ...baseResult,
      status: "not_enough_information",
      riskLevel: "not_enough_information",
      warnings: ["Provide a positive flour amount and fermentation window before using continuous yeast scaling."],
      assumptions: [
        ...baseResult.assumptions,
        "Continuous yeast helper did not calculate grams because the input was incomplete.",
      ],
    };
  }

  const fermentationMinutes = Math.round(input.fermentationHours * 60);

  if (fermentationMinutes < CANONICAL_YEAST_MIN_ROOM_MINUTES) {
    return {
      ...baseResult,
      flourGrams: round(input.flourGrams, 3),
      fermentationHours: round(input.fermentationHours, 2),
      temperatureC: normalizeTemperature(input.temperatureC),
      status: "too_short",
      riskLevel: "high_risk",
      warnings: [
        "This is below the 3 h minimum direct yeast-scaling window, so v1 does not treat it as normal fermentation.",
      ],
      assumptions: [
        ...baseResult.assumptions,
        "Use a longer fermentation window or treat this as an emergency dough rather than a normal plan.",
      ],
    };
  }

  if (fermentationMinutes > CANONICAL_YEAST_MAX_COLD_MINUTES) {
    return {
      ...baseResult,
      flourGrams: round(input.flourGrams, 3),
      fermentationHours: round(input.fermentationHours, 2),
      temperatureC: normalizeTemperature(input.temperatureC),
      status: "long_horizon_required",
      riskLevel: "not_enough_information",
      longHorizonFallbackRequired: true,
      warnings: [
        "This horizon is longer than the 72 h direct yeast-scaling limit. Use long-horizon planning and calculate yeast for a 24 h, 48 h, or 72 h plan closer to bake day.",
      ],
      assumptions: [
        ...baseResult.assumptions,
        "The helper did not calculate yeast from the full long horizon.",
      ],
    };
  }

  const canonical = calculateCanonicalYeastRequirement({
    flourGrams: input.flourGrams,
    hydrationPercent: 0,
    saltPercent: 0,
    fermentationMinutes,
    fermentationTemperatureC: input.temperatureC,
    fermentationProcess: input.fermentationMode,
    yeastType: canonicalYeastTypeFromContinuous(input.yeastType),
  });

  if (canonical.status !== "ok") {
    return {
      ...baseResult,
      flourGrams: round(input.flourGrams, 3),
      fermentationHours: round(input.fermentationHours, 2),
      temperatureC: normalizeTemperature(input.temperatureC),
      status: canonical.status === "out_of_range" ? "long_horizon_required" : "not_enough_information",
      riskLevel: canonical.status === "out_of_range" ? "not_enough_information" : "not_enough_information",
      longHorizonFallbackRequired: canonical.status === "out_of_range",
      warnings: canonical.warnings,
      assumptions: [
        ...baseResult.assumptions,
        ...canonical.assumptions,
      ],
    };
  }

  const freshYeastEquivalentPercent = roundYeastPercent(canonical.freshYeastPercent);
  const yeastPercentOfFlour = roundYeastPercent(canonical.yeastPercentOfFlour);
  const yeastAmountGrams = round(canonical.yeastGrams, 3);
  const temperatureAdjustment = getTemperatureAdjustment(input, canonical.coldTemperatureMultiplier ?? canonical.roomTemperatureRate ?? 1);
  const cautions = buildCautions(input, temperatureAdjustment.cautions);
  const riskLevel = getRiskLevel(input, cautions);

  return {
    ...baseResult,
    status: "ok",
    flourGrams: round(input.flourGrams, 3),
    fermentationHours: round(input.fermentationHours, 2),
    temperatureC: normalizeTemperature(input.temperatureC),
    directScalingApplied: true,
    freshYeastEquivalentPercent,
    yeastPercentOfFlour,
    yeastAmountGrams,
    riskLevel,
    cautions,
    assumptions: [
      ...baseResult.assumptions,
      "Fresh yeast equivalent is calculated by the canonical Patch 474A yeast model.",
      "Hydration and salt are retained model inputs but do not modify V1 yeast percentage.",
      ...temperatureAdjustment.assumptions,
      ...canonical.assumptions,
    ],
  };
}

function buildBaseResult(
  input: ContinuousYeastModelInput,
  conversionFactorFromFresh: number,
): ContinuousYeastModelResult {
  return {
    status: "not_enough_information",
    yeastType: input.yeastType,
    flourGrams: null,
    fermentationHours: null,
    fermentationMode: input.fermentationMode,
    temperatureC: null,
    directScalingApplied: false,
    longHorizonFallbackRequired: false,
    longHorizonRecommendedWindowsHours: LONG_HORIZON_YEAST_WINDOWS_HOURS,
    freshYeastEquivalentPercent: null,
    yeastPercentOfFlour: null,
    yeastAmountGrams: null,
    conversionFactorFromFresh,
    riskLevel: "not_enough_information",
    warnings: [],
    cautions: [],
    assumptions: [
      "Direct continuous yeast scaling is limited to 3-72 h before bake.",
      "Commercial yeast conversion uses the canonical Patch 474A factors.",
    ],
  };
}

function getTemperatureAdjustment(input: ContinuousYeastModelInput, appliedFactor = 1): {
  factor: number;
  cautions: string[];
  assumptions: string[];
} {
  if (!Number.isFinite(input.temperatureC)) {
    return {
      factor: 1,
      cautions: ["Temperature is missing, so the helper used the neutral v1 yeast reference."],
      assumptions: ["Missing temperature uses a neutral adjustment factor."],
    };
  }

  if (input.fermentationMode === "room") {
    const cautions: string[] = [];

    if (input.temperatureC >= 25) {
      cautions.push("Warm room temperature may make dough ferment faster than expected.");
    }

    if (input.temperatureC <= 18) {
      cautions.push("Cool room temperature may slow fermentation and require more time.");
    }

    return {
      factor: appliedFactor,
      cautions,
      assumptions: [`Room temperature reference is ${ROOM_REFERENCE_TEMPERATURE_C} °C; applied factor ${round(appliedFactor, 3)}.`],
    };
  }

  const cautions: string[] = [];

  if (input.temperatureC > 6 && input.fermentationHours >= 24) {
    cautions.push("Warm fridge temperature increases risk for long cold fermentation.");
  }

  if (input.temperatureC < 3) {
    cautions.push("Very cold fridge temperature may slow fermentation more than expected.");
  }

  return {
    factor: appliedFactor,
    cautions,
    assumptions: [`Cold fermentation temperature reference is ${COLD_REFERENCE_TEMPERATURE_C} °C; applied factor ${round(appliedFactor, 3)}.`],
  };
}

function canonicalYeastTypeFromContinuous(yeastType: ContinuousYeastType): CanonicalYeastType {
  if (yeastType === "fresh_yeast") return "fresh";
  if (yeastType === "instant_dry_yeast") return "instant_dry";
  return "active_dry";
}

function buildCautions(input: ContinuousYeastModelInput, temperatureCautions: string[]): string[] {
  const cautions = [...temperatureCautions];

  if (input.fermentationHours >= 72) {
    cautions.push("72 h is the upper direct-scaling limit and should be treated cautiously.");
  }

  if (input.fermentationMode === "room" && input.fermentationHours >= 24) {
    cautions.push("Long room-temperature fermentation can become risky if the room is warm.");
  }

  return cautions;
}

function getRiskLevel(input: ContinuousYeastModelInput, cautions: string[]): ContinuousYeastRiskLevel {
  if (
    input.fermentationMode === "room"
    && input.temperatureC >= 27
    && input.fermentationHours >= 12
  ) {
    return "high_risk";
  }

  if (
    input.fermentationMode === "cold"
    && input.temperatureC >= 8
    && input.fermentationHours >= 48
  ) {
    return "high_risk";
  }

  if (cautions.length > 0) return "caution";
  return "low";
}

function normalizeTemperature(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  return round(value, 2);
}

function roundYeastPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100_000) / 100_000;
}

function round(value: number, digits: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
