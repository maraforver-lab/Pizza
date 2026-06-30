import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { buildPlanningResult, PLANNING_ENGINE_VERSION } from "@/lib/planning-engine";
import { calculateAvailableFermentationHours, type PlanningInput } from "@/lib/planning-input";
import { FERMENTATION_MODES, OVEN_TYPES, USER_LEVELS, type FlourSelection } from "@/lib/planning-types";
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

describe("Planning Engine foundation", () => {
  it("defines the supported v1 planning domain values", () => {
    expect(USER_LEVELS).toEqual(["beginner", "enthusiast", "pizza_nerd"]);
    expect(OVEN_TYPES).toEqual(["home_oven", "pizza_oven"]);
    expect(FERMENTATION_MODES).toEqual(["room", "cold", "hybrid", "not_recommended"]);
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
        expect(result.warnings).toEqual([]);
      }
    }
  });

  it("represents every supported flour selection shape without adding flour rules yet", () => {
    const selections: FlourSelection[] = [
      { type: "unknown" },
      { type: "standard_pizza_flour" },
      { type: "medium_strong_pizza_flour" },
      { type: "strong_pizza_flour" },
      { type: "known_flour_id", flourId: "caputo-pizzeria" },
    ];

    for (const flourSelection of selections) {
      const result = buildPlanningResult({ ...basePlanningInput, flourSelection });

      expect(result.recommendedFlourCategory).toBe("unknown");
      expect(result.technicalDetails.flourAssumptions.flourSelection).toEqual(flourSelection);
      expect(result.technicalDetails.flourAssumptions.category).toBe("unknown");
    }
  });

  it("processes a PlanningInput and returns a PlanningResult", () => {
    const result = buildPlanningResult(basePlanningInput);

    expect(result.availableFermentationHours).toBe(36);
    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.recommendedFlourCategory).toBe("unknown");
    expect(result.recommendedHydration).toBeNull();
    expect(result.recommendedSalt).toBeNull();
    expect(result.recommendedYeast).toEqual({
      yeastType: null,
      amountGrams: null,
      note: "Yeast recommendation is intentionally not calculated in the foundation patch.",
    });
    expect(result.warnings).toEqual([]);
    expect(result.qualityScore).toMatchObject({
      score: null,
      label: "not_scored_yet",
    });
    expect(result.technicalDetails.engineVersion).toBe(PLANNING_ENGINE_VERSION);
    expect(result.technicalDetails.assumptions.join(" ")).toContain("foundation only");
  });

  it("calculates available fermentation hours from current time to desired bake time", () => {
    expect(calculateAvailableFermentationHours(basePlanningInput)).toBe(36);
    expect(calculateAvailableFermentationHours({
      currentDateTime: new Date("2026-06-30T09:15:00.000Z"),
      desiredBakeDateTime: new Date("2026-06-30T15:45:00.000Z"),
    })).toBe(6.5);
  });

  it("returns a safe zero-hour foundation result and warning when no positive fermentation window exists", () => {
    const result = buildPlanningResult({
      ...basePlanningInput,
      desiredBakeDateTime: new Date("2026-06-30T08:00:00.000Z"),
    });

    expect(result.availableFermentationHours).toBe(0);
    expect(result.warnings).toEqual([{
      id: "no-positive-fermentation-window",
      severity: "high_risk",
      userMessage: "The desired bake time does not leave a positive fermentation window.",
      technicalReason: "desiredBakeDateTime is not later than currentDateTime.",
      suggestedFix: "Choose a later bake time before applying fermentation planning rules.",
      visibleForLevels: ["beginner", "enthusiast", "pizza_nerd"],
    }]);
    expect(result.recommendedFermentationMode).toBe("not_recommended");
    expect(result.recommendedYeast.amountGrams).toBeNull();
  });

  it("returns a stable quality score and technical details shape", () => {
    const result = buildPlanningResult(basePlanningInput);

    expect(result.qualityScore).toEqual({
      score: null,
      label: "not_scored_yet",
      reasons: ["Quality scoring will be added after planning rules exist."],
    });
    expect(result.technicalDetails).toEqual({
      engineVersion: 1,
      selectedTimeWindow: {
        currentDateTime: "2026-06-30T09:00:00.000Z",
        desiredBakeDateTime: "2026-07-01T21:00:00.000Z",
      },
      availableFermentationHours: 36,
      assumptions: [
        "Planning Engine foundation only.",
        "No fermentation rules, flour recommendations or yeast calculations are implemented yet.",
        "Ingredient gram calculations remain owned by calculateDoughIngredients.",
        "availableFermentationHours is calculated from desiredBakeDateTime minus currentDateTime.",
      ],
      sourceConfidence: {
        fermentation: "placeholder",
        flour: "placeholder",
        yeast: "placeholder",
        schedule: "placeholder",
      },
      temperatureAssumptions: {
        roomTemperature: 22,
        fridgeTemperature: 4,
        note: "Temperatures are captured for future planning rules only.",
      },
      flourAssumptions: {
        flourSelection: { type: "known_flour_id", flourId: "caputo-pizzeria" },
        category: "unknown",
        note: "Flour category recommendation is not implemented yet.",
      },
      yeastAssumptions: {
        yeastType: null,
        note: "Yeast model is not implemented yet.",
      },
    });
  });

  it("keeps existing dough calculator gram calculations untouched", () => {
    const ingredients = calculateDoughIngredients(baseSettings);

    expect(ingredients.total).toBeCloseTo(1606.8, 3);
    expect(ingredients.flour).toBeCloseTo(962.71, 2);
    expect(ingredients.water).toBeCloseTo(616.14, 2);
    expect(ingredients.salt).toBeCloseTo(26.96, 2);
    expect(ingredients.leavener).toBeCloseTo(0.99, 2);
  });

  it("keeps the Planning Engine isolated from existing production UI and recipe logic", () => {
    const calculator = source("lib/dough-calculator.ts");
    const homepageWorkspace = source("components/HomeCalculatorWorkspace.tsx");
    const sessionRecipe = source("lib/session-recipe.ts");
    const sessionTimeline = source("lib/pizza-session-timeline.ts");
    const plannerPage = source("app/plan/page.tsx");

    expect(calculator).not.toMatch(/planning-engine|planning-input|planning-result|planning-types/);
    expect(homepageWorkspace).not.toMatch(/planning-engine|planning-input|planning-result|planning-types/);
    expect(sessionRecipe).not.toMatch(/planning-engine|planning-input|planning-result|planning-types/);
    expect(sessionTimeline).not.toMatch(/planning-engine|planning-input|planning-result|planning-types/);
    expect(plannerPage).not.toMatch(/planning-engine|planning-input|planning-result|planning-types/);
  });
});
