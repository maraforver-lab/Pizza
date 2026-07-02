import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { buildPlanningResult, PLANNING_ENGINE_VERSION } from "@/lib/planning-engine";
import {
  getPlanningFlourProfile,
  planningFlourProfiles,
  resolvePlanningFlourProfile,
} from "@/lib/planning-flour-profiles";
import { calculateAvailableFermentationHours, type PlanningInput } from "@/lib/planning-input";
import { FERMENTATION_MODES, OVEN_TYPES, USER_LEVELS, type FlourSelection } from "@/lib/planning-types";
import {
  ACTIVE_DRY_YEAST_FROM_FRESH_FACTOR,
  INSTANT_DRY_YEAST_FROM_FRESH_FACTOR,
} from "@/lib/planning-yeast-model";
import { buildPlanningFermentationTimeline } from "@/lib/planning-fermentation-timeline";
import { PLANNING_MIXING_METHODS, buildPlanningMixingGuidance } from "@/lib/planning-mixing-guidance";
import {
  buildPlanningTemperatureGuidance,
  classifyPlanningFridgeTemperature,
  classifyPlanningRoomTemperature,
} from "@/lib/planning-temperature-guidance";
import { baseSettings } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const basePlanningInput: PlanningInput = {
  currentDateTime: new Date("2026-06-30T09:00:00.000Z"),
  desiredBakeDateTime: new Date("2026-07-01T21:00:00.000Z"),
  userLevel: "enthusiast",
  ovenType: "pizza_oven",
  roomTemperature: 22,
  fridgeTemperature: 4,
  flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
  doughBallCount: 6,
  doughBallWeight: 260,
};

function planningInputWithHours(
  hours: number,
  overrides: Partial<PlanningInput> = {},
): PlanningInput {
  const currentDateTime = overrides.currentDateTime ?? basePlanningInput.currentDateTime;
  return {
    ...basePlanningInput,
    ...overrides,
    currentDateTime,
    desiredBakeDateTime: overrides.desiredBakeDateTime
      ?? new Date(currentDateTime.getTime() + hours * 3_600_000),
  };
}

describe("Planning Engine fermentation rules v1", () => {
  it("defines the supported v1 planning domain values", () => {
    expect(USER_LEVELS).toEqual(["beginner", "enthusiast", "pizza_nerd"]);
    expect(OVEN_TYPES).toEqual(["home_oven", "pizza_oven"]);
    expect(FERMENTATION_MODES).toEqual(["room", "cold", "hybrid", "not_recommended"]);
    expect(PLANNING_MIXING_METHODS).toEqual(["hand_mixing", "stand_mixer", "spiral_mixer"]);
  });

  it("defines the initial background flour profiles without exposing them to UI", () => {
    expect(planningFlourProfiles.map((profile) => profile.flourId)).toEqual([
      "unknown_basic_flour",
      "standard_pizza_flour",
      "medium_strong_pizza_flour",
      "strong_pizza_flour",
      "caputo_pizzeria",
      "caputo_nuvola",
      "caputo_saccorosso",
      "pirkka_w260",
      "pirkka_w350",
    ]);
    expect(getPlanningFlourProfile("unknown_basic_flour")).toMatchObject({
      category: "unknown",
      sourceConfidence: "inferred",
      beginnerSafe: true,
    });
  });

  it("accepts every supported user level and oven type through PlanningInput", () => {
    for (const userLevel of USER_LEVELS) {
      for (const ovenType of OVEN_TYPES) {
        const result = buildPlanningResult({
          ...basePlanningInput,
          userLevel,
          ovenType,
        });

        expect(result.availableFermentationHours).toBe(36);
        expect(result.recommendedFermentationMode).toMatch(/cold|hybrid/);
        expect(result.technicalDetails.engineVersion).toBe(PLANNING_ENGINE_VERSION);
      }
    }
  });

  it("represents every supported flour selection shape with a broad v1 flour assumption category", () => {
    const selections: Array<[FlourSelection, string]> = [
      [{ type: "unknown" }, "unknown"],
      [{ type: "standard_pizza_flour" }, "standard"],
      [{ type: "medium_strong_pizza_flour" }, "medium_strong"],
      [{ type: "strong_pizza_flour" }, "strong"],
      [{ type: "known_flour_id", flourId: "caputo-pizzeria" }, "medium_strong"],
      [{ type: "known_flour_id", flourId: "caputo-nuvola-super" }, "very_strong"],
    ];

    for (const [flourSelection, expectedCategory] of selections) {
      const result = buildPlanningResult({ ...basePlanningInput, flourSelection });

      expect(result.technicalDetails.flourAssumptions.flourSelection).toEqual(flourSelection);
      expect(result.technicalDetails.flourAssumptions.category).toBe(expectedCategory);
      expect(result.technicalDetails.flourAssumptions.profileId).toBeTruthy();
      expect(result.technicalDetails.flourAssumptions.displayName).toBeTruthy();
      expect(result.technicalDetails.flourAssumptions.sourceConfidence).toMatch(/official|trusted_secondary|inferred/);
    }
  });

  it("resolves known planning flour profiles and legacy app flour ids safely", () => {
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "pirkka_w260" })).toMatchObject({
      flourId: "pirkka_w260",
      category: "medium_strong",
    });
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "pirkka_w350" })).toMatchObject({
      flourId: "pirkka_w350",
      category: "very_strong",
    });
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "caputo_pizzeria" })).toMatchObject({
      flourId: "caputo_pizzeria",
      category: "medium_strong",
      wMin: 260,
      wMax: 280,
    });
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "caputo_saccorosso" })).toMatchObject({
      flourId: "caputo_saccorosso",
      category: "strong",
      wMin: 300,
      wMax: 320,
    });
    expect(resolvePlanningFlourProfile({ type: "known_flour_id", flourId: "caputo-pizzeria" })).toMatchObject({
      flourId: "caputo_pizzeria",
      category: "medium_strong",
    });
  });

  it("falls back safely when a known flour id is not in the planning profile registry", () => {
    const profile = resolvePlanningFlourProfile({
      type: "known_flour_id",
      flourId: "mystery-local-flour",
    });
    const result = buildPlanningResult(planningInputWithHours(18, {
      flourSelection: { type: "known_flour_id", flourId: "mystery-local-flour" },
    }));

    expect(profile).toMatchObject({
      flourId: "unknown_basic_flour",
      category: "unknown",
      sourceConfidence: "inferred",
    });
    expect(result.technicalDetails.flourAssumptions).toMatchObject({
      profileId: "unknown_basic_flour",
      category: "unknown",
      displayName: "Unknown basic flour",
    });
  });

  it("calculates available fermentation hours from current time to desired bake time", () => {
    expect(calculateAvailableFermentationHours(basePlanningInput)).toBe(36);
    expect(calculateAvailableFermentationHours({
      currentDateTime: new Date("2026-06-30T09:15:00.000Z"),
      desiredBakeDateTime: new Date("2026-06-30T15:45:00.000Z"),
    })).toBe(6.5);
  });

  it("returns a safe fermentation setup recommendation when bake date/time is missing or invalid", () => {
    const result = buildPlanningResult({
      ...basePlanningInput,
      desiredBakeDateTime: new Date("not-a-real-date"),
    });

    expect(result.availableFermentationHours).toBe(0);
    expect(result.fermentationSetupRecommendation).toMatchObject({
      availableTimeHours: 0,
      recommendedSetup: "not_enough_time",
      recommendedFermentationMode: "not_recommended",
      fitLevel: "not_recommended",
      riskLevel: "not_recommended",
    });
    expect(result.fermentationSetupRecommendation?.summary).toContain("too short");
  });

  it("returns safe default yeast guidance when calculator yeast context is missing", () => {
    const result = buildPlanningResult(basePlanningInput);

    expect(result.yeastGuidance).toMatchObject({
      version: 1,
      yeastType: null,
      calculatedYeastGrams: null,
      flourGrams: null,
      riskLevel: "not_enough_information",
    });
    expect(result.yeastGuidance?.summary).toContain("needs a commercial yeast amount");
  });

  it("treats a same-day commercial yeast amount as broadly reasonable when it matches the time window", () => {
    const ingredients = calculateDoughIngredients({
      ...baseSettings,
      fermentation: "6h-room",
      temperature: 22,
      yeastType: "idy",
    });
    const result = buildPlanningResult(planningInputWithHours(5, {
      selectedFermentationMode: "room",
      yeastType: "idy",
      calculatedFlourGrams: ingredients.flour,
      calculatedYeastGrams: ingredients.leavener,
    }));

    expect(result.yeastGuidance).toMatchObject({
      yeastType: "idy",
      riskLevel: "reasonable",
      selectedFermentationMode: "room",
      recommendedFermentationMode: "room",
    });
    expect(result.yeastGuidance?.summary).toContain("broadly close");
  });

  it("warns when current yeast looks high for a long cold fermentation plan", () => {
    const ingredients = calculateDoughIngredients({
      ...baseSettings,
      fermentation: "24h-cold",
      temperature: 4,
      yeastType: "idy",
    });
    const result = buildPlanningResult(planningInputWithHours(48, {
      selectedFermentationMode: "cold",
      yeastType: "idy",
      calculatedFlourGrams: ingredients.flour,
      calculatedYeastGrams: ingredients.leavener,
    }));

    expect(result.yeastGuidance).toMatchObject({
      riskLevel: "high_risk",
      selectedFermentationMode: "cold",
    });
    expect(result.yeastGuidance?.cautions.join(" ")).toContain("High yeast");
    expect(result.yeastGuidance?.suggestedAdjustments.join(" ")).toContain("reducing yeast");
  });

  it("reflects warm room and warm fridge risk in yeast guidance", () => {
    const ingredients = calculateDoughIngredients({
      ...baseSettings,
      fermentation: "24h-room",
      temperature: 22,
      yeastType: "idy",
    });
    const warmRoom = buildPlanningResult(planningInputWithHours(36, {
      selectedFermentationMode: "room",
      roomTemperature: 28,
      yeastType: "idy",
      calculatedFlourGrams: ingredients.flour,
      calculatedYeastGrams: ingredients.leavener,
    }));
    const warmFridge = buildPlanningResult(planningInputWithHours(36, {
      selectedFermentationMode: "cold",
      fridgeTemperature: 8,
      yeastType: "idy",
      calculatedFlourGrams: ingredients.flour,
      calculatedYeastGrams: ingredients.leavener,
    }));

    expect(warmRoom.yeastGuidance?.riskLevel).toBe("high_risk");
    expect(warmRoom.yeastGuidance?.cautions.join(" ")).toContain("Warm room");
    expect(warmFridge.yeastGuidance?.cautions.join(" ")).toContain("Warm fridge");
  });

  it("keeps sourdough yeast guidance conservative instead of comparing starter grams as yeast", () => {
    const ingredients = calculateDoughIngredients({
      ...baseSettings,
      yeastType: "lsd",
    });
    const result = buildPlanningResult(planningInputWithHours(24, {
      selectedFermentationMode: "cold",
      yeastType: "lsd",
      calculatedFlourGrams: ingredients.flour,
      calculatedYeastGrams: ingredients.leavener,
    }));

    expect(result.yeastGuidance).toMatchObject({
      yeastType: "lsd",
      calculatedFreshYeastEquivalentPercent: null,
      riskLevel: "not_enough_information",
    });
    expect(result.yeastGuidance?.summary).toContain("Sourdough starter activity varies");
  });

  it("returns default flour guidance from the selected flour profile", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      hydration: 64,
      selectedFermentationMode: "room",
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
      ovenType: "pizza_oven",
      doughStyle: "neapolitan_direct",
    }));

    expect(result.flourGuidance).toMatchObject({
      version: 1,
      flourCategory: "medium_strong",
      flourType: "Tipo 00 / pizza flour",
      suitabilityLevel: "good_fit",
      riskLevel: "workable",
      hydration: 64,
    });
    expect(result.flourGuidance?.summary).toContain("good broad fit");
  });

  it("covers each broad flour category with conservative guidance", () => {
    const standard = buildPlanningResult(planningInputWithHours(8, {
      flourSelection: { type: "standard_pizza_flour" },
      hydration: 62,
    }));
    const medium = buildPlanningResult(planningInputWithHours(12, {
      flourSelection: { type: "medium_strong_pizza_flour" },
      hydration: 64,
    }));
    const strong = buildPlanningResult(planningInputWithHours(36, {
      flourSelection: { type: "strong_pizza_flour" },
      hydration: 66,
      selectedFermentationMode: "cold",
    }));
    const unknown = buildPlanningResult(planningInputWithHours(8, {
      flourSelection: { type: "unknown" },
      hydration: 62,
    }));

    expect(standard.flourGuidance?.flourCategory).toBe("standard");
    expect(medium.flourGuidance?.suitabilityLevel).toBe("good_fit");
    expect(strong.flourGuidance?.suitabilityLevel).toBe("good_fit");
    expect(unknown.flourGuidance?.suitabilityLevel).toBe("not_enough_information");
  });

  it("flags high hydration with all-purpose or weaker flour", () => {
    const result = buildPlanningResult(planningInputWithHours(8, {
      flourSelection: { type: "standard_pizza_flour" },
      hydration: 72,
      selectedFermentationMode: "room",
    }));

    expect(result.flourGuidance).toMatchObject({
      flourCategory: "standard",
      suitabilityLevel: "high_risk",
      riskLevel: "high_risk",
    });
    expect(result.flourGuidance?.cautions.join(" ")).toContain("High hydration");
    expect(result.flourGuidance?.suggestedAdjustments.join(" ")).toContain("lowering hydration");
  });

  it("flags long fermentation with weaker flour", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "standard_pizza_flour" },
      hydration: 64,
      selectedFermentationMode: "cold",
    }));

    expect(result.flourGuidance).toMatchObject({
      riskLevel: "high_risk",
      suitabilityLevel: "high_risk",
    });
    expect(result.flourGuidance?.cautions.join(" ")).toContain("48–72 hour fermentation");
    expect(result.flourGuidance?.suggestedAdjustments.join(" ")).toContain("stronger pizza/bread flour");
  });

  it("treats Tipo 00 pizza flour as good fit for pizza oven and workable for home oven", () => {
    const pizzaOven = buildPlanningResult(planningInputWithHours(18, {
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
      hydration: 64,
      ovenType: "pizza_oven",
      selectedFermentationMode: "room",
    }));
    const homeOven = buildPlanningResult(planningInputWithHours(18, {
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
      hydration: 64,
      ovenType: "home_oven",
      selectedFermentationMode: "room",
    }));

    expect(pizzaOven.flourGuidance?.suitabilityLevel).toBe("good_fit");
    expect(pizzaOven.flourGuidance?.cautions.join(" ")).not.toContain("home oven");
    expect(homeOven.flourGuidance?.suitabilityLevel).toBe("workable");
    expect(homeOven.flourGuidance?.summary).toContain("home oven");
    expect(homeOven.flourGuidance?.suggestedAdjustments.join(" ")).toContain("home oven");
  });

  it("treats strong flour as useful for long fermentation but cautions for fast dough", () => {
    const longPlan = buildPlanningResult(planningInputWithHours(48, {
      flourSelection: { type: "strong_pizza_flour" },
      hydration: 68,
      selectedFermentationMode: "cold",
    }));
    const fastPlan = buildPlanningResult(planningInputWithHours(5, {
      flourSelection: { type: "strong_pizza_flour" },
      hydration: 62,
      selectedFermentationMode: "room",
    }));

    expect(longPlan.flourGuidance?.suitabilityLevel).toBe("good_fit");
    expect(longPlan.flourGuidance?.summary).toContain("good broad fit");
    expect(fastPlan.flourGuidance?.riskLevel).toBe("caution");
    expect(fastPlan.flourGuidance?.cautions.join(" ")).toContain("chewier");
  });

  it("uses optional protein and W-value as cautious context without changing formulas", () => {
    const lowProtein = buildPlanningResult(planningInputWithHours(18, {
      flourSelection: { type: "standard_pizza_flour" },
      hydration: 68,
      proteinPercent: 10.5,
      selectedFermentationMode: "room",
    }));
    const lowW = buildPlanningResult(planningInputWithHours(36, {
      flourSelection: { type: "medium_strong_pizza_flour" },
      hydration: 64,
      wValue: 220,
      selectedFermentationMode: "cold",
    }));
    const highW = buildPlanningResult(planningInputWithHours(36, {
      flourSelection: { type: "strong_pizza_flour" },
      hydration: 68,
      wValue: 340,
      proteinPercent: 13.8,
      selectedFermentationMode: "cold",
    }));

    expect(lowProtein.flourGuidance?.cautions.join(" ")).toContain("Low protein");
    expect(lowProtein.flourGuidance?.summary).toContain("protein 10.5%");
    expect(lowW.flourGuidance?.cautions.join(" ")).toContain("Low W-value");
    expect(lowW.flourGuidance?.summary).toContain("W 220");
    expect(highW.flourGuidance?.summary).toContain("W 340");
    expect(highW.flourGuidance?.summary).toContain("protein 13.8%");
    expect(calculateDoughIngredients(baseSettings).flour).toBeCloseTo(962.71, 2);
  });

  it("returns a default available flour recommendation without changing the selected flour", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
      hydration: 64,
      selectedFermentationMode: "room",
      ovenType: "pizza_oven",
      doughStyle: "neapolitan_direct",
    }));

    expect(result.availableFlourRecommendation).toMatchObject({
      version: 1,
      selectedFlourId: "caputo_pizzeria",
      selectedFlourLabel: "Caputo Pizzeria",
    });
    expect(result.availableFlourRecommendation?.alternatives.map((option) => option.label)).toEqual([
      "Tipo 00 / pizza flour",
      "Bread flour / strong flour",
      "All-purpose flour",
    ]);
    expect(result.availableFlourRecommendation?.summary).toContain("available flour choices");
    expect(calculateDoughIngredients(baseSettings).flour).toBeCloseTo(962.71, 2);
  });

  it("recommends medium pizza flour for an 8-10h same-day pizza-oven plan", () => {
    const result = buildPlanningResult(planningInputWithHours(10, {
      hydration: 64,
      selectedFermentationMode: "room",
      ovenType: "pizza_oven",
      doughStyle: "same_day_neapolitan",
    }));

    expect(result.availableFlourRecommendation?.recommendedFlour).toMatchObject({
      id: "tipo_00_pizza_flour",
      label: "Tipo 00 / pizza flour",
      fitLevel: "best_fit",
    });
    expect(result.availableFlourRecommendation?.whyThisFlourFits).toContain("8–10 h same-day plan");
  });

  it("recommends stronger flour for a 48h cold fermentation plan", () => {
    const result = buildPlanningResult(planningInputWithHours(48, {
      hydration: 66,
      selectedFermentationMode: "cold",
      ovenType: "pizza_oven",
      doughStyle: "cold_neapolitan",
    }));

    expect(result.availableFlourRecommendation?.recommendedFlour).toMatchObject({
      id: "bread_strong_flour",
      label: "Bread flour / strong flour",
    });
    expect(result.availableFlourRecommendation?.whyThisFlourFits).toContain("longer cold or hybrid fermentation");
  });

  it("cautions when the active flour is weak for high hydration or long fermentation", () => {
    const highHydration = buildPlanningResult(planningInputWithHours(10, {
      flourSelection: { type: "standard_pizza_flour" },
      hydration: 72,
      selectedFermentationMode: "room",
      ovenType: "home_oven",
    }));
    const longFermentation = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "standard_pizza_flour" },
      hydration: 64,
      selectedFermentationMode: "cold",
      ovenType: "pizza_oven",
      doughStyle: "cold_neapolitan",
    }));

    expect(highHydration.availableFlourRecommendation?.selectedFlourRiskLevel).toBe("not_recommended");
    expect(highHydration.availableFlourRecommendation?.suggestedAdjustment).toContain("Lower hydration");
    expect(longFermentation.availableFlourRecommendation?.selectedFlourRiskLevel).toBe("not_recommended");
    expect(longFermentation.availableFlourRecommendation?.suggestedAdjustment).toContain("Use stronger flour");
  });

  it("keeps strong flour workable or better for long fermentation while avoiding exact flour science claims", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "strong_pizza_flour" },
      hydration: 68,
      selectedFermentationMode: "cold",
      ovenType: "home_oven",
      doughStyle: "cold_neapolitan",
    }));

    expect(result.availableFlourRecommendation?.recommendedFlour?.id).toBe("bread_strong_flour");
    expect(result.availableFlourRecommendation?.selectedFlourRiskLevel).toBe("workable");
    expect(result.availableFlourRecommendation?.technicalNote).toBeNull();
    expect(result.availableFlourRecommendation?.summary).not.toMatch(/exact|guarantee/i);
  });

  it("adds default dough type guidance for Neapolitan-style direct dough", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      doughStyle: "neapolitan_direct",
      ovenType: "pizza_oven",
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
      selectedFermentationMode: "room",
    }));

    expect(result.doughTypeGuidance).toMatchObject({
      doughType: "neapolitan_direct",
      doughTypeLabel: "Neapolitan-style direct dough",
      fitLevel: "good_fit",
      riskLevel: "workable",
    });
    expect(result.doughTypeGuidance?.summary).toContain("good broad fit");
  });

  it("marks same-day Neapolitan-style dough as a mismatch for long available windows", () => {
    const result = buildPlanningResult(planningInputWithHours(48, {
      doughStyle: "same_day_neapolitan",
      selectedFermentationMode: "room",
    }));

    expect(result.doughTypeGuidance).toMatchObject({
      doughType: "same_day_neapolitan",
      fitLevel: "caution",
      riskLevel: "caution",
    });
    expect(result.doughTypeGuidance?.cautions.join(" ")).toContain("cold fermented Neapolitan-style dough may be a better fit");
    expect(result.doughTypeGuidance?.suggestedAdjustments.join(" ")).toContain("switching to a cold fermented");
  });

  it("warns when cold fermented Neapolitan-style dough has too little time", () => {
    const result = buildPlanningResult(planningInputWithHours(6, {
      doughStyle: "cold_neapolitan",
      selectedFermentationMode: "cold",
    }));

    expect(result.doughTypeGuidance).toMatchObject({
      doughType: "cold_neapolitan",
      fitLevel: "caution",
      riskLevel: "caution",
    });
    expect(result.doughTypeGuidance?.cautions.join(" ")).toContain("longer window");
    expect(result.doughTypeGuidance?.suggestedAdjustments.join(" ")).toContain("move the bake time later");
  });

  it("raises risk for cold fermented Neapolitan-style dough with a warm fridge", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      doughStyle: "cold_neapolitan",
      selectedFermentationMode: "cold",
      fridgeTemperature: 8,
    }));

    expect(result.doughTypeGuidance).toMatchObject({
      doughType: "cold_neapolitan",
      riskLevel: "high_risk",
      fitLevel: "high_risk",
    });
    expect(result.doughTypeGuidance?.cautions.join(" ")).toContain("warm fridge");
    expect(result.doughTypeGuidance?.suggestedAdjustments.join(" ")).toContain("colder fridge");
  });

  it("keeps Neapolitan-style direct dough workable in a home oven with a cautious note", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      doughStyle: "neapolitan_direct",
      ovenType: "home_oven",
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
      selectedFermentationMode: "room",
    }));

    expect(result.doughTypeGuidance).toMatchObject({
      doughType: "neapolitan_direct",
      fitLevel: "workable",
      riskLevel: "workable",
    });
    expect(result.doughTypeGuidance?.suggestedAdjustments.join(" ")).toContain("home oven");
  });

  it("keeps unsupported dough styles as context only", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      doughStyle: "roman_pan_future",
    }));

    expect(result.doughTypeGuidance).toMatchObject({
      doughType: "unsupported",
      fitLevel: "not_enough_information",
      riskLevel: "not_enough_information",
    });
    expect(result.doughTypeGuidance?.summary).toContain("context");
  });

  it("returns not_enough_information start window when bake target is invalid", () => {
    const result = buildPlanningResult({
      ...basePlanningInput,
      desiredBakeDateTime: new Date("not-a-date"),
    });

    expect(result.startWindowRecommendation).toMatchObject({
      category: "not_enough_information",
      fitLevel: "not_enough_information",
      riskLevel: "not_enough_information",
      earliestRecommendedStartIso: null,
      latestRecommendedStartIso: null,
    });
    expect(result.startWindowRecommendation?.summary).toContain("valid bake target");
  });

  it("flags very short available time as a start-now high-risk window", () => {
    const result = buildPlanningResult(planningInputWithHours(2, {
      selectedFermentationMode: "room",
    }));

    expect(result.startWindowRecommendation).toMatchObject({
      category: "too_late",
      startWindowLabel: "Start now, but timing is tight",
      riskLevel: "high_risk",
      fitLevel: "high_risk",
    });
    expect(result.startWindowRecommendation?.summary).toContain("Start now");
    expect(result.startWindowRecommendation?.suggestedAdjustments.join(" ")).toContain("later bake target");
  });

  it("recommends a same-day start window for same-day room fermentation", () => {
    const result = buildPlanningResult(planningInputWithHours(10, {
      selectedFermentationMode: "room",
    }));

    expect(result.startWindowRecommendation).toMatchObject({
      category: "same_day_window",
      selectedFermentationMode: "room",
      recommendedFermentationMode: "room",
      fitLevel: "good_fit",
    });
    expect(result.startWindowRecommendation?.relativeStartRecommendation).toContain("same day");
    expect(result.startWindowRecommendation?.earliestRecommendedStartIso).toBeTruthy();
    expect(result.startWindowRecommendation?.latestRecommendedStartIso).toBeTruthy();
  });

  it("recommends a day-before start window for 24-48h cold or hybrid-friendly timing", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      selectedFermentationMode: "cold",
      fridgeTemperature: 4,
    }));

    expect(result.startWindowRecommendation).toMatchObject({
      category: "day_before",
      selectedFermentationMode: "cold",
      riskLevel: "workable",
    });
    expect(result.startWindowRecommendation?.relativeStartRecommendation).toContain("day before");
  });

  it("recommends a one-to-three-day start window for long cold-friendly timing", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      selectedFermentationMode: "cold",
      fridgeTemperature: 4,
      flourSelection: { type: "strong_pizza_flour" },
    }));

    expect(result.startWindowRecommendation).toMatchObject({
      category: "one_to_three_days_before",
      selectedFermentationMode: "cold",
    });
    expect(result.startWindowRecommendation?.relativeStartRecommendation).toContain("one to three days");
  });

  it("warns when cold fermentation is selected but bake time is too soon", () => {
    const result = buildPlanningResult(planningInputWithHours(5, {
      selectedFermentationMode: "cold",
    }));

    expect(result.startWindowRecommendation).toMatchObject({
      category: "start_now",
      riskLevel: "high_risk",
    });
    expect(result.startWindowRecommendation?.cautions.join(" ")).toContain("Cold fermentation is selected");
    expect(result.startWindowRecommendation?.suggestedAdjustments.join(" ")).toContain("room-temperature same-day");
  });

  it("reflects warm fridge risk in a long cold start window", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      selectedFermentationMode: "cold",
      fridgeTemperature: 8,
    }));

    expect(result.startWindowRecommendation).toMatchObject({
      category: "one_to_three_days_before",
      riskLevel: "high_risk",
    });
    expect(result.startWindowRecommendation?.cautions.join(" ")).toContain("Warm fridge");
    expect(result.startWindowRecommendation?.suggestedAdjustments.join(" ")).toContain("colder fridge");
  });

  it("returns not enough information combined risk when bake target is invalid", () => {
    const result = buildPlanningResult({
      ...basePlanningInput,
      desiredBakeDateTime: new Date("not-a-date"),
    });

    expect(result.combinedRiskSummary).toMatchObject({
      overallRiskLevel: "not_enough_information",
      primaryRiskReason: "Add a valid bake date and time to get a stronger planning risk summary.",
      suggestedFirstAdjustment: "Set the bake target first.",
    });
    expect(result.combinedRiskSummary?.secondaryRiskReasons).toEqual([]);
    expect(result.combinedRiskSummary?.additionalAdjustments).toEqual([]);
    expect(result.combinedRiskSummary?.summary).toContain("bake date and time");
  });

  it("summarizes a balanced plan as low risk", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      selectedFermentationMode: "room",
      yeastType: "cy",
      calculatedFlourGrams: 1000,
      calculatedYeastGrams: 1.1,
      hydration: 64,
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
      roomTemperature: 22,
      fridgeTemperature: 4,
    }));

    expect(result.combinedRiskSummary).toMatchObject({
      overallRiskLevel: "low",
      primaryRiskReason: "No major risk signals were detected.",
      suggestedFirstAdjustment: "Keep the plan as-is, then judge the dough by condition instead of the clock alone.",
    });
    expect(result.combinedRiskSummary?.summary).toContain("broadly balanced");
  });

  it("summarizes warm fridge or flour-hydration concerns as caution", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      selectedFermentationMode: "cold",
      hydration: 72,
      flourSelection: { type: "medium_strong_pizza_flour" },
    }));

    expect(result.combinedRiskSummary?.overallRiskLevel).toBe("caution");
    expect(result.combinedRiskSummary?.primaryRiskReason).toMatch(/flour|hydration/i);
    expect(result.combinedRiskSummary?.suggestedFirstAdjustment).toMatch(/flour|dough strength|hydration/i);
  });

  it("prioritizes too little time for selected cold fermentation as high risk", () => {
    const result = buildPlanningResult(planningInputWithHours(5, {
      selectedFermentationMode: "cold",
    }));

    expect(result.combinedRiskSummary).toMatchObject({
      overallRiskLevel: "high_risk",
    });
    expect(result.combinedRiskSummary?.primaryRiskReason).toContain("Cold fermentation");
    expect(result.combinedRiskSummary?.suggestedFirstAdjustment).toContain("room");
  });

  it("prioritizes high yeast with warm conditions as high risk", () => {
    const result = buildPlanningResult(planningInputWithHours(24, {
      selectedFermentationMode: "room",
      yeastType: "cy",
      calculatedFlourGrams: 1000,
      calculatedYeastGrams: 8,
      roomTemperature: 28,
    }));

    expect(result.yeastGuidance?.riskLevel).toBe("high_risk");
    expect(result.combinedRiskSummary).toMatchObject({
      overallRiskLevel: "high_risk",
      primaryRiskReason: "Yeast guidance is high risk and warm conditions may make the dough move faster.",
    });
  });

  it("prioritizes warm fridge risk for long cold plans when yeast amount is not the main issue", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      selectedFermentationMode: "cold",
      fridgeTemperature: 8,
      yeastType: "cy",
      calculatedFlourGrams: 1000,
      calculatedYeastGrams: 0.15,
    }));

    expect(result.yeastGuidance?.riskLevel).not.toBe("high_risk");
    expect(result.temperatureGuidance?.riskLevel).toBe("high_risk");
    expect(result.startWindowRecommendation?.riskLevel).toBe("high_risk");
    expect(result.combinedRiskSummary).toMatchObject({
      overallRiskLevel: "high_risk",
      primaryRiskReason: "Warm fridge temperature may shorten the safe cold or hybrid start window.",
      suggestedFirstAdjustment: "Use a colder fridge or avoid stretching the cold window too far.",
    });
    expect(result.combinedRiskSummary?.secondaryRiskReasons.join(" ")).toContain("warm fridge");
  });

  it("summarizes multiple caution signals without overwhelming the user", () => {
    const result = buildPlanningResult(planningInputWithHours(10, {
      selectedFermentationMode: "hybrid",
      roomTemperature: 25,
    }));

    expect(result.combinedRiskSummary?.overallRiskLevel).toBe("caution");
    expect(result.combinedRiskSummary?.secondaryRiskReasons.length).toBeLessThanOrEqual(4);
    expect(result.combinedRiskSummary?.summary).toContain("multiple caution signals");
  });

  it("returns workable formula fit for moderate hydration and normal salt", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      selectedFermentationMode: "room",
      hydration: 64,
      salt: 2.8,
      ovenType: "pizza_oven",
      doughStyle: "neapolitan_direct",
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
    }));

    expect(result.formulaFitGuidance).toMatchObject({
      hydrationFit: "good_fit",
      saltFit: "good_fit",
      ovenFit: "good_fit",
      overallFit: "good_fit",
    });
    expect(result.formulaFitGuidance?.summary).toContain("strong broad v1 fit");
  });

  it("cautions for high hydration with all-purpose or weaker flour", () => {
    const result = buildPlanningResult(planningInputWithHours(10, {
      selectedFermentationMode: "room",
      hydration: 72,
      salt: 2.8,
      flourSelection: { type: "standard_pizza_flour" },
    }));

    expect(result.formulaFitGuidance).toMatchObject({
      hydrationFit: "high_risk",
      overallFit: "high_risk",
    });
    expect(result.formulaFitGuidance?.cautions.join(" ")).toContain("all-purpose or weaker flour");
  });

  it("cautions for high hydration in a home oven", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      selectedFermentationMode: "room",
      hydration: 70,
      salt: 2.8,
      ovenType: "home_oven",
      flourSelection: { type: "medium_strong_pizza_flour" },
    }));

    expect(result.formulaFitGuidance).toMatchObject({
      hydrationFit: "caution",
      ovenFit: "workable",
      overallFit: "caution",
    });
    expect(result.formulaFitGuidance?.cautions.join(" ")).toContain("home oven");
  });

  it("cautions for low salt", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      hydration: 64,
      salt: 1.5,
    }));

    expect(result.formulaFitGuidance).toMatchObject({
      saltFit: "caution",
      overallFit: "caution",
    });
    expect(result.formulaFitGuidance?.cautions.join(" ")).toContain("Low salt");
  });

  it("cautions for high salt", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      hydration: 64,
      salt: 3.8,
    }));

    expect(result.formulaFitGuidance).toMatchObject({
      saltFit: "caution",
      overallFit: "caution",
    });
    expect(result.formulaFitGuidance?.cautions.join(" ")).toContain("High salt");
  });

  it("treats Neapolitan-style dough in a home oven as workable with expectation guidance", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      selectedFermentationMode: "room",
      hydration: 64,
      salt: 2.8,
      ovenType: "home_oven",
      doughStyle: "neapolitan_direct",
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
    }));

    expect(result.formulaFitGuidance).toMatchObject({
      ovenFit: "workable",
      overallFit: "workable",
    });
    expect(result.formulaFitGuidance?.summary).toContain("home oven");
    expect(result.formulaFitGuidance?.suggestedAdjustments.join(" ")).toContain("preheating");
  });

  it("treats Neapolitan-style dough with pizza flour and pizza oven as a good fit", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      selectedFermentationMode: "room",
      hydration: 64,
      salt: 2.8,
      ovenType: "pizza_oven",
      doughStyle: "neapolitan_direct",
      flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
    }));

    expect(result.formulaFitGuidance).toMatchObject({
      hydrationFit: "good_fit",
      saltFit: "good_fit",
      ovenFit: "good_fit",
      overallFit: "good_fit",
    });
  });

  it("flags a short available time as not enough for reliable fermentation setup", () => {
    const result = buildPlanningResult(planningInputWithHours(2, {
      selectedFermentationMode: "room",
    }));

    expect(result.fermentationSetupRecommendation).toMatchObject({
      recommendedSetup: "not_enough_time",
      recommendedFermentationMode: "not_recommended",
      selectedFermentationMode: "room",
      fitLevel: "not_recommended",
      riskLevel: "not_recommended",
    });
    expect(result.fermentationSetupRecommendation?.cautions.join(" ")).toContain("very soon");
  });

  it("recommends same-day room setup for a workable same-day window", () => {
    const result = buildPlanningResult(planningInputWithHours(5, {
      selectedFermentationMode: "room",
    }));

    expect(result.fermentationSetupRecommendation).toMatchObject({
      availableTimeHours: 5,
      recommendedSetup: "same_day_room",
      recommendedFermentationMode: "room",
      selectedFermentationMode: "room",
      fitLevel: "good_fit",
    });
    expect(result.fermentationSetupRecommendation?.summary).toContain("same-day room plan may work");
  });

  it("treats cold fermentation as a mismatch when bake time is very soon", () => {
    const result = buildPlanningResult(planningInputWithHours(5, {
      selectedFermentationMode: "cold",
    }));

    expect(result.fermentationSetupRecommendation).toMatchObject({
      recommendedSetup: "same_day_room",
      selectedFermentationMode: "cold",
      fitLevel: "high_risk",
      riskLevel: "high_risk",
    });
    expect(result.fermentationSetupRecommendation?.cautions.join(" ")).toContain("Cold fermentation");
    expect(result.fermentationSetupRecommendation?.suggestedAdjustments.join(" ")).toContain("room");
  });

  it("recommends room-temperature setup in the 8-24 hour planning range", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      selectedFermentationMode: "room",
    }));

    expect(result.fermentationSetupRecommendation).toMatchObject({
      recommendedSetup: "room_temperature",
      recommendedFermentationMode: "room",
      fitLevel: "good_fit",
      riskLevel: "good_fit",
    });
  });

  it("recommends cold or hybrid setup for the 24-72 hour range", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      selectedFermentationMode: "cold",
      fridgeTemperature: 4,
    }));

    expect(result.fermentationSetupRecommendation).toMatchObject({
      recommendedSetup: "cold_fermentation",
      recommendedFermentationMode: "cold",
      selectedFermentationMode: "cold",
      fitLevel: "good_fit",
    });
  });

  it("surfaces warm fridge caution for long cold fermentation setup", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      selectedFermentationMode: "cold",
      fridgeTemperature: 8,
    }));

    expect(result.fermentationSetupRecommendation).toMatchObject({
      recommendedSetup: "hybrid",
      selectedFermentationMode: "cold",
      riskLevel: "caution",
    });
    expect(result.fermentationSetupRecommendation?.cautions.join(" ")).toContain("Warm fridge");
    expect(result.fermentationSetupRecommendation?.suggestedAdjustments.join(" ")).toContain("colder fridge");
  });

  it("surfaces warm room high risk when selected room setup conflicts with a long window", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      selectedFermentationMode: "room",
      roomTemperature: 28,
    }));

    expect(result.fermentationSetupRecommendation).toMatchObject({
      recommendedSetup: "cold_fermentation",
      selectedFermentationMode: "room",
      fitLevel: "high_risk",
      riskLevel: "high_risk",
    });
    expect(result.fermentationSetupRecommendation?.cautions.join(" ")).toContain("Hot room");
  });

  it("keeps fermentation setup recommendation safe when no selected setup is provided", () => {
    const result = buildPlanningResult(planningInputWithHours(18));

    expect(result.fermentationSetupRecommendation).toMatchObject({
      recommendedSetup: "room_temperature",
      selectedFermentationMode: null,
      fitLevel: "workable",
    });
  });

  it("returns not_recommended and a high-risk warning when the fermentation window is zero or negative", () => {
    const result = buildPlanningResult({
      ...basePlanningInput,
      desiredBakeDateTime: new Date("2026-06-30T08:00:00.000Z"),
    });

    expect(result.availableFermentationHours).toBe(0);
    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.qualityScore).toMatchObject({ score: 5, label: "low" });
    expect(result.warnings).toEqual([expect.objectContaining({
      id: "no-positive-fermentation-window",
      severity: "high_risk",
    })]);
    expect(result.recommendedYeast.placeholderPercent).toBeNull();
  });

  it("returns not_recommended and a high-risk warning for the 0-3 hour window", () => {
    const result = buildPlanningResult(planningInputWithHours(2));

    expect(result.availableFermentationHours).toBe(2);
    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.qualityScore).toMatchObject({ score: 10, label: "low" });
    expect(result.warnings).toEqual([expect.objectContaining({
      id: "insufficient-fermentation-window",
      severity: "high_risk",
      userMessage: expect.stringContaining("not enough time"),
    })]);
  });

  it("recommends a fast room-temperature dough for 5 hours with beginner-safe hydration", () => {
    const result = buildPlanningResult(planningInputWithHours(5, {
      userLevel: "beginner",
      ovenType: "home_oven",
      flourSelection: { type: "unknown" },
    }));

    expect(result.recommendedFermentationMode).toBe("room");
    expect(result.recommendedFlourCategory).toBe("standard");
    expect(result.recommendedHydration).toBe(60);
    expect(result.recommendedSalt).toBe(2.8);
    expect(result.recommendedYeast.placeholderPercent).toBe(0.25);
    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "fast-dough-compromise",
      severity: "caution",
    }));
    expect(result.qualityScore).toMatchObject({ score: 45, label: "moderate_low" });
  });

  it("recommends room fermentation and medium-strong flour for a 10 hour window", () => {
    const result = buildPlanningResult(planningInputWithHours(10));

    expect(result.recommendedFermentationMode).toBe("room");
    expect(result.recommendedFlourCategory).toBe("medium_strong");
    expect(result.recommendedHydration).toBe(64);
    expect(result.recommendedYeast.placeholderPercent).toBe(0.14);
    expect(result.qualityScore).toMatchObject({ score: 60, label: "moderate" });
  });

  it("marks the 18 hour window as the best classic v1 time window with a good score", () => {
    const result = buildPlanningResult(planningInputWithHours(18));

    expect(["room", "hybrid"]).toContain(result.recommendedFermentationMode);
    expect(result.recommendedFlourCategory).toBe("medium_strong");
    expect(result.recommendedHydration).toBe(64);
    expect(result.recommendedYeast.placeholderPercent).toBe(0.08);
    expect(result.qualityScore).toMatchObject({ score: 82, label: "good" });
    expect(result.qualityScore.reasons.join(" ")).toContain("best classic v1");
    expect(result.technicalDetails.assumptions.join(" ")).toContain("best classic v1");
  });

  it("recommends hybrid or cold fermentation and strong flour for a 36 hour window", () => {
    const result = buildPlanningResult(planningInputWithHours(36));

    expect(["hybrid", "cold"]).toContain(result.recommendedFermentationMode);
    expect(result.recommendedFlourCategory).toBe("strong");
    expect(result.recommendedYeast.placeholderPercent).toBe(0.04);
    expect(result.qualityScore.label).toBe("good");
  });

  it("recommends cold or hybrid fermentation and strong flour for a 60 hour window", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "strong_pizza_flour" },
    }));

    expect(["hybrid", "cold"]).toContain(result.recommendedFermentationMode);
    expect(["strong", "very_strong"]).toContain(result.recommendedFlourCategory);
    expect(result.recommendedYeast.placeholderPercent).toBe(0.02);
    expect(result.qualityScore).toMatchObject({ score: 78, label: "good" });
  });

  it("warns when 48-72 hour fermentation uses unknown or weak flour", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "unknown" },
    }));

    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "weak-or-unknown-flour-long-fermentation",
      severity: "caution",
    }));
    expect(result.qualityScore).toMatchObject({ score: 58, label: "moderate" });
  });

  it("creates a high-risk warning for standard flour in a 60 hour fermentation window", () => {
    const result = buildPlanningResult(planningInputWithHours(60, {
      flourSelection: { type: "standard_pizza_flour" },
    }));

    expect(result.technicalDetails.flourAssumptions).toMatchObject({
      profileId: "standard_pizza_flour",
      category: "standard",
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "standard-flour-too-weak-for-long-fermentation",
      severity: "high_risk",
    }));
  });

  it("creates a caution warning for very strong flour in a 5 hour fast dough window", () => {
    const result = buildPlanningResult(planningInputWithHours(5, {
      flourSelection: { type: "known_flour_id", flourId: "pirkka_w350" },
    }));

    expect(result.technicalDetails.flourAssumptions).toMatchObject({
      profileId: "pirkka_w350",
      category: "very_strong",
    });
    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "very-strong-flour-fast-dough",
      severity: "caution",
    }));
  });

  it("treats medium-strong flour as a good fit for an 18 hour planning window", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      flourSelection: { type: "known_flour_id", flourId: "pirkka_w260" },
    }));

    expect(result.technicalDetails.flourAssumptions).toMatchObject({
      profileId: "pirkka_w260",
      category: "medium_strong",
    });
    expect(result.recommendedFlourCategory).toBe("medium_strong");
    expect(result.qualityScore.label).toBe("good");
    expect(result.warnings).toEqual([]);
  });

  it("returns cautious not_recommended behavior above 72 hours", () => {
    const beginnerResult = buildPlanningResult(planningInputWithHours(96, {
      userLevel: "beginner",
    }));
    const nerdResult = buildPlanningResult(planningInputWithHours(96, {
      userLevel: "pizza_nerd",
    }));

    expect(beginnerResult.recommendedFermentationMode).toBe("not_recommended");
    expect(beginnerResult.warnings).toContainEqual(expect.objectContaining({
      id: "advanced-long-fermentation-window",
      severity: "high_risk",
    }));
    expect(beginnerResult.qualityScore).toMatchObject({ score: 25, label: "low" });

    expect(nerdResult.recommendedFermentationMode).toBe("not_recommended");
    expect(nerdResult.warnings).toContainEqual(expect.objectContaining({
      id: "advanced-long-fermentation-window",
      severity: "caution",
    }));
    expect(nerdResult.warnings).toContainEqual(expect.objectContaining({
      id: "pizza-nerd-long-fermentation-note",
      severity: "info",
      visibleForLevels: ["pizza_nerd"],
    }));
  });

  it("adds a warm-fridge warning for long cold or hybrid planning windows", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      fridgeTemperature: 9,
    }));

    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "warm-fridge-long-fermentation",
      severity: "caution",
      userMessage: expect.stringContaining("fridge temperature is warm"),
    }));
  });

  it("keeps yeast placeholder percentages monotonic as fermentation time increases", () => {
    const yeastPercentages = [5, 10, 18, 36, 60, 96].map((hours) => {
      const result = buildPlanningResult(planningInputWithHours(hours, {
        userLevel: "pizza_nerd",
        flourSelection: { type: "strong_pizza_flour" },
      }));

      return result.recommendedYeast.placeholderPercent;
    });

    expect(yeastPercentages).toEqual([0.25, 0.14, 0.08, 0.04, 0.02, 0.01]);
  });

  it("uses the v1 yeast model so shorter plans recommend more yeast than longer plans", () => {
    const fiveHour = buildPlanningResult(planningInputWithHours(5));
    const eighteenHour = buildPlanningResult(planningInputWithHours(18));
    const fortyEightHour = buildPlanningResult(planningInputWithHours(48, {
      flourSelection: { type: "strong_pizza_flour" },
    }));
    const seventyTwoHour = buildPlanningResult(planningInputWithHours(72, {
      flourSelection: { type: "strong_pizza_flour" },
    }));

    expect(fiveHour.recommendedYeast.recommendedFreshYeastPercent).toBeGreaterThan(
      eighteenHour.recommendedYeast.recommendedFreshYeastPercent ?? 0,
    );
    expect(eighteenHour.recommendedYeast.recommendedFreshYeastPercent).toBeGreaterThan(
      fortyEightHour.recommendedYeast.recommendedFreshYeastPercent ?? 0,
    );
    expect(fortyEightHour.recommendedYeast.recommendedFreshYeastPercent).toBe(
      seventyTwoHour.recommendedYeast.recommendedFreshYeastPercent,
    );
    expect(fortyEightHour.recommendedYeast.note).toContain("fresh yeast equivalent");
  });

  it("reduces yeast for a warm room and increases yeast for a cool room", () => {
    const defaultRoom = buildPlanningResult(planningInputWithHours(18, { roomTemperature: 22 }));
    const warmRoom = buildPlanningResult(planningInputWithHours(18, { roomTemperature: 26 }));
    const coolRoom = buildPlanningResult(planningInputWithHours(18, { roomTemperature: 18 }));

    expect(warmRoom.recommendedYeast.recommendedFreshYeastPercent).toBeLessThan(
      defaultRoom.recommendedYeast.recommendedFreshYeastPercent ?? 0,
    );
    expect(coolRoom.recommendedYeast.recommendedFreshYeastPercent).toBeGreaterThan(
      defaultRoom.recommendedYeast.recommendedFreshYeastPercent ?? 0,
    );
  });

  it("returns stable fresh, instant dry and active dry yeast equivalent percentages", () => {
    const result = buildPlanningResult(planningInputWithHours(18));
    const fresh = result.recommendedYeast.recommendedFreshYeastPercent ?? 0;

    expect(result.recommendedYeast.placeholderPercent).toBe(fresh);
    expect(result.recommendedYeast.instantDryYeastEquivalentPercent).toBeCloseTo(
      fresh * INSTANT_DRY_YEAST_FROM_FRESH_FACTOR,
      4,
    );
    expect(result.recommendedYeast.activeDryYeastEquivalentPercent).toBeCloseTo(
      fresh * ACTIVE_DRY_YEAST_FROM_FRESH_FACTOR,
      4,
    );
    expect(result.technicalDetails.yeastAssumptions.supportedYeastTypes).toEqual([
      "fresh_yeast",
      "instant_dry_yeast",
      "active_dry_yeast",
    ]);
    expect(result.technicalDetails.yeastAssumptions.yeastConfidence).toBe("medium");
  });

  it("returns safe yeast recommendation fields for not_recommended short windows", () => {
    const result = buildPlanningResult(planningInputWithHours(2));

    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.recommendedYeast).toMatchObject({
      placeholderPercent: null,
      recommendedFreshYeastPercent: null,
      instantDryYeastEquivalentPercent: null,
      activeDryYeastEquivalentPercent: null,
      yeastConfidence: "none",
    });
  });

  it("keeps over-72-hour yeast cautious and low confidence", () => {
    const result = buildPlanningResult(planningInputWithHours(96, {
      userLevel: "pizza_nerd",
      flourSelection: { type: "strong_pizza_flour" },
    }));

    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.recommendedYeast.recommendedFreshYeastPercent).toBe(0.01);
    expect(result.recommendedYeast.instantDryYeastEquivalentPercent).toBeCloseTo(0.01 / 3, 4);
    expect(result.recommendedYeast.yeastConfidence).toBe("low");
  });

  it("records yeast model assumptions and warm-fridge warnings for long plans", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      fridgeTemperature: 9,
    }));

    expect(result.warnings).toContainEqual(expect.objectContaining({
      id: "warm-fridge-long-fermentation",
    }));
    expect(result.technicalDetails.yeastAssumptions.yeastModelAssumptions.join(" ")).toContain(
      "Fresh yeast equivalent",
    );
    expect(result.technicalDetails.yeastAssumptions.yeastModelAssumptions.join(" ")).toContain(
      "Instant dry yeast equivalent",
    );
    expect(result.technicalDetails.yeastAssumptions.yeastConfidence).toBe("low");
  });

  it("keeps planning warning ids stable and visibility levels populated", () => {
    const scenarios = [
      buildPlanningResult(planningInputWithHours(-1)),
      buildPlanningResult(planningInputWithHours(2)),
      buildPlanningResult(planningInputWithHours(5, {
        flourSelection: { type: "known_flour_id", flourId: "pirkka_w350" },
      })),
      buildPlanningResult(planningInputWithHours(36, {
        fridgeTemperature: 9,
      })),
      buildPlanningResult(planningInputWithHours(60, {
        flourSelection: { type: "standard_pizza_flour" },
      })),
      buildPlanningResult(planningInputWithHours(96, {
        userLevel: "pizza_nerd",
      })),
    ];
    const warnings = scenarios.flatMap((scenario) => scenario.warnings);
    const warningIds = new Set(warnings.map((warning) => warning.id));

    expect(warningIds).toEqual(new Set([
      "no-positive-fermentation-window",
      "insufficient-fermentation-window",
      "fast-dough-compromise",
      "very-strong-flour-fast-dough",
      "warm-fridge-long-fermentation",
      "standard-flour-too-weak-for-long-fermentation",
      "low-confidence-yeast-recommendation",
      "advanced-long-fermentation-window",
      "pizza-nerd-long-fermentation-note",
    ]));

    for (const warning of warnings) {
      expect(warning.visibleForLevels.length).toBeGreaterThan(0);
      expect(warning.userMessage.length).toBeGreaterThan(0);
      expect(warning.technicalReason.length).toBeGreaterThan(0);
      expect(warning.suggestedFix.length).toBeGreaterThan(0);
    }
  });

  it("adds default hand mixing guidance to planning results", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      userLevel: "beginner",
    }));

    expect(result.mixingGuidance).toMatchObject({
      method: "hand_mixing",
      userLevel: "beginner",
      title: "Hand mixing",
      summary: expect.stringContaining("learning"),
      doughFeel: expect.stringContaining("hydrated"),
      stopWhen: expect.stringContaining("no dry flour pockets"),
    });
    expect(result.mixingGuidance?.recommendedOrder.join(" ")).toContain("Add water");
    expect(result.mixingGuidance?.avoid.join(" ")).toContain("extra flour");
    expect(result.mixingGuidance?.avoid.join(" ")).toContain("salt and yeast");
    expect(result.mixingGuidance?.cautions).toContainEqual(expect.objectContaining({
      id: "hand-mixing-extra-flour",
      severity: "caution",
    }));
  });

  it("distinguishes hand mixing, stand mixer and spiral mixer guidance", () => {
    const hand = buildPlanningMixingGuidance({
      method: "hand_mixing",
      userLevel: "enthusiast",
      recommendedHydration: 64,
    });
    const stand = buildPlanningMixingGuidance({
      method: "stand_mixer",
      userLevel: "enthusiast",
      recommendedHydration: 64,
    });
    const spiral = buildPlanningMixingGuidance({
      method: "spiral_mixer",
      userLevel: "enthusiast",
      recommendedHydration: 64,
    });

    expect(hand.title).toBe("Hand mixing");
    expect(stand.title).toBe("Stand mixer / kitchen machine");
    expect(spiral.title).toBe("Spiral mixer");
    expect(stand.summary).toContain("Machine mixing is not wrong");
    expect(spiral.summary).toContain("repeatability");
    expect(stand.cautions).toContainEqual(expect.objectContaining({
      id: "stand-mixer-overmixing-heat",
      severity: "caution",
    }));
    expect(spiral.cautions).toContainEqual(expect.objectContaining({
      id: "spiral-mixer-watch-temperature",
      severity: "caution",
    }));
  });

  it("varies mixing guidance by experience level", () => {
    const beginner = buildPlanningMixingGuidance({
      method: "stand_mixer",
      userLevel: "beginner",
      recommendedHydration: 64,
    });
    const enthusiast = buildPlanningMixingGuidance({
      method: "stand_mixer",
      userLevel: "enthusiast",
      recommendedHydration: 64,
    });
    const nerd = buildPlanningMixingGuidance({
      method: "stand_mixer",
      userLevel: "pizza_nerd",
      recommendedHydration: 66,
    });

    expect(beginner.levelNotes.join(" ")).toContain("Mix until everything is combined");
    expect(enthusiast.levelNotes.join(" ")).toContain("gluten");
    expect(nerd.levelNotes.join(" ")).toContain("friction");
    expect(nerd.technicalNotes.join(" ")).toContain("Target dough temperature");
    expect(nerd.cautions).toContainEqual(expect.objectContaining({
      id: "mixing-hydration-sensitivity",
      severity: "info",
      visibleForLevels: ["pizza_nerd"],
    }));
  });

  it("uses the requested mixing method when provided in PlanningInput", () => {
    const standMixer = buildPlanningResult(planningInputWithHours(18, {
      mixingMethod: "stand_mixer",
    }));
    const spiralMixer = buildPlanningResult(planningInputWithHours(36, {
      mixingMethod: "spiral_mixer",
    }));

    expect(standMixer.mixingGuidance?.method).toBe("stand_mixer");
    expect(standMixer.mixingGuidance?.cautions).toContainEqual(expect.objectContaining({
      id: "stand-mixer-overmixing-heat",
    }));
    expect(spiralMixer.mixingGuidance?.method).toBe("spiral_mixer");
    expect(spiralMixer.mixingGuidance?.cautions).toContainEqual(expect.objectContaining({
      id: "spiral-mixer-watch-temperature",
    }));
  });

  it("builds a safe default relative fermentation timeline", () => {
    const timeline = buildPlanningFermentationTimeline({
      userLevel: "beginner",
      ovenType: "home_oven",
      fermentationMode: "room",
      availableFermentationHours: 18,
      roomTemperature: 22,
      fridgeTemperature: 4,
    });

    expect(timeline).toMatchObject({
      version: 1,
      userLevel: "beginner",
      fermentationMode: "room",
      totalAvailableHours: 18,
      usesExactClockTimes: false,
    });
    expect(timeline.steps.map((step) => step.stepType)).toEqual([
      "mix_dough",
      "initial_rest",
      "bulk_fermentation",
      "ball_dough",
      "final_proof",
      "bake",
    ]);
    expect(timeline.steps[0]).toMatchObject({
      id: "1-mix_dough",
      title: "Mix dough",
      relativeTiming: "First",
      metadata: {
        usesExactClockTime: false,
      },
    });
    expect(timeline.assumptions.join(" ")).toContain("structured action sequence");
  });

  it("integrates fermentation timeline v1 into buildPlanningResult", () => {
    const result = buildPlanningResult(planningInputWithHours(18, {
      userLevel: "enthusiast",
    }));

    expect(result.fermentationTimeline).toBeTruthy();
    expect(result.fermentationTimeline?.steps.map((step) => step.stepType)).toEqual([
      "mix_dough",
      "initial_rest",
      "bulk_fermentation",
      "ball_dough",
      "final_proof",
      "bake",
    ]);
    expect(result.fermentationTimeline?.steps[2]).toMatchObject({
      stepType: "bulk_fermentation",
      phase: "fermentation",
      instruction: expect.stringContaining("ferment"),
    });
  });

  it("adds cold and room-temperature preparation steps when cold or hybrid fermentation is safely derivable", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      ovenType: "pizza_oven",
    }));

    expect(result.recommendedFermentationMode).toBe("cold");
    expect(result.fermentationTimeline?.steps.map((step) => step.stepType)).toEqual([
      "mix_dough",
      "initial_rest",
      "bulk_fermentation",
      "cold_fermentation",
      "ball_dough",
      "final_proof",
      "room_temperature_rest",
      "bake",
    ]);
    expect(result.fermentationTimeline?.steps.find((step) => step.stepType === "cold_fermentation")).toMatchObject({
      metadata: {
        fermentationMode: "cold",
        temperatureRole: "fridge",
      },
    });
  });

  it("keeps a fallback action sequence for not-recommended planning windows", () => {
    const result = buildPlanningResult(planningInputWithHours(2));

    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.fermentationTimeline).toMatchObject({
      fermentationMode: "not_recommended",
      usesExactClockTimes: false,
    });
    expect(result.fermentationTimeline?.steps.map((step) => step.stepType)).toContain("mix_dough");
    expect(result.fermentationTimeline?.steps[0].caution).toContain("not recommended");
  });

  it("varies fermentation timeline notes by experience level", () => {
    const beginner = buildPlanningFermentationTimeline({
      userLevel: "beginner",
      ovenType: "home_oven",
      fermentationMode: "room",
      availableFermentationHours: 18,
      roomTemperature: 22,
      fridgeTemperature: 4,
    });
    const nerd = buildPlanningFermentationTimeline({
      userLevel: "pizza_nerd",
      ovenType: "home_oven",
      fermentationMode: "room",
      availableFermentationHours: 18,
      roomTemperature: 22,
      fridgeTemperature: 4,
    });

    expect(beginner.steps[0].experienceNote).toContain("combining everything evenly");
    expect(nerd.steps[0].experienceNote).toContain("future planning");
    expect(nerd.steps[0].experienceNote).toContain("dough temperature");
  });

  it("builds default temperature guidance when optional temperature details are missing", () => {
    const guidance = buildPlanningTemperatureGuidance({
      userLevel: "beginner",
    });

    expect(guidance).toMatchObject({
      userLevel: "beginner",
      roomTemperature: 22,
      fridgeTemperature: 4,
      targetDoughTemperature: null,
      mixerFrictionHeat: null,
      roomCategory: "normal_room",
      fridgeCategory: "normal_fridge",
      riskLevel: "low",
    });
    expect(guidance.summary).toContain("safe");
    expect(guidance.levelNotes.join(" ")).toContain("Warmer dough moves faster");
  });

  it("classifies cool, normal, warm and hot room temperatures", () => {
    expect(classifyPlanningRoomTemperature(18)).toBe("cool_room");
    expect(classifyPlanningRoomTemperature(22)).toBe("normal_room");
    expect(classifyPlanningRoomTemperature(26)).toBe("warm_room");
    expect(classifyPlanningRoomTemperature(29)).toBe("hot_room");
  });

  it("classifies cold, normal and warm fridge temperatures", () => {
    expect(classifyPlanningFridgeTemperature(1)).toBe("cold_fridge");
    expect(classifyPlanningFridgeTemperature(4)).toBe("normal_fridge");
    expect(classifyPlanningFridgeTemperature(8)).toBe("warm_fridge");
  });

  it("integrates temperature guidance into buildPlanningResult", () => {
    const result = buildPlanningResult(planningInputWithHours(36, {
      roomTemperature: 26,
      fridgeTemperature: 8,
      mixingMethod: "stand_mixer",
      targetDoughTemperature: 24,
      mixerFrictionHeat: 3,
    }));

    expect(result.temperatureGuidance).toMatchObject({
      roomCategory: "warm_room",
      fridgeCategory: "warm_fridge",
      riskLevel: "high_risk",
      targetDoughTemperature: 24,
      mixerFrictionHeat: 3,
    });
    expect(result.temperatureGuidance?.mixerFrictionNote).toContain("friction heat");
    expect(result.temperatureGuidance?.userFacingGuidance.join(" ")).toContain("Use shorter room time");
    expect(result.technicalDetails.temperatureAssumptions).toMatchObject({
      roomTemperature: 26,
      fridgeTemperature: 8,
      targetDoughTemperature: 24,
      mixerFrictionHeat: 3,
      roomCategory: "warm_room",
      fridgeCategory: "warm_fridge",
    });
  });

  it("varies temperature guidance by experience level", () => {
    const beginner = buildPlanningTemperatureGuidance({
      userLevel: "beginner",
      roomTemperature: 29,
      fridgeTemperature: 8,
      fermentationMode: "room",
      availableFermentationHours: 18,
    });
    const nerd = buildPlanningTemperatureGuidance({
      userLevel: "pizza_nerd",
      roomTemperature: 29,
      fridgeTemperature: 8,
      fermentationMode: "room",
      availableFermentationHours: 18,
      mixingMethod: "spiral_mixer",
    });

    expect(beginner.riskLevel).toBe("high_risk");
    expect(beginner.levelNotes.join(" ")).toContain("check the dough earlier");
    expect(nerd.technicalNotes.join(" ")).toContain("Target dough temperature");
    expect(nerd.technicalNotes.join(" ")).toContain("spiral_mixer");
  });

  it("returns a stable quality score and technical details shape", () => {
    const result = buildPlanningResult(basePlanningInput);

    expect(result.qualityScore).toMatchObject({
      score: 80,
      label: "good",
      reasons: [expect.stringContaining("Long fermentation")],
    });
    expect(result.technicalDetails).toMatchObject({
      engineVersion: 1,
      selectedTimeWindow: {
        currentDateTime: "2026-06-30T09:00:00.000Z",
        desiredBakeDateTime: "2026-07-01T21:00:00.000Z",
      },
      availableFermentationHours: 36,
      sourceConfidence: {
        fermentation: "placeholder",
        flour: "placeholder",
        yeast: "placeholder",
        schedule: "placeholder",
      },
      temperatureAssumptions: {
        roomTemperature: 22,
        fridgeTemperature: 4,
        targetDoughTemperature: null,
        mixerFrictionHeat: null,
        roomCategory: "normal_room",
        fridgeCategory: "normal_fridge",
      },
      flourAssumptions: {
        flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
        category: "medium_strong",
      },
      yeastAssumptions: {
        yeastType: null,
      },
    });
    expect(result.yeastGuidance).toMatchObject({
      riskLevel: "not_enough_information",
    });
    expect(result.technicalDetails.assumptions.join(" ")).toContain("conservative broad fermentation time windows");
    expect(result.technicalDetails.assumptions.join(" ")).toContain("not gram calculations");
  });

  it("keeps existing dough calculator gram calculations untouched", () => {
    const ingredients = calculateDoughIngredients(baseSettings);

    expect(ingredients.total).toBeCloseTo(1606.8, 3);
    expect(ingredients.flour).toBeCloseTo(962.71, 2);
    expect(ingredients.water).toBeCloseTo(616.14, 2);
    expect(ingredients.salt).toBeCloseTo(26.96, 2);
    expect(ingredients.leavener).toBeCloseTo(0.99, 2);
  });

  it("keeps the Planning Engine isolated from calculator math and non-Dough-Plan session flows", () => {
    const calculator = source("lib/dough-calculator.ts");
    const homepageWorkspace = source("components/HomeCalculatorWorkspace.tsx");
    const sessionRecipe = source("lib/session-recipe.ts");
    const sessionTimeline = source("lib/pizza-session-timeline.ts");
    const plannerPage = source("app/plan/page.tsx");

    const planningImports = /planning-engine|planning-available-flour-recommendation|planning-fermentation-timeline|planning-flour-guidance|planning-flour-profiles|planning-input|planning-mixing-guidance|planning-result|planning-temperature-guidance|planning-types|planning-yeast-guidance|planning-yeast-model|planning-warning-engine/;

    expect(calculator).not.toMatch(planningImports);
    expect(homepageWorkspace).toContain('variant?: "full" | "entry" | "guided"');
    expect(homepageWorkspace).toContain("buildPlanningResult");
    expect(homepageWorkspace).toContain("AdvancedCalculatorPlanningShell");
    expect(homepageWorkspace).toContain("GuidedCalculatorV2");
    expect(homepageWorkspace).toContain("Secondary guidance is available below without turning this into a full workflow.");
    expect(sessionRecipe).toContain("buildPlanningResult");
    expect(sessionRecipe).toContain("planningInfoFromSessionRecipe");
    expect(sessionTimeline).not.toMatch(planningImports);
    expect(plannerPage).not.toMatch(planningImports);
  });
});
