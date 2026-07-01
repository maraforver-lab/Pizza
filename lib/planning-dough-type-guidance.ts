import type { PlanningFlourProfile } from "@/lib/planning-flour-profiles";
import type {
  FermentationMode,
  OvenType,
  PlanningDoughType,
  PlanningDoughTypeFitLevel,
  PlanningDoughTypeGuidance,
  UserLevel,
} from "@/lib/planning-types";

type PlanningDoughTypeGuidanceInput = {
  doughStyle?: string;
  availableFermentationHours: number;
  selectedFermentationMode?: FermentationMode;
  recommendedFermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  ovenType: OvenType;
  flourProfile: PlanningFlourProfile;
  hydration?: number;
  userLevel: UserLevel;
};

type DoughTypeSignal = {
  type: "positive" | "note" | "caution" | "high_risk";
  message: string;
};

export function buildPlanningDoughTypeGuidance(input: PlanningDoughTypeGuidanceInput): PlanningDoughTypeGuidance {
  const doughType = normalizeDoughType(input.doughStyle);
  const availableFermentationHours = normalizeHours(input.availableFermentationHours);
  const selectedFermentationMode = input.selectedFermentationMode ?? null;
  const hydration = normalizeOptionalNumber(input.hydration);
  const signals = buildSignals({
    doughType,
    availableFermentationHours,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
    ovenType: input.ovenType,
    flourProfile: input.flourProfile,
    hydration,
  });
  const riskLevel = chooseRiskLevel(doughType, signals);
  const fitLevel = chooseFitLevel({
    doughType,
    riskLevel,
    availableFermentationHours,
    ovenType: input.ovenType,
    flourProfile: input.flourProfile,
  });

  return {
    version: 1,
    doughType,
    doughTypeLabel: doughTypeLabel(doughType),
    availableFermentationHours,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    ovenType: input.ovenType,
    flourCategory: input.flourProfile.category,
    hydration,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
    fitLevel,
    riskLevel,
    title: buildTitle(fitLevel),
    summary: buildSummary({
      doughType,
      fitLevel,
      riskLevel,
      availableFermentationHours,
      ovenType: input.ovenType,
      flourProfile: input.flourProfile,
    }),
    cautions: signals.filter((signal) => signal.type === "caution" || signal.type === "high_risk").map((signal) => signal.message),
    suggestedAdjustments: buildSuggestedAdjustments({
      doughType,
      riskLevel,
      availableFermentationHours,
      selectedFermentationMode,
      recommendedFermentationMode: input.recommendedFermentationMode,
      fridgeTemperature: input.fridgeTemperature,
      roomTemperature: input.roomTemperature,
      ovenType: input.ovenType,
    }),
    technicalNote: buildTechnicalNote({
      userLevel: input.userLevel,
      doughType,
      availableFermentationHours,
      selectedFermentationMode,
      recommendedFermentationMode: input.recommendedFermentationMode,
      flourProfile: input.flourProfile,
      hydration,
    }),
  };
}

function buildSignals(input: {
  doughType: PlanningDoughType;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  ovenType: OvenType;
  flourProfile: PlanningFlourProfile;
  hydration: number | null;
}): DoughTypeSignal[] {
  const signals: DoughTypeSignal[] = [];
  const hours = input.availableFermentationHours;
  const category = input.flourProfile.category;
  const profileName = input.flourProfile.displayName.toLowerCase();
  const selectedMode = input.selectedFermentationMode;

  if (input.doughType === "unsupported") {
    signals.push({ type: "caution", message: "This dough style is treated as context only in v1." });
    return signals;
  }

  if (input.doughType === "neapolitan_direct") {
    if (input.ovenType === "pizza_oven" && profileName.includes("pizzeria")) {
      signals.push({ type: "positive", message: "Neapolitan-style direct dough, Tipo 00 / pizza flour and a pizza oven are a natural broad fit." });
    }

    if (input.ovenType === "home_oven") {
      signals.push({ type: "note", message: "Neapolitan-style direct dough can work in a home oven, but oven heat affects browning and texture." });
    }

    if (hours < 3) {
      signals.push({ type: "high_risk", message: "There is very little time for a reliable direct dough." });
    }

    if (selectedMode === "cold" && hours < 12) {
      signals.push({ type: "caution", message: "Cold fermentation is a tight fit for a direct dough with this short window." });
    }
  }

  if (input.doughType === "same_day_neapolitan") {
    if (hours < 3) {
      signals.push({ type: "high_risk", message: "Same-day dough still needs more time than this for predictable fermentation." });
    } else if (hours < 6) {
      signals.push({ type: "caution", message: "Same-day dough is workable, but timing and room temperature matter more." });
    }

    if (hours >= 24) {
      signals.push({ type: "caution", message: "With this much time, a cold fermented Neapolitan-style dough may be a better fit than same-day dough." });
    }

    if (selectedMode === "cold") {
      signals.push({ type: "caution", message: "Same-day dough and cold fermentation point in different directions." });
    }

    if (input.roomTemperature >= 27 && selectedMode !== "cold") {
      signals.push({ type: "caution", message: "Hot room temperature can make same-day dough move quickly and narrow the usable window." });
    }
  }

  if (input.doughType === "cold_neapolitan") {
    if (hours < 6) {
      signals.push({ type: "high_risk", message: "Cold fermented dough is not a good fit when bake time is this soon." });
    } else if (hours < 18) {
      signals.push({ type: "caution", message: "Cold fermented dough usually needs a longer window than this." });
    }

    if (selectedMode === "room" && hours >= 24) {
      signals.push({ type: "caution", message: "Cold fermented dough works better when the selected setup actually includes cold or hybrid fermentation." });
    }

    if (hours >= 24 && input.fridgeTemperature > 6) {
      signals.push({ type: input.fridgeTemperature >= 8 ? "high_risk" : "caution", message: "A warm fridge can make cold fermented dough over-ferment faster than expected." });
    }

    if ((category === "unknown" || category === "standard") && hours >= 48) {
      signals.push({ type: "caution", message: "Cold fermented dough asks more from flour strength in longer windows." });
    }
  }

  if (input.hydration !== null && input.hydration >= 72 && input.doughType !== "same_day_neapolitan") {
    signals.push({ type: "note", message: "Higher hydration can fit this style, but dough feel and flour strength matter." });
  }

  if (input.recommendedFermentationMode === "not_recommended") {
    signals.push({ type: "high_risk", message: "The planning engine does not recommend this fermentation window in v1." });
  }

  return signals;
}

function chooseRiskLevel(doughType: PlanningDoughType, signals: DoughTypeSignal[]): PlanningDoughTypeFitLevel {
  if (doughType === "unsupported") return "not_enough_information";
  if (signals.some((signal) => signal.type === "high_risk")) return "high_risk";
  if (signals.some((signal) => signal.type === "caution")) return "caution";
  return "workable";
}

function chooseFitLevel(input: {
  doughType: PlanningDoughType;
  riskLevel: PlanningDoughTypeFitLevel;
  availableFermentationHours: number;
  ovenType: OvenType;
  flourProfile: PlanningFlourProfile;
}): PlanningDoughTypeFitLevel {
  if (input.doughType === "unsupported") return "not_enough_information";
  if (input.riskLevel === "high_risk") return "high_risk";
  if (input.riskLevel === "caution") return "caution";

  if (input.doughType === "same_day_neapolitan" && input.availableFermentationHours >= 3 && input.availableFermentationHours < 12) {
    return "good_fit";
  }

  if (input.doughType === "cold_neapolitan" && input.availableFermentationHours >= 24 && input.availableFermentationHours <= 72) {
    return "good_fit";
  }

  if (input.doughType === "neapolitan_direct" && input.ovenType === "pizza_oven" && input.flourProfile.displayName.toLowerCase().includes("pizzeria")) {
    return "good_fit";
  }

  return "workable";
}

function buildSuggestedAdjustments(input: {
  doughType: PlanningDoughType;
  riskLevel: PlanningDoughTypeFitLevel;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  fridgeTemperature: number;
  roomTemperature: number;
  ovenType: OvenType;
}): string[] {
  const adjustments: string[] = [];

  if (input.doughType === "same_day_neapolitan" && input.availableFermentationHours >= 24) {
    adjustments.push("Consider switching to a cold fermented Neapolitan-style dough for this longer window.");
  }

  if (input.doughType === "cold_neapolitan" && input.availableFermentationHours < 12) {
    adjustments.push("Use a same-day room plan or move the bake time later if you want cold fermentation.");
  }

  if (input.doughType === "cold_neapolitan" && input.fridgeTemperature > 6) {
    adjustments.push("Use a colder fridge, shorten the cold window, or reduce yeast in future planning.");
  }

  if (input.doughType === "same_day_neapolitan" && input.roomTemperature >= 27) {
    adjustments.push("Keep the dough cooler or shorten room time if the kitchen is hot.");
  }

  if (input.ovenType === "home_oven" && input.doughType === "neapolitan_direct") {
    adjustments.push("For a home oven, focus on preheating and browning rather than chasing exact pizza-oven texture.");
  }

  if (input.selectedFermentationMode && input.selectedFermentationMode !== input.recommendedFermentationMode && input.recommendedFermentationMode !== "not_recommended") {
    adjustments.push(`The broader v1 engine leans toward ${input.recommendedFermentationMode.replaceAll("_", " ")} for this time window.`);
  }

  if (adjustments.length === 0) {
    adjustments.push("Keep the dough type, timing and temperature assumptions together; adjust one variable at a time.");
  }

  return adjustments;
}

function buildSummary(input: {
  doughType: PlanningDoughType;
  fitLevel: PlanningDoughTypeFitLevel;
  riskLevel: PlanningDoughTypeFitLevel;
  availableFermentationHours: number;
  ovenType: OvenType;
  flourProfile: PlanningFlourProfile;
}): string {
  const hours = formatHours(input.availableFermentationHours);
  const oven = input.ovenType === "pizza_oven" ? "pizza oven" : "home oven";
  const label = doughTypeLabel(input.doughType);

  if (input.fitLevel === "not_enough_information") {
    return `${label} is kept as context in v1. DoughTools can still show broad timing and temperature cautions without treating this as exact science.`;
  }

  if (input.fitLevel === "good_fit") {
    return `${label} looks like a good broad fit for about ${hours} before baking with a ${oven}. Flour and temperature still matter.`;
  }

  if (input.riskLevel === "high_risk") {
    return `${label} may be risky with about ${hours} before baking. Adjust timing or fermentation setup before trusting the plan.`;
  }

  if (input.riskLevel === "caution") {
    return `${label} can work, but timing, temperature or selected fermentation setup makes it a cautionary fit.`;
  }

  return `${label} looks workable for about ${hours} before baking with ${input.flourProfile.displayName}. Treat this as broad planning guidance.`;
}

function buildTechnicalNote(input: {
  userLevel: UserLevel;
  doughType: PlanningDoughType;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  flourProfile: PlanningFlourProfile;
  hydration: number | null;
}): string | null {
  if (input.userLevel !== "pizza_nerd") return null;

  return [
    "Pizza Nerd note: dough type guidance v1 cross-checks style intent against time window, selected fermentation mode, broad flour category and oven type.",
    `Dough type: ${input.doughType}.`,
    `Available time: ${formatHours(input.availableFermentationHours)}.`,
    `Selected mode: ${input.selectedFermentationMode ?? "not selected"}.`,
    `Recommended mode: ${input.recommendedFermentationMode}.`,
    `Flour category: ${input.flourProfile.category}.`,
    `Hydration: ${input.hydration ?? "unknown"}%.`,
  ].join(" ");
}

function buildTitle(fitLevel: PlanningDoughTypeFitLevel): string {
  switch (fitLevel) {
    case "good_fit":
      return "Dough style looks like a good fit";
    case "caution":
      return "Dough style needs caution";
    case "high_risk":
      return "Dough style looks risky";
    case "not_enough_information":
      return "Dough style is context only";
    default:
      return "Dough style looks workable";
  }
}

export function normalizePlanningDoughType(value?: string): PlanningDoughType {
  return normalizeDoughType(value);
}

function normalizeDoughType(value?: string): PlanningDoughType {
  if (value === "same_day_neapolitan") return "same_day_neapolitan";
  if (value === "cold_neapolitan") return "cold_neapolitan";
  if (value === "neapolitan_direct" || value === undefined || value === "") return "neapolitan_direct";
  return "unsupported";
}

function doughTypeLabel(doughType: PlanningDoughType): string {
  switch (doughType) {
    case "same_day_neapolitan":
      return "Same-day Neapolitan-style dough";
    case "cold_neapolitan":
      return "Cold fermented Neapolitan-style dough";
    case "neapolitan_direct":
      return "Neapolitan-style direct dough";
    default:
      return "Unsupported dough style";
  }
}

function normalizeOptionalNumber(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeHours(hours: number): number {
  if (!Number.isFinite(hours)) return 0;
  return Math.max(0, Math.round(hours * 10) / 10);
}

function formatHours(hours: number): string {
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
}
