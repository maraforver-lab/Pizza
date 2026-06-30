import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import type { Fermentation, RecipeSettings, YeastType } from "@/lib/saved-recipes";
import { baseSettings, expectFiniteIngredients, expectIngredientTotal } from "./helpers";

const commercialYeastTypes = ["cy", "ady", "idy"] as const;
const supportedFermentations = ["6h-room", "12h-room", "24h-room", "24h-cold", "48h-cold"] as const satisfies Fermentation[];

const expectBakerPercentages = (settings: RecipeSettings) => {
  const result = calculateDoughIngredients(settings);

  expect(result.water / result.flour).toBeCloseTo(settings.hydration / 100, 6);
  expect(result.salt / result.flour).toBeCloseTo(settings.salt / 100, 6);
  expect(result.leavener / result.flour).toBeGreaterThan(0);
  expectIngredientTotal(result);
};

describe("calculateDoughIngredients", () => {
  it("keeps the current reference recipe baseline stable", () => {
    const result = calculateDoughIngredients(baseSettings);

    expect(result.total).toBeCloseTo(1606.8, 3);
    expect(result.flour).toBeCloseTo(962.71, 2);
    expect(result.water).toBeCloseTo(616.14, 2);
    expect(result.salt).toBeCloseTo(26.96, 2);
    expect(result.leavener).toBeCloseTo(0.99, 2);
    expectIngredientTotal(result);
  });

  it("calculates stable commercial yeast baselines for CY, ADY and IDY", () => {
    const expected: Record<Extract<YeastType, "cy" | "ady" | "idy">, number> = {
      cy: 2.40,
      ady: 1.25,
      idy: 0.99,
    };

    for (const yeastType of commercialYeastTypes) {
      const result = calculateDoughIngredients({ ...baseSettings, yeastType });
      expectFiniteIngredients(result);
      expectIngredientTotal(result);
      expect(result.leavener).toBeCloseTo(expected[yeastType], 2);
    }
  });

  it("keeps commercial yeast conversion ratios stable relative to fresh yeast", () => {
    const cy = calculateDoughIngredients({ ...baseSettings, yeastType: "cy" });
    const ady = calculateDoughIngredients({ ...baseSettings, yeastType: "ady" });
    const idy = calculateDoughIngredients({ ...baseSettings, yeastType: "idy" });

    expect((ady.leavener / ady.flour) / (cy.leavener / cy.flour)).toBeCloseTo(0.52, 6);
    expect((idy.leavener / idy.flour) / (cy.leavener / cy.flour)).toBeCloseTo(0.414, 6);
  });

  it("uses less commercial yeast as fermentation time increases under the current model", () => {
    const sixHour = calculateDoughIngredients({
      ...baseSettings,
      yeastType: "idy",
      fermentation: "6h-room",
      temperature: 22,
    });
    const twelveHour = calculateDoughIngredients({
      ...baseSettings,
      yeastType: "idy",
      fermentation: "12h-room",
      temperature: 22,
    });
    const twentyFourHour = calculateDoughIngredients({
      ...baseSettings,
      yeastType: "idy",
      fermentation: "24h-room",
      temperature: 22,
    });

    expect(sixHour.leavener).toBeGreaterThan(twelveHour.leavener);
    expect(twelveHour.leavener).toBeGreaterThan(twentyFourHour.leavener);
    expectFiniteIngredients(sixHour);
    expectFiniteIngredients(twelveHour);
    expectFiniteIngredients(twentyFourHour);
  });

  it("uses more yeast at lower effective temperature and less yeast at higher effective temperature", () => {
    const cold = calculateDoughIngredients({ ...baseSettings, yeastType: "idy", temperature: 0 });
    const baseline = calculateDoughIngredients({ ...baseSettings, yeastType: "idy", temperature: 4 });
    const warm = calculateDoughIngredients({ ...baseSettings, yeastType: "idy", temperature: 30 });

    expect(cold.leavener).toBeGreaterThan(baseline.leavener);
    expect(baseline.leavener).toBeGreaterThan(warm.leavener);
    expect(cold.leavener).toBeCloseTo(1.31, 2);
    expect(warm.leavener).toBeCloseTo(0.16, 2);
  });

  it("applies waste percentage to total dough before splitting ingredients", () => {
    const withoutWaste = calculateDoughIngredients({ ...baseSettings, waste: 0 });
    const withWaste = calculateDoughIngredients({ ...baseSettings, waste: 10 });

    expect(withoutWaste.total).toBeCloseTo(baseSettings.pizzas * baseSettings.ballWeight, 6);
    expect(withWaste.total).toBeCloseTo(baseSettings.pizzas * baseSettings.ballWeight * 1.1, 6);
    expect(withWaste.total).toBeGreaterThan(withoutWaste.total);
    expectIngredientTotal(withoutWaste);
    expectIngredientTotal(withWaste);
  });

  it("applies hydration, salt and commercial yeast as baker percentages of flour weight", () => {
    for (const yeastType of commercialYeastTypes) {
      expectBakerPercentages({ ...baseSettings, yeastType });
    }
  });

  it("keeps dough sizing linear for pizza count and dough ball weight", () => {
    const oneSmallPizza = calculateDoughIngredients({
      ...baseSettings,
      pizzas: 1,
      ballWeight: 180,
      waste: 0,
    });
    const manyLargePizzas = calculateDoughIngredients({
      ...baseSettings,
      pizzas: 24,
      ballWeight: 350,
      waste: 0,
    });

    expect(oneSmallPizza.total).toBeCloseTo(180, 6);
    expect(manyLargePizzas.total).toBeCloseTo(8400, 6);
    expect(manyLargePizzas.total / oneSmallPizza.total).toBeCloseTo((24 * 350) / 180, 6);
    expectIngredientTotal(oneSmallPizza);
    expectIngredientTotal(manyLargePizzas);
  });

  it("documents low and high hydration and salt boundary behavior", () => {
    const low = calculateDoughIngredients({
      ...baseSettings,
      hydration: 40,
      salt: 0,
    });
    const high = calculateDoughIngredients({
      ...baseSettings,
      hydration: 100,
      salt: 10,
    });

    expect(low.water / low.flour).toBeCloseTo(0.4, 6);
    expect(low.salt).toBeCloseTo(0, 6);
    expect(high.water / high.flour).toBeCloseTo(1, 6);
    expect(high.salt / high.flour).toBeCloseTo(0.1, 6);
    expectIngredientTotal(low);
    expectIngredientTotal(high);
  });

  it("handles every supported fermentation preset with finite commercial yeast values", () => {
    const results = supportedFermentations.map((fermentation) => ({
      fermentation,
      result: calculateDoughIngredients({
        ...baseSettings,
        yeastType: "idy",
        fermentation,
        temperature: fermentation.endsWith("cold") ? 4 : 22,
      }),
    }));

    for (const { result } of results) {
      expectFiniteIngredients(result);
      expectIngredientTotal(result);
      expect(result.leavener).toBeGreaterThan(0);
    }
    expect(results.find((item) => item.fermentation === "6h-room")?.result.leavener)
      .toBeGreaterThan(results.find((item) => item.fermentation === "48h-cold")?.result.leavener ?? 0);
  });

  it("keeps sourdough starter totals consistent for stiff and liquid starters", () => {
    for (const yeastType of ["ssd", "lsd"] as const) {
      const result = calculateDoughIngredients({ ...baseSettings, yeastType });

      expectFiniteIngredients(result);
      expectIngredientTotal(result);
      expect(result.leavener).toBeGreaterThan(0);
    }
  });

  it("keeps exact sourdough starter baselines stable for SSD and LSD", () => {
    const stiff = calculateDoughIngredients({ ...baseSettings, yeastType: "ssd" });
    const liquid = calculateDoughIngredients({ ...baseSettings, yeastType: "lsd" });

    expect(stiff.total).toBeCloseTo(1606.8, 3);
    expect(stiff.flour).toBeCloseTo(840.31, 2);
    expect(stiff.water).toBeCloseTo(555.02, 2);
    expect(stiff.salt).toBeCloseTo(26.97, 2);
    expect(stiff.leavener).toBeCloseTo(184.49, 2);
    expect(liquid.total).toBeCloseTo(1606.8, 3);
    expect(liquid.flour).toBeCloseTo(892.95, 2);
    expect(liquid.water).toBeCloseTo(546.16, 2);
    expect(liquid.salt).toBeCloseTo(26.97, 2);
    expect(liquid.leavener).toBeCloseTo(140.72, 2);
    expectIngredientTotal(stiff);
    expectIngredientTotal(liquid);
  });

  it("preserves baker percentage hydration when starter flour and water are included", () => {
    const starterHydrationByType = { ssd: 0.5, lsd: 1 } as const;

    for (const yeastType of ["ssd", "lsd"] as const) {
      const result = calculateDoughIngredients({ ...baseSettings, yeastType });
      const starterFlour = result.leavener / (1 + starterHydrationByType[yeastType]);
      const starterWater = result.leavener - starterFlour;
      const totalFlour = result.flour + starterFlour;
      const totalWater = result.water + starterWater;

      expect(totalWater / totalFlour).toBeCloseTo(baseSettings.hydration / 100, 6);
    }
  });

  it("handles URL boundary-style minimum and maximum settings with finite totals", () => {
    const minimum = calculateDoughIngredients({
      ...baseSettings,
      pizzas: 1,
      ballWeight: 100,
      waste: 0,
      hydration: 40,
      salt: 0,
      fermentation: "6h-room",
      temperature: 0,
    });
    const maximum = calculateDoughIngredients({
      ...baseSettings,
      pizzas: 50,
      ballWeight: 1000,
      waste: 25,
      hydration: 100,
      salt: 10,
      fermentation: "48h-cold",
      temperature: 30,
    });

    expectFiniteIngredients(minimum);
    expectIngredientTotal(minimum);
    expectFiniteIngredients(maximum);
    expectIngredientTotal(maximum);
    expect(minimum.total).toBeCloseTo(100, 6);
    expect(maximum.total).toBeCloseTo(62500, 6);
  });
});
