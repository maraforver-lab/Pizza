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

describe("Pizza Styles Assistant", () => {
  it("renders /styles as a decision assistant instead of an atlas-first page", () => {
    const page = source("app", "styles", "page.tsx");
    const hero = source("components", "styles", "PizzaStyleHero.tsx");
    const assistant = source("components", "styles", "PizzaStyleAssistant.tsx");
    const visualComparison = source("components", "styles", "PizzaStyleVisualComparison.tsx");
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");
    const notes = source("components", "styles", "PizzaStyleTechniqueNotes.tsx");

    expect(page).toContain("PizzaStyleHero");
    expect(page).toContain("PizzaStyleAssistant");
    expect(page).toContain("PizzaStyleVisualComparison");
    expect(page).toContain("PizzaStyleComparison");
    expect(page).toContain("PizzaStyleTechniqueNotes");
    expect(page).not.toContain("PizzaStyleGoalGuide");
    expect(page).not.toContain("PizzaStyleAtlas");
    expect(page.indexOf("<PizzaStyleHero />")).toBeLessThan(page.indexOf("<PizzaStyleAssistant />"));
    expect(page.indexOf("<PizzaStyleAssistant />")).toBeLessThan(page.indexOf("<PizzaStyleVisualComparison />"));
    expect(page.indexOf("<PizzaStyleVisualComparison />")).toBeLessThan(page.indexOf("<PizzaStyleComparison />"));
    expect(page.indexOf("<PizzaStyleComparison />")).toBeLessThan(page.indexOf("<PizzaStyleTechniqueNotes />"));
    expect(hero).toContain("Choose the pizza style that fits your oven and goal.");
    expect(hero).toContain("Choose the result you want");
    expect(assistant).toContain("What kind of pizza do you want to make?");
    expect(visualComparison).toContain("Every style stays available.");
    expect(comparison).toContain("Compare the important differences.");
    expect(notes).toContain("Explore technique differences");
  });

  it("adds accessible goal selection near the top", () => {
    const assistant = source("components", "styles", "PizzaStyleAssistant.tsx");

    expect(assistant).toContain('role="radiogroup"');
    expect(assistant).toContain('aria-label="Pizza style goal"');
    expect(assistant).toContain('role="radio"');
    expect(assistant).toContain("aria-checked");
    expect(assistant).toContain("aria-pressed");
    expect(assistant).toContain("Soft and airy");
    expect(assistant).toContain("Crisp and foldable");
    expect(assistant).toContain("Thin and crisp");
    expect(assistant).toContain("Pan pizza");
    expect(assistant).toContain("Large sharing pizza");
    expect(assistant).toContain("Easiest home-oven fit");
    expect(assistant).toContain("Selected");
    expect(assistant).not.toMatch(/localStorage|sessionStorage|fetch\(|supabase|createSession/i);
  });

  it("shows relevant recommendations from the canonical style set", () => {
    const assistant = source("components", "styles", "PizzaStyleAssistant.tsx");

    expect(assistant).toContain("pizzaStyleEducationById");
    for (const id of [
      "neapolitan",
      "contemporary-neapolitan",
      "new-york",
      "detroit",
      "roman-tonda",
      "roman-al-taglio",
      "sicilian",
    ]) {
      expect(assistant).toContain(`styleId: "${id}"`);
    }
    expect(assistant).toContain("Styles that fit this goal");
    expect(assistant).toContain("Inspect style details");
    expect(assistant).not.toMatch(/\/pizza-styles\/.+\.webp/);
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
    expect(pizzaStyleSupportSummary).toContain("currently support Neapolitan-style pizza");
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

  it("simplifies support status without making unsupported styles look defective", () => {
    const assistant = source("components", "styles", "PizzaStyleAssistant.tsx");
    const badge = source("components", "styles", "PizzaStyleSupportBadge.tsx");
    const page = source("app", "styles", "page.tsx");

    expect((assistant.match(/DoughTools Pizza Plans currently support Neapolitan-style pizza/g) ?? [])).toHaveLength(1);
    expect(assistant).toContain("Other styles are learning references unless specifically marked otherwise.");
    expect(badge).toContain("Supported in Pizza Plan");
    expect(badge).toContain("Learning guide");
    expect(assistant).toContain("Use this as a learning reference.");
    expect(assistant).toContain("DoughTools does not yet create a full Pizza Plan for this style.");
    expect(assistant).toContain("Plan a Neapolitan-style pizza");
    expect(page).toContain("Plan a Neapolitan-style pizza");
    expect(assistant).not.toContain("Plan this style");
    expect(page).not.toContain("Plan my New York");
    expect(page).not.toContain("Plan my Detroit");
    expect(page).not.toContain("Plan my Roman");
    expect(page).not.toContain("Plan my Sicilian");
  });

  it("keeps all seven existing image paths and uses canonical image metadata", () => {
    const imageSources = new Map<string, string>();
    const visualComparison = source("components", "styles", "PizzaStyleVisualComparison.tsx");
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");

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
    expect(visualComparison).toContain("pizzaStyleEducation.filter");
    expect(visualComparison).toContain("<Image");
    expect(comparison).toContain("<Image");
    expect(visualComparison).not.toContain("priority");
    expect(comparison).not.toContain("priority");
    expect(visualComparison).not.toMatch(/https?:\/\//);
    expect(comparison).not.toMatch(/https?:\/\//);
  });

  it("keeps the compact all-style browse layer and valid style anchors", () => {
    const visualComparison = source("components", "styles", "PizzaStyleVisualComparison.tsx");

    expect(visualComparison).toContain('aria-labelledby="style-visual-comparison-title"');
    expect(visualComparison).toContain('aria-label={`View ${style.name} details in the style comparison`}');
    expect(visualComparison).toContain('href={`#${style.id}`}');
    expect(visualComparison).toContain("Browse all styles");
    expect(visualComparison).not.toContain("carousel");
    for (const style of pizzaStyleEducation) {
      expect(style.name).toBeTruthy();
      expect(style.shortName).toBeTruthy();
    }
  });

  it("keeps the primary comparison compact and moves deeper detail behind disclosures", () => {
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");

    expect(comparison).toContain("Oven fit");
    expect(comparison).toContain("Crust and texture");
    expect(comparison).toContain("Shape or thickness");
    expect(comparison).toContain("Bake behavior");
    expect(comparison).toContain("Best for");
    expect(comparison).toContain("<details");
    expect(comparison).toContain("View dough, topping and technique details");
    expect(comparison).toContain("doughSummary");
    expect(comparison).toContain("preset.settings.hydration");
    expect(comparison).toContain("flourById");
    expect(comparison).not.toContain("Main pizza styles at a glance.");
    expect(comparison).not.toContain("Pizza plans currently support Neapolitan-style pizza for home ovens and pizza ovens.");
    expect(comparison).not.toContain("<table");
  });

  it("keeps selected-style detail available without duplicating mobile and desktop controls", () => {
    const assistant = source("components", "styles", "PizzaStyleAssistant.tsx");

    expect(assistant).toContain("SelectedStyleDetail");
    expect(assistant).toContain('aria-live="polite"');
    expect(assistant).toContain("View deeper style details");
    expect(assistant).toContain("style.eatingExperience");
    expect(assistant).toContain("style.ovenEnvironment");
    expect(assistant).toContain("style.bakeStyle");
    expect(assistant).not.toContain("Desktop");
    expect(assistant).not.toContain("Mobile");
  });

  it("keeps technique notes secondary and keyboard accessible", () => {
    const notes = source("components", "styles", "PizzaStyleTechniqueNotes.tsx");

    expect(notes).toContain("<details");
    expect(notes).toContain("Explore technique differences");
    expect(notes).toContain("aria-expanded");
    expect(notes).toContain("aria-controls");
    expect(notes).toContain("role=\"region\"");
    expect(notes).toContain("hidden={!expanded}");
  });

  it("removes duplicated goal-guide and broad lower-page navigation", () => {
    const page = source("app", "styles", "page.tsx");

    expect(page).not.toContain("PizzaStyleGoalGuide");
    expect(page).not.toContain("Focused guides");
    expect(page).not.toContain("Use the dedicated guide for the next detail.");
    expect(page).not.toContain("practical-differences-title");
    expect(page).not.toContain("Dough guides");
    expect(page).not.toContain("Fix pizza problems");
    expect(page).toContain("SiteFooter");
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

  it("keeps goal-guide data available for the assistant mapping without rendering the old section", () => {
    expect(pizzaStyleGoalGuide).toHaveLength(7);
    for (const item of pizzaStyleGoalGuide) {
      expect(pizzaStyleEducation.map((style) => style.id)).toContain(item.styleId);
    }
  });

  it("preserves SEO positioning without changing indexing policy", () => {
    const seo = source("lib", "seo-config.ts");

    expect(seo).toContain("Pizza Style Guide: Choose Neapolitan, New York, Detroit and More | DoughTools");
    expect(seo).toContain("Compare pizza styles by crust, texture, dough, oven, sauce and baking method");
    expect(seo).toContain("choose the style that fits your oven and goal");
    expect(seo).toContain("publicIndexableRoutePaths");
  });
});
