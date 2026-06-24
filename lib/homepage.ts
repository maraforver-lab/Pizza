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
    h1: "Make better pizza with better decisions.",
    intro:
      "DoughTools helps you choose your guidance level, calculate dough, plan fermentation and understand the next practical step.",
    primaryCta: { label: "Calculate your dough", href: "#top" },
    secondaryCta: { label: "Choose your guidance level", href: "#experience-level" },
  },
  workflow: [
    { title: "Choose your level", description: "Pick Beginner, Home Pizza Maker or Advanced so the guidance matches how much detail you want." },
    { title: "Calculate your dough", description: "Use baker’s percentages to portion flour, water, salt and leavening for the pizza you want." },
    { title: "Plan fermentation and baking", description: "Turn the recipe into clear mixing, resting, balling, warming and baking times." },
    { title: "Troubleshoot and improve", description: "Use Dough Doctor, saved bakes and notes to understand what to adjust next time." },
  ],
  coreTools: [
    { name: "Dough Calculator", description: "Build the dough recipe and ingredient weights.", href: "#top", action: "Start here" },
    { name: "Fermentation Planner", description: "Create the timeline for mixing, resting, balling and baking.", href: "/plan", action: "Plan the dough", preserveRecipe: true },
    { name: "Sauce Calculator", description: "Match tomato sauce quantity and moisture to the pizza count.", href: "/sauce", action: "Calculate sauce", preserveRecipe: true },
    { name: "Toppings Calculator", description: "Balance cheese, topping load and moisture before baking.", href: "/toppings", action: "Balance toppings", preserveRecipe: true },
    { name: "Baking Timer", description: "Keep a focused timer ready while the pizza is in the oven.", href: "/timer", action: "Open timer", preserveRecipe: true },
    { name: "Dough Doctor", description: "Compare dough problems with the current recipe settings.", href: "/doctor", action: "Diagnose dough", preserveRecipe: true },
  ] satisfies HomepageTool[],
  trust: [
    "Works with electric ovens, baking steel and high-temperature gas pizza ovens.",
    "Uses transparent baker’s percentages instead of hidden recipe math.",
    "Adapts guidance for Beginner, Home Pizza Maker and Advanced workflows.",
    "Connects dough, fermentation, sauce, toppings, baking and learning.",
    "Saved recipes stay on this device unless you choose account features separately.",
    "Helps identify common dough and baking problems without promising perfection.",
  ],
  secondaryTools: [
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
