import type {
  FermentationMode,
  FlourCategory,
  PlanningTemperatureAssumptions,
  PlanningQualityScore,
  PlanningTechnicalDetails,
  PlanningWarning,
  PlanningYeastRecommendation,
} from "@/lib/planning-types";
import type { PlanningInput } from "@/lib/planning-input";

export type PlanningResult = {
  availableFermentationHours: number;
  recommendedFermentationMode: FermentationMode;
  recommendedFlourCategory: FlourCategory;
  recommendedHydration: number | null;
  recommendedSalt: number | null;
  recommendedYeast: PlanningYeastRecommendation;
  warnings: PlanningWarning[];
  qualityScore: PlanningQualityScore;
  technicalDetails: PlanningTechnicalDetails;
};

export function createPlanningFoundationResult(input: {
  planningInput: PlanningInput;
  availableFermentationHours: number;
  warnings?: PlanningWarning[];
}): PlanningResult {
  const temperatureAssumptions: PlanningTemperatureAssumptions = {
    roomTemperature: input.planningInput.roomTemperature,
    fridgeTemperature: input.planningInput.fridgeTemperature,
    note: "Temperatures are captured for future planning rules only.",
  };

  return {
    availableFermentationHours: input.availableFermentationHours,
    recommendedFermentationMode: "not_recommended",
    recommendedFlourCategory: "unknown",
    recommendedHydration: null,
    recommendedSalt: null,
    recommendedYeast: {
      yeastType: null,
      amountGrams: null,
      note: "Yeast recommendation is intentionally not calculated in the foundation patch.",
    },
    warnings: input.warnings ?? [],
    qualityScore: {
      score: null,
      label: "not_scored_yet",
      reasons: ["Quality scoring will be added after planning rules exist."],
    },
    technicalDetails: {
      engineVersion: 1,
      selectedTimeWindow: {
        currentDateTime: input.planningInput.currentDateTime.toISOString(),
        desiredBakeDateTime: input.planningInput.desiredBakeDateTime.toISOString(),
      },
      availableFermentationHours: input.availableFermentationHours,
      assumptions: [
        "Planning Engine foundation only.",
        "No fermentation rules, flour recommendations or yeast calculations are implemented yet.",
        "Ingredient gram calculations remain owned by calculateDoughIngredients.",
        "availableFermentationHours is calculated from desiredBakeDateTime minus currentDateTime.",
      ],
      sourceConfidence: {
        fermentation: "placeholder",
        flour: "placeholder",
        yeast: "placeholder",
        schedule: "placeholder",
      },
      temperatureAssumptions,
      flourAssumptions: {
        flourSelection: input.planningInput.flourSelection,
        category: "unknown",
        note: "Flour category recommendation is not implemented yet.",
      },
      yeastAssumptions: {
        yeastType: null,
        note: "Yeast model is not implemented yet.",
      },
    },
  };
}
