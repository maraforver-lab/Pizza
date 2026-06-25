export type HomepageTool = {
  name: string;
  description: string;
  href: string;
  action: string;
  preserveRecipe?: boolean;
};

export const homepageContent = {
  hero: {
    eyebrow: "Pizza-making made simple",
    h1: "Plan and bake better pizza without guessing.",
    intro:
      "DoughTools guides one pizza session from dough plan to timeline, shopping list and kitchen steps.",
    primaryCta: { label: "Start Pizza Session", href: "/session/start" },
    secondaryCta: { label: "Open calculator", href: "/?calculator=1" },
    learnCta: { label: "Learn how it works", href: "/guide" },
  },
  workflow: [
    { title: "How you bake", description: "Choose your oven or cooking method." },
    { title: "Pizza style", description: "Pick the pizza you want to make." },
    { title: "When to eat", description: "Tell us when you want to eat." },
    { title: "How many", description: "Select the number of pizzas." },
    { title: "Flour", description: "Choose the flour you have." },
    { title: "Dough plan", description: "Get your dough amounts and sizes." },
    { title: "Timeline", description: "See your step-by-step time plan." },
    { title: "Shopping list", description: "Everything you need for your pizzas." },
  ],
  coreTools: [
    { name: "Dough Calculator", description: "Direct recipe control.", href: "/?calculator=1", action: "Open calculator" },
    { name: "Planner", description: "Fermentation and bake timing.", href: "/plan", action: "Open planner", preserveRecipe: true },
    { name: "Dough Doctor", description: "Troubleshoot dough problems.", href: "/doctor", action: "Open doctor", preserveRecipe: true },
    { name: "Sauce", description: "Match sauce to pizza count.", href: "/sauce", action: "Open sauce", preserveRecipe: true },
    { name: "Toppings", description: "Balance cheese and toppings.", href: "/toppings", action: "Open toppings", preserveRecipe: true },
    { name: "Timer", description: "Keep bake timing focused.", href: "/timer", action: "Open timer", preserveRecipe: true },
    { name: "Guide", description: "Learn the pizza basics.", href: "/guide", action: "Open guide" },
    { name: "Account", description: "Review local-first account notes.", href: "/account", action: "Open account" },
    { name: "Updates", description: "See what changed recently.", href: "/updates", action: "Open updates" },
  ] satisfies HomepageTool[],
  benefits: [
    "One guided pizza session",
    "Dough amounts calculated from your choices",
    "Realistic timeline with practical timing",
    "Shopping list from your pizza preset",
    "Kitchen Mode for one task at a time",
    "Local-first saved progress",
  ],
  trust: [
    "Saved locally",
    "Private",
    "No tracking",
    "You control your session data",
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
