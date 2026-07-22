export type NavigationGroupId = "primary" | "learning" | "secondary" | "account";

export type NavigationItemId =
  | "start"
  | "guide"
  | "dough-guide"
  | "sauce"
  | "toppings"
  | "ovens"
  | "styles"
  | "practical-tips"
  | "troubleshooting"
  | "quick-calculator"
  | "about"
  | "account";

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
    id: "primary",
    label: "Primary product",
    shortLabel: "Product",
    description: "The main DoughTools entry points for planning a pizza night.",
    items: [
      { id: "start", label: "Plan a pizza", href: "/session/start", description: "Create the guided pizza plan for Dough Plan, Shopping list, Timeline, Kitchen and Review." },
      { id: "guide", label: "Pizza guides", href: "/guide", description: "Start with the canonical learning hub for dough, sauce, ovens, styles and troubleshooting." },
    ],
  },
  {
    id: "learning",
    label: "Pizza guides",
    shortLabel: "Learning",
    description: "Canonical learning pages for current pizza-making guidance.",
    items: [
      { id: "dough-guide", label: "Make the dough", href: "/guides/dough", description: "Follow dough preparation step by step from mixing to a dough ball ready to stretch." },
      { id: "sauce", label: "Make the sauce", href: "/sauce", description: "Learn sauce methods, tomato choices and sauce quantities." },
      { id: "toppings", label: "Choose toppings", href: "/toppings", description: "Balance sauce, cheese and topping moisture before baking." },
      { id: "ovens", label: "Choose your oven", href: "/ovens", description: "Compare oven types and understand practical bake trade-offs." },
      { id: "styles", label: "Choose your pizza", href: "/styles", description: "Compare pizza styles and choose the style you want to make." },
      { id: "practical-tips", label: "Practical pizza tips", href: "/guide/practical-pizza-tips", description: "Find practical storage, timing and problem-solving topics for future guide articles." },
      { id: "troubleshooting", label: "Fix pizza problems", href: "/guide/pizza-troubleshooting", description: "Fix common dough, topping and baking problems." },
    ],
  },
  {
    id: "secondary",
    label: "Secondary utility",
    shortLabel: "Utility",
    description: "The one globally exposed standalone utility that supports, but does not replace, a pizza plan.",
    items: [
      { id: "quick-calculator", label: "Quick dough calculator", href: "/calculator/quick", description: "Calculate dough amounts quickly without creating a full pizza plan." },
    ],
  },
  {
    id: "account",
    label: "Account and company",
    shortLabel: "Account",
    description: "Account access and the product story.",
    items: [
      { id: "about", label: "About", href: "/about", description: "Read why DoughTools exists and how it is shaped by real pizza nights." },
      { id: "account", label: "Account", href: "/account", description: "Sign in and manage your DoughTools account.", preserveQuery: false },
    ],
  },
] as const satisfies readonly NavigationGroup[];

export const primaryNavigationItemId = "start" as const;

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
