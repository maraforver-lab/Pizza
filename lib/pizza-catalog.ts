import type { PizzaSessionPizzaMixType } from "@/lib/pizza-session";

export type PizzaCatalogOption = {
  id: PizzaSessionPizzaMixType;
  name: string;
  marker: string;
  shortDescription: string;
  ingredientSummary: string;
};

export const PIZZA_CATALOG_OPTIONS: PizzaCatalogOption[] = [
  {
    id: "margherita",
    name: "Margherita",
    marker: "🍅",
    shortDescription: "Classic tomato, mozzarella, basil and olive oil.",
    ingredientSummary: "Tomato sauce, mozzarella, basil, olive oil",
  },
  {
    id: "marinara",
    name: "Marinara",
    marker: "🧄",
    shortDescription: "Tomato-forward pizza without cheese.",
    ingredientSummary: "Tomato sauce, garlic, oregano, olive oil",
  },
  {
    id: "diavola",
    name: "Diavola",
    marker: "🌶️",
    shortDescription: "Tomato, mozzarella and spicy salami.",
    ingredientSummary: "Tomato sauce, mozzarella, spicy salami, herbs",
  },
  {
    id: "funghi",
    name: "Funghi",
    marker: "🍄",
    shortDescription: "Tomato, mozzarella and mushrooms.",
    ingredientSummary: "Tomato sauce, mozzarella, mushrooms, olive oil",
  },
  {
    id: "prosciutto",
    name: "Prosciutto",
    marker: "🥓",
    shortDescription: "Tomato, mozzarella and prosciutto.",
    ingredientSummary: "Tomato sauce, mozzarella, prosciutto, basil or arugula",
  },
  {
    id: "quattro-formaggi",
    name: "Quattro Formaggi",
    marker: "🧀",
    shortDescription: "A simple four-cheese plan.",
    ingredientSummary: "Mozzarella, gorgonzola, parmesan, fontina",
  },
];

export const PIZZA_CATALOG_IDS = PIZZA_CATALOG_OPTIONS.map((option) => option.id);

const pizzaCatalogIdSet = new Set<string>(PIZZA_CATALOG_IDS);

export function isPizzaCatalogId(value: unknown): value is PizzaSessionPizzaMixType {
  return typeof value === "string" && pizzaCatalogIdSet.has(value);
}

export function normalizePizzaCatalogIds(value: unknown): PizzaSessionPizzaMixType[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((item) => isPizzaCatalogId(item) ? [item] : []))];
}

export function pizzaCatalogOptionsForIds(ids: readonly string[]) {
  const idSet = new Set(ids);
  return PIZZA_CATALOG_OPTIONS.filter((option) => idSet.has(option.id));
}
