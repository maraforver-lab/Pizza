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
  "/community",
  "/costs",
  "/doctor",
  "/gear",
  "/guide",
  "/history",
  "/journal",
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

  it("keeps footer support links but removes the duplicated support-pages card", () => {
    const layout = source("components/TrustPageLayout.tsx");
    const signature = source("components/AppSignature.tsx");

    expect(layout).not.toContain("Support pages");
    expect(layout).not.toContain("support-pages");
    expect(layout).not.toContain("trustFooterLinks.map");
    expect(layout).toContain("<AppSignature />");
    expect(signature).toContain("trustFooterLinks.map");
    expect(signature).toContain("DoughTools support links");
  });

  it("includes the required H1 text for each page", () => {
    expect(trustPages.about.title).toBe("Built from real pizza nights.");
    expect(trustPages.contact.title).toBe("Questions, corrections and feedback.");
    expect(trustPages.privacy.title).toBe("How DoughTools handles data.");
    expect(trustPages.terms.title).toBe("Use DoughTools as guidance, not a promise.");
    expect(trustPages.methodology.title).toBe("How the dough calculation works.");
  });

  it("renders the About page as a personal founder story with the supplied local portrait", () => {
    const aboutPage = source("app/about/page.tsx");
    const founderImage = join(process.cwd(), "public", "about", "marcin-arcisz-founder.webp");

    expect(existsSync(founderImage)).toBe(true);
    expect(aboutPage).toContain("Built from real pizza nights.");
    expect(aboutPage).toContain("It started with making pizza seriously");
    expect(aboutPage).toContain("The first problem was dough planning");
    expect(aboutPage).toContain("Then pizza nights created another problem");
    expect(aboutPage).toContain("From one link to one complete session");
    expect(aboutPage).toContain("How I want to build DoughTools");
    expect(aboutPage).toContain("Still building, still curious");
    expect(aboutPage).toContain("What DoughTools does not promise");
    expect(aboutPage).toContain("Built by Marcin Arcisz");
    expect(aboutPage).toContain("Home pizza maker and Pizza Napoletana enthusiast, Finland.");
    expect(aboutPage).toContain('src="/about/marcin-arcisz-founder.webp"');
    expect(aboutPage).toContain("Marcin Arcisz, creator of DoughTools, photographed outdoors by the sea.");
    expect(aboutPage).toContain("Pizza Napoletana is what first pulled me seriously into dough");
    expect(aboutPage).toContain("one place to calculate, plan, remember and follow the process");
  });

  it("keeps the founder story grounded and avoids unsupported credentials or marketing claims", () => {
    const aboutPage = source("app/about/page.tsx");

    expect(aboutPage).toContain("the dough should still be observed");
    expect(aboutPage).toContain("A good plan helps, but the dough still deserves attention.");
    expect(aboutPage).toContain("that software replaces observation and practice");
    expect(aboutPage).not.toMatch(/master pizzaiolo|chef|fermentation scientist|revolutionizing|guaranteed perfect|scientifically perfect/i);
    expect(aboutPage).not.toMatch(/trusted by \d+|rated|testimonial|award-winning/i);
  });

  it("explains the real Party Orders need and workflow without claiming unsupported party features", () => {
    const aboutPage = source("app/about/page.tsx");

    expect(aboutPage).toContain("A pizza night sounds simple until ten friends are coming.");
    expect(aboutPage).toContain("what everyone wants to eat and how many pizzas I should prepare");
    expect(aboutPage).toContain("The choices are spread across messages");
    expect(aboutPage).toContain("one link I could send to everyone");
    expect(aboutPage).toContain("Create the party");
    expect(aboutPage).toContain("Share one link");
    expect(aboutPage).toContain("Collect pizza choices");
    expect(aboutPage).toContain("Review the totals");
    expect(aboutPage).toContain("Create the Pizza Session");
    expect(aboutPage).toContain("Continue the preparation");
    expect(aboutPage).toContain("pizza time, quantity and mix carried over");
    expect(aboutPage).toContain("a real moment in the kitchen");
    expect(aboutPage).toContain("I hope it helps other home pizza makers");
    expect(aboutPage).toContain('href="/account/party-orders/new"');
    expect(aboutPage).toContain("Plan a pizza party");
    expect(aboutPage).toContain('href="/contact"');
    expect(aboutPage).toContain("Share an idea");
    expect(aboutPage).not.toMatch(/RSVP|email invitation|allerg(?:y|ies)|payment|fully automatic|zero host decisions/i);
  });

  it("keeps About page structure accessible and responsive without changing Party Orders or sessions", () => {
    const aboutPage = source("app/about/page.tsx");
    const partyOrderHandoff = source("components/account/PartyOrderSessionHandoff.tsx");
    const partyOrderCreate = source("components/account/PartyOrderCreateForm.tsx");

    expect((aboutPage.match(/<h1\b/g) ?? [])).toHaveLength(1);
    expect(aboutPage).toContain("lg:grid lg:grid-cols");
    expect(aboutPage).toContain("sm:grid-cols-2");
    expect(aboutPage).toContain("min-h-12");
    expect(partyOrderCreate).toContain("fetch(\"/api/party-orders\"");
    expect(partyOrderHandoff).toContain("Create Pizza Session from this order");
    expect(partyOrderHandoff).toContain("targetEatTime: handoff.pizzaTime");
    expect(partyOrderHandoff).toContain("pizzaCount: handoff.pizzaCount");
    expect(aboutPage).not.toContain("fetch(\"/api/party-orders\"");
    expect(aboutPage).not.toContain("createAndSavePizzaSession");
  });

  it("explains local browser storage, localStorage, IndexedDB and Supabase accurately", () => {
    const privacy = pageText("privacy");

    expect(privacy).toContain("localStorage");
    expect(privacy).toContain("IndexedDB");
    expect(privacy).toContain("Supabase");
    expect(privacy).not.toMatch(/all data (stays|is stored|remains) local/i);
  });

  it("states that terms and methodology are estimates, not promises", () => {
    expect(pageText("terms")).toMatch(/estimates/i);
    expect(pageText("terms")).toMatch(/not promises/i);
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
