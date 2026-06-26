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
    expect(page).toContain("Your dough plan is ready.");
    expect(page).toContain("Here are your dough amounts and what you need before you start.");
    expect(page).toContain("Continue to Timeline");
    expect(page).toContain("← Back to Start");
    expect(page).toContain('href="/session/start"');
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
    const guidanceBadgeUses = page.match(/<GuidanceModeBadge level=\{session.experienceLevel\} \/>/g) ?? [];

    expect(guidanceBadgeUses).toHaveLength(1);
    expect(page).not.toContain("Session summary");
    expect(page).not.toContain('["Pizza preset",');
    expect(page).not.toContain('["Target time",');
    expect(page).not.toContain('["Pizza count",');
    expect(page).not.toContain('["Ball weight",');
    expect(page).not.toContain('["Baking path",');
    expect(page).not.toContain("lg:grid-cols-[21rem_1fr]");
  });

  it("shows preparation guidance before dough amounts and the next step", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("Dough amounts");
    expect(page).toContain("Total dough");
    expect(page).toContain("Flour");
    expect(page).toContain("Water");
    expect(page).toContain("Salt");
    expect(page).toContain("Yeast");
    expect(page).toContain("Use these amounts when mixing your dough. We recommend weighing ingredients with a digital scale.");
    expect(page).toContain("Yeast can be a very small amount. A precision scale helps.");
    expect(page).toContain("Before you start: get these ready");
    expect(page).toContain("You only need the ingredients for the dough and a few basic tools.");
    expect(page).toContain("Ingredients for the dough");
    expect(page).toContain("const doughPrepIngredients = [\"Flour\", \"Water\", \"Salt\", \"Yeast\"]");
    expect(page).toContain("const doughPrepTools = [\"Digital scale\", \"Mixing bowl\", \"Dough scraper or sturdy spoon\", \"Covered container or bowl\"]");
    expect(page).toContain("That’s it. You don’t need anything else to make the dough.");
    expect(page.indexOf("Before you start: get these ready")).toBeLessThan(page.indexOf("Dough amounts"));
    expect(page.indexOf("Dough amounts")).toBeLessThan(page.indexOf("Next step"));
  });

  it("keeps sauce, cheese, toppings and baking gear out of the dough preparation checklist", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).not.toMatch(/Ingredients for the dough[\s\S]*(sauce|cheese|toppings|pizza peel|thermometer|baking stone|baking steel)/i);
    expect(page).not.toMatch(/const doughPrepIngredients[\s\S]*(sauce|cheese|toppings|pizza peel|thermometer|stone|steel)/i);
    expect(page).not.toMatch(/const doughPrepTools[\s\S]*(sauce|cheese|toppings|pizza peel|thermometer|stone|steel)/i);
  });

  it("keeps Timeline as the primary next step from the dough plan page", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("Next step");
    expect(page).toContain("Next, we’ll build your timeline so you know when to mix, rest, divide, ball, preheat and bake.");
    expect(page).toContain("Continue to Timeline →");
    expect(page).toContain("href=\"/session/timeline\"");
    expect(page).not.toContain("href=\"/session/shopping\"");
    expect(page.match(/Continue to Timeline →/g)).toHaveLength(1);
    expect(page).not.toContain("Edit session choices");
    expect(page).not.toContain("Review setup");
  });

  it("keeps the light bottom session navigation with Recipe active", () => {
    const page = source("app/session/recipe/page.tsx");

    expect(page).toContain("Pizza Session navigation");
    expect(page).toContain('["Start", "/session/start"]');
    expect(page).toContain('["Timeline", "/session/timeline"]');
    expect(page).toContain('["Recipe", "/session/recipe"]');
    expect(page).toContain('["Shopping", "/session/shopping"]');
    expect(page).toContain('["Review", "/session/review"]');
    expect(page).toContain('aria-current={label === "Recipe" ? "page" : undefined}');
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
    expect(sessionRecipeQuery(result)).toContain("balls=4");
    expect(sessionRecipeQuery(result)).toContain("pizzaPreset=diavola");
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
    expect(startPage).toContain("What kind of pizza are you making?");
    expect(startPage).toContain("disabled={!canContinue}");
    expect(startPage).not.toContain("What pizza do you want to make?");
    expect(startPage).not.toContain("Later planner patches can turn this into a full timeline");
    expect(timelinePage).toContain("Back to Recipe");
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
