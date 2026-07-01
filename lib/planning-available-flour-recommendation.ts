import { resolvePlanningFlourProfile, type PlanningFlourProfile } from "@/lib/planning-flour-profiles";
import { buildPlanningFlourGuidance } from "@/lib/planning-flour-guidance";
import type {
  FermentationMode,
  FlourCategory,
  OvenType,
  PlanningAvailableFlourAlternative,
  PlanningAvailableFlourFitLevel,
  PlanningAvailableFlourOption,
  PlanningAvailableFlourRecommendation,
  PlanningFlourGuidance,
  UserLevel,
} from "@/lib/planning-types";

type PlanningAvailableFlourRecommendationInput = {
  selectedFlourProfile: PlanningFlourProfile;
  availableFlours?: PlanningAvailableFlourOption[];
  hydration?: number;
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  recommendedFermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  ovenType: OvenType;
  doughStyle?: string;
  proteinPercent?: number;
  wValue?: number;
  userLevel: UserLevel;
};

type ScoredFlour = PlanningAvailableFlourAlternative & {
  score: number;
  guidance: PlanningFlourGuidance;
};

const DEFAULT_AVAILABLE_FLOURS: PlanningAvailableFlourOption[] = [
  {
    id: "tipo_00_pizza_flour",
    label: "Tipo 00 / pizza flour",
    flourSelection: { type: "medium_strong_pizza_flour" },
  },
  {
    id: "bread_strong_flour",
    label: "Bread flour / strong flour",
    flourSelection: { type: "strong_pizza_flour" },
  },
  {
    id: "all_purpose_flour",
    label: "All-purpose flour",
    flourSelection: { type: "standard_pizza_flour" },
  },
];

export function buildPlanningAvailableFlourRecommendation(
  input: PlanningAvailableFlourRecommendationInput,
): PlanningAvailableFlourRecommendation {
  const availableFlours = normalizeAvailableFlours(input.availableFlours);
  const scored = availableFlours
    .map((option) => scoreAvailableFlour(input, option))
    .sort((a, b) => b.score - a.score);
  const recommended = scored[0] ?? null;
  const alternatives = scored.map((option, index) => ({
    ...option,
    fitLevel: index === 0 && option.fitLevel === "good_fit" ? "best_fit" as const : option.fitLevel,
  }));
  const recommendedFlour = alternatives[0] ?? null;
  const selectedGuidance = buildPlanningFlourGuidance({
    flourProfile: input.selectedFlourProfile,
    hydration: input.hydration,
    availableFermentationHours: input.availableFermentationHours,
    selectedFermentationMode: input.selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
    ovenType: input.ovenType,
    doughStyle: input.doughStyle,
    proteinPercent: input.proteinPercent,
    wValue: input.wValue,
    userLevel: input.userLevel,
  });
  const selectedFitLevel = mapGuidanceLevel(selectedGuidance);
  const selectedRiskLevel = mapGuidanceRisk(selectedGuidance);
  const cautionOptions = alternatives.filter((option) => option.riskLevel === "caution" || option.riskLevel === "not_recommended");

  return {
    version: 1,
    recommendedFlour,
    recommendedFlourId: recommendedFlour?.id ?? null,
    recommendedFlourCategory: recommendedFlour?.category ?? null,
    selectedFlourId: input.selectedFlourProfile.flourId,
    selectedFlourLabel: input.selectedFlourProfile.displayName,
    selectedFlourFitLevel: selectedFitLevel,
    selectedFlourRiskLevel: selectedRiskLevel,
    fitLevel: recommendedFlour?.fitLevel ?? "not_enough_information",
    riskLevel: selectedRiskLevel === "not_recommended" ? "caution" : selectedRiskLevel,
    summary: buildSummary({
      recommendedFlour,
      selectedGuidance,
      selectedFitLevel,
      availableFermentationHours: input.availableFermentationHours,
    }),
    whyThisFlourFits: buildWhyThisFlourFits(input, recommendedFlour),
    alternatives,
    cautionOptions,
    suggestedAdjustment: buildSuggestedAdjustment(input, recommendedFlour, selectedGuidance),
    technicalNote: buildTechnicalNote(input, recommendedFlour, alternatives),
  };
}

function normalizeAvailableFlours(options: PlanningAvailableFlourOption[] | undefined): PlanningAvailableFlourOption[] {
  if (!options || options.length === 0) return DEFAULT_AVAILABLE_FLOURS;
  return options.slice(0, 6);
}

function scoreAvailableFlour(
  input: PlanningAvailableFlourRecommendationInput,
  option: PlanningAvailableFlourOption,
): ScoredFlour {
  const profile = resolvePlanningFlourProfile(option.flourSelection);
  const optionProteinPercent = normalizeOptionalOptionNumber(option.proteinPercent);
  const optionWValue = normalizeOptionalOptionNumber(option.wValue);
  const guidance = buildPlanningFlourGuidance({
    flourProfile: profile,
    hydration: input.hydration,
    availableFermentationHours: input.availableFermentationHours,
    selectedFermentationMode: input.selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
    ovenType: input.ovenType,
    doughStyle: input.doughStyle,
    proteinPercent: optionProteinPercent,
    wValue: optionWValue,
    userLevel: input.userLevel,
  });
  const fitLevel = mapGuidanceLevel(guidance);
  const riskLevel = mapGuidanceRisk(guidance);
  const score = scoreFlourOption({
    guidance,
    fitLevel,
    riskLevel,
    category: profile.category,
    hydration: input.hydration,
    availableFermentationHours: input.availableFermentationHours,
    selectedFermentationMode: input.selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
    ovenType: input.ovenType,
    doughStyle: input.doughStyle,
    proteinPercent: optionProteinPercent ?? null,
    wValue: optionWValue ?? null,
  });

  return {
    id: option.id,
    label: option.label,
    category: profile.category,
    fitLevel,
    riskLevel,
    score,
    summary: guidance.summary,
    cautions: guidance.cautions,
    guidance,
  };
}

function scoreFlourOption(input: {
  guidance: PlanningFlourGuidance;
  fitLevel: PlanningAvailableFlourFitLevel;
  riskLevel: PlanningAvailableFlourFitLevel;
  category: FlourCategory;
  hydration?: number;
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  recommendedFermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  ovenType: OvenType;
  doughStyle?: string;
  proteinPercent: number | null;
  wValue: number | null;
}) {
  let score = baseScore(input.fitLevel);
  const hours = input.availableFermentationHours;
  const hydration = input.hydration;
  const longFermentation = hours >= 24;
  const veryLongFermentation = hours >= 48;
  const sameDay = hours >= 6 && hours <= 12;
  const neapolitan = (input.doughStyle ?? "").includes("neapolitan");
  const coldOrHybrid = input.selectedFermentationMode === "cold"
    || input.selectedFermentationMode === "hybrid"
    || input.recommendedFermentationMode === "cold"
    || input.recommendedFermentationMode === "hybrid";

  if (sameDay && input.category === "medium_strong") score += 14;
  if (sameDay && input.category === "standard" && (hydration === undefined || hydration <= 65)) score += 6;
  if (sameDay && (input.category === "strong" || input.category === "very_strong")) score -= 8;

  if (longFermentation && (input.category === "strong" || input.category === "very_strong")) score += 18;
  if (longFermentation && input.category === "medium_strong") score += veryLongFermentation ? -6 : 6;
  if (longFermentation && input.category === "standard") score -= veryLongFermentation ? 34 : 18;

  if (hydration !== undefined && hydration >= 68 && input.category === "standard") score -= 26;
  if (hydration !== undefined && hydration >= 68 && (input.category === "strong" || input.category === "very_strong")) score += 8;
  if (hydration !== undefined && hydration >= 72 && input.category === "medium_strong") score -= 8;

  if (input.ovenType === "pizza_oven" && neapolitan && input.category === "medium_strong") score += 14;
  if (input.ovenType === "pizza_oven" && neapolitan && (input.category === "strong" || input.category === "very_strong")) score += 4;
  if (input.ovenType === "home_oven" && (input.category === "medium_strong" || input.category === "strong")) score += 5;

  if (coldOrHybrid && longFermentation && input.fridgeTemperature > 6) {
    if (input.category === "standard") score -= 20;
    if (input.category === "medium_strong") score -= 8;
    if (input.category === "strong" || input.category === "very_strong") score += 4;
  }

  if (input.selectedFermentationMode === "room" && longFermentation && input.roomTemperature >= 25) {
    if (input.category === "standard") score -= 18;
    if (input.category === "medium_strong") score -= 7;
  }

  if (input.proteinPercent !== null) {
    if (input.proteinPercent < 11 && hydration !== undefined && hydration >= 65) score -= 14;
    if (input.proteinPercent >= 13.5 && longFermentation) score += 8;
  }

  if (input.wValue !== null) {
    if (input.wValue < 240 && longFermentation) score -= 18;
    if (input.wValue >= 300 && longFermentation) score += 10;
  }

  return score;
}

function baseScore(level: PlanningAvailableFlourFitLevel) {
  switch (level) {
    case "best_fit":
      return 100;
    case "good_fit":
      return 86;
    case "workable":
      return 68;
    case "caution":
      return 42;
    case "not_recommended":
      return 12;
    case "not_enough_information":
      return 20;
  }
}

function mapGuidanceLevel(guidance: PlanningFlourGuidance): PlanningAvailableFlourFitLevel {
  switch (guidance.suitabilityLevel) {
    case "good_fit":
      return "good_fit";
    case "workable":
      return "workable";
    case "caution":
      return "caution";
    case "high_risk":
      return "not_recommended";
    case "not_enough_information":
      return "not_enough_information";
  }
}

function mapGuidanceRisk(guidance: PlanningFlourGuidance): PlanningAvailableFlourFitLevel {
  switch (guidance.riskLevel) {
    case "good_fit":
    case "workable":
      return "workable";
    case "caution":
      return "caution";
    case "high_risk":
      return "not_recommended";
    case "not_enough_information":
      return "not_enough_information";
  }
}

function buildSummary(input: {
  recommendedFlour: PlanningAvailableFlourAlternative | null;
  selectedGuidance: PlanningFlourGuidance;
  selectedFitLevel: PlanningAvailableFlourFitLevel;
  availableFermentationHours: number;
}) {
  if (!input.recommendedFlour) {
    return "Add available flour choices to get a stronger flour recommendation.";
  }

  const selected = input.selectedGuidance.flourType;
  const selectedFit = input.selectedFitLevel.replaceAll("_", " ");
  return `${input.recommendedFlour.label} is the strongest broad v1 fit from the available flour choices for about ${Number(input.availableFermentationHours.toFixed(1))} h before baking. The active flour is ${selected}, currently assessed as ${selectedFit}.`;
}

function buildWhyThisFlourFits(
  input: PlanningAvailableFlourRecommendationInput,
  recommendedFlour: PlanningAvailableFlourAlternative | null,
) {
  if (!recommendedFlour) return "No flour choice can be ranked yet.";
  const hours = input.availableFermentationHours;
  const hydration = input.hydration === undefined ? "the selected hydration" : `${input.hydration}% hydration`;
  const oven = input.ovenType === "pizza_oven" ? "pizza oven" : "home oven";

  if (hours >= 24 && (recommendedFlour.category === "strong" || recommendedFlour.category === "very_strong")) {
    return `${recommendedFlour.label} is recommended because longer cold or hybrid fermentation usually benefits from more flour strength, especially with ${hydration}.`;
  }

  if (hours >= 6 && hours <= 12 && recommendedFlour.category === "medium_strong") {
    return `${recommendedFlour.label} is recommended because an 8–10 h same-day plan usually fits medium-strength pizza flour well without needing extra strength.`;
  }

  if (recommendedFlour.category === "medium_strong" && input.doughStyle?.includes("neapolitan") && input.ovenType === "pizza_oven") {
    return `${recommendedFlour.label} is recommended because Tipo 00 / pizza flour is a natural broad fit for Neapolitan-style pizza in a ${oven}.`;
  }

  if (recommendedFlour.category === "standard") {
    return `${recommendedFlour.label} can be the best available option when the plan is short, hydration is moderate and expectations stay practical.`;
  }

  return `${recommendedFlour.label} is recommended as the best broad v1 fit among the available choices.`;
}

function buildSuggestedAdjustment(
  input: PlanningAvailableFlourRecommendationInput,
  recommendedFlour: PlanningAvailableFlourAlternative | null,
  selectedGuidance: PlanningFlourGuidance,
) {
  if (!recommendedFlour) return null;

  if (selectedGuidance.riskLevel === "high_risk" && input.availableFermentationHours >= 24) {
    return "Use stronger flour for this longer fermentation, or shorten the fermentation window.";
  }

  if (selectedGuidance.riskLevel === "high_risk" && input.hydration !== undefined && input.hydration >= 68) {
    return "Lower hydration if using a weaker flour.";
  }

  if (input.fridgeTemperature > 6 && input.availableFermentationHours >= 24) {
    return "If using weaker flour, keep the fridge colder, shorten cold fermentation, or choose the stronger flour option.";
  }

  if (recommendedFlour.id !== input.selectedFlourProfile.flourId && selectedGuidance.riskLevel === "caution") {
    return selectedGuidance.suggestedAdjustments[0] ?? "Consider switching flour or adjusting hydration if the dough feels weak.";
  }

  return "Keep the active flour if it matches your handling goals; this recommendation is broad guidance, not an automatic change.";
}

function buildTechnicalNote(
  input: PlanningAvailableFlourRecommendationInput,
  recommendedFlour: PlanningAvailableFlourAlternative | null,
  alternatives: PlanningAvailableFlourAlternative[],
) {
  if (input.userLevel !== "pizza_nerd") return null;

  return [
    "Pizza Nerd note: available flour recommendation v1 ranks broad choices using current flour guidance, time window, fermentation mode, hydration, oven, temperature and optional protein/W context.",
    `Recommended: ${recommendedFlour?.label ?? "none"}.`,
    `Scores are ordinal only: ${alternatives.map((option) => `${option.label}=${option.fitLevel}/${option.riskLevel}`).join("; ")}.`,
    "This does not alter the selected flour or ingredient calculations.",
  ].join(" ");
}

function normalizeOptionalOptionNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return undefined;
  return value;
}
