import { readFileSync } from "node:fs";
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

describe("simplified pizza sauce page", () => {
  it("puts the calculator before educational content and keeps one hero action", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("Calculate the right amount. Choose the right sauce.");
    expect(page).toContain("Calculate my sauce");
    expect(page).not.toContain("Learn the three methods");
    expect(page.indexOf("<SauceCalculator />")).toBeLessThan(page.indexOf("Practical recommendation"));
    expect(page.indexOf("<SauceCalculator />")).toBeLessThan(page.indexOf("Choose your tomatoes"));
  });

  it("keeps the calculator result hierarchy explicit without changing formulas", () => {
    const calculator = source("components/sauce/SauceCalculator.tsx");
    const engine = source("lib/pizza-sauce-calculator.ts");

    expect(calculator).toContain("Pizzas");
    expect(calculator).toContain("Per pizza");
    expect(calculator).toContain("Total sauce");
    expect(calculator).toContain("You need approximately");
    expect(calculator).toContain("calculatePizzaSauce");
    expect(engine).toContain("export function calculatePizzaSauce");
    expect(engine).toContain("baseSauceGrams = pizzaCount * sauceGramsPerPizza");
  });

  it("uses one practical recommendation summary and three core learning topics", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("Practical recommendation");
    expect(page).toContain("Choose your tomatoes");
    expect(page).toContain("Choose your method");
    expect(page).toContain("Adjust for your oven");
    expect(page).toContain("Whole peeled tomatoes");
    expect(page).toContain("Raw sauce");
    expect(page).toContain("Pizza oven");
  });

  it("keeps troubleshooting compact with four sauce problems", () => {
    const page = source("app/sauce/page.tsx");

    for (const title of [
      "Pizza becomes watery",
      "Sauce tastes flat",
      "Sauce burns",
      "Center remains wet",
    ]) {
      expect(page).toContain(`title: "${title}"`);
    }

    expect(page).not.toContain("Using too much sauce");
    expect(page).not.toContain("Making sauce too far ahead without safe storage");
    expect((page.match(/<SauceMistakeCard/g) ?? []).length).toBe(1);
    expect(page).toContain("Open deeper troubleshooting");
  });

  it("keeps advanced detail behind accessible disclosure instead of separate card walls", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("<details");
    expect(page).toContain("<summary");
    expect(page).toContain("Tomato solids and free water");
    expect(page).toContain("Salt, acidity and tasting");
    expect(page).toContain("Processing method");
    expect(page).toContain("Storage and safety");
    expect(page).not.toContain("Ingredient roles");
    expect(page).not.toContain("How much sauce should go on the pizza?");
  });

  it("limits related learning to three links and keeps one final primary action before the footer", () => {
    const page = source("app/sauce/page.tsx");
    const relatedBlock = page.slice(page.indexOf("const relatedLinks"), page.indexOf("const finalAction"));
    const pageEnding = source("components/learning/PublicPageEnding.tsx");

    expect(page).toContain("PublicPageEnding");
    expect(pageEnding).toContain("links.length > 3");
    expect(pageEnding).toContain("cannot repeat the same destination");
    expect((relatedBlock.match(/href:/g) ?? []).length).toBe(3);
    expect(relatedBlock).toContain('href: "/ovens"');
    expect(relatedBlock).toContain('href: "/toppings"');
    expect(relatedBlock).toContain('href: "/guide/pizza-troubleshooting"');
    expect((page.match(/href: "\/session\/start"/g) ?? []).length).toBe(1);
    expect(pageEnding.indexOf("{relatedEyebrow}")).toBeLessThan(pageEnding.indexOf("{actionEyebrow}"));
    expect(page.indexOf("<PublicPageEnding")).toBeLessThan(page.indexOf("<SiteFooter />"));
    expect(page.indexOf("Ready to use the sauce in a real plan?")).toBeLessThan(page.indexOf("<SiteFooter />"));
    expect(page.slice(page.indexOf("<SiteFooter />"))).not.toContain("Plan my next pizza");
  });

  it("does not reintroduce WorkflowNextStep, duplicate CTA walls or session integration", () => {
    const page = source("app/sauce/page.tsx");
    const layout = source("app/layout.tsx");

    expect(layout).not.toContain("WorkflowNextStep");
    expect(page).not.toContain("WorkflowNextStep");
    expect(page).not.toContain("Return to the Pizza Learning Center");
    expect(page).not.toContain("createAndSavePizzaSession");
    expect(page).not.toContain("setActivePizzaSession");
    expect(page).not.toContain("shoppingList");
  });

  it("keeps accessibility and responsive semantics explicit", () => {
    const page = source("app/sauce/page.tsx");
    const calculator = source("components/sauce/SauceCalculator.tsx");
    const mistakeCard = source("components/sauce/SauceMistakeCard.tsx");

    expect(page).toContain("<h1");
    expect(page).toContain("aria-labelledby");
    expect(page).toContain("overflow-x-clip");
    expect(calculator).toContain("aria-live=\"polite\"");
    expect(calculator).toContain("aria-label={`Decrease ${label}`}");
    expect(calculator).toContain("aria-label={`Increase ${label}`}");
    expect(calculator).toContain("aria-pressed");
    expect(mistakeCard).toContain("aria-expanded={expanded}");
    expect(mistakeCard).toContain("aria-controls={detailsId}");
    expect(mistakeCard).toContain("focus-visible:outline");
    expect(mistakeCard).toContain("min-h-12");
  });

  it("updates Sauce SEO metadata while preserving the indexing policy", () => {
    const metadata = metadataForRoute("/sauce");
    const seo = source("lib/seo-config.ts");

    expect(metadata.title).toBe("Pizza Sauce Guide and Calculator | DoughTools");
    expect(metadata.description).toContain("raw, cooked or reduced sauce");
    expect(seo).toContain('"/sauce"');
    expect(seo).toContain("statefulQueryParamRoutes");
    expect(seo).toContain("ALLOW_INDEXING");
  });

  it("preserves concise source notes for sauce claims", () => {
    const notes = source("docs/research/pizza-sauce-sources.md");
    const page = source("app/sauce/page.tsx");

    expect(notes).toContain("AVPN International Regulations");
    expect(notes).toContain("AVPN Pizza Napoletana recipe");
    expect(notes).toContain("USDA leftovers and food safety");
    expect(page).toContain("View sources and methodology");
    expect(page).not.toContain("docs/research/pizza-sauce-sources.md");
  });
});
