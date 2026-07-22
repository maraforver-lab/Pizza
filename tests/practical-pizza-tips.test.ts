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
    expect(page).toContain("The full articles are not part of this patch.");
    expect(page).toContain("Planned for Patch {topic.plannedPatch}");
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
});
