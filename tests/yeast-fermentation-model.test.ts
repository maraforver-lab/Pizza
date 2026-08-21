import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { calculateQuickDough, quickCalculatorDefaults } from "@/lib/quick-calculator/quick-dough-calculator";
import { calculateContinuousYeastRecommendation } from "@/lib/continuous-yeast-model";
import {
  calculateCanonicalYeastRequirement,
  recommendedFermentationProcessForMinutes,
  type CanonicalFermentationProcess,
  type CanonicalYeastType,
} from "@/lib/yeast-fermentation-model";
import type { RecipeSettings, YeastType } from "@/lib/saved-recipes";

const flourGrams = 963;
const hydrationPercent = 64;
const saltPercent = 2.8;

function canonical({
  minutes,
  temperatureC,
  process,
  yeastType,
  flour = flourGrams,
  hydration = hydrationPercent,
  salt = saltPercent,
}: {
  minutes: number;
  temperatureC: number;
  process: CanonicalFermentationProcess;
  yeastType: CanonicalYeastType;
  flour?: number;
  hydration?: number;
  salt?: number;
}) {
  return calculateCanonicalYeastRequirement({
    flourGrams: flour,
    hydrationPercent: hydration,
    saltPercent: salt,
    fermentationMinutes: minutes,
    fermentationTemperatureC: temperatureC,
    fermentationProcess: process,
    yeastType,
  });
}

function settings(overrides: Partial<RecipeSettings> = {}): RecipeSettings {
  return {
    pizzas: 6,
    ballWeight: 260,
    waste: 3,
    hydration: hydrationPercent,
    salt: saltPercent,
    yeastType: "idy",
    fermentation: "24h-cold",
    temperature: 4,
    goal: "balanced",
    ovenType: "gas",
    flourId: "caputo-pizzeria",
    pizzaStyleId: "neapolitan",
    ...overrides,
  };
}

describe("canonical yeast fermentation model", () => {
  it("implements the approved 24h room reference at 22 C", () => {
    const result = canonical({
      minutes: 24 * 60,
      temperatureC: 22,
      process: "room",
      yeastType: "active_dry",
    });

    expect(result.status).toBe("ok");
    expect(result.freshYeastPercent).toBeCloseTo(0.054, 6);
    expect(result.yeastGrams).toBeCloseTo(0.208, 3);
    expect(result.yeastPercentOfFlour).toBeCloseTo(0.0216, 6);
  });

  it("implements the revised cold IDY fixtures at 4 C", () => {
    const fixtures = [
      { hours: 25, grams: 2.066, percent: 0.21451 },
      { hours: 48, grams: 1.156, percent: 0.12000 },
      { hours: 72, grams: 0.722, percent: 0.07500 },
    ];

    for (const fixture of fixtures) {
      const result = canonical({
        minutes: fixture.hours * 60,
        temperatureC: 4,
        process: "cold",
        yeastType: "instant_dry",
      });

      expect(result.status).toBe("ok");
      expect(result.yeastPercentOfFlour).toBeCloseTo(fixture.percent, 5);
      expect(result.yeastGrams).toBeCloseTo(fixture.grams, 3);
    }
  });

  it("calculates arbitrary minute examples without fixed interval rounding", () => {
    const twentySevenThirteen = canonical({
      minutes: 27 * 60 + 13,
      temperatureC: 4,
      process: "cold",
      yeastType: "instant_dry",
    });
    const twentySevenFifteen = canonical({
      minutes: 27 * 60 + 15,
      temperatureC: 4,
      process: "cold",
      yeastType: "instant_dry",
    });
    const thirtySevenFiftyTwo = canonical({
      minutes: 37 * 60 + 52,
      temperatureC: 4.3,
      process: "cold",
      yeastType: "instant_dry",
    });

    expect(twentySevenThirteen.status).toBe("ok");
    expect(thirtySevenFiftyTwo.status).toBe("ok");
    expect(twentySevenThirteen.yeastGrams).not.toBe(twentySevenFifteen.yeastGrams);
    expect(thirtySevenFiftyTwo.yeastGrams).toBeCloseTo(1.433, 2);
  });

  it("keeps room and cold duration monotonic within each process", () => {
    const room6 = canonical({ minutes: 6 * 60, temperatureC: 22, process: "room", yeastType: "instant_dry" });
    const room12 = canonical({ minutes: 12 * 60, temperatureC: 22, process: "room", yeastType: "instant_dry" });
    const room24 = canonical({ minutes: 24 * 60, temperatureC: 22, process: "room", yeastType: "instant_dry" });
    const cold25 = canonical({ minutes: 25 * 60, temperatureC: 4, process: "cold", yeastType: "instant_dry" });
    const cold48 = canonical({ minutes: 48 * 60, temperatureC: 4, process: "cold", yeastType: "instant_dry" });
    const cold72 = canonical({ minutes: 72 * 60, temperatureC: 4, process: "cold", yeastType: "instant_dry" });

    expect(room6.yeastGrams).toBeGreaterThan(room12.yeastGrams);
    expect(room12.yeastGrams).toBeGreaterThan(room24.yeastGrams);
    expect(cold25.yeastGrams).toBeGreaterThan(cold48.yeastGrams);
    expect(cold48.yeastGrams).toBeGreaterThan(cold72.yeastGrams);
  });

  it("keeps room and cold temperature monotonic within each process", () => {
    const coolRoom = canonical({ minutes: 12 * 60, temperatureC: 18, process: "room", yeastType: "instant_dry" });
    const normalRoom = canonical({ minutes: 12 * 60, temperatureC: 22, process: "room", yeastType: "instant_dry" });
    const warmRoom = canonical({ minutes: 12 * 60, temperatureC: 26, process: "room", yeastType: "instant_dry" });
    const colderFridge = canonical({ minutes: 48 * 60, temperatureC: 3, process: "cold", yeastType: "instant_dry" });
    const normalFridge = canonical({ minutes: 48 * 60, temperatureC: 4, process: "cold", yeastType: "instant_dry" });
    const warmerFridge = canonical({ minutes: 48 * 60, temperatureC: 6, process: "cold", yeastType: "instant_dry" });

    expect(coolRoom.yeastGrams).toBeGreaterThan(normalRoom.yeastGrams);
    expect(normalRoom.yeastGrams).toBeGreaterThan(warmRoom.yeastGrams);
    expect(colderFridge.yeastGrams).toBeGreaterThan(normalFridge.yeastGrams);
    expect(normalFridge.yeastGrams).toBeGreaterThan(warmerFridge.yeastGrams);
  });

  it("uses canonical fresh, IDY and ADY conversion factors", () => {
    const fresh = canonical({ minutes: 48 * 60, temperatureC: 4, process: "cold", yeastType: "fresh" });
    const idy = canonical({ minutes: 48 * 60, temperatureC: 4, process: "cold", yeastType: "instant_dry" });
    const ady = canonical({ minutes: 48 * 60, temperatureC: 4, process: "cold", yeastType: "active_dry" });

    expect(idy.yeastPercentOfFlour / fresh.yeastPercentOfFlour).toBeCloseTo(1 / 3, 8);
    expect(ady.yeastPercentOfFlour / fresh.yeastPercentOfFlour).toBeCloseTo(0.4, 8);
    expect(fresh.yeastGrams).toBeCloseTo(3.467, 3);
    expect(idy.yeastGrams).toBeCloseTo(1.156, 3);
    expect(ady.yeastGrams).toBeCloseTo(1.387, 3);
  });

  it("keeps the 24:00 room recommendation and 24:01 cold recommendation distinct", () => {
    expect(recommendedFermentationProcessForMinutes(24 * 60)).toBe("room");
    expect(recommendedFermentationProcessForMinutes(24 * 60 + 1)).toBe("cold");

    const roomBoundary = canonical({ minutes: 24 * 60, temperatureC: 22, process: "room", yeastType: "active_dry" });
    const coldBoundary = canonical({ minutes: 24 * 60 + 1, temperatureC: 4, process: "cold", yeastType: "active_dry" });

    expect(roomBoundary.yeastGrams).toBeCloseTo(0.208, 3);
    expect(coldBoundary.yeastGrams).toBeCloseTo(2.541, 3);
  });

  it("does not use hydration or salt as V1 yeast corrections", () => {
    const baseline = canonical({ minutes: 48 * 60, temperatureC: 4, process: "cold", yeastType: "instant_dry" });
    const changedHydrationAndSalt = canonical({
      minutes: 48 * 60,
      temperatureC: 4,
      process: "cold",
      yeastType: "instant_dry",
      hydration: 80,
      salt: 1.8,
    });

    expect(changedHydrationAndSalt.yeastPercentOfFlour).toBe(baseline.yeastPercentOfFlour);
    expect(changedHydrationAndSalt.yeastGrams).toBe(baseline.yeastGrams);
  });

  it("routes commercial recipe ingredients through the canonical model", () => {
    const result = calculateDoughIngredients(settings({
      yeastType: "idy",
      fermentation: "48h-cold",
      temperature: 4,
    }));
    const canonicalResult = canonical({
      minutes: 48 * 60,
      temperatureC: 4,
      process: "cold",
      yeastType: "instant_dry",
      flour: result.flour,
    });

    expect(result.leavener).toBeCloseTo(canonicalResult.yeastGrams, 6);
    expect(result.leavener / result.flour * 100).toBeCloseTo(0.12, 6);
  });

  it("keeps Dough Plan and Quick Calculator equivalent for identical canonical inputs", () => {
    const quick = calculateQuickDough({
      ...quickCalculatorDefaults,
      pizzaCount: 6,
      doughBallWeightGrams: 260,
      wastePercent: 3,
      hydrationPercent,
      saltPercent,
      yeastType: "idy" satisfies YeastType,
      fermentationDuration: "48h",
      fermentationEnvironment: "cold",
      fermentationTemperatureCelsius: 4,
    });
    const doughPlanEquivalent = calculateDoughIngredients(settings({
      pizzas: 6,
      ballWeight: 260,
      waste: 3,
      hydration: hydrationPercent,
      salt: saltPercent,
      yeastType: "idy",
      fermentation: "48h-cold",
      temperature: 4,
    }));

    expect(quick.ingredients).toEqual(doughPlanEquivalent);
    expect(quick.ingredients.leavener / quick.ingredients.flour * 100).toBeCloseTo(0.12, 6);
  });

  it("adapts Dough Plan continuous yeast to the same canonical engine", () => {
    const continuous = calculateContinuousYeastRecommendation({
      flourGrams,
      fermentationHours: 48,
      fermentationMode: "cold",
      temperatureC: 4,
      yeastType: "instant_dry_yeast",
    });
    const canonicalResult = canonical({
      minutes: 48 * 60,
      temperatureC: 4,
      process: "cold",
      yeastType: "instant_dry",
    });

    expect(continuous.status).toBe("ok");
    expect(continuous.yeastAmountGrams).toBeCloseTo(canonicalResult.yeastGrams, 3);
    expect(continuous.yeastPercentOfFlour).toBeCloseTo(canonicalResult.yeastPercentOfFlour, 5);
  });
});
