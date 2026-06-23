import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { flourById, flourIds, flourProfiles } from "@/lib/flours";
import { defaultPizzaStyleId, pizzaStyleById, pizzaStyles } from "@/lib/pizza-styles";
import { expectFiniteIngredients, expectIngredientTotal } from "./helpers";

describe("pizza style and flour data", () => {
  it("keeps flour ids unique and internally consistent", () => {
    expect(new Set(flourIds).size).toBe(flourIds.length);
    expect(flourIds).toEqual(flourProfiles.map((flour) => flour.id));

    for (const flour of flourProfiles) {
      expect(flour.hydration[0]).toBeLessThanOrEqual(flour.recommendedHydration);
      expect(flour.hydration[1]).toBeGreaterThanOrEqual(flour.recommendedHydration);
      expect(flour.fermentationHours[0]).toBeLessThanOrEqual(flour.fermentationHours[1]);
      expect(flour.styles.length).toBeGreaterThan(0);
      expect(flourById(flour.id)).toBe(flour);
    }
  });

  it("keeps pizza style ids unique and default style lookups valid", () => {
    const ids = pizzaStyles.map((style) => style.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const goal of ["balanced", "airy", "crispy", "pan"] as const) {
      expect(ids).toContain(defaultPizzaStyleId(goal));
      expect(pizzaStyleById(undefined, goal).settings.goal).toBe(goal);
    }
  });

  it("keeps every pizza style recipe calculable", () => {
    for (const style of pizzaStyles) {
      const result = calculateDoughIngredients(style.settings);

      expectFiniteIngredients(result);
      expectIngredientTotal(result);
      expect(flourIds).toContain(style.settings.flourId);
    }
  });
});
