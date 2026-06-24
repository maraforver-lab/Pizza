import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getExperienceLevelOrder } from "@/lib/experience-levels";
import { settingsFromUrl } from "@/lib/recipe-url";
import { startHerePathHref, startHerePathQuery, startHerePaths } from "@/lib/start-here";

describe("Start Here path", () => {
  it("defines the required route and page heading", () => {
    const pagePath = join(process.cwd(), "app", "start", "page.tsx");
    const pageSource = readFileSync(pagePath, "utf8");

    expect(existsSync(pagePath)).toBe(true);
    expect(existsSync(join(process.cwd(), "app", "start", "layout.tsx"))).toBe(true);
    expect(pageSource).toContain("Start Here");
    expect(pageSource).toContain("Make your first good pizza without guessing every setting");
  });

  it("defines exactly the three required starter paths", () => {
    expect(startHerePaths.map((path) => path.title)).toEqual([
      "Home oven pizza",
      "Pizza oven pizza",
      "Pan / tray pizza",
    ]);
  });

  it("keeps each starter path complete and beginner-friendly", () => {
    for (const path of startHerePaths) {
      expect(path.bestFor.trim()).toBeTruthy();
      expect(path.whyItWorks.trim()).toBeTruthy();
      expect(path.dontWorryAboutYet.trim()).toBeTruthy();
      expect(path.beginnerGuidance.trim()).toBeTruthy();
      expect(path.steps.length).toBeGreaterThanOrEqual(6);
      expect(path.primaryCta).toMatch(/Calculate/);
      expect(path.secondaryCta).toMatch(/Plan/);
      expect(path.relatedTools.some((tool) => tool.label === "Dough Doctor")).toBe(true);
      expect(path.marker.trim()).toBeTruthy();
    }
  });

  it("uses safe calculator, Planner and Dough Doctor links with supported query parameters", () => {
    for (const path of startHerePaths) {
      const query = startHerePathQuery(path);
      const parsed = settingsFromUrl(`?${query}`);

      expect(startHerePathHref(path, "/")).toBe(`/?${query}`);
      expect(startHerePathHref(path, "/plan")).toBe(`/plan?${query}`);
      expect(startHerePathHref(path, "/doctor")).toBe(`/doctor?${query}`);
      expect(parsed).toMatchObject(path.settings);
      expect(query).not.toContain("undefined");
      expect(query).not.toContain("startHere");
    }
  });

  it("has level-aware notes for Beginner, Enthusiast and Pizza Nerd", () => {
    for (const path of startHerePaths) {
      expect(Object.keys(path.levelNotes).sort()).toEqual([...getExperienceLevelOrder()].sort());
      expect(path.levelNotes.beginner.join(" ")).not.toMatch(/baker.?s percentages/i);
      expect(path.levelNotes.enthusiast.join(" ")).toMatch(/hydration|fermentation|topping|oven|heat/i);
      expect(path.levelNotes.pizza_nerd.join(" ")).toMatch(/assumption|constraint|tradeoff|heat transfer|repeatability|hydration/i);
    }
  });

  it("renders clear text controls and does not rely on icon-only identity", () => {
    const pageSource = readFileSync(join(process.cwd(), "app", "start", "page.tsx"), "utf8");

    expect(startHerePaths.map((path) => path.title)).toEqual(["Home oven pizza", "Pizza oven pizza", "Pan / tray pizza"]);
    expect(pageSource).toContain("{path.title}");
    expect(pageSource).toContain("aria-label={`${path.title} marker`}");
    expect(pageSource).not.toMatch(/<button[^>]*>\s*{path\.marker}\s*<\/button>/);
  });
});
