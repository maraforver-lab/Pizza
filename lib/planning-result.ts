import type {
  PlanningFermentationMode,
  PlanningFlourCategory,
  PlanningQualityScore,
  PlanningTechnicalDetails,
  PlanningWarning,
  PlanningYeastRecommendation,
} from "@/lib/planning-types";

export type PlanningResult = {
  availableFermentationHours: number;
  recommendedFermentationMode: PlanningFermentationMode;
  recommendedFlourCategory: PlanningFlourCategory;
  recommendedHydration: number | null;
  recommendedSalt: number | null;
  recommendedYeast: PlanningYeastRecommendation;
  warnings: PlanningWarning[];
  qualityScore: PlanningQualityScore;
  technicalDetails: PlanningTechnicalDetails;
};

export function createPlanningFoundationResult(input: {
  availableFermentationHours: number;
  warnings?: PlanningWarning[];
}): PlanningResult {
  return {
    availableFermentationHours: input.availableFermentationHours,
    recommendedFermentationMode: "not-recommended-yet",
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
      value: null,
      label: "not-scored-yet",
      rationale: "Quality scoring will be added after planning rules exist.",
    },
    technicalDetails: {
      engineVersion: 1,
      notes: [
        "Planning Engine foundation only.",
        "No fermentation rules, flour recommendations or yeast calculations are implemented yet.",
        "Ingredient gram calculations remain owned by calculateDoughIngredients.",
      ],
      calculationBasis: [
        "availableFermentationHours is calculated from desiredBakeDateTime minus currentDateTime.",
      ],
    },
  };
}
