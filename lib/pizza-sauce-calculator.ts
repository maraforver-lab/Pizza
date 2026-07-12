export type SauceMethod = "classic-neapolitan" | "marinara" | "home-oven-cooked";

export type SauceTomatoType =
  | "san-marzano"
  | "whole-peeled"
  | "crushed"
  | "passata"
  | "fresh";

export type SauceReservePercent = 0 | 5 | 10 | 15;
export type SauceReductionPercent = 0 | 10 | 15 | 20;
export type SauceGarlicIntensity = "mild" | "traditional" | "strong";
export type SauceCanSize = 400 | 800;

export type SauceCalculatorInput = {
  method: SauceMethod;
  pizzaCount: number;
  sauceGramsPerPizza: number;
  tomatoType: SauceTomatoType;
  reservePercent: SauceReservePercent;
  saltPercent?: number;
  garlicIntensity?: SauceGarlicIntensity;
  reductionPercent?: SauceReductionPercent;
  canSizeGrams?: SauceCanSize;
};

export type SauceIngredientResult = {
  id: "tomato" | "salt" | "oil" | "garlic" | "oregano" | "basil" | "topping-oil";
  label: string;
  amountLabel: string;
  grams?: number;
  note?: string;
};

export type SauceCalculatorResult = {
  method: SauceMethod;
  pizzaCount: number;
  sauceGramsPerPizza: number;
  baseSauceGrams: number;
  preparationSauceGrams: number;
  startingTomatoGrams: number;
  finishedSauceGrams: number;
  reserveGrams: number;
  reservePercent: SauceReservePercent;
  reductionPercent: SauceReductionPercent;
  saltPercent: number;
  saltRangeLabel: string;
  canSizeGrams: SauceCanSize;
  cansNeeded: number;
  canTotalGrams: number;
  estimatedLeftoverGrams: number;
  ingredients: SauceIngredientResult[];
  toppingGuidance: SauceIngredientResult[];
  calculationNote: string;
};

export const sauceMethodLabels: Record<SauceMethod, string> = {
  "classic-neapolitan": "Classic Neapolitan",
  marinara: "Marinara",
  "home-oven-cooked": "Home-oven cooked sauce",
};

export const tomatoTypeLabels: Record<SauceTomatoType, string> = {
  "san-marzano": "San Marzano DOP or similar high-quality San Marzano",
  "whole-peeled": "Other quality whole peeled plum tomatoes",
  crushed: "Crushed tomatoes",
  passata: "Passata",
  fresh: "Fresh ripe tomatoes",
};

const methodDefaultSauceGrams: Record<SauceMethod, number> = {
  "classic-neapolitan": 70,
  marinara: 80,
  "home-oven-cooked": 80,
};

const garlicMultiplier: Record<SauceGarlicIntensity, number> = {
  mild: 0.5,
  traditional: 1,
  strong: 1.5,
};

export function defaultSaltPercentForTomato(tomatoType: SauceTomatoType, method: SauceMethod): number {
  if (method === "classic-neapolitan") {
    return tomatoType === "san-marzano" ? 0.85 : 1.1;
  }

  if (method === "home-oven-cooked") {
    return 1;
  }

  return tomatoType === "san-marzano" ? 0.9 : 1.05;
}

export function saltReferenceRangeForTomato(tomatoType: SauceTomatoType, method: SauceMethod): string {
  if (method === "classic-neapolitan" && tomatoType === "san-marzano") return "0.7–1.0%";
  if (method === "classic-neapolitan") return "1.0–1.2%";
  if (method === "home-oven-cooked") return "0.8–1.2%";
  return "0.8–1.1%";
}

export function defaultSauceCalculatorInput(): SauceCalculatorInput {
  return {
    method: "classic-neapolitan",
    pizzaCount: 4,
    sauceGramsPerPizza: methodDefaultSauceGrams["classic-neapolitan"],
    tomatoType: "san-marzano",
    reservePercent: 10,
    garlicIntensity: "traditional",
    reductionPercent: 15,
    canSizeGrams: 400,
  };
}

export function defaultSauceGramsForMethod(method: SauceMethod): number {
  return methodDefaultSauceGrams[method];
}

export function clampPizzaCount(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(30, Math.max(1, Math.round(value)));
}

export function clampSauceGramsPerPizza(value: number, method: SauceMethod): number {
  if (!Number.isFinite(value)) return defaultSauceGramsForMethod(method);
  return Math.min(140, Math.max(30, Math.round(value)));
}

export function clampPercent(value: number, fallback: number, min = 0, max = 30): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export function roundGrams(value: number): number {
  return Math.round(value);
}

export function roundTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

export function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function formatGrams(value: number, precision: 0 | 1 = 0): string {
  const rounded = precision === 1 ? roundTenth(value) : roundGrams(value);
  return `${rounded.toLocaleString("en", {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  })} g`;
}

export function calculatePizzaSauce(input: SauceCalculatorInput): SauceCalculatorResult {
  const method = input.method;
  const pizzaCount = clampPizzaCount(input.pizzaCount);
  const sauceGramsPerPizza = clampSauceGramsPerPizza(input.sauceGramsPerPizza, method);
  const reservePercent = input.reservePercent;
  const reductionPercent = method === "home-oven-cooked" ? (input.reductionPercent ?? 15) : 0;
  const canSizeGrams = input.canSizeGrams ?? 400;
  const tomatoType = input.tomatoType;
  const saltPercent = clampPercent(
    input.saltPercent ?? defaultSaltPercentForTomato(tomatoType, method),
    defaultSaltPercentForTomato(tomatoType, method),
    0.4,
    1.8,
  );

  const baseSauceGrams = pizzaCount * sauceGramsPerPizza;
  const preparationSauceGrams = baseSauceGrams * (1 + reservePercent / 100);
  const reductionFraction = reductionPercent / 100;
  const startingTomatoGrams = method === "home-oven-cooked"
    ? preparationSauceGrams / (1 - reductionFraction)
    : preparationSauceGrams;
  const finishedSauceGrams = preparationSauceGrams;
  const reserveGrams = preparationSauceGrams - baseSauceGrams;
  const saltGrams = startingTomatoGrams * (saltPercent / 100);
  const cansNeeded = Math.max(1, Math.ceil(startingTomatoGrams / canSizeGrams));
  const canTotalGrams = cansNeeded * canSizeGrams;
  const estimatedLeftoverGrams = Math.max(0, canTotalGrams - startingTomatoGrams);

  const ingredients: SauceIngredientResult[] = [
    {
      id: "tomato",
      label: method === "home-oven-cooked" ? "Starting tomato quantity" : "Tomato",
      amountLabel: formatGrams(startingTomatoGrams),
      grams: roundGrams(startingTomatoGrams),
      note: tomatoTypeLabels[tomatoType],
    },
    {
      id: "salt",
      label: "Salt",
      amountLabel: formatGrams(saltGrams, 1),
      grams: roundTenth(saltGrams),
      note: `${roundTenth(saltPercent)}% of tomato weight; taste and adjust.`,
    },
  ];

  const toppingGuidance: SauceIngredientResult[] = [];

  if (method === "classic-neapolitan") {
    toppingGuidance.push(
      {
        id: "basil",
        label: "Fresh basil",
        amountLabel: "a few leaves per pizza",
        note: "Topping guidance, not blended into the tomato base.",
      },
      {
        id: "topping-oil",
        label: "Extra-virgin olive oil",
        amountLabel: `${formatGrams(pizzaCount * 6.5)} total`,
        grams: roundHalf(pizzaCount * 6.5),
        note: "About 6–7 g per pizza when following a traditional Margherita topping profile.",
      },
    );
  }

  if (method === "marinara") {
    const cloves = pizzaCount * garlicMultiplier[input.garlicIntensity ?? "traditional"];
    ingredients.push(
      {
        id: "garlic",
        label: "Garlic",
        amountLabel: `${roundHalf(cloves).toLocaleString("en", { maximumFractionDigits: 1 })} small cloves`,
        note: "Adjust for clove size and preference.",
      },
      {
        id: "oregano",
        label: "Dried oregano",
        amountLabel: formatGrams(pizzaCount * 0.5, 1),
        grams: roundTenth(pizzaCount * 0.5),
        note: "About 0.5 g per pizza as a practical starting point.",
      },
      {
        id: "oil",
        label: "Extra-virgin olive oil",
        amountLabel: formatGrams(pizzaCount * 7),
        grams: roundHalf(pizzaCount * 7),
        note: "About 6–8 g per pizza.",
      },
    );
  }

  if (method === "home-oven-cooked") {
    ingredients.push(
      {
        id: "oil",
        label: "Extra-virgin olive oil",
        amountLabel: formatGrams(preparationSauceGrams * 0.02),
        grams: roundHalf(preparationSauceGrams * 0.02),
        note: "Restrained amount for gentle cooking.",
      },
      {
        id: "garlic",
        label: "Optional garlic",
        amountLabel: `${Math.max(1, Math.round(preparationSauceGrams / 450))} small cloves`,
        note: "Optional; leave out for a cleaner tomato profile.",
      },
      {
        id: "oregano",
        label: "Optional dried oregano",
        amountLabel: formatGrams(preparationSauceGrams * 0.0015, 1),
        grams: roundTenth(preparationSauceGrams * 0.0015),
        note: "Optional; useful for some longer-baked styles.",
      },
    );
  }

  return {
    method,
    pizzaCount,
    sauceGramsPerPizza,
    baseSauceGrams: roundGrams(baseSauceGrams),
    preparationSauceGrams: roundGrams(preparationSauceGrams),
    startingTomatoGrams: roundGrams(startingTomatoGrams),
    finishedSauceGrams: roundGrams(finishedSauceGrams),
    reserveGrams: roundGrams(reserveGrams),
    reservePercent,
    reductionPercent,
    saltPercent: roundTenth(saltPercent),
    saltRangeLabel: saltReferenceRangeForTomato(tomatoType, method),
    canSizeGrams,
    cansNeeded,
    canTotalGrams,
    estimatedLeftoverGrams: roundGrams(estimatedLeftoverGrams),
    ingredients,
    toppingGuidance,
    calculationNote: method === "home-oven-cooked"
      ? "Starting tomato mass = required finished sauce ÷ (1 − reduction fraction)."
      : "Tomato mass equals the target sauce quantity plus the selected preparation reserve.",
  };
}
