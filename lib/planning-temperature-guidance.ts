import type {
  FermentationMode,
  PlanningFridgeTemperatureCategory,
  PlanningMixingMethod,
  PlanningRoomTemperatureCategory,
  PlanningTemperatureGuidance,
  PlanningTemperatureRiskLevel,
  UserLevel,
} from "@/lib/planning-types";

export const DEFAULT_PLANNING_ROOM_TEMPERATURE = 22;
export const DEFAULT_PLANNING_FRIDGE_TEMPERATURE = 4;

type PlanningTemperatureGuidanceInput = {
  userLevel: UserLevel;
  fermentationMode?: FermentationMode;
  availableFermentationHours?: number;
  roomTemperature?: number;
  fridgeTemperature?: number;
  targetDoughTemperature?: number;
  mixerFrictionHeat?: number;
  mixingMethod?: PlanningMixingMethod;
};

export function buildPlanningTemperatureGuidance(
  input: PlanningTemperatureGuidanceInput,
): PlanningTemperatureGuidance {
  const roomTemperature = normalizeTemperature(input.roomTemperature, DEFAULT_PLANNING_ROOM_TEMPERATURE);
  const fridgeTemperature = normalizeTemperature(input.fridgeTemperature, DEFAULT_PLANNING_FRIDGE_TEMPERATURE);
  const targetDoughTemperature = normalizeOptionalTemperature(input.targetDoughTemperature);
  const mixerFrictionHeat = normalizeOptionalTemperature(input.mixerFrictionHeat);
  const roomCategory = classifyPlanningRoomTemperature(roomTemperature);
  const fridgeCategory = classifyPlanningFridgeTemperature(fridgeTemperature);
  const riskLevel = getTemperatureRiskLevel({
    roomCategory,
    fridgeCategory,
    fermentationMode: input.fermentationMode,
    availableFermentationHours: input.availableFermentationHours,
  });
  const mixerFrictionNote = buildMixerFrictionNote(input.mixingMethod, mixerFrictionHeat);

  return {
    userLevel: input.userLevel,
    roomTemperature,
    fridgeTemperature,
    targetDoughTemperature,
    mixerFrictionHeat,
    roomCategory,
    fridgeCategory,
    riskLevel,
    summary: buildSummary(roomCategory, fridgeCategory, riskLevel),
    roomTemperatureNote: buildRoomTemperatureNote(roomCategory),
    fridgeTemperatureNote: buildFridgeTemperatureNote(fridgeCategory),
    mixerFrictionNote,
    userFacingGuidance: buildUserFacingGuidance(roomCategory, fridgeCategory, riskLevel),
    levelNotes: buildLevelNotes(input.userLevel, roomCategory, fridgeCategory),
    technicalNotes: buildTechnicalNotes({
      userLevel: input.userLevel,
      targetDoughTemperature,
      mixerFrictionHeat,
      mixingMethod: input.mixingMethod,
      fermentationMode: input.fermentationMode,
    }),
  };
}

export function classifyPlanningRoomTemperature(
  roomTemperature: number,
): PlanningRoomTemperatureCategory {
  if (roomTemperature < 20) return "cool_room";
  if (roomTemperature <= 24) return "normal_room";
  if (roomTemperature <= 27) return "warm_room";
  return "hot_room";
}

export function classifyPlanningFridgeTemperature(
  fridgeTemperature: number,
): PlanningFridgeTemperatureCategory {
  if (fridgeTemperature <= 2) return "cold_fridge";
  if (fridgeTemperature <= 6) return "normal_fridge";
  return "warm_fridge";
}

function getTemperatureRiskLevel(input: {
  roomCategory: PlanningRoomTemperatureCategory;
  fridgeCategory: PlanningFridgeTemperatureCategory;
  fermentationMode?: FermentationMode;
  availableFermentationHours?: number;
}): PlanningTemperatureRiskLevel {
  const longWindow = (input.availableFermentationHours ?? 0) >= 24;
  const coldOrHybrid = input.fermentationMode === "cold" || input.fermentationMode === "hybrid";

  if (input.roomCategory === "hot_room" && input.fermentationMode === "room") return "high_risk";
  if (input.fridgeCategory === "warm_fridge" && coldOrHybrid && longWindow) return "high_risk";
  if (input.roomCategory === "hot_room" || input.roomCategory === "warm_room") return "caution";
  if (input.fridgeCategory === "warm_fridge" || input.fridgeCategory === "cold_fridge") return "caution";

  return "low";
}

function normalizeTemperature(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value;
}

function normalizeOptionalTemperature(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function buildSummary(
  roomCategory: PlanningRoomTemperatureCategory,
  fridgeCategory: PlanningFridgeTemperatureCategory,
  riskLevel: PlanningTemperatureRiskLevel,
): string {
  if (riskLevel === "high_risk") {
    return "Temperature assumptions make this plan less reliable in v1.";
  }

  if (riskLevel === "caution") {
    return "Temperature may noticeably change fermentation speed.";
  }

  if (roomCategory === "normal_room" && fridgeCategory === "normal_fridge") {
    return "Room and fridge temperatures look safe for conservative v1 planning.";
  }

  return "Temperature assumptions are usable, but should still be watched during fermentation.";
}

function buildRoomTemperatureNote(category: PlanningRoomTemperatureCategory): string {
  switch (category) {
    case "cool_room":
      return "Cool room temperature may slow fermentation and make dough take longer to relax.";
    case "normal_room":
      return "Normal room temperature is a good baseline for conservative fermentation planning.";
    case "warm_room":
      return "Warm room temperature may speed fermentation and shorten the useful dough window.";
    case "hot_room":
      return "Hot room temperature can make long room fermentation risky and harder to control.";
  }
}

function buildFridgeTemperatureNote(category: PlanningFridgeTemperatureCategory): string {
  switch (category) {
    case "cold_fridge":
      return "A very cold fridge may slow cold fermentation more than expected.";
    case "normal_fridge":
      return "Normal fridge temperature supports more predictable cold fermentation.";
    case "warm_fridge":
      return "A warm fridge may let dough over-ferment faster during long cold or hybrid plans.";
  }
}

function buildMixerFrictionNote(
  mixingMethod: PlanningMixingMethod | undefined,
  mixerFrictionHeat: number | null,
): string | null {
  if (mixingMethod !== "stand_mixer" && mixingMethod !== "spiral_mixer" && mixerFrictionHeat === null) {
    return null;
  }

  const methodNote = mixingMethod === "spiral_mixer"
    ? "Spiral mixers are repeatable, but still add friction heat."
    : "Stand mixers can add friction heat quickly, especially in small batches.";

  if (mixerFrictionHeat === null) {
    return `${methodNote} Future versions can use measured friction heat to refine target dough temperature.`;
  }

  return `${methodNote} Current friction heat assumption: about ${mixerFrictionHeat}°C.`;
}

function buildUserFacingGuidance(
  roomCategory: PlanningRoomTemperatureCategory,
  fridgeCategory: PlanningFridgeTemperatureCategory,
  riskLevel: PlanningTemperatureRiskLevel,
): string[] {
  const guidance = [
    buildRoomTemperatureNote(roomCategory),
    buildFridgeTemperatureNote(fridgeCategory),
  ];

  if (riskLevel === "high_risk") {
    guidance.push("Use shorter room time, a cooler place, or a cooler fridge before trusting a long fermentation.");
  } else if (riskLevel === "caution") {
    guidance.push("Check dough condition earlier than the clock if temperature is warm or unusually cold.");
  } else {
    guidance.push("Use the clock as a guide, but still judge the dough by condition.");
  }

  return guidance;
}

function buildLevelNotes(
  userLevel: UserLevel,
  roomCategory: PlanningRoomTemperatureCategory,
  fridgeCategory: PlanningFridgeTemperatureCategory,
): string[] {
  if (userLevel === "beginner") {
    return [
      "Warmer dough moves faster. Cooler dough moves slower.",
      roomCategory === "hot_room" || fridgeCategory === "warm_fridge"
        ? "If it is warm, check the dough earlier than planned."
        : "Your temperature assumptions look simple enough for a conservative plan.",
    ];
  }

  if (userLevel === "enthusiast") {
    return [
      "Temperature changes fermentation speed, dough strength and timing reliability.",
      "Use the schedule as a guide, then adjust based on dough volume, feel and extensibility.",
    ];
  }

  return [
    "Temperature guidance v1 classifies broad risk only; it is not a dough-temperature solver yet.",
    "Future planning can connect target dough temperature, flour strength, yeast activity and mixer friction.",
  ];
}

function buildTechnicalNotes(input: {
  userLevel: UserLevel;
  targetDoughTemperature: number | null;
  mixerFrictionHeat: number | null;
  mixingMethod?: PlanningMixingMethod;
  fermentationMode?: FermentationMode;
}): string[] {
  if (input.userLevel !== "pizza_nerd") return [];

  return [
    input.targetDoughTemperature === null
      ? "Target dough temperature is not set; v1 treats it as a future control variable."
      : `Target dough temperature assumption: ${input.targetDoughTemperature}°C.`,
    input.mixerFrictionHeat === null
      ? "Mixer friction heat is not measured; stand and spiral mixers may still raise dough temperature."
      : `Mixer friction heat assumption: about ${input.mixerFrictionHeat}°C.`,
    `Fermentation mode considered for temperature risk: ${input.fermentationMode ?? "not specified"}.`,
    input.mixingMethod === undefined
      ? "Mixing method is not specified for temperature guidance."
      : `Mixing method considered for friction notes: ${input.mixingMethod}.`,
  ];
}
