import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SAFE_INTERNAL_SITE_URL,
  canonicalUrl,
  getSiteUrl,
  hasConfiguredProductionSiteUrl,
  isIndexingAllowed,
  metadataForRoute,
  normalizeSiteUrl,
  privateSeoRoutes,
  publicSeoRoutes,
  robotsMetadata,
  robotsPolicy,
  sitemapEntries,
} from "@/lib/seo-config";
import {
  projectContactEmail,
  projectJurisdiction,
  projectOwner,
  trustPages,
  type TrustPageId,
} from "@/lib/trust-pages";

const requiredPublicRoutes = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/methodology",
  "/guide",
  "/styles",
  "/doctor",
  "/ovens",
  "/gear",
  "/sauce",
  "/toppings",
  "/timer",
  "/plan",
  "/costs",
  "/history",
  "/community",
  "/coach",
];

const trustPageText = (id: TrustPageId) => [
  trustPages[id].title,
  trustPages[id].intro,
  ...trustPages[id].sections.flatMap((section) => [
    section.heading,
    ...(section.paragraphs ?? []),
    ...(section.bullets ?? []),
  ]),
].join("\n");

describe("SEO launch configuration", () => {
  it("normalizes safe production URLs and removes trailing slashes", () => {
    expect(normalizeSiteUrl(" https://doughtools.app/ ")).toBe("https://doughtools.app");
    expect(normalizeSiteUrl("https://doughtools.app/path/")).toBe("https://doughtools.app/path");
  });

  it("uses an internal safe fallback when NEXT_PUBLIC_SITE_URL is missing or unsafe", () => {
    expect(getSiteUrl({})).toBe(SAFE_INTERNAL_SITE_URL);
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" })).toBe(SAFE_INTERNAL_SITE_URL);
    expect(getSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://pizza-maraforver.vercel.app" })).toBe(SAFE_INTERNAL_SITE_URL);
    expect(hasConfiguredProductionSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://pizza-maraforver.vercel.app" })).toBe(false);
  });

  it("keeps indexing disabled by default and only enables it with an explicit safe production URL", () => {
    expect(isIndexingAllowed({})).toBe(false);
    expect(isIndexingAllowed({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(false);
    expect(isIndexingAllowed({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(false);
    expect(isIndexingAllowed({ ALLOW_INDEXING: "true" })).toBe(false);
    expect(isIndexingAllowed({ ALLOW_INDEXING: "true", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(true);
    expect(isIndexingAllowed({
      ALLOW_INDEXING: "true",
      NEXT_PUBLIC_SITE_URL: "https://doughtools.app",
      VERCEL_ENV: "preview",
    })).toBe(false);
  });

  it("returns noindex robots metadata until indexing is explicitly enabled", () => {
    expect(robotsMetadata({})).toMatchObject({ index: false, follow: false, nocache: true });
    expect(robotsMetadata({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
    });
    expect(robotsMetadata({ ALLOW_INDEXING: "true", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toMatchObject({
      index: true,
      follow: true,
    });
  });

  it("defines metadata for all required public routes", () => {
    const paths = publicSeoRoutes.map((route) => route.path);

    expect(paths).toEqual(requiredPublicRoutes);

    for (const path of requiredPublicRoutes) {
      const metadata = metadataForRoute(path as Parameters<typeof metadataForRoute>[0]);
      expect(metadata.title).toBeTruthy();
      expect(metadata.description).toBeTruthy();
    }
  });

  it("excludes private account and auth routes from indexable route definitions and sitemap", () => {
    expect(privateSeoRoutes).toContain("/account");
    expect(privateSeoRoutes).toContain("/auth/callback");
    expect(publicSeoRoutes.map((route) => route.path)).not.toContain("/account");

    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).map((entry) => entry.url);

    expect(sitemapUrls.some((url) => url.includes("/account"))).toBe(false);
    expect(sitemapUrls.some((url) => url.includes("?"))).toBe(false);
    expect(sitemapUrls.some((url) => url.includes("pizza-maraforver.vercel.app"))).toBe(false);
  });

  it("generates canonical URLs only from the configured safe URL helper", () => {
    expect(canonicalUrl("/sauce?balls=6", { NEXT_PUBLIC_SITE_URL: "https://doughtools.app/" })).toBe(
      "https://doughtools.app/sauce",
    );
    expect(canonicalUrl("/sauce", {})).toBe(`${SAFE_INTERNAL_SITE_URL}/sauce`);
    expect(metadataForRoute("/", { NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).alternates).toMatchObject({
      canonical: "https://doughtools.app/",
    });
  });

  it("blocks all crawlers by default in robots.txt policy and exposes a sitemap only when indexing is allowed", () => {
    expect(robotsPolicy({})).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(robotsPolicy({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
    expect(robotsPolicy({ ALLOW_INDEXING: "true", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toMatchObject({
      sitemap: "https://doughtools.app/sitemap.xml",
    });
  });

  it("does not include old Vercel URL fallback or unsupported claims in active SEO copy", () => {
    const seoText = publicSeoRoutes.flatMap((route) => [route.title, route.description]).join("\n");

    expect(seoText).not.toMatch(/pizza-maraforver|vercel\.app/i);
    expect(seoText).not.toMatch(/\b(perfect pizza|guaranteed|ultimate|revolutionary|scientifically exact)\b/i);
    expect(seoText).not.toMatch(/\bplaceholder\b|to be added before public launch|lorem|TODO|FIXME/i);
    expect(seoText).not.toMatch(/\b(Laskuri|Pizzatyylit|Aikataulu|Kalkylator|Pizzastilar|Tidsplan)\b|[äöåÄÖÅ]/);
  });

  it("keeps Pizza Coach metadata practical without unsupported AI claims", () => {
    const coach = metadataForRoute("/coach");
    const coachText = `${coach.title} ${coach.description}`;

    expect(coachText).toContain("Pizza Coach");
    expect(coachText).not.toMatch(/\bAI\b|artificial intelligence|guaranteed|perfect/i);
  });

  it("keeps real trust details visible for launch readiness", () => {
    const trustText = (["about", "contact", "privacy", "terms", "methodology"] as const)
      .map(trustPageText)
      .join("\n");

    expect(trustText).not.toContain("[Contact email to be added before public launch]");
    expect(trustText).not.toContain("[Owner/legal entity to be added before public launch]");
    expect(trustText).not.toContain("[Applicable jurisdiction to be confirmed before public launch]");
    expect(trustText).toContain(projectContactEmail);
    expect(trustText).toContain(projectOwner);
    expect(trustText).toContain(projectJurisdiction);
  });

  it("documents safe production-domain verification without enabling indexing", () => {
    const productionDocPath = join(process.cwd(), "docs", "production-domain-verification.md");
    const envExamplePath = join(process.cwd(), ".env.example");
    const seoDoc = readFileSync(join(process.cwd(), "docs", "seo-launch-config.md"), "utf8");

    expect(existsSync(productionDocPath)).toBe(true);
    expect(existsSync(envExamplePath)).toBe(true);

    const productionDoc = readFileSync(productionDocPath, "utf8");
    const envExample = readFileSync(envExamplePath, "utf8");
    const combined = `${productionDoc}\n${envExample}\n${seoDoc}`;

    expect(combined).toContain("https://doughtools.app");
    expect(combined).toContain("NEXT_PUBLIC_SITE_URL=https://doughtools.app");
    expect(combined).toContain("ALLOW_INDEXING=false");
    expect(combined).toMatch(/no indexing yet|noindexed|noindex/i);
    expect(productionDoc).toContain("Do not set `ALLOW_INDEXING=true`");
    expect(seoDoc).toContain("docs/production-domain-verification.md");
  });

  it("documents a manual launch rehearsal without instructing this patch to deploy or enable indexing", () => {
    const rehearsalDocPath = join(process.cwd(), "docs", "manual-launch-rehearsal.md");
    const productionDoc = readFileSync(join(process.cwd(), "docs", "production-domain-verification.md"), "utf8");
    const seoDoc = readFileSync(join(process.cwd(), "docs", "seo-launch-config.md"), "utf8");

    expect(existsSync(rehearsalDocPath)).toBe(true);

    const rehearsalDoc = readFileSync(rehearsalDocPath, "utf8");

    expect(rehearsalDoc).toContain("https://doughtools.app");
    expect(rehearsalDoc).toContain("NEXT_PUBLIC_SITE_URL=https://doughtools.app");
    expect(rehearsalDoc).toContain("ALLOW_INDEXING=false");
    expect(rehearsalDoc).toContain("noindex");
    expect(rehearsalDoc).toContain("robots.txt");
    expect(rehearsalDoc).toContain("sitemap.xml");
    expect(rehearsalDoc).toContain("X-Robots-Tag");
    expect(rehearsalDoc).toContain("`/account` is not in sitemap");
    expect(rehearsalDoc).toContain("Do not submit sitemap to Google yet");
    expect(rehearsalDoc).toContain("Do not yet:");
    expect(rehearsalDoc).toContain("set `ALLOW_INDEXING=true`");
    expect(rehearsalDoc).toMatch(/rollback/i);
    expect(rehearsalDoc).toContain("This checklist does not deploy the site.");
    expect(rehearsalDoc).toContain("Do not execute either approach as part of this documentation patch.");
    expect(rehearsalDoc).toContain("Opening indexing must be a separate patch and process. Do not enable indexing now.");
    expect(productionDoc).toContain("docs/manual-launch-rehearsal.md");
    expect(seoDoc).toContain("docs/manual-launch-rehearsal.md");
  });
});
