import type {
  FermentationMode,
  PlanningFlourGuidance,
  PlanningDoughTypeGuidance,
  PlanningStartWindowRecommendation,
  FlourCategory,
  PlanningFermentationTimeline,
  PlanningFermentationSetupRecommendation,
  PlanningFlourId,
  PlanningMixingGuidance,
  PlanningTemperatureGuidance,
  PlanningTemperatureAssumptions,
  PlanningQualityScore,
  PlanningTechnicalDetails,
  PlanningYeastGuidance,
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
  mixingGuidance: PlanningMixingGuidance | null;
  fermentationTimeline: PlanningFermentationTimeline | null;
  fermentationSetupRecommendation: PlanningFermentationSetupRecommendation | null;
  yeastGuidance: PlanningYeastGuidance | null;
  flourGuidance: PlanningFlourGuidance | null;
  doughTypeGuidance: PlanningDoughTypeGuidance | null;
  startWindowRecommendation: PlanningStartWindowRecommendation | null;
  temperatureGuidance: PlanningTemperatureGuidance | null;
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
  mixingGuidance?: PlanningMixingGuidance | null;
  fermentationTimeline?: PlanningFermentationTimeline | null;
  fermentationSetupRecommendation?: PlanningFermentationSetupRecommendation | null;
  yeastGuidance?: PlanningYeastGuidance | null;
  flourGuidance?: PlanningFlourGuidance | null;
  doughTypeGuidance?: PlanningDoughTypeGuidance | null;
  startWindowRecommendation?: PlanningStartWindowRecommendation | null;
  temperatureGuidance?: PlanningTemperatureGuidance | null;
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
    targetDoughTemperature: input.temperatureGuidance?.targetDoughTemperature
      ?? input.planningInput.targetDoughTemperature
      ?? null,
    mixerFrictionHeat: input.temperatureGuidance?.mixerFrictionHeat
      ?? input.planningInput.mixerFrictionHeat
      ?? null,
    roomCategory: input.temperatureGuidance?.roomCategory ?? "normal_room",
    fridgeCategory: input.temperatureGuidance?.fridgeCategory ?? "normal_fridge",
    note: input.temperatureGuidance === undefined
      ? "Temperatures are used by conservative v1 planning rules and remain broad assumptions."
      : "Temperature guidance v1 classifies broad risk only and does not change ingredient calculations.",
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
      recommendedFreshYeastPercent: null,
      instantDryYeastEquivalentPercent: null,
      activeDryYeastEquivalentPercent: null,
      yeastConfidence: "none",
      note: "Yeast recommendation is intentionally not calculated in grams by the planning engine.",
    },
    mixingGuidance: input.mixingGuidance ?? null,
    fermentationTimeline: input.fermentationTimeline ?? null,
    fermentationSetupRecommendation: input.fermentationSetupRecommendation ?? null,
    yeastGuidance: input.yeastGuidance ?? null,
    flourGuidance: input.flourGuidance ?? null,
    doughTypeGuidance: input.doughTypeGuidance ?? null,
    startWindowRecommendation: input.startWindowRecommendation ?? null,
    temperatureGuidance: input.temperatureGuidance ?? null,
    warnings: input.warnings ?? [],
    qualityScore: input.qualityScore ?? {
      score: null,
      label: "not_scored_yet",
      reasons: ["Quality scoring will be added after planning rules exist."],
    },
    technicalDetails: {
      engineVersion: 1,
      selectedTimeWindow: {
        currentDateTime: safePlanningDateIso(input.planningInput.currentDateTime),
        desiredBakeDateTime: safePlanningDateIso(input.planningInput.desiredBakeDateTime),
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
        supportedYeastTypes: ["fresh_yeast", "instant_dry_yeast", "active_dry_yeast"],
        recommendedFreshYeastPercent: input.recommendedYeast?.recommendedFreshYeastPercent ?? null,
        instantDryYeastEquivalentPercent: input.recommendedYeast?.instantDryYeastEquivalentPercent ?? null,
        activeDryYeastEquivalentPercent: input.recommendedYeast?.activeDryYeastEquivalentPercent ?? null,
        yeastConfidence: input.recommendedYeast?.yeastConfidence ?? "none",
        yeastModelAssumptions: [
          "Fresh yeast equivalent is the internal base for Planning Engine v1.",
          "Instant dry yeast equivalent is approximately fresh yeast divided by 3.",
          "Active dry yeast equivalent uses a stable v1 conversion factor.",
          "Yeast percentages are planning guidance only and are not connected to calculator gram formulas.",
        ],
        note: input.yeastAssumptionNote ?? "Yeast model is a monotonic placeholder percentage only.",
      },
    },
  };
}

function safePlanningDateIso(date: Date): string {
  const time = date.getTime();
  return Number.isFinite(time) ? date.toISOString() : "invalid-date";
}
