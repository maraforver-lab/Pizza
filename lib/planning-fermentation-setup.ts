import type {
  FermentationMode,
  OvenType,
  PlanningFermentationSetupCategory,
  PlanningFermentationSetupFitLevel,
  PlanningFermentationSetupRecommendation,
  UserLevel,
} from "@/lib/planning-types";

type PlanningFermentationSetupInput = {
  availableFermentationHours: number;
  recommendedFermentationMode: FermentationMode;
  selectedFermentationMode?: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  userLevel: UserLevel;
  ovenType: OvenType;
};

export function buildPlanningFermentationSetupRecommendation(
  input: PlanningFermentationSetupInput,
): PlanningFermentationSetupRecommendation {
  const availableTimeHours = normalizeHours(input.availableFermentationHours);
  const recommendedSetup = recommendSetupCategory(input, availableTimeHours);
  const recommendedFermentationMode = setupToFermentationMode(recommendedSetup, input.recommendedFermentationMode);
  const selectedFermentationMode = input.selectedFermentationMode ?? null;
  const fitLevel = getFitLevel({
    availableTimeHours,
    recommendedSetup,
    recommendedFermentationMode,
    selectedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
  });
  const riskLevel = getRiskLevel({
    availableTimeHours,
    fitLevel,
    selectedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
  });
  const cautions = buildCautions({
    availableTimeHours,
    recommendedSetup,
    selectedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
  });
  const suggestedAdjustments = buildSuggestedAdjustments({
    recommendedFermentationMode,
    selectedFermentationMode,
    riskLevel,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
  });

  return {
    version: 1,
    availableTimeHours,
    recommendedSetup,
    recommendedFermentationMode,
    selectedFermentationMode,
    fitLevel,
    riskLevel,
    title: buildTitle(recommendedSetup),
    summary: buildSummary({
      availableTimeHours,
      recommendedSetup,
      selectedFermentationMode,
      riskLevel,
    }),
    cautions,
    suggestedAdjustments,
    technicalNote: buildTechnicalNote(input.userLevel, input.ovenType, recommendedSetup),
  };
}

function normalizeHours(hours: number): number {
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  return Number(hours.toFixed(1));
}

function recommendSetupCategory(
  input: PlanningFermentationSetupInput,
  hours: number,
): PlanningFermentationSetupCategory {
  if (hours <= 0 || input.recommendedFermentationMode === "not_recommended") {
    return hours > 72 ? "too_long_for_selected_setup" : "not_enough_time";
  }

  if (hours < 3) return "not_enough_time";
  if (hours < 8) return "same_day_room";
  if (hours < 24) return input.roomTemperature >= 28 ? "hybrid" : "room_temperature";
  if (hours <= 72) return input.fridgeTemperature > 6 ? "hybrid" : "cold_fermentation";

  return "too_long_for_selected_setup";
}

function setupToFermentationMode(
  setup: PlanningFermentationSetupCategory,
  fallback: FermentationMode,
): FermentationMode {
  switch (setup) {
    case "same_day_room":
    case "room_temperature":
      return "room";
    case "cold_fermentation":
      return "cold";
    case "hybrid":
      return "hybrid";
    case "not_enough_time":
    case "too_long_for_selected_setup":
      return "not_recommended";
  }
  return fallback;
}

function getFitLevel(input: {
  availableTimeHours: number;
  recommendedSetup: PlanningFermentationSetupCategory;
  recommendedFermentationMode: FermentationMode;
  selectedFermentationMode: FermentationMode | null;
  roomTemperature: number;
  fridgeTemperature: number;
}): PlanningFermentationSetupFitLevel {
  if (input.recommendedSetup === "not_enough_time" || input.recommendedSetup === "too_long_for_selected_setup") {
    return "not_recommended";
  }

  if (!input.selectedFermentationMode) return "workable";

  if (input.selectedFermentationMode === "cold" && input.availableTimeHours < 8) return "high_risk";
  if (input.selectedFermentationMode === "room" && input.availableTimeHours >= 24 && input.roomTemperature >= 25) return "high_risk";
  if (input.selectedFermentationMode === "cold" && input.availableTimeHours >= 24 && input.fridgeTemperature > 6) return "caution";

  if (input.selectedFermentationMode === input.recommendedFermentationMode) return "good_fit";

  if (
    (input.recommendedFermentationMode === "cold" && input.selectedFermentationMode === "hybrid")
    || (input.recommendedFermentationMode === "hybrid" && input.selectedFermentationMode === "cold")
  ) {
    return "workable";
  }

  return "caution";
}

function getRiskLevel(input: {
  availableTimeHours: number;
  fitLevel: PlanningFermentationSetupFitLevel;
  selectedFermentationMode: FermentationMode | null;
  roomTemperature: number;
  fridgeTemperature: number;
}): PlanningFermentationSetupFitLevel {
  if (input.fitLevel === "not_recommended" || input.fitLevel === "high_risk") return input.fitLevel;
  if (input.selectedFermentationMode === "room" && input.availableTimeHours >= 12 && input.roomTemperature >= 28) return "high_risk";
  if (input.selectedFermentationMode !== "room" && input.availableTimeHours >= 24 && input.fridgeTemperature > 6) return "caution";
  if (input.fitLevel === "caution") return "caution";
  return input.fitLevel === "good_fit" ? "good_fit" : "workable";
}

function buildTitle(setup: PlanningFermentationSetupCategory): string {
  switch (setup) {
    case "same_day_room":
      return "Same-day room fermentation is the likely fit";
    case "room_temperature":
      return "Room-temperature fermentation is the likely fit";
    case "cold_fermentation":
      return "Cold fermentation is the likely fit";
    case "hybrid":
      return "Hybrid fermentation is the safer fit";
    case "not_enough_time":
      return "Not enough time for a reliable dough";
    case "too_long_for_selected_setup":
      return "This window is too long for the v1 recommendation";
  }
}

function buildSummary(input: {
  availableTimeHours: number;
  recommendedSetup: PlanningFermentationSetupCategory;
  selectedFermentationMode: FermentationMode | null;
  riskLevel: PlanningFermentationSetupFitLevel;
}): string {
  const hours = `${input.availableTimeHours} h`;

  if (input.recommendedSetup === "not_enough_time") {
    return `There is about ${hours} before baking. That may be too short for a predictable Neapolitan-style dough.`;
  }

  if (input.recommendedSetup === "too_long_for_selected_setup") {
    return `There is about ${hours} before baking. That is outside the conservative v1 recommendation window.`;
  }

  const selected = input.selectedFermentationMode
    ? ` Your selected setup is ${input.selectedFermentationMode.replace("_", " ")}.`
    : "";

  return `There is about ${hours} before baking. ${setupSummary(input.recommendedSetup)}${selected} Risk is ${input.riskLevel.replace("_", " ")}.`;
}

function setupSummary(setup: PlanningFermentationSetupCategory): string {
  switch (setup) {
    case "same_day_room":
      return "A same-day room plan may work, but temperature and dough condition matter.";
    case "room_temperature":
      return "A room-temperature plan is a practical fit for this time window.";
    case "cold_fermentation":
      return "A cold plan is likely a better fit for this longer time window.";
    case "hybrid":
      return "A hybrid plan may reduce room-temperature or fridge-temperature risk.";
    case "not_enough_time":
    case "too_long_for_selected_setup":
      return "Use this as cautionary planning guidance only.";
  }
}

function buildCautions(input: {
  availableTimeHours: number;
  recommendedSetup: PlanningFermentationSetupCategory;
  selectedFermentationMode: FermentationMode | null;
  roomTemperature: number;
  fridgeTemperature: number;
}): string[] {
  const cautions: string[] = [];

  if (input.availableTimeHours < 3) {
    cautions.push("Bake time is very soon, so fermentation may not develop reliably.");
  }

  if (input.selectedFermentationMode === "cold" && input.availableTimeHours < 8) {
    cautions.push("Cold fermentation is usually not a good fit when bake time is very soon.");
  }

  if (input.selectedFermentationMode === "room" && input.availableTimeHours >= 24) {
    cautions.push("A long room-temperature plan may over-ferment, especially in a warm room.");
  }

  if (input.roomTemperature >= 28) {
    cautions.push("Hot room temperature may make room fermentation risky and faster than expected.");
  } else if (input.roomTemperature >= 25) {
    cautions.push("Warm room temperature may speed fermentation and shorten the useful dough window.");
  }

  if (input.availableTimeHours >= 24 && input.fridgeTemperature > 6) {
    cautions.push("Warm fridge temperature may make long cold or hybrid fermentation less predictable.");
  }

  if (input.recommendedSetup === "too_long_for_selected_setup") {
    cautions.push("The v1 planner does not yet model very long fermentation with enough precision.");
  }

  return cautions;
}

function buildSuggestedAdjustments(input: {
  recommendedFermentationMode: FermentationMode;
  selectedFermentationMode: FermentationMode | null;
  riskLevel: PlanningFermentationSetupFitLevel;
  roomTemperature: number;
  fridgeTemperature: number;
}): string[] {
  const adjustments: string[] = [];

  if (input.recommendedFermentationMode !== "not_recommended" && input.selectedFermentationMode !== input.recommendedFermentationMode) {
    adjustments.push(`Consider switching the selected setup toward ${input.recommendedFermentationMode.replace("_", " ")}.`);
  }

  if (input.roomTemperature >= 25) {
    adjustments.push("Use a cooler room, shorten room time, or move part of the plan to the fridge.");
  }

  if (input.fridgeTemperature > 6) {
    adjustments.push("Use a colder fridge setting or avoid pushing cold fermentation too long.");
  }

  if (input.riskLevel === "not_recommended") {
    adjustments.push("Choose a later bake time or a safer fermentation window.");
  }

  if (adjustments.length === 0) {
    adjustments.push("Keep the setup, but judge dough condition before the clock.");
  }

  return adjustments;
}

function buildTechnicalNote(
  userLevel: UserLevel,
  ovenType: OvenType,
  setup: PlanningFermentationSetupCategory,
): string | null {
  if (userLevel !== "pizza_nerd") return null;

  return `Pizza Nerd note: fermentation setup v1 uses broad time-window categories for ${ovenType}; future versions can connect dough temperature, yeast activity, flour strength and actual dough condition. Current category: ${setup}.`;
}
