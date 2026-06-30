import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { buildPlanningResult, PLANNING_ENGINE_VERSION } from "@/lib/planning-engine";
import { calculateAvailableFermentationHours, type PlanningInput } from "@/lib/planning-input";
import { baseSettings } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const basePlanningInput: PlanningInput = {
  currentDateTime: new Date("2026-06-30T09:00:00.000Z"),
  desiredBakeDateTime: new Date("2026-07-01T21:00:00.000Z"),
  userLevel: "enthusiast",
  ovenType: "gas",
  roomTemperature: 22,
  fridgeTemperature: 4,
  flourSelection: "caputo-pizzeria",
  doughBallCount: 6,
  doughBallWeight: 260,
};

describe("Planning Engine foundation", () => {
  it("processes a PlanningInput and returns a PlanningResult", () => {
    const result = buildPlanningResult(basePlanningInput);

    expect(result.availableFermentationHours).toBe(36);
    expect(result.recommendedFermentationMode).toBe("not-recommended-yet");
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
      value: null,
      label: "not-scored-yet",
    });
    expect(result.technicalDetails.engineVersion).toBe(PLANNING_ENGINE_VERSION);
    expect(result.technicalDetails.notes.join(" ")).toContain("foundation only");
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
      code: "no-positive-fermentation-window",
      message: "The desired bake time does not leave a positive fermentation window.",
      severity: "warning",
    }]);
    expect(result.recommendedFermentationMode).toBe("not-recommended-yet");
    expect(result.recommendedYeast.amountGrams).toBeNull();
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
