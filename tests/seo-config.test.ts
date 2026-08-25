import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SAFE_INTERNAL_SITE_URL,
  SOCIAL_IMAGE_ALT,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_PATH,
  SOCIAL_IMAGE_WIDTH,
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
  publicIndexableRoutePaths,
  publicNoindexRoutePaths,
  publicSeoRoutes,
  seoRoutePolicy,
  robotsMetadata,
  robotsPolicy,
  socialImageUrl,
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
  "/guide/practical-pizza-tips",
  "/guide/practical-pizza-tips/leftover-dough",
  "/guide/practical-pizza-tips/fermentation-length",
  "/guide/practical-pizza-tips/containers-and-lids",
  "/guide/practical-pizza-tips/common-problems",
  "/styles",
  "/ovens",
  "/sauce",
  "/toppings",
  "/calculator/quick",
  "/timer",
  "/tools/bake-timer",
  "/tools/pizza-party-planner",
  "/costs",
  "/updates",
];

const legacyNoindexRoutePaths: string[] = [];

const expectedFirstWaveIndexableRoutes = [
  "/",
  "/about",
  "/methodology",
  "/guide",
  "/guides/dough",
  "/guide/pizza-troubleshooting",
  "/guide/practical-pizza-tips",
  "/guide/practical-pizza-tips/leftover-dough",
  "/guide/practical-pizza-tips/fermentation-length",
  "/guide/practical-pizza-tips/containers-and-lids",
  "/guide/practical-pizza-tips/common-problems",
  "/styles",
  "/ovens",
  "/sauce",
  "/toppings",
  "/calculator/quick",
  "/tools/pizza-party-planner",
  "/costs",
] as const;

const expectedPublicNoindexRoutes = [
  "/contact",
  "/privacy",
  "/terms",
  "/session/start",
  "/timer",
  "/tools/bake-timer",
  "/updates",
] as const;

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

  it("allows indexing only for a safe production URL outside preview deployments", () => {
    expect(isIndexingAllowed({})).toBe(false);
    expect(isIndexingAllowed({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(true);
    expect(isIndexingAllowed({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(true);
    expect(isIndexingAllowed({ ALLOW_INDEXING: "true" })).toBe(false);
    expect(isIndexingAllowed({ ALLOW_INDEXING: "true", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(true);
    expect(isIndexingAllowed({
      ALLOW_INDEXING: "true",
      NEXT_PUBLIC_SITE_URL: "https://doughtools.app",
      VERCEL_ENV: "preview",
    })).toBe(false);
  });

  it("returns indexable robots metadata for approved production pages", () => {
    expect(robotsMetadata({})).toMatchObject({ index: false, follow: false, nocache: true });
    expect(robotsMetadata({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toMatchObject({
      index: true,
      follow: true,
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
    expect(seoRoutePolicy.publicMetadataRoutes).toEqual(requiredPublicRoutes);
    expect(seoRoutePolicy.publicIndexableRoutes).toEqual(expectedFirstWaveIndexableRoutes);
    expect(seoRoutePolicy.publicNoindexRoutes).toEqual(expectedPublicNoindexRoutes);
    expect(publicIndexableRoutePaths).toEqual(expectedFirstWaveIndexableRoutes);
    expect(publicNoindexRoutePaths).toEqual(expectedPublicNoindexRoutes);
    expect(seoRoutePolicy.publicToolBaseRoutes).toEqual([
      "/",
      "/sauce",
      "/tools/bake-timer",
      "/tools/pizza-party-planner",
      "/calculator/quick",
      "/toppings",
      "/costs",
    ]);
    expect(seoRoutePolicy.statefulQueryParamRoutes).toEqual([
      "/",
      "/sauce",
      "/calculator/quick",
      "/toppings",
    ]);
    expect(seoRoutePolicy.legacyNoindexRoutes).toEqual(legacyNoindexRoutePaths);
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/account");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/admin");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/api");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/order");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/session/recipe");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/session/shopping");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/session/timeline");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/session/kitchen");
    expect(seoRoutePolicy.privateNoindexRoutes).toContain("/session/review");
    expect(publicSeoRoutes.map((route) => route.path)).not.toContain("/account/pizza-sessions");
    expect((publicIndexableRoutePaths as readonly string[]).some((route) => route === "/account/pizza-sessions")).toBe(false);
  });

  it("uses the versioned static DoughTools pizza social image for public metadata", () => {
    const env = { NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app" };
    const imageUrl = "https://www.doughtools.app/social/doughtools-og-v1.png";
    const metadata = metadataForRoute("/", env);

    expect(SOCIAL_IMAGE_PATH).toBe("/social/doughtools-og-v1.png");
    expect(SOCIAL_IMAGE_WIDTH).toBe(1200);
    expect(SOCIAL_IMAGE_HEIGHT).toBe(630);
    expect(SOCIAL_IMAGE_ALT).toContain("DoughTools filled-corner pizza mark");
    expect(socialImageUrl(env)).toBe(imageUrl);
    expect(metadata.description).toBe("Calculate pizza dough ingredients, plan fermentation and follow one clear recipe, schedule and baking plan with DoughTools.");
    expect(metadata.openGraph).toMatchObject({
      title: "Pizza Dough Calculator & Pizza Planner | DoughTools",
      description: "Calculate pizza dough ingredients, plan fermentation and follow one clear recipe, schedule and baking plan with DoughTools.",
      type: "website",
      siteName: "DoughTools",
      url: "https://www.doughtools.app/",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: SOCIAL_IMAGE_ALT }],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Pizza Dough Calculator & Pizza Planner | DoughTools",
      description: "Calculate pizza dough ingredients, plan fermentation and follow one clear recipe, schedule and baking plan with DoughTools.",
      images: [imageUrl],
    });
    expect(JSON.stringify(metadata)).not.toContain("/opengraph-image");
  });

  it("includes only first-wave public search routes in the sitemap", () => {
    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).map((entry) => entry.url);

    for (const route of expectedFirstWaveIndexableRoutes) {
      expect(sitemapUrls).toContain(`https://doughtools.app${route}`);
    }

    for (const route of expectedPublicNoindexRoutes) {
      expect(sitemapUrls).not.toContain(`https://doughtools.app${route}`);
    }
  });

  it("excludes private, dynamic, downstream session and legacy routes from indexable route definitions and sitemap", () => {
    expect(privateSeoRoutes).toContain("/account");
    expect(privateSeoRoutes).toContain("/auth/callback");
    expect(privateSeoRoutes).toContain("/api");
    expect(privateSeoRoutes).toContain("/order");
    expect(privateSeoRoutes).toContain("/session/recipe");
    expect(privateSeoRoutes).toContain("/session/shopping");
    expect(privateSeoRoutes).toContain("/session/timeline");
    expect(privateSeoRoutes).toContain("/session/kitchen");
    expect(privateSeoRoutes).toContain("/session/review");
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
      "/account/pizza-sessions",
      "/admin",
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

  it("keeps retired plan redirect-only without legacy noindex metadata or sitemap inclusion", () => {
    const page = readFileSync(join(process.cwd(), "app", "plan", "page.tsx"), "utf8");
    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).map((entry) => entry.url);

    expect(page).toContain('permanentRedirect("/session/start")');
    expect(legacyNoindexRoutes.map((route) => route.path)).not.toContain("/plan");
    expect(seoRoutePolicy.legacyNoindexRoutes).not.toContain("/plan");
    expect(seoRoutePolicy.statefulQueryParamRoutes).not.toContain("/plan");
    expect(sitemapUrls).not.toContain("https://doughtools.app/plan");
    expect(sitemapUrls).not.toContain("https://doughtools.app/session/start");
    expect(() => metadataForLegacyRoute("/plan" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /plan",
    );
  });

  it("keeps retired coach redirect-only without legacy noindex metadata or sitemap inclusion", () => {
    const page = readFileSync(join(process.cwd(), "app", "coach", "page.tsx"), "utf8");
    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).map((entry) => entry.url);

    expect(page).toContain('permanentRedirect("/guide/pizza-troubleshooting")');
    expect(legacyNoindexRoutes.map((route) => route.path)).not.toContain("/coach");
    expect(seoRoutePolicy.legacyNoindexRoutes).not.toContain("/coach");
    expect(sitemapUrls).not.toContain("https://doughtools.app/coach");
    expect(sitemapUrls).toContain("https://doughtools.app/guide/pizza-troubleshooting");
    expect(() => metadataForLegacyRoute("/coach" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /coach",
    );
  });

  it("allows production crawling without a global Disallow while preserving private disallows", () => {
    expect(robotsPolicy({})).toEqual({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: `${SAFE_INTERNAL_SITE_URL}/sitemap.xml`,
    });
    expect(robotsPolicy({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app" })).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: privateSeoRoutes.flatMap((route) => [route, `${route}${route.endsWith("/") ? "" : "/"}`]),
      },
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

  it("keeps private workflow, token and API routes covered by explicit noindex response headers", () => {
    const nextConfig = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");

    expect(nextConfig).toContain("publicNoindexRoutePaths");
    expect(nextConfig).toContain("privateSeoRoutes");
    expect(nextConfig).toContain("publicNoIndexHeader");
    expect(nextConfig).toContain("privateNoIndexHeader");

    expect(nextConfig).toContain("privateNoIndexHeaderSources = privateSeoRoutes.map");

    expect(nextConfig).toContain("noindex, noarchive");
    expect(nextConfig).toContain("noindex, nofollow, noarchive");
  });

  it("adds minimal site and organization structured data without recipe or fake calculator schema", () => {
    const layout = readFileSync(join(process.cwd(), "app", "layout.tsx"), "utf8");
    const structuredData = readFileSync(join(process.cwd(), "components", "SeoStructuredData.tsx"), "utf8");

    expect(layout).toContain("SeoStructuredData");
    expect(structuredData).toContain('"@type": "WebSite"');
    expect(structuredData).toContain('"@type": "Organization"');
    expect(structuredData).toContain("hasConfiguredProductionSiteUrl");
    expect(structuredData).not.toContain('"@type": "Recipe"');
    expect(structuredData).not.toContain('"@type": "SoftwareApplication"');
    expect(structuredData).not.toContain('"@type": "WebApplication"');
  });

  it("adds route-level noindex metadata for downstream session and public token workflows", () => {
    for (const layoutPath of [
      ["app", "order", "[publicToken]", "layout.tsx"],
      ["app", "session", "recipe", "layout.tsx"],
      ["app", "session", "shopping", "layout.tsx"],
      ["app", "session", "timeline", "layout.tsx"],
      ["app", "session", "kitchen", "layout.tsx"],
      ["app", "session", "review", "layout.tsx"],
    ]) {
      const layout = readFileSync(join(process.cwd(), ...layoutPath), "utf8");

      expect(layout).toContain("noindexMetadata");
      expect(layout).toContain("return children");
    }
  });

  it("keeps first-wave public pages indexable in production while public noindex routes stay protected", () => {
    expect(() => metadataForRoute("/start" as Parameters<typeof metadataForRoute>[0])).toThrow(
      "Missing SEO metadata for route: /start",
    );

    expect(metadataForRoute("/calculator/quick", {
      ALLOW_INDEXING: "false",
      NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
    }).robots).toMatchObject({ index: true, follow: true });

    for (const route of expectedPublicNoindexRoutes) {
      expect(metadataForRoute(route as Parameters<typeof metadataForRoute>[0], {
        ALLOW_INDEXING: "false",
        NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
      }).robots).toMatchObject({ index: false, follow: true, nocache: true });
    }

    expect(privateSeoRoutes).toContain("/account");
    expect(privateSeoRoutes).toContain("/admin");
    expect(privateSeoRoutes).toContain("/order");
    expect(privateSeoRoutes).toContain("/session/recipe");
  });

  it("keeps obsolete predecessor routes accessible but explicitly noindexed", () => {
    expect(legacyNoindexRoutes.map((route) => route.path)).toEqual(legacyNoindexRoutePaths);
    expect(() => metadataForLegacyRoute("/history" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /history",
    );
    expect(() => metadataForLegacyRoute("/gear" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /gear",
    );
    expect(() => metadataForLegacyRoute("/doctor" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /doctor",
    );
    expect(() => metadataForLegacyRoute("/plan" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /plan",
    );
    expect(() => metadataForLegacyRoute("/coach" as Parameters<typeof metadataForLegacyRoute>[0])).toThrow(
      "Missing legacy SEO metadata for route: /coach",
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

  it("documents safe production-domain verification after the controlled indexing launch", () => {
    const productionDocPath = join(process.cwd(), "docs", "production-domain-verification.md");
    const envExamplePath = join(process.cwd(), ".env.example");
    const seoDoc = readFileSync(join(process.cwd(), "docs", "seo-launch-config.md"), "utf8");

    expect(existsSync(productionDocPath)).toBe(true);
    expect(existsSync(envExamplePath)).toBe(true);

    const productionDoc = readFileSync(productionDocPath, "utf8");
    const envExample = readFileSync(envExamplePath, "utf8");
    const combined = `${productionDoc}\n${envExample}\n${seoDoc}`;

    expect(combined).toContain("https://www.doughtools.app");
    expect(combined).toContain("NEXT_PUBLIC_SITE_URL=https://www.doughtools.app");
    expect(combined).toContain("first-wave indexable routes");
    expect(combined).toMatch(/public noindex|KEEP NOINDEX|noindex/i);
    expect(productionDoc).toContain("Do not submit the sitemap to Google from this checklist.");
    expect(seoDoc).toContain("docs/production-domain-verification.md");
    expect(seoDoc).toContain("docs/seo-indexation.md");
    expect(seoDoc).toContain("Stateful recipe and tool URLs canonicalize to their clean base route");
  });

  it("documents a manual controlled-indexing verification without Search Console submission", () => {
    const rehearsalDocPath = join(process.cwd(), "docs", "manual-launch-rehearsal.md");
    const productionDoc = readFileSync(join(process.cwd(), "docs", "production-domain-verification.md"), "utf8");
    const seoDoc = readFileSync(join(process.cwd(), "docs", "seo-launch-config.md"), "utf8");

    expect(existsSync(rehearsalDocPath)).toBe(true);

    const rehearsalDoc = readFileSync(rehearsalDocPath, "utf8");

    expect(rehearsalDoc).toContain("https://www.doughtools.app");
    expect(rehearsalDoc).toContain("NEXT_PUBLIC_SITE_URL=https://www.doughtools.app");
    expect(rehearsalDoc).toContain("noindex");
    expect(rehearsalDoc).toContain("robots.txt");
    expect(rehearsalDoc).toContain("sitemap.xml");
    expect(rehearsalDoc).toContain("X-Robots-Tag");
    expect(rehearsalDoc).toContain("`/account` is not in sitemap");
    expect(rehearsalDoc).toContain("Do not submit sitemap to Google yet");
    expect(rehearsalDoc).toContain("first-wave indexable routes");
    expect(rehearsalDoc).toContain("public noindex routes");
    expect(rehearsalDoc).toMatch(/rollback/i);
    expect(rehearsalDoc).toContain("This checklist does not deploy the site.");
    expect(rehearsalDoc).toContain("Do not execute deployment from this documentation checklist.");
    expect(rehearsalDoc).toContain("Search Console submission remains a separate owner action.");
    expect(productionDoc).toContain("docs/manual-launch-rehearsal.md");
    expect(seoDoc).toContain("docs/manual-launch-rehearsal.md");
  });

  it("documents the SEO indexation policy and Search Console manual checklist", () => {
    const indexationDocPath = join(process.cwd(), "docs", "seo-indexation.md");

    expect(existsSync(indexationDocPath)).toBe(true);

    const indexationDoc = readFileSync(indexationDocPath, "utf8");

    expect(indexationDoc).toContain("https://www.doughtools.app");
    expect(indexationDoc).toContain("/session/start");
    expect(indexationDoc).toContain("/guide/practical-pizza-tips/leftover-dough");
    expect(indexationDoc).toContain("/tools/bake-timer");
    expect(indexationDoc).toContain("/session/recipe");
    expect(indexationDoc).toContain("/order");
    expect(indexationDoc).toContain("/api");
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
