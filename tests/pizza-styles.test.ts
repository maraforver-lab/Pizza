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

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Pizza Style Atlas", () => {
  it("rebuilds /styles as an educational atlas rather than a calculator selector", () => {
    const page = source("app", "styles", "page.tsx");
    const hero = source("components", "styles", "PizzaStyleHero.tsx");

    expect(page).toContain("PizzaStyleHero");
    expect(page).toContain("PizzaStyleComparison");
    expect(page).toContain("PizzaStyleChapter");
    expect(page).toContain("PizzaStyleGoalGuide");
    expect(hero).toContain("Pizza Style Atlas");
    expect(page).toContain("A pizza style is more than its toppings.");
    expect(page).toContain("What DoughTools currently plans");
    expect(page).toContain("Jump to a style");
    expect(page).toContain("Ready to plan the style DoughTools supports today?");
    expect(page).not.toContain("recipeParams");
    expect(page).not.toContain("Use this style");
    expect(page).not.toContain("Apply every setting to the calculator");
  });

  it("keeps product support truthful and limits planner CTAs to supported style language", () => {
    const page = source("app", "styles", "page.tsx");
    const hero = source("components", "styles", "PizzaStyleHero.tsx");
    const goalGuide = source("components", "styles", "PizzaStyleGoalGuide.tsx");

    expect(plannerSupportedPizzaStyleIds).toEqual(["neapolitan"]);
    expect(pizzaStyleSupportSummary).toContain("currently plans Neapolitan-style pizza");
    expect(pizzaStyleSupportSummary).toContain("Other styles here are educational learning guides");
    expect(page).toContain("Start with a Neapolitan-style Pizza Session");
    expect(hero).toContain('href="/session/start"');
    expect(goalGuide).toContain('href="/session/start"');
    expect(page).not.toMatch(/Plan my (New York|Detroit|Roman|Sicilian|Contemporary)/);
    expect(page).not.toContain("Coming soon");
    expect(page).not.toContain("disabled");
  });

  it("includes the required educational style set and separates Roman and Sicilian terminology", () => {
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
    expect(pizzaStyleEducation.find((style) => style.id === "roman-tonda")?.description).toMatch(/round Roman/i);
    expect(pizzaStyleEducation.find((style) => style.id === "roman-al-taglio")?.description).toMatch(/rectangular Roman pan/i);
    expect(pizzaStyleEducation.find((style) => style.id === "sicilian")?.description).toMatch(/regional Sicilian traditions|Italian-American/i);
    expect(pizzaStyleGoalGuide).toHaveLength(7);
  });

  it("answers practical questions for every primary style section", () => {
    for (const style of pizzaStyleEducation) {
      expect(style.name).toBeTruthy();
      expect(style.origin).toBeTruthy();
      expect(style.description).toBeTruthy();
      expect(style.shape).toBeTruthy();
      expect(style.thickness).toBeTruthy();
      expect(style.edge).toBeTruthy();
      expect(style.interior).toBeTruthy();
      expect(style.base).toBeTruthy();
      expect(style.bakingSurface).toBeTruthy();
      expect(style.ovenEnvironment).toBeTruthy();
      expect(style.bakeStyle).toBeTruthy();
      expect(style.cheeseTreatment).toBeTruthy();
      expect(style.sauceTreatment).toBeTruthy();
      expect(style.eatingExperience).toBeTruthy();
      expect(style.whatYouSee.length).toBeGreaterThanOrEqual(4);
      expect(style.whatYouFeel.length).toBeGreaterThanOrEqual(4);
      expect(style.whyItBehaves).toMatch(/dough|oven|pan|heat|bake|fermentation/i);
      expect(style.typicalBuild.length).toBeGreaterThanOrEqual(3);
      expect(style.bestSuitedFor.length).toBeGreaterThanOrEqual(3);
      expect(style.commonConfusion).toBeTruthy();
      expect(style.relatedLearning.length).toBeGreaterThanOrEqual(4);
    }
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

  it("uses local image assets with dimensions, alt text and no duplicate image assignment", () => {
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

    expect(imageSources.size).toBe(6);
    expect(pizzaStyleEducation.find((style) => style.id === "roman-al-taglio")?.image).toBeUndefined();
    expect(source("components", "styles", "PizzaStyleChapter.tsx")).toContain("StructureDiagram");
    expect(source("components", "styles", "PizzaStyleChapter.tsx")).toContain("role=\"img\"");
  });

  it("records research sources and distinguishes formal standards from expert guidance", () => {
    const research = source("docs", "research", "pizza-style-sources.md");

    expect(research).toContain("Associazione Verace Pizza Napoletana");
    expect(research).toContain("formal standard");
    expect(research).toContain("Buddy’s Pizza");
    expect(research).toContain("Serious Eats");
    expect(research).toContain("Pizza al Taglio");
    expect(research).toContain("Sfincione");
    expect(research).toContain("DoughTools synthesis");
  });

  it("keeps accessibility and mobile strategy explicit in components", () => {
    const page = source("app", "styles", "page.tsx");
    const comparison = source("components", "styles", "PizzaStyleComparison.tsx");
    const chapter = source("components", "styles", "PizzaStyleChapter.tsx");
    const badge = source("components", "styles", "PizzaStyleSupportBadge.tsx");

    expect(page).toContain("LearningBreadcrumbs");
    expect(page).toContain("aria-label=\"Pizza style index\"");
    expect(page).toContain("aria-label=\"Dough to texture style system\"");
    expect(comparison).toContain("sm:grid-cols-[9rem_minmax(0,1fr)]");
    expect(comparison).not.toContain("<table");
    expect(chapter).toContain("<details");
    expect(chapter).toContain("<summary");
    expect(chapter).toContain("figcaption");
    expect(badge).toContain("support === \"supported\"");
    expect(badge).toContain("note");
  });

  it("updates SEO positioning without changing indexing policy", () => {
    const seo = source("lib", "seo-config.ts");

    expect(seo).toContain("Pizza Style Guide: Neapolitan, New York, Detroit, Roman and Sicilian | DoughTools");
    expect(seo).toContain("Compare major pizza styles by crust, texture, dough, oven, sauce and baking method");
    expect(seo).toContain("learn which style DoughTools currently supports for planning");
    expect(seo).toContain("ALLOW_INDEXING");
    expect(seo).not.toContain("apply practical starting settings to the DoughTools calculator");
  });
});
