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
  deriveQuickFermentationEnvironment,
  getQuickCalculatorPresentation,
  normalizeQuickCalculatorInput,
  quickCalculatorDefaults,
  quickCalculatorPresentations,
  quickFermentationToRecipePreset,
  quickCalculatorInputToRecipeSettings,
} from "@/lib/quick-calculator/quick-dough-calculator";
import {
  createQuickRecipeImageDataUrl,
  dataUrlToQuickRecipeFile,
  QUICK_RECIPE_IMAGE_HEIGHT,
  QUICK_RECIPE_IMAGE_WIDTH,
} from "@/lib/quick-calculator/quick-recipe-image-export";
import { MemoryStorage } from "./helpers";
import { metadataForRoute } from "@/lib/seo-config";

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
    const metadata = metadataForRoute("/calculator/quick");

    expect(page).toContain("QuickDoughCalculator");
    expect(metadata.title).toBe("Pizza Dough Calculator: Yeast, Hydration and Dough Balls | DoughTools");
    expect(metadata.description).toContain("Calculate pizza dough flour, water, salt and yeast");
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
    expect(deriveQuickFermentationEnvironment("6h")).toBe("room");
    expect(deriveQuickFermentationEnvironment("12h")).toBe("room");
    expect(deriveQuickFermentationEnvironment("24h")).toBe("room");
    expect(deriveQuickFermentationEnvironment("48h")).toBe("cold");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "6h", fermentationEnvironment: "room" })).toBe("6h-room");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "12h", fermentationEnvironment: "room" })).toBe("12h-room");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "24h", fermentationEnvironment: "room" })).toBe("24h-room");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "24h", fermentationEnvironment: "cold" })).toBe("24h-room");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "48h", fermentationEnvironment: "cold" })).toBe("48h-cold");
    expect(quickFermentationToRecipePreset({ fermentationDuration: "48h", fermentationEnvironment: "room" })).toBe("48h-cold");
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
      fermentationEnvironment: "room",
      fermentationTemperatureCelsius: 22,
      wastePercent: 25,
    });
  });

  it("normalizes Quick Calculator fermentation environment from duration before calculation", () => {
    const staleRoomFortyEight = normalizeQuickCalculatorInput({
      ...quickCalculatorDefaults,
      fermentationDuration: "48h",
      fermentationEnvironment: "room",
      fermentationTemperatureCelsius: 22,
    });
    const staleColdTwentyFour = normalizeQuickCalculatorInput({
      ...quickCalculatorDefaults,
      fermentationDuration: "24h",
      fermentationEnvironment: "cold",
      fermentationTemperatureCelsius: 4,
    });
    const coldCustomTemperature = normalizeQuickCalculatorInput({
      ...quickCalculatorDefaults,
      fermentationDuration: "48h",
      fermentationEnvironment: "cold",
      fermentationTemperatureCelsius: 6,
    });

    expect(staleRoomFortyEight).toMatchObject({
      fermentationDuration: "48h",
      fermentationEnvironment: "cold",
      fermentationTemperatureCelsius: 4,
    });
    expect(staleColdTwentyFour).toMatchObject({
      fermentationDuration: "24h",
      fermentationEnvironment: "room",
      fermentationTemperatureCelsius: 22,
    });
    expect(coldCustomTemperature).toMatchObject({
      fermentationDuration: "48h",
      fermentationEnvironment: "cold",
      fermentationTemperatureCelsius: 6,
    });
    expect(calculateQuickDough(staleRoomFortyEight).settings.fermentation).toBe("48h-cold");
    expect(calculateQuickDough(staleColdTwentyFour).settings.fermentation).toBe("24h-room");
  });

  it("does not leave stale room yeast calculation active for a 48h Quick Calculator duration", () => {
    const result = calculateQuickDough({
      ...quickCalculatorDefaults,
      yeastType: "ady",
      fermentationDuration: "48h",
      fermentationEnvironment: "room",
      fermentationTemperatureCelsius: 22,
    });

    expect(result.input.fermentationEnvironment).toBe("cold");
    expect(result.input.fermentationTemperatureCelsius).toBe(4);
    expect(result.settings.fermentation).toBe("48h-cold");
    expect(result.settings.temperature).toBe(4);
    expect(result.ingredients.leavener / result.ingredients.flour * 100).toBeCloseTo(0.144, 6);
    expect(result.ingredients.leavener / result.ingredients.flour * 100).toBeGreaterThan(0.0216 * 5);
  });

  it("keeps the public duration control as the source of truth for displayed environment", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("function updateFermentationDuration");
    expect(component).toContain("const fermentationEnvironment = deriveQuickFermentationEnvironment(duration)");
    expect(component).toContain("fermentationTemperaturesByEnvironment");
    expect(component).toContain("onClick={() => updateFermentationDuration(setInput, option.value, fermentationTemperaturesByEnvironment)}");
    expect(component).toContain("const validForDuration = option.value === deriveQuickFermentationEnvironment(result.input.fermentationDuration)");
    expect(component).toContain("disabled={!validForDuration}");
    expect(component).toContain("Used through 24 h");
    expect(component).toContain("Used after 24 h");
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

  it("keeps the only Pizza Session action secondary and avoids unsupported handoff behavior", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain('href="/session/start"');
    expect(component.match(/href="\/session\/start"/g)).toHaveLength(1);
    expect(component).toContain("Need the full process?");
    expect(component).toContain("Plan a pizza");
    expect(component).toContain("Quick Calculator does not create or prepopulate a Pizza Plan.");
    expect(component).not.toContain('href="/start"');
    expect(component).not.toContain("Create my pizza plan");
    expect(component).not.toContain("Continue to Shopping");
    expect(component).not.toContain("Start Kitchen Mode");
    expect(component).not.toContain("Review my pizza");
    expect(component).not.toContain("Account");
    expect(component).not.toContain("Save to");
    expect(component).not.toContain("Continue to");
    expect(component).not.toContain("createAndSavePizzaSession");
    expect(component).not.toContain("quickCalculatorInputToRecipeSettings(result.input)");
  });

  it("builds the core PizzApp-style UI for entering values and viewing ingredient results", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("Pizza Dough Calculator");
    expect(component).toContain("data-quick-seo-context");
    expect(component).toContain("Calculate a dough recipe from the pizza you want to make.");
    expect(component).toContain("How the calculation works");
    expect(component).toContain("Choose fermentation time");
    expect(component).toContain("Number of pizzas");
    expect(component).toContain("Dough-ball weight");
    expect(component).toContain("Hydration");
    expect(component).toContain("Salt");
    expect(component).toContain("Extra dough");
    expect(component).toContain("Yeast type");
    expect(component).toContain("Fermentation duration");
    expect(component).toContain("Fermentation");
    expect(component).toContain("Fermentation temperature");
    expect(component).toContain("Dough-temperature and flour tools");
    expect(component).toContain("Target dough temperature");
    expect(component).toContain("Water temperature");
    expect(component).toContain("Yeast converter");
    expect(component).toContain("Custom ingredients");
    expect(component).toContain("flour blend");
    expect(component).toContain("Live recipe");
    expect(component).toContain("dough balls x");
    expect(component).toContain("View baker's percentages");
    expect(component).toContain("Share recipe");
    expect(component).toContain("View calculation assumptions");
    expect(component).not.toContain("Start Pizza Session");
    expect(component).not.toContain("Copy recipe");
    expect(component).not.toContain("Reset calculator");
  });

  it("makes one coherent Live Recipe panel before the controls", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("const ingredientRows = [");
    expect(component).toContain("data-quick-dough-ball-summary");
    expect(component).toContain("Total dough {formatGrams(result.ingredients.total)} g");
    expect(component.indexOf("data-quick-result-panel")).toBeLessThan(component.indexOf("data-quick-essential-controls"));
    expect(component).not.toContain("const primaryResults = [");
    expect(component).not.toContain("Ingredient amounts");
  });

  it("uses guidance levels to change available controls instead of rendering all controls for every level", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("const isBeginner = experienceLevel === \"beginner\"");
    expect(component).toContain("const isEnthusiast = experienceLevel === \"enthusiast\"");
    expect(component).toContain("const isPizzaNerd = experienceLevel === \"pizza_nerd\"");
    expect(component).toContain("{!isBeginner && (");
    expect(component).toContain("{isPizzaNerd && (");
    expect(component).not.toContain("EXPERIENCE_LEVELS.map((level) => quickResultTeachingCopy");
  });

  it("keeps compact handoffs without changing workflow", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("View baker's percentages");
    expect(component).toContain("result.bakerPercentages.water");
    expect(component).toContain("result.bakerPercentages.salt");
    expect(component).toContain("Quick calculator next steps");
    expect(component).toContain("New to pizza dough? Learn the process");
    expect(component).toContain("Need the full process? Plan a pizza");
    expect(component).toContain('href="/guides/dough"');
    expect(component).not.toContain('href="/session/recipe"');
  });

  it("replaces copy, reset and saved-recipe actions with local recipe-image sharing", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");
    const imageExport = source("lib/quick-calculator/quick-recipe-image-export.ts");

    expect(component).toContain("createQuickRecipeImageDataUrl");
    expect(component).toContain("dataUrlToQuickRecipeFile");
    expect(component).toContain("navigator.share");
    expect(component).toContain("Recipe image preview");
    expect(component).toContain("Save image");
    expect(imageExport).toContain("canvas.width = QUICK_RECIPE_IMAGE_WIDTH");
    expect(imageExport).toContain("canvas.height = QUICK_RECIPE_IMAGE_HEIGHT");
    expect(component).not.toContain("const resetCalculator = () =>");
    expect(component).not.toContain("navigator.clipboard.writeText");
    expect(component).not.toContain("Save recipe");
    expect(component).not.toContain("storeQuickCalculatorSavedRecipes");
    expect(component).not.toContain("addLocalBakeResult");
  });

  it("creates a 1080 by 1350 local recipe image payload without uploading data", () => {
    const dataUrl = "data:image/png;base64,SGVsbG8=";
    const file = dataUrlToQuickRecipeFile(dataUrl);
    const helper = source("lib/quick-calculator/quick-recipe-image-export.ts");
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(QUICK_RECIPE_IMAGE_WIDTH).toBe(1080);
    expect(QUICK_RECIPE_IMAGE_HEIGHT).toBe(1350);
    expect(file.type).toBe("image/png");
    expect(file.name).toBe("doughtools-dough-recipe.png");
    expect(helper).toContain('document.createElement("canvas")');
    expect(helper).toContain('canvas.toDataURL("image/png")');
    expect(helper).toContain("DoughTools");
    expect(helper).toContain("Dough recipe");
    expect(helper).toContain("Planned with DoughTools");
    expect(helper).toContain("doughtools.app");
    expect(helper).toContain("result.ingredients.flour");
    expect(helper).toContain("result.ingredients.water");
    expect(helper).toContain("result.ingredients.salt");
    expect(helper).toContain("result.ingredients.leavener");
    expect(String(createQuickRecipeImageDataUrl)).toContain("canvas.toDataURL");
    expect(component).toContain("createQuickRecipeImageDataUrl(result, experienceLevel)");
    expect(component).toContain("files: [file]");
    expect(component).not.toMatch(/fetch\(|\/api\/|supabase|createAndSavePizzaSession|setActivePizzaSession/);
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
    expect(component).not.toContain("absolute right-3");
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
    expect(component).toContain("readExperienceLevelPreference");
    expect(component).toContain("writeExperienceLevelPreference");
    expect(component).toContain("data-quick-guidance-tabs");
    expect(component).toContain("QuickCalculatorGuidanceTabs");
    expect(component).not.toContain("Beginner | Enthusiast | Pizza Nerd");
  });

  it("uses compact guidance tabs before the public calculator result", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("QuickCalculatorGuidanceTabs");
    expect(component).toContain("data-quick-guidance-tabs");
    expect(component).toContain("Quick Calculator guidance level");
    expect(component).toContain("Choose how many pizzas you want to make. DoughTools uses a reliable recommended recipe.");
    expect(component).toContain("aria-pressed={active}");
    expect(component).not.toContain("Guidance level updated");
    expect(component).not.toContain('aria-controls="quick-calculator-guidance-preference"');
    expect(component).not.toContain("QuickCalculatorGuidancePreference");
    expect(component).not.toContain("ExperienceLevelSelector");
    expect(component).not.toContain("Choose how much of the same calculator model you want visible while you work.");
  });

  it("preserves guidance selection without scroll-to-change behavior or URL navigation", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).not.toContain("matchMedia(\"(prefers-reduced-motion: reduce)\")");
    expect(component).not.toContain("scrollIntoView");
    expect(component).not.toContain("window.scrollBy");
    expect(component).not.toContain("window.requestAnimationFrame");
    expect(component).not.toMatch(/window\.location\s*=/);
    expect(component).not.toMatch(/history\.pushState|history\.replaceState/);
    expect(component).not.toContain("router.push");
    expect(component.indexOf("<QuickCalculatorGuidanceTabs")).toBeLessThan(component.indexOf("<RecipeResultPanel"));
    expect(component.indexOf("data-quick-result-panel")).toBeLessThan(component.indexOf("data-quick-essential-controls"));
  });

  it("implements the Patch 469A guidance-level capability model", () => {
    const beginner = getQuickCalculatorPresentation("beginner");
    const enthusiast = getQuickCalculatorPresentation("enthusiast");
    const nerd = getQuickCalculatorPresentation("pizza_nerd");
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(beginner.level).toBe("beginner");
    expect(enthusiast.level).toBe("enthusiast");
    expect(nerd.level).toBe("pizza_nerd");
    expect(component).toContain("beginnerTechnicalKeys");
    expect(component).toContain("enthusiastUnsupportedKeys");
    expect(component).toContain("beginnerRecommendedInput");
    expect(component).toContain("enthusiastRecommendedInput");
    expect(component).toContain("OptionalControlGroup");
    expect(component).toContain("Adjust hydration, salt and extra dough");
    expect(component).toContain("Change yeast and temperature");
    expect(component).toContain("Dough-temperature and flour tools");
    expect(component).toContain("View calculation assumptions");
    expect(component).toContain("Use Beginner recommended settings?");
    expect(component).toContain("Use Enthusiast practical settings?");
  });

  it("treats exact fermentation temperature as a Pizza Nerd-only value during level reset", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");
    const enthusiastKeysBlock = component.match(/const enthusiastKeys = \[([\s\S]*?)\] as const/)?.[1] ?? "";

    expect(enthusiastKeysBlock).toContain("\"fermentationEnvironment\"");
    expect(enthusiastKeysBlock).not.toContain("\"fermentationTemperatureCelsius\"");
    expect(component).toContain("const fermentationEnvironment = deriveQuickFermentationEnvironment(current.fermentationDuration)");
    expect(component).toContain("fermentationTemperatureCelsius: defaultQuickFermentationTemperature(fermentationEnvironment)");
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
    expect(converted.convertedGrams).toBeCloseTo(1 / (1 / 3) * 0.4, 6);
    expect(convertQuickYeast("lsd", "ssd", 2)).toMatchObject({
      from: "idy",
      to: "ady",
      inputGrams: 2,
    });
  });

  it("estimates reverse fermentation yeast without calling the planning engine", () => {
    const target = calculateQuickDough(quickCalculatorDefaults);
    const reverse = calculateQuickReverseFermentation(
      target.ingredients,
      quickCalculatorDefaults.yeastType,
      quickCalculatorDefaults.fermentationTemperatureCelsius,
      24,
    );

    expect(reverse.targetHours).toBe(24);
    expect(reverse.yeastGramsForTargetHours).toBeCloseTo(target.ingredients.leavener, 6);
    expect(reverse.estimatedHoursFromCurrentYeast).toBeCloseTo(24, 1);
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

  it("keeps guidance-level calculations stable while lower levels reset unavailable active values by confirmation", () => {
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
    expect(component).toContain("valuesDiffer(result.input, quickCalculatorDefaults, beginnerTechnicalKeys)");
    expect(component).toContain("valuesDiffer(result.input, quickCalculatorDefaults, enthusiastUnsupportedKeys)");
    expect(component).toContain("Your pizza count stays the same.");
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

  it("removes public saved-recipe management and share-link controls without deleting legacy helpers", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).not.toContain("Saved calculator recipes");
    expect(component).not.toContain("browser-local Quick Calculator recipes");
    expect(component).not.toContain("Save recipe");
    expect(component).toContain("Share recipe");
    expect(component).not.toContain("Load recipe");
    expect(component).not.toContain("Duplicate recipe");
    expect(component).not.toContain("Delete recipe");
    expect(component).toContain("quickCalculatorInputFromSearch(window.location.search)");
    expect(component).not.toContain("buildQuickCalculatorShareUrl");
    expect(component).not.toContain("QUICK_CALCULATOR_SAVED_RECIPES_STORAGE_KEY");
    expect(component).not.toContain("loadQuickCalculatorSavedRecipes");
    expect(component).not.toContain("storeQuickCalculatorSavedRecipes");
    expect(component).not.toContain("Start Pizza Session");
    expect(component).not.toContain("Saved quick recipes");
    expect(component).not.toContain("Quick recipe saved locally.");
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

    expect(component).toContain("Sizing mode");
    expect(component).toContain("Pizza diameter");
    expect(component).toContain("Pan width");
    expect(component).toContain("Pan length");
    expect(component).toContain("Dough loading");
    expect(component).toContain("Custom dough weight");
    expect(component).toContain("Preferment");
    expect(preferments).toContain("Poolish");
    expect(preferments).toContain("Biga");
    expect(preferments).toContain("Sourdough / levain");
    expect(component).toContain("preferment build");
    expect(component).toContain("Required water");
    expect(component).toContain("Reverse fermentation target");
    expect(component).toContain("custom ingredients");
    expect(component).toContain("Primary flour");
    expect(component).toContain("Secondary flour");
    expect(component).toContain("mt-3 grid gap-2 sm:grid-cols-3");
    expect(component).not.toContain("02b");
    expect(sizing).not.toMatch(/PizzaSession|buildPlanningResult|Timeline|Kitchen Mode|cloud-pizza-session|getActivePizzaSession/);
    expect(preferments).not.toMatch(/PizzaSession|buildPlanningResult|Timeline|Kitchen Mode|cloud-pizza-session|getActivePizzaSession/);
  });

  it("uses the Patch 469A level-sensitive result-first workspace order without moving calculation state", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("data-quick-page-identity");
    expect(component).toContain("data-quick-guidance-tabs");
    expect(component).toContain("data-quick-live-recipe");
    expect(component).toContain("data-quick-essential-controls");
    expect(component).toContain("data-quick-result-panel");
    expect(component).toContain("data-quick-advanced-section");
    expect(component).toContain("data-quick-share-recipe-image");
    expect(component).not.toContain("data-quick-save-share");
    expect(component.indexOf("<QuickCalculatorGuidanceTabs")).toBeLessThan(component.indexOf("<RecipeResultPanel"));
    expect(component.indexOf("data-quick-result-panel")).toBeLessThan(component.indexOf("data-quick-essential-controls"));
    expect(component).toContain("RecipeResultPanel");
    expect(component).toContain("calculateQuickDough(input)");
  });

  it("keeps the Quick Calculator mobile layout shrinkable at narrow widths", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("mt-5 grid min-w-0 gap-5");
    expect(component).toContain('aria-label="Quick calculator controls"');
    expect(component).not.toContain("data-quick-batch-summary");
    expect(component).not.toContain("Current workspace");
    expect(component).not.toContain("{presentation.description}");
    expect(component).toContain('className="min-w-0 rounded-[1.55rem] border border-white/80 bg-white/74');
    expect(component).toContain("min-w-0 rounded-[1.35rem] border border-ink/10");
    expect(component).toContain("grid-cols-[2.5rem_minmax(3.5rem,1fr)_auto_2.5rem]");
    expect(component).toContain("sm:grid-cols-[3rem_minmax(5.75rem,1fr)_auto_3rem]");
    expect(component).toContain("lg:grid-cols-[minmax(0,0.98fr)_minmax(22rem,0.58fr)]");
    expect(component).toContain("h-5 w-5 rounded");
  });

  it("removes the redundant intro workspace panel while keeping the calculator header and results", () => {
    const component = source("components/quick-calculator/QuickDoughCalculator.tsx");

    expect(component).toContain("Pizza Dough Calculator");
    expect(component).toContain("Choose how many pizzas you want to make. DoughTools uses a reliable recommended recipe.");
    expect(component).toContain("Batch");
    expect(component).toContain("Total dough");
    expect(component).toContain("RecipeResultPanel");
    expect(component).toContain("calculateQuickDough(input)");
    expect(component).not.toContain("Fast recipe, fewer decisions");
    expect(component).not.toContain("data-quick-batch-summary");
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
