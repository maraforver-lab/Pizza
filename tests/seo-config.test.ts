import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SAFE_INTERNAL_SITE_URL,
  cleanCanonicalPath,
  canonicalUrl,
  getSiteUrl,
  hasConfiguredProductionSiteUrl,
  isIndexingAllowed,
  legacyNoindexRoutes,
  metadataForLegacyRoute,
  metadataForRoute,
  normalizeSiteUrl,
  privateSeoRoutes,
  publicSeoRoutes,
  seoRoutePolicy,
  robotsMetadata,
  robotsPolicy,
  sitemapEntries,
  statefulQueryParamRoutes,
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
  "/session/start",
  "/guides/dough",
  "/guide/pizza-troubleshooting",
  "/styles",
  "/ovens",
  "/sauce",
  "/toppings",
  "/calculator/quick",
  "/timer",
  "/costs",
  "/updates",
];

const legacyNoindexRoutePaths = [
  "/plan",
  "/doctor",
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
    expect(normalizeSiteUrl(" https://www.doughtools.app/ ")).toBe("https://www.doughtools.app");
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

  it("defines a central SEO route policy for public, stateful and private route groups", () => {
    expect(seoRoutePolicy.publicIndexableRoutes).toEqual(requiredPublicRoutes);
    expect(seoRoutePolicy.publicToolBaseRoutes).toEqual([
      "/",
      "/sauce",
      "/calculator/quick",
      "/toppings",
      "/timer",
      "/costs",
    ]);
    expect(seoRoutePolicy.statefulQueryParamRoutes).toEqual([
      "/",
      "/plan",
      "/doctor",
      "/sauce",
      "/calculator/quick",
      "/toppings",
      "/timer",
    ]);
    expect(seoRoutePolicy.legacyNoindexRoutes).toEqual(legacyNoindexRoutePaths);
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/account");
  });

  it("includes canonical public product, learning and supporting utility routes in the sitemap", () => {
    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).map((entry) => entry.url);

    for (const route of [
      "/session/start",
      "/guides/dough",
      "/guide/pizza-troubleshooting",
      "/calculator/quick",
    ]) {
      expect(sitemapUrls).toContain(`https://doughtools.app${route}`);
    }
  });

  it("excludes private, dynamic, downstream session and legacy routes from indexable route definitions and sitemap", () => {
    expect(privateSeoRoutes).toContain("/account");
    expect(privateSeoRoutes).toContain("/auth/callback");
    expect(publicSeoRoutes.map((route) => route.path)).not.toContain("/account");

    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).map((entry) => entry.url);
    const sitemapPaths = sitemapUrls.map((url) => new URL(url).pathname);

    for (const route of [
      "/start",
      "/plan",
      "/doctor",
      "/gear",
      "/history",
      "/coach",
      "/session/recipe",
      "/session/shopping",
      "/session/timeline",
      "/session/kitchen",
      "/session/review",
      "/account",
      "/account/party-orders",
      "/order/",
      "/api/",
    ]) {
      expect(sitemapPaths.some((path) => path === route || path.startsWith(route))).toBe(false);
    }

    expect(sitemapUrls.some((url) => url.includes("/journal"))).toBe(false);
    expect(sitemapUrls.some((url) => url.includes("/community"))).toBe(false);
    expect(sitemapUrls.some((url) => url.includes("?"))).toBe(false);
    expect(sitemapUrls.some((url) => url.includes("pizza-maraforver.vercel.app"))).toBe(false);
  });

  it("generates clean canonical URLs only from the configured safe URL helper", () => {
    expect(cleanCanonicalPath("/plan?hydration=64#recipe")).toBe("/plan");
    expect(cleanCanonicalPath("https://example.com/doctor?hydration=64")).toBe("/doctor");
    expect(cleanCanonicalPath("/session/start/")).toBe("/session/start");
    expect(canonicalUrl("/sauce?balls=6", { NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app/" })).toBe(
      "https://www.doughtools.app/sauce",
    );
    expect(canonicalUrl("https://evil.example/doctor?hydration=64", {
      NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
    })).toBe(
      "https://www.doughtools.app/doctor",
    );
    expect(canonicalUrl("/sauce", {})).toBe(`${SAFE_INTERNAL_SITE_URL}/sauce`);
    expect(metadataForRoute("/", { NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app" }).alternates).toMatchObject({
      canonical: "https://www.doughtools.app/",
    });
    expect(canonicalUrl("/start", { NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app" })).toBe(
      "https://www.doughtools.app/start",
    );
  });

  it("keeps stateful query-param tool routes shareable but out of sitemap", () => {
    expect(statefulQueryParamRoutes).toEqual(seoRoutePolicy.statefulQueryParamRoutes);

    for (const route of statefulQueryParamRoutes) {
      expect(canonicalUrl(`${route}?balls=6&hydration=64`, {
        NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
      })).toBe(`https://www.doughtools.app${route === "/" ? "/" : route}`);
    }

    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app" }).map((entry) => entry.url);
    expect(sitemapUrls.every((url) => !url.includes("?"))).toBe(true);
  });

  it("blocks all crawlers by default in robots.txt policy while still advertising the sitemap location", () => {
    expect(robotsPolicy({})).toEqual({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${SAFE_INTERNAL_SITE_URL}/sitemap.xml`,
    });
    expect(robotsPolicy({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app" })).toEqual({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: "https://www.doughtools.app/sitemap.xml",
    });
    expect(robotsPolicy({ ALLOW_INDEXING: "true", NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app" })).toMatchObject({
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: "https://www.doughtools.app/sitemap.xml",
    });
  });

  it("keeps public pages indexable only when indexing is explicitly allowed and private pages noindex", () => {
    expect(() => metadataForRoute("/start" as Parameters<typeof metadataForRoute>[0])).toThrow(
      "Missing SEO metadata for route: /start",
    );

    expect(metadataForRoute("/updates", {
      ALLOW_INDEXING: "true",
      NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
    }).robots).toMatchObject({ index: true, follow: true });

    expect(metadataForRoute("/session/start", {
      ALLOW_INDEXING: "true",
      NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
    })).toMatchObject({
      robots: { index: true, follow: true },
      alternates: { canonical: "https://www.doughtools.app/session/start" },
    });

    expect(privateSeoRoutes).toContain("/account");
  });

  it("keeps obsolete predecessor routes accessible but explicitly noindexed", () => {
    expect(legacyNoindexRoutes.map((route) => route.path)).toEqual(legacyNoindexRoutePaths);
    expect(() => metadataForLegacyRoute("/history" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /history",
    );
    expect(() => metadataForLegacyRoute("/gear" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /gear",
    );

    for (const route of legacyNoindexRoutePaths) {
      expect(() => metadataForRoute(route as Parameters<typeof metadataForRoute>[0])).toThrow(
        `Missing SEO metadata for route: ${route}`,
      );

      const metadata = metadataForLegacyRoute(route as Parameters<typeof metadataForLegacyRoute>[0], {
        NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
      });

      expect(metadata.robots).toMatchObject({ index: false, follow: false, nocache: true });
      expect(metadata.alternates).toMatchObject({
        canonical: `https://www.doughtools.app${route}`,
      });
    }
  });

  it("does not include old Vercel URL fallback or unsupported claims in active SEO copy", () => {
    const seoText = publicSeoRoutes.flatMap((route) => [route.title, route.description]).join("\n");

    expect(seoText).not.toMatch(/pizza-maraforver|vercel\.app/i);
    expect(seoText).not.toMatch(/\b(perfect pizza|guaranteed|ultimate|revolutionary|scientifically exact)\b/i);
    expect(seoText).not.toMatch(/\bplaceholder\b|to be added before public launch|lorem|TODO|FIXME/i);
    expect(seoText).not.toMatch(/\b(Laskuri|Pizzatyylit|Aikataulu|Kalkylator|Pizzastilar|Tidsplan)\b|[äöåÄÖÅ]/);
  });

  it("keeps legacy Pizza Coach metadata noindexed without unsupported AI claims", () => {
    const coach = metadataForLegacyRoute("/coach");
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
    expect(seoDoc).toContain("docs/seo-indexation.md");
    expect(seoDoc).toContain("Query-param tool URLs remain shareable");
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

  it("documents the SEO indexation policy and Search Console manual checklist", () => {
    const indexationDocPath = join(process.cwd(), "docs", "seo-indexation.md");

    expect(existsSync(indexationDocPath)).toBe(true);

    const indexationDoc = readFileSync(indexationDocPath, "utf8");

    expect(indexationDoc).toContain("https://www.doughtools.app");
    expect(indexationDoc).toContain("/session/start");
    expect(indexationDoc).toContain("- `/start`");
    expect(indexationDoc).toContain("It must exclude:");
    expect(indexationDoc).toContain("/sitemap.xml");
    expect(indexationDoc).toContain("/robots.txt");
    expect(indexationDoc).toContain("Search Console");
    expect(indexationDoc).toContain("query-param URLs from the sitemap");
    expect(indexationDoc).toContain("Route-level query-param noindex is intentionally not implemented yet");
    expect(indexationDoc).not.toMatch(/gtag|posthog|plausible|analytics tracking/i);
  });
});
