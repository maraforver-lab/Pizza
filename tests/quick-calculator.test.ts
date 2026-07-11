import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import {
  applyQuickPizzaStylePreset,
  calculateQuickPizzaSizing,
  derivePanDoughWeightGrams,
  deriveRoundDoughWeightGrams,
  quickPizzaStylePresetById,
  quickPizzaStylePresets,
} from "@/lib/quick-calculator/pizza-sizing";
import {
  buildQuickCalculatorShareUrl,
  createQuickCalculatorSavedRecipe,
  deleteQuickCalculatorSavedRecipe,
  duplicateQuickCalculatorSavedRecipe,
  loadQuickCalculatorSavedRecipes,
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

  it("renders explicit pizza style and sizing controls without changing workflow boundaries", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");
    const sizing = source("lib/quick-calculator/pizza-sizing.ts");

    expect(component).toContain("Pizza style and sizing");
    expect(component).toContain("Sizing mode");
    expect(component).toContain("Pizza diameter");
    expect(component).toContain("Pan width");
    expect(component).toContain("Pan length");
    expect(component).toContain("Dough loading");
    expect(component).toContain("Custom dough weight");
    expect(component).toContain("Derived dough size");
    expect(sizing).not.toMatch(/PizzaSession|buildPlanningResult|Timeline|Kitchen Mode|cloud-pizza-session|getActivePizzaSession/);
  });
});
