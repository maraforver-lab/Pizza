import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("learning architecture", () => {
  it("provides one shared related-learning and breadcrumb pattern", () => {
    const componentPath = join(process.cwd(), "components", "learning", "RelatedLearning.tsx");
    const component = source("components", "learning", "RelatedLearning.tsx");

    expect(existsSync(componentPath)).toBe(true);
    expect(component).toContain("LearningBreadcrumbs");
    expect(component).toContain('aria-label="Breadcrumb"');
    expect(component).toContain('aria-current="page"');
    expect(component).toContain("RelatedLearning");
    expect(component).toContain("DoughToolsIcon");
  });

  it("makes important learning pages discoverable from the Guide dropdown", () => {
    const header = source("components", "GlobalToolNavigation.tsx");

    expect(header).toContain("Pizza Sauce Guide");
    expect(header).toContain('href="/sauce"');
    expect(header).toContain("Pizza Styles");
    expect(header).toContain('href="/styles"');
    expect(header).toContain("Oven Guide");
    expect(header).toContain('href="/ovens"');
    expect(header).toContain('aria-current={sauceGuideActive ? "page" : undefined}');
    expect(header).toContain('aria-current={pizzaStylesActive ? "page" : undefined}');
    expect(header).toContain('aria-current={ovenGuideActive ? "page" : undefined}');
    expect(header).toContain("max-sm:max-h-[calc(100vh-4.5rem)]");
    expect(header).toContain("max-sm:overflow-y-auto");
  });

  it("turns the homepage footer into a concise learning and product map", () => {
    const homepage = source("app", "page.tsx");

    expect(homepage).toContain("footerGroups");
    expect(homepage).toContain('title: "Learn"');
    expect(homepage).toContain('href: "/guide"');
    expect(homepage).toContain('href: "/sauce"');
    expect(homepage).toContain('href: "/guides/dough"');
    expect(homepage).toContain('href: "/guide/pizza-troubleshooting"');
    expect(homepage).toContain('href: "/styles"');
    expect(homepage).toContain('href: "/ovens"');
    expect(homepage).toContain('title: "Product"');
    expect(homepage).toContain('href: "/session/start"');
    expect(homepage).toContain('href: "/calculator/quick"');
    expect(homepage).toContain('href: "/account/party-orders"');
    expect(homepage).toContain('title: "Company"');
    expect(homepage).toContain('aria-label="DoughTools footer"');
    expect(homepage).toContain("Made for better pizza nights.");
    expect(homepage).toContain("lg:grid-cols-[minmax(0,1.35fr)_minmax(0,.85fr)_minmax(0,.85fr)_minmax(0,.65fr)]");
  });

  it("adds breadcrumbs or related learning to educational pages without creating new routes", () => {
    const educationalSources = [
      source("app", "sauce", "page.tsx"),
      source("components", "guide", "DoughGuidePageClient.tsx"),
      source("components", "guide", "PizzaTroubleshootingGuideClient.tsx"),
      source("app", "ovens", "page.tsx"),
      source("app", "gear", "page.tsx"),
      source("app", "styles", "page.tsx"),
      source("app", "toppings", "page.tsx"),
    ];

    for (const page of educationalSources) {
      expect(page).toContain("LearningBreadcrumbs");
      expect(page).toContain("/guide");
    }

    expect(educationalSources.join("\n")).toContain("RelatedLearning");
    expect(educationalSources.join("\n")).toContain("/session/start");
  });
});
