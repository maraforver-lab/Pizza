export type Fermentation = "6h-room" | "12h-room" | "24h-room" | "24h-cold" | "48h-cold";
export type YeastType = "cy" | "ady" | "idy" | "ssd" | "lsd";
export type PizzaGoal = "balanced" | "airy" | "crispy" | "pan";
export type OvenType = "home" | "gas";
export type PizzaStyleId = "neapolitan" | "contemporary" | "new-york" | "roman-thin" | "detroit" | "sicilian";

export type RecipeSettings = {
  pizzas: number;
  ballWeight: number;
  waste: number;
  hydration: number;
  salt: number;
  yeastType: YeastType;
  fermentation: Fermentation;
  temperature: number;
  goal: PizzaGoal;
  ovenType: OvenType;
  flourId: FlourId;
  pizzaStyleId?: PizzaStyleId;
};

export type RecipeIngredients = {
  total: number;
  flour: number;
  water: number;
  salt: number;
  leavener: number;
};

export type SavedRecipe = {
  id: string;
  name: string;
  createdAt: string;
  settings: RecipeSettings;
  ingredients: RecipeIngredients;
};

const STORAGE_KEY = "doughtools-saved-recipes-v1";

export function loadSavedRecipes(): SavedRecipe[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const recipes: unknown = JSON.parse(stored);
    return Array.isArray(recipes) ? recipes as SavedRecipe[] : [];
  } catch {
    return [];
  }
}

export function storeSavedRecipes(recipes: SavedRecipe[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export function newRecipeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
import type { FlourId } from "@/lib/flours";
