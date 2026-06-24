import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contentSecurityPolicy, securityHeaders } from "@/lib/security-headers";
import { isIndexingAllowed, robotsPolicy, sitemapEntries } from "@/lib/seo-config";
import { patchHistory } from "@/lib/changelog";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const headerValue = (key: string) => securityHeaders.find((header) => header.key === key)?.value;

const expectedRouteFiles = [
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

describe("security and launch-safety baseline", () => {
  it("defines the conservative security response header baseline", () => {
    expect(headerValue("X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerValue("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=(), payment=()");
    expect(headerValue("X-Frame-Options")).toBe("DENY");
    expect(headerValue("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
    expect(headerValue("Content-Security-Policy")).toBe(contentSecurityPolicy);
  });

  it("keeps CSP compatible and documents deferred stricter policies", () => {
    expect(contentSecurityPolicy).toContain("default-src 'self'");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("img-src 'self' data: blob: https:");
    expect(contentSecurityPolicy).toContain("connect-src 'self' https: wss:");
    expect(contentSecurityPolicy).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(contentSecurityPolicy).not.toMatch(/report-uri|report-to/i);
  });

  it("configures headers through next.config without replacing indexing protection", () => {
    const nextConfig = source("next.config.ts");

    expect(nextConfig).toContain("securityHeaders");
    expect(nextConfig).toContain("X-Robots-Tag");
    expect(nextConfig).toContain("noindex, nofollow, noarchive");
    expect(nextConfig).toContain("ALLOW_INDEXING");
    expect(nextConfig).toContain("VERCEL_ENV !== \"preview\"");
  });

  it("preserves pre-launch indexing and sitemap behavior", () => {
    expect(isIndexingAllowed({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(false);
    expect(robotsPolicy({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toMatchObject({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: "https://doughtools.app/sitemap.xml",
    });

    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).map((entry) => entry.url);

    expect(sitemapUrls.some((url) => url.includes("/account"))).toBe(false);
    expect(sitemapUrls.every((url) => !url.includes("?"))).toBe(true);
  });

  it("documents the security baseline and production verification checklist", () => {
    const docPath = join(process.cwd(), "docs", "security-launch-baseline.md");

    expect(existsSync(docPath)).toBe(true);

    const doc = source("docs/security-launch-baseline.md");

    expect(doc).toContain("Patch 27");
    expect(doc).toContain("Headers added");
    expect(doc).toContain("CSP decision");
    expect(doc).toContain("HSTS decision");
    expect(doc).toContain("Production verification checklist");
    expect(doc).toContain("ALLOW_INDEXING=false");
    expect(doc).toContain("no Google indexing is enabled");
    expect(doc).toContain("no CSP console violations");
    expect(doc).toContain("Future hardening backlog");
    expect(doc).toContain("Local `next start` validation is useful");
  });

  it("keeps route files present and does not add route-level security rewrites", () => {
    for (const file of expectedRouteFiles) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }

    expect(source("app/robots.ts")).toContain("robotsPolicy");
    expect(source("app/sitemap.ts")).toContain("sitemapEntries");
  });

  it("adds Patch 27 to public update history with safe user-facing copy", () => {
    const patch27 = patchHistory.find((entry) => entry.patch === 27);

    expect(patch27).toBeDefined();
    expect(patch27?.title).toBe("Security headers and launch safety baseline");
    expect(patch27?.summary).toContain("security and launch-safety baseline");
    expect(patch27?.highlights.join(" ")).toContain("No analytics, tracking or payment behavior added");
    expect(patch27?.details.join(" ")).toContain("Google indexing remains disabled");
    expect(patch27?.technicalNote).toContain("did not change dough formulas");
  });

  it("does not introduce analytics, tracking, Search Console verification or sitemap submission behavior", () => {
    const inspected = [
      source("next.config.ts"),
      source("lib/security-headers.ts"),
      source("docs/security-launch-baseline.md"),
    ].join("\n");

    expect(inspected).not.toMatch(/gtag|posthog|plausible|trackEvent|Google Analytics/i);
    expect(inspected).not.toMatch(/verification token|google-site-verification/i);
    expect(inspected).not.toMatch(/submit (the )?sitemap to Google now|request indexing/i);
  });
});

