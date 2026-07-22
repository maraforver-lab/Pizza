import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateContinuousYeastRecommendation } from "@/lib/continuous-yeast-model";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { createPizzaSession } from "@/lib/pizza-session";
import { generatePizzaSessionShoppingList } from "@/lib/pizza-session-shopping-list";
import {
  ACTIVE_PIZZA_SESSION_STORAGE_KEY,
  createAndSavePizzaSession,
  getPizzaSession,
  PIZZA_SESSIONS_STORAGE_KEY,
  setActivePizzaSession,
} from "@/lib/pizza-session-storage";
import {
  buildSessionRecipe,
  generateAndSaveActiveSessionRecipe,
  sessionRecipeQuery,
} from "@/lib/session-recipe";
import { calculateSessionPizzaSauce } from "@/lib/pizza-sauce-calculator";
import { buildLongHorizonStartRecommendation } from "@/lib/session-long-horizon-start";
import type { RecipeSettings } from "@/lib/saved-recipes";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

class MemoryStorage {
  store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

const completeSessionInput = {
  id: "session-recipe-build",
  status: "planning" as const,
  currentStep: "flour" as const,
  experienceLevel: "enthusiast" as const,
  pizzaStyle: "pizza-oven",
  pizzaPreset: "diavola",
  targetEatTime: "2026-06-27T18:30",
  pizzaCount: 4,
  ovenType: "gas",
  flour: "tipo-00",
};

describe("Session recipe build step", () => {
  it("adds the /session/recipe route with local-first dough plan UI", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "recipe", "page.tsx"))).toBe(true);
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("\"use client\"");
    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={6}");
    expect(page).toContain("hideMeta");
    expect(page).toContain("levelCompactOnMobile");
    expect(page).toContain("hideBodyOnMobile");
    expect(page).toContain("title=\"Dough Plan\"");
    expect(page).toContain("Get your dough ingredients and amounts ready before you start.");
    expect(page).toContain("doughPlanHeroBody");
    expect(page).toContain("fermentationDisplay.durationHours > 24");
    expect(page).toContain("Choose the fermentation length that fits your bake day. Longer fermentation can build deeper flavor, but it also needs flour strong enough for the selected time.");
    expect(page).toContain("Dough balls");
    expect(page).toContain("{result.settings.pizzas} × {result.settings.ballWeight} g");
    expect(page).not.toContain("Dough ball size");
    expect(page).not.toContain("Batch size");
    expect(page).toContain("Continue your pizza plan");
    expect(page).toContain("Back");
    expect(page).toContain('href="/session/start"');
    expect(page).toContain('href="/session/shopping"');
    expect(page).not.toContain("Save and continue later");
    expect(page).not.toContain("Open Shopping List");
    expect(page).not.toContain("Open full Calculator");
    expect(page).not.toContain("Open Dough Doctor");
    expect(page).toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
    expect(page).toContain("No cloud sync, tracking or public sharing is active.");
    expect(page).toContain("<SessionWorkspaceLayout activeStep={6} hideLocalSaveNote>");
    expect(page).not.toContain("Saved as you go.");
    expect(page).not.toMatch(/Cloud sync is active|Tracking is active|Public sharing is active/);
  });

  it("removes repeated hero setup chips and separate Session Summary", () => {
    const page = source("app/session/recipe/page.tsx");
    const heroUses = page.match(/<SessionStepHero/g) ?? [];

    expect(heroUses).toHaveLength(1);
    expect(page).toContain("level={session.experienceLevel}");
    expect(page).not.toContain("Session summary");
    expect(page).not.toContain('["Pizza preset",');
    expect(page).not.toContain('["Target time",');
    expect(page).not.toContain('["Pizza count",');
    expect(page).not.toContain('["Ball weight",');
    expect(page).not.toContain('["Baking path",');
    expect(page).not.toContain("lg:grid-cols-[21rem_1fr]");
  });

  it("shows V2 journey context without making all ten steps active", () => {
    const page = source("app/session/recipe/page.tsx");
    const journeyDoc = source("docs/pizza-session-v2-journey.md");

    expect(page).toContain("step={6}");
    expect(page).not.toContain("Step 6: Dough Plan");
    expect(page).not.toContain("Before this, you set up the basics.");
    expect(page).not.toContain("After this, the timeline, shopping list, kitchen mode and review come next.");
    expect(page).not.toContain("Current journey step");
    expect(page).not.toContain("Pizza Session V2 journey");
    expect(journeyDoc).toContain("| 6 | Dough Plan | `/session/recipe`");
    expect(journeyDoc).toContain("Continue to Shopping →");
  });

  it("shows preparation guidance before dough amounts and the next step", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).not.toContain("Get ready to mix");
    expect(page).not.toContain("Gather your ingredients and tools, and measure everything before you start.");
    expect(page).toContain("Make the dough");
    expect(page).toContain("Weigh for best results");
    expect(page).toContain("Total dough");
    expect(page).toContain("Flour");
    expect(page).toContain("Water");
    expect(page).toContain("Salt");
    expect(page).toContain("Yeast");
    expect(page).toContain("Use these amounts when you make the dough.");
    expect(page).not.toContain("Use a digital scale for best accuracy. That’s enough to start the dough.");
    expect(page).not.toContain("Yeast can be a very small amount. A precision scale helps.");
    expect(page).not.toContain("doughPrepTools");
    expect(page).not.toContain("Have these ready");
    expect(page).not.toContain('label: "Digital scale"');
    expect(page).not.toContain('label: "Mixing bowl"');
    expect(page).not.toContain('label: "Dough scraper or sturdy spoon"');
    expect(page).not.toContain('label: "Covered container or bowl"');
    expect(page).toContain("buildSessionFermentationDisplay");
    expect(page).toContain("fermentationDisplay.durationHours");
    expect(page).not.toContain("Dough planning notes");
    expect(page).not.toMatch(/Planning guidance/i);
    expect(page).not.toContain("PlanningGuidanceCard");
    expect(page).not.toContain("PlanningStatusCard");
    expect(page).not.toContain("PlanningWatchCard");
    expect(page).not.toContain("PlanningDetailsList");
    expect(page).not.toContain("PlanningDetailRow");
    expect(page).not.toContain("Planning guidance is based on available session choices.");
    expect(page).not.toContain("Overall risk");
    expect(page).not.toContain("What to adjust first");
    expect(page).not.toContain("Session planning context");
    expect(page).not.toContain("Available time");
    expect(page).not.toContain("Recommended setup");
    expect(page).not.toContain("W-value");
    expect(page).toContain("Yeast");
    expect(page).not.toContain("Planned fermentation length");
    expect(page).not.toContain("fermentationDisplay.label");
    expect(page).not.toContain("Fermentation place / temperature");
    expect(page).not.toContain("fermentationDisplay.temperatureC");
    expect(page).toContain("Choose your fermentation length");
    expect(page).toContain("Pick the cold fermentation length that fits your bake day.");
    expect(page).toContain("A longer fermentation can build deeper flavor and a more developed dough");
    expect(page).toContain("flour strong enough to hold its structure over time");
    expect(page).toContain("DoughTools uses your choice to guide yeast amount, start time, and flour-strength recommendations.");
    expect(page).not.toContain("Choose a cold fermentation length");
    expect(page).not.toContain("Pick the length you want DoughTools to use for yeast and flour-strength guidance.");
    expect(page).not.toContain("W-value guidance");
    expect(page).not.toContain("Recommended flour strength");
    expect(page).not.toContain("What makes flour suitable");
    expect(page).not.toContain("Buy guidance");
    expect(page).not.toContain("Buy Recommended");
    expect(page).toContain("Long-horizon start plan");
    expect(page).toContain("48h cold fermentation");
    expect(page).toContain("updateLongHorizonPlan");
    expect(page).toContain("doughStartMode: \"later\"");
    expect(page).toContain("doughEarliestStartTime: option.startIso");
    expect(page).toContain("aria-pressed={longHorizonOptionIsSelected(session, option)}");
    expect(page).toContain("Select this plan");
    expect(page).toContain("Selected plan");
    expect(page).toContain("DoughToolsIcon");
    expect(page).toContain("Select a fermentation plan first");
    expect(page).toContain("Select one of these plans before continuing");
    expect(page).toContain("Selected flour:");
    expect(page).toContain("Recommended flour for 48–72h cold fermentation:");
    expect(page).toContain("recommendedFlourStrengthGuidance");
    expect(page.match(/>Planning guidance<\/p>/g)).toBeNull();
    expect(page.match(/Overall risk/g)).toBeNull();
    expect(page.match(/What to adjust first/g)).toBeNull();
    expect(page.match(/Session planning context/g)).toBeNull();
    expect(page).not.toMatch(/Not enough information/i);
    expect(page).not.toContain("Set the bake target first");
    expect(page).not.toContain("Add a bake date and time to get a stronger planning risk summary.");
    expect(page).not.toContain("Calculator v1");
    expect(page).not.toContain("Calculator v2");
    expect(page.indexOf("title=\"Dough Plan\"")).toBeLessThan(page.indexOf("Choose your fermentation length"));
    expect(page.indexOf("Choose your fermentation length")).toBeLessThan(page.indexOf("<SavePizzaSessionToAccount session={session} />"));
    expect(page.indexOf("Choose your fermentation length")).toBeLessThan(page.indexOf("Make the dough"));
    expect(page.indexOf("title=\"Dough Plan\"")).toBeLessThan(page.indexOf("Make the dough"));
  });

  it("keeps planning guidance primitives unused on the Dough Plan page", () => {
    const component = source("components/session/PlanningGuidance.tsx");
    const page = source("app/session/recipe/page.tsx");

    expect(component).toContain("export function PlanningGuidanceCard");
    expect(component).toContain("export function PlanningStatusCard");
    expect(component).toContain("export function PlanningWatchCard");
    expect(component).toContain("export function PlanningDetailsList");
    expect(component).toContain("export function PlanningDetailRow");
    expect(component).toContain("export function PlanningIllustration");
    expect(component).toContain("sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]");
    expect(component).toContain("sm:text-right");
    expect(component).toContain("break-words");
    expect(component).toContain("<dl");
    expect(component).toContain("<dt");
    expect(component).toContain("<dd");
    expect(page).not.toContain("displayedRiskSummary");
    expect(page).not.toContain("displayedFirstAdjustment");
    expect(page).not.toContain("formatAvailableHours(planningResult.availableFermentationHours)");
    expect(page).not.toContain("planningHighlights.slice(0, 4).map");
    expect(page).not.toContain("fermentationDisplay.label");
    expect(page).not.toContain("fermentationDisplay.temperatureC");
  });

  it("keeps sauce, cheese, toppings and baking gear out of the dough preparation checklist", () => {
    const page = source("app/session/recipe/page.tsx");
    const doughIngredientRowsBlock = page.slice(
      page.indexOf("const doughIngredientRows"),
      page.indexOf("] satisfies Array"),
    );

    expect(page).not.toMatch(/const doughPrepTools[\s\S]*(sauce|cheese|toppings|pizza peel|thermometer|stone|steel)/i);
    expect(doughIngredientRowsBlock).not.toMatch(/sauce|cheese|toppings|pizza peel|thermometer|stone|steel/i);
  });

  it("shows one separate sauce quantity summary without changing the dough ingredient list", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("Make the sauce");
    expect(page).toContain('<details className="min-w-0 rounded-[1.25rem] bg-cream/70 p-3.5 sm:hidden">');
    expect(page).toContain('<section aria-labelledby="session-recipe-sauce-heading" className="hidden min-w-0 rounded-[1.25rem] bg-cream/70 p-3.5 sm:block sm:p-4">');
    expect(page).toContain("Use on pizzas");
    expect(page).toContain("Prepare");
    expect(page).toContain("Shopping");
    expect(page).toContain("Shopping rounds tomato cans separately.");
    expect(page).toContain("calculateSessionPizzaSauce");
    expect(page).toContain("normalizePizzaMixForCount(result.settings.pizzas, session.pizzaMix, session.pizzaPreset)");
    expect(page.indexOf("doughIngredientRows")).toBeLessThan(page.indexOf("sauceSummary"));
  });

  it("moves account save below the main recipe information on mobile without duplicating save behavior", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page.match(/<SavePizzaSessionToAccount session={session} \/>/g)).toHaveLength(1);
    expect(page).toContain('<div className="order-2 mt-4 sm:order-1 sm:mt-0">');
    expect(page).toContain('<section className="order-1 sm:order-2 sm:mt-6" aria-label="Dough plan details">');
    expect(page.indexOf("<SavePizzaSessionToAccount session={session} />")).toBeLessThan(page.indexOf("Make the dough"));
  });

  it("uses the same Sauce helper for Recipe and Shopping sauce quantities", () => {
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-sauce-consistency",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "gas",
      pizzaStyle: "pizza-oven",
    });
    const recipe = buildSessionRecipe(session);
    expect(recipe.ok).toBe(true);
    if (!recipe.ok) throw new Error("Expected recipe result");

    const sauce = calculateSessionPizzaSauce({
      pizzaMix: { margherita: 4 },
      ovenType: recipe.recipeSnapshot.oven,
      pizzaStyle: session.pizzaStyle,
    });
    const shopping = generatePizzaSessionShoppingList({ ...session, recipeSnapshot: recipe.recipeSnapshot }, undefined);
    expect(shopping.ok).toBe(true);
    if (!shopping.ok) throw new Error("Expected shopping result");

    const shoppingSauce = shopping.shoppingList.groups
      .find((group) => group.group === "Sauce")
      ?.items.find((item) => item.label === "Tomato sauce or crushed tomatoes")?.amount;

    expect(sauce.finishedSauceGrams).toBe(280);
    expect(sauce.preparationSauceGrams).toBe(308);
    expect(shoppingSauce).toContain("280 g to use");
    expect(shoppingSauce).toContain("buy 1 x 400 g can");
  });

  it("keeps Shopping as the primary next step from the dough plan page", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("Continue your pizza plan →");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).toContain("BottomActionBar");
    expect(page).not.toContain("Next step");
    expect(page).not.toContain("Next, we’ll build your timeline so you know when to mix, rest, divide, ball, preheat and bake.");
    expect(page).not.toContain("SessionLocalOnlyNote");
    expect(page).not.toContain("{PIZZA_SESSION_LOCAL_ONLY_COPY} Saved locally in this browser.");
    expect(page).not.toContain("href=\"/session/timeline\"");
    expect(page.match(/Continue your pizza plan →/g)).toHaveLength(1);
    expect(page).not.toContain("Edit session choices");
    expect(page).not.toContain("Review setup");
  });

  it("keeps the recipe page focused without bottom navigation or footer clutter", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).not.toContain("Pizza Session navigation");
    expect(page).not.toContain("sessionNavItems");
    expect(page).not.toContain("<AppSignature");
    expect(page).not.toContain('["Start", "/session/start"]');
    expect(page).not.toContain('["Timeline", "/session/timeline"]');
    expect(page).not.toContain('["Shopping", "/session/shopping"]');
    expect(page).not.toContain('["Review", "/session/review"]');
  });

  it("builds calculator-compatible recipe params and a copied recipe snapshot from a complete session", () => {
    const session = createPizzaSession(completeSessionInput, new Date("2026-06-25T10:00:00.000Z"));
    const result = buildSessionRecipe(session);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected session recipe result");

    expect(result.recipeParams).toMatchObject({
      balls: "4",
      ballWeight: "260",
      hydration: "64",
      salt: "2.8",
      yeastType: "ady",
      fermentation: "12h-room",
      oven: "gas",
      flour: "caputo-pizzeria",
      pizzaPreset: "diavola",
    });
    expect(result.recipeSnapshot).toMatchObject({
      balls: 4,
      ballWeight: 260,
      hydration: 64,
      salt: 2.8,
      yeastType: "ady",
      fermentation: "12h-room",
      flour: "caputo-pizzeria",
      oven: "gas",
      pizzaPreset: "diavola",
    });
    expect(result.recipeSnapshot.totalDough).toBeGreaterThan(0);
    expect(result.recipeSnapshot.flourAmount).toBeGreaterThan(0);
    expect(result.recipeSnapshot.waterAmount).toBeGreaterThan(0);
    expect(result.recipeSnapshot.saltAmount).toBeGreaterThan(0);
    expect(result.recipeSnapshot.leavenerAmount).toBeGreaterThan(0);
    const canonicalIngredients = calculateDoughIngredients(result.settings);
    expect(result.ingredients).toEqual(canonicalIngredients);
    expect(result.recipeSnapshot.totalDough).toBeCloseTo(canonicalIngredients.total, 6);
    expect(result.recipeSnapshot.flourAmount).toBeCloseTo(canonicalIngredients.flour, 6);
    expect(result.recipeSnapshot.waterAmount).toBeCloseTo(canonicalIngredients.water, 6);
    expect(result.recipeSnapshot.saltAmount).toBeCloseTo(canonicalIngredients.salt, 6);
    expect(result.recipeSnapshot.leavenerAmount).toBeCloseTo(canonicalIngredients.leavener, 6);
    expect(result.planningInfo.ok).toBe(true);
    if (result.planningInfo.ok) {
      expect(result.planningInfo.result.combinedRiskSummary?.overallRiskLevel).toBeDefined();
      expect(result.planningInfo.result.availableFlourRecommendation).toBeTruthy();
      expect(result.planningInfo.result.yeastGuidance).toBeTruthy();
      expect(result.planningInfo.result.formulaFitGuidance).toBeTruthy();
      expect(result.planningInfo.result.temperatureGuidance).toBeTruthy();
    }
    expect(sessionRecipeQuery(result)).toContain("balls=4");
    expect(sessionRecipeQuery(result)).toContain("pizzaPreset=diavola");
  });

  it("uses the selected Pizza Session yeast type for Dough Plan yeast amounts and recipe snapshots", () => {
    const now = new Date("2026-07-03T12:00:00.000Z");
    const baseSession = {
      ...completeSessionInput,
      targetEatTime: "2026-07-04T18:00",
      doughStartMode: "now" as const,
    };
    const dryResult = buildSessionRecipe(createPizzaSession({ ...baseSession, yeastType: "ady" }, now), now);
    const freshResult = buildSessionRecipe(createPizzaSession({ ...baseSession, yeastType: "cy" }, now), now);
    const instantResult = buildSessionRecipe(createPizzaSession({ ...baseSession, yeastType: "idy" }, now), now);

    expect(dryResult.ok).toBe(true);
    expect(freshResult.ok).toBe(true);
    expect(instantResult.ok).toBe(true);
    if (!dryResult.ok || !freshResult.ok || !instantResult.ok) throw new Error("Expected recipe results");

    expect(dryResult.settings.yeastType).toBe("ady");
    expect(freshResult.settings.yeastType).toBe("cy");
    expect(instantResult.settings.yeastType).toBe("idy");
    expect(dryResult.recipeParams.yeastType).toBe("ady");
    expect(freshResult.recipeSnapshot.yeastType).toBe("cy");
    expect(instantResult.recipeSnapshot.yeastType).toBe("idy");
    expect(freshResult.ingredients.leavener).toBeGreaterThan(dryResult.ingredients.leavener);
    expect(dryResult.ingredients.leavener).toBeGreaterThan(instantResult.ingredients.leavener);
  });

  it("labels Dough Plan yeast amounts with the selected yeast type", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("yeastTypeLabel(result.settings.yeastType)");
    expect(page).toContain("label: `Yeast — ${selectedYeastLabel}`");
    expect(page).toContain("description: `${selectedYeastLabel} amount for this dough plan.`");
    expect(page).toContain("label.startsWith(\"Yeast\")");
  });

  it("shows Pizza Nerd-only hydration and temperature controls in the Dough Plan ingredients card", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("showPizzaNerdControls = session.experienceLevel === \"pizza_nerd\"");
    expect(page).toContain("{showPizzaNerdControls && (");
    expect(page).toContain("Pizza Nerd controls");
    expect(page).toContain("Fine-tune dough behavior.");
    expect(page).toContain("Hydration");
    expect(page).toContain("Temperature");
    expect(page).toContain("aria-label=\"Decrease hydration\"");
    expect(page).toContain("aria-label=\"Increase hydration\"");
    expect(page).toContain("aria-label=\"Decrease fermentation temperature\"");
    expect(page).toContain("aria-label=\"Increase fermentation temperature\"");
    expect(page).toContain("updateHydrationOverride");
    expect(page).toContain("updateTemperatureOverride");
    expect(page).toContain("hydrationPercentOverride: value");
    expect(page).toContain("fermentationTemperatureCOverride: value");
    expect(page).toContain("stepHydrationOverride(-1)");
    expect(page).toContain("stepHydrationOverride(1)");
    expect(page).toContain("stepTemperatureOverride(-1)");
    expect(page).toContain("stepTemperatureOverride(1)");
    expect(page).not.toContain("aria-label=\"Hydration percentage\"");
    expect(page).not.toContain("aria-label={temperatureBounds.label}");
  });

  it("bounds Pizza Nerd hydration and temperature steppers with disabled min and max buttons", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("Math.max(50, Math.min(80, result.settings.hydration + delta))");
    expect(page).toContain("disabled={result.settings.hydration <= 50}");
    expect(page).toContain("disabled={result.settings.hydration >= 80}");
    expect(page).toContain("Math.max(");
    expect(page).toContain("temperatureBounds.min");
    expect(page).toContain("Math.min(temperatureBounds.max, activeFermentationTemperatureC + delta)");
    expect(page).toContain("disabled={activeFermentationTemperatureC <= temperatureBounds.min}");
    expect(page).toContain("disabled={activeFermentationTemperatureC >= temperatureBounds.max}");
    expect(page).toContain("type=\"button\"");
  });

  it("shows compact Pizza Nerd hydration impact guidance only when hydration differs from the default", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("function hydrationImpactMessage");
    expect(page).toContain("current > baseline");
    expect(page).toContain("Higher hydration makes the dough softer and stickier.");
    expect(page).toContain("harder to ball, stretch, and launch");
    expect(page).toContain("current < baseline");
    expect(page).toContain("Lower hydration makes the dough firmer and easier to handle.");
    expect(page).toContain("stretch less easily");
    expect(page).toContain("return null");
    expect(page).toContain("const hydrationImpact = hydrationImpactMessage(result.settings.hydration, defaultHydration)");
    expect(page).toContain("{hydrationImpact && (");
    expect(page).toContain("Hydration impact");
  });

  it("uses active hydration as the Pizza Nerd control default and recalculates ingredients without changing total dough", () => {
    const now = new Date("2026-07-03T12:00:00.000Z");
    const baseSession = createPizzaSession({
      ...completeSessionInput,
      experienceLevel: "pizza_nerd",
      targetEatTime: "2026-07-03T18:00",
      doughStartMode: "now",
    }, now);
    const overrideSession = createPizzaSession({
      ...completeSessionInput,
      experienceLevel: "pizza_nerd",
      targetEatTime: "2026-07-03T18:00",
      doughStartMode: "now",
      hydrationPercentOverride: 70,
    }, now);
    const base = buildSessionRecipe(baseSession, now);
    const override = buildSessionRecipe(overrideSession, now);

    expect(base.ok).toBe(true);
    expect(override.ok).toBe(true);
    if (!base.ok || !override.ok) throw new Error("Expected recipe results");

    expect(base.settings.hydration).toBe(64);
    expect(override.settings.hydration).toBe(70);
    expect(override.recipeSnapshot.hydration).toBe(70);
    expect(override.recipeParams.hydration).toBe("70");
    expect(override.ingredients.total).toBeCloseTo(base.ingredients.total, 6);
    expect(override.ingredients.water).toBeGreaterThan(base.ingredients.water);
    expect(override.ingredients.flour).toBeLessThan(base.ingredients.flour);
    expect(override.recipeSnapshot.waterAmount).toBeCloseTo(override.ingredients.water, 6);
  });

  it("defaults fermentation temperature by mode and lets Pizza Nerd temperature override affect continuous yeast direction", () => {
    const now = new Date("2026-07-02T20:00:00.000Z");
    const room = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      experienceLevel: "pizza_nerd",
      targetEatTime: "2026-07-03T02:00",
      doughStartMode: "now",
    }, now), now);
    const coldDefault = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "cold-default-temp",
      experienceLevel: "pizza_nerd",
      pizzaStyle: "home-oven",
      ovenType: "home",
      pizzaPreset: "margherita",
      targetEatTime: "2026-07-04T12:00",
      doughStartMode: "now",
    }, now), now);
    const coldWarmer = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "cold-warmer-temp",
      experienceLevel: "pizza_nerd",
      pizzaStyle: "home-oven",
      ovenType: "home",
      pizzaPreset: "margherita",
      targetEatTime: "2026-07-04T12:00",
      doughStartMode: "now",
      fermentationTemperatureCOverride: 7,
    }, now), now);
    const coldColder = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "cold-colder-temp",
      experienceLevel: "pizza_nerd",
      pizzaStyle: "home-oven",
      ovenType: "home",
      pizzaPreset: "margherita",
      targetEatTime: "2026-07-04T12:00",
      doughStartMode: "now",
      fermentationTemperatureCOverride: 3,
    }, now), now);

    expect(room.ok).toBe(true);
    expect(coldDefault.ok).toBe(true);
    expect(coldWarmer.ok).toBe(true);
    expect(coldColder.ok).toBe(true);
    if (!room.ok || !coldDefault.ok || !coldWarmer.ok || !coldColder.ok) throw new Error("Expected recipe results");

    expect(room.continuousYeast?.recommendation.fermentationMode).toBe("room");
    expect(room.continuousYeast?.recommendation.temperatureC).toBe(22);
    expect(coldDefault.continuousYeast?.recommendation.fermentationMode).toBe("cold");
    expect(coldDefault.continuousYeast?.recommendation.temperatureC).toBe(4);
    expect(coldWarmer.continuousYeast?.recommendation.temperatureC).toBe(7);
    expect(coldColder.continuousYeast?.recommendation.temperatureC).toBe(3);
    expect(coldWarmer.ingredients.leavener).toBeLessThan(coldDefault.ingredients.leavener);
    expect(coldColder.ingredients.leavener).toBeGreaterThan(coldDefault.ingredients.leavener);
  });

  it("persists Pizza Nerd overrides into the active session and regenerated recipe snapshot", () => {
    const storage = new MemoryStorage();
    const now = new Date("2026-07-03T12:00:00.000Z");
    const session = createAndSavePizzaSession({
      ...completeSessionInput,
      id: "pizza-nerd-overrides",
      experienceLevel: "pizza_nerd",
      targetEatTime: "2026-07-03T18:00",
      doughStartMode: "now",
      hydrationPercentOverride: 68,
      fermentationTemperatureCOverride: 24,
    }, storage, now);
    setActivePizzaSession(session.id, storage);

    const { session: updatedSession, result } = generateAndSaveActiveSessionRecipe(storage, now);

    expect(result.ok).toBe(true);
    expect(updatedSession?.hydrationPercentOverride).toBe(68);
    expect(updatedSession?.fermentationTemperatureCOverride).toBe(24);
    expect(updatedSession?.recipeSnapshot?.hydration).toBe(68);
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("hydrationPercentOverride");
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("fermentationTemperatureCOverride");
  });

  it("feeds regenerated hydration override amounts into downstream Shopping dough quantities", () => {
    const now = new Date("2026-07-03T12:00:00.000Z");
    const baseSession = createPizzaSession({
      ...completeSessionInput,
      id: "shopping-base-hydration",
      targetEatTime: "2026-07-03T18:00",
      doughStartMode: "now",
    }, now);
    const overrideSession = createPizzaSession({
      ...completeSessionInput,
      id: "shopping-override-hydration",
      targetEatTime: "2026-07-03T18:00",
      doughStartMode: "now",
      hydrationPercentOverride: 70,
    }, now);
    const baseRecipe = buildSessionRecipe(baseSession, now);
    const overrideRecipe = buildSessionRecipe(overrideSession, now);
    if (!baseRecipe.ok || !overrideRecipe.ok) throw new Error("Expected recipe results");
    const baseShopping = generatePizzaSessionShoppingList({ ...baseSession, recipeSnapshot: baseRecipe.recipeSnapshot }, undefined, now);
    const overrideShopping = generatePizzaSessionShoppingList({ ...overrideSession, recipeSnapshot: overrideRecipe.recipeSnapshot }, undefined, now);

    expect(baseShopping.ok).toBe(true);
    expect(overrideShopping.ok).toBe(true);
    if (!baseShopping.ok || !overrideShopping.ok) throw new Error("Expected shopping results");

    const baseWater = baseShopping.shoppingList.groups.find((group) => group.group === "Dough")?.items.find((item) => item.label === "Water")?.amount;
    const overrideWater = overrideShopping.shoppingList.groups.find((group) => group.group === "Dough")?.items.find((item) => item.label === "Water")?.amount;

    expect(baseWater).toContain("from Dough Plan");
    expect(overrideWater).toContain("from Dough Plan");
    expect(overrideWater).not.toBe(baseWater);
  });

  it("keeps planning guidance cautious when target time is missing", () => {
    const { targetEatTime, ...withoutTargetTime } = completeSessionInput;
    expect(targetEatTime).toBeDefined();
    const session = createPizzaSession(withoutTargetTime, new Date("2026-06-25T10:00:00.000Z"));
    const result = buildSessionRecipe(session, new Date("2026-06-25T10:00:00.000Z"));

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected session recipe result");
    expect(result.planningInfo).toEqual({ ok: false, missingReason: "missing-target-time" });
    expect(result.recipeSnapshot.flourAmount).toBeGreaterThan(0);
  });

  it("keeps Pizza Session planning interpretation sensible across bake-time horizons", () => {
    const now = new Date("2026-07-02T09:00:00");
    const horizons = [
      {
        label: "same-day",
        targetEatTime: "2026-07-02T16:00",
        hours: 7,
        setup: "same_day_room",
        startWindow: "start_now",
      },
      {
        label: "24h",
        targetEatTime: "2026-07-03T09:00",
        hours: 24,
        setup: "cold_fermentation",
        startWindow: "day_before",
      },
      {
        label: "48h",
        targetEatTime: "2026-07-04T09:00",
        hours: 48,
        setup: "cold_fermentation",
        startWindow: "one_to_three_days_before",
      },
      {
        label: "72h",
        targetEatTime: "2026-07-05T09:00",
        hours: 72,
        setup: "cold_fermentation",
        startWindow: "one_to_three_days_before",
      },
      {
        label: "7d",
        targetEatTime: "2026-07-09T09:00",
        hours: 168,
        setup: "too_long_for_selected_setup",
        startWindow: "not_enough_information",
      },
    ];

    for (const horizon of horizons) {
      const session = createPizzaSession({
        ...completeSessionInput,
        id: `session-recipe-${horizon.label}`,
        pizzaStyle: "home-oven",
        pizzaPreset: "margherita",
        ovenType: "home",
        flour: "tipo-00",
        targetEatTime: horizon.targetEatTime,
      }, now);
      const result = buildSessionRecipe(session, now);
      expect(result.ok).toBe(true);
      if (!result.ok || !result.planningInfo.ok) throw new Error(`Expected planning info for ${horizon.label}`);

      const planning = result.planningInfo.result;
      expect(planning.availableFermentationHours).toBe(horizon.hours);
      expect(planning.fermentationSetupRecommendation?.recommendedSetup).toBe(horizon.setup);
      expect(planning.startWindowRecommendation?.category).toBe(horizon.startWindow);
      if (horizon.hours > 72) {
        expect(result.ingredients).toEqual(calculateDoughIngredients(result.settings));
        expect(result.continuousYeast?.appliedToIngredients).toBe(false);
      } else {
        expect(result.continuousYeast?.appliedToIngredients).toBe(true);
        expect(result.continuousYeast?.recommendation.fermentationHours).toBe(horizon.hours);
        expect(result.continuousYeast?.recommendation.yeastAmountGrams).toBeCloseTo(result.ingredients.leavener, 3);
      }
    }

    const sevenDays = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-seven-day-caution",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-09T09:00",
    }, now), now);
    expect(sevenDays.ok).toBe(true);
    if (!sevenDays.ok || !sevenDays.planningInfo.ok) throw new Error("Expected seven-day planning info");
    expect(sevenDays.planningInfo.result.startWindowRecommendation?.category).not.toBe("start_now");
    expect(sevenDays.planningInfo.result.combinedRiskSummary?.overallRiskLevel).not.toBe("low");
  });

  it("uses continuous yeast basis for same-day room fermentation in the Dough Plan only", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-six-hour-continuous-yeast",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-02T15:00",
      doughStartMode: "now",
    }, now);
    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected session recipe result");

    const canonicalIngredients = calculateDoughIngredients(result.settings);
    expect(result.continuousYeast).toMatchObject({
      appliedToIngredients: true,
      basisLabel: "6 h room fermentation",
    });
    expect(result.continuousYeast?.summary).toBe("Yeast amount is calculated for about 6 h room fermentation.");
    expect(result.continuousYeast?.recommendation.status).toBe("ok");
    expect(result.continuousYeast?.recommendation.directScalingApplied).toBe(true);
    expect(result.continuousYeast?.recommendation.yeastAmountGrams).toBeCloseTo(result.ingredients.leavener, 3);
    expect(result.ingredients.leavener).not.toBeCloseTo(canonicalIngredients.leavener, 6);
  });

  it("keeps old-session dough ball weight defaults by oven setup", () => {
    const pizzaOven = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-default-pizza-oven-ball-weight",
      pizzaStyle: "pizza-oven",
      ovenType: "gas",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      flour: "tipo-00",
    }));
    const homeOven = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-default-home-oven-ball-weight",
      pizzaStyle: "home-oven",
      ovenType: "home",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      flour: "tipo-00",
    }));

    expect(pizzaOven.ok).toBe(true);
    expect(homeOven.ok).toBe(true);
    if (!pizzaOven.ok || !homeOven.ok) throw new Error("Expected recipe defaults");

    expect(pizzaOven.settings.ballWeight).toBe(260);
    expect(pizzaOven.recipeSnapshot.ballWeight).toBe(260);
    expect(homeOven.settings.ballWeight).toBe(270);
    expect(homeOven.recipeSnapshot.ballWeight).toBe(270);
  });

  it("uses selected Dough Ball size options and custom values without changing formula math", () => {
    const now = new Date("2026-07-02T09:00:00");
    const weights = [240, 260, 280, 300];

    for (const weight of weights) {
      const result = buildSessionRecipe(createPizzaSession({
        ...completeSessionInput,
        id: `session-recipe-ball-weight-${weight}`,
        pizzaStyle: "home-oven",
        ovenType: "home",
        pizzaPreset: "margherita",
        pizzaCount: 4,
        flour: "tipo-00",
        doughBallWeight: weight,
        targetEatTime: "2026-07-03T09:00",
        doughStartMode: "now",
      }, now), now);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(`Expected recipe for ${weight} g dough balls`);
      expect(result.settings.ballWeight).toBe(weight);
      expect(result.recipeSnapshot.ballWeight).toBe(weight);
      expect(result.ingredients.total).toBeCloseTo(4 * weight * 1.03, 6);
    }
  });

  it("changes Dough Plan ingredient amounts when dough ball weight changes", () => {
    const now = new Date("2026-07-02T09:00:00");
    const shared = {
      ...completeSessionInput,
      pizzaStyle: "home-oven",
      ovenType: "home",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      flour: "tipo-00",
      targetEatTime: "2026-07-03T09:00",
      doughStartMode: "now" as const,
    };
    const small = buildSessionRecipe(createPizzaSession({ ...shared, id: "small-ball-weight", doughBallWeight: 240 }, now), now);
    const large = buildSessionRecipe(createPizzaSession({ ...shared, id: "large-ball-weight", doughBallWeight: 280 }, now), now);

    expect(small.ok).toBe(true);
    expect(large.ok).toBe(true);
    if (!small.ok || !large.ok) throw new Error("Expected weight comparison recipes");

    expect(small.ingredients.total).toBeCloseTo(988.8, 3);
    expect(large.ingredients.total).toBeCloseTo(1153.6, 3);
    expect(large.ingredients.flour).toBeGreaterThan(small.ingredients.flour);
    expect(large.ingredients.water).toBeGreaterThan(small.ingredients.water);
    expect(large.ingredients.salt).toBeGreaterThan(small.ingredients.salt);
    expect(large.ingredients.leavener).toBeGreaterThan(small.ingredients.leavener);
  });

  it("keeps continuous yeast recalculation aligned with the updated flour amount", () => {
    const now = new Date("2026-07-02T09:00:00");
    const result = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-custom-ball-continuous-yeast",
      pizzaStyle: "home-oven",
      ovenType: "home",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      flour: "tipo-00",
      doughBallWeight: 300,
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now",
    }, now), now);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected custom ball continuous yeast recipe");

    expect(result.settings.ballWeight).toBe(300);
    expect(result.continuousYeast?.appliedToIngredients).toBe(true);
    expect(result.continuousYeast?.recommendation.flourGrams).toBeCloseTo(result.ingredients.flour, 3);
    expect(result.continuousYeast?.recommendation.yeastAmountGrams).toBeCloseTo(result.ingredients.leavener, 3);
  });

  it("uses continuous cold yeast basis for 40h and keeps it between 24h and 48h helper values", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-forty-hour-continuous-yeast",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now",
    }, now);
    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected 40h session recipe result");

    const twentyFourHour = calculateContinuousYeastRecommendation({
      flourGrams: result.ingredients.flour,
      fermentationHours: 24,
      fermentationMode: "cold",
      temperatureC: 4,
      yeastType: "instant_dry_yeast",
    });
    const fortyEightHour = calculateContinuousYeastRecommendation({
      flourGrams: result.ingredients.flour,
      fermentationHours: 48,
      fermentationMode: "cold",
      temperatureC: 4,
      yeastType: "instant_dry_yeast",
    });

    expect(result.continuousYeast).toMatchObject({
      appliedToIngredients: true,
      basisLabel: "40 h cold fermentation",
    });
    expect(result.continuousYeast?.recommendation.status).toBe("ok");
    expect(result.continuousYeast?.recommendation.yeastAmountGrams).toBeCloseTo(result.ingredients.leavener, 3);
    expect(result.ingredients.leavener).toBeLessThan(twentyFourHour.yeastAmountGrams ?? 0);
    expect(result.ingredients.leavener).toBeGreaterThan(fortyEightHour.yeastAmountGrams ?? 0);
  });

  it("uses the remaining time when a recommended dough start has already passed", () => {
    const now = new Date("2026-07-03T15:18:00");
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-missed-recommend-start",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-04T18:00",
      doughStartMode: "recommend",
    }, now);

    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected missed recommendation recipe");

    expect(result.continuousYeast?.appliedToIngredients).toBe(true);
    expect(result.continuousYeast?.availableFermentationHours).toBeGreaterThan(26);
    expect(result.continuousYeast?.availableFermentationHours).toBeLessThan(27);
    expect(result.continuousYeast?.availableFermentationHours).not.toBeCloseTo(30, 1);
    expect(result.continuousYeast?.summary).toContain("Yeast amount is calculated for about 26.7 h cold fermentation.");
  });

  it("uses a future manual later dough start but guards a saved past manual start", () => {
    const now = new Date("2026-07-03T15:18:00");
    const futureStart = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-future-manual-start",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-05T18:00",
      doughStartMode: "later",
      doughEarliestStartTime: "2026-07-04T12:00",
    }, now), now);
    const pastStart = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-past-manual-start",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-04T18:00",
      doughStartMode: "later",
      doughEarliestStartTime: "2026-07-03T12:00",
    }, now), now);

    expect(futureStart.ok).toBe(true);
    expect(pastStart.ok).toBe(true);
    if (!futureStart.ok || !pastStart.ok) throw new Error("Expected manual start recipes");

    expect(futureStart.continuousYeast?.availableFermentationHours).toBe(30);
    expect(pastStart.continuousYeast?.availableFermentationHours).toBeGreaterThan(26);
    expect(pastStart.continuousYeast?.availableFermentationHours).toBeLessThan(27);
  });

  it("uses a selected 24–72h cold fermentation length when the actual window supports it", () => {
    const now = new Date("2026-07-02T09:00:00");
    const defaultFortyHour = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-forty-hour-default-selected-window",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now",
    }, now), now);
    const selectedTwentyFour = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-forty-hour-selected-24h",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now",
      plannedFermentationHours: 24,
    }, now), now);

    expect(defaultFortyHour.ok).toBe(true);
    expect(selectedTwentyFour.ok).toBe(true);
    if (!defaultFortyHour.ok || !selectedTwentyFour.ok) throw new Error("Expected selectable fermentation recipes");

    expect(defaultFortyHour.continuousYeast).toMatchObject({
      availableFermentationHours: 40,
      selectedFermentationHours: 40,
      selectedByUser: false,
    });
    expect(selectedTwentyFour.continuousYeast).toMatchObject({
      availableFermentationHours: 40,
      selectedFermentationHours: 24,
      selectedByUser: true,
      basisLabel: "24 h cold fermentation",
    });
    expect(selectedTwentyFour.ingredients.leavener).toBeGreaterThan(defaultFortyHour.ingredients.leavener);
    expect(selectedTwentyFour.flourWGuidance?.recommendationLabel).toBe("W 260–300");
  });

  it("ignores selected cold fermentation length for under-24h and over-72h windows", () => {
    const now = new Date("2026-07-02T09:00:00");
    const under24 = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-under-24h-selector-ignored",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-02T15:00",
      doughStartMode: "now",
      plannedFermentationHours: 24,
    }, now), now);
    const over72 = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-over-72h-selector-ignored",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-10T09:00",
      doughStartMode: "now",
      plannedFermentationHours: 48,
    }, now), now);

    expect(under24.ok).toBe(true);
    expect(over72.ok).toBe(true);
    if (!under24.ok || !over72.ok) throw new Error("Expected selector guard recipes");

    expect(under24.continuousYeast).toMatchObject({
      selectedFermentationHours: 6,
      selectedByUser: false,
    });
    expect(over72.continuousYeast).toMatchObject({
      appliedToIngredients: false,
      selectedFermentationHours: 192,
      selectedByUser: false,
    });
  });

  it("uses dough start availability instead of full time until bake for continuous yeast basis", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-later-start-continuous-yeast",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-05T09:00",
      doughStartMode: "later",
      doughEarliestStartTime: "2026-07-03T17:00",
    }, now);
    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected later-start session recipe result");

    expect(result.planningInfo.ok && result.planningInfo.result.availableFermentationHours).toBe(72);
    expect(result.continuousYeast).toMatchObject({
      appliedToIngredients: true,
      basisLabel: "40 h cold fermentation",
    });
    expect(result.continuousYeast?.summary).toBe("Yeast amount is calculated for about 40 h cold fermentation.");
  });

  it("keeps 72h cold fermentation direct but cautionary in Dough Plan yeast basis", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-seventy-two-hour-continuous-yeast",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-05T09:00",
      doughStartMode: "now",
    }, now);
    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected 72h session recipe result");

    expect(result.continuousYeast).toMatchObject({
      appliedToIngredients: true,
      basisLabel: "72 h cold fermentation",
    });
    expect(result.continuousYeast?.recommendation.riskLevel).toBe("caution");
    expect(result.continuousYeast?.recommendation.cautions.join(" ")).toContain("upper direct-scaling limit");
  });

  it("does not calculate full-horizon yeast for over-72h Dough Plan windows", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-over-seventy-two-hour-yeast-fallback",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-10T09:00",
      doughStartMode: "now",
    }, now);
    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected over-72h session recipe result");

    expect(result.continuousYeast).toMatchObject({
      appliedToIngredients: false,
      basisLabel: "192 h cold fermentation",
    });
    expect(result.continuousYeast?.recommendation.status).toBe("long_horizon_required");
    expect(result.continuousYeast?.recommendation.yeastAmountGrams).toBeNull();
    expect(result.continuousYeast?.summary).toContain("not calculated for the full long-horizon window");
    expect(result.ingredients).toEqual(calculateDoughIngredients(result.settings));
  });

  it("uses a selected long-horizon option as the actual fermentation plan", () => {
    const now = new Date("2026-07-02T09:00:00");
    const target = new Date("2026-07-10T09:00:00");
    const selectedStart = new Date(target.getTime() - 48 * 3_600_000).toISOString();
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-selected-long-horizon-plan",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_260_300"],
      targetEatTime: "2026-07-10T09:00",
      doughStartMode: "later",
      doughEarliestStartTime: selectedStart,
      plannedFermentationHours: 48,
    }, now);
    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok || !result.planningInfo.ok) throw new Error("Expected selected long-horizon recipe");

    const longHorizon = buildLongHorizonStartRecommendation({
      planningResult: result.planningInfo.result,
      selectedFlourLabel: "Pizza flour / Tipo 00",
    });

    expect(longHorizon?.options.map((option) => option.durationHours)).toEqual([24, 48, 72]);
    expect(longHorizon?.options.find((option) => option.durationHours === 48)?.startIso).toBe(selectedStart);
    expect(result.continuousYeast).toMatchObject({
      appliedToIngredients: true,
      basisLabel: "48 h cold fermentation",
      availableFermentationHours: 48,
      selectedFermentationHours: 48,
      selectedByUser: true,
    });
    expect(result.continuousYeast?.recommendation.status).toBe("ok");
    expect(result.continuousYeast?.recommendation.yeastAmountGrams).toBeCloseTo(result.ingredients.leavener, 3);
    expect(result.flourWGuidance).toMatchObject({
      status: "ok",
      recommendationLabel: "W 260–300",
      fitLevel: "suitable",
    });
  });

  it("recommends same-day W-value ranges for a 6h room fermentation window", () => {
    const now = new Date("2026-07-02T09:00:00");
    const result = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-six-hour-flour-w",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_180_220"],
      targetEatTime: "2026-07-02T15:00",
      doughStartMode: "now",
    }, now), now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected 6h W guidance");

    expect(result.flourWGuidance).toMatchObject({
      status: "ok",
      recommendationLabel: "W 180–260",
      saferChoiceLabel: "W 220–260",
      fitLevel: "caution",
    });
    expect(result.flourWGuidance?.summary).toContain("6 h room fermentation");
    expect(result.flourWGuidance?.availableFlourSummary).toContain("W 180–220");
  });

  it("recommends W 260–300 for a 24h cold fermentation window", () => {
    const now = new Date("2026-07-02T09:00:00");
    const result = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-24h-flour-w",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_260_300"],
      targetEatTime: "2026-07-03T09:00",
      doughStartMode: "now",
    }, now), now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected 24h W guidance");

    expect(result.flourWGuidance).toMatchObject({
      status: "ok",
      recommendationLabel: "W 260–300",
      fitLevel: "suitable",
    });
    expect(result.flourWGuidance?.summary).toContain("24 h cold fermentation");
  });

  it("recommends W 260–300 for a 40h cold fermentation window and handles buy guidance", () => {
    const now = new Date("2026-07-02T09:00:00");
    const result = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-40h-flour-buy",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "recommend",
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now",
    }, now), now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected 40h buy guidance");

    expect(result.flourWGuidance).toMatchObject({
      status: "ok",
      recommendationLabel: "W 260–300",
      fitLevel: "buy_recommended",
      availableFlourLabel: "No flour selected — recommend what to buy",
    });
    expect(result.flourWGuidance?.availableFlourSummary).toContain("No flour selected");
    expect(result.flourWGuidance?.recommendedBuySummary).toContain("Buy flour around W 260–300");
  });

  it("normalizes legacy unknown-W sessions to recommend-buy guidance for a 40h cold fermentation window", () => {
    const now = new Date("2026-07-02T09:00:00");
    const result = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-40h-flour-unknown",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "unknown_w",
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now",
    }, now), now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected normalized W guidance");

    expect(result.flourWGuidance).toMatchObject({
      recommendationLabel: "W 260–300",
      fitLevel: "buy_recommended",
    });
    expect(result.flourWGuidance?.availableFlourSummary).toContain("No flour selected");
    expect(result.flourWGuidance?.recommendedBuySummary).toContain("Buy flour around W 260–300");
  });

  it("compares available W ranges with a 40h cold recommendation", () => {
    const now = new Date("2026-07-02T09:00:00");
    const suitable = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-40h-flour-suitable",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_260_300"],
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now",
    }, now), now);
    const caution = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-40h-flour-caution",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_180_220"],
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now",
    }, now), now);

    expect(suitable.ok).toBe(true);
    expect(caution.ok).toBe(true);
    if (!suitable.ok || !caution.ok) throw new Error("Expected W range comparison guidance");

    expect(suitable.flourWGuidance?.fitLevel).toBe("suitable");
    expect(suitable.flourWGuidance?.availableFlourSummary).toContain("W 260–300");
    expect(caution.flourWGuidance?.fitLevel).toBe("caution");
    expect(caution.flourWGuidance?.recommendationLabel).toBe("W 260–300");
    expect(caution.flourWGuidance?.availableFlourSummary).toContain("W 180–220");
    expect(caution.flourWGuidance?.cautions.join(" ")).toContain("not changing your selected flour");
  });

  it("keeps W 260–300 for exactly 48h cold and recommends W 300–340 for 72h cold", () => {
    const now = new Date("2026-07-02T09:00:00");
    const fortyEight = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-48h-flour-w",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-04T09:00",
      doughStartMode: "now",
    }, now), now);
    const seventyTwo = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-72h-flour-w",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_300_340"],
      targetEatTime: "2026-07-05T09:00",
      doughStartMode: "now",
    }, now), now);

    expect(fortyEight.ok).toBe(true);
    expect(seventyTwo.ok).toBe(true);
    if (!fortyEight.ok || !seventyTwo.ok) throw new Error("Expected 48h/72h W guidance");

    expect(fortyEight.flourWGuidance?.recommendationLabel).toBe("W 260–300");
    expect(seventyTwo.flourWGuidance).toMatchObject({
      recommendationLabel: "W 300–340",
      fitLevel: "suitable",
    });
    expect(seventyTwo.flourWGuidance?.cautions.join(" ")).toContain("48–72h cold fermentation");
  });

  it("does not recommend W-value for a full over-72h long-horizon fermentation", () => {
    const now = new Date("2026-07-02T09:00:00");
    const result = buildSessionRecipe(createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-long-horizon-flour-w",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_300_340"],
      targetEatTime: "2026-07-10T09:00",
      doughStartMode: "now",
    }, now), now);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected long-horizon W guidance");

    expect(result.flourWGuidance).toMatchObject({
      status: "long_horizon",
      fitLevel: "long_horizon",
      recommendationLabel: "Use the 24h / 48h / 72h long-horizon options",
    });
    expect(result.flourWGuidance?.summary).toContain("Do not choose flour for a full 192 h fermentation");
    expect(result.flourWGuidance?.recommendedBuySummary).toContain("24h around W 220–260");
  });

  it("keeps available flour separate from recommended W range and does not alter ingredient amounts", () => {
    const now = new Date("2026-07-02T09:00:00");
    const shared = {
      ...completeSessionInput,
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-04T01:00",
      doughStartMode: "now" as const,
    };
    const weakFlour = buildSessionRecipe(createPizzaSession({
      ...shared,
      id: "session-recipe-flour-guidance-no-ingredient-change-weak",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_180_220"],
    }, now), now);
    const recommendedBuy = buildSessionRecipe(createPizzaSession({
      ...shared,
      id: "session-recipe-flour-guidance-no-ingredient-change-buy",
      flourSituation: "recommend",
    }, now), now);

    expect(weakFlour.ok).toBe(true);
    expect(recommendedBuy.ok).toBe(true);
    if (!weakFlour.ok || !recommendedBuy.ok) throw new Error("Expected ingredient stability comparison");

    expect(weakFlour.flourWGuidance?.recommendationLabel).toBe("W 260–300");
    expect(weakFlour.flourWGuidance?.availableFlourSummary).toContain("W 180–220");
    expect(recommendedBuy.flourWGuidance?.availableFlourSummary).toContain("No flour selected");
    expect(weakFlour.ingredients).toEqual(recommendedBuy.ingredients);
  });

  it("builds a useful long-horizon start recommendation without changing selected flour or ingredients", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-eight-day-long-horizon",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-10T18:00",
    }, now);
    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok || !result.planningInfo.ok) throw new Error("Expected long-horizon planning info");

    const recommendation = buildLongHorizonStartRecommendation({
      planningResult: result.planningInfo.result,
      selectedFlourLabel: "Pizza flour / Tipo 00",
    });

    expect(recommendation).toMatchObject({
      title: "Do not start immediately",
      selectedFlourLabel: "Pizza flour / Tipo 00",
      recommendedDurationHours: 48,
      recommendedFlourLabel: "Bread flour / strong flour",
    });
    expect(recommendation?.recommendedStartIso).toBe(new Date("2026-07-08T18:00").toISOString());
    expect(recommendation?.options.map((option) => option.durationHours)).toEqual([24, 48, 72]);
    expect(recommendation?.options.map((option) => option.startIso)).toEqual([
      new Date("2026-07-09T18:00").toISOString(),
      new Date("2026-07-08T18:00").toISOString(),
      new Date("2026-07-07T18:00").toISOString(),
    ]);
    expect(recommendation?.options[0]?.flourGuidance).toContain("Pizza flour / Tipo 00");
    expect(recommendation?.options[0]?.flourGuidance).toContain("approx. W 220–260");
    expect(recommendation?.options[1]?.flourGuidance).toContain("stronger Tipo 00 or bread flour");
    expect(recommendation?.options[1]?.flourGuidance).toContain("approx. W 260–300");
    expect(recommendation?.options[2]?.flourGuidance).toContain("strong flour");
    expect(recommendation?.options[2]?.flourGuidance).toContain("approx. W 300–330+");
    expect(recommendation?.recommendedFlourStrengthGuidance).toBe("approx. W 260–330+");
    expect(result.ingredients).toEqual(calculateDoughIngredients(result.settings));
  });

  it("calculates deterministic long-horizon option start dates from the bake target", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      ...completeSessionInput,
      id: "session-recipe-long-horizon-noon-target",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      ovenType: "home",
      flour: "tipo-00",
      targetEatTime: "2026-07-10T12:00",
    }, now);
    const result = buildSessionRecipe(session, now);
    expect(result.ok).toBe(true);
    if (!result.ok || !result.planningInfo.ok) throw new Error("Expected noon-target planning info");

    const recommendation = buildLongHorizonStartRecommendation({
      planningResult: result.planningInfo.result,
      selectedFlourLabel: "Pizza flour / Tipo 00",
    });

    expect(recommendation?.options.map((option) => ({
      durationHours: option.durationHours,
      startIso: option.startIso,
      wValueGuidance: option.wValueGuidance,
    }))).toEqual([
      { durationHours: 24, startIso: new Date("2026-07-09T12:00").toISOString(), wValueGuidance: "approx. W 220–260" },
      { durationHours: 48, startIso: new Date("2026-07-08T12:00").toISOString(), wValueGuidance: "approx. W 260–300" },
      { durationHours: 72, startIso: new Date("2026-07-07T12:00").toISOString(), wValueGuidance: "approx. W 300–330+" },
    ]);
    expect(recommendation?.recommendedStartIso).toBe(new Date("2026-07-08T12:00").toISOString());
    expect(recommendation?.selectedFlourLabel).toBe("Pizza flour / Tipo 00");
    expect(recommendation?.recommendedFlourLabel).toBe("Bread flour / strong flour");
    expect(result.ingredients).toEqual(calculateDoughIngredients(result.settings));
  });

  it("shows safe missing states instead of inventing unsupported data", () => {
    expect(buildSessionRecipe(undefined)).toEqual({ ok: false, missingReason: "no-session" });
    expect(buildSessionRecipe(createPizzaSession({ pizzaPreset: "margherita", pizzaCount: 2, flour: "tipo-00" })))
      .toEqual({ ok: false, missingReason: "missing-path" });
    expect(buildSessionRecipe(createPizzaSession({ pizzaStyle: "home-oven", pizzaCount: 2, flour: "tipo-00" })))
      .toEqual({ ok: false, missingReason: "missing-preset" });
    expect(buildSessionRecipe(createPizzaSession({ pizzaStyle: "home-oven", pizzaPreset: "margherita", flour: "tipo-00" })))
      .toEqual({ ok: false, missingReason: "missing-quantity" });
    const safeDefault = buildSessionRecipe(createPizzaSession({ pizzaStyle: "home-oven", pizzaPreset: "margherita", pizzaCount: 2, flour: "not-sure" }));
    expect(safeDefault.ok).toBe(true);
    if (safeDefault.ok) expect(safeDefault.settings.flourId).toBe("caputo-pizzeria");
  });

  it("saves recipe params and snapshot into the active Pizza Session without changing other session fields", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession(
      {
        ...completeSessionInput,
        timeline: {
          generatedAt: "2026-06-25T11:00:00.000Z",
          steps: [{ id: "mix", label: "Mix dough", status: "todo" }],
        },
        shoppingList: {
          presetId: "diavola",
          presetName: "Diavola",
          groups: [{ group: "Dough", items: [{ id: "flour", label: "Pizza flour", status: "need_to_buy" }] }],
        },
      },
      storage,
      new Date("2026-06-25T10:00:00.000Z"),
    );
    setActivePizzaSession(session.id, storage);

    const { session: updatedSession, result } = generateAndSaveActiveSessionRecipe(
      storage,
      new Date("2026-06-25T10:15:00.000Z"),
    );

    expect(result.ok).toBe(true);
    expect(updatedSession).toBeDefined();
    expect(updatedSession?.id).toBe(session.id);
    expect(updatedSession?.currentStep).toBe("recipe");
    expect(updatedSession?.updatedAt).toBe("2026-06-25T10:15:00.000Z");
    expect(updatedSession?.lastSavedAt).toBe("2026-06-25T10:15:00.000Z");
    expect(updatedSession?.targetEatTime).toBe("2026-06-27T18:30");
    expect(updatedSession?.pizzaStyle).toBe("pizza-oven");
    expect(updatedSession?.pizzaPreset).toBe("diavola");
    expect(updatedSession?.pizzaCount).toBe(4);
    expect(updatedSession?.ovenType).toBe("gas");
    expect(updatedSession?.flour).toBe("tipo-00");
    expect(updatedSession?.timeline?.steps[0]?.label).toBe("Mix dough");
    expect(updatedSession?.shoppingList?.presetName).toBe("Diavola");
    expect(updatedSession?.recipeParams?.balls).toBe("4");
    expect(updatedSession?.recipeSnapshot?.flourAmount).toBeGreaterThan(0);
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("recipeSnapshot");
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).not.toContain("planningInfo");
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).not.toContain("continuousYeast");
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).not.toContain("combinedRiskSummary");
    expect(storage.getItem(ACTIVE_PIZZA_SESSION_STORAGE_KEY)).toBe(session.id);
    expect(getPizzaSession(session.id, storage)?.currentStep).toBe("recipe");
  });

  it("keeps representative dough calculations unchanged", () => {
    const settings: RecipeSettings = {
      pizzas: 6,
      ballWeight: 260,
      waste: 3,
      hydration: 64,
      salt: 2.8,
      yeastType: "idy",
      fermentation: "24h-cold",
      temperature: 4,
      goal: "balanced",
      ovenType: "gas",
      flourId: "caputo-pizzeria",
      pizzaStyleId: "neapolitan",
    };
    const ingredients = calculateDoughIngredients(settings);

    expect(ingredients.total).toBeCloseTo(1606.8, 1);
    expect(ingredients.flour).toBeCloseTo(962.71, 2);
    expect(ingredients.water).toBeCloseTo(616.14, 2);
    expect(ingredients.salt).toBeCloseTo(26.96, 2);
    expect(ingredients.leavener).toBeCloseTo(0.99, 2);
  });

  it("keeps topping presets as a compatibility bridge instead of renaming stored session data", () => {
    const recipeSource = source("lib/session-recipe.ts");

    expect(recipeSource).toContain("Compatibility bridge: `pizzaPreset` is retained as legacy topping/shopping");
    expect(recipeSource).toContain("without changing topping preset storage");
    expect(recipeSource).toContain("const presetToStyle");
    expect(recipeSource).toContain("margherita: \"neapolitan\"");
    expect(recipeSource).toContain("\"pepperoni-salami\": \"new-york\"");
  });

  it("connects the wizard, shopping and timeline routes to the recipe step without changing security copy", () => {
    const startPage = source("app/session/start/page.tsx");
    const recipePage = source("app/session/recipe/page.tsx");
    const timelinePage = source("app/session/timeline/page.tsx");
    const shoppingPage = source("app/session/shopping/page.tsx");
    const recipeDoc = source("docs/session-recipe-build-step.md");
    const dataDoc = source("docs/pizza-session-data-model.md");
    const wizardDoc = source("docs/start-pizza-session-wizard.md");
    const seoConfig = source("lib/seo-config.ts");

    expect(startPage).toContain("const continueToRecipe = async (options: { replaceActiveCloudSession?: boolean } = {})");
    expect(startPage).toContain("savePizzaSession(readyForRecipe)");
    expect(startPage).toContain("await materializeCloudBackedPizzaSession(saved,");
    expect(startPage).toContain("router.push(\"/session/recipe\")");
    expect(startPage).toContain("Choose your oven");
    expect(startPage).toContain("Choose your pizza style");
    expect(startPage).toContain("DoughTools currently plans Neapolitan-style pizza for home ovens and pizza ovens. Toppings are chosen later for the shopping list.");
    expect(startPage).not.toContain("What pizza are you making?");
    expect(startPage).toContain("disabled={!canContinue}");
    expect(startPage).not.toContain("What pizza do you want to make?");
    expect(startPage).not.toContain("Later planner patches can turn this into a full timeline");
    expect(recipePage).toContain('href="/session/shopping"');
    expect(shoppingPage).toContain('href="/session/timeline"');
    expect(timelinePage).toContain('href="/session/shopping"');
    expect(timelinePage).not.toContain("Review dough plan");
    expect(shoppingPage).not.toContain("Review dough plan");
    expect(timelinePage).toContain("/session/kitchen");
    expect(shoppingPage).toContain("Continue to Timeline");
    expect(recipePage).not.toContain("sessionRecipeQuery");
    expect(recipeDoc).toContain("/session/recipe");
    expect(dataDoc).toContain("When `currentStep` is `recipe`, Continue Session resumes at `/session/recipe`.");
    expect(wizardDoc).toContain("Patch 150 separates early dough planning from topping/shopping choices");
    expect(seoConfig).toContain("ALLOW_INDEXING");
    expect([startPage, recipePage, timelinePage, shoppingPage, recipeDoc].join("\n")).not.toMatch(/analytics added|tracking added|Google indexing enabled|Cloud sync is active/i);
  });
});
