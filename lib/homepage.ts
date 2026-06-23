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
    intro: "Calculate your dough, plan fermentation, prepare the right amount of sauce and toppings, and improve every bake.",
    primaryCta: { label: "Build my dough recipe", href: "#top" },
    secondaryCta: { label: "Explore pizza styles", href: "/styles" },
  },
  workflow: [
    { title: "Choose your pizza", description: "Start with a style, oven and fermentation plan that match the pizza you want." },
    { title: "Calculate the dough", description: "Use baker’s percentages to portion flour, water, salt and leavening." },
    { title: "Follow the schedule", description: "Turn the recipe into clear mixing, resting, balling and baking times." },
    { title: "Bake and improve", description: "Use the timer, save what worked and diagnose the next adjustment." },
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
