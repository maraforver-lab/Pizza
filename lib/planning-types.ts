import type { FlourId } from "@/lib/flours";
import type { YeastType } from "@/lib/saved-recipes";

export type UserLevel = "beginner" | "enthusiast" | "pizza_nerd";

export type OvenType = "home_oven" | "pizza_oven";

export type FermentationMode = "room" | "cold" | "hybrid" | "not_recommended";

export type PlanningFermentationSetupCategory =
  | "same_day_room"
  | "room_temperature"
  | "cold_fermentation"
  | "hybrid"
  | "not_enough_time"
  | "too_long_for_selected_setup";

export type PlanningFermentationSetupFitLevel =
  | "good_fit"
  | "workable"
  | "caution"
  | "high_risk"
  | "not_recommended";

export type FlourSelection =
  | { type: "unknown" }
  | { type: "standard_pizza_flour" }
  | { type: "medium_strong_pizza_flour" }
  | { type: "strong_pizza_flour" }
  | { type: "known_flour_id"; flourId: PlanningFlourId };

export type FlourCategory =
  | "standard"
  | "medium_strong"
  | "strong"
  | "very_strong"
  | "unknown";

export type PlanningKnownFlourId =
  | FlourId
  | "unknown_basic_flour"
  | "standard_pizza_flour"
  | "medium_strong_pizza_flour"
  | "strong_pizza_flour"
  | "caputo_pizzeria"
  | "caputo_nuvola"
  | "caputo_saccorosso"
  | "pirkka_w260"
  | "pirkka_w350";

export type PlanningFlourId = PlanningKnownFlourId | (string & {});

export type PlanningWarningSeverity = "info" | "caution" | "high_risk";

export type PlanningYeastType =
  | "fresh_yeast"
  | "instant_dry_yeast"
  | "active_dry_yeast";

export type PlanningYeastConfidence = "none" | "low" | "medium";

export type PlanningYeastRiskLevel =
  | "low"
  | "reasonable"
  | "caution"
  | "high_risk"
  | "not_enough_information";

export type PlanningMixingMethod =
  | "hand_mixing"
  | "stand_mixer"
  | "spiral_mixer";

export type PlanningRoomTemperatureCategory =
  | "cool_room"
  | "normal_room"
  | "warm_room"
  | "hot_room";

export type PlanningFridgeTemperatureCategory =
  | "cold_fridge"
  | "normal_fridge"
  | "warm_fridge";

export type PlanningTemperatureRiskLevel =
  | "low"
  | "caution"
  | "high_risk";

export type PlanningFlourSuitabilityLevel =
  | "good_fit"
  | "workable"
  | "caution"
  | "high_risk"
  | "not_enough_information";

export type PlanningWarning = {
  id: string;
  severity: PlanningWarningSeverity;
  userMessage: string;
  technicalReason: string;
  suggestedFix: string;
  visibleForLevels: UserLevel[];
};

export type PlanningYeastRecommendation = {
  yeastType: YeastType | null;
  amountGrams: number | null;
  placeholderPercent: number | null;
  recommendedFreshYeastPercent: number | null;
  instantDryYeastEquivalentPercent: number | null;
  activeDryYeastEquivalentPercent: number | null;
  yeastConfidence: PlanningYeastConfidence;
  note: string;
};

export type PlanningYeastGuidance = {
  version: 1;
  yeastType: YeastType | null;
  calculatedYeastGrams: number | null;
  flourGrams: number | null;
  calculatedYeastPercentOfFlour: number | null;
  calculatedFreshYeastEquivalentPercent: number | null;
  recommendedFreshYeastPercent: number | null;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  riskLevel: PlanningYeastRiskLevel;
  title: string;
  summary: string;
  cautions: string[];
  suggestedAdjustments: string[];
  technicalNote: string | null;
};

export type PlanningFlourGuidance = {
  version: 1;
  flourSelection: FlourSelection;
  flourType: string;
  flourCategory: FlourCategory;
  profileId: PlanningFlourId | null;
  hydration: number | null;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  ovenType: OvenType;
  doughStyle: string | null;
  proteinPercent: number | null;
  wValue: number | null;
  suitabilityLevel: PlanningFlourSuitabilityLevel;
  riskLevel: PlanningFlourSuitabilityLevel;
  title: string;
  summary: string;
  cautions: string[];
  suggestedAdjustments: string[];
  technicalNote: string | null;
};

export type PlanningQualityLabel =
  | "not_scored_yet"
  | "low"
  | "moderate_low"
  | "moderate"
  | "good";

export type PlanningQualityScore = {
  score: number | null;
  label: PlanningQualityLabel;
  reasons: string[];
};

export type PlanningMixingGuidance = {
  method: PlanningMixingMethod;
  userLevel: UserLevel;
  title: string;
  summary: string;
  recommendedOrder: string[];
  doughFeel: string;
  stopWhen: string;
  avoid: string[];
  cautions: PlanningWarning[];
  levelNotes: string[];
  technicalNotes: string[];
};

export type PlanningTemperatureGuidance = {
  userLevel: UserLevel;
  roomTemperature: number;
  fridgeTemperature: number;
  targetDoughTemperature: number | null;
  mixerFrictionHeat: number | null;
  roomCategory: PlanningRoomTemperatureCategory;
  fridgeCategory: PlanningFridgeTemperatureCategory;
  riskLevel: PlanningTemperatureRiskLevel;
  summary: string;
  roomTemperatureNote: string;
  fridgeTemperatureNote: string;
  mixerFrictionNote: string | null;
  userFacingGuidance: string[];
  levelNotes: string[];
  technicalNotes: string[];
};

export type PlanningFermentationSetupRecommendation = {
  version: 1;
  availableTimeHours: number;
  recommendedSetup: PlanningFermentationSetupCategory;
  recommendedFermentationMode: FermentationMode;
  selectedFermentationMode: FermentationMode | null;
  fitLevel: PlanningFermentationSetupFitLevel;
  riskLevel: PlanningFermentationSetupFitLevel;
  title: string;
  summary: string;
  cautions: string[];
  suggestedAdjustments: string[];
  technicalNote: string | null;
};

export type PlanningFermentationTimelineStepType =
  | "mix_dough"
  | "initial_rest"
  | "bulk_fermentation"
  | "cold_fermentation"
  | "ball_dough"
  | "final_proof"
  | "room_temperature_rest"
  | "bake";

export type PlanningFermentationTimelinePhase =
  | "mixing"
  | "fermentation"
  | "shaping"
  | "proofing"
  | "baking";

export type PlanningFermentationTimelineStep = {
  id: string;
  stepType: PlanningFermentationTimelineStepType;
  phase: PlanningFermentationTimelinePhase;
  title: string;
  instruction: string;
  relativeTiming: string;
  durationMinutes: number | null;
  note: string | null;
  caution: string | null;
  experienceNote: string;
  metadata: {
    fermentationMode: FermentationMode;
    temperatureRole: "room" | "fridge" | "ambient" | "oven" | "none";
    usesExactClockTime: false;
  };
};

export type PlanningFermentationTimeline = {
  version: 1;
  userLevel: UserLevel;
  fermentationMode: FermentationMode;
  totalAvailableHours: number;
  usesExactClockTimes: false;
  assumptions: string[];
  steps: PlanningFermentationTimelineStep[];
};

export type PlanningSourceConfidence = {
  fermentation: "placeholder";
  flour: "placeholder";
  yeast: "placeholder";
  schedule: "placeholder";
};

export type PlanningTemperatureAssumptions = {
  roomTemperature: number;
  fridgeTemperature: number;
  targetDoughTemperature: number | null;
  mixerFrictionHeat: number | null;
  roomCategory: PlanningRoomTemperatureCategory;
  fridgeCategory: PlanningFridgeTemperatureCategory;
  note: string;
};

export type PlanningFlourAssumptions = {
  flourSelection: FlourSelection;
  category: FlourCategory;
  profileId: PlanningFlourId | null;
  displayName: string | null;
  sourceConfidence: "official" | "trusted_secondary" | "inferred" | null;
  note: string;
};

export type PlanningYeastAssumptions = {
  yeastType: YeastType | null;
  supportedYeastTypes: PlanningYeastType[];
  recommendedFreshYeastPercent: number | null;
  instantDryYeastEquivalentPercent: number | null;
  activeDryYeastEquivalentPercent: number | null;
  yeastConfidence: PlanningYeastConfidence;
  yeastModelAssumptions: string[];
  note: string;
};

export type PlanningTechnicalDetails = {
  engineVersion: 1;
  selectedTimeWindow: {
    currentDateTime: string;
    desiredBakeDateTime: string;
  };
  availableFermentationHours: number;
  assumptions: string[];
  sourceConfidence: PlanningSourceConfidence;
  temperatureAssumptions: PlanningTemperatureAssumptions;
  flourAssumptions: PlanningFlourAssumptions;
  yeastAssumptions: PlanningYeastAssumptions;
};

export const USER_LEVELS = ["beginner", "enthusiast", "pizza_nerd"] as const satisfies readonly UserLevel[];

export const OVEN_TYPES = ["home_oven", "pizza_oven"] as const satisfies readonly OvenType[];

export const FERMENTATION_MODES = ["room", "cold", "hybrid", "not_recommended"] as const satisfies readonly FermentationMode[];
