import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import {
  calculateQuickDough,
  normalizeQuickCalculatorInput,
  quickCalculatorDefaults,
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
];

describe("Quick Dough Calculator isolation foundation", () => {
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
      fermentation: "24h-cold",
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
  });

  it("keeps the foundation UI scoped to entering values and viewing ingredient results", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("Quick Dough Calculator");
    expect(component).toContain("Dough balls / pizzas");
    expect(component).toContain("Dough ball weight");
    expect(component).toContain("Hydration");
    expect(component).toContain("Salt");
    expect(component).toContain("Leavening type");
    expect(component).toContain("Fermentation");
    expect(component).toContain("Ingredient amounts");
    expect(component).not.toContain("Save recipe");
    expect(component).not.toContain("Start Pizza Session");
  });
});
