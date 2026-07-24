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

describe("simplified pizza sauce page", () => {
  it("puts the quick answer before the calculator and the secondary guidance", () => {
    const page = source("app/sauce/page.tsx");
    const quickAnswer = source("components/sauce/SauceQuickAnswer.tsx");
    const quickAnswerModel = source("lib/sauce-page-guidance.ts");

    expect(page).toContain("Choose the sauce, then measure it clearly.");
    expect(page).toContain("Pick a simple sauce path first");
    expect(quickAnswerModel).toContain("Which sauce should I use?");
    expect(page).not.toContain("Calculate my sauce");
    expect(page).not.toContain("Learn the three methods");
    expect(page.indexOf("<SauceQuickAnswer />")).toBeLessThan(page.indexOf("<SauceCalculator />"));
    expect(page.indexOf("<SauceCalculator />")).toBeLessThan(page.indexOf("Buy the tomatoes"));
    expect(page.indexOf("Buy the tomatoes")).toBeLessThan(page.indexOf("Make and apply the sauce"));
    expect(page.indexOf("Make and apply the sauce")).toBeLessThan(page.indexOf("Avoid a wet or burnt pizza"));
    expect(page.indexOf("Avoid a wet or burnt pizza")).toBeLessThan(page.indexOf("Store safely"));
    expect(page.indexOf("Store safely")).toBeLessThan(page.indexOf("Sources and methodology"));
    expect(page.indexOf("Sources and methodology")).toBeLessThan(page.indexOf("<PublicPageEnding"));
    expect(page.indexOf("<PublicPageEnding")).toBeLessThan(page.indexOf("<SiteFooter />"));
  });

  it("provides one active Sauce quick answer per guidance level", () => {
    const beginner = getSauceQuickAnswer("beginner");
    const enthusiast = getSauceQuickAnswer("enthusiast");
    const pizzaNerd = getSauceQuickAnswer("pizza_nerd");
    const invalid = getSauceQuickAnswer("mystery");

    expect(beginner).toMatchObject({
      level: "beginner",
      levelLabel: "Beginner",
      title: "Which sauce should I use?",
    });
    expect(beginner.answer).toBe(
      "Use a simple raw tomato sauce for most pizzas. It is the safest starting point for home pizza and pizza oven baking.",
    );
    expect(beginner.bullets).toEqual([
      "Choose good canned whole peeled tomatoes.",
      "Crush or blend lightly.",
      "Use a small amount so the pizza does not turn wet.",
    ]);
    expect(enthusiast.answer).toBe(
      "Raw tomato sauce is the default choice for most pizzas. Use cooked sauce only when you want a thicker, sweeter result or a home-oven style that benefits from lower moisture.",
    );
    expect(pizzaNerd.answer).toBe(
      "Choose sauce style by bake profile and moisture budget. Raw sauce preserves brightness and suits fast, high-heat baking. Cooked sauce trades freshness for reduced water and a denser texture.",
    );
    expect(invalid.level).toBe("beginner");
    expect(new Set([beginner.answer, enthusiast.answer, pizzaNerd.answer]).size).toBe(3);
  });

  it("keeps the calculator result hierarchy explicit without changing formulas", () => {
    const calculator = source("components/sauce/SauceCalculator.tsx");
    const engine = source("lib/pizza-sauce-calculator.ts");

    expect(calculator).toContain("Total sauce");
    expect(calculator).toContain("Sauce per pizza");
    expect(calculator).toContain("Pizzas");
    expect(calculator).not.toContain("Finished total");
    expect(calculator).toContain("Finished amount before prep reserve");
    expect(calculator.indexOf("Total sauce")).toBeLessThan(calculator.indexOf("Sauce per pizza"));
    expect(calculator).toContain("Prepare {formatGrams(result.preparationSauceGrams)} including");
    expect(calculator).toContain("Use {result.sauceGramsPerPizza} g on each pizza");
    expect(calculator).toContain("calculatePizzaSauce");
    expect(calculator).toContain("defaultSauceGramsForMethod");
    expect(engine).toContain("export function calculatePizzaSauce");
    expect(engine).toContain("baseSauceGrams = pizzaCount * sauceGramsPerPizza");
  });

  it("adds compact level-aware teaching below the calculator result", () => {
    const calculator = source("components/sauce/SauceCalculator.tsx");
    const beginner = getSauceAmountTeaching("beginner");
    const enthusiast = getSauceAmountTeaching("enthusiast");
    const pizzaNerd = getSauceAmountTeaching("pizza_nerd");

    expect(calculator).toContain("Why this amount works");
    expect(calculator).toContain("Sauce should support the pizza, not flood it.");
    expect(calculator).toContain("Too little");
    expect(calculator).toContain("Dry or unbalanced");
    expect(calculator).toContain("Recommended balance");
    expect(calculator).toContain("Too much");
    expect(calculator).toContain("Wet centre");
    expect(calculator).toContain("Wet mozzarella or wet toppings → slightly less sauce");
    expect(calculator).toContain("Longer bake or dry toppings → sometimes slightly more sauce");
    expect(calculator).toContain("getSauceAmountTeaching(experienceLevel)");
    expect(calculator).toContain("readExperienceLevelPreference()");
    expect(beginner.explanation).toBe(
      "Start with the recommended amount. It gives clear tomato flavour without making the pizza heavy or wet.",
    );
    expect(enthusiast.explanation).toBe(
      "Use slightly less sauce with wet mozzarella or moisture-heavy toppings. A longer bake or drier topping set may tolerate slightly more.",
    );
    expect(pizzaNerd.explanation).toBe(
      "Treat the result as a moisture-budget baseline. Tomato water content, cheese moisture, topping load, bake temperature and bake time determine the final adjustment.",
    );
    expect(new Set([beginner.explanation, enthusiast.explanation, pizzaNerd.explanation]).size).toBe(3);
  });

  it("uses the established Sauce calculator defaults as the visible starting amounts", () => {
    expect(defaultSauceGramsForMethod("classic-neapolitan")).toBe(70);
    expect(defaultSauceGramsForMethod("marinara")).toBe(80);
    expect(defaultSauceGramsForMethod("home-oven-cooked")).toBe(80);

    const calculator = source("components/sauce/SauceCalculator.tsx");

    expect(calculator).not.toContain("const methodDefaultSauceGrams");
    expect(calculator).toContain("defaultSauceGramsForMethod(method)");
    expect(calculator).toContain("A starting point for one typical 30-32 cm pizza.");
  });

  it("keeps quantity controls prominent and secondary controls behind disclosure", () => {
    const calculator = source("components/sauce/SauceCalculator.tsx");

    expect(calculator).toContain("Sauce style");
    expect(calculator).toContain("label=\"Pizzas\"");
    expect(calculator).toContain("label=\"Sauce per pizza\"");
    expect(calculator).toContain("Coverage preset");
    expect(calculator).toContain("Adjust tomato, salt and batch details");
    expect(calculator.indexOf("Sauce per pizza")).toBeLessThan(calculator.indexOf("Adjust tomato, salt and batch details"));
    expect(calculator.indexOf("Total sauce")).toBeLessThan(calculator.indexOf("Adjust tomato, salt and batch details"));
  });

  it("connects the calculated batch to concise sauce recipe steps", () => {
    const calculator = source("components/sauce/SauceCalculator.tsx");

    expect(calculator).toContain("How to make pizza sauce");
    expect(calculator).toContain("recipeSteps(result)");
    expect(calculator).toContain("Choose whole peeled tomatoes");
    expect(calculator).toContain("Crush by hand");
    expect(calculator).toContain("Stir in the calculated salt");
    expect(calculator).toContain("Measure about ${result.sauceGramsPerPizza} g onto each pizza");
    expect(calculator.indexOf("How to make pizza sauce")).toBeLessThan(calculator.indexOf("Batch ingredients"));
  });

  it("uses compact tomato, application, moisture and storage sections instead of repeated card walls", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("Buy the tomatoes");
    expect(page).toContain("What to buy");
    expect(page).toContain("Whole peeled vs crushed");
    expect(page).toContain("Good tomatoes matter more than complicated technique.");
    expect(page).toContain("Make and apply the sauce");
    expect(page).toContain("Avoid a wet or burnt pizza");
    expect(page).toContain("Store safely");
    expect(page).not.toContain("Adjust the sauce");
    expect(page).not.toContain("Change the amount only when the pizza changes.");
    expect(page).not.toContain("Useful details without a second recipe.");
    expect(page).not.toContain("Choose your tomatoes");
    expect(page).not.toContain("Choose your method");
    expect(page).not.toContain("Raw, cooked and reduced sauce solve different problems.");
  });

  it("keeps troubleshooting compact without duplicating moisture advice across multiple sections", () => {
    const page = source("app/sauce/page.tsx");

    for (const title of [
      "Wet center",
      "Burnt base with pale top",
      "Loose tomato texture",
      "Sauce tastes flat",
    ]) {
      expect(page).toContain(`title: "${title}"`);
    }

    expect(page).not.toContain("Using too much sauce");
    expect(page).not.toContain("Making sauce too far ahead without safe storage");
    expect(page).not.toContain("SauceMistakeCard");
    expect(page).not.toContain("<details");
    expect(page).not.toContain("<summary");
    expect(page).toContain("Open deeper troubleshooting");
  });

  it("keeps source and storage guidance visible without a second recipe", () => {
    const page = source("app/sauce/page.tsx");

    expect(page).toContain("Store safely");
    expect(page).toContain("Chill it");
    expect(page).toContain("Cool cooked sauce first");
    expect(page).toContain("Discard unsafe sauce");
    expect(page).toContain("Sources and methodology");
    expect(page).toContain("Traditional guidance, practical home-oven adaptation.");
    expect(page).not.toContain("Ingredient roles");
    expect(page).not.toContain("How much sauce should go on the pizza?");
  });

  it("keeps the final primary action before the footer without a related-learning wall", () => {
    const page = source("app/sauce/page.tsx");
    const pageEnding = source("components/learning/PublicPageEnding.tsx");

    expect(page).toContain("PublicPageEnding");
    expect(pageEnding).toContain("links.length > 3");
    expect(pageEnding).toContain("cannot repeat the same destination");
    expect(page).not.toContain("const relatedLinks");
    expect(page).toContain("links={[]}");
    expect((page.match(/href: "\/session\/start"/g) ?? []).length).toBe(1);
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
    const quickAnswer = source("components/sauce/SauceQuickAnswer.tsx");

    expect(page).toContain("<h1");
    expect(page).toContain("aria-labelledby");
    expect(page).toContain("overflow-x-clip");
    expect(page).toContain("w-full");
    expect(page).toContain("object-cover");
    expect(calculator).toContain("aria-live=\"polite\"");
    expect(calculator).toContain("aria-label=\"Sauce amount balance\"");
    expect(calculator).toContain("aria-label={`Decrease ${label}`}");
    expect(calculator).toContain("aria-label={`Increase ${label}`}");
    expect(calculator).toContain("aria-pressed");
    expect(quickAnswer).toContain("GuidanceModeBadge");
    expect(page).toContain("focus-visible:outline");
    expect(page).toContain("min-h-12");
  });

  it("updates Sauce SEO metadata while preserving the indexing policy", () => {
    const metadata = metadataForRoute("/sauce");
    const seo = source("lib/seo-config.ts");

    expect(metadata.title).toBe("Pizza Sauce Recipe and Calculator | DoughTools");
    expect(metadata.description).toContain("Calculate sauce per pizza");
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
