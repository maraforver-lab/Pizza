export type CostInputs = {
  pizzas: number; diners: number; ballWeight: number; hydration: number; salt: number;
  flourPrice: number; sauceGrams: number; saucePrice: number; cheeseGrams: number; cheesePrice: number;
  toppingGrams: number; toppingPrice: number; extrasPerPizza: number; energy: number;
  packagingPerPizza: number; waste: number; sellingPrice: number;
};

export type CostLine = { id: string; amount: number; unit: string; cost: number };

export function calculatePizzaCost(input: CostInputs) {
  const pizzas = Math.max(1, input.pizzas);
  const doughTotal = pizzas * Math.max(1, input.ballWeight);
  const flourGrams = doughTotal / (1 + input.hydration / 100 + input.salt / 100 + 0.001);
  const waterGrams = flourGrams * input.hydration / 100;
  const saltGrams = flourGrams * input.salt / 100;
  const lines: CostLine[] = [
    { id: "flour", amount: flourGrams, unit: "g", cost: flourGrams / 1000 * input.flourPrice },
    { id: "doughExtras", amount: waterGrams + saltGrams, unit: "g", cost: pizzas * 0.04 },
    { id: "sauce", amount: input.sauceGrams * pizzas, unit: "g", cost: input.sauceGrams * pizzas / 1000 * input.saucePrice },
    { id: "cheese", amount: input.cheeseGrams * pizzas, unit: "g", cost: input.cheeseGrams * pizzas / 1000 * input.cheesePrice },
    { id: "toppings", amount: input.toppingGrams * pizzas, unit: "g", cost: input.toppingGrams * pizzas / 1000 * input.toppingPrice },
    { id: "extras", amount: pizzas, unit: "pizza", cost: input.extrasPerPizza * pizzas },
    { id: "energy", amount: 1, unit: "session", cost: input.energy },
    { id: "packaging", amount: pizzas, unit: "pizza", cost: input.packagingPerPizza * pizzas },
  ];
  const subtotal = lines.reduce((sum, line) => sum + line.cost, 0);
  const wasteCost = subtotal * Math.max(0, input.waste) / 100;
  const total = subtotal + wasteCost;
  const revenue = pizzas * Math.max(0, input.sellingPrice);
  return { lines, flourGrams, subtotal, wasteCost, total, perPizza: total / pizzas, perDiner: total / Math.max(1, input.diners), revenue, profit: revenue - total, margin: revenue > 0 ? (revenue - total) / revenue * 100 : 0 };
}
