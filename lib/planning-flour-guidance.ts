import type { PlanningFlourProfile } from "@/lib/planning-flour-profiles";
import type {
  FermentationMode,
  OvenType,
  PlanningFlourGuidance,
  PlanningFlourSuitabilityLevel,
  UserLevel,
} from "@/lib/planning-types";

type PlanningFlourGuidanceInput = {
  flourProfile: PlanningFlourProfile;
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

export function buildPlanningFlourGuidance(input: PlanningFlourGuidanceInput): PlanningFlourGuidance {
  const hydration = normalizeOptionalNumber(input.hydration);
  const proteinPercent = normalizeOptionalNumber(input.proteinPercent);
  const wValue = normalizeOptionalNumber(input.wValue);
  const availableFermentationHours = normalizeHours(input.availableFermentationHours);
  const selectedFermentationMode = input.selectedFermentationMode ?? null;
  const signals = buildSignals({
    flourProfile: input.flourProfile,
    hydration,
    availableFermentationHours,
    selectedFermentationMode,
    recommendedFermentationMode: input.recommendedFermentationMode,
    roomTemperature: input.roomTemperature,
    fridgeTemperature: input.fridgeTemperature,
    ovenType: input.ovenType,
    doughStyle: input.doughStyle,
    proteinPercent,
    wValue,
  });
  const riskLevel = chooseRiskLevel(signals);
  const suitabilityLevel = chooseSuitabilityLevel(input.flourProfile, riskLevel, hydration, availableFermentationHours, input.ovenType);
  const cautions = signals.filter((signal) => signal.type === "caution" || signal.type === "high_risk").map((signal) => signal.message);
  const suggestedAdjustments = buildSuggestedAdjustments({
    riskLevel,
    category: input.flourProfile.category,
    hydration,
    availableFermentationHours,
    selectedFermentationMode,
    ovenType: input.ovenType,
    proteinPercent,
    wValue,
  });

  return {
    version: 1,
    flourSelection: { type: "known_flour_id", flourId: input.flourProfile.flourId },
    flourType: describeFlourType(input.flourProfile),
    flourCategory: input.flourProfile.category,
    profileId: input.flourProfile.flourId,
    hydration,
    availableFermentationHours,
    selectedFermentationMode,
    ovenType: input.ovenType,
    doughStyle: input.doughStyle ?? null,
    proteinPercent,
    wValue,
    suitabilityLevel,
    riskLevel,
    title: buildTitle(suitabilityLevel),
    summary: buildSummary({
      flourProfile: input.flourProfile,
      suitabilityLevel,
      riskLevel,
      hydration,
      availableFermentationHours,
      ovenType: input.ovenType,
      doughStyle: input.doughStyle,
      proteinPercent,
      wValue,
    }),
    cautions,
    suggestedAdjustments,
    technicalNote: buildTechnicalNote({
      userLevel: input.userLevel,
      flourProfile: input.flourProfile,
      hydration,
      availableFermentationHours,
      proteinPercent,
      wValue,
    }),
  };
}

type FlourSignal = {
  type: "positive" | "note" | "caution" | "high_risk";
  message: string;
};

function buildSignals(input: {
  flourProfile: PlanningFlourProfile;
  hydration: number | null;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  recommendedFermentationMode: FermentationMode;
  roomTemperature: number;
  fridgeTemperature: number;
  ovenType: OvenType;
  doughStyle?: string;
  proteinPercent: number | null;
  wValue: number | null;
}): FlourSignal[] {
  const signals: FlourSignal[] = [];
  const category = input.flourProfile.category;
  const hydration = input.hydration;
  const longFermentation = input.availableFermentationHours >= 24;
  const veryLongFermentation = input.availableFermentationHours >= 48;

  if (category === "unknown") {
    signals.push({ type: "caution", message: "Flour strength is unknown, so long or high-hydration plans are harder to judge." });
  }

  if (category === "standard" && veryLongFermentation) {
    signals.push({ type: "high_risk", message: "Standard or weaker flour may struggle with 48–72 hour fermentation." });
  } else if (category === "standard" && longFermentation) {
    signals.push({ type: "caution", message: "Standard flour may need caution with long fermentation because gluten strength matters more." });
  }

  if (hydration !== null && hydration >= 68 && (category === "standard" || category === "unknown")) {
    signals.push({ type: hydration >= 72 ? "high_risk" : "caution", message: "High hydration with all-purpose or weaker flour may be sticky and harder to handle." });
  }

  if (hydration !== null && hydration >= 72 && category === "medium_strong") {
    signals.push({ type: "caution", message: "Very high hydration may push medium-strength pizza flour beyond its comfortable range." });
  }

  if (category === "medium_strong" && input.availableFermentationHours >= 8 && input.availableFermentationHours <= 24) {
    signals.push({ type: "positive", message: "Medium-strength pizza flour is a good broad fit for classic same-day or overnight Neapolitan-style planning." });
  }

  if ((category === "strong" || category === "very_strong") && longFermentation) {
    signals.push({ type: "positive", message: "Strong flour can be useful for longer fermentation or higher hydration." });
  }

  if ((category === "strong" || category === "very_strong") && input.availableFermentationHours < 6) {
    signals.push({ type: "caution", message: "Strong flour can be more strength than needed for a very fast dough and may feel chewier." });
  }

  if (input.flourProfile.displayName.toLowerCase().includes("pizzeria") && input.ovenType === "pizza_oven") {
    signals.push({ type: "positive", message: "Tipo 00 / pizza flour is a natural fit for Neapolitan-style pizza in a high-heat pizza oven." });
  }

  if (input.flourProfile.displayName.toLowerCase().includes("pizzeria") && input.ovenType === "home_oven") {
    signals.push({ type: "note", message: "Tipo 00 / pizza flour can work in a home oven, but lower heat may change browning and texture." });
  }

  if (input.proteinPercent !== null) {
    if (input.proteinPercent < 11 && hydration !== null && hydration >= 65) {
      signals.push({ type: "caution", message: "Low protein with higher hydration may make the dough weaker and stickier." });
    } else if (input.proteinPercent >= 13.5) {
      signals.push({ type: "note", message: "High protein can add strength, but it is not automatically better and may make the result chewier." });
    }
  }

  if (input.wValue !== null) {
    if (input.wValue < 240 && longFermentation) {
      signals.push({ type: "caution", message: "Low W-value with long fermentation may need caution because flour strength can run out." });
    } else if (input.wValue >= 320) {
      signals.push({ type: "note", message: "High W-value can support long or hydrated doughs, but it can be overkill for fast pizza." });
    }
  }

  if (input.selectedFermentationMode === "room" && longFermentation && input.roomTemperature >= 25) {
    signals.push({ type: "caution", message: "Warm long room fermentation asks more from the flour and may narrow the usable dough window." });
  }

  if ((input.selectedFermentationMode === "cold" || input.recommendedFermentationMode === "cold") && longFermentation && input.fridgeTemperature > 6) {
    signals.push({ type: "caution", message: "A warm fridge can make long cold fermentation more demanding for the flour." });
  }

  return signals;
}

function chooseRiskLevel(signals: FlourSignal[]): PlanningFlourSuitabilityLevel {
  if (signals.some((signal) => signal.type === "high_risk")) return "high_risk";
  if (signals.some((signal) => signal.type === "caution")) return "caution";
  return "workable";
}

function chooseSuitabilityLevel(
  flourProfile: PlanningFlourProfile,
  riskLevel: PlanningFlourSuitabilityLevel,
  hydration: number | null,
  hours: number,
  ovenType: OvenType,
): PlanningFlourSuitabilityLevel {
  if (flourProfile.category === "unknown") return "not_enough_information";
  if (riskLevel === "high_risk") return "high_risk";
  if (riskLevel === "caution") return "caution";

  if (flourProfile.displayName.toLowerCase().includes("pizzeria") && ovenType === "pizza_oven" && hours >= 8 && hours <= 24) {
    return "good_fit";
  }

  if (flourProfile.displayName.toLowerCase().includes("pizzeria") && ovenType === "home_oven") {
    return "workable";
  }

  if ((flourProfile.category === "strong" || flourProfile.category === "very_strong") && hours >= 24 && hours <= 72) {
    return "good_fit";
  }

  if (flourProfile.category === "medium_strong" && hours >= 6 && hours <= 24 && (hydration === null || hydration <= 68)) {
    return "good_fit";
  }

  return "workable";
}

function buildSuggestedAdjustments(input: {
  riskLevel: PlanningFlourSuitabilityLevel;
  category: PlanningFlourProfile["category"];
  hydration: number | null;
  availableFermentationHours: number;
  selectedFermentationMode: FermentationMode | null;
  ovenType: OvenType;
  proteinPercent: number | null;
  wValue: number | null;
}): string[] {
  const adjustments: string[] = [];

  if ((input.category === "standard" || input.category === "unknown") && input.hydration !== null && input.hydration >= 68) {
    adjustments.push("Consider lowering hydration or using a stronger flour if the dough feels too slack.");
  }

  if ((input.category === "standard" || input.category === "unknown") && input.availableFermentationHours >= 24) {
    adjustments.push("Consider a shorter fermentation window or a stronger pizza/bread flour.");
  }

  if ((input.category === "strong" || input.category === "very_strong") && input.availableFermentationHours < 6) {
    adjustments.push("For a fast dough, consider a medium-strength flour if you want a softer bite.");
  }

  if (input.ovenType === "home_oven" && input.category === "medium_strong") {
    adjustments.push("In a home oven, watch browning and bake setup; flour alone will not create pizza-oven texture.");
  }

  if (input.proteinPercent !== null && input.proteinPercent < 11) {
    adjustments.push("If the dough feels weak, reduce hydration or avoid very long fermentation.");
  }

  if (input.wValue !== null && input.wValue < 240 && input.availableFermentationHours >= 24) {
    adjustments.push("Use a shorter plan or a stronger flour if the listed W-value is low.");
  }

  if (adjustments.length === 0) {
    adjustments.push("Keep this flour choice, but judge dough strength by feel rather than the label alone.");
  }

  return adjustments;
}

function buildTitle(level: PlanningFlourSuitabilityLevel): string {
  switch (level) {
    case "good_fit":
      return "Flour looks like a good fit";
    case "workable":
      return "Flour looks workable";
    case "caution":
      return "Flour needs caution";
    case "high_risk":
      return "Flour may be risky for this plan";
    case "not_enough_information":
      return "Flour fit needs more context";
  }
}

function buildSummary(input: {
  flourProfile: PlanningFlourProfile;
  suitabilityLevel: PlanningFlourSuitabilityLevel;
  riskLevel: PlanningFlourSuitabilityLevel;
  hydration: number | null;
  availableFermentationHours: number;
  ovenType: OvenType;
  doughStyle?: string;
  proteinPercent: number | null;
  wValue: number | null;
}): string {
  const hydration = input.hydration === null ? "the selected hydration" : `${input.hydration}% hydration`;
  const hours = `${input.availableFermentationHours} h`;
  const oven = input.ovenType === "pizza_oven" ? "pizza oven" : "home oven";
  const style = input.doughStyle ? ` for ${input.doughStyle.replaceAll("_", " ")}` : "";
  const advanced = [
    input.proteinPercent === null ? null : `protein ${input.proteinPercent}%`,
    input.wValue === null ? null : `W ${input.wValue}`,
  ].filter(Boolean).join(", ");
  const advancedNote = advanced ? ` Optional context: ${advanced}.` : "";

  if (input.suitabilityLevel === "good_fit") {
    return `${input.flourProfile.displayName} is a good broad fit for ${hydration}, about ${hours} before baking, and a ${oven}${style}.${advancedNote}`;
  }

  if (input.suitabilityLevel === "not_enough_information") {
    return `${input.flourProfile.displayName} is treated conservatively because exact strength is unknown. Use this as broad planning guidance only.${advancedNote}`;
  }

  if (input.riskLevel === "high_risk") {
    return `${input.flourProfile.displayName} may be risky for ${hydration} and about ${hours} before baking. Flour strength may matter more in this setup.${advancedNote}`;
  }

  if (input.riskLevel === "caution") {
    return `${input.flourProfile.displayName} can work, but ${hydration}, timing and temperature make this a cautionary fit.${advancedNote}`;
  }

  return `${input.flourProfile.displayName} looks workable for this broad v1 plan with a ${oven}. Flour labels are useful context, not a guarantee.${advancedNote}`;
}

function buildTechnicalNote(input: {
  userLevel: UserLevel;
  flourProfile: PlanningFlourProfile;
  hydration: number | null;
  availableFermentationHours: number;
  proteinPercent: number | null;
  wValue: number | null;
}): string | null {
  if (input.userLevel !== "pizza_nerd") return null;

  return [
    "Pizza Nerd note: flour guidance v1 combines broad category, profile range, hydration, time window and optional user-entered protein/W values.",
    `Profile: ${input.flourProfile.flourId}.`,
    `Category: ${input.flourProfile.category}.`,
    `Hydration: ${input.hydration ?? "unknown"}%.`,
    `Available hours: ${input.availableFermentationHours}.`,
    `Protein input: ${input.proteinPercent ?? "not provided"}.`,
    `W-value input: ${input.wValue ?? "not provided"}.`,
    "This is suitability screening, not exact rheology.",
  ].join(" ");
}

function describeFlourType(profile: PlanningFlourProfile): string {
  switch (profile.category) {
    case "standard":
      return "all-purpose flour / weaker pizza flour";
    case "medium_strong":
      return "Tipo 00 / pizza flour";
    case "strong":
    case "very_strong":
      return "strong flour / high-protein flour";
    case "unknown":
      return "unknown flour";
  }
}

function normalizeOptionalNumber(value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
}

function normalizeHours(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Number(value.toFixed(1));
}
