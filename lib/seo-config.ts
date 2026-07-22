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
  publicIndexableRoutes: readonly string[];
  publicToolBaseRoutes: readonly string[];
  statefulQueryParamRoutes: readonly string[];
  legacyNoindexRoutes: readonly string[];
  privateNoindexRoutes: readonly string[];
};

const unsupportedMarketingClaims = /\b(perfect pizza|guaranteed|ultimate|revolutionary|scientifically exact)\b/i;

export const publicSeoRoutes = [
  {
    path: "/",
    title: "Plan Better Pizza Nights | DoughTools",
    description:
      "Plan a complete pizza night with a Dough Plan, Shopping list, Timeline, Kitchen and Review path.",
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
    title: "Calculation Methodology | DoughTools",
    description: "How DoughTools calculates pizza dough using baker’s percentages and fermentation estimates.",
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
    path: "/styles",
    title: "Pizza Style Guide: Neapolitan, New York, Detroit, Roman and Sicilian | DoughTools",
    description: "Compare major pizza styles by crust, texture, dough, oven, sauce and baking method, and learn which style DoughTools currently supports for planning.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/ovens",
    title: "Home Oven vs Pizza Oven: Heat, Baking and Pizza Results | DoughTools",
    description: "Compare Home oven and Pizza oven baking paths, including heat, bake time, topping moisture, dough behavior, preheating and common mistakes.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/sauce",
    title: "Pizza Sauce Recipe and Calculator | DoughTools",
    description:
      "Calculate sauce per pizza, total pizza sauce, and a simple pizza sauce recipe for raw, Marinara or home-oven cooked sauce.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/toppings",
    title: "Pizza Topping Balance Lab: Sauce, Cheese and Moisture | DoughTools",
    description:
      "See how sauce, cheese, pizza size and mozzarella moisture change topping balance, and learn what too little, balanced and overloaded pizza look like.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/calculator/quick",
    title: "Quick Dough Calculator | DoughTools",
    description: "Calculate pizza dough ingredient amounts without creating a full pizza plan.",
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
    title: "Home Pizza vs Restaurant Pizza Cost Calculator | DoughTools",
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
  "/auth",
  "/auth/callback",
  "/login",
  "/signup",
  "/preview",
  "/debug",
] as const;

export const legacyNoindexRoutes: readonly SeoRoute[] = [];

export const publicToolBaseRoutes = [
  "/",
  "/sauce",
  "/tools/bake-timer",
  "/calculator/quick",
  "/toppings",
  "/timer",
  "/costs",
] as const;

export const statefulQueryParamRoutes = [
  "/",
  "/sauce",
  "/calculator/quick",
  "/toppings",
  "/timer",
] as const;

export const seoRoutePolicy: SeoRoutePolicy = {
  publicIndexableRoutes: publicSeoRoutes.map((route) => route.path),
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
    env.ALLOW_INDEXING === "true"
    && hasConfiguredProductionSiteUrl(env)
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

export function metadataForRoute(path: keyof typeof routeMetadataByPath, env: EnvLike = process.env): Metadata {
  const route = routeMetadataByPath[path];

  if (!route) {
    throw new Error(`Missing SEO metadata for route: ${path}`);
  }

  if (unsupportedMarketingClaims.test(`${route.title} ${route.description}`)) {
    throw new Error(`Unsupported marketing claim in SEO metadata for route: ${path}`);
  }

  const metadata: Metadata = {
    title: route.title,
    description: route.description,
    robots: robotsMetadata(env),
    openGraph: {
      title: route.title,
      description: route.description,
      type: "website",
      siteName: "DoughTools",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "DoughTools pizza planning workspace" }],
    },
    twitter: {
      card: "summary_large_image",
      title: route.title,
      description: route.description,
      images: ["/opengraph-image"],
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

  if (hasConfiguredProductionSiteUrl(env)) {
    metadata.alternates = { canonical: canonicalUrl(path, env) };
    metadata.openGraph = {
      title: route.title,
      description: route.description,
      type: "website",
      siteName: "DoughTools",
      url: canonicalUrl(path, env),
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "DoughTools pizza planning workspace" }],
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

  return publicSeoRoutes.map((route) => ({
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
