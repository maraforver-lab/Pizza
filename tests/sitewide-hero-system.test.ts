import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const expectedRoutes = [
  "/",
  "/?calculator=1",
  "/?calculator=2",
  "/about",
  "/guide",
  "/guides/dough",
  "/guide/pizza-troubleshooting",
  "/sauce",
  "/ovens",
  "/styles",
  "/history",
  "/gear",
  "/toppings",
  "/costs",
  "/doctor",
  "/timer",
  "/calculator/quick",
  "/start",
  "/plan",
  "/session/start",
  "/session/recipe",
  "/session/shopping",
  "/session/timeline",
  "/session/kitchen",
  "/session/review",
  "/account",
  "/account/pizza-sessions/[id]",
  "/account/party-orders",
  "/account/party-orders/new",
  "/account/party-orders/[id]",
  "/order/[publicToken]",
  "/order/[publicToken]/edit/[submissionToken]",
  "/coach",
  "/privacy",
  "/terms",
  "/contact",
  "/methodology",
  "/updates",
] as const;

describe("sitewide hero and imagery system", () => {
  it("documents the authoritative hero and imagery system", () => {
    const docPath = join(process.cwd(), "docs/sitewide-hero-and-imagery-system.md");
    expect(existsSync(docPath)).toBe(true);

    const doc = source("docs/sitewide-hero-and-imagery-system.md");
    expect(doc).toContain("Type A — Marketing Hero");
    expect(doc).toContain("Type B — Editorial Learning Hero");
    expect(doc).toContain("Type C — Visual Lab Hero");
    expect(doc).toContain("Type D — Compact Workspace Header");
    expect(doc).toContain("Type E — Minimal Utility and Trust Header");
    expect(doc).toContain("Do not generate or introduce people, hands");
  });

  it("links the hero system from product governance documents", () => {
    expect(source("AGENTS.md")).toContain("docs/sitewide-hero-and-imagery-system.md");
    expect(source("docs/design-system.md")).toContain("./sitewide-hero-and-imagery-system.md");
    expect(source("docs/visual-style-guide.md")).toContain("docs/sitewide-hero-and-imagery-system.md");
    expect(source("docs/global-responsive-ux-rules.md")).toContain("docs/sitewide-hero-and-imagery-system.md");
  });

  it("records an explicit visual decision for every major user-facing route", () => {
    const audit = source("docs/audits/patch-347-sitewide-hero-audit.md");

    for (const route of expectedRoutes) {
      expect(audit).toContain(`| \`${route}\``);
    }

    expect(audit).toContain("Type A — Marketing Hero");
    expect(audit).toContain("Type B — Editorial Learning Hero");
    expect(audit).toContain("Type C — Visual Lab Hero");
    expect(audit).toContain("Type D — Compact Workspace Header");
    expect(audit).toContain("Type E — Minimal Utility Header");
    expect(audit).toContain("None in Patch 347");
  });

  it("provides shared components for the five introduction types", () => {
    const component = source("components/page-hero/PageHeroSystem.tsx");

    expect(component).toContain("export function MarketingHero");
    expect(component).toContain("export function EditorialLearningHero");
    expect(component).toContain("export function VisualLabHero");
    expect(component).toContain("export function WorkspaceHeader");
    expect(component).toContain("export function UtilityHeader");
    expect(component).toContain("buttonClass");
    expect(component).toContain("DoughToolsIcon");
  });

  it("applies the trust-page hero system with restrained legal imagery", () => {
    const layout = source("components/TrustPageLayout.tsx");

    expect(layout).toContain("TrustHero");
    expect(layout).toContain("Back to DoughTools");
    expect(layout).toContain("next/image");
    expect(layout).toContain("<Image");
    expect(layout).toContain("<SiteFooter />");
  });

  it("keeps the patch free of new production image references and generated people imagery", () => {
    const audit = source("docs/audits/patch-347-sitewide-hero-audit.md");
    const component = source("components/page-hero/PageHeroSystem.tsx");

    expect(audit).toContain("No new images were generated");
    expect(audit).toContain("No people or hands were introduced");
    expect(component).not.toContain("http://");
    expect(component).not.toContain("https://");
  });
});
