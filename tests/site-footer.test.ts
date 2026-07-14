import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

const footerBearingSources = [
  ["homepage", source("app", "page.tsx")],
  ["calculator workspace", source("components", "HomeCalculatorWorkspace.tsx")],
  ["about", source("app", "about", "page.tsx")],
  ["account", source("app", "account", "page.tsx")],
  ["coach", source("app", "coach", "page.tsx")],
  ["costs", source("components", "costs", "PizzaCostsPlayfulClient.tsx")],
  ["doctor", source("app", "doctor", "page.tsx")],
  ["gear", source("app", "gear", "page.tsx")],
  ["guide", source("app", "guide", "page.tsx")],
  ["history", source("app", "history", "page.tsx")],
  ["ovens", source("app", "ovens", "page.tsx")],
  ["plan", source("app", "plan", "page.tsx")],
  ["sauce", source("app", "sauce", "page.tsx")],
  ["start", source("app", "start", "page.tsx")],
  ["styles", source("app", "styles", "page.tsx")],
  ["timer", source("app", "timer", "page.tsx")],
  ["toppings", source("components", "toppings", "ToppingBalanceLab.tsx")],
  ["trust layout", source("components", "TrustPageLayout.tsx")],
  ["updates", source("app", "updates", "page.tsx")],
] as const;

const noFooterSources = [
  ["quick calculator", source("app", "calculator", "quick", "page.tsx")],
  ["party orders", source("app", "account", "party-orders", "page.tsx")],
  ["new party order", source("app", "account", "party-orders", "new", "page.tsx")],
  ["party order detail", source("app", "account", "party-orders", "[id]", "page.tsx")],
  ["public order", source("app", "order", "[publicToken]", "page.tsx")],
  ["dough guide route", source("app", "guides", "dough", "page.tsx")],
  ["troubleshooting route", source("app", "guide", "pizza-troubleshooting", "page.tsx")],
  ["session kitchen", source("app", "session", "kitchen", "page.tsx")],
  ["session recipe", source("app", "session", "recipe", "page.tsx")],
  ["session review", source("app", "session", "review", "page.tsx")],
  ["session shopping", source("app", "session", "shopping", "page.tsx")],
  ["session start", source("app", "session", "start", "page.tsx")],
  ["session timeline", source("app", "session", "timeline", "page.tsx")],
] as const;

describe("canonical site footer", () => {
  it("does not render a global workflow prompt after page content", () => {
    const layout = source("app", "layout.tsx");

    expect(layout).not.toContain("WorkflowNextStep");
    expect(layout).not.toContain("<WorkflowNextStep");
    expect(existsSync(join(process.cwd(), "components", "WorkflowNextStep.tsx"))).toBe(false);
  });

  it("defines one shared canonical footer with the approved groups and links", () => {
    const footer = source("components", "SiteFooter.tsx");

    expect(footer).toContain("<footer");
    expect(footer).toContain('aria-label="DoughTools footer"');
    expect(footer).toContain("data-site-footer");
    expect(footer).toContain("Made for better pizza nights.");
    expect(footer).toContain("Learn the craft, plan the evening, and keep the next useful page within reach.");
    expect(footer).toContain('title: "Learn"');
    expect(footer).toContain('title: "Product"');
    expect(footer).toContain('title: "Company"');

    for (const href of [
      "/guide",
      "/sauce",
      "/guides/dough",
      "/guide/pizza-troubleshooting",
      "/styles",
      "/ovens",
      "/session/start",
      "/calculator/quick",
      "/account/party-orders",
      "/costs",
      "/about",
      "/updates",
      "/privacy",
      "/terms",
    ]) {
      expect(footer).toContain(`href: "${href}"`);
    }

    expect(footer).not.toMatch(/localhost|C:\\|C:\/|\/Users\//);
    expect(footer).not.toContain('href: "/journal"');
    expect(footer).not.toContain('href: "/community"');
    expect(footer).not.toContain("Version ");
    expect(footer).not.toContain("build ");
  });

  it("uses the canonical footer on every source that already had a page footer", () => {
    for (const [name, text] of footerBearingSources) {
      expect(text, name).toContain("<SiteFooter />");
      expect(text, name).not.toContain("<AppSignature");
    }
  });

  it("does not add the canonical footer to representative no-footer routes", () => {
    for (const [name, text] of noFooterSources) {
      expect(text, name).not.toContain("<SiteFooter");
      expect(text, name).not.toContain("<AppSignature");
    }
  });

  it("keeps route-specific content before the footer", () => {
    const sauce = source("app", "sauce", "page.tsx");
    const gear = source("app", "gear", "page.tsx");
    const history = source("app", "history", "page.tsx");

    expect(sauce.indexOf("Sources and methodology")).toBeLessThan(sauce.indexOf("<SiteFooter />"));
    expect(gear.indexOf("{t.sources}")).toBeLessThan(gear.indexOf("<SiteFooter />"));
    expect(history.indexOf("{t.sources}")).toBeLessThan(history.indexOf("<SiteFooter />"));
  });

  it("keeps the canonical footer as the final visible element on footer-bearing pages", () => {
    for (const [name, text] of footerBearingSources) {
      const footerStart = text.indexOf("<SiteFooter />");
      expect(footerStart, name).toBeGreaterThanOrEqual(0);

      const afterFooter = text.slice(footerStart + "<SiteFooter />".length);
      expect(afterFooter, name).not.toMatch(/<section|<aside|<article|<nav|<Link|<a\s/);
      expect(afterFooter, name).not.toMatch(/Plan my next pizza|Start Pizza Session|Next step|NEXT STEP/i);
    }
  });

  it("avoids duplicate primary Pizza Session CTAs on public footer-bearing pages", () => {
    for (const [name, text] of footerBearingSources) {
      const directSessionStartLinks = (text.match(/href=["{:]?\s*["']\/session\/start/g) ?? []).length;
      expect(directSessionStartLinks, name).toBeLessThanOrEqual(1);
    }
  });

  it("keeps export branding out of page footer landmarks", () => {
    const exportCard = source("components", "session", "ShoppingListExportCard.tsx");

    expect(exportCard).toContain("data-export-footer");
    expect(exportCard).not.toContain("<footer");
    expect(exportCard).not.toContain("<SiteFooter");
    expect(exportCard).not.toContain("<AppSignature");
  });
});
