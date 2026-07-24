import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (...path: string[]) => readFileSync(join(process.cwd(), ...path), "utf8");

const guideVisualSourceFiles = [
  ["app", "guide", "page.tsx"],
  ["app", "sauce", "page.tsx"],
  ["app", "ovens", "page.tsx"],
  ["app", "styles", "page.tsx"],
  ["components", "guide", "DoughGuidePageClient.tsx"],
  ["components", "guide", "PizzaTroubleshootingGuideClient.tsx"],
  ["components", "ovens", "OvenGuideHero.tsx"],
  ["components", "sauce", "SaucePracticalGuidance.tsx"],
  ["components", "styles", "PizzaStyleHero.tsx"],
  ["components", "toppings", "ToppingBalanceLab.tsx"],
  ["lib", "dough-guide.ts"],
  ["lib", "dough-step-images.ts"],
  ["lib", "pizza-style-education.ts"],
  ["lib", "pizza-styles.ts"],
  ["lib", "pizza-troubleshooting.ts"],
] as const;

function combinedGuideVisualSources() {
  return guideVisualSourceFiles.map((file) => source(...file)).join("\n");
}

function localGuideAssetPath(assetPath: string) {
  return join(process.cwd(), "public", ...assetPath.split("/").filter(Boolean));
}

describe("Guide visual consistency", () => {
  it("keeps important Guide teaching images referenced from their focused pages", () => {
    const combined = combinedGuideVisualSources();
    const requiredTeachingImages = [
      "/dough-guide/teaching-step-02-measure.webp",
      "/dough-guide/teaching-step-03-mix-before-after.webp",
      "/dough-guide/teaching-step-06-bulk-before-after.webp",
      "/dough-guide/guide-step-09-proof.webp",
      "/sauce/neapolitan.webp",
      "/toppings/references/sauce-balanced.webp",
      "/toppings/references/sauce-heavy.webp",
      "/toppings/teaching/toppings-even-distribution.webp",
      "/toppings/teaching/cheese-amount-placement.webp",
      "/toppings/teaching/toppings-precook-wet-ingredients.webp",
      "/toppings/teaching/toppings-after-baking.webp",
      "/ovens/home-vs-pizza-oven.webp",
      "/ovens/teaching/home-oven-steel-position.webp",
      "/ovens/teaching/home-oven-stone-position.webp",
      "/ovens/teaching/home-oven-tray-position.webp",
      "/ovens/teaching/pizza-oven-launch-position.webp",
      "/ovens/teaching/pizza-oven-turning.webp",
      "/images/troubleshooting/pizza-sticks-to-peel.webp",
    ];

    for (const imagePath of requiredTeachingImages) {
      expect(combined).toContain(imagePath);
      expect(existsSync(localGuideAssetPath(imagePath))).toBe(true);
    }
  });

  it("keeps Guide imagery local and avoids decorative homepage-hero reuse on the Guide hub", () => {
    const combined = combinedGuideVisualSources();
    const guideHub = source("app", "guide", "page.tsx");
    const imageReferences = [
      ...combined.matchAll(/["'`](\/(?:dough-guide|sauce|toppings|ovens|images\/troubleshooting|pizza-styles)\/[^"'`\s)]+?\.(?:webp|png|jpe?g|svg))["'`]/g),
    ].map((match) => match[1]);

    expect(guideHub).not.toContain("/images/homepage/doughtools-hero-desktop.webp");
    expect(combined).not.toMatch(/https?:\/\/.*\.(?:webp|png|jpe?g|svg)/i);
    expect(new Set(imageReferences).size).toBeGreaterThan(20);

    for (const imagePath of new Set(imageReferences)) {
      expect(existsSync(localGuideAssetPath(imagePath))).toBe(true);
    }
  });
});
