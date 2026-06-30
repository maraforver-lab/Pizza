import type { FlourId } from "@/lib/flours";
import { calculateAvailableFermentationHours, type PlanningInput } from "@/lib/planning-input";
import { createPlanningFoundationResult, type PlanningResult } from "@/lib/planning-result";
import type {
  FermentationMode,
  FlourCategory,
  PlanningQualityScore,
  PlanningWarning,
  PlanningYeastRecommendation,
} from "@/lib/planning-types";

export const PLANNING_ENGINE_VERSION = 1;

type RuleRecommendation = {
  mode: FermentationMode;
  flourCategory: FlourCategory;
  hydration: number | null;
  salt: number | null;
  yeastPercent: number | null;
  yeastNote: string;
  qualityScore: PlanningQualityScore;
  warnings: PlanningWarning[];
  assumptions: string[];
};

const ALL_LEVELS = ["beginner", "enthusiast", "pizza_nerd"] as const;

const KNOWN_FLOUR_CATEGORIES: Record<FlourId, FlourCategory> = {
  "caputo-classica": "standard",
  "caputo-pizzeria": "medium_strong",
  "caputo-nuvola": "strong",
  "caputo-nuvola-super": "very_strong",
  "caputo-cuoco": "strong",
  "le5-napoletana": "strong",
  "petra-5037": "strong",
};

export function buildPlanningResult(input: PlanningInput): PlanningResult {
  const availableFermentationHours = calculateAvailableFermentationHours(input);
  const selectedFlourCategory = getSelectedFlourCategory(input.flourSelection);
  const recommendation = recommendForTimeWindow(input, availableFermentationHours, selectedFlourCategory);
  const recommendedYeast: PlanningYeastRecommendation = {
    yeastType: null,
    amountGrams: null,
    placeholderPercent: recommendation.yeastPercent,
    note: recommendation.yeastNote,
  };

  return createPlanningFoundationResult({
    planningInput: input,
    availableFermentationHours,
    recommendedFermentationMode: recommendation.mode,
    recommendedFlourCategory: recommendation.flourCategory,
    recommendedHydration: recommendation.hydration,
    recommendedSalt: recommendation.salt,
    recommendedYeast,
    warnings: recommendation.warnings,
    qualityScore: recommendation.qualityScore,
    assumptions: [
      "Planning Engine v1 uses conservative broad fermentation time windows.",
      "Recommendations are planning placeholders and are not connected to production UI.",
      "Yeast values are placeholder baker percentages, not gram calculations.",
      "Shorter fermentation windows use higher yeast placeholders; longer windows use lower yeast placeholders.",
      "Ingredient gram calculations remain owned by calculateDoughIngredients.",
      ...recommendation.assumptions,
    ],
    flourAssumptionCategory: selectedFlourCategory,
    flourAssumptionNote: "Flour selection is mapped to a broad category for conservative v1 planning only.",
    yeastAssumptionNote: "Yeast recommendation is a monotonic placeholder percentage for future rule work.",
  });
}

function recommendForTimeWindow(
  input: PlanningInput,
  hours: number,
  selectedFlourCategory: FlourCategory,
): RuleRecommendation {
  const warnings: PlanningWarning[] = [];
  const assumptions: string[] = [
    `Input flour category interpreted as ${selectedFlourCategory}.`,
    `Oven type considered as ${input.ovenType}.`,
    `User level considered as ${input.userLevel}.`,
  ];

  if (hours <= 0) {
    warnings.push({
      id: "no-positive-fermentation-window",
      severity: "high_risk",
      userMessage: "The desired bake time does not leave a positive fermentation window.",
      technicalReason: "desiredBakeDateTime is not later than currentDateTime.",
      suggestedFix: "Choose a later bake time before planning fermentation.",
      visibleForLevels: [...ALL_LEVELS],
    });

    return {
      mode: "not_recommended",
      flourCategory: "unknown",
      hydration: null,
      salt: null,
      yeastPercent: null,
      yeastNote: "No yeast placeholder is recommended without a positive fermentation window.",
      warnings,
      assumptions,
      qualityScore: {
        score: 5,
        label: "low",
        reasons: ["There is no usable fermentation window."],
      },
    };
  }

  if (hours < 3) {
    warnings.push({
      id: "insufficient-fermentation-window",
      severity: "high_risk",
      userMessage: "There is not enough time for a reliable Neapolitan-style dough.",
      technicalReason: "The available fermentation window is under 3 hours.",
      suggestedFix: "Choose a later pizza time or use a different quick-dough approach outside this planner.",
      visibleForLevels: [...ALL_LEVELS],
    });

    return {
      mode: "not_recommended",
      flourCategory: "unknown",
      hydration: null,
      salt: null,
      yeastPercent: null,
      yeastNote: "No yeast placeholder is recommended for under 3 hours in v1 rules.",
      warnings,
      assumptions,
      qualityScore: {
        score: 10,
        label: "low",
        reasons: ["Under 3 hours is too short for the conservative v1 dough plan."],
      },
    };
  }

  if (hours < 6) {
    warnings.push({
      id: "fast-dough-compromise",
      severity: "caution",
      userMessage: "This is a fast dough, so flavor and texture may be less developed.",
      technicalReason: "The available fermentation window is between 3 and 6 hours.",
      suggestedFix: "Use a later pizza time when possible for better fermentation.",
      visibleForLevels: [...ALL_LEVELS],
    });

    return {
      mode: "room",
      flourCategory: input.userLevel === "beginner" || input.ovenType === "home_oven" ? "standard" : "medium_strong",
      hydration: beginnerSafeHydration(input, 60, 62),
      salt: 2.8,
      yeastPercent: 0.25,
      yeastNote: "Higher placeholder yeast percentage for a short room-temperature dough.",
      warnings,
      assumptions,
      qualityScore: {
        score: 45,
        label: "moderate_low",
        reasons: ["Fast dough is possible, but flavor and handling are compromised."],
      },
    };
  }

  if (hours < 12) {
    return {
      mode: "room",
      flourCategory: "medium_strong",
      hydration: beginnerSafeHydration(input, 62, input.ovenType === "pizza_oven" ? 64 : 63),
      salt: 2.8,
      yeastPercent: 0.14,
      yeastNote: "Moderate placeholder yeast percentage for a same-day room-temperature dough.",
      warnings,
      assumptions,
      qualityScore: {
        score: 60,
        label: "moderate",
        reasons: ["Same-day room fermentation is workable but not the strongest v1 window."],
      },
    };
  }

  if (hours < 24) {
    return {
      mode: input.userLevel === "pizza_nerd" ? "hybrid" : "room",
      flourCategory: "medium_strong",
      hydration: input.ovenType === "pizza_oven" ? 64 : 63,
      salt: 2.8,
      yeastPercent: 0.08,
      yeastNote: "Lower placeholder yeast percentage for the classic 12–24 hour window.",
      warnings,
      assumptions: [...assumptions, "The 12–24 hour window is marked as the best classic v1 time window."],
      qualityScore: {
        score: 82,
        label: "good",
        reasons: ["This is the best classic v1 time window for a predictable dough."],
      },
    };
  }

  if (hours < 48) {
    addWarmFridgeWarning(warnings, input, hours);

    return {
      mode: input.ovenType === "pizza_oven" ? "cold" : "hybrid",
      flourCategory: "strong",
      hydration: input.ovenType === "pizza_oven" ? 65 : 64,
      salt: 2.8,
      yeastPercent: 0.04,
      yeastNote: "Lower placeholder yeast percentage for a long hybrid or cold plan.",
      warnings,
      assumptions,
      qualityScore: {
        score: input.fridgeTemperature > 6 ? 72 : 80,
        label: "good",
        reasons: ["Long fermentation can produce good results when fridge temperature is controlled."],
      },
    };
  }

  if (hours <= 72) {
    addWarmFridgeWarning(warnings, input, hours);

    if (selectedFlourCategory === "unknown" || selectedFlourCategory === "standard") {
      warnings.push({
        id: "weak-or-unknown-flour-long-fermentation",
        severity: "caution",
        userMessage: "A very long fermentation works best with stronger flour.",
        technicalReason: `The selected flour category is ${selectedFlourCategory} for a 48–72 hour window.`,
        suggestedFix: "Use a strong pizza flour when planning a very long fermentation.",
        visibleForLevels: [...ALL_LEVELS],
      });
    }

    const safeAssumptions = input.fridgeTemperature <= 6
      && selectedFlourCategory !== "unknown"
      && selectedFlourCategory !== "standard";

    return {
      mode: input.ovenType === "pizza_oven" ? "cold" : "hybrid",
      flourCategory: selectedFlourCategory === "very_strong" ? "very_strong" : "strong",
      hydration: input.ovenType === "pizza_oven" ? 65 : 64,
      salt: 2.8,
      yeastPercent: 0.02,
      yeastNote: "Very low placeholder yeast percentage for a 48–72 hour plan.",
      warnings,
      assumptions,
      qualityScore: {
        score: safeAssumptions ? 78 : 58,
        label: safeAssumptions ? "good" : "moderate",
        reasons: safeAssumptions
          ? ["Long cold or hybrid fermentation is plausible with strong flour and a cool fridge."]
          : ["Long fermentation needs stronger assumptions than v1 can safely verify."],
      },
    };
  }

  warnings.push({
    id: "advanced-long-fermentation-window",
    severity: input.userLevel === "pizza_nerd" ? "caution" : "high_risk",
    userMessage: input.userLevel === "pizza_nerd"
      ? "This is an advanced long fermentation window and needs tighter flour and temperature control."
      : "This fermentation window is too long for a beginner-safe recommendation.",
    technicalReason: "The available fermentation window is over 72 hours and v1 has no flour or temperature model.",
    suggestedFix: "Use a shorter target window until advanced flour and temperature rules are available.",
    visibleForLevels: [...ALL_LEVELS],
  });

  if (input.userLevel === "pizza_nerd") {
    warnings.push({
      id: "pizza-nerd-long-fermentation-note",
      severity: "info",
      userMessage: "Pizza Nerd note: this may become useful later with stronger flour and tighter cold control.",
      technicalReason: "Advanced long fermentation requires future flour strength and temperature modeling.",
      suggestedFix: "Treat this as a technical placeholder, not a final recommendation.",
      visibleForLevels: ["pizza_nerd"],
    });
  }

  addWarmFridgeWarning(warnings, input, hours);

  return {
    mode: "not_recommended",
    flourCategory: selectedFlourCategory === "very_strong" ? "very_strong" : "strong",
    hydration: input.userLevel === "beginner" ? 64 : 65,
    salt: 2.8,
    yeastPercent: 0.01,
    yeastNote: "Extremely low placeholder yeast percentage for an over-72-hour technical placeholder.",
    warnings,
    assumptions,
    qualityScore: {
      score: input.userLevel === "pizza_nerd" ? 40 : 25,
      label: "low",
      reasons: ["Over 72 hours is outside the safe v1 recommendation model."],
    },
  };
}

function getSelectedFlourCategory(flourSelection: PlanningInput["flourSelection"]): FlourCategory {
  switch (flourSelection.type) {
    case "standard_pizza_flour":
      return "standard";
    case "medium_strong_pizza_flour":
      return "medium_strong";
    case "strong_pizza_flour":
      return "strong";
    case "known_flour_id":
      return KNOWN_FLOUR_CATEGORIES[flourSelection.flourId];
    case "unknown":
      return "unknown";
  }
}

function beginnerSafeHydration(input: PlanningInput, beginnerHydration: number, defaultHydration: number): number {
  if (input.userLevel === "beginner") return beginnerHydration;
  if (input.ovenType === "home_oven") return Math.min(defaultHydration, 63);
  return defaultHydration;
}

function addWarmFridgeWarning(warnings: PlanningWarning[], input: PlanningInput, hours: number): void {
  if (hours < 24 || input.fridgeTemperature <= 6) return;

  warnings.push({
    id: "warm-fridge-long-fermentation",
    severity: "caution",
    userMessage: "Your fridge temperature is warm for a long cold or hybrid fermentation.",
    technicalReason: `Fridge temperature is ${input.fridgeTemperature}°C for a ${Math.round(hours)} hour planning window.`,
    suggestedFix: "Use a colder fridge setting or choose a shorter fermentation window.",
    visibleForLevels: [...ALL_LEVELS],
  });
}
