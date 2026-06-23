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

const unsupportedMarketingClaims = /\b(perfect pizza|guaranteed|ultimate|revolutionary|scientifically exact)\b/i;

export const publicSeoRoutes = [
  {
    path: "/",
    title: "Pizza Dough Calculator and Pizza Planning | DoughTools",
    description:
      "Calculate pizza dough, plan fermentation, prepare sauce and toppings, and improve each bake with practical pizza-making tools.",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/about",
    title: "About DoughTools | DoughTools",
    description: "Learn what DoughTools is, who it is for, and why the pizza-making workspace exists.",
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
    title: "Privacy Policy | DoughTools",
    description: "How DoughTools currently handles local browser storage, journal data and account authentication.",
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    path: "/terms",
    title: "Terms of Use | DoughTools",
    description: "Plain-English DoughTools terms covering estimates, limitations and user responsibility.",
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
    path: "/styles",
    title: "Pizza Style Library | DoughTools",
    description: "Compare pizza styles and apply practical starting settings to the DoughTools calculator.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/doctor",
    title: "Dough Doctor | DoughTools",
    description: "Troubleshoot common pizza dough problems using the current recipe, flour, hydration and fermentation context.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/ovens",
    title: "Pizza Oven Guide | DoughTools",
    description: "Compare electric ovens, gas pizza ovens and other common pizza oven setups with practical trade-offs.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/gear",
    title: "Pizza Gear Guide | DoughTools",
    description: "Choose useful pizza-making tools for dough handling, launching, baking, slicing and safer oven work.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/sauce",
    title: "Pizza Sauce Lab | DoughTools",
    description: "Calculate tomato sauce amounts and compare sauce styles for different pizza and oven setups.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/toppings",
    title: "Cheese and Topping Calculator | DoughTools",
    description: "Plan cheese and topping amounts while keeping moisture and topping load under control.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/timer",
    title: "Pizza Bake Timer | DoughTools",
    description: "Use a simple pizza baking timer designed for fast bakes and clear over-time feedback.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/plan",
    title: "Pizza Fermentation Planner | DoughTools",
    description: "Plan mixing, balling, cold fermentation, warm-up and baking steps around your pizza schedule.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/costs",
    title: "Pizza Cost Calculator | DoughTools",
    description: "Estimate pizza night costs from dough, sauce, cheese, toppings, energy, waste and packaging inputs.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/history",
    title: "Pizza History | DoughTools",
    description: "Read a practical story of how pizza, tomato sauce and pizza-making culture developed over time.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/community",
    title: "Community Recipe Library | DoughTools",
    description: "Browse locally available community recipe examples and pizza-making ideas inside DoughTools.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/coach",
    title: "Pizza Coach | DoughTools",
    description: "Get structured pizza-making guidance from the current recipe settings and practical troubleshooting rules.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
] as const satisfies readonly SeoRoute[];

export const privateSeoRoutes = [
  "/account",
  "/auth",
  "/auth/callback",
  "/login",
  "/signup",
  "/preview",
  "/debug",
] as const;

export const routeMetadataByPath = Object.fromEntries(
  publicSeoRoutes.map((route) => [route.path, route]),
) as Record<(typeof publicSeoRoutes)[number]["path"], SeoRoute>;

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

export function canonicalUrl(path: string, env: EnvLike = process.env): string {
  const url = new URL(path, `${getSiteUrl(env)}/`);
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
