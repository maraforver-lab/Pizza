import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  calculatorControlGroups,
  getCalculatorDisclosureMode,
  hasAdvancedCalculatorValues,
} from "@/lib/calculator-progressive-disclosure";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import {
  DEFAULT_EXPERIENCE_LEVEL,
  EXPERIENCE_LEVEL_STORAGE_KEY,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import { recipeParams, settingsFromUrl } from "@/lib/recipe-url";
import { baseSettings, expectIngredientTotal } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("calculator progressive disclosure", () => {
  it("uses the existing experience-level system and default", () => {
    expect(DEFAULT_EXPERIENCE_LEVEL).toBe("beginner");
    expect(EXPERIENCE_LEVEL_STORAGE_KEY).toBe("doughtools.experienceLevel");
    expect(getCalculatorDisclosureMode("beginner").statusLabel).toBe("Guidance mode: Beginner");
    expect(getCalculatorDisclosureMode("enthusiast").statusLabel).toBe("Guidance mode: Enthusiast");
    expect(getCalculatorDisclosureMode("pizza_nerd").statusLabel).toBe("Guidance mode: Pizza Nerd");
  });

  it("defines essential, recommended and advanced calculator control groups from existing fields", () => {
    expect(calculatorControlGroups.map((group) => group.id)).toEqual(["essential", "recommended", "advanced"]);
    expect(calculatorControlGroups.find((group) => group.id === "essential")?.fields).toEqual([
      "pizza style",
      "fermentation time and environment",
      "pizza count",
      "oven type",
    ]);
    expect(calculatorControlGroups.find((group) => group.id === "recommended")?.fields).toContain("flour profile");
    expect(calculatorControlGroups.find((group) => group.id === "advanced")?.fields).toContain("hydration");
    expect(calculatorControlGroups.find((group) => group.id === "advanced")?.fields).toContain("leavening type");
  });

  it("keeps Beginner simple, Enthusiast practical and Pizza Nerd fully visible by default", () => {
    const beginner = getCalculatorDisclosureMode("beginner");
    const enthusiast = getCalculatorDisclosureMode("enthusiast");
    const nerd = getCalculatorDisclosureMode("pizza_nerd");

    expect(beginner.showRecommendedByDefault).toBe(false);
    expect(beginner.showAdvancedByDefault).toBe(false);
    expect(beginner.disclosureLabel).toBe("Show more settings");
    expect(beginner.nextStep).toContain("plan when to mix");

    expect(enthusiast.showRecommendedByDefault).toBe(true);
    expect(enthusiast.showAdvancedByDefault).toBe(false);
    expect(enthusiast.causeAndEffect.join(" ")).toContain("Hydration affects");

    expect(nerd.showRecommendedByDefault).toBe(true);
    expect(nerd.showAdvancedByDefault).toBe(true);
    expect(nerd.technicalNotes.join(" ")).toContain("Baker");
  });

  it("detects active advanced values without changing query parsing", () => {
    const recommended = { ballWeight: 260, hydration: 64, salt: 2.8, temperature: 4 };

    expect(hasAdvancedCalculatorValues({
      ballWeight: 260,
      waste: 3,
      hydration: 64,
      salt: 2.8,
      yeastType: "idy",
      temperature: 4,
      flourId: "caputo-pizzeria",
    }, recommended)).toBe(false);

    expect(hasAdvancedCalculatorValues({
      ballWeight: 270,
      waste: 3,
      hydration: 64,
      salt: 2.8,
      yeastType: "idy",
      temperature: 4,
      flourId: "caputo-pizzeria",
    }, recommended)).toBe(true);
  });

  it("keeps existing query parameter round-trips and calculation results unchanged", () => {
    const params = recipeParams(baseSettings);
    const parsed = settingsFromUrl(`?${params.toString()}`);
    const ingredients = calculateDoughIngredients(baseSettings);

    expect(parsed).toEqual(baseSettings);
    expect(ingredients.total).toBeCloseTo(1606.8, 3);
    expect(ingredients.flour).toBeCloseTo(962.71, 2);
    expect(ingredients.water).toBeCloseTo(616.14, 2);
    expect(ingredients.salt).toBeCloseTo(26.96, 2);
    expect(ingredients.leavener).toBeCloseTo(0.99, 2);
    expectIngredientTotal(ingredients);
  });

  it("wires the homepage to progressive disclosure without new routes or heavy dependencies", () => {
    const homepage = source("app/page.tsx");
    const workflow = source("lib/recipe-workflow.ts");
    const packageJson = source("package.json");

    expect(homepage).toContain("getCalculatorDisclosureMode(experienceLevel)");
    expect(homepage).toContain("advancedOpen");
    expect(homepage).toContain("recommendedOpen");
    expect(homepage).toContain("aria-expanded={advancedOpen}");
    expect(homepage).toContain("aria-controls=\"advanced-calculator-settings\"");
    expect(homepage).toContain("id=\"advanced-calculator-settings\"");
    expect(homepage).toContain("More settings are active in this recipe link.");
    expect(homepage).toContain("getRecipeWorkflowHandoff(experienceLevel, recipeQuery)");
    expect(homepage).toContain("recipeWorkflow.heading");
    expect(homepage).toContain("Workflow handoff");
    expect(homepage).toContain("Recipe context included");
    expect(workflow).toContain("Open Dough Doctor");
    expect(workflow).toContain("Calculate sauce");
    expect(workflow).toContain("Calculate toppings");
    expect(workflow).toContain("Start baking timer");
    expect(packageJson).not.toMatch(/lighthouse|webpack-bundle-analyzer|@next\/bundle-analyzer|radix|headlessui/i);
  });

  it("documents calculator progressive disclosure and Patch 25 performance constraints", () => {
    const docPath = join(process.cwd(), "docs", "calculator-progressive-disclosure.md");

    expect(existsSync(docPath)).toBe(true);

    const doc = source("docs/calculator-progressive-disclosure.md");

    for (const level of ["beginner", "enthusiast", "pizza_nerd"] satisfies ExperienceLevel[]) {
      expect(doc).toContain(level);
    }
    expect(doc).toContain("doughtools.experienceLevel");
    expect(doc).toContain("Query parameter preservation");
    expect(doc).toContain("Accessibility rules");
    expect(doc).toContain("Patch 25");
    expect(doc).toContain("does not change dough formulas");
  });

  it("preserves Start Here links and Patch 24 accessibility markers", () => {
    const startHere = source("lib/start-here.ts");
    const homepage = source("app/page.tsx");

    expect(startHere).toContain("startHerePathHref");
    expect(startHere).toContain("recipeParams(path.settings)");
    expect(homepage).toContain("focus-visible:ring");
    expect(homepage).toContain("aria-pressed");
  });
});
