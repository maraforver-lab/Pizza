import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  projectContactEmail,
  projectJurisdiction,
  projectOwner,
  trustFooterLinks,
  trustPages,
  type TrustPageId,
} from "@/lib/trust-pages";

const requiredPages: TrustPageId[] = ["about", "contact", "privacy", "terms", "methodology"];
const existingAndNewRoutes = new Set([
  "/",
  "/account",
  "/coach",
  "/costs",
  "/guide",
  "/ovens",
  "/plan",
  "/sauce",
  "/styles",
  "/timer",
  "/toppings",
  "/updates",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/methodology",
]);

const pageText = (id: TrustPageId) => [
  trustPages[id].eyebrow,
  trustPages[id].title,
  trustPages[id].intro,
  trustPages[id].lastUpdated ?? "",
  trustPages[id].effectiveFrom ?? "",
  trustPages[id].heroImage?.src ?? "",
  trustPages[id].heroImage?.mobileSrc ?? "",
  trustPages[id].heroImage?.alt ?? "",
  ...(trustPages[id].summary?.flatMap((item) => [item.title, item.body, item.href]) ?? []),
  ...trustPages[id].sections.flatMap((section) => [
    section.heading,
    ...(section.paragraphs ?? []),
    ...(section.bullets ?? []),
  ]),
].join("\n");

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("trust and legal pages", () => {
  it("defines the required trust/legal pages with valid routes", () => {
    expect(Object.keys(trustPages).sort()).toEqual([...requiredPages].sort());

    for (const id of requiredPages) {
      expect(existingAndNewRoutes.has(trustPages[id].href)).toBe(true);
      expect(trustPages[id].title.trim()).toBeTruthy();
      expect(trustPages[id].sections.length).toBeGreaterThan(0);
    }
  });

  it("defines footer links to every trust/legal page", () => {
    expect(trustFooterLinks.map((link) => link.href)).toEqual([
      "/about",
      "/contact",
      "/privacy",
      "/terms",
      "/methodology",
    ]);
  });

  it("uses the canonical site footer and removes the duplicated support-pages card", () => {
    const layout = source("components/TrustPageLayout.tsx");
    const footer = source("components/SiteFooter.tsx");

    expect(layout).not.toContain("Support pages");
    expect(layout).not.toContain("support-pages");
    expect(layout).not.toContain("trustFooterLinks.map");
    expect(layout).toContain("<SiteFooter />");
    expect(footer).toContain("DoughTools footer");
    expect(footer).toContain('href: "/privacy"');
    expect(footer).toContain('href: "/terms"');
  });

  it("includes the required H1 text for each page", () => {
    expect(trustPages.about.title).toBe("Built from real pizza nights.");
    expect(trustPages.contact.title).toBe("Questions, corrections and feedback.");
    expect(trustPages.privacy.title).toBe("Your data, explained clearly.");
    expect(trustPages.terms.title).toBe("Clear rules for using DoughTools.");
    expect(trustPages.methodology.title).toBe("How the dough calculation works.");
  });

  it("renders the About page as a personal founder story with the supplied local portrait", () => {
    const aboutPage = source("app/about/page.tsx");
    const founderImage = join(process.cwd(), "public", "about", "marcin-arcisz-founder.webp");

    expect(existsSync(founderImage)).toBe(true);
    expect(aboutPage).toContain("It didn't start with software.");
    expect(aboutPage).toContain("how can I make better pizza without spending half the evening calculating everything?");
    expect(aboutPage).toContain("It wasn't the dough. It was the planning.");
    expect(aboutPage).toContain("The time I actually had.");
    expect(aboutPage).toContain("From calculator to workflow");
    expect(aboutPage).toContain("Everyone starts somewhere.");
    expect(aboutPage).toContain("My first unforgettable pizza.");
    expect(aboutPage).toContain("The evening that changed everything.");
    expect(aboutPage).toContain("Then another problem appeared.");
    expect(aboutPage).toContain("What I believe.");
    expect(aboutPage).toContain("Still building.");
    expect(aboutPage).toContain('src="/about/marcin-arcisz-founder.webp"');
    expect(aboutPage).toContain("Marcin, creator of DoughTools, photographed outdoors by the sea.");
    expect(aboutPage).toContain("I did not want another calculator. I wanted answers I could actually trust.");
    expect(aboutPage).toContain("Real life should not adapt to the calculator. The software should adapt to real life.");
    expect(aboutPage).toContain("Pizza Napoletana became my first pizza love.");
    expect(aboutPage).toContain("Other styles will come later because I want to fall in love with those as well.");
    expect(aboutPage).toContain("DoughTools is not here to make pizza for you.");
    expect(aboutPage).toContain("It is here to help you understand your next pizza.");
    expect(aboutPage.match(/Marcin Arcisz/g) ?? []).toHaveLength(1);
  });

  it("keeps the founder story grounded and avoids unsupported credentials or marketing claims", () => {
    const aboutPage = source("app/about/page.tsx");

    expect(aboutPage).toContain("the dough still needs observation");
    expect(aboutPage).toContain("A good plan helps, but the dough still deserves attention.");
    expect(aboutPage).toContain("DoughTools gives planning guidance, not guarantees.");
    expect(aboutPage).toContain("The calculation method and limits stay visible.");
    expect(aboutPage).toContain("The calculations stay the same.");
    expect(aboutPage).toContain("The explanation changes.");
    expect(aboutPage).toContain("Software should support the craft. Not replace it.");
    expect(aboutPage).toContain("Pizza making should become less confusing. Not more automatic.");
    expect(aboutPage).not.toMatch(/master pizzaiolo|chef|fermentation scientist|revolutionizing|guaranteed perfect|scientifically perfect/i);
    expect(aboutPage).not.toMatch(/trusted by \d+|rated|testimonial|award-winning/i);
  });

  it("explains the real Party Orders need and workflow without claiming unsupported party features", () => {
    const aboutPage = source("app/about/page.tsx");

    expect(aboutPage).toContain("twenty people");
    expect(aboutPage).toContain("One pizza oven. Many pizzas.");
    expect(aboutPage).toContain("Everything was prepared. Everything worked.");
    expect(aboutPage).toContain("Good planning gives you more time to enjoy the people around the table.");
    expect(aboutPage).toContain("Everyone wanted something different.");
    expect(aboutPage).toContain("One person changed their mind.");
    expect(aboutPage).toContain("Someone brought another guest.");
    expect(aboutPage).toContain("I realised I wasn't planning pizza anymore.");
    expect(aboutPage).toContain("I was organising messages.");
    expect(aboutPage).toContain("Share one link");
    expect(aboutPage).toContain("Collect choices");
    expect(aboutPage).toContain("Review totals");
    expect(aboutPage).toContain("Create Pizza Session");
    expect(aboutPage).toContain("The workflow keeps the human part intact");
    expect(aboutPage).toContain("If DoughTools helps you make your first great pizza");
    expect(aboutPage).toContain("or confidently host twenty friends");
    expect(aboutPage).toContain("then every evening spent building it has been worth it.");
    expect(aboutPage).toContain('href="/account/party-orders/new"');
    expect(aboutPage).toContain("Plan a pizza party");
    expect(aboutPage).toContain('href="/session/start"');
    expect(aboutPage).toContain("Plan my next pizza");
    expect(aboutPage).toContain('href="/contact"');
    expect(aboutPage).toContain("Share an idea");
    expect(aboutPage).not.toMatch(/RSVP|email invitation|allerg(?:y|ies)|payment|fully automatic|zero host decisions/i);
  });

  it("uses local editorial images with explicit dimensions and meaningful alt text", () => {
    const aboutPage = source("app/about/page.tsx");

    for (const imagePath of [
      "/about/marcin-arcisz-founder.webp",
      "/dough-guide/guide-step-02-measure.webp",
      "/dough-guide/guide-step-06-bulk.webp",
      "/dough-guide/guide-step-08-ball.webp",
      "/images/shopping/pizza-margherita.webp",
      "/images/timeline/bake-pizza.webp",
      "/images/shopping/pizza-prosciutto.webp",
    ]) {
      expect(aboutPage).toContain(imagePath);
      expect(existsSync(join(process.cwd(), "public", imagePath))).toBe(true);
    }

    expect(aboutPage).toContain('alt="Marcin, creator of DoughTools, photographed outdoors by the sea."');
    expect(aboutPage).toContain('alt: "Pizza dough ingredients measured on a warm kitchen counter."');
    expect(aboutPage).toContain('alt: "Covered pizza dough fermenting in a container."');
    expect(aboutPage).toContain('alt: "Pizza dough balls prepared in a tray."');
    expect(aboutPage).toContain('alt: "Freshly baked Margherita pizza with tomato, mozzarella and basil."');
    expect(aboutPage).toContain('alt: "Pizza baking in a hot oven."');
    expect(aboutPage).toContain('alt: "Freshly baked pizza prepared for serving."');
    expect(aboutPage).toContain("width={960}");
    expect(aboutPage).toContain("height={1200}");
    expect(aboutPage).toContain("width: 1200");
    expect(aboutPage).toContain("height: 800");
    expect(aboutPage).toContain("width: 1254");
    expect(aboutPage).toContain("height: 1254");
    expect(aboutPage).not.toMatch(/https?:\/\//);
    expect(aboutPage).not.toMatch(/synthetic founder|generated founder|ai founder/i);
  });

  it("keeps product CTAs contextual, unique and below the originating story sections", () => {
    const aboutPage = source("app/about/page.tsx");
    const pizzaSessionIndex = aboutPage.indexOf("Plan my next pizza");
    const workflowIndex = aboutPage.indexOf("From calculator to workflow");
    const partyIndex = aboutPage.indexOf("Plan a pizza party");
    const partyStoryIndex = aboutPage.indexOf("Then another problem appeared.");
    const shareIndex = aboutPage.indexOf("Share an idea");
    const closingIndex = aboutPage.indexOf("Still building.");

    expect(workflowIndex).toBeGreaterThan(-1);
    expect(pizzaSessionIndex).toBeGreaterThan(workflowIndex);
    expect(partyStoryIndex).toBeGreaterThan(-1);
    expect(partyIndex).toBeGreaterThan(partyStoryIndex);
    expect(shareIndex).toBeGreaterThan(closingIndex);
    expect(aboutPage.match(/Plan my next pizza/g) ?? []).toHaveLength(1);
    expect(aboutPage).not.toContain("Explore Pizza Sessions");
    expect(aboutPage.match(/Plan a pizza party/g) ?? []).toHaveLength(1);
    expect(aboutPage.match(/Share an idea/g) ?? []).toHaveLength(1);
  });

  it("keeps About page structure accessible and responsive without changing Party Orders or sessions", () => {
    const aboutPage = source("app/about/page.tsx");
    const partyOrderHandoff = source("components/account/PartyOrderSessionHandoff.tsx");
    const partyOrderCreate = source("components/account/PartyOrderCreateForm.tsx");

    expect((aboutPage.match(/<h1\b/g) ?? [])).toHaveLength(1);
    expect(aboutPage).toContain("lg:grid-cols");
    expect(aboutPage).toContain("sm:grid-cols-2");
    expect(aboutPage).toContain("sm:grid-cols-[9rem_1fr]");
    expect(aboutPage).toContain("lg:order-2");
    expect(aboutPage).toContain("lg:order-1");
    expect(aboutPage).toContain("min-h-12");
    expect(partyOrderCreate).toContain("fetch(\"/api/party-orders\"");
    expect(partyOrderHandoff).toContain("Create Pizza Session from this order");
    expect(partyOrderHandoff).toContain("targetEatTime: handoff.pizzaTime");
    expect(partyOrderHandoff).toContain("pizzaCount: handoff.pizzaCount");
    expect(aboutPage).not.toContain("fetch(\"/api/party-orders\"");
    expect(aboutPage).not.toContain("createAndSavePizzaSession");
    expect(aboutPage).not.toContain("app/api");
    expect(aboutPage).not.toContain("supabase/migrations");
  });

  it("explains local browser storage, localStorage and Supabase accurately", () => {
    const privacy = pageText("privacy");

    expect(privacy).toContain("localStorage");
    expect(privacy).toContain("sessionStorage");
    expect(privacy).toContain("Supabase");
    expect(privacy).toContain("Account sync is optional");
    expect(privacy).toContain("browser-local");
    expect(privacy).toContain("Supabase-backed cloud storage");
    expect(privacy).not.toMatch(/\bjournal\b|community recipe drafts/i);
    expect(privacy).not.toMatch(/all data (stays|is stored|remains) local/i);
  });

  it("covers the current privacy data flow without unsupported compliance claims", () => {
    const privacy = pageText("privacy");

    expect(privacy).toContain("Why and on what legal basis");
    expect(privacy).toContain("performance of the requested service or contract");
    expect(privacy).toContain("legitimate interests");
    expect(privacy).toContain("Pizza photos and moderation");
    expect(privacy).toContain("OpenAI");
    expect(privacy).toContain("Party Orders");
    expect(privacy).toMatch(/Anyone with the link|anyone who receives/i);
    expect(privacy).toContain("public guest link");
    expect(privacy).toContain("Vercel");
    expect(privacy).toContain("International data transfers");
    expect(privacy).toContain("Standard Contractual Clauses");
    expect(privacy).toContain("Retention and deletion");
    expect(privacy).toContain("Office of the Data Protection Ombudsman");
    expect(privacy).toContain("13 July 2026");
    expect(privacy).not.toMatch(/fully GDPR compliant|GDPR compliant|lawyer reviewed|regulator approved/i);
  });

  it("covers the current Terms product behavior and consumer-rights boundaries", () => {
    const terms = pageText("terms");

    expect(terms).toContain("What DoughTools provides");
    expect(terms).toContain("Pizza Sessions");
    expect(terms).toContain("Party Orders");
    expect(terms).toContain("public guest links");
    expect(terms).toContain("Calculations, recipes, and educational information");
    expect(terms).toContain("estimates");
    expect(terms).toContain("Equipment manufacturer instructions");
    expect(terms).toContain("User content and photos");
    expect(terms).toContain("limited permission");
    expect(terms).toContain("limited operating licence");
    expect(terms).toContain("mandatory consumer rights");
    expect(terms).toContain("Finnish Consumer Advisory Services");
    expect(terms).toContain("Finnish Consumer Disputes Board");
    expect(terms).toContain("EU ODR platform was discontinued on 20 July 2025");
    expect(terms).toContain("13 July 2026");
    expect(terms).not.toMatch(/provided “as is” and we are never liable|waive all rights|Online Dispute Resolution platform.*href/i);
  });

  it("uses local people-free trust hero assets with explicit dimensions", () => {
    for (const id of ["privacy", "terms"] as const) {
      const image = trustPages[id].heroImage;

      expect(image).toBeDefined();
      expect(image?.src).toMatch(/^\/images\/trust\/.+-desktop\.webp$/);
      expect(image?.mobileSrc).toMatch(/^\/images\/trust\/.+-mobile\.webp$/);
      expect(image?.width).toBeGreaterThan(0);
      expect(image?.height).toBeGreaterThan(0);
      expect(image?.mobileWidth).toBeGreaterThan(0);
      expect(image?.mobileHeight).toBeGreaterThan(0);
      expect(image?.alt).toMatch(/workspace|pizza/i);
      expect(existsSync(join(process.cwd(), "public", image?.src ?? ""))).toBe(true);
      expect(existsSync(join(process.cwd(), "public", image?.mobileSrc ?? ""))).toBe(true);
      expect(`${image?.alt} ${image?.src} ${image?.mobileSrc}`).not.toMatch(/person|people|hand|hands|face|logo|signature|legal text/i);
    }
  });

  it("adds internal legal documentation without exposing raw internal paths publicly", () => {
    for (const docPath of [
      "docs/audits/patch-363-privacy-terms-legal-audit.md",
      "docs/legal/privacy-data-map.md",
      "docs/legal/terms-product-map.md",
      "docs/legal/third-party-processors.md",
    ]) {
      expect(existsSync(join(process.cwd(), docPath))).toBe(true);
    }

    const audit = source("docs/audits/patch-363-privacy-terms-legal-audit.md");
    const publicTrustText = `${pageText("privacy")}\n${pageText("terms")}`;

    expect(audit).toContain("Requires Marcin confirmation");
    expect(audit).toContain("Supabase");
    expect(audit).toContain("Vercel");
    expect(audit).toContain("OpenAI");
    expect(audit).toContain("Terms acceptance");
    expect(publicTrustText).not.toMatch(/docs\/legal|docs\\legal|app\/api|lib\/|C:\\|C:\/|\/Users\//);
  });

  it("states that terms and methodology are estimates, not promises", () => {
    expect(pageText("terms")).toMatch(/estimates/i);
    expect(pageText("terms")).toMatch(/not a guarantee|does not guarantee/i);
    expect(pageText("methodology")).toMatch(/does not promise/i);
  });

  it("includes the Patch 01 reference calculation in methodology", () => {
    const methodology = pageText("methodology");

    expect(methodology).toContain("6 pizzas");
    expect(methodology).toContain("260 g dough ball");
    expect(methodology).toContain("total dough 1606.8 g");
    expect(methodology).toContain("flour 962.71 g");
    expect(methodology).toContain("water 616.14 g");
    expect(methodology).toContain("salt 26.96 g");
    expect(methodology).toContain("yeast 0.99 g");
  });

  it("replaces launch placeholders with real project details", () => {
    const allText = requiredPages.map(pageText).join("\n");

    expect(allText).not.toContain("[Contact email to be added before public launch]");
    expect(allText).not.toContain("[Owner/legal entity to be added before public launch]");
    expect(allText).not.toContain("[Applicable jurisdiction to be confirmed before public launch]");
    expect(allText).toContain(projectContactEmail);
    expect(allText).toContain(projectOwner);
    expect(allText).toContain(projectJurisdiction);
  });

  it("does not introduce fake company, testimonial or user-count claims", () => {
    const allText = requiredPages.map(pageText).join("\n");

    expect(allText).not.toMatch(/\b(Inc\.|Ltd\.|LLC|Oy|GmbH)\b/);
    expect(allText).not.toMatch(/\b(testimonial|rated|reviews|users love|trusted by \d+)\b/i);
  });

  it("keeps active trust/legal copy English-only", () => {
    const forbidden = /\b(Laskuri|Pizzatyylit|Aikataulu|Kalkylator|Pizzastilar|Tidsplan)\b|[äöåÄÖÅ]/;
    const allText = requiredPages.map(pageText).join("\n");

    expect(allText).not.toMatch(forbidden);
  });
});
