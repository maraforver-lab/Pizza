export type NavigationGroupId = "make" | "learn" | "my" | "support";

export type NavigationItemId =
  | "start"
  | "calculator"
  | "planner"
  | "sauce"
  | "toppings"
  | "timer"
  | "doctor"
  | "styles"
  | "guide"
  | "ovens"
  | "gear"
  | "history"
  | "saved-recipes"
  | "journal"
  | "account"
  | "community"
  | "coach"
  | "costs"
  | "updates";

export type NavigationItem = {
  id: NavigationItemId;
  label: string;
  href: string;
  description: string;
  preserveQuery?: boolean;
};

export type NavigationGroup = {
  id: NavigationGroupId;
  label: string;
  shortLabel: string;
  description: string;
  items: readonly NavigationItem[];
};

export const navigationGroups = [
  {
    id: "make",
    label: "Make pizza",
    shortLabel: "Make",
    description: "Choose a style, calculate dough, plan fermentation, prepare toppings and bake.",
    items: [
      { id: "start", label: "Start Here", href: "/start", description: "Choose a simple pizza path before tuning detailed settings." },
      { id: "calculator", label: "Dough Calculator", href: "/?calculator=1", description: "Start with dough weight, hydration, salt, yeast and fermentation." },
      { id: "planner", label: "Fermentation Planner", href: "/plan", description: "Turn the recipe into a timeline and preparation plan." },
      { id: "sauce", label: "Sauce Calculator", href: "/sauce", description: "Calculate tomato sauce for the number of pizzas." },
      { id: "toppings", label: "Toppings Calculator", href: "/toppings", description: "Balance cheese, toppings and moisture before baking." },
      { id: "timer", label: "Baking Timer", href: "/timer", description: "Use a pizza-oven timer while baking." },
    ],
  },
  {
    id: "learn",
    label: "Learn & troubleshoot",
    shortLabel: "Learn",
    description: "Understand styles, ovens, equipment and dough problems.",
    items: [
      { id: "doctor", label: "Dough Doctor", href: "/doctor", description: "Diagnose dough problems using the current recipe." },
      { id: "styles", label: "Pizza Styles", href: "/styles", description: "Pick a practical starting style and apply it to the calculator." },
      { id: "guide", label: "Dough Guide", href: "/guide", description: "Learn terminology, flour strength and dough principles." },
      { id: "ovens", label: "Oven Guide", href: "/ovens", description: "Compare oven types and understand trade-offs." },
      { id: "gear", label: "Equipment Guide", href: "/gear", description: "Build a practical pizza station around the oven." },
      { id: "history", label: "Pizza History", href: "/history", description: "Read the story and culture behind pizza." },
    ],
  },
  {
    id: "my",
    label: "My DoughTools",
    shortLabel: "My",
    description: "Return to saved recipes, journal entries and your account.",
    items: [
      { id: "saved-recipes", label: "Saved Recipes", href: "/?calculator=1#my-recipes", description: "Open the saved recipe section on the calculator." },
      { id: "journal", label: "Pizza Journal", href: "/journal", description: "Record what happened and what to improve next time." },
      { id: "account", label: "Account", href: "/account", description: "Sign in and manage your DoughTools account.", preserveQuery: false },
    ],
  },
  {
    id: "support",
    label: "More tools",
    shortLabel: "More",
    description: "Helpful secondary tools and project information.",
    items: [
      { id: "community", label: "Recipe Library", href: "/community", description: "Browse useful starter recipes and local shared setups." },
      { id: "coach", label: "Pizza Coach", href: "/coach", description: "Get local guidance from the current recipe settings." },
      { id: "costs", label: "Cost Calculator", href: "/costs", description: "Estimate the total cost of a pizza night." },
      { id: "updates", label: "Updates", href: "/updates", description: "See what changed and why DoughTools exists.", preserveQuery: false },
    ],
  },
] as const satisfies readonly NavigationGroup[];

export const primaryNavigationItemId = "calculator" as const;

export const navigationItems: readonly NavigationItem[] = navigationGroups.flatMap((group) => [...group.items]);

export function navigationItemById(id: NavigationItemId): NavigationItem | undefined {
  return navigationItems.find((item) => item.id === id);
}

export function splitNavigationHref(href: string) {
  const [pathWithSearch, hash = ""] = href.split("#");
  const [pathname] = pathWithSearch.split("?");
  return { pathname: pathname || "/", hash };
}

export function isNavigationItemActive(item: NavigationItem, pathname: string, hash = "") {
  const target = splitNavigationHref(item.href);
  if (target.hash) return pathname === target.pathname && hash === target.hash;
  return pathname === target.pathname && hash === "";
}

export function isNavigationGroupActive(group: NavigationGroup, pathname: string, hash = "") {
  return group.items.some((item) => isNavigationItemActive(item, pathname, hash));
}
