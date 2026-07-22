import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("learning architecture", () => {
  it("provides one shared related-learning and breadcrumb pattern", () => {
    const componentPath = join(process.cwd(), "components", "learning", "RelatedLearning.tsx");
    const component = source("components", "learning", "RelatedLearning.tsx");
    const pageEndingPath = join(process.cwd(), "components", "learning", "PublicPageEnding.tsx");
    const pageEnding = source("components", "learning", "PublicPageEnding.tsx");

    expect(existsSync(componentPath)).toBe(true);
    expect(existsSync(pageEndingPath)).toBe(true);
    expect(component).toContain("LearningBreadcrumbs");
    expect(component).toContain('aria-label="Breadcrumb"');
    expect(component).toContain('aria-current="page"');
    expect(component).toContain("RelatedLearning");
    expect(component).toContain("DoughToolsIcon");
    expect(pageEnding).toContain("PublicPageEnding");
    expect(pageEnding).toContain("links.length > 3");
    expect(pageEnding).toContain("cannot repeat the same destination");
  });

  it("makes important learning pages discoverable from the Pizza guides dropdown", () => {
    const header = source("components", "GlobalToolNavigation.tsx");

    expect(header).toContain("Pizza guides");
    expect(header).toContain("Make the dough");
    expect(header).toContain('href: "/guides/dough"');
    expect(header).toContain("Make the sauce");
    expect(header).toContain('href: "/sauce"');
    expect(header).toContain("Choose your pizza");
    expect(header).toContain('href: "/styles"');
    expect(header).toContain("Choose your oven");
    expect(header).toContain('href: "/ovens"');
    expect(header).toContain("Fix pizza problems");
    expect(header).toContain('href: "/guide/pizza-troubleshooting"');
    expect(header).toContain('aria-current={active ? "page" : undefined}');
    expect(header).toContain('aria-label="Pizza guides menu"');
    expect(header).toContain('aria-label="Mobile navigation menu"');
    expect(header).toContain("Pizza guides");
    expect(header).toContain("Make the dough");
    expect(header).toContain("Make the sauce");
    expect(header).toContain("Choose your oven");
    expect(header).toContain("Choose your pizza");
    expect(header).toContain("Fix pizza problems");
    expect(header).toContain("h-[100dvh]");
    expect(header).toContain("overflow-y-auto");
  });

  it("turns the homepage footer into a concise learning and product map", () => {
    const homepage = source("app", "page.tsx");
    const footer = source("components", "SiteFooter.tsx");

    expect(homepage).toContain("<SiteFooter />");
    expect(footer).toContain("footerGroups");
    expect(footer).toContain('title: "Learn"');
    expect(footer).toContain('href: "/guide"');
    expect(footer).toContain('href: "/sauce"');
    expect(footer).toContain('href: "/guides/dough"');
    expect(footer).toContain('href: "/guide/pizza-troubleshooting"');
    expect(footer).toContain('href: "/styles"');
    expect(footer).toContain('href: "/ovens"');
    expect(footer).toContain('title: "Product"');
    expect(footer).toContain('href: "/session/start"');
    expect(footer).toContain('href: "/calculator/quick"');
    expect(footer).toContain('href: "/account/party-orders"');
    expect(footer).toContain('title: "Company"');
    expect(footer).toContain('aria-label="DoughTools footer"');
    expect(footer).toContain("Made for better pizza nights.");
    expect(footer).toContain("lg:grid-cols-[minmax(0,1.35fr)_minmax(0,.85fr)_minmax(0,.85fr)_minmax(0,.65fr)]");
  });

  it("adds breadcrumbs or related learning to educational pages without creating new routes", () => {
    const educationalSources = [
      source("app", "sauce", "page.tsx"),
      source("components", "guide", "DoughGuidePageClient.tsx"),
      source("components", "guide", "PizzaTroubleshootingGuideClient.tsx"),
      source("app", "ovens", "page.tsx"),
      source("app", "styles", "page.tsx"),
      source("components", "toppings", "ToppingBalanceLab.tsx"),
    ];
    const retiredGear = source("app", "gear", "page.tsx");

    for (const page of educationalSources) {
      expect(page).toContain("LearningBreadcrumbs");
      expect(page).toContain("/guide");
    }

    expect(educationalSources.join("\n")).toContain("RelatedLearning");
    expect(educationalSources.join("\n")).toContain("/session/start");
    expect(retiredGear).toContain('permanentRedirect("/ovens#other-equipment")');
    expect(retiredGear).not.toContain("LearningBreadcrumbs");
  });
});
