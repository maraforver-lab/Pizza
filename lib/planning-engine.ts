import { resolvePlanningFlourProfile, type PlanningFlourProfile } from "@/lib/planning-flour-profiles";
import { calculateAvailableFermentationHours, type PlanningInput } from "@/lib/planning-input";
import { createPlanningFoundationResult, type PlanningResult } from "@/lib/planning-result";
import { buildPlanningWarnings } from "@/lib/planning-warning-engine";
import { calculatePlanningYeastRecommendation } from "@/lib/planning-yeast-model";
import type {
  FermentationMode,
  FlourCategory,
  PlanningQualityScore,
} from "@/lib/planning-types";

export const PLANNING_ENGINE_VERSION = 1;

type RuleRecommendation = {
  mode: FermentationMode;
  flourCategory: FlourCategory;
  hydration: number | null;
  salt: number | null;
  qualityScore: PlanningQualityScore;
  assumptions: string[];
};

export function buildPlanningResult(input: PlanningInput): PlanningResult {
  const availableFermentationHours = calculateAvailableFermentationHours(input);
  const flourProfile = resolvePlanningFlourProfile(input.flourSelection);
  const recommendation = recommendForTimeWindow(input, availableFermentationHours, flourProfile);
  const recommendedYeast = calculatePlanningYeastRecommendation({
    availableFermentationHours,
    fermentationMode: recommendation.mode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
    flourProfile,
    userLevel: input.userLevel,
  });
  const warnings = buildPlanningWarnings({
    availableFermentationHours,
    fermentationMode: recommendation.mode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
    flourProfile,
    userLevel: input.userLevel,
    yeastRecommendation: recommendedYeast,
  });

  return createPlanningFoundationResult({
    planningInput: input,
    availableFermentationHours,
    recommendedFermentationMode: recommendation.mode,
    recommendedFlourCategory: recommendation.flourCategory,
    recommendedHydration: recommendation.hydration,
    recommendedSalt: recommendation.salt,
    recommendedYeast,
    warnings,
    qualityScore: recommendation.qualityScore,
    assumptions: [
      "Planning Engine v1 uses conservative broad fermentation time windows.",
      "Recommendations are planning placeholders and are not connected to production UI.",
      "Yeast values come from the conservative Planning Engine v1 yeast model and are not gram calculations.",
      "Shorter fermentation windows use higher yeast placeholders; longer windows use lower yeast placeholders.",
      "Ingredient gram calculations remain owned by calculateDoughIngredients.",
      ...recommendation.assumptions,
    ],
    flourAssumptionCategory: flourProfile.category,
    flourAssumptionProfileId: flourProfile.flourId,
    flourAssumptionDisplayName: flourProfile.displayName,
    flourAssumptionSourceConfidence: flourProfile.sourceConfidence,
    flourAssumptionNote: "Flour selection is resolved to an internal v1 planning profile only; it is not exposed in production UI.",
    yeastAssumptionNote: "Yeast recommendation uses fresh yeast equivalent as the internal base, with dry yeast equivalents derived from it.",
  });
}

function recommendForTimeWindow(
  input: PlanningInput,
  hours: number,
  flourProfile: PlanningFlourProfile,
): RuleRecommendation {
  const selectedFlourCategory = flourProfile.category;
  const assumptions: string[] = [
    `Input flour resolved to ${flourProfile.displayName} (${flourProfile.flourId}).`,
    `Input flour category interpreted as ${selectedFlourCategory}.`,
    `Flour profile source confidence is ${flourProfile.sourceConfidence}.`,
    `Oven type considered as ${input.ovenType}.`,
    `User level considered as ${input.userLevel}.`,
  ];

  if (hours <= 0) {
    return {
      mode: "not_recommended",
      flourCategory: "unknown",
      hydration: null,
      salt: null,
      assumptions,
      qualityScore: {
        score: 5,
        label: "low",
        reasons: ["There is no usable fermentation window."],
      },
    };
  }

  if (hours < 3) {
    return {
      mode: "not_recommended",
      flourCategory: "unknown",
      hydration: null,
      salt: null,
      assumptions,
      qualityScore: {
        score: 10,
        label: "low",
        reasons: ["Under 3 hours is too short for the conservative v1 dough plan."],
      },
    };
  }

  if (hours < 6) {
    return {
      mode: "room",
      flourCategory: input.userLevel === "beginner" || input.ovenType === "home_oven" ? "standard" : "medium_strong",
      hydration: beginnerSafeHydration(input, 60, 62),
      salt: 2.8,
      assumptions,
      qualityScore: {
        score: 45,
        label: "moderate_low",
        reasons: ["Fast dough is possible, but flavor and handling are compromised."],
      },
    };
  }

  if (hours < 12) {
    return {
      mode: "room",
      flourCategory: "medium_strong",
      hydration: beginnerSafeHydration(input, 62, input.ovenType === "pizza_oven" ? 64 : 63),
      salt: 2.8,
      assumptions,
      qualityScore: {
        score: 60,
        label: "moderate",
        reasons: ["Same-day room fermentation is workable but not the strongest v1 window."],
      },
    };
  }

  if (hours < 24) {
    return {
      mode: input.userLevel === "pizza_nerd" ? "hybrid" : "room",
      flourCategory: "medium_strong",
      hydration: input.ovenType === "pizza_oven" ? 64 : 63,
      salt: 2.8,
      assumptions: [...assumptions, "The 12–24 hour window is marked as the best classic v1 time window."],
      qualityScore: {
        score: 82,
        label: "good",
        reasons: ["This is the best classic v1 time window for a predictable dough."],
      },
    };
  }

  if (hours < 48) {
    return {
      mode: input.ovenType === "pizza_oven" ? "cold" : "hybrid",
      flourCategory: "strong",
      hydration: input.ovenType === "pizza_oven" ? 65 : 64,
      salt: 2.8,
      assumptions,
      qualityScore: {
        score: input.fridgeTemperature > 6 ? 72 : 80,
        label: "good",
        reasons: ["Long fermentation can produce good results when fridge temperature is controlled."],
      },
    };
  }

  if (hours <= 72) {
    const safeAssumptions = input.fridgeTemperature <= 6
      && selectedFlourCategory !== "unknown"
      && selectedFlourCategory !== "standard";

    return {
      mode: input.ovenType === "pizza_oven" ? "cold" : "hybrid",
      flourCategory: selectedFlourCategory === "very_strong" ? "very_strong" : "strong",
      hydration: input.ovenType === "pizza_oven" ? 65 : 64,
      salt: 2.8,
      assumptions,
      qualityScore: {
        score: safeAssumptions ? 78 : 58,
        label: safeAssumptions ? "good" : "moderate",
        reasons: safeAssumptions
          ? ["Long cold or hybrid fermentation is plausible with strong flour and a cool fridge."]
          : ["Long fermentation needs stronger assumptions than v1 can safely verify."],
      },
    };
  }

  return {
    mode: "not_recommended",
    flourCategory: selectedFlourCategory === "very_strong" ? "very_strong" : "strong",
    hydration: input.userLevel === "beginner" ? 64 : 65,
    salt: 2.8,
    assumptions,
    qualityScore: {
      score: input.userLevel === "pizza_nerd" ? 40 : 25,
      label: "low",
      reasons: ["Over 72 hours is outside the safe v1 recommendation model."],
    },
  };
}

function beginnerSafeHydration(input: PlanningInput, beginnerHydration: number, defaultHydration: number): number {
  if (input.userLevel === "beginner") return beginnerHydration;
  if (input.ovenType === "home_oven") return Math.min(defaultHydration, 63);
  return defaultHydration;
}
