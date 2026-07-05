import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
    expect(trustPages.about.title).toBe("A practical workspace for better pizza decisions.");
    expect(trustPages.contact.title).toBe("Questions, corrections and feedback.");
    expect(trustPages.privacy.title).toBe("How DoughTools handles data.");
    expect(trustPages.terms.title).toBe("Use DoughTools as guidance, not a promise.");
    expect(trustPages.methodology.title).toBe("How the dough calculation works.");
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
