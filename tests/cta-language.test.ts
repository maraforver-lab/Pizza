import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function sources(paths: string[]) {
  return paths.map(source).join("\n");
}

describe("sitewide CTA language", () => {
  it("uses canonical public planning language for /session/start entry points", () => {
    const publicEntrySources = sources([
      "lib/homepage.ts",
      "app/about/page.tsx",
      "app/guide/page.tsx",
      "app/ovens/page.tsx",
      "app/styles/page.tsx",
      "app/sauce/page.tsx",
      "components/toppings/ToppingBalanceLab.tsx",
      "components/guide/PizzaTroubleshootingGuideClient.tsx",
      "components/guide/DoughGuidePageClient.tsx",
      "components/SiteFooter.tsx",
    ]);

    expect(publicEntrySources).toContain("Plan a pizza");
    expect(publicEntrySources).not.toContain("Start Pizza Session");
    expect(publicEntrySources).not.toContain("Explore Pizza Sessions");
    expect(publicEntrySources).not.toContain("Continue to the pizza-night plan");
  });

  it("keeps active Pizza Session workflow labels stage-specific", () => {
    const workflow = sources([
      "app/session/start/page.tsx",
      "app/session/recipe/page.tsx",
      "app/session/shopping/page.tsx",
      "app/session/timeline/page.tsx",
      "app/session/kitchen/page.tsx",
      "app/session/review/page.tsx",
    ]);

    expect(workflow).toContain("Plan a pizza");
    expect(workflow).toContain("Continue your pizza plan");
    expect(workflow).toContain("Start cooking");
    expect(workflow).toContain("Review my pizza");
    expect(workflow).toContain("Finish and review");
    expect(workflow).toContain("Continue my plan");
    expect(workflow).not.toContain("Continue saved plan");
    expect(workflow).not.toContain("Build my Dough Plan");
    expect(workflow).not.toContain("Continue cloud plan");
    expect(workflow).not.toContain("Save review ->");
    expect(workflow).not.toContain("Save review →");
  });

  it("names tool actions by the actual operation and avoids unsupported transfer promises", () => {
    const toolSources = sources([
      "lib/homepage.ts",
      "app/guide/page.tsx",
      "app/sauce/page.tsx",
      "app/timer/page.tsx",
      "components/costs/PizzaCostsPlayfulClient.tsx",
      "components/styles/PizzaStyleHero.tsx",
      "components/styles/PizzaStyleAtlas.tsx",
      "components/toppings/ToppingBalanceLab.tsx",
    ]);

    expect(toolSources).toContain("Calculate my dough");
    expect(toolSources).toContain("Make the sauce");
    expect(toolSources).toContain("Estimate my pizza cost");
    expect(toolSources).toContain("Build and compare the topping load");
    expect(toolSources).toContain("Keep your eyes on the pizza");
    expect(toolSources).toContain("Compare pizza styles");
    expect(toolSources).not.toContain("Use this in my pizza plan");
    expect(toolSources).not.toContain("Add this to my pizza plan");
    expect(toolSources).not.toContain("Plan my next pizza with these settings");
  });

  it("documents the CTA inventory and duplicate homepage surface removal", () => {
    const audit = source("docs/audits/patch-369-cta-language-inventory.md");
    const homepageWorkspace = source("components/HomeCalculatorWorkspace.tsx");

    expect(audit).toContain("Patch 372 CTA language inventory");
    expect(audit).toContain("Duplicate surfaces resolved");
    expect(homepageWorkspace).toContain("{homepageContent.hero.primaryCta.label}");
    expect(homepageWorkspace).not.toContain("Start Pizza Session");
    expect(homepageWorkspace).not.toContain("Start ->");
    expect(homepageWorkspace).not.toContain("Start →");
  });
});
