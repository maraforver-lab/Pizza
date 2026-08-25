import type { Metadata, MetadataRoute } from "next";

export const SAFE_INTERNAL_SITE_URL = "https://doughtools.invalid";

type EnvLike = Record<string, string | undefined>;

export type SeoRoute = {
  path: string;
  title: string;
  description: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

export type SeoRoutePolicy = {
  publicMetadataRoutes: readonly string[];
  publicIndexableRoutes: readonly string[];
  publicNoindexRoutes: readonly string[];
  publicToolBaseRoutes: readonly string[];
  statefulQueryParamRoutes: readonly string[];
  legacyNoindexRoutes: readonly string[];
  privateNoindexRoutes: readonly string[];
};

const unsupportedMarketingClaims = /\b(perfect pizza|guaranteed|ultimate|revolutionary|scientifically exact)\b/i;

export const SOCIAL_IMAGE_PATH = "/social/doughtools-og-v1.png";
export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;
export const SOCIAL_IMAGE_ALT = "DoughTools pizza planning preview with the DoughTools filled-corner pizza mark";

export const publicSeoRoutes = [
  {
    path: "/",
    title: "Pizza Dough Calculator & Pizza Planner | DoughTools",
    description:
      "Calculate pizza dough ingredients, plan fermentation and follow one clear recipe, schedule and baking plan with DoughTools.",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/about",
    title: "About DoughTools | DoughTools",
    description: "Read why Marcin Arcisz created DoughTools from real pizza nights, dough planning questions and the need to make hosting pizza easier.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/contact",
    title: "Contact | DoughTools",
    description: "Contact DoughTools for support questions, privacy requests, business inquiries and calculation feedback.",
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    path: "/privacy",
    title: "Privacy Notice | DoughTools",
    description:
      "How DoughTools uses local storage, optional accounts, cloud session data, Party Orders, pizza photos and service providers.",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    path: "/terms",
    title: "Terms of Use | DoughTools",
    description:
      "Clear DoughTools terms for accounts, pizza plans, Party Orders, photos, calculations, responsibilities and consumer rights.",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    path: "/methodology",
    title: "Pizza Dough Calculation Methodology | DoughTools",
    description: "How DoughTools calculates pizza dough, hydration, salt, yeast and fermentation using baker’s percentages and documented assumptions.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/guide",
    title: "Pizza Guide and Glossary | DoughTools",
    description: "Understand pizza dough terms, flour strength, hydration, fermentation and practical baking choices.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/session/start",
    title: "Plan a Pizza | DoughTools",
    description: "Create a guided pizza plan with Dough Plan, Shopping list, Timeline, Kitchen and Review steps.",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/guides/dough",
    title: "Pizza Dough Guide | DoughTools",
    description: "Learn how to make pizza dough step by step, from the first mix to a dough ball that is ready to stretch.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/guide/pizza-troubleshooting",
    title: "Pizza Troubleshooting Guide: Dough, Stretching, Baking and Toppings | DoughTools",
    description:
      "Diagnose common pizza problems by symptom, find immediate fixes, understand likely causes, and learn what to change on your next bake.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/guide/practical-pizza-tips",
    title: "Practical Pizza Tips | DoughTools",
    description:
      "Find practical pizza tips for leftover dough, freezing and thawing, fermentation timing, containers, lids and common pizza-making problems.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/guide/practical-pizza-tips/leftover-dough",
    title: "Leftover Pizza Dough Storage Guide | DoughTools",
    description:
      "Learn how to refrigerate, freeze, thaw and safely use leftover pizza dough when your pizza plan changes.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/guide/practical-pizza-tips/fermentation-length",
    title: "Pizza Dough Fermentation Time Guide: 12, 24, 48 and 72 Hours | DoughTools",
    description:
      "Compare room and cold pizza dough fermentation plans for 12, 24, 48 and 72 hours, and learn how time, temperature, yeast and flour affect readiness.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/guide/practical-pizza-tips/containers-and-lids",
    title: "Pizza Dough Container and Lid Guide | DoughTools",
    description:
      "Learn how to choose and use covered dough containers, leave headspace and prevent dough from drying or sticking.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/guide/practical-pizza-tips/common-problems",
    title: "Common Pizza Dough, Sauce and Baking Problems | DoughTools",
    description:
      "Find quick practical fixes for sticky dough, tight dough, watery sauce, pale tops, burnt bases and wet toppings.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/styles",
    title: "Pizza Style Guide: Choose Neapolitan, New York, Detroit and More | DoughTools",
    description: "Compare pizza styles by crust, texture, dough, oven, sauce and baking method, then choose the style that fits your oven and goal.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/ovens",
    title: "Pizza Oven and Home Oven Baking Guide | DoughTools",
    description: "Get better pizza from a home oven or pizza oven with practical setup, heat, preheating, bake-time and topping-moisture guidance.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/sauce",
    title: "Pizza Sauce Recipe and Amount Calculator | DoughTools",
    description:
      "Calculate pizza sauce amount per pizza and make a simple sauce for raw, Marinara or home-oven cooked pizza styles.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/toppings",
    title: "Pizza Toppings Guide: Balance Cheese, Sauce and Moisture | DoughTools",
    description:
      "Choose pizza toppings that bake well by balancing sauce, cheese, topping weight, pizza size and mozzarella moisture.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/calculator/quick",
    title: "Pizza Dough Calculator - Flour, Water, Salt & Yeast | DoughTools",
    description:
      "Calculate exact flour, water, salt and yeast for pizza dough based on pizza count, dough ball weight, hydration and fermentation time.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/timer",
    title: "Pizza Bake Timer | DoughTools",
    description: "Use a simple pizza baking timer designed for fast bakes and clear over-time feedback.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/tools/bake-timer",
    title: "Bake Timer | DoughTools",
    description: "Use a standalone pizza bake timer for pizza ovens or home ovens without starting a pizza plan.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/costs",
    title: "Pizza Cost Calculator: Homemade vs Restaurant Pizza | DoughTools",
    description: "Compare the estimated cost of making pizza at home with buying the same number of pizzas from a restaurant, including cost per pizza and total difference.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/updates",
    title: "Updates | DoughTools",
    description: "The future home for clear DoughTools release notes, product changes and practical update context.",
    changeFrequency: "weekly",
    priority: 0.5,
  },
] as const satisfies readonly SeoRoute[];

export const privateSeoRoutes = [
  "/account",
  "/admin",
  "/admin/appearance",
  "/admin/homepage-preview",
  "/admin/quick-calculator-preview",
  "/auth",
  "/auth/callback",
  "/api",
  "/login",
  "/order",
  "/signup",
  "/preview",
  "/debug",
  "/session/recipe",
  "/session/shopping",
  "/session/timeline",
  "/session/kitchen",
  "/session/review",
] as const;

export const legacyNoindexRoutes: readonly SeoRoute[] = [];

export const publicIndexableRoutePaths = [
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
  "/costs",
] as const;

export const publicNoindexRoutePaths = [
  "/contact",
  "/privacy",
  "/terms",
  "/session/start",
  "/timer",
  "/tools/bake-timer",
  "/updates",
] as const;

export const publicToolBaseRoutes = [
  "/",
  "/sauce",
  "/tools/bake-timer",
  "/calculator/quick",
  "/toppings",
  "/costs",
] as const;

export const statefulQueryParamRoutes = [
  "/",
  "/sauce",
  "/calculator/quick",
  "/toppings",
] as const;

export const seoRoutePolicy: SeoRoutePolicy = {
  publicMetadataRoutes: publicSeoRoutes.map((route) => route.path),
  publicIndexableRoutes: publicIndexableRoutePaths,
  publicNoindexRoutes: publicNoindexRoutePaths,
  publicToolBaseRoutes,
  statefulQueryParamRoutes,
  legacyNoindexRoutes: legacyNoindexRoutes.map((route) => route.path),
  privateNoindexRoutes: privateSeoRoutes,
};

export const routeMetadataByPath = Object.fromEntries(
  publicSeoRoutes.map((route) => [route.path, route]),
) as Record<(typeof publicSeoRoutes)[number]["path"], SeoRoute>;

export const legacyRouteMetadataByPath = Object.fromEntries(
  legacyNoindexRoutes.map((route) => [route.path, route]),
) as Record<(typeof legacyNoindexRoutes)[number]["path"], SeoRoute>;

export function normalizeSiteUrl(value?: string | null): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();

    if (!["http:", "https:"].includes(url.protocol)) {
      return undefined;
    }

    if (
      hostname === "localhost"
      || hostname === "127.0.0.1"
      || hostname === "0.0.0.0"
      || hostname.endsWith(".local")
      || hostname.endsWith(".vercel.app")
    ) {
      return undefined;
    }

    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");

    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

export function hasConfiguredProductionSiteUrl(env: EnvLike = process.env): boolean {
  return Boolean(normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL));
}

export function getSiteUrl(env: EnvLike = process.env): string {
  return normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL) ?? SAFE_INTERNAL_SITE_URL;
}

export function isIndexingAllowed(env: EnvLike = process.env): boolean {
  return (
    hasConfiguredProductionSiteUrl(env)
    && env.VERCEL_ENV !== "preview"
  );
}

export function robotsMetadata(env: EnvLike = process.env): Metadata["robots"] {
  if (isIndexingAllowed(env)) {
    return {
      index: true,
      follow: true,
    };
  }

  return {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  };
}

function publicNoindexRobots(): Metadata["robots"] {
  return {
    index: false,
    follow: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: true,
      noimageindex: false,
    },
  };
}

function isPublicNoindexRoute(path: string): boolean {
  return (publicNoindexRoutePaths as readonly string[]).includes(cleanCanonicalPath(path));
}

export function cleanCanonicalPath(path: string): string {
  try {
    const url = new URL(path, "https://doughtools.invalid");
    const cleanPath = url.pathname.replace(/\/{2,}/g, "/");
    return cleanPath === "/" ? "/" : cleanPath.replace(/\/+$/, "");
  } catch {
    const fallback = path.startsWith("/") ? path : `/${path}`;
    const cleanPath = fallback.split(/[?#]/, 1)[0]?.replace(/\/{2,}/g, "/") || "/";
    return cleanPath === "/" ? "/" : cleanPath.replace(/\/+$/, "");
  }
}

export function canonicalUrl(path: string, env: EnvLike = process.env): string {
  const url = new URL(cleanCanonicalPath(path), `${getSiteUrl(env)}/`);
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function socialImageUrl(env: EnvLike = process.env): string {
  if (!hasConfiguredProductionSiteUrl(env)) {
    return SOCIAL_IMAGE_PATH;
  }

  return new URL(SOCIAL_IMAGE_PATH, `${getSiteUrl(env)}/`).toString();
}

export function metadataForRoute(path: keyof typeof routeMetadataByPath, env: EnvLike = process.env): Metadata {
  const route = routeMetadataByPath[path];

  if (!route) {
    throw new Error(`Missing SEO metadata for route: ${path}`);
  }

  if (unsupportedMarketingClaims.test(`${route.title} ${route.description}`)) {
    throw new Error(`Unsupported marketing claim in SEO metadata for route: ${path}`);
  }

  const imageUrl = socialImageUrl(env);
  const metadata: Metadata = {
    title: route.title,
    description: route.description,
    robots: isPublicNoindexRoute(path) ? publicNoindexRobots() : robotsMetadata(env),
    openGraph: {
      title: route.title,
      description: route.description,
      type: "website",
      siteName: "DoughTools",
      images: [{
        url: imageUrl,
        width: SOCIAL_IMAGE_WIDTH,
        height: SOCIAL_IMAGE_HEIGHT,
        alt: SOCIAL_IMAGE_ALT,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: route.title,
      description: route.description,
      images: [imageUrl],
    },
  };

  if (hasConfiguredProductionSiteUrl(env)) {
    metadata.alternates = { canonical: canonicalUrl(path, env) };
    metadata.openGraph = { ...metadata.openGraph, url: canonicalUrl(path, env) };
  }

  return metadata;
}

export function metadataForLegacyRoute(path: keyof typeof legacyRouteMetadataByPath, env: EnvLike = process.env): Metadata {
  const route = legacyRouteMetadataByPath[path];

  if (!route) {
    throw new Error(`Missing legacy SEO metadata for route: ${path}`);
  }

  const metadata = noindexMetadata(route.title, route.description);
  const imageUrl = socialImageUrl(env);

  if (hasConfiguredProductionSiteUrl(env)) {
    metadata.alternates = { canonical: canonicalUrl(path, env) };
    metadata.openGraph = {
      title: route.title,
      description: route.description,
      type: "website",
      siteName: "DoughTools",
      url: canonicalUrl(path, env),
      images: [{
        url: imageUrl,
        width: SOCIAL_IMAGE_WIDTH,
        height: SOCIAL_IMAGE_HEIGHT,
        alt: SOCIAL_IMAGE_ALT,
      }],
    };
  }

  return metadata;
}

export function noindexMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export function sitemapEntries(env: EnvLike = process.env): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-06-23T00:00:00.000Z");

  return publicSeoRoutes.filter((route) => (publicIndexableRoutePaths as readonly string[]).includes(route.path)).map((route) => ({
    url: canonicalUrl(route.path, env),
    lastModified,
    changeFrequency: route.changeFrequency ?? "monthly",
    priority: route.priority ?? 0.5,
  }));
}

export function robotsPolicy(env: EnvLike = process.env): MetadataRoute.Robots {
  const siteUrl = getSiteUrl(env);

  if (!isIndexingAllowed(env)) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privateSeoRoutes.flatMap((route) => [route, `${route}${route.endsWith("/") ? "" : "/"}`]),
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
