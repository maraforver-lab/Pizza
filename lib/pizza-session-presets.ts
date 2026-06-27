import type { PizzaSessionShoppingGroup } from "@/lib/pizza-session";

export type PizzaPresetId =
  | "margherita"
  | "marinara"
  | "diavola"
  | "funghi"
  | "pepperoni-salami"
  | "simple-cheese"
  | "hawaiian"
  | "mushroom"
  | "meat-lovers"
  | "white-pizza";

export type PizzaPresetIngredient = {
  id: string;
  label: string;
  amountHint?: string;
};

export type PizzaPresetIngredientGroup = {
  group: PizzaSessionShoppingGroup;
  items: PizzaPresetIngredient[];
};

export type PizzaSessionPreset = {
  id: PizzaPresetId;
  name: string;
  marker: string;
  shortDescription: string;
  bestFor: string;
  beginnerCopy: string;
  enthusiastCopy: string;
  pizzaNerdCopy: string;
  ingredientGroups: PizzaPresetIngredientGroup[];
};

export const REQUIRED_PIZZA_PRESET_IDS: PizzaPresetId[] = [
  "margherita",
  "marinara",
  "diavola",
  "funghi",
  "pepperoni-salami",
  "simple-cheese",
  "hawaiian",
  "mushroom",
  "meat-lovers",
  "white-pizza",
];

const doughItems: PizzaPresetIngredient[] = [
  { id: "flour", label: "Pizza flour", amountHint: "from your dough recipe" },
  { id: "water", label: "Water", amountHint: "from your dough recipe" },
  { id: "salt", label: "Salt", amountHint: "from your dough recipe" },
  { id: "yeast", label: "Yeast or starter", amountHint: "from your dough recipe" },
];

const tomatoSauce: PizzaPresetIngredient = {
  id: "tomato-sauce",
  label: "Tomato sauce or crushed tomatoes",
  amountHint: "practical amount for the pizza count",
};

const mozzarella: PizzaPresetIngredient = {
  id: "mozzarella",
  label: "Mozzarella",
  amountHint: "drain fresh mozzarella when needed",
};

const oliveOil: PizzaPresetIngredient = {
  id: "olive-oil",
  label: "Extra virgin olive oil",
  amountHint: "small finishing amount",
};

export const pizzaSessionPresets: PizzaSessionPreset[] = [
  {
    id: "margherita",
    name: "Margherita",
    marker: "🍅",
    shortDescription: "Tomato, mozzarella, basil and a little olive oil.",
    bestFor: "A classic first session and the easiest way to check dough, sauce and cheese balance.",
    beginnerCopy: "Choose this if you want the clearest classic pizza shopping list.",
    enthusiastCopy: "Keep sauce and cheese moderate so the center stays dry and the crust can shine.",
    pizzaNerdCopy: "A clean baseline preset: minimal toppings make dough handling, bake and fermentation easier to evaluate.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [{ id: "basil", label: "Fresh basil", amountHint: "finish after baking or late in the bake" }] },
      { group: "Gear", items: [{ ...oliveOil, id: "optional-olive-oil" }] },
    ],
  },
  {
    id: "marinara",
    name: "Marinara",
    marker: "🧄",
    shortDescription: "Tomato, garlic, oregano and olive oil. No cheese.",
    bestFor: "A lighter pizza where sauce quality and bake balance matter.",
    beginnerCopy: "A simple no-cheese option with fewer wet ingredients.",
    enthusiastCopy: "Slice garlic thinly and avoid piling on too much sauce.",
    pizzaNerdCopy: "Useful for judging tomato acidity, dough extensibility and oven heat without cheese masking the result.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [] },
      { group: "Toppings", items: [
        { id: "garlic", label: "Garlic", amountHint: "thinly sliced" },
        { id: "oregano", label: "Oregano", amountHint: "small pinch per pizza" },
        oliveOil,
      ] },
      { group: "Gear", items: [] },
    ],
  },
  {
    id: "diavola",
    name: "Diavola",
    marker: "🌶️",
    shortDescription: "Tomato, mozzarella, spicy salami and chili heat.",
    bestFor: "A spicy pizza night with a little more topping intensity.",
    beginnerCopy: "A spicy classic: buy salami or pepperoni and keep the layer light.",
    enthusiastCopy: "Salami releases fat, so avoid adding too much cheese and oil.",
    pizzaNerdCopy: "Fat migration from cured meat can soften the center; balance sauce, cheese and bake heat.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [
        { id: "spicy-salami", label: "Spicy salami or pepperoni", amountHint: "thin, even layer" },
        { id: "chili", label: "Chili flakes or chili oil", amountHint: "optional heat" },
      ] },
      { group: "Gear", items: [{ ...oliveOil, id: "optional-olive-oil" }] },
    ],
  },
  {
    id: "funghi",
    name: "Funghi",
    marker: "🍄",
    shortDescription: "Tomato, mozzarella and mushrooms.",
    bestFor: "Mushroom pizza where moisture control matters.",
    beginnerCopy: "Use sliced mushrooms and do not overload the center.",
    enthusiastCopy: "Pre-cook or thinly slice mushrooms if they are very wet.",
    pizzaNerdCopy: "Mushrooms are a moisture-risk topping; topping load matters more than exact grams in this first preset version.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [
        { id: "mushrooms", label: "Mushrooms", amountHint: "thinly sliced or pre-cooked if wet" },
        { id: "herbs", label: "Herbs", amountHint: "optional" },
      ] },
      { group: "Gear", items: [{ ...oliveOil, id: "optional-olive-oil" }] },
    ],
  },
  {
    id: "pepperoni-salami",
    name: "Pepperoni / Salami",
    marker: "🍕",
    shortDescription: "Tomato, mozzarella and pepperoni or salami.",
    bestFor: "A familiar crowd-pleaser with simple shopping.",
    beginnerCopy: "Buy pepperoni or salami, mozzarella and tomato sauce.",
    enthusiastCopy: "Use a moderate amount of cured meat so fat does not pool in the middle.",
    pizzaNerdCopy: "A good preset for testing cheese melt and fat rendering across different ovens.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [{ id: "pepperoni-or-salami", label: "Pepperoni or salami", amountHint: "thin, even layer" }] },
      { group: "Gear", items: [] },
    ],
  },
  {
    id: "simple-cheese",
    name: "Simple cheese pizza",
    marker: "🧀",
    shortDescription: "Tomato sauce and mozzarella, without extra toppings.",
    bestFor: "Simple pizza nights and picky eaters.",
    beginnerCopy: "The simplest list after dough: sauce and cheese.",
    enthusiastCopy: "Great when you want to test sauce amount and cheese moisture.",
    pizzaNerdCopy: "A low-variable baseline for checking bake color, bottom heat and cheese behavior.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [] },
      { group: "Gear", items: [] },
    ],
  },
  {
    id: "hawaiian",
    name: "Hawaiian",
    marker: "🍍",
    shortDescription: "Ham and pineapple with tomato sauce and cheese.",
    bestFor: "A sweet-salty pizza night with familiar toppings.",
    beginnerCopy: "Buy ham, pineapple, mozzarella and tomato sauce.",
    enthusiastCopy: "Drain pineapple well so the center does not get too wet.",
    pizzaNerdCopy: "A moisture-sensitive preset: pineapple brings sweetness and water, so topping load matters.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [
        { id: "ham", label: "Ham", amountHint: "thin slices or small pieces" },
        { id: "pineapple", label: "Pineapple", amountHint: "drained well" },
      ] },
      { group: "Gear", items: [] },
    ],
  },
  {
    id: "mushroom",
    name: "Mushroom",
    marker: "🍄",
    shortDescription: "Mushrooms with mozzarella and tomato sauce.",
    bestFor: "A simple mushroom pizza with classic sauce and cheese.",
    beginnerCopy: "Use sliced mushrooms, mozzarella and tomato sauce.",
    enthusiastCopy: "Slice mushrooms thinly or pre-cook them if they are very wet.",
    pizzaNerdCopy: "Mushrooms add water during the bake; even slicing and moderate topping load help the crust.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [{ id: "mushrooms", label: "Mushrooms", amountHint: "thinly sliced" }] },
      { group: "Gear", items: [] },
    ],
  },
  {
    id: "meat-lovers",
    name: "Meat lovers",
    marker: "🥓",
    shortDescription: "Pepperoni, ham and sausage.",
    bestFor: "A heavier topping pizza where keeping the layer even matters.",
    beginnerCopy: "Use pepperoni, ham and sausage, but keep the layer light.",
    enthusiastCopy: "Cured and cooked meats release fat, so avoid overloading the center.",
    pizzaNerdCopy: "A fat-rendering preset: balance meat quantity with bake heat and cheese moisture.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [tomatoSauce] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [
        { id: "pepperoni", label: "Pepperoni", amountHint: "thin, even layer" },
        { id: "ham", label: "Ham", amountHint: "small pieces" },
        { id: "sausage", label: "Sausage", amountHint: "cooked or ready-to-bake pieces" },
      ] },
      { group: "Gear", items: [] },
    ],
  },
  {
    id: "white-pizza",
    name: "White pizza",
    marker: "⚪",
    shortDescription: "No tomato sauce, just cheese and a creamy white base.",
    bestFor: "A no-tomato pizza with a softer, creamy flavor.",
    beginnerCopy: "Use mozzarella and a simple white base instead of tomato sauce.",
    enthusiastCopy: "Keep the white base thin so the dough still bakes cleanly.",
    pizzaNerdCopy: "A no-tomato preset: watch moisture from cheese and creamy base more than sauce acidity.",
    ingredientGroups: [
      { group: "Dough", items: doughItems },
      { group: "Sauce", items: [{ id: "white-base", label: "Creamy white base", amountHint: "thin layer" }] },
      { group: "Cheese", items: [mozzarella] },
      { group: "Toppings", items: [{ ...oliveOil, id: "optional-olive-oil" }] },
      { group: "Gear", items: [] },
    ],
  },
];

export function getPizzaSessionPreset(id?: string) {
  return findPizzaSessionPreset(id) ?? pizzaSessionPresets[0];
}

export function findPizzaSessionPreset(id?: string) {
  return pizzaSessionPresets.find((preset) => preset.id === id);
}
