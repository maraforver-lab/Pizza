import { describe, expect, it } from "vitest";
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
import { trustPages, type TrustPageId } from "@/lib/trust-pages";

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
  });

  it("blocks all crawlers by default in robots.txt policy and exposes a sitemap only when indexing is allowed", () => {
    expect(robotsPolicy({})).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(robotsPolicy({ ALLOW_INDEXING: "true", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toMatchObject({
      sitemap: "https://doughtools.app/sitemap.xml",
    });
  });

  it("does not include old Vercel URL fallback or unsupported claims in active SEO copy", () => {
    const seoText = publicSeoRoutes.flatMap((route) => [route.title, route.description]).join("\n");

    expect(seoText).not.toMatch(/pizza-maraforver|vercel\.app/i);
    expect(seoText).not.toMatch(/\b(perfect pizza|guaranteed|ultimate|revolutionary|scientifically exact)\b/i);
    expect(seoText).not.toMatch(/\b(Laskuri|Pizzatyylit|Aikataulu|Kalkylator|Pizzastilar|Tidsplan)\b|[äöåÄÖÅ]/);
  });

  it("keeps Pizza Coach metadata practical without unsupported AI claims", () => {
    const coach = metadataForRoute("/coach");
    const coachText = `${coach.title} ${coach.description}`;

    expect(coachText).toContain("Pizza Coach");
    expect(coachText).not.toMatch(/\bAI\b|artificial intelligence|guaranteed|perfect/i);
  });

  it("keeps trust placeholders visible before launch", () => {
    const trustText = (["about", "contact", "privacy", "terms", "methodology"] as const)
      .map(trustPageText)
      .join("\n");

    expect(trustText).toContain("[Contact email to be added before public launch]");
    expect(trustText).toContain("[Owner/legal entity to be added before public launch]");
    expect(trustText).toContain("[Applicable jurisdiction to be confirmed before public launch]");
  });
});
