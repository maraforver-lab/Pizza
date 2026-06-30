import type { FlourId } from "@/lib/flours";
import type { YeastType } from "@/lib/saved-recipes";

export type UserLevel = "beginner" | "enthusiast" | "pizza_nerd";

export type OvenType = "home_oven" | "pizza_oven";

export type FermentationMode = "room" | "cold" | "hybrid" | "not_recommended";

export type FlourSelection =
  | { type: "unknown" }
  | { type: "standard_pizza_flour" }
  | { type: "medium_strong_pizza_flour" }
  | { type: "strong_pizza_flour" }
  | { type: "known_flour_id"; flourId: FlourId };

export type FlourCategory =
  | "standard"
  | "medium_strong"
  | "strong"
  | "very_strong"
  | "unknown";

export type PlanningWarningSeverity = "info" | "caution" | "high_risk";

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
  note: string;
};

export type PlanningQualityScore = {
  score: number | null;
  label: "not_scored_yet";
  reasons: string[];
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
  note: string;
};

export type PlanningFlourAssumptions = {
  flourSelection: FlourSelection;
  category: FlourCategory;
  note: string;
};

export type PlanningYeastAssumptions = {
  yeastType: YeastType | null;
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
