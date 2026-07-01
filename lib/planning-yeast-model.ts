import type { PlanningFlourProfile } from "@/lib/planning-flour-profiles";
import type { FermentationMode, PlanningYeastConfidence, PlanningYeastRecommendation } from "@/lib/planning-types";

export const INSTANT_DRY_YEAST_FROM_FRESH_FACTOR = 1 / 3;
export const ACTIVE_DRY_YEAST_FROM_FRESH_FACTOR = 0.42;

export type PlanningYeastModelInput = {
  availableFermentationHours: number;
  fermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  flourProfile: PlanningFlourProfile;
  userLevel: "beginner" | "enthusiast" | "pizza_nerd";
};

export function calculatePlanningYeastRecommendation(input: PlanningYeastModelInput): PlanningYeastRecommendation {
  const baseFreshYeastPercent = getBaseFreshYeastPercent(input.availableFermentationHours);

  if (baseFreshYeastPercent === null) {
    return {
      yeastType: null,
      amountGrams: null,
      placeholderPercent: null,
      recommendedFreshYeastPercent: null,
      instantDryYeastEquivalentPercent: null,
      activeDryYeastEquivalentPercent: null,
      yeastConfidence: "none",
      note: "No yeast recommendation is provided when the fermentation window is not recommended.",
    };
  }

  const temperatureFactor = getRoomTemperatureFactor(input.roomTemperature);
  const flourFactor = getFlourStrengthFactor(input.flourProfile.category, input.availableFermentationHours);
  const modeFactor = getFermentationModeFactor(input.fermentationMode, input.availableFermentationHours);
  const freshYeastPercent = roundYeastPercent(baseFreshYeastPercent * temperatureFactor * flourFactor * modeFactor);
  const confidence = getYeastConfidence(input);

  return {
    yeastType: null,
    amountGrams: null,
    placeholderPercent: freshYeastPercent,
    recommendedFreshYeastPercent: freshYeastPercent,
    instantDryYeastEquivalentPercent: roundYeastPercent(freshYeastPercent * INSTANT_DRY_YEAST_FROM_FRESH_FACTOR),
    activeDryYeastEquivalentPercent: roundYeastPercent(freshYeastPercent * ACTIVE_DRY_YEAST_FROM_FRESH_FACTOR),
    yeastConfidence: confidence,
    note: "Planning Engine v1 yeast recommendation uses fresh yeast equivalent as the internal base.",
  };
}

function getBaseFreshYeastPercent(hours: number): number | null {
  if (hours <= 0) return null;
  if (hours < 3) return null;
  if (hours < 6) return 0.25;
  if (hours < 12) return 0.14;
  if (hours < 24) return 0.08;
  if (hours < 48) return 0.04;
  if (hours <= 72) return 0.02;
  return 0.01;
}

function getRoomTemperatureFactor(roomTemperature: number): number {
  if (!Number.isFinite(roomTemperature)) return 1;
  if (roomTemperature > 22) return Math.max(0.65, 1 - (roomTemperature - 22) * 0.05);
  if (roomTemperature < 22) return Math.min(1.4, 1 + (22 - roomTemperature) * 0.06);
  return 1;
}

function getFlourStrengthFactor(category: PlanningFlourProfile["category"], hours: number): number {
  if (hours < 6 && category === "very_strong") return 0.95;
  if (hours >= 48 && (category === "unknown" || category === "standard")) return 0.9;
  return 1;
}

function getFermentationModeFactor(mode: FermentationMode, hours: number): number {
  if (mode === "not_recommended") return hours > 72 ? 1 : 0;
  if (hours >= 24 && mode === "cold") return 1;
  if (hours >= 24 && mode === "hybrid") return 1;
  return 1;
}

function getYeastConfidence(input: PlanningYeastModelInput): PlanningYeastConfidence {
  if (input.fermentationMode === "not_recommended") return "low";
  if (input.flourProfile.category === "unknown") return "low";
  if (input.fridgeTemperature > 6 && input.availableFermentationHours >= 24) return "low";
  return "medium";
}

function roundYeastPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10_000) / 10_000;
}
