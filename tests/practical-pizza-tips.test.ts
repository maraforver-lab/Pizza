import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPERIENCE_LEVELS } from "@/lib/experience-levels";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Practical pizza tips landing page", () => {
  it("creates a dedicated Pizza guides destination for planned practical topics", () => {
    const page = source("app", "guide", "practical-pizza-tips", "page.tsx");
    const guide = source("app", "guide", "page.tsx");
    const navigation = source("lib", "navigation.ts");
    const header = source("components", "GlobalToolNavigation.tsx");

    expect(page).toContain("Practical pizza tips");
    expect(page).toContain("leftover dough");
    expect(page).toContain("Freezing and thawing");
    expect(page).toContain("Choosing fermentation length");
    expect(page).toContain("Dough container and lid use");
    expect(page).toContain("Common dough, sauce and baking problems");
    expect(page).toContain("Start with leftover dough guidance now.");
    expect(page).toContain('href: "/guide/practical-pizza-tips/leftover-dough"');
    expect(page).toContain("Open practical tip");
    expect(page).toContain("Planned for Patch");
    expect(guide).toContain('href: "/guide/practical-pizza-tips"');
    expect(navigation).toContain('id: "practical-tips"');
    expect(navigation).toContain('label: "Practical pizza tips"');
    expect(navigation).toContain('href: "/guide/practical-pizza-tips"');
    expect(header).toContain('href: "/guide/practical-pizza-tips"');
    expect(header).toContain("practicalTipsActive");
  });

  it("defines one reusable level-aware pattern without a new profile setting", () => {
    const page = source("app", "guide", "practical-pizza-tips", "page.tsx");

    expect(page).toContain("const practicalTipLevelPattern");
    expect(page).toContain("EXPERIENCE_LEVELS");
    expect(page).toContain("type ExperienceLevel");
    expect(page).toContain("Direct answer and safe starting action");
    expect(page).toContain("Practical adjustments and common exceptions");
    expect(page).toContain("Technical explanation and fine-tuning");
    expect(EXPERIENCE_LEVELS.map((level) => level.label)).toEqual(["Beginner", "Enthusiast", "Pizza Nerd"]);
    expect(page).not.toContain("ExperienceLevelSelector");
    expect(page).not.toContain("writeExperienceLevelPreference");
    expect(page).not.toContain("localStorage");
  });

  it("keeps essential safety guidance visible to every level", () => {
    const page = source("app", "guide", "practical-pizza-tips", "page.tsx");

    expect(page).toContain("Always visible");
    expect(page).toContain("Safety does not hide behind experience level.");
    expect(page).toContain("Keep food-safety guidance visible to every experience level.");
    expect(page).toContain("Use cold storage for dough that needs to wait.");
    expect(page).toContain("Discard dough or toppings that smell wrong, show mold or have been held unsafely.");
    expect(page).toContain("Follow your appliance manual when using grill, broiler, stone, steel or high heat.");
    expect(page.indexOf("Always visible")).toBeLessThan(page.indexOf("Practical pizza tips level pattern"));
  });

  it("preserves the existing troubleshooting article as a separate destination", () => {
    const page = source("app", "guide", "practical-pizza-tips", "page.tsx");
    const guide = source("app", "guide", "page.tsx");

    expect(page).toContain('href="/guide/pizza-troubleshooting"');
    expect(page).toContain("Fix pizza problems");
    expect(guide).toContain("Fix pizza problems");
    expect(guide).toContain('href: "/guide/pizza-troubleshooting"');
  });

  it("adds a leftover dough page with storage, freezing, thawing and safety guidance", () => {
    const page = source("app", "guide", "practical-pizza-tips", "leftover-dough", "page.tsx");
    const seo = source("lib", "seo-config.ts");

    expect(page).toContain('metadataForRoute("/guide/practical-pizza-tips/leftover-dough")');
    expect(seo).toContain('path: "/guide/practical-pizza-tips/leftover-dough"');
    expect(page).toContain("Leftover dough");
    expect(page).toContain("Store, freeze, thaw and safely use dough");
    expect(page).toContain("refrigerate it");
    expect(page).toContain("freeze it");
    expect(page).toContain("Lightly oil the dough ball and container");
    expect(page).toContain("Move frozen dough to the refrigerator to thaw");
    expect(page).toContain("let chilled dough warm up and relax");
    expect(page).toContain("Discard dough");
    expect(page).not.toContain("75 minutes");
  });

  it("uses the shared Beginner, Enthusiast and Pizza Nerd structure for leftover dough", () => {
    const page = source("app", "guide", "practical-pizza-tips", "leftover-dough", "page.tsx");

    expect(page).toContain("const levelGuidance");
    expect(page).toContain("EXPERIENCE_LEVELS");
    expect(page).toContain("type ExperienceLevel");
    expect(page).toContain("Safe starting action");
    expect(page).toContain("Storage timing and recovery");
    expect(page).toContain("What storage changes inside the dough");
    expect(page).toContain("Under-fermented dough feels dense and tight");
    expect(page).toContain("over-fermented dough feels slack");
    expect(page).toContain("Cold storage slows fermentation");
    expect(page).toContain("Container headspace matters");
    expect(EXPERIENCE_LEVELS.map((level) => level.label)).toEqual(["Beginner", "Enthusiast", "Pizza Nerd"]);
    expect(page).not.toContain("ExperienceLevelSelector");
    expect(page).not.toContain("writeExperienceLevelPreference");
    expect(page).not.toContain("localStorage");
  });

  it("keeps leftover dough food-safety guidance visible outside the level cards", () => {
    const page = source("app", "guide", "practical-pizza-tips", "leftover-dough", "page.tsx");

    expect(page).toContain("Always visible");
    expect(page).toContain("Food-safety checks come first.");
    expect(page).toContain("Keep leftover dough covered and cold whenever it is waiting.");
    expect(page).toContain("Thaw frozen dough in the refrigerator first");
    expect(page).toContain("Discard dough that shows mold");
    expect(page.indexOf("Always visible")).toBeLessThan(page.indexOf("Leftover dough guidance by experience level"));
  });
});
