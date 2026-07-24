import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPERIENCE_LEVELS, EXPERIENCE_LEVEL_STORAGE_KEY } from "@/lib/experience-levels";
import { selectPracticalTipLevelGuidance, type PracticalTipLevelGuidanceItem } from "@/lib/practical-tips-guidance";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }
}

const sampleGuidance = [
  {
    level: "beginner",
    title: "Beginner only title",
    intro: "Beginner only intro",
    steps: ["Beginner only action"],
  },
  {
    level: "enthusiast",
    title: "Enthusiast only title",
    intro: "Enthusiast only intro",
    steps: ["Enthusiast only action"],
  },
  {
    level: "pizza_nerd",
    title: "Pizza Nerd only title",
    intro: "Pizza Nerd only intro",
    steps: ["Pizza Nerd only action"],
  },
] as const satisfies readonly PracticalTipLevelGuidanceItem[];

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
    expect(page).toContain("Open a focused tip when a small dough, sauce or baking decision needs a quick answer.");
    expect(page).toContain('href: "/guide/practical-pizza-tips/leftover-dough"');
    expect(page).toContain('href: "/guide/practical-pizza-tips/fermentation-length"');
    expect(page).toContain('href: "/guide/practical-pizza-tips/containers-and-lids"');
    expect(page).toContain('href: "/guide/practical-pizza-tips/common-problems"');
    expect(page).toContain("Explore guide");
    expect(guide).toContain('href: "/guide/practical-pizza-tips"');
    expect(navigation).toContain('id: "practical-tips"');
    expect(navigation).toContain('label: "Practical pizza tips"');
    expect(navigation).toContain('href: "/guide/practical-pizza-tips"');
    expect(header).toContain('href: "/guide/practical-pizza-tips"');
    expect(header).toContain("practicalTipsActive");
  });

  it("keeps the landing focused on topic cards without redundant level explanations", () => {
    const page = source("app", "guide", "practical-pizza-tips", "page.tsx");

    expect(page).not.toContain("Structure");
    expect(page).not.toContain("Each future tip will use the same Beginner, Enthusiast and Pizza Nerd pattern");
    expect(page).not.toContain("const practicalTipLevelPattern");
    expect(page).not.toContain("Direct answer and safe starting action");
    expect(page).not.toContain("Practical adjustments and common exceptions");
    expect(page).not.toContain("Technical explanation and fine-tuning");
    expect(page).not.toContain("ExperienceLevelSelector");
    expect(page).not.toContain("writeExperienceLevelPreference");
    expect(page).not.toContain("localStorage");
  });

  it("removes the lower safety and troubleshooting promo sections from the landing", () => {
    const page = source("app", "guide", "practical-pizza-tips", "page.tsx");

    expect(page).not.toContain("Safety does not hide behind experience level.");
    expect(page).not.toContain("Keep food-safety guidance visible to every experience level.");
    expect(page).not.toContain("Use cold storage for dough that needs to wait.");
    expect(page).not.toContain("Discard dough or toppings that smell wrong, show mold or have been held unsafely.");
    expect(page).not.toContain("Follow your appliance manual when using grill, broiler, stone, steel or high heat.");
    expect(page).not.toContain("Practical pizza tips level pattern");
    expect(page).not.toContain("Troubleshoot the current pizza problem.");
    expect(page).not.toContain('href="/guide/pizza-troubleshooting"');
    expect(page.indexOf("Explore guide")).toBeLessThan(page.indexOf("<SiteFooter />"));
  });

  it("preserves the existing troubleshooting article as a separate Pizza guides destination", () => {
    const page = source("app", "guide", "practical-pizza-tips", "page.tsx");
    const guide = source("app", "guide", "page.tsx");

    expect(page).not.toContain('href="/guide/pizza-troubleshooting"');
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
    expect(page).toContain("PracticalTipsLevelGuidance");
    expect(page).toContain("PracticalTipLevelGuidanceItem");
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
    expect(page.indexOf("Always visible")).toBeLessThan(page.indexOf("Leftover dough guidance by selected experience level"));
  });

  it("adds a fermentation length page with a clear 12, 24, 48 and 72 hour comparison", () => {
    const page = source("app", "guide", "practical-pizza-tips", "fermentation-length", "page.tsx");
    const seo = source("lib", "seo-config.ts");

    expect(page).toContain('metadataForRoute("/guide/practical-pizza-tips/fermentation-length")');
    expect(seo).toContain('path: "/guide/practical-pizza-tips/fermentation-length"');
    expect(page).toContain("Choosing fermentation length");
    expect(page).toContain("12, 24, 48 and 72 hour");
    expect(page).toContain('label: "12 hours"');
    expect(page).toContain('label: "24 hours"');
    expect(page).toContain('label: "48 hours"');
    expect(page).toContain('label: "72 hours"');
    expect(page).toContain("Longer fermentation is not automatically better");
    expect(page).toContain("start with 24 hours");
    expect(page).not.toContain("always better");
  });

  it("uses the shared three-level structure for fermentation depth without calculator logic", () => {
    const page = source("app", "guide", "practical-pizza-tips", "fermentation-length", "page.tsx");

    expect(page).toContain("const levelGuidance");
    expect(page).toContain("PracticalTipsLevelGuidance");
    expect(page).toContain("PracticalTipLevelGuidanceItem");
    expect(page).toContain("Choose the simplest safe plan");
    expect(page).toContain("Match flavor, strength and schedule");
    expect(page).toContain("Read the time-temperature-yeast system");
    expect(page).toContain("Room-temperature fermentation moves faster");
    expect(page).toContain("Proteolysis can improve extensibility");
    expect(page).toContain("Gas retention depends on gluten quality");
    expect(page).toContain("Nominal hours are only a planning label");
    expect(EXPERIENCE_LEVELS.map((level) => level.label)).toEqual(["Beginner", "Enthusiast", "Pizza Nerd"]);
    expect(page).not.toContain("calculate");
    expect(page).not.toContain("PizzaSession");
    expect(page).not.toContain("Timeline");
  });

  it("keeps fermentation safety guidance visible outside the level cards", () => {
    const page = source("app", "guide", "practical-pizza-tips", "fermentation-length", "page.tsx");

    expect(page).toContain("Always visible");
    expect(page).toContain("Dough condition matters more than the clock.");
    expect(page).toContain("Do not judge dough readiness by hours alone");
    expect(page).toContain("Discard dough with mold");
    expect(page).toContain("Shorten the plan if the dough is racing ahead");
    expect(page.indexOf("Always visible")).toBeLessThan(page.indexOf("Fermentation length guidance by selected experience level"));
  });

  it("adds a container and lid page with covered-but-not-pressure-sealed guidance", () => {
    const page = source("app", "guide", "practical-pizza-tips", "containers-and-lids", "page.tsx");
    const seo = source("lib", "seo-config.ts");

    expect(page).toContain('metadataForRoute("/guide/practical-pizza-tips/containers-and-lids")');
    expect(seo).toContain('path: "/guide/practical-pizza-tips/containers-and-lids"');
    expect(page).toContain("Dough container and lid use");
    expect(page).toContain("Cover the dough");
    expect(page).toContain("Leave headspace");
    expect(page).toContain("Do not pressure-seal");
    expect(page).toContain("prevents drying");
    expect(page).toContain("Condensation is normal");
    expect(page).toContain("Clean and covered comes first.");
  });

  it("uses the shared three-level structure for container and lid depth", () => {
    const page = source("app", "guide", "practical-pizza-tips", "containers-and-lids", "page.tsx");

    expect(page).toContain("PracticalTipsLevelGuidance");
    expect(page).toContain("PracticalTipLevelGuidanceItem");
    expect(page).toContain("Use a covered container with room");
    expect(page).toContain("Control drying, sticking and temperature swings");
    expect(page).toContain("Read headspace, humidity and gas expansion");
    expect(page).toContain("A pressure-tight setup is unnecessary");
    expect(page).toContain("Container and lid guidance by selected experience level");
    expect(EXPERIENCE_LEVELS.map((level) => level.label)).toEqual(["Beginner", "Enthusiast", "Pizza Nerd"]);
  });

  it("adds a common problems page with beginner problem-to-action guidance", () => {
    const page = source("app", "guide", "practical-pizza-tips", "common-problems", "page.tsx");
    const seo = source("lib", "seo-config.ts");

    expect(page).toContain('metadataForRoute("/guide/practical-pizza-tips/common-problems")');
    expect(seo).toContain('path: "/guide/practical-pizza-tips/common-problems"');
    expect(page).toContain("Common dough, sauce and baking problems");
    expect(page).toContain("Dough too sticky");
    expect(page).toContain("Dough too tight");
    expect(page).toContain("Dough spread flat");
    expect(page).toContain("Dry skin on dough");
    expect(page).toContain("Sauce too watery");
    expect(page).toContain("Pale top");
    expect(page).toContain("Burnt base");
    expect(page).toContain("Wet toppings");
  });

  it("keeps common problems concise while linking to the existing troubleshooting guide", () => {
    const page = source("app", "guide", "practical-pizza-tips", "common-problems", "page.tsx");

    expect(page).toContain('href="/guide/pizza-troubleshooting"');
    expect(page).toContain("Explore guide");
    expect(page).toContain("Quick fixes for the current pizza.");
    expect(page).not.toContain("Beginner fixes for the current pizza.");
    expect(page).toContain("Under-fermented dough is dense and tight");
    expect(page).toContain("Sauce water activity and total topping mass");
    expect(page).toContain("Top-to-bottom heat balance");
    expect(page).toContain("Safety beats saving a bad batch.");
    expect(page.indexOf("Always visible")).toBeLessThan(page.indexOf("Common problem guidance by selected experience level"));
  });

  it("renders Practical Tips article guidance through one selected-level component", () => {
    const articlePaths = [
      ["leftover-dough", "Leftover dough guidance by selected experience level"],
      ["fermentation-length", "Fermentation length guidance by selected experience level"],
      ["containers-and-lids", "Container and lid guidance by selected experience level"],
      ["common-problems", "Common problem guidance by selected experience level"],
    ] as const;

    for (const [slug, ariaLabel] of articlePaths) {
      const page = source("app", "guide", "practical-pizza-tips", slug, "page.tsx");

      expect(page).toContain("<PracticalTipsLevelGuidance");
      expect(page).toContain(`ariaLabel="${ariaLabel}"`);
      expect(page).toContain("items={levelGuidance}");
      expect(page).not.toContain("levelGuidance.map");
      expect(page).not.toContain("LevelGuidanceCard");
      expect(page).not.toContain("EXPERIENCE_LEVELS");
      expect(page).not.toContain("getExperienceLevelCornerAccentStyle");
    }
  });

  it("selects only Beginner guidance when Beginner is stored", () => {
    const storage = new MemoryStorage();
    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "beginner");

    const selected = selectPracticalTipLevelGuidance(sampleGuidance, storage);

    expect(selected.title).toBe("Beginner only title");
    expect(selected.intro).toContain("Beginner only intro");
    expect(selected.steps.join(" ")).toContain("Beginner only action");
    expect(selected.title).not.toBe("Enthusiast only title");
    expect(selected.title).not.toBe("Pizza Nerd only title");
  });

  it("selects only Enthusiast guidance when Enthusiast is stored", () => {
    const storage = new MemoryStorage();
    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "enthusiast");

    const selected = selectPracticalTipLevelGuidance(sampleGuidance, storage);

    expect(selected.title).toBe("Enthusiast only title");
    expect(selected.intro).toContain("Enthusiast only intro");
    expect(selected.steps.join(" ")).toContain("Enthusiast only action");
    expect(selected.title).not.toBe("Beginner only title");
    expect(selected.title).not.toBe("Pizza Nerd only title");
  });

  it("selects only Pizza Nerd guidance when Pizza Nerd is stored", () => {
    const storage = new MemoryStorage();
    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "pizza_nerd");

    const selected = selectPracticalTipLevelGuidance(sampleGuidance, storage);

    expect(selected.title).toBe("Pizza Nerd only title");
    expect(selected.intro).toContain("Pizza Nerd only intro");
    expect(selected.steps.join(" ")).toContain("Pizza Nerd only action");
    expect(selected.title).not.toBe("Beginner only title");
    expect(selected.title).not.toBe("Enthusiast only title");
  });

  it("uses the canonical Beginner fallback for missing and invalid preferences", () => {
    const missingStorage = new MemoryStorage();
    const invalidStorage = new MemoryStorage();
    invalidStorage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "wizard");

    expect(selectPracticalTipLevelGuidance(sampleGuidance, missingStorage).level).toBe("beginner");
    expect(selectPracticalTipLevelGuidance(sampleGuidance, invalidStorage).level).toBe("beginner");
    expect(invalidStorage.getItem(EXPERIENCE_LEVEL_STORAGE_KEY)).toBe("wizard");
  });

  it("keeps shared article content, CTAs and footers outside selected-level filtering", () => {
    const articlePaths = ["leftover-dough", "fermentation-length", "containers-and-lids", "common-problems"] as const;

    for (const slug of articlePaths) {
      const page = source("app", "guide", "practical-pizza-tips", slug, "page.tsx");

      expect(page).toContain("Always visible");
      expect(page).toContain("<SiteFooter />");
      expect(page).toContain('href="/guide/');
      expect(page.indexOf("Always visible")).toBeLessThan(page.indexOf("<PracticalTipsLevelGuidance"));
    }
  });

  it("keeps Practical Tips isolated from Pizza Plan and calculator behavior", () => {
    const component = source("components", "guide", "PracticalTipsLevelGuidance.tsx");
    const helper = source("lib", "practical-tips-guidance.ts");
    const articleSources = [
      source("app", "guide", "practical-pizza-tips", "leftover-dough", "page.tsx"),
      source("app", "guide", "practical-pizza-tips", "fermentation-length", "page.tsx"),
      source("app", "guide", "practical-pizza-tips", "containers-and-lids", "page.tsx"),
      source("app", "guide", "practical-pizza-tips", "common-problems", "page.tsx"),
    ].join("\n");

    expect(component).toContain("selectPracticalTipLevelGuidance");
    expect(helper).toContain("readExperienceLevelPreference");
    expect(component).not.toMatch(/writeExperienceLevelPreference|localStorage\\.setItem|calculateDough|PizzaSession|updatePizzaSession/);
    expect(helper).not.toMatch(/writeExperienceLevelPreference|localStorage\\.setItem|calculateDough|PizzaSession|updatePizzaSession/);
    expect(articleSources).not.toMatch(/calculateDough|PizzaSession|updatePizzaSession|setActivePizzaSession|QuickDoughCalculator|SauceCalculator/);
  });
});
