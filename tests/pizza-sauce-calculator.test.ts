import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  calculatePizzaSauce,
  calculateSessionPizzaSauce,
  defaultSaltPercentForTomato,
  defaultSauceCalculatorInput,
  defaultSauceGramsForMethod,
  formatSauceCanPurchase,
  sessionSauceProfileForPizza,
} from "@/lib/pizza-sauce-calculator";
import { getSauceAmountTeaching, getSauceQuickAnswer } from "@/lib/sauce-page-guidance";
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
    expect(result.finishedSauceGrams).toBe(280);
    expect(result.startingTomatoGrams).toBe(308);
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

    expect(result.finishedSauceGrams).toBe(320);
    expect(result.preparationSauceGrams).toBe(352);
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
    expect(result.shoppingPurchaseGrams).toBe(400);
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

describe("Patch 471A sauce first viewport and realistic imagery", () => {
  it("keeps the Sauce page focused on the calculator and removes generic lower sections", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("Pizza sauce, measured clearly.");
    expect(page).toContain("/sauce/application/clean-border.webp");
    expect(page.indexOf("<SauceCalculator />")).toBeLessThan(page.indexOf("<SaucePracticalGuidance />"));
    expect(page.indexOf("<SauceCalculator />")).toBeLessThan(page.indexOf("<SiteFooter />"));
    expect(page).toContain("Plan a pizza with the sauce in mind.");
    expect(page).toContain('href="/session/start"');
    expect(page).not.toContain("<SauceQuickAnswer />");
    expect(page).not.toContain("Sources and methodology");
    expect(page).not.toContain("View sources and methodology");
    expect(page).not.toContain("What should I learn next?");
    expect(page).not.toContain("PublicPageEnding");
    expect(page).not.toContain("relatedGuides");
    expect(page).not.toContain('href: "/guides/dough"');
    expect(page).not.toContain('href: "/toppings"');
  });

  it("integrates the level-aware quick answer into the calculator without formula changes", () => {
    const calculator = source("components/sauce/SauceCalculator.tsx");
    const engine = source("lib/pizza-sauce-calculator.ts");
    const beginner = getSauceQuickAnswer("beginner");
    const enthusiast = getSauceQuickAnswer("enthusiast");
    const pizzaNerd = getSauceQuickAnswer("pizza_nerd");

    expect(calculator).toContain("getSauceQuickAnswer(experienceLevel)");
    expect(calculator).toContain("Recommended for most pizzas");
    expect(calculator).toContain("How much sauce do I need?");
    expect(calculator.indexOf("Total sauce")).toBeLessThan(calculator.indexOf("Sauce style"));
    expect(calculator.indexOf("Sauce style")).toBeLessThan(calculator.indexOf("Why this amount works"));
    expect(calculator).toContain("Total sauce");
    expect(calculator).toContain("Sauce per pizza");
    expect(calculator).toContain("Pizzas");
    expect(calculator).toContain("Reserve");
    expect(calculator).toContain("label=\"Pizzas\"");
    expect(calculator).toContain("label=\"Sauce per pizza\"");
    expect(calculator).toContain("Coverage preset");
    expect(calculator).toContain("Adjust tomato, salt and batch details");
    expect(calculator).toContain("calculatePizzaSauce");
    expect(engine).toContain("baseSauceGrams = pizzaCount * sauceGramsPerPizza");
    expect(new Set([beginner.answer, enthusiast.answer, pizzaNerd.answer]).size).toBe(3);
  });

  it("keeps amount comparison compact and selected-level only", () => {
    const calculator = source("components/sauce/SauceCalculator.tsx");
    const beginner = getSauceAmountTeaching("beginner");
    const enthusiast = getSauceAmountTeaching("enthusiast");
    const pizzaNerd = getSauceAmountTeaching("pizza_nerd");

    expect(calculator).toContain("Why this amount works");
    expect(calculator).toContain("aria-label=\"Sauce amount balance\"");
    expect(calculator).toContain("Too little");
    expect(calculator).toContain("Recommended");
    expect(calculator).toContain("Too much");
    expect(calculator).toContain("getSauceAmountTeaching(experienceLevel)");
    expect(calculator).toContain("readExperienceLevelPreference()");
    expect(beginner.level).toBe("beginner");
    expect(enthusiast.level).toBe("enthusiast");
    expect(pizzaNerd.level).toBe("pizza_nerd");
    expect(new Set([beginner.explanation, enthusiast.explanation, pizzaNerd.explanation]).size).toBe(3);
  });

  it("uses four realistic Sauce application images instead of abstract CSS graphics", () => {
    const practicalGuidance = source("components/sauce/SaucePracticalGuidance.tsx");

    for (const imagePath of [
      "/sauce/application/dough-ready.webp",
      "/sauce/application/sauce-in-centre.webp",
      "/sauce/application/spread-in-spiral.webp",
      "/sauce/application/clean-border.webp",
    ]) {
      expect(practicalGuidance).toContain(imagePath);
    }

    expect(practicalGuidance).toContain("Plain stretched pizza dough on a floured work surface ready for sauce.");
    expect(practicalGuidance).toContain("Measured tomato sauce placed in the centre of stretched pizza dough.");
    expect(practicalGuidance).toContain("Tomato sauce spread outward in a thin spiral across pizza dough.");
    expect(practicalGuidance).toContain("Pizza dough with an even tomato sauce layer and a clean uncovered crust border.");
    expect(practicalGuidance).toContain("SauceApplicationImages");
    expect(practicalGuidance).not.toContain("DoughApplicationVisual");
    expect(practicalGuidance).not.toContain("sauce: \"center\"");
    expect(practicalGuidance).not.toContain("sauce: \"spiral\"");
    expect(practicalGuidance).not.toContain("sauce: \"border\"");
    expect(practicalGuidance).not.toContain("absolute inset-[12%]");
    expect(practicalGuidance).toContain("aria-label=\"Sauce application sequence\"");
  });

  it("preserves the practical Sauce guidance order and Pizza Plan boundary", () => {
    const page = source("app/sauce/page.tsx");
    const practicalGuidance = source("components/sauce/SaucePracticalGuidance.tsx");
    const combined = `${page}\n${practicalGuidance}`;

    expect(practicalGuidance.indexOf("Buy the tomatoes")).toBeLessThan(practicalGuidance.indexOf("Make and apply the sauce"));
    expect(practicalGuidance.indexOf("Make and apply the sauce")).toBeLessThan(practicalGuidance.indexOf("Avoid a wet or burnt pizza"));
    expect(practicalGuidance.indexOf("Avoid a wet or burnt pizza")).toBeLessThan(practicalGuidance.indexOf("Store safely"));
    expect(combined).toContain("Refrigerate promptly");
    expect(combined).toContain("Freeze for longer storage");
    expect(combined).toContain("Discard unsafe sauce");
    expect(combined).toContain("Explore guide");
    expect(page).not.toContain("createAndSavePizzaSession");
    expect(page).not.toContain("setActivePizzaSession");
    expect(page).not.toContain("shoppingList");
    expect(page.slice(page.indexOf("<SiteFooter />"))).not.toContain("Plan a pizza");
  });

  it("keeps Sauce metadata and calculation defaults unchanged", () => {
    const metadata = metadataForRoute("/sauce");

    expect(metadata.title).toBe("Pizza Sauce Recipe and Calculator | DoughTools");
    expect(defaultSauceGramsForMethod("classic-neapolitan")).toBe(70);
    expect(defaultSauceGramsForMethod("marinara")).toBe(80);
    expect(defaultSauceGramsForMethod("home-oven-cooked")).toBe(80);
  });
});

describe("Pizza Session sauce quantity contract", () => {
  it("maps matching session assumptions to the Sauce calculator defaults", () => {
    expect(sessionSauceProfileForPizza("margherita", { ovenType: "gas" })).toMatchObject({
      method: "classic-neapolitan",
      sauceGramsPerPizza: 70,
    });
    expect(sessionSauceProfileForPizza("margherita", { ovenType: "home" })).toMatchObject({
      method: "home-oven-cooked",
      sauceGramsPerPizza: 80,
    });
    expect(sessionSauceProfileForPizza("marinara", { ovenType: "gas" })).toMatchObject({
      method: "marinara",
      sauceGramsPerPizza: 80,
    });
  });

  it("keeps topping-heavy tomato pizzas as an intentional lighter session profile", () => {
    const diavola = sessionSauceProfileForPizza("diavola", { ovenType: "gas" });
    const funghi = sessionSauceProfileForPizza("funghi", { ovenType: "home" });

    expect(diavola).toMatchObject({ sauceGramsPerPizza: 55 });
    expect(diavola).not.toHaveProperty("method");
    expect(funghi).toMatchObject({ sauceGramsPerPizza: 55 });
    expect(funghi).not.toHaveProperty("method");
    expect(sessionSauceProfileForPizza("quattro-formaggi", { ovenType: "gas" })).toBeUndefined();
  });

  it("calculates session finished totals, reserve and purchase rounding from one source", () => {
    const result = calculateSessionPizzaSauce({
      pizzaMix: { margherita: 4 },
      ovenType: "gas",
    });

    expect(result.finishedSauceGrams).toBe(280);
    expect(result.preparationSauceGrams).toBe(308);
    expect(result.startingTomatoGrams).toBe(308);
    expect(result.cansNeeded).toBe(1);
    expect(result.shoppingPurchaseGrams).toBe(400);
    expect(formatSauceCanPurchase(result.cansNeeded, result.canSizeGrams)).toBe("1 x 400 g can");
  });

  it("supports Marinara, home-oven cooked sauce and the thirty-pizza boundary", () => {
    const marinara = calculateSessionPizzaSauce({
      pizzaMix: { marinara: 4 },
      ovenType: "gas",
    });
    const homeOven = calculateSessionPizzaSauce({
      pizzaMix: { margherita: 4 },
      ovenType: "home",
    });
    const maximum = calculateSessionPizzaSauce({
      pizzaMix: { margherita: 30 },
      ovenType: "gas",
    });

    expect(marinara.finishedSauceGrams).toBe(320);
    expect(marinara.preparationSauceGrams).toBe(352);
    expect(homeOven.finishedSauceGrams).toBe(320);
    expect(homeOven.startingTomatoGrams).toBe(414);
    expect(maximum.finishedSauceGrams).toBe(2100);
    expect(maximum.preparationSauceGrams).toBe(2310);
    expect(maximum.shoppingPurchaseGrams).toBeGreaterThanOrEqual(maximum.startingTomatoGrams);
  });

  it("sums mixed pizza menus without treating purchase quantity as applied sauce", () => {
    const result = calculateSessionPizzaSauce({
      pizzaMix: { margherita: 1, marinara: 2, diavola: 1 },
      ovenType: "gas",
    });

    expect(result.lines.map((line) => [line.pizzaType, line.sauceGramsPerPizza, line.finishedSauceGrams])).toEqual([
      ["margherita", 70, 70],
      ["marinara", 80, 160],
      ["diavola", 55, 55],
    ]);
    expect(result.finishedSauceGrams).toBe(285);
    expect(result.preparationSauceGrams).toBe(314);
    expect(result.shoppingPurchaseGrams).toBe(400);
    expect(result.shoppingPurchaseGrams).toBeGreaterThan(result.finishedSauceGrams);
  });
});
