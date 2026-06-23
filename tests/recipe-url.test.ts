import { describe, expect, it } from "vitest";
import { recipeParams, settingsFromUrl } from "@/lib/recipe-url";
import { baseSettings } from "./helpers";

describe("recipe URL state", () => {
  it("serializes and parses all active recipe settings", () => {
    const params = recipeParams(baseSettings);
    const parsed = settingsFromUrl(`?${params.toString()}`);

    expect(parsed).toEqual(baseSettings);
  });

  it("keeps optional pizzaStyle absent when it is not set", () => {
    const { pizzaStyleId: _pizzaStyleId, ...settings } = baseSettings;
    const params = recipeParams(settings);

    expect(params.has("pizzaStyle")).toBe(false);
    expect(settingsFromUrl(`?${params.toString()}`).pizzaStyleId).toBeUndefined();
  });

  it("ignores legacy language query values and unknown parameters safely", () => {
    const parsed = settingsFromUrl("?balls=4&lang=fi&toppingsLang=sv&theme=old&yeastType=idy");

    expect(parsed.pizzas).toBe(4);
    expect(parsed.yeastType).toBe("idy");
    expect(Object.keys(parsed)).not.toContain("lang");
    expect(Object.keys(parsed)).not.toContain("toppingsLang");
  });

  it("rejects invalid numbers and invalid option values without throwing", () => {
    const parsed = settingsFromUrl("?balls=0&ballWeight=5000&hydration=abc&salt=-1&yeastType=bad&fermentation=forever&oven=wood");

    expect(parsed.pizzas).toBeUndefined();
    expect(parsed.ballWeight).toBeUndefined();
    expect(parsed.hydration).toBeUndefined();
    expect(parsed.salt).toBeUndefined();
    expect(parsed.yeastType).toBeUndefined();
    expect(parsed.fermentation).toBeUndefined();
    expect(parsed.ovenType).toBeUndefined();
  });

  it("accepts all supported yeast types from shared links", () => {
    for (const yeastType of ["cy", "ady", "idy", "ssd", "lsd"] as const) {
      expect(settingsFromUrl(`?yeastType=${yeastType}`).yeastType).toBe(yeastType);
    }
  });
});
