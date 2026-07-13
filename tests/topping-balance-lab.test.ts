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
    expect(component).toContain("Topping Balance Lab");
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

  it("teaches area, sauce, cheese, drainage, combined load, oven interaction and mistakes", () => {
    for (const text of [
      "The rim is not part of the topping area.",
      "Sauce controls coverage and moisture.",
      "Cheese should support the pizza, not bury it.",
      "Drainage changes how much water reaches the pizza.",
      "Sauce and cheese cannot be judged alone.",
      "The oven changes how forgiving the topping load feels.",
      "Common mistakes",
    ]) {
      expect(component).toContain(text);
    }
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

  it("removes redundant sources and related-learning sections while keeping the final CTA", () => {
    expect(component).not.toContain("Sources and methodology");
    expect(component).not.toContain("View topping sources and methodology");
    expect(component).not.toContain("Connect topping balance to the whole pizza");
    expect(component).not.toContain("<RelatedLearning");
    expect(component).not.toContain("Oven and Heat Guide");
    expect(component).not.toContain("Pizza Style Atlas");
    expect(component).toContain("Plan my next pizza");
    expect(component).toContain("Return to the Learning Center");
    expect(component).toContain('href="/session/start"');
    expect(component).toContain('href="/guide"');
    expect(component).not.toContain("docs/research/topping-balance-sources.md");
  });

  it("keeps the canonical footer as the last visible Toppings page section", () => {
    expect(component).toContain("<SiteFooter />");
    expect(component.indexOf("Ready to use this balance in your next pizza?")).toBeLessThan(component.indexOf("<SiteFooter />"));
    expect(source("components/WorkflowNextStep.tsx")).not.toContain('"/toppings":');
    expect(source("components/WorkflowNextStep.tsx")).not.toContain("Bake with the pizza timer");
  });
});

