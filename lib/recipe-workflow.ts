import type { ExperienceLevel } from "@/lib/experience-levels";

export type RecipeWorkflowActionId =
  | "planner"
  | "sauce"
  | "toppings"
  | "timer"
  | "doctor"
  | "save";

export type RecipeWorkflowAction = {
  id: RecipeWorkflowActionId;
  label: string;
  description: string;
  href?: string;
  priority: "primary" | "secondary" | "support";
  preservesQuery: boolean;
};

export type RecipeWorkflowHandoff = {
  heading: string;
  intro: string;
  primaryActionId: RecipeWorkflowActionId;
  detail: string;
  actions: RecipeWorkflowAction[];
};

export function recipeWorkflowQueryHref(route: string, recipeQuery: string) {
  const cleanRoute = route.startsWith("/") ? route : `/${route}`;
  return recipeQuery ? `${cleanRoute}?${recipeQuery}` : cleanRoute;
}

export function getRecipeWorkflowHandoff(level: ExperienceLevel, recipeQuery: string): RecipeWorkflowHandoff {
  const actions: RecipeWorkflowAction[] = [
    {
      id: "planner",
      label: "Plan fermentation",
      description: "Turn the dough numbers into mixing, resting, balling, warming and baking times.",
      href: recipeWorkflowQueryHref("/plan", recipeQuery),
      priority: "primary",
      preservesQuery: true,
    },
    {
      id: "sauce",
      label: "Calculate sauce",
      description: "Match tomato amount and moisture to this pizza count.",
      href: recipeWorkflowQueryHref("/sauce", recipeQuery),
      priority: "secondary",
      preservesQuery: true,
    },
    {
      id: "toppings",
      label: "Calculate toppings",
      description: "Balance cheese, topping load and wet ingredients before baking.",
      href: recipeWorkflowQueryHref("/toppings", recipeQuery),
      priority: "secondary",
      preservesQuery: true,
    },
    {
      id: "timer",
      label: "Start baking timer",
      description: "Use the oven timer view when the pizza goes in.",
      href: recipeWorkflowQueryHref("/timer", recipeQuery),
      priority: "secondary",
      preservesQuery: true,
    },
    {
      id: "doctor",
      label: "Open Dough Doctor",
      description: "If the dough feels wrong later, troubleshoot it with this recipe context.",
      href: recipeWorkflowQueryHref("/doctor", recipeQuery),
      priority: "support",
      preservesQuery: true,
    },
    {
      id: "save",
      label: "Save this recipe",
      description: "Keep the setup locally so you can reuse or compare it later.",
      priority: "support",
      preservesQuery: false,
    },
  ];

  if (level === "beginner") {
    return {
      heading: "Next steps for this recipe",
      intro: "You have the dough numbers. Next, plan when to mix, rest and bake.",
      primaryActionId: "planner",
      detail: "Start with the planner first. Sauce, toppings, timer and Dough Doctor are ready when you need them.",
      actions,
    };
  }

  if (level === "enthusiast") {
    return {
      heading: "Next steps for this recipe",
      intro: "Use the recipe as the base for the whole bake: timing controls fermentation, sauce and toppings control balance, and the timer helps repeatability.",
      primaryActionId: "planner",
      detail: "Planner is the best next move, then finish the pizza setup with sauce, toppings and oven timing.",
      actions,
    };
  }

  return {
    heading: "Next steps for this recipe",
    intro: "Carry this recipe context through the workflow so variables stay comparable from dough numbers to bake notes.",
    primaryActionId: "planner",
    detail: "Planner, Sauce, Toppings, Timer and Dough Doctor receive the current recipe query where supported.",
    actions,
  };
}

