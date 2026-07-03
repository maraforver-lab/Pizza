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
  SHOPPING_LIST_LOCAL_ONLY_COPY,
  updateShoppingItemStatus,
} from "@/lib/pizza-session-shopping-list";
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
    expect(doughItems.map((item) => item.label)).toEqual(["Flour", "Water", "Salt", "Yeast (idy)"]);
    expect(doughItems.find((item) => item.label === "Flour")?.amount).toBe("642 g · from Dough Plan");
    expect(doughItems.find((item) => item.label === "Water")?.amount).toBe("411 g · from Dough Plan");
    expect(doughItems.find((item) => item.label === "Salt")?.amount).toBe("18 g · from Dough Plan");
    expect(doughItems.find((item) => item.label === "Yeast (idy)")?.amount).toBe("0.38 g · from Dough Plan");
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
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("240 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Mozzarella")).toBe("320 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Fresh basil")).toBe("small handfuls · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Extra virgin olive oil")).toBe("4 tsp · estimate for 4 selected pizzas");
  });

  it("renders Marinara topping quantities from the selected pizza plan", () => {
    const result = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 4 }), "marinara");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shoppingList.groups.map((group) => group.group)).toEqual(["Dough", "Sauce", "Toppings"]);
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("280 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Garlic")).toBe("2 cloves · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Oregano")).toBe("small pinches · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Extra virgin olive oil")).toBe("4 tsp · estimate for 4 selected pizzas");
  });

  it("renders Diavola topping quantities from the selected pizza plan", () => {
    const result = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 4 }), "diavola");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("220 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Mozzarella")).toBe("300 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Spicy salami or pepperoni")).toBe("140 g · estimate for 4 selected pizzas");
    expect(itemAmount(result, "Basil or oregano")).toBe("small pinches or a handful of leaves · estimate for 4 selected pizzas");
  });

  it("renders Funghi topping quantities from the selected pizza plan", () => {
    const result = generatePizzaSessionShoppingList(createPizzaSession({ pizzaCount: 4 }), "funghi");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("220 g · estimate for 4 selected pizzas");
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
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("350 g · estimate for 6 selected pizzas");
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
    expect(itemAmount(result, "Tomato sauce or crushed tomatoes")).toBe("255 g · estimate for 4 selected pizzas");
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
    expect(twoSauce?.amount).toBe("120 g · estimate for 2 selected pizzas");
    expect(fourSauce?.amount).toBe("240 g · estimate for 4 selected pizzas");
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
      .toBe("255 g · estimate for 4 selected pizzas");
  });

  it("formats a plain-text copy without public sharing or cloud claims", () => {
    const session = createPizzaSession({ id: "copy-list", pizzaCount: 1 });
    const result = generatePizzaSessionShoppingList(session, "marinara");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const text = formatShoppingListPlainText(session, result.shoppingList);

    expect(text).toContain("DoughTools shopping list");
    expect(text).toContain("Preset: Marinara");
    expect(text).toContain("Saved locally on this device");
    expect(text).toContain("No cloud sync or public sharing is active");
    expect(text).not.toMatch(/cloud sync enabled|public sharing enabled|share card/i);
  });

  it("adds the /session/shopping route, pizza choice UI and local-first copy without a free-text ingredient editor", () => {
    const page = source("app/session/shopping/page.tsx");
    const timeline = source("app/session/timeline/page.tsx");
    const start = source("app/session/start/page.tsx");

    expect(page).toContain("Choose pizzas and build the shopping list.");
    expect(page).toContain("Pick the topping plan for this session, then check what you already have.");
    expect(page).toContain("What pizzas are you making?");
    expect(page).toContain("Dough style and dough formula stay in the Dough Plan.");
    expect(page).toContain("V1 shopping supports Margherita, Marinara, Diavola, Funghi, Prosciutto and Quattro Formaggi.");
    expect(page).toContain("Total selected:");
    expect(page).toContain("Decrease");
    expect(page).toContain("Increase");
    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={7}");
    expect(page).toContain("hideMeta");
    expect(page).toContain("Continue to Timeline →");
    expect(page).toContain("Back");
    expect(page).toContain("Next up");
    expect(page).toContain("Timeline");
    expect(page).toContain("After shopping, check when to mix, rest, proof and bake.");
    expect(page).toContain("desktopAside={renderNextActionCard()}");
    expect(page).toContain("<div className=\"lg:hidden\">");
    expect(page).not.toContain("SHOPPING_LIST_LOCAL_ONLY_COPY");
    expect(page).not.toContain("SessionLocalOnlyNote");
    expect(page).not.toContain("Step 7: Choose pizzas & Shopping");
    expect(page).not.toContain("This is a preparation checklist for your kitchen.");
    expect(page).not.toMatch(/textarea|contentEditable|public link|upload photo|cloud sync is active|Copy shopping list|Open Sauce tool|Open Toppings tool|Back to timeline|Review dough plan/i);
    expect(timeline).toContain("/session/kitchen");
    expect(start).toContain("Build my Dough Plan");
    expect(start).not.toContain("Shopping list →");
  });

  it("renders the shopping page as a simple grouped Need/Have checklist", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("Dough ingredients");
    expect(page).toContain("Dough ingredient amounts come from the Dough Plan.");
    expect(page).toContain("Topping ingredient amounts come from the selected pizza mix.");
    expect(page).toContain("Sauce");
    expect(page).toContain("Cheese");
    expect(page).toContain("Toppings");
    expect(page).toContain("{item.label}");
    expect(page).toContain("{item.amount}");
    expect(page).toContain("Need");
    expect(page).toContain("Have");
    expect(page).toContain("type=\"checkbox\"");
    expect(page).toContain("checked={readyItem}");
    expect(page).toContain("isItemReady(item.status) ? \"need_to_buy\" : \"already_have\"");
    expect(page).toContain("status === \"already_have\" || status === \"bought\"");
  });

  it("keeps the shopping hero focused by removing competing prominent actions", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={7}");
    expect(page).toContain("level={session.experienceLevel}");
    expect(page).toContain("const renderNextActionCard");
    expect(page).toContain("BottomActionBar");
    expect(page).toContain('href="/session/recipe"');
    expect(page).toContain('href="/session/timeline"');
    expect(page).toContain("Continue to Timeline →");
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

  it("aligns the shopping page with Pizza Session V2 checklist structure", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("step={7}");
    expect(page).toContain("Next up");
    expect(page).toContain("Timeline");
    expect(page).toContain("BottomActionBar");
    expect(page.indexOf("Choose toppings")).toBeLessThan(page.indexOf("Grouped shopping list"));
    expect(page.indexOf("Grouped shopping list")).toBeLessThan(page.indexOf("<BottomActionBar"));
    expect(page).toContain("Choose pizzas & Shopping");
    expect(page).toContain("hideMeta");
    expect(page).not.toContain("Checklist page</");
    expect(page).not.toMatch(/checkout|cart total|store link|price|ecommerce/i);
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
