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
  formatShoppingListPlainText,
  generateAndSaveActiveShoppingList,
  generatePizzaSessionShoppingList,
  SHOPPING_LIST_LOCAL_ONLY_COPY,
  updateShoppingItemStatus,
} from "@/lib/pizza-session-shopping-list";
import { patchHistory } from "@/lib/changelog";
import { MemoryStorage } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

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

  it("generates a grouped shopping list from a preset and pizza count", () => {
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
    expect(result.shoppingList.groups.map((group) => group.group)).toEqual(["Dough", "Sauce", "Cheese", "Toppings", "Gear"]);
    expect(result.shoppingList.groups.flatMap((group) => group.items).every((item) => item.status === "need_to_buy")).toBe(true);
    expect(result.shoppingList.groups.flatMap((group) => group.items).some((item) => item.label.includes("Spicy salami"))).toBe(true);
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
    const first = generateAndSaveActiveShoppingList("simple-cheese", storage).session;
    const item = first?.shoppingList?.groups.flatMap((group) => group.items)[0];
    const changed = updateShoppingItemStatus(first!, item!.id, "bought", storage);

    const regenerated = generateAndSaveActiveShoppingList("simple-cheese", storage).session;

    expect(changed?.shoppingList?.presetId).toBe("simple-cheese");
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

  it("adds the /session/shopping route, links and local-first copy without a free-text ingredient editor", () => {
    const page = source("app/session/shopping/page.tsx");
    const timeline = source("app/session/timeline/page.tsx");
    const start = source("app/session/start/page.tsx");

    expect(page).toContain("Your shopping list");
    expect(page).toContain("Everything you need for");
    expect(page).toContain("Next →");
    expect(page).toContain("Back");
    expect(page).toContain("Next up: Kitchen Mode");
    expect(page).toContain("You’ll cook your pizzas step by step.");
    expect(page).toContain("SHOPPING_LIST_LOCAL_ONLY_COPY");
    expect(page).not.toMatch(/textarea|contentEditable|public link|upload photo|cloud sync is active|Copy shopping list|Open Sauce tool|Open Toppings tool|Back to timeline|Review dough plan/i);
    expect(timeline).toContain("/session/shopping");
    expect(start).toContain("Build my dough plan");
    expect(start).not.toContain("Shopping list →");
  });

  it("renders the shopping page as a simple grouped Need/Have checklist", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("Dough essentials");
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

    expect(page).toContain("Pizza session shopping");
    expect(page).toContain("GuidanceModeBadge");
    expect(page).toContain("formatSessionTime(targetTime)");
    expect(page).toContain("year: \"numeric\"");
    expect(page).not.toContain("<AppSignature");
    expect(page).not.toContain("border-t border-ink/10 py-6");
    expect(page).not.toContain("copyShoppingList");
    expect(page).not.toContain("formatShoppingListPlainText");
    expect(page).not.toContain("Open Kitchen Mode →");
    expect(page).not.toContain("Back to timeline →");
    expect(page).not.toContain("Review dough plan →");
  });

  it("keeps active session preset compatibility when generating the list", () => {
    const page = source("app/session/shopping/page.tsx");

    expect(page).toContain("getActivePizzaSession");
    expect(page).toContain("findPizzaSessionPreset(session?.shoppingList?.presetId)?.id");
    expect(page).toContain("findPizzaSessionPreset(session?.pizzaPreset)?.id");
    expect(page).toContain("generateAndSaveActiveShoppingList(resolvedPreset)");
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
