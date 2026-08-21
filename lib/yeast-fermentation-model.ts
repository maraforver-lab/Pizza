export const ROOM_Q10 = 2;
export const ROOM_REFERENCE_TEMPERATURE_C = 22;
export const ROOM_FRESH_AT_8H_PERCENT = 0.180;
export const ROOM_FRESH_AT_24H_PERCENT = 0.054;
export const DURATION_EXPONENT = 1.0959032742893846;
export const ROOM_COEFFICIENT = 1.7578093848840328;

export const COLD_REFERENCE_TEMPERATURE_C = 4;
export const COLD_TEMPERATURE_Q10 = 4;
export const COLD_IDY_AT_24H_PERCENT = 0.220;
export const COLD_IDY_AT_48H_PERCENT = 0.120;
export const COLD_IDY_AT_72H_PERCENT = 0.075;
export const COLD_WARM_START_MINUTES = 60;
export const COLD_FINAL_WARM_MINUTES = 120;
export const COLD_WARM_PHASE_TEMPERATURE_C = 22;

export const CANONICAL_YEAST_MIN_ROOM_MINUTES = 180;
export const CANONICAL_YEAST_ROOM_COLD_BOUNDARY_MINUTES = 1440;
export const CANONICAL_YEAST_MAX_COLD_MINUTES = 4320;

export type CanonicalFermentationProcess = "room" | "cold";
export type CanonicalYeastType = "fresh" | "instant_dry" | "active_dry";
export type CanonicalYeastStatus = "ok" | "invalid_input" | "out_of_range";

export type CanonicalYeastModelInput = {
  flourGrams: number;
  hydrationPercent: number;
  saltPercent: number;
  fermentationMinutes: number;
  fermentationTemperatureC: number;
  fermentationProcess: CanonicalFermentationProcess;
  yeastType: CanonicalYeastType;
};

export type CanonicalYeastModelResult = {
  status: CanonicalYeastStatus;
  flourGrams: number;
  hydrationPercent: number;
  saltPercent: number;
  fermentationMinutes: number;
  fermentationHours: number;
  fermentationTemperatureC: number;
  fermentationProcess: CanonicalFermentationProcess;
  yeastType: CanonicalYeastType;
  freshYeastPercent: number;
  instantDryYeastPercent: number;
  activeDryYeastPercent: number;
  yeastPercentOfFlour: number;
  yeastGrams: number;
  conversionFactorFromFresh: number;
  roomTemperatureRate: number | null;
  roomEffectiveExposureHours: number | null;
  coldBaseInstantDryYeastPercentAt4C: number | null;
  coldTemperatureMultiplier: number | null;
  coldWarmStartMinutes: number | null;
  coldHoldMinutes: number | null;
  coldFinalWarmMinutes: number | null;
  warnings: string[];
  assumptions: string[];
};

export const CANONICAL_YEAST_FACTORS_FROM_FRESH: Record<CanonicalYeastType, number> = {
  fresh: 1,
  instant_dry: 1 / 3,
  active_dry: 0.4,
};

export function recommendedFermentationProcessForMinutes(
  fermentationMinutes: number,
): CanonicalFermentationProcess {
  return fermentationMinutes <= CANONICAL_YEAST_ROOM_COLD_BOUNDARY_MINUTES ? "room" : "cold";
}

export function calculateCanonicalYeastRequirement(
  input: CanonicalYeastModelInput,
): CanonicalYeastModelResult {
  const fermentationMinutes = normalizeIntegerMinutes(input.fermentationMinutes);
  const fermentationHours = fermentationMinutes / 60;
  const conversionFactorFromFresh = CANONICAL_YEAST_FACTORS_FROM_FRESH[input.yeastType];
  const baseResult = buildBaseResult(input, fermentationMinutes, conversionFactorFromFresh);

  if (
    !Number.isFinite(input.flourGrams)
    || input.flourGrams <= 0
    || !Number.isFinite(input.fermentationTemperatureC)
    || !Number.isFinite(input.hydrationPercent)
    || !Number.isFinite(input.saltPercent)
    || !Number.isFinite(fermentationMinutes)
  ) {
    return {
      ...baseResult,
      status: "invalid_input",
      warnings: ["Canonical yeast model requires positive flour, finite dough inputs, finite temperature and finite duration."],
    };
  }

  if (!durationIsSupported(fermentationMinutes, input.fermentationProcess)) {
    return {
      ...baseResult,
      status: "out_of_range",
      warnings: [`${input.fermentationProcess} fermentation is outside the supported V1 yeast-model duration range.`],
    };
  }

  const processResult = input.fermentationProcess === "room"
    ? calculateRoomFreshYeastPercent(fermentationMinutes, input.fermentationTemperatureC)
    : calculateColdFreshYeastPercent(fermentationMinutes, input.fermentationTemperatureC);
  const freshYeastPercent = processResult.freshYeastPercent;
  const instantDryYeastPercent = freshYeastPercent * CANONICAL_YEAST_FACTORS_FROM_FRESH.instant_dry;
  const activeDryYeastPercent = freshYeastPercent * CANONICAL_YEAST_FACTORS_FROM_FRESH.active_dry;
  const yeastPercentOfFlour = freshYeastPercent * conversionFactorFromFresh;
  const yeastGrams = input.flourGrams * yeastPercentOfFlour / 100;

  return {
    ...baseResult,
    status: "ok",
    freshYeastPercent,
    instantDryYeastPercent,
    activeDryYeastPercent,
    yeastPercentOfFlour,
    yeastGrams,
    roomTemperatureRate: processResult.roomTemperatureRate,
    roomEffectiveExposureHours: processResult.roomEffectiveExposureHours,
    coldBaseInstantDryYeastPercentAt4C: processResult.coldBaseInstantDryYeastPercentAt4C,
    coldTemperatureMultiplier: processResult.coldTemperatureMultiplier,
    coldWarmStartMinutes: processResult.coldWarmStartMinutes,
    coldHoldMinutes: processResult.coldHoldMinutes,
    coldFinalWarmMinutes: processResult.coldFinalWarmMinutes,
    assumptions: [
      "Hydration and salt are retained inputs but do not modify V1 yeast percentage.",
      ...(input.fermentationProcess === "cold"
        ? ["Cold fermentation assumes 1 h room start, cold hold and 2 h final room warm-up/proof."]
        : ["Room fermentation assumes the dough remains at the selected room temperature from mix to bake."]),
    ],
  };
}

export function canonicalYeastTypeFromRecipeYeastType(
  yeastType: "cy" | "idy" | "ady",
): CanonicalYeastType {
  if (yeastType === "cy") return "fresh";
  if (yeastType === "idy") return "instant_dry";
  return "active_dry";
}

function calculateRoomFreshYeastPercent(
  fermentationMinutes: number,
  fermentationTemperatureC: number,
): Pick<CanonicalYeastModelResult,
  "freshYeastPercent"
  | "roomTemperatureRate"
  | "roomEffectiveExposureHours"
  | "coldBaseInstantDryYeastPercentAt4C"
  | "coldTemperatureMultiplier"
  | "coldWarmStartMinutes"
  | "coldHoldMinutes"
  | "coldFinalWarmMinutes"> {
  const durationHours = fermentationMinutes / 60;
  const roomTemperatureRate = ROOM_Q10 ** ((fermentationTemperatureC - ROOM_REFERENCE_TEMPERATURE_C) / 10);
  const roomEffectiveExposureHours = durationHours * roomTemperatureRate;
  const freshYeastPercent = ROOM_COEFFICIENT * roomEffectiveExposureHours ** (-DURATION_EXPONENT);

  return {
    freshYeastPercent,
    roomTemperatureRate,
    roomEffectiveExposureHours,
    coldBaseInstantDryYeastPercentAt4C: null,
    coldTemperatureMultiplier: null,
    coldWarmStartMinutes: null,
    coldHoldMinutes: null,
    coldFinalWarmMinutes: null,
  };
}

function calculateColdFreshYeastPercent(
  fermentationMinutes: number,
  fermentationTemperatureC: number,
): Pick<CanonicalYeastModelResult,
  "freshYeastPercent"
  | "roomTemperatureRate"
  | "roomEffectiveExposureHours"
  | "coldBaseInstantDryYeastPercentAt4C"
  | "coldTemperatureMultiplier"
  | "coldWarmStartMinutes"
  | "coldHoldMinutes"
  | "coldFinalWarmMinutes"> {
  const coldBaseInstantDryYeastPercentAt4C = interpolateColdInstantDryYeastPercentAt4C(fermentationMinutes);
  const coldTemperatureMultiplier = COLD_TEMPERATURE_Q10 ** (
    (COLD_REFERENCE_TEMPERATURE_C - fermentationTemperatureC) / 10
  );
  const instantDryYeastPercent = coldBaseInstantDryYeastPercentAt4C * coldTemperatureMultiplier;
  const freshYeastPercent = instantDryYeastPercent / CANONICAL_YEAST_FACTORS_FROM_FRESH.instant_dry;

  return {
    freshYeastPercent,
    roomTemperatureRate: null,
    roomEffectiveExposureHours: null,
    coldBaseInstantDryYeastPercentAt4C,
    coldTemperatureMultiplier,
    coldWarmStartMinutes: COLD_WARM_START_MINUTES,
    coldHoldMinutes: fermentationMinutes - COLD_WARM_START_MINUTES - COLD_FINAL_WARM_MINUTES,
    coldFinalWarmMinutes: COLD_FINAL_WARM_MINUTES,
  };
}

function interpolateColdInstantDryYeastPercentAt4C(fermentationMinutes: number): number {
  const hours = fermentationMinutes / 60;
  const lower = hours <= 48
    ? { hours: 24, percent: COLD_IDY_AT_24H_PERCENT }
    : { hours: 48, percent: COLD_IDY_AT_48H_PERCENT };
  const upper = hours <= 48
    ? { hours: 48, percent: COLD_IDY_AT_48H_PERCENT }
    : { hours: 72, percent: COLD_IDY_AT_72H_PERCENT };
  const position = (hours - lower.hours) / (upper.hours - lower.hours);
  const logPercent = Math.log(lower.percent)
    + position * (Math.log(upper.percent) - Math.log(lower.percent));

  return Math.exp(logPercent);
}

function buildBaseResult(
  input: CanonicalYeastModelInput,
  fermentationMinutes: number,
  conversionFactorFromFresh: number,
): CanonicalYeastModelResult {
  return {
    status: "invalid_input",
    flourGrams: input.flourGrams,
    hydrationPercent: input.hydrationPercent,
    saltPercent: input.saltPercent,
    fermentationMinutes,
    fermentationHours: fermentationMinutes / 60,
    fermentationTemperatureC: input.fermentationTemperatureC,
    fermentationProcess: input.fermentationProcess,
    yeastType: input.yeastType,
    freshYeastPercent: 0,
    instantDryYeastPercent: 0,
    activeDryYeastPercent: 0,
    yeastPercentOfFlour: 0,
    yeastGrams: 0,
    conversionFactorFromFresh,
    roomTemperatureRate: null,
    roomEffectiveExposureHours: null,
    coldBaseInstantDryYeastPercentAt4C: null,
    coldTemperatureMultiplier: null,
    coldWarmStartMinutes: null,
    coldHoldMinutes: null,
    coldFinalWarmMinutes: null,
    warnings: [],
    assumptions: [],
  };
}

function durationIsSupported(
  fermentationMinutes: number,
  fermentationProcess: CanonicalFermentationProcess,
): boolean {
  if (fermentationProcess === "room") {
    return fermentationMinutes >= CANONICAL_YEAST_MIN_ROOM_MINUTES
      && fermentationMinutes <= CANONICAL_YEAST_ROOM_COLD_BOUNDARY_MINUTES;
  }

  return fermentationMinutes >= CANONICAL_YEAST_ROOM_COLD_BOUNDARY_MINUTES
    && fermentationMinutes <= CANONICAL_YEAST_MAX_COLD_MINUTES;
}

function normalizeIntegerMinutes(value: number): number {
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.round(value);
}
