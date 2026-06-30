import type {
  FermentationMode,
  FlourCategory,
  PlanningFlourId,
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
  recommendedFermentationMode?: FermentationMode;
  recommendedFlourCategory?: FlourCategory;
  recommendedHydration?: number | null;
  recommendedSalt?: number | null;
  recommendedYeast?: PlanningYeastRecommendation;
  warnings?: PlanningWarning[];
  qualityScore?: PlanningQualityScore;
  assumptions?: string[];
  flourAssumptionCategory?: FlourCategory;
  flourAssumptionProfileId?: PlanningFlourId | null;
  flourAssumptionDisplayName?: string | null;
  flourAssumptionSourceConfidence?: "official" | "trusted_secondary" | "inferred" | null;
  flourAssumptionNote?: string;
  yeastAssumptionNote?: string;
}): PlanningResult {
  const temperatureAssumptions: PlanningTemperatureAssumptions = {
    roomTemperature: input.planningInput.roomTemperature,
    fridgeTemperature: input.planningInput.fridgeTemperature,
    note: "Temperatures are used by conservative v1 planning rules and remain broad assumptions.",
  };

  return {
    availableFermentationHours: input.availableFermentationHours,
    recommendedFermentationMode: input.recommendedFermentationMode ?? "not_recommended",
    recommendedFlourCategory: input.recommendedFlourCategory ?? "unknown",
    recommendedHydration: input.recommendedHydration ?? null,
    recommendedSalt: input.recommendedSalt ?? null,
    recommendedYeast: input.recommendedYeast ?? {
      yeastType: null,
      amountGrams: null,
      placeholderPercent: null,
      note: "Yeast recommendation is intentionally not calculated in grams by the planning engine.",
    },
    warnings: input.warnings ?? [],
    qualityScore: input.qualityScore ?? {
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
      assumptions: input.assumptions ?? [
        "Planning Engine foundation with conservative v1 fermentation windows.",
        "Recommendations are broad planning placeholders, not production recipe formulas.",
        "Yeast values are placeholder baker percentages and not gram calculations.",
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
        category: input.flourAssumptionCategory ?? "unknown",
        profileId: input.flourAssumptionProfileId ?? null,
        displayName: input.flourAssumptionDisplayName ?? null,
        sourceConfidence: input.flourAssumptionSourceConfidence ?? null,
        note: input.flourAssumptionNote ?? "Flour category is interpreted only at a broad v1 planning level.",
      },
      yeastAssumptions: {
        yeastType: null,
        note: input.yeastAssumptionNote ?? "Yeast model is a monotonic placeholder percentage only.",
      },
    },
  };
}
