export type HomepageTool = {
  name: string;
  description: string;
  href: string;
  action: string;
  preserveRecipe?: boolean;
};

export const homepageContent = {
  hero: {
    eyebrow: "Pizza-making workspace",
    h1: "Plan and bake better pizza without guessing.",
    intro:
      "DoughTools guides one pizza session from dough plan to timeline, shopping list and kitchen steps.",
    primaryCta: { label: "Start Pizza Session", href: "/session/start" },
    secondaryCta: { label: "Open calculator", href: "/?calculator=1" },
    learnCta: { label: "Learn how it works", href: "/guide" },
  },
  workflow: [
    { title: "Choose your pizza", description: "Pick your baking path and pizza preset." },
    { title: "Get your dough plan", description: "See how much flour, water, salt and yeast you need." },
    { title: "Follow your timeline", description: "Know when to mix, rest, ball, preheat and bake." },
    { title: "Shop, bake and improve", description: "Use the shopping list and Kitchen Mode, then save notes for next time." },
  ],
  coreTools: [
    { name: "Dough Calculator", description: "Open the full calculator when you want direct control of the recipe numbers.", href: "/?calculator=1", action: "Open calculator" },
    { name: "Fermentation Planner", description: "Create the timeline for mixing, resting, balling and baking.", href: "/plan", action: "Plan the dough", preserveRecipe: true },
    { name: "Sauce Calculator", description: "Match tomato sauce quantity and moisture to the pizza count.", href: "/sauce", action: "Calculate sauce", preserveRecipe: true },
    { name: "Toppings Calculator", description: "Balance cheese, topping load and moisture before baking.", href: "/toppings", action: "Balance toppings", preserveRecipe: true },
    { name: "Baking Timer", description: "Keep a focused timer ready while the pizza is in the oven.", href: "/timer", action: "Open timer", preserveRecipe: true },
    { name: "Dough Doctor", description: "Compare dough problems with the current recipe settings.", href: "/doctor", action: "Diagnose dough", preserveRecipe: true },
    { name: "Learn", description: "Read practical pizza guidance when you want more background.", href: "/guide", action: "Open guide" },
  ] satisfies HomepageTool[],
  benefits: [
    "One guided pizza session instead of scattered steps.",
    "Dough amounts calculated from your choices.",
    "A practical timeline for mixing, resting, preheating and baking.",
    "Shopping and Kitchen Mode stay connected to the same local session.",
    "Progress is saved in this browser on this device.",
  ],
  trust: [
    "Built for home ovens, baking steel and high-temperature pizza ovens.",
    "Uses transparent baker’s percentage math without changing the formulas behind the tools.",
    "Keeps Beginner, Enthusiast and Pizza Nerd guidance available without making the homepage busy.",
    "Keeps local-first limits clear and avoids hype.",
  ],
  secondaryTools: [
    { name: "Start Here", href: "/start" },
    { name: "Pizza Styles", href: "/styles" },
    { name: "Dough Guide", href: "/guide" },
    { name: "Oven Guide", href: "/ovens" },
    { name: "Equipment Guide", href: "/gear" },
    { name: "Pizza History", href: "/history" },
    { name: "Recipe Library", href: "/community" },
    { name: "Pizza Coach", href: "/coach" },
    { name: "Cost Calculator", href: "/costs" },
  ],
} as const;
