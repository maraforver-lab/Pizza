import { describe, expect, it } from "vitest";
import { createBakeResult, createRecipeSnapshot, type RecipeSnapshot } from "@/lib/bake-result";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import {
  addLocalBakeResult,
  BAKE_RESULTS_LOCAL_ONLY_COPY,
  BAKE_RESULTS_STORAGE_KEY,
  deleteLocalBakeResult,
  exportLocalBakeResult,
  importLocalBakeResult,
  loadLocalBakeResults,
  storeLocalBakeResults,
} from "@/lib/local-bake-results";
import { baseSettings, MemoryStorage } from "./helpers";

const ingredients = calculateDoughIngredients(baseSettings);

function snapshot(overrides: Partial<RecipeSnapshot> = {}) {
  return createRecipeSnapshot(baseSettings, ingredients, { capturedAt: "2026-06-23T12:00:00.000Z" }) as RecipeSnapshot & typeof overrides;
}

describe("local BakeResult storage", () => {
  it("documents a dedicated local-only storage key and copy", () => {
    expect(BAKE_RESULTS_STORAGE_KEY).toBe("doughtools:bake-results");
    expect(BAKE_RESULTS_LOCAL_ONLY_COPY).toContain("stored locally on this device");
  });

  it("returns an empty list for empty, malformed or non-array storage", () => {
    const storage = new MemoryStorage();

    expect(loadLocalBakeResults(storage)).toEqual([]);

    storage.setItem(BAKE_RESULTS_STORAGE_KEY, "{broken");
    expect(loadLocalBakeResults(storage)).toEqual([]);

    storage.setItem(BAKE_RESULTS_STORAGE_KEY, JSON.stringify({ id: "not-array" }));
    expect(loadLocalBakeResults(storage)).toEqual([]);
  });

  it("saves, validates and reads private BakeResults", () => {
    const storage = new MemoryStorage();
    const result = createBakeResult({
      id: "bake-local-1",
      recipeSnapshot: snapshot(),
      createdAt: "2026-06-23T12:00:00.000Z",
    });

    const saved = addLocalBakeResult(result, storage);
    const loaded = loadLocalBakeResults(storage);

    expect(saved).toHaveLength(1);
    expect(loaded).toEqual(saved);
    expect(loaded[0].visibility).toBe("private");
  });

  it("ignores invalid stored BakeResults and forces add flow visibility back to private", () => {
    const storage = new MemoryStorage();
    const publicResult = createBakeResult({
      id: "bake-public",
      recipeSnapshot: snapshot(),
      visibility: "public",
      createdAt: "2026-06-23T12:00:00.000Z",
    });

    storage.setItem(BAKE_RESULTS_STORAGE_KEY, JSON.stringify([publicResult, { id: "broken", schemaVersion: 1 }]));
    expect(loadLocalBakeResults(storage)).toEqual([]);

    const loaded = addLocalBakeResult(publicResult, storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("bake-public");
    expect(loaded[0].visibility).toBe("private");
  });

  it("deletes a saved BakeResult by id", () => {
    const storage = new MemoryStorage();
    const first = createBakeResult({ id: "first", recipeSnapshot: snapshot(), createdAt: "2026-06-23T12:00:00.000Z" });
    const second = createBakeResult({ id: "second", recipeSnapshot: snapshot(), createdAt: "2026-06-23T13:00:00.000Z" });
    storeLocalBakeResults([first, second], storage);

    expect(deleteLocalBakeResult("second", storage).map((result) => result.id)).toEqual(["first"]);
    expect(loadLocalBakeResults(storage).map((result) => result.id)).toEqual(["first"]);
  });

  it("persists a copied RecipeSnapshot so source mutations do not affect stored data", () => {
    const storage = new MemoryStorage();
    const mutableSettings = { ...baseSettings };
    const recipeSnapshot = createRecipeSnapshot(mutableSettings, calculateDoughIngredients(mutableSettings));
    const result = createBakeResult({ id: "immutable", recipeSnapshot });

    addLocalBakeResult(result, storage);
    mutableSettings.hydration = 99;

    expect(loadLocalBakeResults(storage)[0].recipeSnapshot.hydration).toBe(baseSettings.hydration);
  });

  it("round-trips one local BakeResult through export and import", () => {
    const result = createBakeResult({
      id: "round-trip",
      recipeSnapshot: snapshot(),
      resultSnapshot: { overallRating: 5, resultNotes: "Great spring." },
    });

    expect(importLocalBakeResult(exportLocalBakeResult(result))).toEqual(result);
    expect(importLocalBakeResult("{broken")).toBeUndefined();
  });
});
