import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { getRecipeWorkflowHandoff, recipeWorkflowQueryHref } from "@/lib/recipe-workflow";
import { recipeParams, settingsFromUrl } from "@/lib/recipe-url";
import { baseSettings, expectIngredientTotal } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("core recipe workflow handoff", () => {
  it("builds query-preserving handoff links for supported tools", () => {
    const query = recipeParams(baseSettings).toString();
    const handoff = getRecipeWorkflowHandoff("beginner", query);

    expect(recipeWorkflowQueryHref("/plan", query)).toBe(`/plan?${query}`);
    expect(handoff.heading).toBe("Next steps for this recipe");
    expect(handoff.primaryActionId).toBe("planner");

    for (const id of ["planner", "sauce", "toppings", "timer", "doctor"] as const) {
      const action = handoff.actions.find((item) => item.id === id);

      expect(action).toBeDefined();
      expect(action?.href).toContain(`?${query}`);
      expect(action?.preservesQuery).toBe(true);
      expect(action?.href).not.toContain("undefined");
      expect(settingsFromUrl(action?.href?.split("?")[1] ?? "")).toMatchObject(baseSettings);
    }
  });

  it("keeps Save as a local/general handoff without inventing query support", () => {
    const handoff = getRecipeWorkflowHandoff("pizza_nerd", recipeParams(baseSettings).toString());
    const save = handoff.actions.find((item) => item.id === "save");

    expect(save).toMatchObject({ label: "Save this recipe", preservesQuery: false });
    expect(save?.href).toBeUndefined();
    expect(handoff.actions.some((item) => item.href === "/journal")).toBe(false);
  });

  it("adapts next-step copy for Beginner, Enthusiast and Pizza Nerd", () => {
    const query = recipeParams(baseSettings).toString();
    const beginner = getRecipeWorkflowHandoff("beginner", query);
    const enthusiast = getRecipeWorkflowHandoff("enthusiast", query);
    const nerd = getRecipeWorkflowHandoff("pizza_nerd", query);

    expect(beginner.intro).toContain("Next, plan when to mix");
    expect(beginner.detail).toContain("planner first");
    expect(enthusiast.intro).toContain("timing controls fermentation");
    expect(enthusiast.detail).toContain("sauce, toppings and oven timing");
    expect(nerd.intro).toContain("recipe context");
    expect(nerd.detail).toContain("receive the current recipe query");
  });

  it("wires the calculator workspace recipe result to a semantic next-step section with accessible link text", () => {
    const calculatorWorkspace = source("components/HomeCalculatorWorkspace.tsx");

    expect(calculatorWorkspace).toContain("getRecipeWorkflowHandoff(experienceLevel, recipeQuery)");
    expect(calculatorWorkspace).toContain("aria-labelledby=\"recipe-workflow-heading\"");
    expect(calculatorWorkspace).toContain("id=\"recipe-workflow-heading\"");
    expect(calculatorWorkspace).toContain("recipeWorkflow.actions.map");
    expect(calculatorWorkspace).toContain("Recipe context included");
    expect(calculatorWorkspace).toContain("Save recipe");
    expect(calculatorWorkspace).toContain("Save this bake");
    expect(calculatorWorkspace).toContain("focus-visible:ring");
  });

  it("preserves Start Here, calculations and route behavior while adding workflow documentation", () => {
    const docPath = join(process.cwd(), "docs", "core-recipe-workflow.md");
    const ingredients = calculateDoughIngredients(baseSettings);

    expect(existsSync(docPath)).toBe(true);
    expect(source("lib/start-here.ts")).toContain("recipeParams(path.settings)");
    expect(source("docs/core-recipe-workflow.md")).toContain("Calculator / recipe result");
    expect(source("docs/core-recipe-workflow.md")).toContain("/plan");
    expect(source("docs/core-recipe-workflow.md")).toContain("/sauce");
    expect(source("docs/core-recipe-workflow.md")).toContain("/toppings");
    expect(source("docs/core-recipe-workflow.md")).toContain("/timer");
    expect(source("docs/core-recipe-workflow.md")).toContain("/doctor");
    expect(source("docs/core-recipe-workflow.md")).toContain("does not change");

    expect(ingredients.total).toBeCloseTo(1606.8, 3);
    expect(ingredients.flour).toBeCloseTo(962.71, 2);
    expect(ingredients.water).toBeCloseTo(616.14, 2);
    expect(ingredients.salt).toBeCloseTo(26.96, 2);
    expect(ingredients.leavener).toBeCloseTo(0.99, 2);
    expectIngredientTotal(ingredients);
  });
});

