import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import type { YeastType } from "@/lib/saved-recipes";
import { baseSettings, expectFiniteIngredients, expectIngredientTotal } from "./helpers";

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

    for (const yeastType of ["cy", "ady", "idy"] as const) {
      const result = calculateDoughIngredients({ ...baseSettings, yeastType });
      expectFiniteIngredients(result);
      expectIngredientTotal(result);
      expect(result.leavener).toBeCloseTo(expected[yeastType], 2);
    }
  });

  it("keeps sourdough starter totals consistent for stiff and liquid starters", () => {
    for (const yeastType of ["ssd", "lsd"] as const) {
      const result = calculateDoughIngredients({ ...baseSettings, yeastType });

      expectFiniteIngredients(result);
      expectIngredientTotal(result);
      expect(result.leavener).toBeGreaterThan(0);
    }
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
