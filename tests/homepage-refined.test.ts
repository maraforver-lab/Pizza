import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Refined Homepage", () => {
  it("registers the refined Homepage as the live version without public version selection", () => {
    const metadata = source("lib", "homepage-version-metadata.ts");
    const registry = source("lib", "homepage-versions.tsx");
    const publicRoute = source("app", "page.tsx");

    expect(metadata).toContain('id: "refined"');
    expect(metadata).toContain('name: "Refined homepage"');
    expect(metadata).toContain('status: "live"');
    expect(metadata).toContain('description: "A more image-led and compact refinement of the simplified Homepage."');
    expect(registry).toContain("import HomepageRefined");
    expect(registry).toContain("refined: HomepageRefined");
    expect(publicRoute).toContain("getLiveHomepageVersion()");
    expect(publicRoute).not.toContain("HomepageRefined");
    expect(publicRoute).not.toMatch(/searchParams.*version|homepage-preview|localStorage/i);
  });

  it("renders the refined hero with the approved CTAs and local image crop", () => {
    const page = source("components", "homepage", "HomepageRefined.tsx");

    expect(page).toContain("Make better pizza with one clear plan.");
    expect(page).toContain("Calculate your pizza dough, choose your fermentation timing and oven, and get one clear recipe, shopping list, schedule and baking plan.");
    expect(page).toContain('<HomepageAction href="/session/start">Plan a pizza</HomepageAction>');
    expect(page).toContain('<HomepageAction href="/guide" variant="secondary">');
    expect(page).toContain("Explore guides");
    expect(page).toContain("/images/homepage/doughtools-hero-desktop.webp");
    expect(page).toContain("lg:grid-cols-[minmax(0,0.64fr)_minmax(0,1.1fr)]");
    expect(page).toContain('sizes="(max-width: 1023px) 100vw, 64vw"');
    expect(page).toContain("scale-[1.06]");
    expect(page).toContain("lg:scale-[1.1]");
    expect(page).not.toMatch(/https?:\/\/|data:image/i);
  });

  it("keeps Make and Learn as full semantic links with unchanged destinations", () => {
    const page = source("components", "homepage", "HomepageRefined.tsx");

    expect(page).toContain("Choose how you want to begin");
    expect(page).toContain('title: "Make pizza"');
    expect(page).toContain('label: "Primary path"');
    expect(page).toContain('copy: "Create your complete Pizza Plan."');
    expect(page).toContain('href: "/session/start"');
    expect(page).toContain('title: "Learn pizza"');
    expect(page).toContain('label: "Learning path"');
    expect(page).toContain('copy: "Explore dough, sauce, toppings and ovens."');
    expect(page).toContain('href: "/guide"');
    expect(page).toContain("aria-label={`${path.title}: ${path.copy}`}");
    expect(page).toContain("hover:shadow-card");
    expect(page).toContain("focus-visible:outline");
    expect(page).toContain("size-11");
    expect(page).toContain("size={24} aria-hidden=\"true\"");
    expect(page).not.toContain("onClick");
    expect(page).not.toContain("path.cta");
    expect(page).not.toContain("hover:-translate-y");
  });

  it("keeps the four process stages in order without decorative connector or desktop dividers", () => {
    const page = source("components", "homepage", "HomepageRefined.tsx");
    const stages = [
      'title: "Plan"',
      'title: "Prepare"',
      'title: "Bake"',
      'title: "Review"',
    ];

    expect(page).toContain("How DoughTools works");
    expect(page).toContain("mt-4 overflow-hidden rounded-[1.25rem] border");
    expect(page).toContain("overflow-hidden rounded-[1.25rem] border");
    expect(page).toContain("lg:grid lg:grid-cols-4");
    expect(page).not.toContain("homepage-process-connector");
    expect(page).not.toContain("hidden h-px bg-ink/10 lg:block");
    expect(page).not.toContain("lg:border-r");
    expect(page).not.toContain("lg:last:border-r-0");
    expect(page).not.toContain("relative z-10");
    expect(page).toContain("px-4 py-3.5");
    expect(page).toContain("Step {index + 1}");
    expect(page).toContain("border-b border-ink/10");
    expect(page).toContain("lg:border-b-0");
    expect(page).toContain("size={24} aria-hidden=\"true\"");
    expect(page).not.toContain("One calm flow");
    expect(page).not.toContain("rounded-2xl bg-cream/80 p-4");
    expect(stages.map((stage) => page.indexOf(stage))).toEqual([...stages].map((stage) => page.indexOf(stage)).sort((a, b) => a - b));
  });

  it("renders supporting tool cards as semantic links with explicit action labels", () => {
    const page = source("components", "homepage", "HomepageRefined.tsx");

    expect(page).toContain("Useful when you need them");
    expect(page).toContain('title: "Quick Calculator"');
    expect(page).toContain('copy: "Use the pizza dough calculator for quick ingredient amounts."');
    expect(page).toContain('action: "Open calculator"');
    expect(page).toContain('href: "/calculator/quick"');
    expect(page).toContain('title: "Pizza Styles"');
    expect(page).toContain('action: "Explore guide"');
    expect(page).toContain('href: "/styles"');
    expect(page).toContain('title: "Practical Tips"');
    expect(page).toContain('href: "/guide/practical-pizza-tips"');
    expect(page).toContain('title: "Troubleshooting"');
    expect(page).toContain('href: "/guide/pizza-troubleshooting"');
    expect(page).toContain("aria-label={`${tool.title}: ${tool.action}`}");
    expect(page).toContain("grid grid-cols-2 gap-3 lg:grid-cols-4");
    expect(page).toContain("group-hover:bg-tomato/[.08]");
    expect(page).toContain("w-fit items-center rounded-full");
    expect(page).not.toContain("<button");
  });

  it("keeps the final CTA and isolates the draft from product logic", () => {
    const page = source("components", "homepage", "HomepageRefined.tsx");
    const homepageActionUses = page.match(/<HomepageAction/g) ?? [];

    expect(page).toContain("Ready to make your next pizza?");
    expect(page).toContain("Turn your choices into one clear plan from dough preparation to the final bake.");
    expect(page).toContain("px-5 py-6 text-center");
    expect(page).toContain("sm:px-8 sm:py-8");
    expect(page).toContain("<SiteFooter />");
    expect(homepageActionUses).toHaveLength(3);
    expect(page).not.toMatch(/HomepageSessionActions|HomeCalculatorWorkspace|calculateDough|PizzaSession|session-storage|account_preferences|supabase/i);
    expect(page).not.toContain("lucide-react");
    expect(page).not.toMatch(/Publish|Restore|Retire|Delete|Duplicate|Edit/);
  });

  it("leaves the stable and simplified implementations visually separate", () => {
    const stable = source("components", "homepage", "HomepageStable.tsx");
    const simplified = source("components", "homepage", "HomepageSimplified.tsx");
    const refined = source("components", "homepage", "HomepageRefined.tsx");

    expect(stable).not.toContain("homepage-refined");
    expect(simplified).not.toContain("homepage-refined");
    expect(refined).not.toContain("homepage-refined");
    expect(refined).not.toContain("HomepageStable");
    expect(refined).not.toContain("HomepageSimplified");
  });
});
