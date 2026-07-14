import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  pizzaStyleEducation,
  pizzaStyleGoalGuide,
  pizzaStyleSupportSummary,
  plannerSupportedPizzaStyleIds,
} from "@/lib/pizza-style-education";
import { pizzaStyles } from "@/lib/pizza-styles";
import { PIZZA_CATALOG_OPTIONS } from "@/lib/pizza-catalog";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Pizza Styles comparison and selection guide", () => {
  it("renders /styles as a concise comparison page instead of a long atlas-first page", () => {
    const page = source("app", "styles", "page.tsx");
    const hero = source("components", "styles", "PizzaStyleHero.tsx");
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");
    const goalGuide = source("components", "styles", "PizzaStyleGoalGuide.tsx");
    const notes = source("components", "styles", "PizzaStyleTechniqueNotes.tsx");

    expect(page).toContain("PizzaStyleHero");
    expect(page).toContain("PizzaStyleComparison");
    expect(page).toContain("PizzaStyleGoalGuide");
    expect(page).toContain("PizzaStyleTechniqueNotes");
    expect(page).not.toContain("PizzaStyleAtlas");
    expect(hero).toContain("Choose the pizza style you want to make.");
    expect(hero).toContain("Compare pizza styles by crust");
    expect(hero).not.toContain("actions=");
    expect(comparison).toContain("Main pizza styles at a glance.");
    expect(goalGuide).toContain("Which style fits your goal?");
    expect(notes).toContain("aria-expanded");
    expect(notes).toContain("aria-controls");
  });

  it("keeps every educational style visible and classifies planner support truthfully", () => {
    const ids = pizzaStyleEducation.map((style) => style.id);

    expect(ids).toEqual([
      "neapolitan",
      "contemporary-neapolitan",
      "new-york",
      "detroit",
      "roman-tonda",
      "roman-al-taglio",
      "sicilian",
    ]);
    expect(plannerSupportedPizzaStyleIds).toEqual(["neapolitan"]);
    expect(pizzaStyleSupportSummary).toContain("currently plans Neapolitan-style pizza");
    expect(pizzaStyleSupportSummary).toContain("Other styles here are educational learning guides");
    expect(pizzaStyleEducation.filter((style) => style.support === "supported").map((style) => style.id)).toEqual(["neapolitan"]);
    expect(pizzaStyleEducation.filter((style) => style.support === "learning").map((style) => style.id)).toEqual([
      "contemporary-neapolitan",
      "new-york",
      "detroit",
      "roman-tonda",
      "roman-al-taglio",
      "sicilian",
    ]);
  });

  it("separates dough style concepts from menu and topping presets", () => {
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");

    expect(PIZZA_CATALOG_OPTIONS.map((option) => option.name)).toEqual([
      "Margherita",
      "Marinara",
      "Diavola",
      "Funghi",
      "Prosciutto",
      "Quattro Formaggi",
    ]);
    expect(comparison).toContain("PIZZA_CATALOG_OPTIONS.map");
    expect(comparison).toContain("Topping names are not dough styles.");
    expect(comparison).toContain("menu presets used later for Shopping quantities");
    expect(comparison).not.toContain("Plan my New York");
    expect(comparison).not.toContain("Plan my Detroit");
    expect(comparison).not.toContain("Plan my Roman");
    expect(comparison).not.toContain("Plan my Sicilian");
  });

  it("uses canonical style preset data for comparable planning values instead of page-local constants", () => {
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");

    expect(comparison).toContain("pizzaStyleById");
    expect(comparison).toContain("flourById");
    expect(comparison).toContain("preset.settings.hydration");
    expect(comparison).toContain("preset.settings.fermentation");
    expect(comparison).toContain("?.bake");
    expect(comparison).not.toContain("430–450 °C");
    expect(comparison).not.toContain("260–300 °C");
    expect(comparison).not.toContain("12–16 min");
  });

  it("keeps current calculator and legacy style data unchanged", () => {
    expect(pizzaStyles.map((style) => style.id)).toEqual([
      "neapolitan",
      "contemporary",
      "new-york",
      "roman-thin",
      "detroit",
      "sicilian",
    ]);
    expect(source("lib", "pizza-styles.ts")).toContain("RecipeSettings");
    expect(source("lib", "pizza-styles.ts")).toContain("pizzaStyleById");
    expect(source("lib", "pizza-styles.ts")).not.toContain("PizzaStyleEducation");
  });

  it("answers comparison dimensions that help users choose", () => {
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");

    expect(comparison).toContain("Result");
    expect(comparison).toContain("Oven and bake");
    expect(comparison).toContain("Dough character");
    expect(comparison).toContain("Sauce and toppings");
    expect(comparison).toContain("Best for");
    expect(comparison).not.toContain("<table");

    for (const style of pizzaStyleEducation) {
      expect(style.name).toBeTruthy();
      expect(style.edge).toBeTruthy();
      expect(style.base).toBeTruthy();
      expect(style.ovenEnvironment).toBeTruthy();
      expect(style.bakeStyle).toBeTruthy();
      expect(style.sauceTreatment).toBeTruthy();
      expect(style.toppingDensity).toBeTruthy();
      expect(style.bestSuitedFor.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps navigation focused and avoids legacy /start links", () => {
    const page = source("app", "styles", "page.tsx");
    const goalGuide = source("components", "styles", "PizzaStyleGoalGuide.tsx");

    expect(page).toContain('href: "/guides/dough"');
    expect(page).toContain('href: "/sauce"');
    expect(page).toContain('href: "/ovens"');
    expect(page).toContain('href: "/guide/pizza-troubleshooting"');
    expect(page).toContain('href="/session/start"');
    expect(page).not.toContain('href="/start"');
    expect(goalGuide).not.toContain('href="/session/start"');
    expect((page.match(/href="\/session\/start"/g) ?? []).length).toBe(1);
    expect(page).toContain("SiteFooter");
  });

  it("keeps page hierarchy and accessibility explicit", () => {
    const page = source("app", "styles", "page.tsx");
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");
    const notes = source("components", "styles", "PizzaStyleTechniqueNotes.tsx");

    expect(page.indexOf("PizzaStyleComparison")).toBeLessThan(page.indexOf("PizzaStyleGoalGuide"));
    expect(page.lastIndexOf("PizzaStyleTechniqueNotes")).toBeGreaterThan(page.indexOf("practical-differences-title"));
    expect(comparison).toContain("aria-labelledby");
    expect(comparison).toContain("<dl");
    expect(notes).toContain("role=\"region\"");
    expect(notes).toContain("hidden={!expanded}");
  });

  it("uses local image assets and keeps style research documentation available", () => {
    const imageSources = new Map<string, string>();

    for (const style of pizzaStyleEducation) {
      if (!style.image) continue;
      expect(style.image.src).toMatch(/^\/pizza-styles\/.+\.webp$/);
      expect(style.image.src).not.toContain("http");
      expect(style.image.width).toBe(900);
      expect(style.image.height).toBe(900);
      expect(style.image.fileSizeBytes).toBeGreaterThan(100000);
      expect(style.image.alt).toMatch(/pizza/i);
      expect(style.image.alt).not.toMatch(/person|people|hand|hands|chef/i);
      expect(existsSync(join(process.cwd(), "public", style.image.src.replace(/^\//, "")))).toBe(true);
      expect(imageSources.has(style.image.src)).toBe(false);
      imageSources.set(style.image.src, style.id);
    }

    expect(imageSources.size).toBe(7);

    const research = source("docs", "research", "pizza-style-sources.md");
    expect(research).toContain("Associazione Verace Pizza Napoletana");
    expect(research).toContain("formal standard");
    expect(research).toContain("DoughTools synthesis");
  });

  it("preserves SEO positioning without changing indexing policy", () => {
    const seo = source("lib", "seo-config.ts");

    expect(seo).toContain("Pizza Style Guide: Neapolitan, New York, Detroit, Roman and Sicilian | DoughTools");
    expect(seo).toContain("Compare major pizza styles by crust, texture, dough, oven, sauce and baking method");
    expect(seo).toContain("learn which style DoughTools currently supports for planning");
    expect(seo).toContain("ALLOW_INDEXING");
  });

  it("keeps goal guide aligned with the current educational style set", () => {
    expect(pizzaStyleGoalGuide).toHaveLength(7);
    for (const item of pizzaStyleGoalGuide) {
      expect(pizzaStyleEducation.map((style) => style.id)).toContain(item.styleId);
    }
  });
});
