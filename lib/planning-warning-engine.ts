import type { PlanningFlourProfile } from "@/lib/planning-flour-profiles";
import type { PlanningYeastRecommendation } from "@/lib/planning-types";
import type {
  FermentationMode,
  PlanningWarning,
  PlanningWarningSeverity,
  UserLevel,
} from "@/lib/planning-types";

const ALL_LEVELS: UserLevel[] = ["beginner", "enthusiast", "pizza_nerd"];
const PRACTICAL_LEVELS: UserLevel[] = ["enthusiast", "pizza_nerd"];
const TECHNICAL_LEVELS: UserLevel[] = ["pizza_nerd"];

export type PlanningWarningEngineInput = {
  availableFermentationHours: number;
  fermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  flourProfile: PlanningFlourProfile;
  userLevel: UserLevel;
  yeastRecommendation?: PlanningYeastRecommendation;
};

export function buildPlanningWarnings(input: PlanningWarningEngineInput): PlanningWarning[] {
  return [
    buildNoPositiveWindowWarning(input),
    buildInsufficientWindowWarning(input),
    buildFastDoughCompromiseWarning(input),
    buildUnknownFlourLongFermentationWarning(input),
    buildStandardFlourLongFermentationWarning(input),
    buildVeryStrongFlourFastDoughWarning(input),
    buildWarmRoomLongRoomFermentationWarning(input),
    buildWarmFridgeLongFermentationWarning(input),
    buildAdvancedLongFermentationWarning(input),
    buildPizzaNerdLongFermentationNote(input),
    buildNotRecommendedPlanWarning(input),
    buildLowConfidenceYeastWarning(input),
  ].filter((warning): warning is PlanningWarning => warning !== null);
}

function warning(input: {
  id: string;
  severity: PlanningWarningSeverity;
  userMessage: string;
  technicalReason: string;
  suggestedFix: string;
  visibleForLevels: UserLevel[];
}): PlanningWarning {
  return input;
}

function buildNoPositiveWindowWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (input.availableFermentationHours > 0) return null;

  return warning({
    id: "no-positive-fermentation-window",
    severity: "high_risk",
    userMessage: "The desired bake time does not leave a positive fermentation window.",
    technicalReason: "desiredBakeDateTime is not later than currentDateTime.",
    suggestedFix: "Choose a later bake time before planning fermentation.",
    visibleForLevels: ALL_LEVELS,
  });
}

function buildInsufficientWindowWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (input.availableFermentationHours <= 0 || input.availableFermentationHours >= 3) return null;

  return warning({
    id: "insufficient-fermentation-window",
    severity: "high_risk",
    userMessage: "There is not enough time for a reliable Neapolitan-style dough.",
    technicalReason: "The available fermentation window is under 3 hours.",
    suggestedFix: "Choose a later pizza time or use a different quick-dough approach outside this planner.",
    visibleForLevels: ALL_LEVELS,
  });
}

function buildFastDoughCompromiseWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (input.availableFermentationHours < 3 || input.availableFermentationHours >= 6) return null;

  return warning({
    id: "fast-dough-compromise",
    severity: "caution",
    userMessage: "This is a fast dough, so flavor and texture may be less developed.",
    technicalReason: "The available fermentation window is between 3 and 6 hours.",
    suggestedFix: "Use a later pizza time when possible for better fermentation.",
    visibleForLevels: ALL_LEVELS,
  });
}

function buildUnknownFlourLongFermentationWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (!isLongFermentation(input) || input.flourProfile.category !== "unknown") return null;

  return warning({
    id: "weak-or-unknown-flour-long-fermentation",
    severity: "caution",
    userMessage: "A very long fermentation works best with known strong flour.",
    technicalReason: `${input.flourProfile.displayName} has unknown strength for a 48–72 hour window.`,
    suggestedFix: "Use a strong pizza flour when planning a very long fermentation.",
    visibleForLevels: ALL_LEVELS,
  });
}

function buildStandardFlourLongFermentationWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (!isLongFermentation(input) || input.flourProfile.category !== "standard") return null;

  return warning({
    id: "standard-flour-too-weak-for-long-fermentation",
    severity: "high_risk",
    userMessage: "Standard flour is risky for a 48–72 hour fermentation.",
    technicalReason: `${input.flourProfile.displayName} is categorized as standard for a ${input.availableFermentationHours} hour window.`,
    suggestedFix: "Use strong or very strong pizza flour for this fermentation window.",
    visibleForLevels: ALL_LEVELS,
  });
}

function buildVeryStrongFlourFastDoughWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (
    input.availableFermentationHours < 3
    || input.availableFermentationHours >= 6
    || input.flourProfile.category !== "very_strong"
  ) {
    return null;
  }

  return warning({
    id: "very-strong-flour-fast-dough",
    severity: "caution",
    userMessage: "This flour may be stronger than needed for a fast dough.",
    technicalReason: `${input.flourProfile.displayName} is categorized as very_strong for a ${input.availableFermentationHours} hour window.`,
    suggestedFix: "Use a medium-strong or standard pizza flour for short same-day doughs.",
    visibleForLevels: PRACTICAL_LEVELS,
  });
}

function buildWarmRoomLongRoomFermentationWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (
    input.fermentationMode !== "room"
    || input.availableFermentationHours < 12
    || input.roomTemperature <= 24
  ) {
    return null;
  }

  return warning({
    id: "warm-room-long-room-fermentation",
    severity: "caution",
    userMessage: "Your room is warm for a long room-temperature fermentation.",
    technicalReason: `Room temperature is ${input.roomTemperature}°C for a ${Math.round(input.availableFermentationHours)} hour room plan.`,
    suggestedFix: "Use a cooler room, shorten the room time, or choose a hybrid/cold plan.",
    visibleForLevels: PRACTICAL_LEVELS,
  });
}

function buildWarmFridgeLongFermentationWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (input.availableFermentationHours < 24 || input.fridgeTemperature <= 6) return null;
  if (input.fermentationMode !== "cold" && input.fermentationMode !== "hybrid" && input.availableFermentationHours <= 72) {
    return null;
  }

  return warning({
    id: "warm-fridge-long-fermentation",
    severity: "caution",
    userMessage: "Your fridge temperature is warm for a long cold or hybrid fermentation.",
    technicalReason: `Fridge temperature is ${input.fridgeTemperature}°C for a ${Math.round(input.availableFermentationHours)} hour planning window.`,
    suggestedFix: "Use a colder fridge setting or choose a shorter fermentation window.",
    visibleForLevels: ALL_LEVELS,
  });
}

function buildAdvancedLongFermentationWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (input.availableFermentationHours <= 72) return null;

  return warning({
    id: "advanced-long-fermentation-window",
    severity: input.userLevel === "pizza_nerd" ? "caution" : "high_risk",
    userMessage: input.userLevel === "pizza_nerd"
      ? "This is an advanced long fermentation window and needs tighter flour and temperature control."
      : "This fermentation window is too long for a beginner-safe recommendation.",
    technicalReason: "The available fermentation window is over 72 hours and v1 has no full flour or temperature model.",
    suggestedFix: "Use a shorter target window until advanced flour and temperature rules are available.",
    visibleForLevels: ALL_LEVELS,
  });
}

function buildPizzaNerdLongFermentationNote(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (input.availableFermentationHours <= 72 || input.userLevel !== "pizza_nerd") return null;

  return warning({
    id: "pizza-nerd-long-fermentation-note",
    severity: "info",
    userMessage: "Pizza Nerd note: this may become useful later with stronger flour and tighter cold control.",
    technicalReason: "Advanced long fermentation requires future flour strength and temperature modeling.",
    suggestedFix: "Treat this as a technical placeholder, not a final recommendation.",
    visibleForLevels: TECHNICAL_LEVELS,
  });
}

function buildNotRecommendedPlanWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (
    input.fermentationMode !== "not_recommended"
    || input.availableFermentationHours <= 0
    || input.availableFermentationHours < 3
    || input.availableFermentationHours > 72
  ) {
    return null;
  }

  return warning({
    id: "not-recommended-planning-result",
    severity: "high_risk",
    userMessage: "This planning result is not recommended.",
    technicalReason: "Planning Engine v1 returned not_recommended outside the primary time-window warnings.",
    suggestedFix: "Choose a safer target time and re-run planning.",
    visibleForLevels: ALL_LEVELS,
  });
}

function buildLowConfidenceYeastWarning(input: PlanningWarningEngineInput): PlanningWarning | null {
  if (!input.yeastRecommendation || input.yeastRecommendation.yeastConfidence !== "low") return null;
  if (input.fermentationMode === "not_recommended" && input.availableFermentationHours < 3) return null;

  return warning({
    id: "low-confidence-yeast-recommendation",
    severity: "caution",
    userMessage: "The yeast recommendation has low confidence.",
    technicalReason: "Planning Engine v1 has weak assumptions for this flour, temperature or time window.",
    suggestedFix: "Use a safer time window, known flour, or cooler temperature assumptions.",
    visibleForLevels: PRACTICAL_LEVELS,
  });
}

function isLongFermentation(input: PlanningWarningEngineInput): boolean {
  return input.availableFermentationHours >= 48 && input.availableFermentationHours <= 72;
}
