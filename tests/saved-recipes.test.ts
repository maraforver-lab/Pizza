import { beforeEach, describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { loadSavedRecipes, newRecipeId, storeSavedRecipes, type SavedRecipe } from "@/lib/saved-recipes";
import currentEnglishFixture from "./fixtures/legacy-recipes/current-english.json";
import legacyFinnishFixture from "./fixtures/legacy-recipes/legacy-finnish-language.json";
import legacyMissingOptionalFixture from "./fixtures/legacy-recipes/legacy-missing-optionals.json";
import legacySwedishFixture from "./fixtures/legacy-recipes/legacy-swedish-language.json";
import legacyUnknownLanguageFixture from "./fixtures/legacy-recipes/legacy-unknown-language.json";
import legacyYeastFixture from "./fixtures/legacy-recipes/legacy-yeast-types.json";
import { baseSettings, MemoryStorage } from "./helpers";

const storageKey = "doughtools-saved-recipes-v1";

describe("saved recipes persistence compatibility", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: new MemoryStorage() },
      configurable: true,
    });
  });

  it("stores and loads current saved recipe objects without changing shape", () => {
    const recipe: SavedRecipe = {
      id: "recipe-current",
      name: "Regression pizza",
      createdAt: "2026-06-23T00:00:00.000Z",
      settings: baseSettings,
      ingredients: calculateDoughIngredients(baseSettings),
    };

    storeSavedRecipes([recipe]);

    expect(loadSavedRecipes()).toEqual([recipe]);
  });

  it("returns an empty list for malformed or non-array storage data", () => {
    window.localStorage.setItem(storageKey, "{broken");
    expect(loadSavedRecipes()).toEqual([]);

    window.localStorage.setItem(storageKey, JSON.stringify({ id: "not-array" }));
    expect(loadSavedRecipes()).toEqual([]);
  });

  it.each([
    ["current English fixture", currentEnglishFixture],
    ["legacy Finnish language fixture", legacyFinnishFixture],
    ["legacy Swedish language fixture", legacySwedishFixture],
    ["legacy unknown language fixture", legacyUnknownLanguageFixture],
    ["legacy missing optional fixture", legacyMissingOptionalFixture],
    ["legacy all yeast types fixture", legacyYeastFixture],
  ])("loads %s", (_name, fixture) => {
    window.localStorage.setItem(storageKey, JSON.stringify(fixture));

    const loaded = loadSavedRecipes();

    expect(loaded).toHaveLength(fixture.length);
    for (const recipe of loaded) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.name).toBeTruthy();
      expect(recipe.settings.pizzas).toBeGreaterThan(0);
      expect(Number.isFinite(recipe.ingredients.total)).toBe(true);
    }
  });

  it("generates non-empty recipe ids without requiring localStorage", () => {
    expect(newRecipeId()).toEqual(expect.any(String));
    expect(newRecipeId().length).toBeGreaterThan(0);
  });
});
