import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  calculatePizzaSauce,
  defaultSaltPercentForTomato,
  defaultSauceCalculatorInput,
} from "@/lib/pizza-sauce-calculator";
import { metadataForRoute } from "@/lib/seo-config";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("pizza sauce calculator helper", () => {
  it("calculates one Classic Neapolitan pizza with San Marzano salt ratio", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      pizzaCount: 1,
      reservePercent: 0,
      sauceGramsPerPizza: 70,
      tomatoType: "san-marzano",
    });

    expect(result.pizzaCount).toBe(1);
    expect(result.finishedSauceGrams).toBe(70);
    expect(result.startingTomatoGrams).toBe(70);
    expect(result.saltPercent).toBe(0.9);
    expect(result.ingredients.find((item) => item.id === "salt")?.amountLabel).toBe("0.6 g");
    expect(result.ingredients.map((item) => item.id)).not.toContain("garlic");
    expect(result.toppingGuidance.map((item) => item.id)).toEqual(["basil", "topping-oil"]);
  });

  it("calculates four Classic Neapolitan pizzas with reserve", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      pizzaCount: 4,
      sauceGramsPerPizza: 70,
      reservePercent: 10,
    });

    expect(result.baseSauceGrams).toBe(280);
    expect(result.preparationSauceGrams).toBe(308);
    expect(result.reserveGrams).toBe(28);
    expect(result.finishedSauceGrams).toBe(308);
  });

  it("clamps the thirty-pizza upper boundary", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      pizzaCount: 99,
      reservePercent: 0,
      sauceGramsPerPizza: 70,
    });

    expect(result.pizzaCount).toBe(30);
    expect(result.finishedSauceGrams).toBe(2100);
  });

  it("uses the generic peeled-tomato salt ratio for non-San Marzano classic sauce", () => {
    expect(defaultSaltPercentForTomato("whole-peeled", "classic-neapolitan")).toBe(1.1);

    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      pizzaCount: 4,
      reservePercent: 0,
      tomatoType: "whole-peeled",
      saltPercent: undefined,
    });

    expect(result.saltPercent).toBe(1.1);
    expect(result.saltRangeLabel).toBe("1.0–1.2%");
  });

  it("supports reserve off and on", () => {
    const off = calculatePizzaSauce({ ...defaultSauceCalculatorInput(), pizzaCount: 4, reservePercent: 0 });
    const on = calculatePizzaSauce({ ...defaultSauceCalculatorInput(), pizzaCount: 4, reservePercent: 15 });

    expect(off.reserveGrams).toBe(0);
    expect(on.preparationSauceGrams).toBe(322);
    expect(on.reserveGrams).toBe(42);
  });

  it("scales Marinara garlic, oregano and oil", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      method: "marinara",
      pizzaCount: 4,
      reservePercent: 0,
      sauceGramsPerPizza: 80,
      garlicIntensity: "strong",
    });

    expect(result.ingredients.find((item) => item.id === "garlic")?.amountLabel).toBe("6 small cloves");
    expect(result.ingredients.find((item) => item.id === "oregano")?.amountLabel).toBe("2.0 g");
    expect(result.ingredients.find((item) => item.id === "oil")?.amountLabel).toBe("28 g");
  });

  it("calculates home-oven reduction from finished sauce target", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      method: "home-oven-cooked",
      pizzaCount: 4,
      sauceGramsPerPizza: 80,
      reservePercent: 10,
      reductionPercent: 15,
    });

    expect(result.finishedSauceGrams).toBe(352);
    expect(result.startingTomatoGrams).toBe(414);
    expect(result.reductionPercent).toBe(15);
    expect(result.calculationNote).toContain("reduction fraction");
  });

  it("supports custom sauce grams per pizza", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      pizzaCount: 3,
      sauceGramsPerPizza: 95,
      reservePercent: 0,
    });

    expect(result.sauceGramsPerPizza).toBe(95);
    expect(result.finishedSauceGrams).toBe(285);
  });

  it("handles invalid pizza count and percentage values safely", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      pizzaCount: Number.NaN,
      sauceGramsPerPizza: Number.POSITIVE_INFINITY,
      reservePercent: 10,
      saltPercent: Number.NaN,
    });

    expect(result.pizzaCount).toBe(1);
    expect(result.sauceGramsPerPizza).toBe(70);
    expect(result.saltPercent).toBe(0.9);
  });

  it("keeps rounding practical and estimates cans", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      pizzaCount: 4,
      sauceGramsPerPizza: 70,
      reservePercent: 10,
      canSizeGrams: 400,
    });

    expect(result.cansNeeded).toBe(1);
    expect(result.canTotalGrams).toBe(400);
    expect(result.estimatedLeftoverGrams).toBe(92);
    expect(result.ingredients.find((item) => item.id === "salt")?.amountLabel).toMatch(/\d\.\d g/);
  });

  it("omits non-applicable ingredients instead of showing zero grams", () => {
    const result = calculatePizzaSauce({
      ...defaultSauceCalculatorInput(),
      method: "classic-neapolitan",
    });

    expect(result.ingredients.map((item) => item.id)).toEqual(["tomato", "salt"]);
    expect(JSON.stringify(result.ingredients)).not.toContain("0 g garlic");
  });
});

describe("pizza sauce learning lab page", () => {
  it("contains the required hero, calculator and method structure", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("Pizza Sauce Guide");
    expect(page).toContain("Better pizza sauce starts with better decisions.");
    expect(page).toContain("Calculate my sauce");
    expect(page).toContain("Learn the three methods");
    expect(page).toContain("SauceCalculator");
    expect(page).toContain("Classic Neapolitan tomato base");
    expect(page).toContain("Traditional Marinara topping");
    expect(page).toContain("Home-oven cooked sauce");
  });

  it("distinguishes traditional Margherita, Marinara and home-oven adaptation claims", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("The base is fundamentally quality peeled tomatoes and salt");
    expect(page).toContain("Garlic is not standard in the classic Margherita tomato base.");
    expect(page).toContain("Oregano is not standard in the classic Margherita tomato base.");
    expect(page).toContain("Sugar is not automatically required.");
    expect(page).toContain("Traditional Marinara includes tomato, garlic, oregano and extra-virgin olive oil.");
    expect(page).toContain("This is an adaptation, not the AVPN");
    expect(page).not.toMatch(/ultimate pizza sauce|world’s best|world's best|Master the perfect sauce/i);
  });

  it("includes methodology, safety and related learning without changing app integrations", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("Sources and methodology");
    expect(page).toContain('href="/methodology#pizza-sauce"');
    expect(page).toContain("View sources and methodology");
    expect(page).toContain("USDA leftover guidance uses 3–4 days refrigerated or 3–4 months frozen");
    expect(page).toContain('["Pizza Learning Center", "/guide"');
    expect(page).toContain('["Pizza Dough Guide", "/guides/dough"');
    expect(page).toContain('["Pizza Troubleshooting Guide", "/guide/pizza-troubleshooting"');
    expect(page).toContain('href="/session/start"');
    expect(page).not.toContain("docs/research/pizza-sauce-sources.md");
    expect(page).not.toContain("createAndSavePizzaSession");
    expect(page).not.toContain("setActivePizzaSession");
    expect(page).not.toContain("shoppingList");
  });

  it("uses local people-free sauce assets with dimensions already present in the repository", () => {
    const page = source("app/sauce/page.tsx");
    const sauceAssets = ["neapolitan.webp", "marinara.webp", "home.webp"];

    for (const asset of sauceAssets) {
      const path = join(process.cwd(), "public", "sauce", asset);
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(50_000);
      expect(page).toContain(`/sauce/${asset}`);
    }

    expect(page).not.toMatch(/https?:\/\/.*\.(webp|png|jpe?g)/i);
    expect(page).not.toMatch(/person|people|hands|faces|chef portrait/i);
  });

  it("keeps accessibility and responsive semantics explicit", () => {
    const page = source("app/sauce/page.tsx");
    const calculator = source("components/sauce/SauceCalculator.tsx");

    expect(page).toContain("<h1");
    expect(page).toContain("aria-labelledby");
    expect(page).toContain("overflow-x-clip");
    expect(calculator).toContain("aria-live=\"polite\"");
    expect(calculator).toContain("aria-label={`Decrease ${label}`}");
    expect(calculator).toContain("aria-label={`Increase ${label}`}");
    expect(calculator).toContain("aria-pressed");
  });

  it("updates Sauce SEO metadata while preserving the indexing policy", () => {
    const metadata = metadataForRoute("/sauce");
    const seo = source("lib/seo-config.ts");

    expect(metadata.title).toBe("Pizza Sauce Guide and Calculator | DoughTools");
    expect(metadata.description).toContain("Neapolitan, Marinara, and home-oven pizza sauce");
    expect(seo).toContain('"/sauce"');
    expect(seo).toContain("statefulQueryParamRoutes");
    expect(seo).toContain("ALLOW_INDEXING");
  });

  it("records concise source notes for sauce claims", () => {
    const notes = source("docs/research/pizza-sauce-sources.md");

    expect(notes).toContain("AVPN International Regulations");
    expect(notes).toContain("AVPN Pizza Napoletana recipe");
    expect(notes).toContain("AVPN “Marinara and her sisters”");
    expect(notes).toContain("Ooni AVPN Standard Pizza Marinara");
    expect(notes).toContain("USDA leftovers and food safety");
    expect(notes).toContain("DoughTools practical interpretation");
  });
});
