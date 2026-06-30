import type { ExperienceLevel } from "@/lib/experience-levels";
import type { FlourId } from "@/lib/flours";
import type { Fermentation, OvenType, YeastType } from "@/lib/saved-recipes";

export type PlanningUserLevel = ExperienceLevel;

export type PlanningOvenType = OvenType;

export type PlanningFlourSelection = FlourId | "unknown";

export type PlanningFermentationMode = Fermentation | "not-recommended-yet";

export type PlanningFlourCategory =
  | "pizza-flour"
  | "bread-flour"
  | "all-purpose"
  | "unknown";

export type PlanningWarningSeverity = "info" | "warning";

export type PlanningWarning = {
  code: string;
  message: string;
  severity: PlanningWarningSeverity;
};

export type PlanningYeastRecommendation = {
  yeastType: YeastType | null;
  amountGrams: number | null;
  note: string;
};

export type PlanningQualityScore = {
  value: number | null;
  label: "not-scored-yet";
  rationale: string;
};

export type PlanningTechnicalDetails = {
  engineVersion: 1;
  notes: string[];
  calculationBasis: string[];
};
