export type HomepageTool = {
  name: string;
  description: string;
  href: string;
  action: string;
  preserveRecipe?: boolean;
};

export const homepageContent = {
  hero: {
    eyebrow: "Your pizza, planned properly.",
    h1: "Better pizza starts before the oven.",
    intro:
      "Choose the pizza night you want. DoughTools turns it into a pizza plan with a recipe, shopping list, Timeline, Kitchen steps and Review — so you can focus on making the pizza.",
    primaryCta: { label: "Plan a pizza", href: "/session/start" },
    secondaryCta: { label: "See how it works", href: "#how-it-works" },
    learnCta: { label: "Pizza guides", href: "/guide" },
  },
  workflow: [
    { title: "How you bake", description: "Choose your oven or cooking method." },
    { title: "Choose your pizza", description: "Pick the pizza you want to make." },
    { title: "When to eat", description: "Tell us when you want to eat." },
    { title: "How many", description: "Select the number of pizzas." },
    { title: "Flour", description: "Choose the flour you have." },
    { title: "Pizza plan", description: "Get your dough amounts and sizes." },
    { title: "Timeline", description: "See your step-by-step time plan." },
    { title: "Shopping list", description: "Everything you need for your pizzas." },
  ],
  coreTools: [
    { name: "Pizza plan", description: "Create the guided plan for recipe, shopping list, Timeline and cooking.", href: "/session/start", action: "Plan a pizza" },
    { name: "Quick Calculator", description: "Get dough amounts fast without creating a full pizza plan.", href: "/calculator/quick", action: "Calculate my dough" },
    { name: "Pizza guides", description: "Find the current dough, sauce, oven, pizza and troubleshooting guides.", href: "/guide", action: "Open Pizza guides" },
    { name: "Make the dough", description: "Learn the dough process from mixing to a ball ready to stretch.", href: "/guides/dough", action: "Open dough guide" },
    { name: "Make the sauce", description: "Match sauce method and quantity to the pizzas you plan to make.", href: "/sauce", action: "Make the sauce", preserveRecipe: true },
    { name: "Troubleshooting", description: "Solve dough, shaping, launch, topping and bake problems.", href: "/guide/pizza-troubleshooting", action: "Open troubleshooting" },
  ] satisfies HomepageTool[],
  benefits: [
    "One guided pizza plan",
    "Dough amounts calculated from your choices",
    "Timeline with practical timing",
    "Shopping list from your pizza preset",
    "Kitchen steps for one task at a time",
    "Review notes for the next bake",
    "Local-first saved progress",
  ],
  trust: [
    "Saved locally",
    "Private",
    "No tracking",
    "You control your session data",
  ],
  secondaryTools: [
    { name: "Choose your pizza", href: "/styles" },
    { name: "Ovens", href: "/ovens" },
    { name: "Topping Balance Lab", href: "/toppings" },
    { name: "Bake timer", href: "/timer" },
    { name: "Pizza costs", href: "/costs" },
    { name: "Updates", href: "/updates" },
  ],
} as const;
