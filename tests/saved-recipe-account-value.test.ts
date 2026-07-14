import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { recipeParams } from "@/lib/recipe-url";
import { recipeWorkflowQueryHref } from "@/lib/recipe-workflow";
import { loadSavedRecipes, storeSavedRecipes, type SavedRecipe } from "@/lib/saved-recipes";
import { baseSettings, MemoryStorage } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("saved recipe account value UX", () => {
  it("keeps saved recipe persistence on the existing localStorage key and shape", () => {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: new MemoryStorage() },
      configurable: true,
    });

    const savedRecipe: SavedRecipe = {
      id: "repeatable-recipe",
      name: "Repeatable pizza",
      createdAt: "2026-06-25T00:00:00.000Z",
      settings: baseSettings,
      ingredients: calculateDoughIngredients(baseSettings),
    };

    storeSavedRecipes([savedRecipe]);

    expect(window.localStorage.getItem("doughtools-saved-recipes-v1")).toBe(JSON.stringify([savedRecipe]));
    expect(loadSavedRecipes()).toEqual([savedRecipe]);
  });

  it("persists saved recipe deletion after a localStorage reread", () => {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: new MemoryStorage() },
      configurable: true,
    });

    const keepRecipe: SavedRecipe = {
      id: "recipe-to-keep",
      name: "Keep this recipe",
      createdAt: "2026-06-25T00:00:00.000Z",
      settings: baseSettings,
      ingredients: calculateDoughIngredients(baseSettings),
    };
    const deleteRecipe: SavedRecipe = {
      ...keepRecipe,
      id: "recipe-to-delete",
      name: "Delete this recipe",
    };

    storeSavedRecipes([deleteRecipe, keepRecipe]);
    const afterDelete = loadSavedRecipes().filter((recipe) => recipe.id !== deleteRecipe.id);
    storeSavedRecipes(afterDelete);

    const reread = loadSavedRecipes();
    const rawStorage = window.localStorage.getItem("doughtools-saved-recipes-v1");

    expect(reread).toEqual([keepRecipe]);
    expect(reread.some((recipe) => recipe.id === deleteRecipe.id)).toBe(false);
    expect(rawStorage).not.toContain(deleteRecipe.id);
  });

  it("uses existing recipe query helpers for saved recipe workflow actions", () => {
    const query = recipeParams(baseSettings).toString();

    expect(recipeWorkflowQueryHref("/plan", query)).toBe(`/plan?${query}`);
    expect(recipeWorkflowQueryHref("/sauce", query)).toBe(`/sauce?${query}`);
    expect(recipeWorkflowQueryHref("/toppings", query)).toBe(`/toppings?${query}`);
    expect(recipeWorkflowQueryHref("/timer", query)).toBe(`/timer?${query}`);
  });

  it("explains the value of saving recipes by experience level on the calculator", () => {
    const page = source("components/HomeCalculatorWorkspace.tsx");

    expect(page).toContain("Save the setup that worked");
    expect(page).toContain("Beginner: save the recipe you used");
    expect(page).toContain("Enthusiast: save repeatable setups");
    expect(page).toContain("Pizza Nerd: preserve the variables");
    expect(page).toContain("Saved locally in this browser");
  });

  it("exposes practical next actions on saved recipe cards without public sharing controls", () => {
    const page = source("components/HomeCalculatorWorkspace.tsx");

    expect(page).toContain("savedRecipeActions");
    expect(page).toContain('recipeWorkflowQueryHref("/plan", savedRecipeQuery)');
    expect(page).toContain('recipeWorkflowQueryHref("/sauce", savedRecipeQuery)');
    expect(page).toContain('recipeWorkflowQueryHref("/toppings", savedRecipeQuery)');
    expect(page).toContain('recipeWorkflowQueryHref("/timer", savedRecipeQuery)');
    expect(page).toContain('href: "/guide/pizza-troubleshooting"');
    expect(page).not.toContain('recipeWorkflowQueryHref("/journal", savedRecipeQuery)');
    expect(page).not.toContain('recipeWorkflowQueryHref("/doctor", savedRecipeQuery)');
    expect(page).not.toMatch(/publish saved recipe|copy public recipe link|upload recipe to account/i);
  });

  it("removes the public saved recipe account value promotion from the account page", () => {
    const account = source("app/account/page.tsx");

    expect(account).not.toContain("Saved recipe value");
    expect(account).not.toContain("Save recipes to make progress repeatable.");
    expect(account).not.toContain("remains local-first for recipes and bake notes");
    expect(account).not.toContain("does not upload saved recipes, local BakeResults or Journal photos to Supabase");
    expect(account).not.toMatch(/recipes sync to your account|cloud recipe sync is available|account-based recipe storage is active/i);
  });

  it("documents the local-only account value boundary", () => {
    const doc = source("docs/saved-recipe-account-value.md");
    const persistenceDoc = source("docs/persistence-baseline.md");

    expect(doc).toContain("doughtools-saved-recipes-v1");
    expect(doc).toContain("does not change the saved recipe data format");
    expect(doc).toContain("Saved recipes and local BakeResults are not uploaded to Supabase");
    expect(doc).toContain("account recipe sync");
    expect(persistenceDoc).toContain("Patch 29 improves the value copy and workflow links around saved recipes");
  });

  it("adds Patch 29 to the public changelog without unavailable feature claims", () => {
    const changelog = source("lib/changelog.ts");

    expect(changelog).toContain("Saved recipe and account value UX");
    expect(changelog).toContain("Patch 29 clarifies");
    expect(changelog).toContain("No formulas, account sync, storage format, tracking or indexing behavior changed");
    expect(changelog).not.toMatch(/cloud sync is available|share cards are available|indexing is enabled/i);
  });
});
