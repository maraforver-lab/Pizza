import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Pizza guides index", () => {
  const page = () => source("app/guide/page.tsx");

  it("rebuilds /guide as Pizza guides", () => {
    const guide = page();

    expect(guide).toContain("Pizza guides");
    expect(guide).toContain("Learn pizza one choice at a time.");
    expect(guide).toContain("Learn pizza step by step");
    expect(guide).toContain("Understand the choices behind great pizza, from dough and sauce to toppings and baking.");
    expect(guide).toContain("A simple path to better pizza");
    expect(guide).toContain("Practical Tips");
    expect(guide).toContain("Quick orientation");
    expect(guide).not.toContain("Learn more");
  });

  it("removes the Guide-only experience-level selector without touching global level systems", () => {
    const guide = page();

    expect(guide).not.toContain("\"use client\"");
    expect(guide).not.toContain("ExperienceLevelSelector");
    expect(guide).not.toContain("Learning guidance mode");
    expect(guide).not.toContain("readExperienceLevelPreference");
    expect(guide).not.toContain("getEducationExperienceCopy");
  });

  it("puts the quick explanation and recommended learning path directly after the hero", () => {
    const guide = page();

    expect(guide).toContain("New to pizza? Start with Dough.");
    expect(guide).toContain("const learningPathGuides");
    expect(guide).toContain("Recommended learning path");
    expect(guide.indexOf("guide-quick-explanation-title")).toBeLessThan(guide.indexOf("learning-path-title"));
    expect(guide).toContain("Dough");
    expect(guide).toContain("Build the foundation: flour, water, fermentation and dough handling.");
    expect(guide).toContain('href: "/guides/dough"');
    expect(guide).toContain("Sauce");
    expect(guide).toContain("Choose the right sauce style and control moisture.");
    expect(guide).toContain('href: "/sauce"');
    expect(guide.indexOf("learningPathGuides")).toBeLessThan(guide.indexOf("supportingGuides"));
  });

  it("keeps a compact set of stable topic anchors without recreating dough instructions", () => {
    const guide = page();
    const topics = [
      "Hydration",
      "Fermentation",
      "Flour strength",
      "Gluten development",
      "Oven heat",
    ];
    const anchors = [
      "hydration",
      "fermentation",
      "flour-strength",
      "gluten-development",
      "oven-heat",
    ];

    for (const concept of topics) expect(guide).toContain(concept);
    for (const anchor of anchors) expect(guide).toContain(`id: "${anchor}"`);
    expect(guide).toContain("These anchors keep older guide links useful. For full lessons, use the guides above.");
    expect(guide).not.toContain("Why it matters");
    expect(guide).not.toContain("Practical effect");
    expect(guide).not.toContain("Commonly goes wrong");
    expect(guide).not.toContain("Consider next");
  });

  it("keeps the Guide index as a hub for existing learning routes", () => {
    const guide = page();

    expect(guide).toContain("Dough");
    expect(guide).toContain('href: "/guides/dough"');
    expect(guide).toContain("Sauce");
    expect(guide).toContain('href: "/sauce"');
    expect(guide).toContain("Toppings");
    expect(guide).toContain('href: "/toppings"');
    expect(guide).toContain("Ovens");
    expect(guide).toContain('href: "/ovens"');
    expect(guide).toContain("Choose your pizza");
    expect(guide).toContain('href: "/styles"');
    expect(guide).toContain("Practical Tips");
    expect(guide).toContain("Solve common problems and improve your next pizza.");
    expect(guide).toContain('href: "/guide/practical-pizza-tips"');
    expect(guide).toContain("Fix pizza problems");
    expect(guide).toContain('href: "/guide/pizza-troubleshooting"');
    expect(guide).toContain("Plan a pizza");
    expect(guide).toContain('href="/session/start"');
  });

  it("uses one consistent guide-card CTA without replacing learning with workflow", () => {
    const guide = page();

    expect(guide.match(/Explore guide/g)?.length).toBeGreaterThanOrEqual(1);
    expect(guide).not.toContain("Open {link.title}");
    expect(guide).not.toContain("Open How to make pizza dough");
    expect(guide.indexOf("A simple path to better pizza")).toBeLessThan(guide.indexOf("Plan a pizza with less guesswork."));
    expect(guide).toContain("Use the guides to understand dough, sauce, toppings and ovens before you turn those choices into a pizza plan.");
  });

  it("uses approved local imagery and the unified icon system", () => {
    const guide = page();

    expect(guide).toContain("DoughToolsIcon");
    expect(guide).toContain("/images/homepage/doughtools-hero-desktop.webp");
    expect(guide).not.toContain("/dough-guide/guide-step-03-mix.webp");
    expect(guide).not.toMatch(/https?:\/\/|\/\/images|unsplash|pexels|stock/i);
    expect(existsSync(join(process.cwd(), "public", "images", "homepage", "doughtools-hero-desktop.webp"))).toBe(true);
  });

  it("does not add guide-specific recipes, formulas, amounts or old catalogue content", () => {
    const guide = page();

    expect(guide).not.toContain("flourProducts");
    expect(guide).not.toContain("/flours/");
    expect(guide).not.toContain("Caputo Classica");
    expect(guide).not.toContain("Real pizza flours at different strengths");
    expect(guide).not.toContain("Exact calculation or estimate?");
    expect(guide).not.toContain("calculateDoughIngredients");
    expect(guide).not.toContain("calculateSauce");
    expect(guide).not.toContain("sauceGrams");
    expect(guide).not.toContain("hydrationPercent");
    expect(guide).not.toContain("642 g");
    expect(guide).not.toContain("235 g");
  });
});
