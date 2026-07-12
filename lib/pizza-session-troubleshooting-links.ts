import type { PizzaTroubleshootingCategoryId } from "@/lib/pizza-troubleshooting";

export type PizzaSessionTroubleshootingLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

export const PIZZA_TROUBLESHOOTING_ROUTE = "/guide/pizza-troubleshooting";
export const PIZZA_SESSION_BAKING_TROUBLESHOOTING_CATEGORY: PizzaTroubleshootingCategoryId = "baking";
export const PIZZA_SESSION_TOPPINGS_TROUBLESHOOTING_CATEGORY: PizzaTroubleshootingCategoryId = "toppings";

export function buildPizzaTroubleshootingCategoryHref(categoryId: PizzaTroubleshootingCategoryId) {
  return `${PIZZA_TROUBLESHOOTING_ROUTE}#${categoryId}`;
}

export function getPizzaSessionBakingTroubleshootingLink(
  label = "See baking troubleshooting",
): PizzaSessionTroubleshootingLink {
  return {
    href: buildPizzaTroubleshootingCategoryHref(PIZZA_SESSION_BAKING_TROUBLESHOOTING_CATEGORY),
    label,
    ariaLabel: `${label} in the Pizza Troubleshooting guide`,
  };
}

export function getPizzaSessionToppingsTroubleshootingLink(
  label = "Toppings troubleshooting",
): PizzaSessionTroubleshootingLink {
  return {
    href: buildPizzaTroubleshootingCategoryHref(PIZZA_SESSION_TOPPINGS_TROUBLESHOOTING_CATEGORY),
    label,
    ariaLabel: `${label} in the Pizza Troubleshooting guide`,
  };
}
