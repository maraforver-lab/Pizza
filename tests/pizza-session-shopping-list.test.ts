import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createPizzaSession } from "@/lib/pizza-session";
import {
  ACTIVE_PIZZA_SESSION_STORAGE_KEY,
  createAndSavePizzaSession,
  getActivePizzaSession,
  PIZZA_SESSIONS_STORAGE_KEY,
  setActivePizzaSession,
} from "@/lib/pizza-session-storage";
import {
  pizzaSessionPresets,
  REQUIRED_PIZZA_PRESET_IDS,
} from "@/lib/pizza-session-presets";
import {
  adjustPizzaMixAllocation,
  formatShoppingListPlainText,
  generateAndSaveActiveShoppingList,
  generatePizzaSessionShoppingList,
  normalizePizzaMixForCount,
  PIZZA_MIX_OPTIONS,
  savePizzaSessionMenuMix,
  SHOPPING_LIST_LOCAL_ONLY_COPY,
  updateShoppingItemStatus,
} from "@/lib/pizza-session-shopping-list";
import { shoppingPizzaImageList } from "@/lib/shopping-pizza-images";
import { patchHistory } from "@/lib/changelog";
import { MemoryStorage } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

function shoppingItems(result: ReturnType<typeof generatePizzaSessionShoppingList>) {
  expect(result.ok).toBe(true);
  if (!result.ok) return [];
  return result.shoppingList.groups.flatMap((group) => group.items);
}

function itemAmount(result: ReturnType<typeof generatePizzaSessionShoppingList>, label: string) {
  return shoppingItems(result).find((item) => item.label === label)?.amount;
}

function mixTotal(mix: Record<string, number>) {
  return Object.values(mix).reduce((total, count) => total + count, 0);
}

describe("Pizza Session shopping list presets", () => {
  it("defines all required pizza presets with grouped ingredients", () => {
    expect(pizzaSessionPresets.map((preset) => preset.id)).toEqual(REQUIRED_PIZZA_PRESET_IDS);

    for (const preset of pizzaSessionPresets) {
      expect(preset.name).toBeTruthy();
      expect(preset.shortDescription).toBeTruthy();
      expect(preset.bestFor).toBeTruthy();
      expect(preset.ingredientGroups.map((group) => group.group)).toContain("Dough");
      expect(preset.ingredientGroups.map((group) => group.group)).toContain("Sauce");
      expect(preset.ingredientGroups.map((group) => group.group)).toContain("Cheese");
      expect(preset.ingredientGroups.map((group) => group.group)).toContain("Toppings");
    }
  });

  it("generates a grouped shopping list from a supported pizza plan and pizza count", () => {
    const session = createPizzaSession({
      id: "shopping-session",
      pizzaCount: 4,
      currentStep: "timeline",
    }, new Date("2026-06-25T10:00:00.000Z"));

    const result = generatePizzaSessionShoppingList(session, "diavola", new Date("2026-06-25T11:00:00.000Z"));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shoppingList.presetId).toBe("diavola");
    expect(result.shoppingList.presetName).toBe("Diavola");
    expect(result.shoppingList.pizzaCount).toBe(4);
    expect(result.pizzaMix).toMatchObject({ margherita: 0, diavola: 4 });
    expect(result.shoppingList.groups.map((group) => group.group)).toEqual(["Dough", "Sauce", "Cheese", "Toppings"]);
    expect(result.shoppingList.groups.flatMap((group) => group.items).every((item) => item.status === "need_to_buy")).toBe(true);
    expect(result.shoppingList.groups.flatMap((group) => group.items).some((item) => item.label.includes("Spicy salami"))).toBe(true);
  });

  it("defaults the pizza mix to all Margherita and preserves legacy pizzaPreset compatibility", () => {
    expect(normalizePizzaMixForCount(6)).toMatchObject({
      margherita: 6,
      marinara: 0,
      diavola: 0,
      funghi: 0,
      prosciutto: 0,
      "quattro-formaggi": 0,
    });
    expect(normalizePizzaMixForCount(4, undefined, "diavola")).toMatchObject({ margherita: 0, diavola: 4 });
    expect(normalizePizzaMixForCount(4, undefined, "simple-cheese")).toMatchObject({ margherita: 4 });
  });

  it("adjusts pizza mix quantities while keeping the total equal to pizza count", () => {
    const start = normalizePizzaMixForCount(6);
    const withOneDiavola = adjustPizzaMixAllocation(start, "diavola", 1, 6);
    const withTwoDiavola = adjustPizzaMixAllocation(withOneDiavola, "diavola", 1, 6);
    const withOneAgain = adjustPizzaMixAllocation(withTwoDiavola, "diavola", -1, 6);

    expect(withTwoDiavola).toMatchObject({ margherita: 4, diavola: 2 });
    expect(withOneAgain).toMatchObject({ margherita: 5, diavola: 1 });
    expect(mixTotal(withTwoDiavola)).toBe(6);
    expect(mixTotal(withOneAgain)).toBe(6);
  });

  it("allocates multiple pizza types by reducing Margherita as the default filler", () => {
    let mix = normalizePizzaMixForCount(4);
    mix = adjustPizzaMixAllocation(mix, "marinara", 1, 4);
    mix = adjustPizzaMixAllocation(mix, "marinara", 1, 4);
    mix = adjustPizzaMixAllocation(mix, "diavola", 1, 4);

    expect(mix).toMatchObject({
      margherita: 1,
      marinara: 2,
      diavola: 1,
    });
    expect(mixTotal(mix)).toBe(4);

    const withOneLessMarinara = adjustPizzaMixAllocation(mix, "marinara", -1, 4);
    expect(withOneLessMarinara).toMatchObject({
      margherita: 2,
      marinara: 1,
      diavola: 1,
    });
    expect(mixTotal(withOneLessMarinara)).toBe(4);
  });

  it("does not exceed pizza count or reduce any pizza mix quantity below zero", () => {
    let mix = normalizePizzaMixForCount(2);
    mix = adjustPizzaMixAllocation(mix, "diavola", 1, 2);
    mix = adjustPizzaMixAllocation(mix, "funghi", 1, 2);
    mix = adjustPizzaMixAllocation(mix, "prosciutto", 1, 2);
    mix = adjustPizzaMixAllocation(mix, "diavola", -1, 2);
    mix = adjustPizzaMixAllocation(mix, "diavola", -1, 2);

    expect(mixTotal(mix)).toBe(2);
    expect(Object.values(mix).every((count) => count >= 0)).toBe(true);
  });

  it("uses Dough Plan recipe snapshot amounts for dough ingredients", () => {
    const session = createPizzaSession({
      id: "shopping-snapshot-session",
      pizzaCount: 4,
      recipeSnapshot: {
        balls: 4,
        ballWeight: 260,
        yeastType: "idy",
        flourAmount: 642.22,
        waterAmount: 411.02,
        saltAmount: 17.98,
        leavenerAmount: 0.38,
      },
    });

    const result = generatePizzaSessionShoppingList(session, "margherita");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doughItems = result.shoppingList.groups.find((group) => group.group === "Dough")?.items ?? [];
    expect(doughItems.map((item) => item.label)).toEqual(["Flour", "Water", "Salt", "Yeast — Instant dry yeast"]);
    expect(doughItems.find((item) => item.label === "Flour")?.amount).toBe("642 g · from Dough Plan");
    expect(doughItems.find((item) => item.label === "Water")?.amount).toBe("411 g · from Dough Plan");
    expect(doughItems.find((item) => item.label === "Salt")?.amount).toBe("18 g · from Dough Plan");
    expect(doughItems.find((item) => item.label === "Yeast — Instant dry yeast")?.amount).toBe("0.38 g · from Dough Plan");
  });

  it("uses safe dough amount fallback when the recipe snapshot is missing", () => {
    const session = createPizzaSession({
      id: "shopping-missing-snapshot-session",
      pizzaCount: 2,
    });

    const result = generatePizzaSessionShoppingList(session, "margherita");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const doughItems = result.shoppingList.groups.find((group) => group.group === "Dough")?.items ?? [];
    expect(doughItems.every((item) => item.amount === "from Dough Plan when available")).toBe(true);
  });

  it("renders Margherita topping quantities from the selected pizza plan", () => {
    const result = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 4 }), "margherita");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("280 g to use · buy 1 x 400 g can · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Mozzarella")).toBe("320 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Fresh basil")).toBe("small handfuls · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Extra virgin olive oil")).toBe("4 tsp · estimate for 4 selected pizzas");
  });

  it("uses the home-oven sauce method for a home-oven Margherita session", () => {
    const result = generatePizzaSessionShoppingList(createPizzaSession({
      pizzaCount: 4,
      ovenType: "home",
      pizzaStyle: "home-oven",
    }), "margherita");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("320 g to use · buy 2 x 400 g cans · estimate for 4 selected pizzas");
  });

  it("renders Marinara topping quantities from the selected pizza plan", () => {
    const result = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 4 }), "marinara");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shoppingList.groups.map((group) => group.group)).toEqual(["Dough", "Sauce", "Toppings"]);
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("320 g to use · buy 1 x 400 g can · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Garlic")).toBe("2 cloves · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Oregano")).toBe("small pinches · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Extra virgin olive oil")).toBe("4 tsp · estimate for 4 selected pizzas");
  });

  it("renders Diavola topping quantities from the selected pizza plan", () => {
    const result = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 4 }), "diavola");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("220 g to use · buy 1 x 400 g can · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Mozzarella")).toBe("300 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Spicy salami or pepperoni")).toBe("140 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Basil or oregano")).toBe("small pinches or a handful of leaves · estimate for 4 selected pizzas");
  });

  it("renders Funghi topping quantities from the selected pizza plan", () => {
    const result = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 4 }), "funghi");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("220 g to use · buy 1 x 400 g can · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Mozzarella")).toBe("300 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Mushrooms")).toBe("240 g · estimate for 4 selected pizzas");
  });

  it("renders Prosciutto and Quattro Formaggi as supported v1 pizza mix options", () => {
    expect(PIZZA_MIX_OPTIONS.map((option) => option.id)).toEqual([
      "margherita",
      "marinara",
      "diavola",
      "funghi",
      "prosciutto",
      "quattro-formaggi",
    ]);

    const prosciutto = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 2 }), "prosciutto");
    const quattroFormaggi = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 2 }), "quattro-formaggi");

    expect(itemAmount(prosciutto, "Prosciutto")).toBe("80 g · estimate for 2 selected pizzas");
    expect(itemAmount(quattroFormaggi, "Gorgonzola or blue cheese")).toBe("50 g · estimate for 2 selected pizzas");
  });

  it("combines shared topping ingredients from a mixed pizza plan", () => {
    const session = createPizzaSession({
      pizzaCount: 6,
      pizzaMix: { margherita: 4, diavola: 2 },
    });

    const result = generatePizzaSessionShoppingList(session);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shoppingList.presetId).toBe("pizza-mix");
    expect(result.shoppingList.presetName).toBe("Pizza mix");
    expect(result.pizzaMix).toMatchObject({ margherita: 4, diavola: 2 });
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("390 g to use · buy 2 x 400 g cans · estimate for 6 selected pizzas");
    expect(itemAmount(result, "Mozzarella")).toBe("470 g · estimate for 6 selected pizzas");
    expect(itemAmount(result, "Spicy salami or pepperoni")).toBe("70 g · estimate for 6 selected pizzas");
    expect(itemAmount(result, "Extra virgin olive oil")).toBe("6 tsp · estimate for 6 selected pizzas");
  });

  it("generates exact topping totals from Margherita, Marinara and Diavola mix allocation", () => {
    const session = createPizzaSession({
      pizzaCount: 4,
      pizzaMix: {
        margherita: 1,
        marinara: 2,
        diavola: 1,
      },
    });

    const result = generatePizzaSessionShoppingList(session);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pizzaMix).toMatchObject({ margherita: 1, marinara: 2, diavola: 1 });
    expect(result.shoppingList.presetId).toBe("pizza-mix");
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("285 g to use · buy 1 x 400 g can · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Mozzarella")).toBe("155 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Spicy salami or pepperoni")).toBe("35 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Extra virgin olive oil")).toBe("4 tsp · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Garlic")).toBe("1 clove · estimate for 2 selected pizzas");
  });

  it("scales topping quantities with pizza count", () => {
    const twoPizzas = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 2 }), "margherita");
    const fourPizzas = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 4 }), "margherita");

    expect(twoPizzas.ok).toBe(true);
    expect(fourPizzas.ok).toBe(true);
    if (!twoPizzas.ok || !fourPizzas.ok) return;
    const twoSauce = twoPizzas.shoppingList.groups.flatMap((group) => group.items).find((item) => item.label === "Tomato sauce or crushed tomatoes");
    const fourSauce = fourPizzas.shoppingList.groups.flatMap((group) => group.items).find((item) => item.label === "Tomato sauce or crushed tomatoes");
    expect(twoSauce?.amount).toBe("140 g to use · buy 1 x 400 g can · estimate for 2 selected pizzas");
    expect(fourSauce?.amount).toBe("280 g to use · buy 1 x 400 g can · estimate for 4 selected pizzas");
  });

  it("handles missing active session, missing pizza count and unknown preset safely", () => {
    expect(generatePizzaSessionShoppingList(undefined).ok).toBe(false);
    expect(generatePizzaSessionShoppingList(createPizzaSession({ id: "no-count" })).ok).toBe(false);
    expect(generatePizzaSessionShoppingList(createPizzaSession({ id: "count", pizzaCount: 2 }), "missing").ok).toBe(false);
  });

  it("saves a generated shopping list into the active Pizza Session and updates timestamps", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "active-shopping",
      status: "planning",
      currentStep: "timeline",
      pizzaCount: 6,
    }, storage, new Date("2026-06-25T10:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const { session: updatedSession, result } = generateAndSaveActiveShoppingList("margherita", storage, new Date("2026-06-25T10:30:00.000Z"));

    expect(result.ok).toBe(true);
    expect(updatedSession?.currentStep).toBe("shopping");
    expect(updatedSession?.pizzaPreset).toBe("margherita");
    expect(updatedSession?.pizzaMix).toMatchObject({ margherita: 6 });
    expect(updatedSession?.shoppingList?.presetId).toBe("margherita");
    expect(updatedSession?.updatedAt).toBe("2026-06-25T10:30:00.000Z");
    expect(updatedSession?.lastSavedAt).toBe("2026-06-25T10:30:00.000Z");
    expect(getActivePizzaSession(storage)?.shoppingList?.presetName).toBe("Margherita");
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("shoppingList");
    expect(storage.getItem(ACTIVE_PIZZA_SESSION_STORAGE_KEY)).toBe(session.id);
  });

  it("persists item status changes only in the active Pizza Session shopping list", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "status-shopping",
      status: "planning",
      currentStep: "timeline",
      pizzaCount: 2,
    }, storage);
    setActivePizzaSession(session.id, storage);

    const { session: withList } = generateAndSaveActiveShoppingList("funghi", storage, new Date("2026-06-25T11:00:00.000Z"));
    const item = withList?.shoppingList?.groups.flatMap((group) => group.items).find((entry) => entry.label === "Mushrooms");
    expect(item).toBeTruthy();

    const updated = updateShoppingItemStatus(withList!, item!.id, "already_have", storage, new Date("2026-06-25T11:15:00.000Z"));

    expect(updated?.shoppingList?.groups.flatMap((group) => group.items).find((entry) => entry.id === item!.id)?.status).toBe("already_have");
    expect(storage.getItem("doughtools-saved-recipes-v1")).toBeNull();
    expect(storage.getItem("doughtools:bake-results")).toBeNull();
  });

  it("preserves existing item statuses when regenerating the same preset", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({ id: "preserve-status", pizzaCount: 3, status: "planning" }, storage);
    setActivePizzaSession(session.id, storage);
    const first = generateAndSaveActiveShoppingList("funghi", storage).session;
    const item = first?.shoppingList?.groups.flatMap((group) => group.items)[0];
    const changed = updateShoppingItemStatus(first!, item!.id, "bought", storage);

    const regenerated = generateAndSaveActiveShoppingList("funghi", storage).session;

    expect(changed?.shoppingList?.presetId).toBe("funghi");
    expect(regenerated?.shoppingList?.groups.flatMap((group) => group.items).find((entry) => entry.id === item!.id)?.status).toBe("bought");
  });

  it("uses the active session's existing preset on refresh instead of resetting to the default preset", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({ id: "refresh-preset", pizzaCount: 4, status: "planning" }, storage);
    setActivePizzaSession(session.id, storage);
    const first = generateAndSaveActiveShoppingList("diavola", storage).session;
    const item = first?.shoppingList?.groups.flatMap((group) => group.items)[0];
    updateShoppingItemStatus(first!, item!.id, "bought", storage);

    const refreshed = generateAndSaveActiveShoppingList(undefined, storage).session;

    expect(refreshed?.shoppingList?.presetId).toBe("diavola");
    expect(refreshed?.shoppingList?.groups.flatMap((group) => group.items).find((entry) => entry.id === item!.id)?.status).toBe("bought");
  });

  it("preserves an existing pizza mix on refresh instead of resetting from the saved single preset", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "refresh-pizza-mix",
      pizzaCount: 4,
      status: "planning",
      pizzaPreset: "margherita",
      pizzaMix: {
        margherita: 1,
        marinara: 2,
        diavola: 1,
      },
      shoppingList: {
        presetId: "margherita",
        presetName: "Margherita",
        pizzaCount: 4,
        groups: [],
      },
    }, storage);
    setActivePizzaSession(session.id, storage);

    const refreshed = generateAndSaveActiveShoppingList(undefined, storage).session;

    expect(refreshed?.pizzaMix).toMatchObject({ margherita: 1, marinara: 2, diavola: 1 });
    expect(refreshed?.shoppingList?.presetId).toBe("pizza-mix");
    expect(refreshed?.shoppingList?.groups.flatMap((group) => group.items).find((entry) => entry.label === "Tomato sauce or crushed tomatoes")?.amount)
      .toBe("285 g to use · buy 1 x 400 g can · estimate for 4 selected pizzas");
  });

  it("saves a Kitchen-safe menu mix without moving the session back to Shopping", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-safe-menu-save",
      currentStep: "prep",
      status: "preparing",
      pizzaCount: 4,
      pizzaMix: { margherita: 4 },
      timeline: {
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "done" },
          { id: "ball-dough", label: "Ball dough", status: "todo" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-07-04T10:05:00.000Z",
          actualCompletedAt: "2026-07-04T10:15:00.000Z",
        },
      },
    }, storage, new Date("2026-07-04T10:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const { session: updatedSession, result } = savePizzaSessionMenuMix(
      session,
      { margherita: 2, diavola: 2 },
      storage,
      new Date("2026-07-04T10:30:00.000Z"),
    );

    expect(result.ok).toBe(true);
    expect(updatedSession?.currentStep).toBe("prep");
    expect(updatedSession?.status).toBe("preparing");
    expect(updatedSession?.timeline).toEqual(session.timeline);
    expect(updatedSession?.stepRuntime).toEqual(session.stepRuntime);
    expect(updatedSession?.pizzaCount).toBe(4);
    expect(updatedSession?.pizzaMix).toMatchObject({ margherita: 2, diavola: 2 });
    expect(updatedSession?.pizzaPreset).toBe("margherita");
    expect(updatedSession?.shoppingList?.presetId).toBe("pizza-mix");
    expect(updatedSession?.updatedAt).toBe("2026-07-04T10:30:00.000Z");
    expect(getActivePizzaSession(storage)?.currentStep).toBe("prep");
  });

  it("preserves Shopping item statuses by stable ingredient identity when menu mix changes", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-menu-status-preserve",
      currentStep: "prep",
      status: "preparing",
      pizzaCount: 4,
    }, storage);
    setActivePizzaSession(session.id, storage);
    const margherita = generateAndSaveActiveShoppingList("margherita", storage).session!;
    const tomato = margherita.shoppingList!.groups.flatMap((group) => group.items).find((item) => item.id.endsWith(":tomato-sauce"))!;
    const mozzarella = margherita.shoppingList!.groups.flatMap((group) => group.items).find((item) => item.id.endsWith(":mozzarella"))!;
    updateShoppingItemStatus(margherita, tomato.id, "already_have", storage);
    const withTomato = getActivePizzaSession(storage)!;
    updateShoppingItemStatus(withTomato, mozzarella.id, "bought", storage);
    const checkedSession = getActivePizzaSession(storage)!;

    const { session: mixed } = savePizzaSessionMenuMix(
      checkedSession,
      { diavola: 2, funghi: 2 },
      storage,
      new Date("2026-07-04T11:00:00.000Z"),
    );

    const items = mixed?.shoppingList?.groups.flatMap((group) => group.items) ?? [];
    expect(items.find((item) => item.id === "pizza-mix:sauce:tomato-sauce")?.status).toBe("already_have");
    expect(items.find((item) => item.id === "pizza-mix:cheese:mozzarella")?.status).toBe("bought");
    expect(items.find((item) => item.id === "pizza-mix:toppings:spicy-salami")?.status).toBe("need_to_buy");
    expect(items.find((item) => item.id === "pizza-mix:toppings:mushrooms")?.status).toBe("need_to_buy");
    expect(items.find((item) => item.id === "pizza-mix:toppings:basil")).toBeUndefined();
  });

  it("formats a plain-text copy without public sharing or cloud claims", () => {
    const session = createPizzaSession({ id: "copy-list", pizzaCount: 1 });
    const result = generatePizzaSessionShoppingList(session, "marinara");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const text = formatShoppingListPlainText(session, result.shoppingList);

    expect(text).toContain("DoughTools shopping list");
    expect(text).toContain("Preset: Marinara");
    expect(text).toContain("Tomato sauce or crushed tomatoes — 80 g to use · buy 1 x 400 g can · estimate for 1 selected pizza");
    expect(text).toContain("Saved locally on this device");
    expect(text).toContain("No cloud sync or public sharing is active");
    expect(text).not.toMatch(/cloud sync enabled|public sharing enabled|share card/i);
  });

  it("adds the /session/shopping route, secondary pizza mix UI and local-first copy without a free-text ingredient editor", () => {
    const page = source("app/session/shopping/page.tsx");
    const timeline = source("app/session/timeline/page.tsx");
    const start = source("app/session/start/page.tsx");

    expect(page).toContain('title="Your shopping list"');
    expect(page).toContain("Check ingredients, confirm the pizza mix, then continue to Timeline.");
    expect(page).not.toContain("choose-pizzas-heading");
    expect(page).not.toContain("Dough style and dough formula stay in the Dough Plan.");
    expect(page).toContain("Optional shopping tools");
    expect(page).toContain("Pizza mix");
    expect(page).toContain("V1 shopping supports Margherita, Marinara, Diavola, Funghi, Prosciutto and Quattro Formaggi.");
    expect(page).toContain("Edit pizza mix");
    expect(page).toContain("Hide pizza mix controls");
    expect(page).toContain('aria-controls="pizza-menu-controls-panel"');
    expect(page).toContain("aria-expanded={menuControlsOpen}");
    expect(page).toContain("Total selected:");
    expect(page).toContain("Decrease");
    expect(page).toContain("Increase");
    expect(page).toContain("pizzaChefRecommendation(option.id)");
    expect(page).toContain("getShoppingPizzaImage(option.id)");
    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={7}");
    expect(page).toContain("hideMeta");
    expect(page).toContain("Continue to Timeline →");
    expect(page).toContain("Back");
    expect(page).toContain("image.src");
    expect(page).not.toContain("Before Timeline");
    expect(page).not.toContain("Download the shopping image if you want it, then continue to the Timeline.");
    expect(page).not.toContain("desktopAside={renderNextActionCard()}");
    expect(page).not.toContain("<div className=\"lg:hidden\">");
    expect(page).not.toContain("SHOPPING_LIST_LOCAL_ONLY_COPY");
    expect(page).not.toContain("SessionLocalOnlyNote");
    expect(page).not.toContain("Step 7: Choose pizzas & Shopping");
    expect(page).not.toContain("This is a preparation checklist for your kitchen.");
    expect(page).not.toMatch(/textarea|contentEditable|public link|upload photo|cloud sync is active|Copy shopping list|Open Sauce tool|Open Toppings tool|Back to timeline|Review dough plan/i);
    expect(timeline).toContain("/session/kitchen");
    expect(start).toContain("Create my pizza plan");
    expect(start).not.toContain("Shopping list →");
  });

  it("renders the shopping page as a compact grouped checklist with icons and live progress", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("Dough ingredients");
    expect(page).toContain("Shopping Checklist");
    expect(page).toContain("Dough amounts come from the Dough Plan. Toppings follow the selected pizza mix: {selectedPizzaMixSummary}.");
    expect(page).toContain("selectedPizzaMixSummary");
    expect(page).toContain("Shopping progress");
    expect(page).toContain("{readyShoppingItems} / {shoppingItems.length} ingredients ready");
    expect(page).toContain("shoppingList?.groups.flatMap((group) => group.items) ?? []");
    expect(page).toContain("Fermentation: {fermentationDisplay.fullLabel}");
    expect(page).toContain("buildSessionFermentationDisplay");
    expect(page).toContain("buildSessionRecipe(session ?? undefined)");
    expect(page).toContain("Sauce");
    expect(page).toContain("Cheese");
    expect(page).toContain("Toppings");
    expect(page).toContain("function IngredientIcon");
    expect(page).toContain("ingredientIconKind(item)");
    expect(page).toContain("{item.label}");
    expect(page).toContain("{item.amount}");
    expect(page).toContain("type=\"checkbox\"");
    expect(page).toContain("checked={readyItem}");
    expect(page).toContain("isItemReady(item.status) ? \"need_to_buy\" : \"already_have\"");
    expect(page).toContain("status === \"already_have\" || status === \"bought\"");
    expect(page).not.toContain("Need</");
    expect(page).not.toContain("Have</");
  });

  it("renders clear pizza menu cards with local photo assets and chef recommendations", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("getShoppingPizzaImage(option.id)");
    expect(page).toContain("function pizzaChefRecommendation");
    expect(page).toContain("Perfect if you're making classic Neapolitan pizza.");
    expect(page).toContain("A traditional cheese-free classic.");
    expect(page).toContain("For spicy pizza lovers.");
    expect(page).toContain("Excellent with roasted mushrooms.");
    expect(page).toContain("Best finished with fresh arugula.");
    expect(page).toContain("Rich, creamy and cheese-forward.");
    expect(page).toContain("aspect-[4/3] w-full object-cover");
    expect(page).toContain("width={image.width}");
    expect(page).toContain("height={image.height}");
    expect(page).toContain("style={{ objectPosition: image.objectPosition }}");
    expect(page).toContain("aria-label={`${option.name}: ${quantity} selected`}");
    expect(page).toContain("Selected");
    expect(page).toContain("inline-flex h-12 w-12");
    expect(page).not.toContain("{option.marker}");
    expect(page).not.toContain("bg-gradient-to-t from-ink/25");
    expect(page).not.toMatch(/https?:\/\//);
  });

  it("shows a branded shopping image download action on the Shopping page", () => {
    const page = source("app/session/shopping/page.tsx");
    const exportHelper = source("lib/shopping-image-export.ts");

    expect(page).toContain("Download shopping image");
    expect(page).toContain("Preparing image…");
    expect(page).toContain("Save a branded DoughTools shopping list to your phone or computer.");
    expect(page).toContain("Show export");
    expect(page).toContain("Hide export");
    expect(page).toContain('aria-controls="shopping-image-export-panel"');
    expect(page).toContain("aria-expanded={exportPanelOpen}");
    expect(page).toContain("Export uses the same checklist data shown above.");
    expect(page).toContain("ShoppingListExportCard");
    expect(page).toContain("downloadShoppingListImage(exportCardRef.current)");
    expect(exportHelper).toContain("html-to-image");
    expect(exportHelper).toContain("doughtools-shopping-list.png");
  });

  it("renders the branded shopping export card with DoughTools branding and shopping quantities", () => {
    const component = source("components/session/ShoppingListExportCard.tsx");

    expect(component).toContain("DoughTools");
    expect(component).toContain("Pizza Shopping List");
    expect(component).toContain("Make better pizza with better decisions");
    expect(component).toContain("Dough ingredients");
    expect(component).toContain("shoppingList.groups.map");
    expect(component).toContain("{item.label}");
    expect(component).toContain("{item.amount ?? \"as needed\"}");
    expect(component).toContain("yeastTypeLabel");
    expect(component).toContain("buildSessionFermentationDisplay");
    expect(component).toContain("buildSessionRecipe(session)");
    expect(component).not.toContain("const fermentationLabels");
    expect(component).toContain("Made with DoughTools");
    expect(component).toContain("doughtools.app");
    expect(component).toContain("w-[1080px]");
    expect(component).toContain("ingredientDecorations");
    expect(component).toContain("shopping-export-ingredient-backdrop");
    expect(component).toContain("shopping-export-card-atmosphere");
    expect(component).toContain("radial-gradient");
    expect(component).toContain("basil");
    expect(component).toContain("tomato");
    expect(component).toContain("olive oil");
  });

  it("shows the dough start reminder in the export card only when an exact start time exists", () => {
    const component = source("components/session/ShoppingListExportCard.tsx");

    expect(component).toContain("function doughStartReminder");
    expect(component).toContain("step.id === \"mix-dough\"");
    expect(component).toContain("Start making the dough:");
    expect(component).toContain("{reminder &&");
    expect(component).toContain("Preparation reminder");
  });

  it("keeps the shopping hero focused by removing competing prominent actions", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={7}");
    expect(page).toContain("level={session.experienceLevel}");
    expect(page).toContain("BottomActionBar");
    expect(page).toContain('href="/session/recipe"');
    expect(page).toContain('href="/session/timeline"');
    expect(page).toContain("Continue to Timeline →");
    expect(page.match(/Continue to Timeline →/g)).toHaveLength(1);
    expect(page).not.toContain("Before Timeline");
    expect(page).not.toContain("const renderNextActionCard");
    expect(page).toContain("updatePizzaMix");
    expect(page).toContain("generateAndSaveActiveShoppingList(undefined, undefined, new Date(), nextMix)");
    expect(page).not.toContain("formatSessionTime");
    expect(page).not.toContain("targetTime");
    expect(page).not.toContain("<AppSignature");
    expect(page).not.toContain("border-t border-ink/10 py-6");
    expect(page).not.toContain("copyShoppingList");
    expect(page).not.toContain("formatShoppingListPlainText");
    expect(page).not.toContain("Open Kitchen Mode →");
    expect(page).not.toContain("Back to timeline →");
    expect(page).not.toContain("Review dough plan →");
    expect(page).not.toContain("Checklist groups");
    expect(page).not.toContain("Check what you already have.");
    expect(page).not.toContain("Mark items as Have when they are ready. Unchecked items stay marked as Need.");
  });

  it("uses shared visual-system helpers for Shopping workspace cards and actions", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("buttonClass");
    expect(page).toContain("cardClass");
    expect(page).toContain("statusPillClass");
    expect(page).toContain('variant: "guidance"');
    expect(page).toContain('variant: "success"');
    expect(page).toContain('variant: selected ? "selected" : "archived"');
    expect(page).toContain('variant: "secondary"');
    expect(page).not.toContain('tone: "dark"');
    expect(page).not.toContain("focus-visible:ring-tomato sm:w-auto");
  });

  it("aligns the shopping page with Pizza Session V2 checklist structure", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("step={7}");
    expect(page).toContain("Your shopping list");
    expect(page).toContain("BottomActionBar");
    expect(page.indexOf("Shopping Checklist")).toBeLessThan(page.indexOf("<BottomActionBar"));
    expect(page.indexOf("<BottomActionBar")).toBeLessThan(page.indexOf("Optional shopping tools"));
    expect(page.indexOf("Optional shopping tools")).toBeLessThan(page.indexOf("Edit pizza mix"));
    expect(page.indexOf("Edit pizza mix")).toBeLessThan(page.indexOf("PIZZA_MIX_OPTIONS.map"));
    expect(page.indexOf("Show export")).toBeLessThan(page.indexOf("Download shopping image"));
    expect(page).toContain("Shopping list");
    expect(page).toContain("hideMeta");
    expect(page).not.toContain("id=\"choose-pizzas-heading\"");
    expect(page).not.toContain("Checklist page</");
    expect(page).not.toMatch(/checkout|cart total|store link|price|ecommerce/i);
  });

  it("uses local pizza images for the Shopping Pizza Menu cards", () => {
    const page = source("app/session/shopping/page.tsx");
    const metadata = source("lib/shopping-pizza-images.ts");

    expect(page).toContain("import Image from \"next/image\"");
    expect(page).toContain("getShoppingPizzaImage(option.id)");
    expect(shoppingPizzaImageList).toHaveLength(PIZZA_MIX_OPTIONS.length);

    const seenSources = new Set<string>();
    for (const image of shoppingPizzaImageList) {
      expect(image.src).toMatch(/^\/images\/shopping\/pizza-[a-z-]+\.webp$/);
      expect(image.src).not.toMatch(/https?:\/\//);
      expect(existsSync(join(process.cwd(), "public", image.src))).toBe(true);
      expect(image.width).toBe(1200);
      expect(image.height).toBe(900);
      expect(image.alt).toBeTruthy();
      expect(image.alt).not.toMatch(/pizza image|delicious|perfect|best|\.webp|filename/i);
      expect(image.audit.noPeopleOrHands).toBe(true);
      expect(image.audit.disposition).toBe("retain");
      expect(image.audit.notes).not.toMatch(/people|hands|faces|arms|silhouette/i);
      expect(seenSources.has(image.src)).toBe(false);
      seenSources.add(image.src);
    }
    expect(metadata).not.toMatch(/https?:\/\/|data:image/i);
    expect(metadata).toContain("representedPizza");
    expect(metadata).toContain("mobileSuitability");
  });

  it("keeps active session preset compatibility when generating the list", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("getActivePizzaSession");
    expect(page).toContain("normalizePizzaMixForCount(pizzaCount, session?.pizzaMix, session?.pizzaPreset)");
    expect(page).toContain("PIZZA_MIX_OPTIONS.map");
    expect(source("lib/pizza-session-shopping-list.ts")).toContain("pizzaPreset: primaryPizzaTypeFromMix(result.pizzaMix)");
  });

  it("documents Patch 34 shopping behavior and adds changelog history", () => {
    expect(existsSync(join(process.cwd(), "docs", "session-shopping-list.md"))).toBe(true);
    const doc = source("docs/session-shopping-list.md");
    const dataDoc = source("docs/pizza-session-data-model.md");
    const patch34 = patchHistory.find((entry) => entry.patch === 34);

    expect(doc).toContain("/session/shopping");
    expect(doc).toContain("doughtools:pizza-sessions-v1");
    expect(doc).toContain("no Supabase upload");
    expect(doc).toContain("no cloud sync");
    expect(dataDoc).toContain("Patch 34");
    expect(patch34?.title).toBe("Session shopping list generator");
    expect(patch34?.highlights.join(" ")).toContain("No custom ingredient database");
    expect(SHOPPING_LIST_LOCAL_ONLY_COPY).toContain("saved locally");
  });
});
