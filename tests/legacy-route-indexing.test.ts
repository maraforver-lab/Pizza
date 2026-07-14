import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

const legacyRoutes = [
  { route: "/plan", dir: "plan", marker: "doughtools-active-plan-v1" },
  { route: "/doctor", dir: "doctor", marker: "diagnoseDough" },
  { route: "/gear", dir: "gear", marker: "doughtools-gear-v1" },
  { route: "/coach", dir: "coach", marker: "buildCoachAdvice" },
] as const;

describe("legacy predecessor route indexing", () => {
  it("keeps obsolete predecessor pages accessible while routing metadata through explicit noindex layouts", () => {
    for (const legacy of legacyRoutes) {
      const pagePath = join(process.cwd(), "app", legacy.dir, "page.tsx");
      const layoutPath = join(process.cwd(), "app", legacy.dir, "layout.tsx");
      const page = source("app", legacy.dir, "page.tsx");
      const layout = source("app", legacy.dir, "layout.tsx");

      expect(existsSync(pagePath), legacy.route).toBe(true);
      expect(existsSync(layoutPath), legacy.route).toBe(true);
      expect(page, legacy.route).toContain(legacy.marker);
      expect(page, legacy.route).not.toContain("redirect(");
      expect(page, legacy.route).not.toContain("permanentRedirect(");
      expect(layout, legacy.route).toContain("metadataForLegacyRoute");
      expect(layout, legacy.route).toContain(`"${legacy.route}"`);
    }
  });

  it("keeps retired history as a server-side redirect without the old editorial page or metadata layout", () => {
    const page = source("app", "history", "page.tsx");

    expect(existsSync(join(process.cwd(), "app", "history", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "app", "history", "layout.tsx"))).toBe(false);
    expect(page).toContain('permanentRedirect("/about")');
    expect(page).not.toContain("pizza-history");
    expect(page).not.toContain("SiteFooter");
    expect(page).not.toContain("metadataForLegacyRoute");
  });

  it("removes normal product links to the retired history route", () => {
    const linkedSurfaces = [
      source("lib", "navigation.ts"),
      source("lib", "homepage.ts"),
      source("components", "HomeCalculatorWorkspace.tsx"),
      source("components", "SiteFooter.tsx"),
    ].join("\n");

    expect(linkedSurfaces).not.toContain('href="/history"');
    expect(linkedSurfaces).not.toContain('href: "/history"');
  });
});
