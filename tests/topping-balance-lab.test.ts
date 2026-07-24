import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildToppingBalanceSearch,
  calculateToppingBalance,
  extraToppingGramsForArea,
  normalizeToppingGeometry,
  parseToppingBalanceSearch,
  toppingBalanceDefaultState,
  toppingBalancePresets,
} from "@/lib/topping-balance-lab";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Topping Balance Lab calculations", () => {
  it("keeps the representative legacy URL state compatible", () => {
    const state = parseToppingBalanceSearch(
      "?pizzaShape=round&rim=2&diameter=32&cheese=fior-di-latte&drain=4-8h&cheeseGrams=88&sauceGrams=75",
    );

    expect(state.geometry).toEqual({ shape: "round", diameter: 32, rim: 2 });
    expect(state.cheeseType).toBe("fior-di-latte");
    expect(state.drainState).toBe("4-8h");
    expect(state.cheeseGrams).toBe(88);
    expect(state.sauceGrams).toBe(75);
    expect(state.toppingLoad).toBe("none");
  });

  it("falls back safely for invalid query values", () => {
    const state = parseToppingBalanceSearch("?pizzaShape=triangle&diameter=-1&rim=999&cheese=bad&drain=never&cheeseGrams=NaN&sauceGrams=-80");

    expect(state.geometry.shape).toBe("round");
    expect(state.geometry).toMatchObject({ diameter: 18 });
    expect(state.cheeseType).toBe(toppingBalanceDefaultState.cheeseType);
    expect(state.drainState).toBe(toppingBalanceDefaultState.drainState);
    expect(state.cheeseGrams).toBe(0);
    expect(state.sauceGrams).toBe(0);
  });

  it("round pizza usable area excludes the rim", () => {
    const narrowRim = calculateToppingBalance({ ...toppingBalanceDefaultState, geometry: { shape: "round", diameter: 32, rim: 1 } });
    const wideRim = calculateToppingBalance({ ...toppingBalanceDefaultState, geometry: { shape: "round", diameter: 32, rim: 3 } });

    expect(narrowRim.fullArea).toBe(wideRim.fullArea);
    expect(wideRim.usableArea).toBeLessThan(narrowRim.usableArea);
    expect(wideRim.sauceDensity).toBeGreaterThan(narrowRim.sauceDensity);
  });

  it("supports rectangular geometry without overflowing invalid rim values", () => {
    const geometry = normalizeToppingGeometry({ shape: "rectangle", width: 20, length: 25, rim: 99 });

    expect(geometry).toEqual({ shape: "rectangle", width: 20, length: 25, rim: 9 });
  });

  it("classifies low, balanced and excessive sauce distinctly", () => {
    const low = calculateToppingBalance({ ...toppingBalanceDefaultState, sauceGrams: 35, cheeseGrams: 88 });
    const balanced = calculateToppingBalance({ ...toppingBalanceDefaultState, sauceGrams: 75, cheeseGrams: 88 });
    const excessive = calculateToppingBalance({ ...toppingBalanceDefaultState, sauceGrams: 130, cheeseGrams: 88 });

    expect(low.sauceLevel).toMatch(/light/);
    expect(balanced.sauceLevel).toBe("balanced");
    expect(["heavy", "overloaded"]).toContain(excessive.sauceLevel);
  });

  it("classifies low, balanced and excessive cheese distinctly", () => {
    const low = calculateToppingBalance({ ...toppingBalanceDefaultState, cheeseGrams: 35 });
    const balanced = calculateToppingBalance({ ...toppingBalanceDefaultState, cheeseGrams: 88 });
    const excessive = calculateToppingBalance({ ...toppingBalanceDefaultState, cheeseGrams: 150 });

    expect(low.cheeseLevel).toMatch(/light/);
    expect(balanced.cheeseLevel).toBe("balanced");
    expect(["heavy", "overloaded"]).toContain(excessive.cheeseLevel);
  });

  it("wet cheese and heavy toppings increase moisture and overload risk", () => {
    const balanced = calculateToppingBalance({ ...toppingBalanceDefaultState, drainState: "4-8h", toppingLoad: "none" });
    const wet = calculateToppingBalance({ ...toppingBalanceDefaultState, drainState: "undrained", toppingLoad: "heavy" });

    expect(wet.moistureLevel).not.toBe("low");
    expect(wet.extraToppingGrams).toBeGreaterThan(balanced.extraToppingGrams);
    expect(["heavy", "overloaded"]).toContain(wet.combinedLevel);
  });

  it("maps educational presets to deterministic shareable URLs", () => {
    const state = { ...toppingBalanceDefaultState, ...toppingBalancePresets["heavy-toppings"] };
    const query = buildToppingBalanceSearch(state);
    const restored = parseToppingBalanceSearch(`?${query}`);

    expect(query).toContain("pizzaShape=round");
    expect(query).toContain("toppingLoad=heavy");
    expect(restored.toppingLoad).toBe("heavy");
    expect(restored.sauceGrams).toBe(toppingBalancePresets["heavy-toppings"].sauceGrams);
  });

  it("scales teaching topping load by usable area", () => {
    expect(extraToppingGramsForArea(600, "light")).toBeLessThan(extraToppingGramsForArea(900, "light"));
    expect(extraToppingGramsForArea(600, "heavy")).toBeGreaterThan(extraToppingGramsForArea(600, "moderate"));
  });
});

describe("Topping Balance Lab page structure", () => {
  const component = source("components/toppings/ToppingBalanceLab.tsx");
  const page = source("app/toppings/page.tsx");
  const research = source("docs/research/topping-balance-sources.md");

  it("renders the new lab identity, breadcrumb, hero and primary experiment", () => {
    expect(page).toContain("ToppingBalanceLab");
    expect(component).toContain("LearningBreadcrumbs");
    expect(component).toContain("Topping guides");
    expect(component).toContain("See what too much looks like.");
    expect(component).toContain("Start the experiment");
    expect(component).toContain("Build and compare the topping load");
  });

  it("keeps the lab focused on topping balance rather than unrelated workflows", () => {
    expect(component).toContain("Ready to use this balance in your next pizza?");
    expect(component).toContain("Use what you learned when you build your next plan.");
    expect(component).not.toContain("Send amounts to cost calculator");
    expect(component).not.toContain("Party Orders");
    expect(component).not.toContain("Create Pizza Session");
  });

  it("adds a selected-level quick answer before the deeper lab", () => {
    expect(component).toContain("readExperienceLevelPreference");
    expect(component).toContain("ToppingsQuickAnswer experienceLevel={experienceLevel}");
    expect(component).toContain("How should I choose toppings?");
    expect(component).toContain("Start with one cheese and two or three toppings.");
    expect(component).toContain("Build a balanced topping set by combining flavour, texture and moisture.");
    expect(component).toContain("Treat toppings as a load and moisture system.");
    expect(component).toContain("TOPPINGS_QUICK_ANSWER_COPY[experienceLevel]");
    expect(component).toContain("Less is usually better. You should still see sauce and open space between the toppings.");
    expect(component.indexOf("<ToppingsQuickAnswer experienceLevel={experienceLevel} />")).toBeLessThan(
      component.indexOf('<section id="interactive-lab"'),
    );
  });

  it("separates practical toppings guidance before existing deeper guidance", () => {
    for (const text of [
      "Choose a balanced topping set",
      "Cheese and moisture",
      "Before baking",
      "After baking",
      "Avoid an overloaded pizza",
      "Existing deeper guidance and references",
    ]) {
      expect(component).toContain(text);
    }

    expect(component.indexOf("Choose a balanced topping set")).toBeLessThan(component.indexOf("Build and compare the topping load."));
    expect(component.indexOf("Avoid an overloaded pizza")).toBeLessThan(component.indexOf("Existing deeper guidance and references"));
  });

  it("teaches area, sauce, cheese, drainage, combined load, oven interaction and overload risk", () => {
    for (const text of [
      "The rim is not part of the topping area.",
      "Sauce controls coverage and moisture.",
      "Cheese should support the pizza, not bury it.",
      "Drainage changes how much water reaches the pizza.",
      "Sauce and cheese cannot be judged alone.",
      "The oven changes how forgiving the topping load feels.",
      "An overloaded pizza traps moisture, blocks heat and makes the centre difficult to bake.",
    ]) {
      expect(component).toContain(text);
    }

    expect(component).not.toContain("What overloaded pizza looks like before it fails.");
  });

  it("uses local topping assets with explicit dimensions documented in the audit", () => {
    const files = [
      "sauce-light.webp",
      "sauce-balanced.webp",
      "sauce-heavy.webp",
      "cheese-light.webp",
      "cheese-balanced.webp",
      "cheese-heavy.webp",
      "mozzarella-wet.webp",
      "mozzarella-drained.webp",
    ];

    for (const file of files) {
      expect(component).toContain(`/toppings/references/${file}`);
      expect(existsSync(join(process.cwd(), "public", "toppings", "references", file))).toBe(true);
      expect(research).toContain(`\`references/${file}\``);
      expect(research).toContain("960×960");
    }

    expect(component).toContain("data-topping-reference-gallery");
    expect(component).toContain("width={960}");
    expect(component).toContain("height={960}");
  });

  it("uses soft browser history updates instead of reloading when presets change", () => {
    expect(component).toContain("window.history.pushState");
    expect(component).toContain("window.history.replaceState");
    expect(component).toContain('window.addEventListener("popstate", restoreFromUrl)');
    expect(component).not.toContain("window.location.assign");
  });

  it("keeps the mobile lab focused on the current visual result before controls", () => {
    expect(component).toContain("data-topping-visual-result");
    expect(component).toContain("data-topping-controls");
    expect(component).toContain("lg:order-2");
    expect(component).toContain("lg:order-1");
    expect(component).toContain("lg:sticky lg:top-24");
  });

  it("uses Diavola as the default realistic visual example without changing calculation state", () => {
    expect(component).toContain('useState<ToppingPizzaExampleId>("diavola")');
    expect(component).toContain("Pizza example");
    expect(component).toContain("Tomato, fior di latte and spicy salami make topping coverage easy to compare.");
    expect(component).toContain("The example changes the teaching photo only. Your sauce, cheese and topping values stay unchanged.");
    expect(component).toContain("The photograph represents the nearest visual category, not the exact gram-perfect pizza.");
    expect(component).toContain("visualStateForResult(state, result)");
    expect(component).toContain("onExampleChange={setSelectedExample}");
    expect(component).not.toContain("pizzaExample=");
  });

  it("renders an accessible pizza-example dialog and visible selector", () => {
    expect(component).toContain("ToppingPizzaExampleSelector");
    expect(component).toContain("ToppingExampleDialog");
    expect(component).toContain("Choose a pizza example");
    expect(component).toContain('role="dialog"');
    expect(component).toContain('aria-modal="true"');
    expect(component).toContain("Close pizza example chooser");
    expect(component).toContain('event.key === "Escape"');
    expect(component).toContain("Change pizza example");
    expect(component).toContain("aria-pressed={active}");
  });

  it("maps topping balance states to the realistic Diavola image series", () => {
    expect(component).toContain('"/toppings/diavola/diavola-too-little.webp"');
    expect(component).toContain('"/toppings/diavola/diavola-balanced.webp"');
    expect(component).toContain('"/toppings/diavola/diavola-too-much.webp"');
    expect(component).toContain('"/toppings/diavola/diavola-wet-overload.webp"');
    expect(component).toContain('"/toppings/diavola/diavola-heavy-load.webp"');
    expect(component).toContain('"/toppings/examples/margherita-balanced.webp"');
    expect(component).toContain('"/toppings/examples/marinara-balanced.webp"');
    expect(component).toContain('width={1200}');
    expect(component).toContain('height={1200}');
    expect(component).toContain('sizes="(max-width: 1024px) 100vw, 52vw"');
    expect(component).toContain("Visual reference unavailable");
    expect(component).not.toContain("Current visual result");
  });

  it("places the realistic teaching images in the requested practical sections", () => {
    const placements = [
      ["Choose a balanced topping set", "toppings-even-distribution.webp"],
      ["Cheese and moisture", "cheese-amount-placement.webp"],
      ["Before baking", "toppings-precook-wet-ingredients.webp"],
      ["After baking", "toppings-after-baking.webp"],
    ] as const;

    for (const [section, image] of placements) {
      expect(component.indexOf(section)).toBeLessThan(component.indexOf(image));
    }

    for (const caption of [
      "Leave visible space between ingredients so heat can reach the surface and moisture can escape.",
      "Use small, separated pieces of cheese instead of covering the whole pizza.",
      "Cook or drain moisture-heavy ingredients before they go on the pizza.",
      "Add delicate herbs and finishing oil after baking so they stay fresh and aromatic.",
    ]) {
      expect(component).toContain(caption);
    }

    expect(component).toContain("ToppingProcessImage");
    expect(component).toContain('src="/toppings/teaching/toppings-even-distribution.webp"');
    expect(component).toContain('src="/toppings/teaching/cheese-amount-placement.webp"');
    expect(component).toContain('src="/toppings/teaching/toppings-precook-wet-ingredients.webp"');
    expect(component).toContain('src="/toppings/teaching/toppings-after-baking.webp"');
    expect(component).toContain('src="/toppings/diavola/diavola-balanced.webp"');
    expect(component).toContain('src="/toppings/diavola/diavola-too-much.webp"');
    expect(component).not.toContain("/toppings/process/");
  });

  it("stores every realistic visual reference as a local production asset", () => {
    const files = [
      "public/toppings/diavola/diavola-too-little.webp",
      "public/toppings/diavola/diavola-balanced.webp",
      "public/toppings/diavola/diavola-too-much.webp",
      "public/toppings/diavola/diavola-wet-overload.webp",
      "public/toppings/diavola/diavola-heavy-load.webp",
      "public/toppings/examples/margherita-balanced.webp",
      "public/toppings/examples/marinara-balanced.webp",
      "public/toppings/teaching/toppings-even-distribution.webp",
      "public/toppings/teaching/toppings-after-baking.webp",
      "public/toppings/teaching/toppings-precook-wet-ingredients.webp",
      "public/toppings/teaching/cheese-amount-placement.webp",
    ];

    for (const file of files) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }

    expect(component).not.toMatch(/https?:\/\//);
  });

  it("allows numeric controls to keep an editable draft before clamping", () => {
    expect(component).toContain("const [draft, setDraft]");
    expect(component).toContain("onBlur={(event) => commitValue(event.target.value)}");
    expect(component).toContain('event.key === "Enter"');
    expect(component).toContain("data-topping-number-control");
  });

  it("records no people, hands, remote production images or text-in-image dependency", () => {
    expect(component).not.toMatch(/https?:\/\//);
    expect(component).not.toMatch(/person|people|hands|faces|arms|silhouettes/i);
    expect(research).toContain("No production topping asset contains people, hands");
    expect(research).toContain("visual simulation");
  });

  it("keeps a compact related-guide handoff and one final CTA", () => {
    expect(component).not.toContain("Sources and methodology");
    expect(component).not.toContain("View topping sources and methodology");
    expect(component).not.toContain("Connect topping balance to the whole pizza");
    expect(component).not.toContain("<RelatedLearning");
    expect(component).not.toContain("Oven and Heat Guide");
    expect(component).not.toContain("Pizza Style Atlas");
    expect(component).toContain("What should I learn next?");
    expect(component).toContain("Connect topping balance to sauce moisture and oven heat.");
    expect(component).toContain('href: "/sauce"');
    expect(component).toContain('href: "/ovens"');
    expect(component).toContain("Explore guide");
    expect(component).toContain("Plan a pizza");
    expect(component).toContain('href="/session/start"');
    expect(component).not.toContain("Return to Pizza guides");
    expect(component).not.toContain('href="/guide"');
    expect(component).not.toContain("docs/research/topping-balance-sources.md");
  });

  it("keeps the canonical footer as the last visible Toppings page section", () => {
    expect(component).toContain("<SiteFooter />");
    expect(component.indexOf("Ready to use this balance in your next pizza?")).toBeLessThan(component.indexOf("<SiteFooter />"));
    expect(source("app/layout.tsx")).not.toContain("WorkflowNextStep");
  });
});

