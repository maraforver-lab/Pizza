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
    const atlas = source("components", "styles", "PizzaStyleAtlas.tsx");

    expect(page).toContain("PizzaStyleHero");
    expect(page).toContain("PizzaStyleAtlas");
    expect(page).toContain("PizzaStyleComparison");
    expect(page).toContain("PizzaStyleGoalGuide");
    expect(hero).toContain("Pizza Style Atlas");
    expect(hero).toContain("Explore the styles");
    expect(hero).toContain("See what DoughTools supports");
    expect(page).toContain("A pizza style is more than its toppings.");
    expect(page).toContain("What DoughTools currently plans");
    expect(page).toContain("Ready to plan the style DoughTools supports today?");
    expect(atlas).toContain("Explore by what the pizza looks and feels like.");
    expect(atlas).toContain("Explore style");
    expect(atlas).toContain("role=\"dialog\"");
    expect(atlas).toContain("aria-modal=\"true\"");
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
    expect(hero).toContain('href: "#planner-support"');
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
      expect(style.galleryTraits.length).toBeGreaterThanOrEqual(3);
      expect(style.galleryTraits.length).toBeLessThanOrEqual(4);
      expect(style.callouts.length).toBeGreaterThanOrEqual(4);
      expect(style.callouts.length).toBeLessThanOrEqual(5);
      for (const callout of style.callouts) {
        expect(callout.anchorX).toBeGreaterThanOrEqual(0);
        expect(callout.anchorX).toBeLessThanOrEqual(100);
        expect(callout.anchorY).toBeGreaterThanOrEqual(0);
        expect(callout.anchorY).toBeLessThanOrEqual(100);
        expect(callout.labelX).toBeGreaterThanOrEqual(0);
        expect(callout.labelX).toBeLessThanOrEqual(100);
        expect(callout.labelY).toBeGreaterThanOrEqual(0);
        expect(callout.labelY).toBeLessThanOrEqual(100);
      }
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

    expect(imageSources.size).toBe(7);
    expect(pizzaStyleEducation.find((style) => style.id === "roman-al-taglio")?.image?.src).toBe("/pizza-styles/roman-al-taglio.webp");
    expect(source("components", "styles", "PizzaStyleAtlas.tsx")).toContain("AnnotationLayer");
    expect(source("components", "styles", "PizzaStyleAtlas.tsx")).toContain("anchorX");
    expect(source("components", "styles", "PizzaStyleAtlas.tsx")).toContain("labelX");
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
    const atlas = source("components", "styles", "PizzaStyleAtlas.tsx");
    const badge = source("components", "styles", "PizzaStyleSupportBadge.tsx");

    expect(page).toContain("LearningBreadcrumbs");
    expect(page).toContain("aria-label=\"Dough to texture style system\"");
    expect(atlas).toContain("md:grid-cols-2 xl:grid-cols-3");
    expect(atlas).toContain("onKeyDown");
    expect(atlas).toContain("Escape");
    expect(atlas).toContain("Close style detail");
    expect(atlas).toContain("hidden md:block");
    expect(atlas).toContain("Open style detail");
    expect(comparison).not.toContain("<table");
    expect(atlas).toContain("<details");
    expect(atlas).toContain("<summary");
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
