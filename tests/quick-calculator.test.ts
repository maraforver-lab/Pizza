import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import {
  calculateQuickAdvancedDoughTools,
  calculateQuickReverseFermentation,
  calculateWaterTemperature,
  convertQuickYeast,
  quickAdvancedDoughToolsDefaults,
} from "@/lib/quick-calculator/advanced-dough-tools";
import {
  applyQuickPizzaStylePreset,
  calculateQuickPizzaSizing,
  derivePanDoughWeightGrams,
  deriveRoundDoughWeightGrams,
  quickPizzaStylePresetById,
  quickPizzaStylePresets,
} from "@/lib/quick-calculator/pizza-sizing";
import {
  applyQuickPrefermentPreset,
  calculateQuickPreferment,
  quickPrefermentPresetById,
  quickPrefermentPresets,
} from "@/lib/quick-calculator/quick-preferments";
import {
  buildQuickCalculatorShareUrl,
  createQuickCalculatorSavedRecipe,
  deleteQuickCalculatorSavedRecipe,
  duplicateQuickCalculatorSavedRecipe,
  loadQuickCalculatorSavedRecipes,
  QUICK_CALCULATOR_MAX_SAVED_RECIPES,
  quickCalculatorInputFromSearch,
  quickCalculatorInputToShareParams,
  QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY,
  QUICK_CALCULATOR_SHARE_PARAM,
  renameQuickCalculatorSavedRecipe,
  saveQuickCalculatorRecipe,
  storeQuickCalculatorSavedRecipes,
} from "@/lib/quick-calculator/quick-calculator-storage";
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
import { MemoryStorage } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const quickBoundaryFiles = [
  "app/calculator/quick/page.tsx",
  "components/quick-calculator/QuickDoughCalculator.tsx",
  "lib/quick-calculator/quick-dough-calculator.ts",
  "lib/quick-calculator/quick-calculator-storage.ts",
  "lib/quick-calculator/advanced-dough-tools.ts",
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
  /fetch\(/,
  /getRecipeWorkflowHandoff/,
  /doughtools-saved-recipes-v1/,
  /doughtools\.pizza/,
  /doughtools-active-plan-v1/,
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
    const homepageRouting = homepage.split("<SiteFooter />")[0];

    expect(homepageRouting).toContain('params.calculator === "2" ? "guided" : "entry"');
    expect(homepageRouting).not.toContain("/calculator/quick");
    expect(navigation).toContain('/calculator/quick');
    expect(navigation).not.toContain('HomeCalculatorWorkspace');
    expect(navigation).not.toContain('calculator=2');
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
    expect(text).toContain("Preferment");
    expect(text).toContain("Method: Direct dough");
    expect(text).toContain("Advanced dough tools");
    expect(text).toContain("Target dough temperature");
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
    expect(component).toContain("Advanced dough tools");
    expect(component).toContain("Target dough temperature");
    expect(component).toContain("Water temperature");
    expect(component).toContain("Yeast converter");
    expect(component).toContain("Custom ingredients");
    expect(component).toContain("Flour blend");
    expect(component).toContain("Ingredient amounts");
    expect(component).toContain("Baker’s percentages");
    expect(component).toContain("Copy recipe");
    expect(component).toContain("Reset calculator");
    expect(component).toContain("Working assumptions");
    expect(component).not.toContain("Start Pizza Session");
  });

  it("keeps reset and copy actions local to the Quick Calculator component", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("const resetCalculator = () =>");
    expect(component).toContain("setInput(quickCalculatorDefaults)");
    expect(component).toContain("navigator.clipboard.writeText(result.summaryText)");
    expect(component).toContain("Save recipe");
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

  it("uses flexible numeric controls so values, units and steppers do not crowd each other", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("data-quick-number-control");
    expect(component).toContain("grid-cols-[3rem_minmax(5.75rem,1fr)_auto_3rem]");
    expect(component).toContain("data-quick-number-unit");
    expect(component).toContain("whitespace-nowrap");
    expect(component).toContain("tabular-nums");
    expect(component).toContain("aria-hidden=\"true\"");
    expect(component).toContain("aria-label={`Decrease ${label.toLowerCase()}`}");
    expect(component).toContain("aria-label={`Increase ${label.toLowerCase()}`}");
    expect(component).not.toContain("grid-cols-[2.75rem_minmax(0,1fr)_2.75rem]");
    expect(component).not.toContain("pr-11");
    expect(component).not.toContain("absolute right-3");
    expect(component).not.toMatch(/\bw-(?:12|14|16|20|24)\b/);
  });

  it("keeps tight numeric-control groups responsive instead of forcing three narrow mobile columns", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("grid gap-4 md:grid-cols-2 lg:grid-cols-3");
    expect(component).toContain("grid gap-3 sm:grid-cols-2");
    expect(component).not.toContain("grid gap-4 sm:grid-cols-3");
    expect(component).not.toContain("grid gap-3 sm:grid-cols-3");
    expect(component).not.toContain("<table");
  });

  it("keeps three-digit and decimal Quick Calculator values calculable after the responsive control update", () => {
    const result = calculateQuickDough({
      ...quickCalculatorDefaults,
      pizzaCount: 50,
      doughBallWeightGrams: 300,
      hydrationPercent: 100,
      saltPercent: 2.75,
      fermentationTemperatureCelsius: 21.5,
      prefermentMethod: "poolish",
      prefermentedFlourPercent: 30,
      prefermentHydrationPercent: 100,
      yeastConversionAmountGrams: 123.4,
      customIngredientsEnabled: true,
      oilPercent: 2.5,
      sugarPercent: 1.25,
      maltPercent: 0.3,
      flourBlendEnabled: true,
      flourBlendPrimaryPercent: 65,
    });

    expect(result.input.pizzaCount).toBe(50);
    expect(result.input.doughBallWeightGrams).toBe(300);
    expect(result.input.hydrationPercent).toBe(100);
    expect(result.input.saltPercent).toBe(2.75);
    expect(result.input.yeastConversionAmountGrams).toBe(123.4);
    expect(result.ingredients.total).toBeGreaterThan(15_000);
    expect(result.preferment.build.flourGrams).toBeGreaterThan(0);
    expect(result.advancedTools.yeastConversion.convertedGrams).toBeGreaterThan(0);
    expect(result.advancedTools.customIngredients.oilGrams).toBeGreaterThan(0);
    expect(result.advancedTools.flourBlend.primaryFlourGrams).toBeGreaterThan(0);
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
    expect(component).toContain("Fermentation details");
    expect(component).toContain("Advanced dough tools");
    expect(component).toContain("Working assumptions");
  });

  it("normalizes advanced dough tool fields as optional Quick Calculator-only inputs", () => {
    const normalized = normalizeQuickCalculatorInput({
      ...quickCalculatorDefaults,
      targetDoughTemperatureCelsius: 99,
      flourTemperatureCelsius: -10,
      roomTemperatureCelsius: 40,
      prefermentTemperatureCelsius: 18,
      mixerFrictionCelsius: 30,
      reverseFermentationHours: 200,
      yeastConversionFrom: "lsd",
      yeastConversionTo: "ssd",
      yeastConversionAmountGrams: 999,
      customIngredientsEnabled: true,
      oilPercent: 99,
      sugarPercent: 99,
      maltPercent: 99,
      flourBlendEnabled: true,
      flourBlendPrimaryPercent: 35,
      flourBlendSecondaryPercent: 65,
    });

    expect(normalized).toMatchObject({
      targetDoughTemperatureCelsius: 35,
      flourTemperatureCelsius: 0,
      roomTemperatureCelsius: 35,
      mixerFrictionCelsius: 20,
      reverseFermentationHours: 96,
      yeastConversionFrom: "idy",
      yeastConversionTo: "ady",
      yeastConversionAmountGrams: 500,
      customIngredientsEnabled: true,
      oilPercent: 20,
      sugarPercent: 20,
      maltPercent: 10,
      flourBlendEnabled: true,
      flourBlendPrimaryPercent: 35,
      flourBlendSecondaryPercent: 65,
    });
  });

  it("calculates target dough temperature water temperature without changing ingredient output", () => {
    const directWater = calculateWaterTemperature({
      targetDoughTemperatureCelsius: 24,
      flourTemperatureCelsius: 20,
      roomTemperatureCelsius: 22,
      prefermentTemperatureCelsius: 18,
      mixerFrictionCelsius: 3,
    }, false);
    const prefermentedWater = calculateWaterTemperature({
      targetDoughTemperatureCelsius: 24,
      flourTemperatureCelsius: 20,
      roomTemperatureCelsius: 22,
      prefermentTemperatureCelsius: 18,
      mixerFrictionCelsius: 3,
    }, true);
    const baseline = calculateQuickDough(quickCalculatorDefaults);
    const adjusted = calculateQuickDough({
      ...quickCalculatorDefaults,
      targetDoughTemperatureCelsius: 26,
      flourTemperatureCelsius: 18,
      roomTemperatureCelsius: 20,
      mixerFrictionCelsius: 4,
    });

    expect(directWater.requiredWaterTemperatureCelsius).toBe(27);
    expect(directWater.factorCount).toBe(3);
    expect(prefermentedWater.requiredWaterTemperatureCelsius).toBe(33);
    expect(prefermentedWater.factorCount).toBe(4);
    expect(adjusted.ingredients).toEqual(baseline.ingredients);
    expect(adjusted.settings).toEqual(baseline.settings);
  });

  it("converts commercial yeast types in the isolated Quick Calculator module", () => {
    const converted = convertQuickYeast("idy", "ady", 1);

    expect(converted.from).toBe("idy");
    expect(converted.to).toBe("ady");
    expect(converted.convertedGrams).toBeCloseTo(1 / 0.414 * 0.52, 6);
    expect(convertQuickYeast("lsd", "ssd", 2)).toMatchObject({
      from: "idy",
      to: "ady",
      inputGrams: 2,
    });
  });

  it("estimates reverse fermentation yeast without calling the planning engine", () => {
    const target = calculateQuickDough(quickCalculatorDefaults);
    const reverse = calculateQuickReverseFermentation(target.ingredients, "idy", 4, 24);

    expect(reverse.targetHours).toBe(24);
    expect(reverse.yeastGramsForTargetHours).toBeCloseTo(target.ingredients.leavener, 6);
    expect(reverse.estimatedHoursFromCurrentYeast).toBeCloseTo(24, 6);
  });

  it("calculates optional custom ingredients and flour blends without changing the target formula", () => {
    const target = calculateQuickDough({
      ...quickCalculatorDefaults,
      customIngredientsEnabled: true,
      oilPercent: 3,
      sugarPercent: 1,
      maltPercent: 0.5,
      flourBlendEnabled: true,
      flourBlendPrimaryPercent: 70,
    });
    const direct = calculateQuickDough(quickCalculatorDefaults);

    expect(target.ingredients).toEqual(direct.ingredients);
    expect(target.advancedTools.customIngredients.enabled).toBe(true);
    expect(target.advancedTools.customIngredients.oilGrams).toBeCloseTo(target.ingredients.flour * 0.03, 6);
    expect(target.advancedTools.customIngredients.sugarGrams).toBeCloseTo(target.ingredients.flour * 0.01, 6);
    expect(target.advancedTools.customIngredients.maltGrams).toBeCloseTo(target.ingredients.flour * 0.005, 6);
    expect(target.summaryText).toContain("Enhanced dough total");
    expect(target.advancedTools.flourBlend.primaryFlourGrams).toBeCloseTo(target.ingredients.flour * 0.7, 6);
    expect(target.advancedTools.flourBlend.secondaryFlourGrams).toBeCloseTo(target.ingredients.flour * 0.3, 6);
  });

  it("keeps every calculated output finite and non-negative across representative methods", () => {
    const cases = [
      quickCalculatorDefaults,
      { ...quickCalculatorDefaults, sizingMode: "round" as const, diameterCm: 38, thicknessFactor: 0.28 },
      { ...quickCalculatorDefaults, sizingMode: "pan" as const, panWidthCm: 25, panLengthCm: 35, doughLoadingGramsPerSquareCm: 0.74 },
      { ...quickCalculatorDefaults, sizingMode: "custom" as const, customDoughWeightGrams: 415 },
      { ...quickCalculatorDefaults, prefermentMethod: "poolish" as const, prefermentedFlourPercent: 30, prefermentHydrationPercent: 100 },
      { ...quickCalculatorDefaults, prefermentMethod: "biga" as const, prefermentedFlourPercent: 40, prefermentHydrationPercent: 50 },
      { ...quickCalculatorDefaults, prefermentMethod: "levain" as const, prefermentedFlourPercent: 25, prefermentHydrationPercent: 100, prefermentInoculationPercent: 20 },
      { ...quickCalculatorDefaults, customIngredientsEnabled: true, oilPercent: 3, sugarPercent: 1, maltPercent: 0.5, flourBlendEnabled: true, flourBlendPrimaryPercent: 65 },
    ];

    for (const input of cases) {
      const result = calculateQuickDough(input);
      const values = [
        result.ingredients.total,
        result.ingredients.flour,
        result.ingredients.water,
        result.ingredients.salt,
        result.ingredients.leavener,
        result.sizing.doughWeightPerPieceGrams,
        result.preferment.build.flourGrams,
        result.preferment.build.waterGrams,
        result.preferment.finalDough.flourGrams,
        result.preferment.finalDough.waterGrams,
        result.advancedTools.waterTemperature.requiredWaterTemperatureCelsius,
        result.advancedTools.reverseFermentation.yeastGramsForTargetHours,
        result.advancedTools.customIngredients.oilGrams,
        result.advancedTools.flourBlend.primaryFlourGrams,
        result.advancedTools.flourBlend.secondaryFlourGrams,
      ];
      expect(values.every(Number.isFinite)).toBe(true);
      expect(values.filter((value) => value < 0)).toEqual([]);
    }
  });

  it("does not let guidance mode change ingredient calculations for the same input", () => {
    const input = {
      ...quickCalculatorDefaults,
      pizzaCount: 6,
      doughBallWeightGrams: 270,
      hydrationPercent: 66,
      saltPercent: 2.6,
      sizingMode: "pan" as const,
      pizzaStyle: "detroit" as const,
      panWidthCm: 25,
      panLengthCm: 35,
      doughLoadingGramsPerSquareCm: 0.74,
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

  it("uses a dedicated versioned localStorage key for Quick Calculator recipes only", () => {
    const storage = new MemoryStorage();
    const recipe = createQuickCalculatorSavedRecipe(quickCalculatorDefaults, "Friday quick dough", "quick-test-id", "2026-07-11T12:00:00.000Z");

    storeQuickCalculatorSavedRecipes([recipe], storage);

    expect(QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY).toBe("doughtools.quick-calculator.recipes.v1");
    expect(storage.getItem(QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY)).toContain("Friday quick dough");
    expect(loadQuickCalculatorSavedRecipes(storage)).toEqual([recipe]);
    expect(storage.getItem("doughtools-saved-recipes-v1")).toBeNull();
  });

  it("safely ignores malformed or incompatible saved Quick Calculator data", () => {
    const storage = new MemoryStorage();

    storage.setItem(QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY, "not-json");
    expect(loadQuickCalculatorSavedRecipes(storage)).toEqual([]);

    storage.setItem(QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY, JSON.stringify([
      { id: "missing-version", name: "Bad", input: quickCalculatorDefaults },
      { id: "ok", version: 1, name: "", createdAt: "broken", updatedAt: "also-broken", input: { pizzaCount: 99, hydrationPercent: 200 } },
    ]));

    const loaded = loadQuickCalculatorSavedRecipes(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({
      id: "ok",
      version: 1,
      name: "Untitled quick recipe",
    });
    expect(loaded[0].input.pizzaCount).toBe(50);
    expect(loaded[0].input.hydrationPercent).toBe(100);
  });

  it("saves, renames, duplicates and deletes local Quick Calculator recipes without session helpers", () => {
    const saved = saveQuickCalculatorRecipe([], quickCalculatorDefaults, "Weekend quick dough");

    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("Weekend quick dough");

    const renamed = renameQuickCalculatorSavedRecipe(saved, saved[0].id, "Friday pizza");
    expect(renamed[0].name).toBe("Friday pizza");

    const duplicated = duplicateQuickCalculatorSavedRecipe(renamed, renamed[0].id);
    expect(duplicated).toHaveLength(2);
    expect(duplicated[0].name).toBe("Friday pizza copy");
    expect(duplicated[0].input).toEqual(renamed[0].input);

    const deleted = deleteQuickCalculatorSavedRecipe(duplicated, renamed[0].id);
    expect(deleted).toHaveLength(1);
    expect(deleted[0].name).toBe("Friday pizza copy");
  });

  it("limits saved Quick Calculator recipes locally without affecting the active calculator input", () => {
    const manyRecipes = Array.from({ length: QUICK_CALCULATOR_MAX_SAVED_RECIPES + 5 }, (_, index) => (
      createQuickCalculatorSavedRecipe(quickCalculatorDefaults, `Recipe ${index}`, `quick-${index}`, `2026-07-11T12:${String(index).padStart(2, "0")}:00.000Z`)
    ));
    const storage = new MemoryStorage();

    storeQuickCalculatorSavedRecipes(manyRecipes, storage);
    const loaded = loadQuickCalculatorSavedRecipes(storage);
    const rawStored = JSON.parse(storage.getItem(QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY) ?? "[]");
    const saved = saveQuickCalculatorRecipe(manyRecipes, { ...quickCalculatorDefaults, pizzaCount: 7 }, "Newest");
    const duplicated = duplicateQuickCalculatorSavedRecipe(manyRecipes, "quick-0");

    expect(QUICK_CALCULATOR_MAX_SAVED_RECIPES).toBe(20);
    expect(rawStored).toHaveLength(QUICK_CALCULATOR_MAX_SAVED_RECIPES);
    expect(loaded).toHaveLength(QUICK_CALCULATOR_MAX_SAVED_RECIPES);
    expect(saved).toHaveLength(QUICK_CALCULATOR_MAX_SAVED_RECIPES);
    expect(saved[0].input.pizzaCount).toBe(7);
    expect(duplicated).toHaveLength(QUICK_CALCULATOR_MAX_SAVED_RECIPES);
  });

  it("loads old Quick Calculator saved recipes and share URLs with new advanced defaults", () => {
    const storage = new MemoryStorage();
    const oldInput = {
      pizzaCount: 3,
      doughBallWeightGrams: 240,
      hydrationPercent: 62,
      saltPercent: 2.5,
      yeastType: "idy",
      fermentationDuration: "24h",
      fermentationEnvironment: "room",
      fermentationTemperatureCelsius: 22,
      wastePercent: 2,
    };

    storage.setItem(QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY, JSON.stringify([
      { id: "old", version: 1, name: "Old quick recipe", createdAt: "2026-07-11T12:00:00.000Z", updatedAt: "2026-07-11T12:00:00.000Z", input: oldInput },
    ]));

    const loaded = loadQuickCalculatorSavedRecipes(storage)[0];
    const shared = quickCalculatorInputFromSearch(`?quick=${encodeURIComponent(JSON.stringify(oldInput))}`);

    expect(loaded.input.targetDoughTemperatureCelsius).toBe(24);
    expect(loaded.input.prefermentMethod).toBe("direct");
    expect(shared?.targetDoughTemperatureCelsius).toBe(24);
    expect(shared?.pizzaCount).toBe(3);
  });

  it("creates and reads a shareable Quick Calculator URL with isolated query state", () => {
    const params = quickCalculatorInputToShareParams(quickCalculatorDefaults);
    const url = buildQuickCalculatorShareUrl(quickCalculatorDefaults, "https://example.com/elsewhere?calculator=2");
    const parsed = quickCalculatorInputFromSearch(new URL(url).search);

    expect(QUICK_CALCULATOR_SHARE_PARAM).toBe("quick");
    expect(params.has("quick")).toBe(true);
    expect(params.has("calculator")).toBe(false);
    expect(url).toContain("/calculator/quick?");
    expect(url).not.toContain("calculator=2");
    expect(parsed).toEqual(quickCalculatorDefaults);
    expect(quickCalculatorInputFromSearch("?quick=not-json")).toBeUndefined();
  });

  it("renders local recipe management and share controls without workflow actions", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("Save, reload or share this quick recipe");
    expect(component).toContain("Saved quick recipes");
    expect(component).toContain("Save recipe");
    expect(component).toContain("Copy share link");
    expect(component).toContain("Load");
    expect(component).toContain("Duplicate");
    expect(component).toContain("Delete");
    expect(component).toContain("quickCalculatorInputFromSearch(window.location.search)");
    expect(component).toContain("buildQuickCalculatorShareUrl(result.input)");
    expect(component).not.toContain("Start Pizza Session");
    expect(component).not.toContain("/session/");
  });

  it("defines isolated Quick Calculator pizza style presets and sizing math", () => {
    expect(quickPizzaStylePresets.map((style) => style.id)).toEqual([
      "neapolitan",
      "new-york",
      "roman-round",
      "detroit",
      "sicilian",
      "custom",
    ]);
    expect(quickPizzaStylePresetById("detroit").label).toBe("Detroit");
    expect(deriveRoundDoughWeightGrams(32, 0.32)).toBe(257);
    expect(derivePanDoughWeightGrams(25, 35, 0.74)).toBe(648);
  });

  it("derives effective dough weight from explicit sizing modes before calling the existing dough calculator", () => {
    const round = calculateQuickDough({
      ...quickCalculatorDefaults,
      sizingMode: "round",
      pizzaStyle: "new-york",
      pizzaCount: 2,
      diameterCm: 38,
      thicknessFactor: 0.28,
    });
    const pan = calculateQuickDough({
      ...quickCalculatorDefaults,
      sizingMode: "pan",
      pizzaStyle: "detroit",
      pizzaCount: 1,
      panWidthCm: 25,
      panLengthCm: 35,
      doughLoadingGramsPerSquareCm: 0.74,
    });
    const custom = calculateQuickDough({
      ...quickCalculatorDefaults,
      sizingMode: "custom",
      customDoughWeightGrams: 415,
    });

    expect(round.sizing.doughWeightPerPieceGrams).toBe(318);
    expect(round.settings.ballWeight).toBe(318);
    expect(pan.sizing.doughWeightPerPieceGrams).toBe(648);
    expect(pan.settings.ballWeight).toBe(648);
    expect(custom.sizing.doughWeightPerPieceGrams).toBe(415);
    expect(custom.settings.ballWeight).toBe(415);
  });

  it("applies style presets to sizing defaults without changing fermentation or formula fields", () => {
    const current = {
      sizingMode: "ball-weight" as const,
      pizzaStyle: "neapolitan" as const,
      quantity: 4,
      ballWeightGrams: 260,
      diameterCm: 32,
      panWidthCm: 30,
      panLengthCm: 40,
      thicknessFactor: 0.32,
      doughLoadingGramsPerSquareCm: 0.65,
      customDoughWeightGrams: 260,
    };

    const detroit = applyQuickPizzaStylePreset(current, "detroit");

    expect(detroit).toMatchObject({
      pizzaStyle: "detroit",
      sizingMode: "pan",
      ballWeightGrams: 650,
      panWidthCm: 25,
      panLengthCm: 35,
      doughLoadingGramsPerSquareCm: 0.74,
    });
  });

  it("extends save/share normalization with sizing fields while keeping the isolated quick query", () => {
    const input = {
      ...quickCalculatorDefaults,
      sizingMode: "round" as const,
      pizzaStyle: "roman-round" as const,
      diameterCm: 32,
      thicknessFactor: 0.27,
    };
    const params = quickCalculatorInputToShareParams(input);
    const parsed = quickCalculatorInputFromSearch(`?${params.toString()}`);

    expect(parsed?.sizingMode).toBe("round");
    expect(parsed?.pizzaStyle).toBe("roman-round");
    expect(parsed?.diameterCm).toBe(32);
    expect(parsed?.thicknessFactor).toBe(0.27);
    expect(params.has("calculator")).toBe(false);
    expect(params.has("quick")).toBe(true);
  });

  it("defines isolated Quick Calculator preferment presets", () => {
    expect(quickPrefermentPresets.map((preset) => preset.id)).toEqual([
      "direct",
      "poolish",
      "biga",
      "levain",
    ]);
    expect(quickPrefermentPresetById("poolish").label).toBe("Poolish");
    expect(quickPrefermentPresetById("biga").defaultHydrationPercent).toBe(50);
    expect(quickPrefermentPresetById("levain").defaultInoculationPercent).toBe(20);
  });

  it("partitions target flour and water into poolish, biga and levain builds without changing the target dough", () => {
    const target = calculateQuickDough(quickCalculatorDefaults);
    const poolish = calculateQuickPreferment(target.ingredients, {
      method: "poolish",
      prefermentedFlourPercent: 30,
      prefermentHydrationPercent: 100,
      prefermentInoculationPercent: 0,
    });
    const biga = calculateQuickPreferment(target.ingredients, {
      method: "biga",
      prefermentedFlourPercent: 40,
      prefermentHydrationPercent: 50,
      prefermentInoculationPercent: 0,
    });
    const levain = calculateQuickPreferment(target.ingredients, {
      method: "levain",
      prefermentedFlourPercent: 25,
      prefermentHydrationPercent: 100,
      prefermentInoculationPercent: 20,
    });

    expect(poolish.build.flourGrams).toBeCloseTo(target.ingredients.flour * 0.3, 6);
    expect(poolish.build.waterGrams).toBeCloseTo(poolish.build.flourGrams, 6);
    expect(poolish.finalDough.flourGrams + poolish.build.flourGrams).toBeCloseTo(target.ingredients.flour, 6);
    expect(poolish.totalFormula.doughGrams).toBe(target.ingredients.total);

    expect(biga.build.waterGrams).toBeCloseTo(biga.build.flourGrams * 0.5, 6);
    expect(biga.finalDough.flourGrams + biga.build.flourGrams).toBeCloseTo(target.ingredients.flour, 6);

    expect(levain.build.starterGrams).toBeCloseTo(levain.build.flourGrams + levain.build.waterGrams, 6);
    expect(levain.finalDough.commercialYeastGrams).toBe(0);
    expect(levain.totalFormula.doughGrams).toBe(target.ingredients.total);
  });

  it("applies preferment presets without changing sizing, formula or fermentation fields", () => {
    const poolish = applyQuickPrefermentPreset({
      method: "direct",
      prefermentedFlourPercent: 0,
      prefermentHydrationPercent: 0,
      prefermentInoculationPercent: 0,
    }, "poolish");

    expect(poolish).toEqual({
      method: "poolish",
      prefermentedFlourPercent: 30,
      prefermentHydrationPercent: 100,
      prefermentInoculationPercent: 0,
    });
  });

  it("calculates Quick dough preferment details after the existing ingredient result", () => {
    const direct = calculateQuickDough(quickCalculatorDefaults);
    const poolish = calculateQuickDough({
      ...quickCalculatorDefaults,
      prefermentMethod: "poolish",
      prefermentedFlourPercent: 30,
      prefermentHydrationPercent: 100,
    });

    expect(poolish.ingredients).toEqual(direct.ingredients);
    expect(poolish.settings).toEqual(direct.settings);
    expect(poolish.preferment.method).toBe("poolish");
    expect(poolish.preferment.build.totalGrams).toBeGreaterThan(0);
    expect(poolish.preferment.finalDough.flourGrams).toBeLessThan(poolish.ingredients.flour);
  });

  it("extends save/share normalization with preferment fields while keeping the isolated quick query", () => {
    const input = {
      ...quickCalculatorDefaults,
      prefermentMethod: "levain" as const,
      prefermentedFlourPercent: 25,
      prefermentHydrationPercent: 100,
      prefermentInoculationPercent: 20,
    };
    const params = quickCalculatorInputToShareParams(input);
    const parsed = quickCalculatorInputFromSearch(`?${params.toString()}`);

    expect(parsed?.prefermentMethod).toBe("levain");
    expect(parsed?.prefermentedFlourPercent).toBe(25);
    expect(parsed?.prefermentHydrationPercent).toBe(100);
    expect(parsed?.prefermentInoculationPercent).toBe(20);
    expect(params.has("calculator")).toBe(false);
    expect(params.has("quick")).toBe(true);
  });

  it("extends save/share normalization with advanced dough tool fields while keeping the isolated quick query", () => {
    const input = {
      ...quickCalculatorDefaults,
      targetDoughTemperatureCelsius: 25,
      flourTemperatureCelsius: 19,
      roomTemperatureCelsius: 21,
      prefermentTemperatureCelsius: 18,
      mixerFrictionCelsius: 4,
      reverseFermentationHours: 36,
      yeastConversionFrom: "cy" as const,
      yeastConversionTo: "idy" as const,
      yeastConversionAmountGrams: 3,
      customIngredientsEnabled: true,
      oilPercent: 2,
      sugarPercent: 1,
      maltPercent: 0.3,
      flourBlendEnabled: true,
      flourBlendPrimaryPercent: 65,
    };
    const params = quickCalculatorInputToShareParams(input);
    const parsed = quickCalculatorInputFromSearch(`?${params.toString()}`);

    expect(parsed).toMatchObject({
      targetDoughTemperatureCelsius: 25,
      flourTemperatureCelsius: 19,
      roomTemperatureCelsius: 21,
      mixerFrictionCelsius: 4,
      reverseFermentationHours: 36,
      yeastConversionFrom: "cy",
      yeastConversionTo: "idy",
      yeastConversionAmountGrams: 3,
      customIngredientsEnabled: true,
      oilPercent: 2,
      sugarPercent: 1,
      maltPercent: 0.3,
      flourBlendEnabled: true,
      flourBlendPrimaryPercent: 65,
      flourBlendSecondaryPercent: 35,
    });
    expect(params.has("calculator")).toBe(false);
    expect(params.has("quick")).toBe(true);
  });

  it("renders explicit pizza style and sizing controls without changing workflow boundaries", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");
    const sizing = source("lib/quick-calculator/pizza-sizing.ts");
    const preferments = source("lib/quick-calculator/quick-preferments.ts");

    expect(component).toContain("What are you making?");
    expect(component).toContain("Sizing mode");
    expect(component).toContain("Pizza diameter");
    expect(component).toContain("Pan width");
    expect(component).toContain("Pan length");
    expect(component).toContain("Dough loading");
    expect(component).toContain("Custom dough weight");
    expect(component).toContain("Derived dough size");
    expect(component).toContain("Preferment");
    expect(preferments).toContain("Poolish");
    expect(preferments).toContain("Biga");
    expect(preferments).toContain("Sourdough / levain");
    expect(component).toContain("Preferment build");
    expect(component).toContain("Final dough additions");
    expect(component).toContain("Required water");
    expect(component).toContain("Reverse fermentation target");
    expect(component).toContain("Enhanced dough total");
    expect(component).toContain("Primary flour");
    expect(component).toContain("Secondary flour");
    expect(component).toContain("mt-3 grid gap-2 sm:grid-cols-3");
    expect(component).not.toContain("02b");
    expect(sizing).not.toMatch(/PizzaSession|buildPlanningResult|Timeline|Kitchen Mode|cloud-pizza-session|getActivePizzaSession/);
    expect(preferments).not.toMatch(/PizzaSession|buildPlanningResult|Timeline|Kitchen Mode|cloud-pizza-session|getActivePizzaSession/);
  });

  it("uses the Patch 343 responsive workspace order without moving calculation state", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain('title="Guidance level"');
    expect(component).toContain("data-quick-essential-controls");
    expect(component).toContain("data-quick-result-panel");
    expect(component).toContain("data-quick-advanced-section");
    expect(component).toContain("data-quick-save-share");
    expect(component.indexOf("data-quick-result-panel")).toBeLessThan(component.indexOf("data-quick-advanced-section"));
    expect(component.indexOf("data-quick-advanced-section")).toBeLessThan(component.indexOf("data-quick-save-share"));
    expect(component).toContain("RecipeResultPanel");
    expect(component).toContain("calculateQuickDough(input)");
  });

  it("keeps the Quick Calculator mobile layout shrinkable at narrow widths", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("mt-6 grid min-w-0 gap-6");
    expect(component).toContain('aria-label="Quick calculator essential inputs"');
    expect(component).toContain("data-quick-batch-summary");
    expect(component).toContain('className="min-w-0 rounded-[2rem] border border-white/80 bg-white/70');
    expect(component).toContain("min-w-0 rounded-[1.35rem] border p-4");
    expect(component).toContain("grid-cols-[2.5rem_minmax(3.5rem,1fr)_auto_2.5rem]");
    expect(component).toContain("sm:grid-cols-[3rem_minmax(5.75rem,1fr)_auto_3rem]");
    expect(component).toContain("lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.62fr)]");
    expect(component).toContain("h-5 w-5 rounded");
  });

  it("keeps advanced dough tools isolated from session, planning and Calculator v2 code", () => {
    const advancedTools = source("lib/quick-calculator/advanced-dough-tools.ts");
    const quickModule = source("lib/quick-calculator/quick-dough-calculator.ts");

    expect(quickAdvancedDoughToolsDefaults.targetDoughTemperatureCelsius).toBe(24);
    expect(calculateQuickAdvancedDoughTools(
      calculateQuickDough(quickCalculatorDefaults).ingredients,
      quickAdvancedDoughToolsDefaults,
      quickCalculatorDefaults.yeastType,
      quickCalculatorDefaults.fermentationTemperatureCelsius,
      false,
    ).waterTemperature.factorCount).toBe(3);
    expect(advancedTools).not.toMatch(/PizzaSession|buildPlanningResult|Timeline|Kitchen Mode|cloud-pizza-session|getActivePizzaSession|HomeCalculatorWorkspace/);
    expect(quickModule).toContain("calculateQuickAdvancedDoughTools");
  });
});
