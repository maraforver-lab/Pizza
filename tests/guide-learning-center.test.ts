import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Pizza Learning Center guide index", () => {
  const page = () => source("app/guide/page.tsx");

  it("rebuilds /guide as the Pizza Learning Center", () => {
    const guide = page();

    expect(guide).toContain("Pizza Learning Center");
    expect(guide).toContain("Understand your dough. Make better pizza.");
    expect(guide).toContain("Understand dough basics");
    expect(guide).toContain("Solve a pizza problem");
    expect(guide).toContain('id="problem-led-entry"');
    expect(guide).toContain('id="essential-concepts"');
    expect(guide).toContain("The essentials behind better pizza");
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

  it("offers problem-led entry cards with real destinations", () => {
    const guide = page();
    const problems = [
      "My dough is sticky",
      "My dough will not stretch",
      "My crust is dense",
      "My dough spreads or collapses",
      "I do not know which flour to choose",
      "I use a home oven",
      "I want a lighter, airier crust",
      "I am confused by pizza percentages",
    ];

    for (const problem of problems) expect(guide).toContain(problem);
    expect(guide).toContain('href: "#hydration"');
    expect(guide).toContain('href: "#gluten-development"');
    expect(guide).toContain('href: "#flour-strength"');
    expect(guide).toContain('href: "#oven-heat"');
    expect(guide).toContain('href: "#bakers-percentages"');
  });

  it("includes the required essential concepts with stable anchors", () => {
    const guide = page();
    const concepts = [
      "Hydration",
      "Fermentation",
      "Dough temperature",
      "Flour strength",
      "Gluten development",
      "Yeast",
      "Salt",
      "Ball weight and pizza size",
      "Oven heat and bake profile",
      "Baker’s percentages",
    ];
    const anchors = [
      "hydration",
      "fermentation",
      "dough-temperature",
      "flour-strength",
      "gluten-development",
      "yeast",
      "salt",
      "ball-weight",
      "oven-heat",
      "bakers-percentages",
    ];

    for (const concept of concepts) expect(guide).toContain(concept);
    for (const anchor of anchors) expect(guide).toContain(`id: "${anchor}"`);
    expect(guide).toContain("Why it matters");
    expect(guide).toContain("Practical effect");
    expect(guide).toContain("Commonly goes wrong");
    expect(guide).toContain("Consider next");
  });

  it("keeps the Guide index as a hub for the dedicated detailed guides", () => {
    const guide = page();

    expect(guide).toContain("Pizza Dough Guide");
    expect(guide).toContain('href="/guides/dough"');
    expect(guide).toContain("Pizza Troubleshooting Guide");
    expect(guide).toContain('href="/guide/pizza-troubleshooting"');
    expect(guide).toContain(
      "Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.",
    );
  });

  it("uses approved local imagery and the unified icon system", () => {
    const guide = page();

    expect(guide).toContain("DoughToolsIcon");
    expect(guide).toContain("/images/homepage/doughtools-hero-desktop.webp");
    expect(guide).toContain("/dough-guide/guide-step-03-mix.webp");
    expect(guide).not.toMatch(/https?:\/\/|\/\/images|unsplash|pexels|stock/i);
    expect(existsSync(join(process.cwd(), "public", "images", "homepage", "doughtools-hero-desktop.webp"))).toBe(true);
    expect(existsSync(join(process.cwd(), "public", "dough-guide", "guide-step-03-mix.webp"))).toBe(true);
  });

  it("removes the old flour catalogue and technical settings-reference page shape", () => {
    const guide = page();

    expect(guide).not.toContain("flourProducts");
    expect(guide).not.toContain("/flours/");
    expect(guide).not.toContain("Caputo Classica");
    expect(guide).not.toContain("Real pizza flours at different strengths");
    expect(guide).not.toContain("Exact calculation or estimate?");
  });
});
