import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Simplified Homepage draft", () => {
  it("keeps the simplified Homepage registered as a draft preview and not the public live route", () => {
    const metadata = source("lib", "homepage-version-metadata.ts");
    const registry = source("lib", "homepage-versions.tsx");
    const publicRoute = source("app", "page.tsx");

    expect(metadata).toContain('id: "simplified"');
    expect(metadata).toContain('status: "draft"');
    expect(metadata).toContain('description: "A clearer Make versus Learn Homepage concept."');
    expect(registry).toContain("simplified: HomepageSimplified");
    expect(publicRoute).toContain("getLiveHomepageVersion()");
    expect(publicRoute).not.toContain("simplified");
    expect(publicRoute).not.toContain("Make better pizza with one clear plan.");
  });

  it("uses the approved simplified hero, CTA destinations and existing local hero image", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");

    expect(page).toContain("Make better pizza with one clear plan.");
    expect(page).toContain(
      "Choose your pizza, timing and oven. DoughTools creates your recipe, shopping list, schedule and baking guidance.",
    );
    expect(page).toContain('href="/session/start"');
    expect(page).toContain("Plan a pizza");
    expect(page).toContain('href="/guide"');
    expect(page).toContain("Explore guides");
    expect(page).toContain("/images/homepage/doughtools-hero-desktop.webp");
    expect(page).not.toMatch(/https?:\/\/|data:image/i);
  });

  it("presents Make versus Learn with the approved hierarchy and copy", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");

    expect(page).toContain("Choose how you want to begin");
    expect(page).toContain("Make pizza");
    expect(page).toContain("Primary path");
    expect(page).toContain("Build one clear pizza plan with recipe, shopping list, timing and baking guidance.");
    expect(page).toContain("Learn pizza");
    expect(page).toContain("Learning path");
    expect(page).toContain("Explore practical guides when you want to understand dough, sauce, toppings or ovens first.");
  });

  it("keeps the four How DoughTools works stages in order", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");
    const stages = [
      'title: "Plan"',
      'title: "Prepare"',
      'title: "Bake"',
      'title: "Review"',
    ];

    expect(page).toContain("How DoughTools works");
    expect(page).toContain("Choose your pizza, timing and oven.");
    expect(page).toContain("Follow the recipe, shopping list and preparation steps.");
    expect(page).toContain("Use the schedule and guided baking flow.");
    expect(page).toContain("Record the result and improve your next pizza.");
    expect(stages.map((stage) => page.indexOf(stage))).toEqual([...stages].map((stage) => page.indexOf(stage)).sort((a, b) => a - b));
  });

  it("keeps supporting tools compact and linked to existing routes", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");

    expect(page).toContain("Useful when you need them");
    expect(page).toContain('title: "Quick Calculator"');
    expect(page).toContain('href: "/calculator/quick"');
    expect(page).toContain('action: "Open calculator"');
    expect(page).toContain('title: "Pizza Styles"');
    expect(page).toContain('href: "/styles"');
    expect(page).toContain('title: "Practical Tips"');
    expect(page).toContain('href: "/guide/practical-pizza-tips"');
    expect(page).toContain('title: "Troubleshooting"');
    expect(page).toContain('href: "/guide/pizza-troubleshooting"');
    expect(page.match(/action: "Explore guide"/g)).toHaveLength(3);
  });

  it("keeps the draft presentation isolated from Pizza Plan, calculator and active-session logic", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");

    expect(page).toContain("DoughToolsIcon");
    expect(page).toContain("<SiteFooter />");
    expect(page).toContain("Ready to make your next pizza?");
    expect(page).toContain("Turn your choices into one clear plan from dough preparation to the final bake.");
    expect(page).not.toMatch(/HomepageSessionActions|HomeCalculatorWorkspace|calculateDough|PizzaSession|session-storage|account_preferences|supabase/i);
    expect(page).not.toContain("lucide-react");
  });
});
