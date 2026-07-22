import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Pizza guides index", () => {
  const page = () => source("app/guide/page.tsx");

  it("rebuilds /guide as Pizza guides", () => {
    const guide = page();

    expect(guide).toContain("Pizza guides");
    expect(guide).toContain("Find the right pizza guide.");
    expect(guide).toContain("Start with dough or sauce");
    expect(guide).toContain("Dough guides and sauce guides");
    expect(guide).toContain("Practical pizza tips");
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

  it("puts the canonical dough and sauce guides directly after the hero", () => {
    const guide = page();

    expect(guide).toContain("const primaryGuides");
    expect(guide).toContain("How to make pizza dough");
    expect(guide).toContain("Learn how to make the dough and understand fermentation.");
    expect(guide).toContain('href: "/guides/dough"');
    expect(guide).toContain("How to make pizza sauce");
    expect(guide).toContain("Learn how to make the sauce and see the right sauce amount for one pizza or a full batch.");
    expect(guide).toContain('href: "/sauce"');
    expect(guide.indexOf("primaryGuides")).toBeLessThan(guide.indexOf("secondaryGuides"));
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
    expect(guide).toContain("These anchors keep older guide links useful.");
    expect(guide).not.toContain("Why it matters");
    expect(guide).not.toContain("Practical effect");
    expect(guide).not.toContain("Commonly goes wrong");
    expect(guide).not.toContain("Consider next");
  });

  it("keeps the Guide index as a hub for existing learning routes", () => {
    const guide = page();

    expect(guide).toContain("How to make pizza dough");
    expect(guide).toContain('href: "/guides/dough"');
    expect(guide).toContain("How to make pizza sauce");
    expect(guide).toContain('href: "/sauce"');
    expect(guide).toContain("Baking guides");
    expect(guide).toContain('href: "/ovens"');
    expect(guide).toContain("Choose your pizza");
    expect(guide).toContain('href: "/styles"');
    expect(guide).toContain("Practical pizza tips");
    expect(guide).toContain('href: "/guide/pizza-troubleshooting"');
    expect(guide).toContain("Plan a pizza");
    expect(guide).toContain('href="/session/start"');
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
