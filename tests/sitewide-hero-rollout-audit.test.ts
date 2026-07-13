import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

type HeroAuditRoute = {
  route: string;
  source: string;
  pageFamily: string;
  actualComponent: string | null;
  actualHeroType: string | null;
  recommendedHeroType: string;
  migrationStatus: string;
  topImagePresent: boolean;
  imageType: string;
  desktopAsset: string | null;
  mobileAsset: string | null;
  imageQuality: string;
  recommendedImageDecision: string;
  visuallyVerified: boolean;
  notes: string[];
};

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

function auditedRoutes() {
  return JSON.parse(source("docs", "audits", "patch-351-sitewide-hero-rollout-audit.json")) as HeroAuditRoute[];
}

function routeFromPagePath(path: string) {
  const normalized = path.replaceAll("\\", "/");
  if (normalized === "app/page.tsx") return "/";
  const withoutPrefix = normalized.replace(/^app\//, "").replace(/\/page\.tsx$/, "");
  return withoutPrefix === "" ? "/" : `/${withoutPrefix}`;
}

describe("Patch 351 sitewide hero rollout audit", () => {
  it("creates the required human-readable and machine-readable audit files", () => {
    expect(existsSync(join(process.cwd(), "docs", "audits", "patch-351-sitewide-hero-rollout-audit.md"))).toBe(true);
    expect(existsSync(join(process.cwd(), "docs", "audits", "patch-351-sitewide-hero-rollout-audit.json"))).toBe(true);
  });

  it("keeps the audit document structured around the approved sections", () => {
    const audit = source("docs", "audits", "patch-351-sitewide-hero-rollout-audit.md");

    for (const heading of [
      "## 1. Executive summary",
      "## 3. Hero-system component inventory",
      "## 5. Route-by-route audit table",
      "## 11. Desktop findings",
      "## 12. Mobile findings",
      "## 14. Patch 347 intent versus current implementation",
      "## 15. Priority findings",
      "## 16. Decision shortlist for Marcin",
      "## 17. Routes intentionally left without images",
      "## 18. Routes that could benefit from new imagery",
      "## 19. Routes where images should not be added",
      "## 20. Audit limitations",
    ]) {
      expect(audit).toContain(heading);
    }
  });

  it("covers every current user-facing app page route", () => {
    const routes = new Set(auditedRoutes().map((entry) => entry.route));
    const appPageFiles = source("docs", "audits", "patch-351-sitewide-hero-rollout-audit.md");

    for (const path of [
      "app/page.tsx",
      "app/about/page.tsx",
      "app/account/page.tsx",
      "app/account/party-orders/page.tsx",
      "app/account/party-orders/new/page.tsx",
      "app/account/party-orders/[id]/page.tsx",
      "app/account/pizza-sessions/[id]/page.tsx",
      "app/calculator/quick/page.tsx",
      "app/coach/page.tsx",
      "app/community/page.tsx",
      "app/contact/page.tsx",
      "app/costs/page.tsx",
      "app/doctor/page.tsx",
      "app/gear/page.tsx",
      "app/guide/page.tsx",
      "app/guide/pizza-troubleshooting/page.tsx",
      "app/guides/dough/page.tsx",
      "app/history/page.tsx",
      "app/journal/page.tsx",
      "app/methodology/page.tsx",
      "app/order/[publicToken]/page.tsx",
      "app/order/[publicToken]/edit/[submissionToken]/page.tsx",
      "app/ovens/page.tsx",
      "app/plan/page.tsx",
      "app/privacy/page.tsx",
      "app/sauce/page.tsx",
      "app/session/kitchen/page.tsx",
      "app/session/recipe/page.tsx",
      "app/session/review/page.tsx",
      "app/session/shopping/page.tsx",
      "app/session/start/page.tsx",
      "app/session/timeline/page.tsx",
      "app/start/page.tsx",
      "app/styles/page.tsx",
      "app/terms/page.tsx",
      "app/timer/page.tsx",
      "app/toppings/page.tsx",
      "app/updates/page.tsx",
    ]) {
      const absolute = join(process.cwd(), path);
      expect(existsSync(absolute), path).toBe(true);
      const route = routeFromPagePath(relative(process.cwd(), absolute));
      expect(routes.has(route), route).toBe(true);
      expect(appPageFiles).toContain(route);
    }
  });

  it("records the approved hero types and migration-status vocabulary", () => {
    const entries = auditedRoutes();
    const heroTypes = new Set(entries.map((entry) => entry.recommendedHeroType));
    const statuses = new Set(entries.map((entry) => entry.migrationStatus));

    expect(heroTypes).toContain("Marketing Hero");
    expect(heroTypes).toContain("Editorial Learning Hero");
    expect(heroTypes).toContain("Visual Lab Hero");
    expect(heroTypes).toContain("Compact Workspace Header");
    expect(heroTypes).toContain("Minimal Utility Header");

    expect(statuses).toContain("Fully migrated");
    expect(statuses).toContain("Partially migrated");
    expect(statuses).toContain("Legacy");
    expect(statuses).toContain("Workspace exemption");
    expect(statuses).toContain("Minimal utility exemption");
  });

  it("keeps Patch 351 audit-only with no production component changes required by the test", () => {
    const heroSystem = source("components", "page-hero", "PageHeroSystem.tsx");
    const audit = source("docs", "audits", "patch-351-sitewide-hero-rollout-audit.md");

    expect(heroSystem).toContain("export function MarketingHero");
    expect(heroSystem).toContain("export function EditorialLearningHero");
    expect(heroSystem).toContain("export function VisualLabHero");
    expect(heroSystem).toContain("export function WorkspaceHeader");
    expect(heroSystem).toContain("export function UtilityHeader");
    expect(audit).toContain("No production page was modified.");
  });
});
