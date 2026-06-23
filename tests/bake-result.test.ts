import { describe, expect, it } from "vitest";
import {
  BAKE_RESULT_SCHEMA_VERSION,
  createBakeResult,
  createBakingSnapshot,
  createDefaultSharePreferences,
  createPreparationSnapshot,
  createRecipeSnapshot,
  createResultSnapshot,
  deserializeBakeResult,
  isBakeResult,
  migrateBakeResult,
  normalizeBakeVisibility,
  serializeBakeResult,
  validateBakeResult,
} from "@/lib/bake-result";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { baseSettings } from "./helpers";

const capturedAt = "2026-06-23T12:00:00.000Z";
const ingredients = calculateDoughIngredients(baseSettings);

describe("BakeResult data model", () => {
  it("creates an immutable recipe snapshot by copying recipe data", () => {
    const sourceSettings = { ...baseSettings };
    const sourceIngredients = { ...ingredients };
    const snapshot = createRecipeSnapshot(sourceSettings, sourceIngredients, { capturedAt });

    sourceSettings.pizzas = 12;
    sourceSettings.hydration = 80;
    sourceIngredients.flour = 1;

    expect(snapshot.capturedAt).toBe(capturedAt);
    expect(snapshot.pizzas).toBe(baseSettings.pizzas);
    expect(snapshot.hydration).toBe(baseSettings.hydration);
    expect(snapshot.flour).toBeCloseTo(ingredients.flour, 6);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("preserves sourdough starter details when the recipe uses starter", () => {
    const settings = { ...baseSettings, yeastType: "lsd" as const };
    const snapshot = createRecipeSnapshot(settings, calculateDoughIngredients(settings), { capturedAt });

    expect(snapshot.sourdough).toEqual({ type: "lsd", starterHydration: 100 });
  });

  it("creates BakeResult with schema version, timestamps and private visibility by default", () => {
    const recipeSnapshot = createRecipeSnapshot(baseSettings, ingredients, { capturedAt });
    const result = createBakeResult({ id: "bake-1", recipeSnapshot, createdAt: capturedAt });

    expect(result.id).toBe("bake-1");
    expect(result.schemaVersion).toBe(BAKE_RESULT_SCHEMA_VERSION);
    expect(result.createdAt).toBe(capturedAt);
    expect(result.updatedAt).toBe(capturedAt);
    expect(result.visibility).toBe("private");
    expect(result.preparationSnapshot).toBeUndefined();
    expect(result.bakingSnapshot).toBeUndefined();
    expect(result.resultSnapshot).toBeUndefined();
  });

  it("normalizes unknown visibility to private", () => {
    expect(normalizeBakeVisibility("public")).toBe("public");
    expect(normalizeBakeVisibility("unlisted")).toBe("unlisted");
    expect(normalizeBakeVisibility("team-only")).toBe("private");

    const recipeSnapshot = createRecipeSnapshot(baseSettings, ingredients, { capturedAt });
    expect(createBakeResult({ recipeSnapshot, visibility: "team-only" }).visibility).toBe("private");
  });

  it("creates conservative default share preferences", () => {
    const preferences = createDefaultSharePreferences();

    expect(preferences.template).toBe("classic-card");
    expect(preferences.fields.hydration).toBe(true);
    expect(preferences.fields.fermentation).toBe(true);
    expect(preferences.fields.flour).toBe(true);
    expect(preferences.fields.ovenTemperature).toBe(false);
    expect(preferences.fields.bakeTime).toBe(false);
    expect(preferences.fields.rating).toBe(false);
    expect(preferences.fields.branding).toBe(true);
    expect(Object.values(preferences.fields).every(Boolean)).toBe(false);
  });

  it("allows optional preparation, baking and result snapshots to be present", () => {
    const recipeSnapshot = createRecipeSnapshot(baseSettings, ingredients, { capturedAt });
    const preparationSnapshot = createPreparationSnapshot({
      sauceStyle: "neapolitan",
      sauceAmount: 75,
      cheeseAmount: 88,
      toppingLoad: "balanced",
      plannedFermentationSteps: ["mix", "ball", "bake"],
    });
    const bakingSnapshot = createBakingSnapshot({
      ovenType: "gas",
      ovenTemperatureCelsius: 430,
      bakeTimeSeconds: 90,
      turnSchedule: ["30s", "60s"],
    });
    const resultSnapshot = createResultSnapshot({
      overallRating: 5,
      textureRating: 4,
      resultNotes: "Open rim and crisp base.",
      problemTags: ["slightly-pale-bottom"],
      photoReference: "local-photo-1",
    });

    const result = createBakeResult({
      id: "bake-full",
      recipeSnapshot,
      preparationSnapshot,
      bakingSnapshot,
      resultSnapshot,
    });

    expect(result.preparationSnapshot?.plannedFermentationSteps).toEqual(["mix", "ball", "bake"]);
    expect(result.bakingSnapshot?.turnSchedule).toEqual(["30s", "60s"]);
    expect(result.resultSnapshot?.problemTags).toEqual(["slightly-pale-bottom"]);
  });

  it("migration no-ops current schema version and preserves default privacy", () => {
    const recipeSnapshot = createRecipeSnapshot(baseSettings, ingredients, { capturedAt });
    const result = createBakeResult({ id: "bake-current", recipeSnapshot, createdAt: capturedAt });

    expect(migrateBakeResult(result)).toEqual(result);
    expect(migrateBakeResult({ ...result, visibility: "unknown" })?.visibility).toBe("private");
  });

  it("safely rejects malformed data and unknown future schema versions", () => {
    const recipeSnapshot = createRecipeSnapshot(baseSettings, ingredients, { capturedAt });
    const result = createBakeResult({ recipeSnapshot });

    expect(migrateBakeResult(undefined)).toBeUndefined();
    expect(migrateBakeResult({ schemaVersion: BAKE_RESULT_SCHEMA_VERSION })).toBeUndefined();
    expect(migrateBakeResult({ ...result, schemaVersion: BAKE_RESULT_SCHEMA_VERSION + 1 })).toBeUndefined();
    expect(validateBakeResult({ broken: true })).toBe(false);
    expect(isBakeResult(result)).toBe(true);
  });

  it("serializes and deserializes a representative BakeResult round-trip", () => {
    const recipeSnapshot = createRecipeSnapshot(baseSettings, ingredients, { capturedAt });
    const result = createBakeResult({
      id: "bake-round-trip",
      recipeSnapshot,
      bakingSnapshot: createBakingSnapshot({ ovenType: "gas", bakeTimeSeconds: 88 }),
      resultSnapshot: createResultSnapshot({ overallRating: 4 }),
      visibility: "unlisted",
      createdAt: capturedAt,
    });

    const parsed = deserializeBakeResult(serializeBakeResult(result));

    expect(parsed).toEqual(result);
    expect(parsed?.visibility).toBe("unlisted");
  });

  it("does not introduce public routes or publish behavior", () => {
    expect(typeof createBakeResult).toBe("function");
    expect(() => deserializeBakeResult("{broken")).not.toThrow();
    expect(deserializeBakeResult("{broken")).toBeUndefined();
  });
});
