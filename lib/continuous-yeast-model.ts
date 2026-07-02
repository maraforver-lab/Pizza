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

type YeastAnchor = {
  hours: number;
  freshYeastPercent: number;
};

const FRESH_YEAST_ANCHORS: YeastAnchor[] = [
  { hours: 3, freshYeastPercent: 0.3 },
  { hours: 6, freshYeastPercent: 0.2 },
  { hours: 12, freshYeastPercent: 0.1 },
  { hours: 24, freshYeastPercent: 0.04 },
  { hours: 48, freshYeastPercent: 0.02 },
  { hours: 72, freshYeastPercent: 0.0125 },
];

const PRODUCTION_COMPATIBLE_YEAST_FACTORS: Record<ContinuousYeastType, number> = {
  fresh_yeast: 1,
  // Patch 152 found that planning used 1 / 3 for IDY while production uses 0.414.
  // This isolated helper intentionally uses the current production-compatible factor
  // so future integration can compare outputs without silently changing conversion behavior.
  instant_dry_yeast: 0.414,
  active_dry_yeast: 0.52,
};

export function calculateContinuousYeastRecommendation(
  input: ContinuousYeastModelInput,
): ContinuousYeastModelResult {
  const conversionFactorFromFresh = PRODUCTION_COMPATIBLE_YEAST_FACTORS[input.yeastType];
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

  if (input.fermentationHours < CONTINUOUS_YEAST_MIN_HOURS) {
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

  if (input.fermentationHours > CONTINUOUS_YEAST_MAX_HOURS) {
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

  const baseFreshYeastPercent = interpolateFreshYeastPercent(input.fermentationHours);
  const temperatureAdjustment = getTemperatureAdjustment(input);
  const freshYeastEquivalentPercent = roundYeastPercent(baseFreshYeastPercent * temperatureAdjustment.factor);
  const yeastPercentOfFlour = roundYeastPercent(freshYeastEquivalentPercent * conversionFactorFromFresh);
  const yeastAmountGrams = round((input.flourGrams * yeastPercentOfFlour) / 100, 3);
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
      "Fresh yeast equivalent is interpolated between conservative 3-72 h v1 anchors.",
      "Temperature adjustment is clamped and cautionary, not exact fermentation science.",
      ...temperatureAdjustment.assumptions,
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
      "Commercial yeast conversion uses current production-compatible factors.",
    ],
  };
}

function interpolateFreshYeastPercent(hours: number): number {
  const upperIndex = FRESH_YEAST_ANCHORS.findIndex((anchor) => hours <= anchor.hours);
  if (upperIndex <= 0) return FRESH_YEAST_ANCHORS[0].freshYeastPercent;

  const lower = FRESH_YEAST_ANCHORS[upperIndex - 1];
  const upper = FRESH_YEAST_ANCHORS[upperIndex];
  const position = (Math.log(hours) - Math.log(lower.hours)) / (Math.log(upper.hours) - Math.log(lower.hours));
  const logPercent = Math.log(lower.freshYeastPercent)
    + position * (Math.log(upper.freshYeastPercent) - Math.log(lower.freshYeastPercent));

  return Math.exp(logPercent);
}

function getTemperatureAdjustment(input: ContinuousYeastModelInput): {
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
    const factor = input.temperatureC > 22
      ? Math.max(0.6, 1 - (input.temperatureC - 22) * 0.04)
      : Math.min(1.5, 1 + (22 - input.temperatureC) * 0.05);
    const cautions: string[] = [];

    if (input.temperatureC >= 25) {
      cautions.push("Warm room temperature may make dough ferment faster than expected.");
    }

    if (input.temperatureC <= 18) {
      cautions.push("Cool room temperature may slow fermentation and require more time.");
    }

    return {
      factor,
      cautions,
      assumptions: [`Room temperature reference is 22 °C; applied factor ${round(factor, 3)}.`],
    };
  }

  const factor = input.temperatureC > 4
    ? Math.max(0.75, 1 - (input.temperatureC - 4) * 0.03)
    : Math.min(1.25, 1 + (4 - input.temperatureC) * 0.06);
  const cautions: string[] = [];

  if (input.temperatureC > 6 && input.fermentationHours >= 24) {
    cautions.push("Warm fridge temperature increases risk for long cold fermentation.");
  }

  if (input.temperatureC < 3) {
    cautions.push("Very cold fridge temperature may slow fermentation more than expected.");
  }

  return {
    factor,
    cautions,
    assumptions: [`Cold fermentation temperature reference is 4 °C; applied factor ${round(factor, 3)}.`],
  };
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
