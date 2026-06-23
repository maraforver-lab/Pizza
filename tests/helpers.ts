import type { RecipeIngredients, RecipeSettings } from "@/lib/saved-recipes";
import { expect } from "vitest";

export const baseSettings: RecipeSettings = {
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

export function expectFiniteIngredients(ingredients: RecipeIngredients) {
  for (const value of Object.values(ingredients)) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
}

export function expectIngredientTotal(ingredients: RecipeIngredients, precision = 6) {
  expect(ingredients.flour + ingredients.water + ingredients.salt + ingredients.leavener).toBeCloseTo(ingredients.total, precision);
}

export class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}
