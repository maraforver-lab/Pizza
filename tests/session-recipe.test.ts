import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { createPizzaSession } from "@/lib/pizza-session";
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
    expect(page).toContain("Your dough plan is ready.");
    expect(page).toContain("Get your dough ingredients and amounts ready before you start.");
    expect(page).toContain("Continue to Timeline");
    expect(page).toContain("Back");
    expect(page).toContain('href="/session/start"');
    expect(page).toContain('href="/session/timeline"');
    expect(page).not.toContain("Save and continue later");
    expect(page).not.toContain("Open Shopping List");
    expect(page).not.toContain("Open full Calculator");
    expect(page).not.toContain("Open Dough Doctor");
    expect(page).toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
    expect(page).toContain("No cloud sync, tracking or public sharing is active.");
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
    expect(page).not.toContain("Step 6: Dough plan");
    expect(page).not.toContain("Before this, you set up the basics.");
    expect(page).not.toContain("After this, the timeline, shopping list, kitchen mode and review come next.");
    expect(page).not.toContain("Current journey step");
    expect(page).not.toContain("Pizza Session V2 journey");
    expect(journeyDoc).toContain("| 6 | Dough plan | `/session/recipe`");
    expect(journeyDoc).toContain("Continue to Timeline →");
  });

  it("shows preparation guidance before dough amounts and the next step", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).not.toContain("Get ready to mix");
    expect(page).not.toContain("Gather your ingredients and tools, and measure everything before you start.");
    expect(page).toContain("Ingredients & amounts");
    expect(page).toContain("Weigh for best results");
    expect(page).toContain("Total dough");
    expect(page).toContain("Flour");
    expect(page).toContain("Water");
    expect(page).toContain("Salt");
    expect(page).toContain("Yeast");
    expect(page).toContain("Use these amounts when mixing your dough.");
    expect(page).not.toContain("Use a digital scale for best accuracy. That’s enough to start the dough.");
    expect(page).not.toContain("Yeast can be a very small amount. A precision scale helps.");
    expect(page).toContain("Tools");
    expect(page).toContain("Have these ready");
    expect(page).toContain('label: "Digital scale"');
    expect(page).toContain('label: "Mixing bowl"');
    expect(page).toContain('label: "Dough scraper or sturdy spoon"');
    expect(page).toContain('label: "Covered container or bowl"');
    expect(page).toContain("Dough planning notes");
    expect(page).toContain("Planning guidance is based on available session choices.");
    expect(page).toContain("Overall risk");
    expect(page).toContain("What to adjust first");
    expect(page).toContain("Session planning context");
    expect(page).toContain("Long-horizon start plan");
    expect(page).toContain("48h cold fermentation");
    expect(page).toContain("Selected flour:");
    expect(page).toContain("Recommended flour for 48–72h cold fermentation:");
    expect(page).not.toContain("Calculator v1");
    expect(page).not.toContain("Calculator v2");
    expect(page.indexOf("Your dough plan is ready.")).toBeLessThan(page.indexOf("Ingredients & amounts"));
  });

  it("keeps sauce, cheese, toppings and baking gear out of the dough preparation checklist", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).not.toMatch(/const doughPrepTools[\s\S]*(sauce|cheese|toppings|pizza peel|thermometer|stone|steel)/i);
    expect(page).not.toMatch(/doughIngredientRows[\s\S]*(sauce|cheese|toppings|pizza peel|thermometer|stone|steel)/i);
  });

  it("keeps Timeline as the primary next step from the dough plan page", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("Continue to Timeline →");
    expect(page).toContain("href=\"/session/timeline\"");
    expect(page).toContain("BottomActionBar");
    expect(page).not.toContain("Next step");
    expect(page).not.toContain("Next, we’ll build your timeline so you know when to mix, rest, divide, ball, preheat and bake.");
    expect(page).not.toContain("SessionLocalOnlyNote");
    expect(page).not.toContain("{PIZZA_SESSION_LOCAL_ONLY_COPY} Saved locally in this browser.");
    expect(page).not.toContain("href=\"/session/shopping\"");
    expect(page.match(/Continue to Timeline →/g)).toHaveLength(1);
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
      yeastType: "idy",
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
      yeastType: "idy",
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
      expect(result.ingredients).toEqual(calculateDoughIngredients(result.settings));
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
      title: "Do not start today",
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
    expect(recommendation?.options[1]?.flourGuidance).toContain("stronger Tipo 00 or bread flour");
    expect(recommendation?.options[2]?.flourGuidance).toContain("strong flour");
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

  it("connects the wizard, timeline and shopping routes to the recipe step without changing security copy", () => {
    const startPage = source("app/session/start/page.tsx");
    const recipePage = source("app/session/recipe/page.tsx");
    const timelinePage = source("app/session/timeline/page.tsx");
    const shoppingPage = source("app/session/shopping/page.tsx");
    const recipeDoc = source("docs/session-recipe-build-step.md");
    const dataDoc = source("docs/pizza-session-data-model.md");
    const wizardDoc = source("docs/start-pizza-session-wizard.md");
    const seoConfig = source("lib/seo-config.ts");

    expect(startPage).toContain("href=\"/session/recipe\"");
    expect(startPage).toContain("How will you bake your pizza?");
    expect(startPage).toContain("What pizza are you making?");
    expect(startPage).toContain("disabled={!canContinue}");
    expect(startPage).not.toContain("What pizza do you want to make?");
    expect(startPage).not.toContain("Later planner patches can turn this into a full timeline");
    expect(timelinePage).toContain('href="/session/recipe"');
    expect(timelinePage).not.toContain("Review dough plan");
    expect(shoppingPage).not.toContain("Review dough plan");
    expect(timelinePage).toContain("/session/kitchen");
    expect(shoppingPage).toContain("/session/kitchen");
    expect(recipePage).not.toContain("sessionRecipeQuery");
    expect(recipeDoc).toContain("/session/recipe");
    expect(dataDoc).toContain("When `currentStep` is `recipe`, Continue Session resumes at `/session/recipe`.");
    expect(wizardDoc).toContain("Pizza preset is now a separate choice");
    expect(seoConfig).toContain("ALLOW_INDEXING");
    expect([startPage, recipePage, timelinePage, shoppingPage, recipeDoc].join("\n")).not.toMatch(/analytics added|tracking added|Google indexing enabled|Cloud sync is active/i);
  });
});
