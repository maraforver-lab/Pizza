import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

const productionLinkSources = [
  source("components", "GlobalToolNavigation.tsx"),
  source("components", "SiteFooter.tsx"),
  source("lib", "navigation.ts"),
  source("lib", "homepage.ts"),
  source("components", "HomeCalculatorWorkspace.tsx"),
  source("components", "guide", "PizzaTroubleshootingGuideClient.tsx"),
  source("lib", "pizza-style-education.ts"),
  source("lib", "recipe-workflow.ts"),
  source("app", "sauce", "page.tsx"),
  source("app", "timer", "page.tsx"),
].join("\n");

const retiredRoutes = [
  "/start",
  "/history",
  "/gear",
  "/doctor",
  "/plan",
  "/coach",
] as const;

describe("internal link governance", () => {
  it("does not link normal production surfaces to retired compatibility routes", () => {
    for (const route of retiredRoutes) {
      expect(productionLinkSources).not.toContain(`href="${route}"`);
      expect(productionLinkSources).not.toContain(`href: "${route}"`);
      expect(productionLinkSources).not.toContain(`${route}?`);
    }
  });

  it("keeps contextual utilities out of global navigation while preserving contextual links", () => {
    const globalSurfaces = [
      source("components", "GlobalToolNavigation.tsx"),
      source("lib", "navigation.ts"),
    ].join("\n");
    const footer = source("components", "SiteFooter.tsx");
    const shopping = source("app", "session", "shopping", "page.tsx");
    const kitchen = source("app", "session", "kitchen", "page.tsx");

    expect(globalSurfaces).not.toContain("/toppings");
    expect(globalSurfaces).not.toContain("/timer");
    expect(globalSurfaces).not.toContain("/costs");
    expect(footer).toContain('href: "/costs"');
    expect(footer).not.toContain('href: "/toppings"');
    expect(footer).not.toContain('href: "/timer"');
    expect(shopping).toContain('href="/toppings"');
    expect(kitchen).toContain('href="/toppings"');
    expect(kitchen).toContain("KitchenBakeTimerPanel");
  });
});
