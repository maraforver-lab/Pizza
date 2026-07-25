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
      "Choose your pizza, timing and oven. Get one clear recipe, shopping list, schedule and baking plan.",
    );
    expect(page).toContain('href="/session/start"');
    expect(page).toContain("Plan a pizza");
    expect(page).toContain('href="/guide"');
    expect(page).toContain("Explore guides");
    expect(page).toContain("/images/homepage/doughtools-hero-desktop.webp");
    expect(page).not.toMatch(/https?:\/\/|data:image/i);
  });

  it("presents Make versus Learn as compact linked paths without nested CTA buttons", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");

    expect(page).toContain("Choose how you want to begin");
    expect(page).toContain("Make pizza");
    expect(page).toContain("Primary path");
    expect(page).toContain("Create your complete Pizza Plan.");
    expect(page).toContain("Learn pizza");
    expect(page).toContain("Learning path");
    expect(page).toContain("Explore dough, sauce, toppings and ovens.");
    expect(page).toContain("aria-label={`${path.title}: ${path.copy}`}");
    expect(page).not.toContain("path.cta");
    expect(page).not.toContain('bg-ink p-5 text-white shadow-card');
    expect(page).not.toContain("Build one clear pizza plan with recipe, shopping list, timing and baking guidance.");
    expect(page).not.toContain("Explore practical guides when you want to understand dough, sauce, toppings or ovens first.");
  });

  it("keeps the four How DoughTools works stages in a connected process", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");
    const stages = [
      'title: "Plan"',
      'title: "Prepare"',
      'title: "Bake"',
      'title: "Review"',
    ];

    expect(page).toContain("How DoughTools works");
    expect(page).not.toContain("One calm flow");
    expect(page).toContain("Choose your pizza, timing and oven.");
    expect(page).toContain("Follow your recipe and preparation steps.");
    expect(page).toContain("Use your schedule and baking guidance.");
    expect(page).toContain("Save what worked for next time.");
    expect(page).toContain("overflow-hidden rounded-[1.25rem] border");
    expect(page).toContain("lg:grid lg:grid-cols-4");
    expect(page).toContain("border-b border-ink/10");
    expect(page).not.toContain("rounded-2xl bg-cream/80 p-4");
    expect(stages.map((stage) => page.indexOf(stage))).toEqual([...stages].map((stage) => page.indexOf(stage)).sort((a, b) => a - b));
  });

  it("keeps supporting tools compact, short and linked to existing routes", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");

    expect(page).toContain("Useful when you need them");
    expect(page).toContain('title: "Quick Calculator"');
    expect(page).toContain('href: "/calculator/quick"');
    expect(page).toContain("Calculate dough amounts quickly.");
    expect(page).toContain('title: "Pizza Styles"');
    expect(page).toContain('href: "/styles"');
    expect(page).toContain("Compare styles before choosing.");
    expect(page).toContain('title: "Practical Tips"');
    expect(page).toContain('href: "/guide/practical-pizza-tips"');
    expect(page).toContain("Solve timing, storage and dough problems.");
    expect(page).toContain('title: "Troubleshooting"');
    expect(page).toContain('href: "/guide/pizza-troubleshooting"');
    expect(page).toContain("Diagnose what went wrong.");
    expect(page).toContain("grid grid-cols-2 gap-3 lg:grid-cols-4");
    expect(page).not.toContain("tool.action");
    expect(page).not.toContain("Calculate dough amounts quickly without creating a full pizza plan.");
    expect(page).not.toContain("Compare pizza styles before choosing what to make.");
    expect(page).not.toContain("Solve dough, storage, fermentation and common pizza problems.");
    expect(page).not.toContain("Diagnose what went wrong and choose the next practical fix.");
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

  it("limits prominent CTAs to the hero and final action while keeping the footer", () => {
    const page = source("components", "homepage", "HomepageSimplified.tsx");
    const homepageActionUses = page.match(/<HomepageAction/g) ?? [];
    const heroStart = page.indexOf('aria-labelledby="homepage-simplified-hero-heading"');
    const pathsStart = page.indexOf('aria-labelledby="homepage-path-heading"');
    const finalStart = page.indexOf('aria-labelledby="homepage-simplified-final-heading"');
    const footerStart = page.indexOf("<SiteFooter />");

    expect(homepageActionUses).toHaveLength(3);
    expect(page.slice(heroStart, pathsStart).match(/<HomepageAction/g)).toHaveLength(2);
    expect(page.slice(finalStart, footerStart).match(/<HomepageAction/g)).toHaveLength(1);
    expect(page.slice(pathsStart, finalStart)).not.toContain("<HomepageAction");
    expect(footerStart).toBeGreaterThan(finalStart);
  });
});
