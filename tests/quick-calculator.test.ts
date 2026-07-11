import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import {
  buildQuickRecipePlainText,
  calculateQuickDough,
  getQuickCalculatorPresentation,
  normalizeQuickCalculatorInput,
  quickCalculatorDefaults,
  quickCalculatorPresentations,
  quickFermentationToRecipePreset,
  quickCalculatorInputToRecipeSettings,
} from "@/lib/quick-calculator/quick-dough-calculator";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const quickBoundaryFiles = [
  "app/calculator/quick/page.tsx",
  "components/quick-calculator/QuickDoughCalculator.tsx",
  "lib/quick-calculator/quick-dough-calculator.ts",
];

const forbiddenBoundaryPatterns = [
  /getActivePizzaSession/,
  /setActivePizzaSession/,
  /updatePizzaSession/,
  /createAndSavePizzaSession/,
  /clearActivePizzaSession/,
  /pizza-session-storage/,
  /cloud-pizza-session/,
  /\/api\/pizza-sessions/,
  /buildPlanningResult/,
  /planning-engine/,
  /generatePizzaSessionTimeline/,
  /KitchenMode|getKitchenMode|completeKitchen/,
  /completeSession|Review completion/,
  /HomeCalculatorWorkspace/,
  /recipeParams|recipeUrl|settingsFromUrl/,
  /window\.localStorage|localStorage\./,
  /fetch\(/,
  /getRecipeWorkflowHandoff/,
];

describe("Quick Dough Calculator isolated core UI", () => {
  it("adds a dedicated public quick calculator route", () => {
    const page = source("app/calculator/quick/page.tsx");

    expect(page).toContain("QuickDoughCalculator");
    expect(page).toContain("Quick Dough Calculator");
    expect(page).not.toContain("redirect(");
    expect(page).not.toContain("HomeCalculatorWorkspace");
    expect(page).not.toContain("calculator=1");
    expect(page).not.toContain("calculator=2");
  });

  it("keeps the route separate from homepage Calculator v1 and Calculator v2 routing", () => {
    const homepage = source("app/page.tsx");
    const navigation = source("components/GlobalToolNavigation.tsx");

    expect(homepage).toContain('params.calculator === "2" ? "guided" : "entry"');
    expect(homepage).not.toContain("/calculator/quick");
    expect(navigation).not.toContain("/calculator/quick");
  });

  it("calculates through the existing pure dough calculator and no duplicate formula", () => {
    const quickModule = source("lib/quick-calculator/quick-dough-calculator.ts");
    const settings = quickCalculatorInputToRecipeSettings(quickCalculatorDefaults);
    const quickResult = calculateQuickDough(quickCalculatorDefaults);
    const canonicalResult = calculateDoughIngredients(settings);

    expect(quickModule).toContain('import { calculateDoughIngredients } from "@/lib/dough-calculator";');
    expect(quickModule).not.toContain("const cyPercent =");
    expect(quickModule).not.toContain("effectiveHours");
    expect(quickResult.ingredients).toEqual(canonicalResult);
  });

  it("maps Quick Calculator fermentation choices only to existing supported recipe presets", () => {
    expect(quickFermentationToRecipePreset({ fermentationDuration: "6h", fermentationEnvironment: "room" })).toBe("6h-room");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "12h", fermentationEnvironment: "room" })).toBe("12h-room");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "24h", fermentationEnvironment: "room" })).toBe("24h-room");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "24h", fermentationEnvironment: "cold" })).toBe("24h-cold");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "48h", fermentationEnvironment: "cold" })).toBe("48h-cold");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "48h", fermentationEnvironment: "room" })).toBe("24h-room");
  });

  it("keeps Quick Calculator state and calculation input local to the quick module", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");
    const quickModule = source("lib/quick-calculator/quick-dough-calculator.ts");

    expect(component).toContain("useState<QuickCalculatorInput>(quickCalculatorDefaults)");
    expect(component).toContain("calculateQuickDough(input)");
    expect(quickModule).toContain("QuickCalculatorInput");
    expect(quickModule).toContain("quickCalculatorInputToRecipeSettings");
  });

  it("normalizes invalid quick calculator values without writing persisted state", () => {
    const normalized = normalizeQuickCalculatorInput({
      pizzaCount: -5,
      doughBallWeightGrams: 50,
      hydrationPercent: 120,
      saltPercent: -1,
      yeastType: "idy",
      fermentationDuration: "24h",
      fermentationEnvironment: "cold",
      fermentationTemperatureCelsius: 99,
      wastePercent: 200,
    });

    expect(normalized).toMatchObject({
      pizzaCount: 1,
      doughBallWeightGrams: 100,
      hydrationPercent: 100,
      saltPercent: 0,
      fermentationTemperatureCelsius: 30,
      wastePercent: 25,
    });
  });

  it("derives baker percentages and plain-text copy without changing central calculation output", () => {
    const result = calculateQuickDough(quickCalculatorDefaults);
    const text = buildQuickRecipePlainText(result);

    expect(result.bakerPercentages).toMatchObject({
      flour: 100,
      water: quickCalculatorDefaults.hydrationPercent,
      salt: quickCalculatorDefaults.saltPercent,
    });
    expect(result.bakerPercentages.yeast).toBeCloseTo(result.ingredients.leavener / result.ingredients.flour * 100, 6);
    expect(text).toContain("Quick Dough Calculator");
    expect(text).toContain("Baker's percentages");
    expect(text).toContain("Flour:");
    expect(text).toContain("Water:");
    expect(text).toContain("Salt:");
    expect(text).toContain("Instant dry yeast:");
  });

  it("keeps the Quick Calculator isolated from session, cloud, planning and Calculator v2 dependencies", () => {
    for (const file of quickBoundaryFiles) {
      const text = source(file);
      for (const pattern of forbiddenBoundaryPatterns) {
        expect(text, `${file} must not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("does not create workflow handoff actions or session navigation", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).not.toContain("/session/");
    expect(component).not.toContain("Timeline");
    expect(component).not.toContain("Kitchen Mode");
    expect(component).not.toContain("Review");
    expect(component).not.toContain("Shopping");
    expect(component).not.toContain("Account");
    expect(component).not.toContain("Save to");
    expect(component).not.toContain("Continue to");
  });

  it("builds the core PizzApp-style UI for entering values and viewing ingredient results", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("Quick Dough Calculator");
    expect(component).toContain("Number of pizzas");
    expect(component).toContain("Dough-ball weight");
    expect(component).toContain("Hydration");
    expect(component).toContain("Salt");
    expect(component).toContain("Extra dough");
    expect(component).toContain("Yeast type");
    expect(component).toContain("Fermentation time");
    expect(component).toContain("Fermentation");
    expect(component).toContain("Fermentation temperature");
    expect(component).toContain("Ingredient amounts");
    expect(component).toContain("Baker’s percentages");
    expect(component).toContain("Copy recipe");
    expect(component).toContain("Reset calculator");
    expect(component).not.toContain("Save recipe");
    expect(component).not.toContain("Start Pizza Session");
  });

  it("keeps reset and copy actions local to the Quick Calculator component", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("const resetCalculator = () =>");
    expect(component).toContain("setInput(quickCalculatorDefaults)");
    expect(component).toContain("navigator.clipboard.writeText(result.summaryText)");
    expect(component).not.toContain("storeSavedRecipes");
    expect(component).not.toContain("addLocalBakeResult");
  });

  it("uses accessible controls and live result semantics without introducing a new dependency", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");
    const packageJson = source("package.json");

    expect(component).toContain("aria-pressed={selected}");
    expect(component).toContain("aria-live=\"polite\"");
    expect(component).toContain("aria-label={`Decrease ${label.toLowerCase()}`}");
    expect(component).toContain("aria-label={`Increase ${label.toLowerCase()}`}");
    expect(component).toContain("focus-visible:ring");
    expect(packageJson).not.toMatch(/radix|headlessui|react-hook-form|zod/i);
  });

  it("reuses the existing experience-level system for the three Quick Calculator presentations", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(Object.keys(quickCalculatorPresentations)).toEqual(["beginner", "enthusiast", "pizza_nerd"]);
    expect(getQuickCalculatorPresentation("beginner").badge).toBe("Beginner");
    expect(getQuickCalculatorPresentation("enthusiast").badge).toBe("Enthusiast");
    expect(getQuickCalculatorPresentation("pizza_nerd").badge).toBe("Pizza Nerd");
    expect(component).toContain("ExperienceLevelSelector");
    expect(component).toContain("readExperienceLevelPreference");
    expect(component).toContain("GuidanceModeBadge");
    expect(component).not.toContain("Beginner | Enthusiast | Pizza Nerd");
  });

  it("keeps Beginner simpler while preserving access to the same effective inputs", () => {
    const beginner = getQuickCalculatorPresentation("beginner");
    const enthusiast = getQuickCalculatorPresentation("enthusiast");
    const nerd = getQuickCalculatorPresentation("pizza_nerd");
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(beginner.visibleGroups).toEqual(["batch", "fermentation"]);
    expect(beginner.collapsedGroups).toContain("formula");
    expect(beginner.collapsedGroups).toContain("advanced");
    expect(enthusiast.visibleGroups).toContain("formula");
    expect(enthusiast.collapsedGroups).toContain("advanced");
    expect(nerd.visibleGroups).toEqual(["batch", "formula", "fermentation", "advanced"]);
    expect(nerd.collapsedGroups).toEqual([]);
    expect(component).toContain("OptionalControlGroup");
    expect(component).toContain("Formula details");
    expect(component).toContain("Yeast and temperature details");
  });

  it("does not let guidance mode change ingredient calculations for the same input", () => {
    const input = {
      ...quickCalculatorDefaults,
      pizzaCount: 6,
      doughBallWeightGrams: 270,
      hydrationPercent: 66,
      saltPercent: 2.6,
      fermentationDuration: "48h" as const,
      fermentationEnvironment: "cold" as const,
      fermentationTemperatureCelsius: 4,
    };

    const baseline = calculateQuickDough(input);
    for (const level of ["beginner", "enthusiast", "pizza_nerd"] as const) {
      expect(getQuickCalculatorPresentation(level).level).toBe(level);
      expect(calculateQuickDough(input).ingredients).toEqual(baseline.ingredients);
      expect(calculateQuickDough(input).settings).toEqual(baseline.settings);
    }
  });

  it("varies only result detail and explanations by level", () => {
    const beginner = getQuickCalculatorPresentation("beginner");
    const enthusiast = getQuickCalculatorPresentation("enthusiast");
    const nerd = getQuickCalculatorPresentation("pizza_nerd");
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(beginner.resultDetail).toBe("simple");
    expect(beginner.showTechnicalResult).toBe(false);
    expect(enthusiast.resultDetail).toBe("guided");
    expect(enthusiast.showTechnicalResult).toBe(true);
    expect(nerd.resultDetail).toBe("technical");
    expect(nerd.showTechnicalResult).toBe(true);
    expect(component).toContain('presentation.resultDetail !== "simple"');
    expect(component).toContain('presentation.resultDetail === "technical"');
    expect(component).toContain("Same input values produce the same ingredient output");
  });
});
