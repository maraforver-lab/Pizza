import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  metadataForRoute,
  privateSeoRoutes,
  publicIndexableRoutePaths,
  publicSeoRoutes,
  sitemapEntries,
} from "@/lib/seo-config";

const source = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), "utf8");

describe("Pizza Party Planner landing page", () => {
  it("creates a public indexable SEO route with exact approved metadata", () => {
    const route = publicSeoRoutes.find((route) => route.path === "/tools/pizza-party-planner");
    expect(route).toMatchObject({
      path: "/tools/pizza-party-planner",
      title: "Pizza Party Planner - Easy Guest Orders for 4 or 40 | DoughTools",
      description:
        "Plan a pizza party without WhatsApp chaos or spreadsheets. Share one invitation, let guests choose their pizzas and see every order in one place.",
    });
    expect(publicIndexableRoutePaths).toContain("/tools/pizza-party-planner");

    const metadata = metadataForRoute("/tools/pizza-party-planner", {
      NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
      VERCEL_ENV: "production",
    });
    expect(metadata.title).toBe("Pizza Party Planner - Easy Guest Orders for 4 or 40 | DoughTools");
    expect(metadata.description).toBe(
      "Plan a pizza party without WhatsApp chaos or spreadsheets. Share one invitation, let guests choose their pizzas and see every order in one place.",
    );
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.alternates).toMatchObject({
      canonical: "https://www.doughtools.app/tools/pizza-party-planner",
    });
    expect(canonicalUrl("/tools/pizza-party-planner?guest=40", {
      NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app",
    })).toBe("https://www.doughtools.app/tools/pizza-party-planner");
  });

  it("includes the public landing page in the sitemap and keeps private party routes out", () => {
    const sitemapUrls = sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://www.doughtools.app" }).map((entry) => entry.url);

    expect(sitemapUrls).toContain("https://www.doughtools.app/tools/pizza-party-planner");
    expect(sitemapUrls).not.toContain("https://www.doughtools.app/account/party-orders");
    expect(sitemapUrls.some((url) => url.includes("/order/"))).toBe(false);
    expect(privateSeoRoutes).toContain("/account");
    expect(privateSeoRoutes).toContain("/order");
    expect(privateSeoRoutes).toContain("/api");
  });

  it("renders the approved public landing copy, CTA and safe demo invitation", () => {
    const page = source("app", "tools", "pizza-party-planner", "page.tsx");

    expect(existsSync(join(process.cwd(), "app", "tools", "pizza-party-planner", "page.tsx"))).toBe(true);
    expect(page).toContain("metadataForRoute(\"/tools/pizza-party-planner\")");
    expect(page).toContain("<SiteFooter />");
    expect(page).toContain("PIZZA NIGHT, MADE EASY");
    expect(page).toContain("Pizza Party Planner");
    expect(page).toContain("Four friends or forty guests. One simple pizza plan.");
    expect(page).toContain("without chasing WhatsApp messages or building a spreadsheet");
    expect(page).toContain("No WhatsApp chaos. No spreadsheets. Just pizza.");
    expect(page).toContain("Dinner for 4. Pizza night for 40.");
    expect(page).toContain("From invitation to pizza plan");
    expect(page).toContain("An invitation people actually want to open");
    expect(page).toContain("Ready to make pizza night easier?");
    expect(page).toContain("Start my pizza party");
    expect(page).toContain('const createPartyHref = "/account/party-orders/new"');
    expect(page).toContain("Sign in to create and save your party. Your guests won&apos;t need an account.");
    expect(page).toContain("Guests can order without signing in.");
    expect(page).toContain("Saturday Pizza");
    expect(page).toContain("doughtools.app/order/example");
    expect(page).not.toContain("public_token");
    expect(page).not.toContain("publicToken");
    expect(page).not.toContain("submissionToken");
  });

  it("does not claim unsupported guest-count calculation or introduce anonymous organizer persistence", () => {
    const page = source("app", "tools", "pizza-party-planner", "page.tsx");

    expect(page).not.toMatch(/how many pizzas for 10 people/i);
    expect(page).not.toMatch(/automatically calculate how many pizzas/i);
    expect(page).not.toContain("localStorage");
    expect(page).not.toContain("sessionStorage");
    expect(page).not.toContain("fetch(");
    expect(page).not.toContain("/api/party-orders");
    expect(page).not.toContain("getSupabase");
    expect(page).not.toContain("createPizzaSession");
  });

  it("routes public discovery links through the landing page while leaving the account workspace authenticated", () => {
    const footer = source("components", "SiteFooter.tsx");
    const about = source("app", "about", "page.tsx");
    const accountEntry = source("components", "account", "PartyOrdersAccountEntryCard.tsx");
    const accountCreatePage = source("app", "account", "party-orders", "new", "page.tsx");
    const publicOrderLayout = source("app", "order", "[publicToken]", "layout.tsx");

    expect(footer).toContain('label: "Pizza Party Planner", href: "/tools/pizza-party-planner"');
    expect(footer).not.toContain('href: "/account/party-orders"');
    expect(about).toContain('href="/tools/pizza-party-planner"');
    expect(about).not.toContain('href="/account/party-orders/new"');
    expect(accountEntry).toContain('href="/account/party-orders"');
    expect(accountEntry).toContain('href="/account/party-orders/new"');
    expect(accountCreatePage).toContain("redirect(\"/account\")");
    expect(publicOrderLayout).toContain("noindexMetadata");
    expect(publicOrderLayout).toContain("Party Order | DoughTools");
  });
});
