import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { latestPublicUpdate, patchHistory } from "@/lib/changelog";
import { isIndexingAllowed, robotsPolicy, sitemapEntries } from "@/lib/seo-config";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const coreRouteFiles = [
  "app/page.tsx",
  "app/start/page.tsx",
  "app/plan/page.tsx",
  "app/doctor/page.tsx",
  "app/guide/page.tsx",
  "app/updates/page.tsx",
  "app/account/page.tsx",
  "app/robots.ts",
  "app/sitemap.ts",
] as const;

describe("performance and rendering baseline", () => {
  it("documents the Patch 25 performance baseline without claiming field data", () => {
    const docPath = join(process.cwd(), "docs", "performance-baseline.md");

    expect(existsSync(docPath)).toBe(true);

    const doc = source("docs/performance-baseline.md");

    expect(doc).toContain("Patch 25");
    expect(doc).toContain("Core Web Vitals");
    expect(doc).toContain("Real Core Web Vitals field data is not available");
    expect(doc).toContain("Google indexing remains disabled");
    expect(doc).toContain("analytics or tracking");
    expect(doc).toContain("Initial route budget proposal");
    expect(doc).toContain("Optimization backlog");
    expect(doc).toContain("Patch 26 calculator progressive disclosure");
  });

  it("records the core route scope and production-mode smoke-test targets", () => {
    const doc = source("docs/performance-baseline.md");

    for (const route of ["/", "/start", "/plan", "/doctor", "/guide", "/updates", "/account", "/robots.txt", "/sitemap.xml"]) {
      expect(doc).toContain(route);
    }

    expect(doc).toContain("HTTP 200");
    expect(doc).toContain("local production mode");
    expect(doc).not.toMatch(/production field data is available|Lighthouse score/i);
  });

  it("keeps Patch 25 in the public update history with safe user-facing copy", () => {
    const patch25 = patchHistory.find((entry) => entry.patch === 25);

    expect(latestPublicUpdate?.patchNumbers).toContain(26);
    expect(patch25).toBeDefined();
    expect(patch25?.summary).toContain("performance baseline");
    expect(patch25?.highlights.join(" ")).toContain("Google indexing remains disabled");
    expect(patch25?.details.join(" ")).toContain("production mode");
    expect(patch25?.technicalNote).toContain("SEO indexing permissions");
  });

  it("preserves pre-launch indexing protection and sitemap behavior", () => {
    expect(isIndexingAllowed({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(false);
    expect(robotsPolicy({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toMatchObject({
      rules: { userAgent: "*", disallow: "/" },
    });

    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).map((entry) => entry.url);

    expect(sitemapUrls.some((url) => url.includes("/account"))).toBe(false);
    expect(sitemapUrls.every((url) => !url.includes("?"))).toBe(true);
  });

  it("keeps required route files present and avoids adding route changes for the baseline", () => {
    for (const file of coreRouteFiles) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }

    expect(source("app/robots.ts")).toContain("robotsPolicy");
    expect(source("app/sitemap.ts")).toContain("sitemapEntries");
  });

  it("checks package scripts without requiring heavy performance dependencies", () => {
    const packageJson = JSON.parse(source("package.json")) as {
      scripts: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ].join("\n");

    expect(packageJson.scripts.test).toBe("vitest run");
    expect(packageJson.scripts.lint).toBe("eslint .");
    expect(packageJson.scripts.build).toBe("next build");
    expect(packageJson.scripts).not.toHaveProperty("lighthouse");
    expect(packageJson.scripts).not.toHaveProperty("analyze");
    expect(dependencyNames).not.toMatch(/lighthouse|webpack-bundle-analyzer|@next\/bundle-analyzer/i);
  });

  it("does not introduce analytics, tracking or Search Console instructions in the baseline", () => {
    const doc = source("docs/performance-baseline.md");

    expect(doc).not.toMatch(/gtag|posthog|plausible/i);
    expect(doc).toContain("No analytics, tracking, Search Console verification, or sitemap submission was added");
    expect(doc).toContain("add Google Analytics");
  });
});
