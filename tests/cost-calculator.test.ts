import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getCostComparisonSummary } from "@/lib/cost-comparison";
import { calculatePizzaCost, type CostInputs } from "@/lib/cost-calculator";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const baseInput: CostInputs = {
  ballWeight: 260,
  cheeseGrams: 90,
  cheesePrice: 11,
  diners: 4,
  energy: 1.5,
  extrasPerPizza: 0.2,
  flourPrice: 2.8,
  hydration: 64,
  packagingPerPizza: 0,
  pizzas: 4,
  salt: 2.8,
  sauceGrams: 80,
  saucePrice: 3.5,
  sellingPrice: 12,
  toppingGrams: 60,
  toppingPrice: 12,
  waste: 5,
};

describe("pizza cost calculator", () => {
  it("keeps the existing four-pizza calculation output unchanged", () => {
    const result = calculatePizzaCost(baseInput);

    expect(result.flourGrams).toBeCloseTo(623.13, 2);
    expect(result.subtotal).toBeCloseTo(12.16, 2);
    expect(result.wasteCost).toBeCloseTo(0.61, 2);
    expect(result.total).toBeCloseTo(12.77, 2);
    expect(result.perPizza).toBeCloseTo(3.19, 2);
    expect(result.perDiner).toBeCloseTo(3.19, 2);
    expect(result.revenue).toBe(48);
    expect(result.profit).toBeCloseTo(35.23, 2);
    expect(result.margin).toBeCloseTo(73.4, 1);
  });

  it("keeps the one-pizza and large-party formulas stable", () => {
    const onePizza = calculatePizzaCost({ ...baseInput, diners: 1, pizzas: 1, sellingPrice: 10 });
    const party = calculatePizzaCost({ ...baseInput, diners: 20, pizzas: 20, sellingPrice: 14 });

    expect(onePizza.total).toBeCloseTo(4.37, 2);
    expect(onePizza.perPizza).toBeCloseTo(4.37, 2);
    expect(onePizza.revenue).toBe(10);
    expect(party.total).toBeCloseTo(57.56, 2);
    expect(party.perPizza).toBeCloseTo(2.88, 2);
    expect(party.revenue).toBe(280);
  });

  it("handles decimal, zero and invalid-adjacent values through the existing guards", () => {
    const result = calculatePizzaCost({
      ...baseInput,
      ballWeight: 0,
      diners: 0,
      pizzas: 0,
      sellingPrice: -5,
      waste: -10,
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.perDiner).toBe(result.total);
    expect(result.revenue).toBe(0);
    expect(result.margin).toBe(0);
  });

  it("classifies home, restaurant and similar-cost comparison states truthfully", () => {
    expect(getCostComparisonSummary({ homeTotal: 20, restaurantTotal: 0 }).state).toBe("missing-restaurant");
    expect(getCostComparisonSummary({ homeTotal: 20, restaurantTotal: 40 }).state).toBe("home-cheaper");
    expect(getCostComparisonSummary({ homeTotal: 40, restaurantTotal: 20 }).state).toBe("restaurant-cheaper");
    expect(getCostComparisonSummary({ homeTotal: 40, restaurantTotal: 41 }).state).toBe("similar");
  });

  it("keeps the Costs page connected to the existing calculation source of truth", () => {
    const page = source("components/costs/PizzaCostsPlayfulClient.tsx");

    expect(page).toContain("calculatePizzaCost(values)");
    expect(page).toContain("getCostComparisonSummary");
    expect(page).toContain("result.revenue");
    expect(page).not.toContain("fetch(");
    expect(page).not.toContain("restaurant API");
    expect(page).not.toContain("location lookup");
    expect(page).not.toContain("currency conversion");
  });

  it("renders the simplified playful home-versus-takeaway information architecture", () => {
    const page = source("components/costs/PizzaCostsPlayfulClient.tsx");
    const appPage = source("app/costs/page.tsx");

    expect(appPage).toContain("<PizzaCostsPlayfulClient />");
    expect(page).toContain("Pizza cost insight");
    expect(page).toContain("What does your pizza night cost?");
    expect(page).toContain("Compare homemade pizza with takeaway and see where the money goes.");
    expect(page).toContain("Estimate my pizza cost");
    expect(page).toContain("Start with three numbers. Everything else is tucked into assumptions.");
    expect(page).toContain("Homemade total");
    expect(page).toContain("Homemade / pizza");
    expect(page).toContain("Takeaway total");
    expect(page).toContain("Playful insight");
    expect(page).toContain("Where the homemade cost goes");
    expect(page).toContain("How these estimates work");
    expect(page).toContain("Turn the estimate into pizza.");
    expect(page).toContain("Plan a pizza");
    expect(page).toContain("<SiteFooter />");
    expect(page).not.toContain("Ready to turn the estimate into pizza?");
    expect(page).not.toContain("Related learning");
    expect(page).not.toContain("Topping Balance Lab");
  });

  it("keeps result copy neutral when home is not cheaper", () => {
    const page = source("components/costs/PizzaCostsPlayfulClient.tsx");

    expect(page).toContain("Takeaway is about");
    expect(page).toContain("That can happen too.");
    expect(page).toContain("These pizza nights cost almost the same.");
    expect(page).toContain("The money is close enough");
    expect(page).toContain("not a promise");
    expect(page).not.toContain("guaranteed saving");
    expect(page).not.toContain("overpriced");
    expect(page).not.toContain("annualized");
    expect(page).not.toContain("profit");
    expect(page).not.toContain("margin");
  });

  it("uses accessible controls and non-color-only comparison output", () => {
    const page = source("components/costs/PizzaCostsPlayfulClient.tsx");

    expect(page).toContain("aria-label={`Decrease ${label}`}");
    expect(page).toContain("aria-label={`Increase ${label}`}");
    expect(page).toContain("htmlFor={id}");
    expect(page).toContain("Difference is calculated from the home total and takeaway order total.");
    expect(page).toContain("The bars are only a visual hint.");
    expect(page).toContain("aria-label=\"Homemade and takeaway total comparison\"");
    expect(page).toContain("aria-live=\"polite\"");
    expect(page).toContain("<details");
    expect(page).toContain("<summary");
    expect(page).toContain("grid gap-5 lg:grid-cols");
    expect(page).not.toContain("overflow-x-auto");
  });

  it("keeps Costs standalone without Shopping, Party Order or session persistence integration", () => {
    const page = source("components/costs/PizzaCostsPlayfulClient.tsx");

    expect(page).not.toContain("/session/shopping");
    expect(page).not.toContain("Party Orders");
    expect(page).not.toContain("party-orders");
    expect(page).not.toContain("getActivePizzaSession");
    expect(page).not.toContain("queueCloudActivePizzaSessionSave");
    expect(page).not.toContain("supabase");
    expect(page).not.toContain("Save to account");
    expect(page).not.toContain("Send to Shopping");
    expect(page).not.toContain("Add to Party Order");
    expect(page).toContain('href="/session/start"');
    expect(page.match(/href="\/session\/start"/g)).toHaveLength(1);
  });

  it("updates the SEO positioning for home versus restaurant comparison", () => {
    const seo = source("lib/seo-config.ts");

    expect(seo).toContain("Home Pizza vs Restaurant Pizza Cost Calculator | DoughTools");
    expect(seo).toContain("Compare the estimated cost of making pizza at home");
  });
});
