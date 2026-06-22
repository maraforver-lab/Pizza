export type SauceStyle = "neapolitan" | "marinara" | "home" | "new-york";
export type SauceIngredient = { id: string; amount: number; unit: "g" | "leaves" | "cloves" };

export function calculateSauce(style: SauceStyle, pizzas: number, gramsPerPizza: number, waste: number) {
  const count = Math.max(1, pizzas);
  const finished = count * Math.max(20, gramsPerPizza) * (1 + Math.max(0, waste) / 100);
  const reduction = style === "neapolitan" || style === "marinara" ? 0 : style === "home" ? 0.15 : 0.18;
  const tomatoes = finished / (1 - reduction);
  const saltRate = style === "new-york" ? 0.012 : 0.01;
  const oilRate = style === "neapolitan" ? 0 : style === "marinara" ? 0.075 : style === "home" ? 0.02 : 0.025;
  const ingredients: SauceIngredient[] = [
    { id: "tomatoes", amount: tomatoes, unit: "g" },
    { id: "salt", amount: tomatoes * saltRate, unit: "g" },
  ];
  if (style !== "neapolitan") ingredients.push(
    { id: "oil", amount: tomatoes * oilRate, unit: "g" },
    { id: "garlic", amount: style === "marinara" ? count : Math.max(1, Math.round(tomatoes / (style === "home" ? 600 : 450))), unit: "cloves" },
    { id: "oregano", amount: style === "marinara" ? count * 0.5 : tomatoes * (style === "home" ? 0.0015 : 0.0025), unit: "g" },
  );
  if (style === "neapolitan") ingredients.push(
    { id: "basil", amount: count * 2, unit: "leaves" },
    { id: "pizzaOil", amount: count * 4.5, unit: "g" },
  );
  return { pizzas: count, finished, tomatoes, reduction, ingredients };
}
