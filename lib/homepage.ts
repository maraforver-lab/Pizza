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
      "Choose the pizza night you want. DoughTools turns it into a recipe, shopping list, timeline, kitchen guidance and review — so you can focus on making the pizza.",
    primaryCta: { label: "Plan my new pizza", href: "/session/start" },
    secondaryCta: { label: "See how it works", href: "#how-it-works" },
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
    { name: "Pizza Session", description: "Create the guided plan for recipe, shopping, timeline and cooking.", href: "/session/start", action: "Plan my next pizza" },
    { name: "Quick Calculator", description: "Get dough amounts fast without creating a full Pizza Session.", href: "/calculator/quick", action: "Calculate my dough" },
    { name: "Learning Center", description: "Find the current dough, sauce, oven, style and troubleshooting guides.", href: "/guide", action: "Open Learning Center" },
    { name: "Dough Guide", description: "Learn the dough process from mixing to a ball ready to stretch.", href: "/guides/dough", action: "Open Dough Guide" },
    { name: "Pizza Sauce", description: "Match sauce method and quantity to the pizzas you plan to make.", href: "/sauce", action: "Calculate my sauce", preserveRecipe: true },
    { name: "Troubleshooting", description: "Solve dough, shaping, launch, topping and bake problems.", href: "/guide/pizza-troubleshooting", action: "Open troubleshooting" },
  ] satisfies HomepageTool[],
  benefits: [
    "One guided pizza session",
    "Dough amounts calculated from your choices",
    "Realistic timeline with practical timing",
    "Shopping list from your pizza preset",
    "Kitchen Mode for one task at a time",
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
    { name: "Pizza Styles", href: "/styles" },
    { name: "Ovens", href: "/ovens" },
    { name: "Topping Balance Lab", href: "/toppings" },
    { name: "Pizza Bake Timer", href: "/timer" },
    { name: "Pizza costs", href: "/costs" },
    { name: "Updates", href: "/updates" },
  ],
} as const;
