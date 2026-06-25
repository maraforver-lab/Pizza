import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homepageContent } from "@/lib/homepage";
import { getDefaultExperienceLevel } from "@/lib/experience-levels";
import { getHomepageExperienceCopy, homepageExperienceCopy } from "@/lib/homepage-experience-copy";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const existingRoutes = new Set([
  "/",
  "/?calculator=1",
  "/session/start",
  "/start",
  "/plan",
  "/sauce",
  "/toppings",
  "/timer",
  "/doctor",
  "/styles",
  "/guide",
  "/ovens",
  "/gear",
  "/history",
  "/community",
  "/coach",
  "/costs",
]);

describe("homepage content model", () => {
  it("has one intended primary H1", () => {
    expect(homepageContent.hero.h1).toBe("Plan and bake better pizza without guessing.");
  });

  it("makes Start Pizza Session the primary homepage CTA", () => {
    expect(homepageContent.hero.primaryCta).toEqual({ label: "Start Pizza Session", href: "/session/start" });
  });

  it("keeps the full calculator available as a secondary action", () => {
    expect(homepageContent.hero.secondaryCta).toEqual({ label: "Open calculator", href: "/?calculator=1" });
  });

  it("keeps learning available without making it the primary action", () => {
    expect(homepageContent.hero.learnCta).toEqual({ label: "Learn how it works", href: "/guide" });
  });

  it("contains the required concise four-step session flow", () => {
    expect(homepageContent.workflow.map((step) => step.title)).toEqual([
      "Choose your pizza",
      "Get your dough plan",
      "Follow your timeline",
      "Shop, bake and improve",
    ]);
  });

  it("positions DoughTools as a session-first pizza-making workspace", () => {
    expect(homepageContent.hero.eyebrow).toBe("Pizza-making workspace");
    expect(homepageContent.hero.intro).toContain("one pizza session");
    expect(homepageContent.hero.intro).toContain("dough plan");
    expect(homepageContent.hero.intro).toContain("timeline");
    expect(homepageContent.hero.intro).toContain("kitchen steps");
    expect(homepageContent.trust.join(" ")).toContain("Beginner, Enthusiast and Pizza Nerd");
  });

  it("explains the user benefit without claiming cloud sync or guarantees", () => {
    const text = [homepageContent.hero.intro, ...homepageContent.benefits, ...homepageContent.trust].join(" ");

    expect(text).toContain("Dough amounts calculated");
    expect(text).toContain("Progress is saved in this browser on this device");
    expect(text).not.toMatch(/cloud sync is active|cross-device sync|guaranteed results|perfect pizza/i);
  });

  it("uses valid existing routes for core workflow tools", () => {
    for (const tool of homepageContent.coreTools) {
      expect(existingRoutes.has(tool.href)).toBe(true);
      expect(tool.name.trim()).toBeTruthy();
      expect(tool.description.trim()).toBeTruthy();
      expect(tool.action.trim()).toBeTruthy();
    }
  });

  it("keeps core workflow tool route entries unique", () => {
    const hrefs = homepageContent.coreTools.map((tool) => tool.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("keeps secondary discovery routes valid and unique", () => {
    const hrefs = homepageContent.secondaryTools.map((tool) => tool.href);

    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) expect(existingRoutes.has(href)).toBe(true);
  });

  it("renders a session-first homepage instead of the old calculator dashboard", () => {
    const homepage = source("app/page.tsx");
    const content = source("lib/homepage.ts");

    expect(content).toContain("Start Pizza Session");
    expect(homepage).toContain("How a Pizza Session works");
    expect(homepage).toContain("Need a specific tool?");
    expect(homepage).toContain("ContinuePizzaSessionCard");
    expect(homepage).toContain("HomeCalculatorWorkspace");
    expect(homepage).toContain("hasCalculatorRequest");
    expect(homepage).not.toContain("Build the dough recipe.");
    expect(homepage).not.toContain("Ready to mix");
    expect(homepage).not.toContain("Share your pizza");
    expect(homepage).not.toContain("WhatsApp");
    expect(homepage).not.toContain("Save this bake");
    expect(homepage).not.toContain("My recipes");
    expect(homepage).not.toContain("Core pizza workflow tools");
    expect(homepage).not.toContain("Explore the rest of the workshop");
  });

  it("keeps the full calculator workspace available for recipe query URLs", () => {
    const homepage = source("app/page.tsx");
    const calculatorWorkspace = source("components/HomeCalculatorWorkspace.tsx");

    expect(homepage).toContain("if (hasCalculatorRequest(params))");
    expect(homepage).toContain("return <HomeCalculatorWorkspace />");
    expect(homepageContent.hero.secondaryCta.href).toBe("/?calculator=1");
    expect(calculatorWorkspace).toContain("Build the dough recipe.");
    expect(calculatorWorkspace).toContain("Ready to mix");
    expect(calculatorWorkspace).toContain("Save recipe");
  });

  it("documents the session-first homepage cleanup without launch or cloud claims", () => {
    const doc = source("docs/homepage-session-first-cleanup.md");

    expect(doc).toContain("Patch 37");
    expect(doc).toContain("Start Pizza Session");
    expect(doc).toContain("/session/recipe");
    expect(doc).toContain("/session/timeline");
    expect(doc).toContain("/session/shopping");
    expect(doc).toContain("/session/kitchen");
    expect(doc).toContain("/?calculator=1");
    expect(doc).toContain("does not change dough formulas");
    expect(doc).not.toMatch(/cloud sync is active|Google indexing is enabled|analytics added|tracking added/i);
  });

  it("does not include Finnish or Swedish active homepage labels", () => {
    const forbidden = /\b(Laskuri|Pizzatyylit|Aikataulu|Kalkylator|Pizzastilar|Tidsplan)\b|[äöåÄÖÅ]/;
    const labels = [
      homepageContent.hero.eyebrow,
      homepageContent.hero.h1,
      homepageContent.hero.intro,
      homepageContent.hero.primaryCta.label,
      homepageContent.hero.secondaryCta.label,
      homepageContent.hero.learnCta.label,
      ...homepageContent.workflow.flatMap((step) => [step.title, step.description]),
      ...homepageContent.coreTools.flatMap((tool) => [tool.name, tool.description, tool.action]),
      ...homepageContent.benefits,
      ...homepageContent.trust,
      ...homepageContent.secondaryTools.map((tool) => tool.name),
    ];

    for (const label of labels) expect(label).not.toMatch(forbidden);
  });

  it("defaults homepage guidance to Beginner copy", () => {
    const defaultCopy = getHomepageExperienceCopy(getDefaultExperienceLevel());

    expect(getDefaultExperienceLevel()).toBe("beginner");
    expect(defaultCopy.heroIntro).toContain("suggested defaults");
    expect(defaultCopy.resultDetails).toHaveLength(2);
    expect(defaultCopy.saveBakeHelp).toContain("compare next time");
  });

  it("adds more technical result guidance for Pizza Nerd users without changing tools", () => {
    const beginner = getHomepageExperienceCopy("beginner");
    const pizzaNerd = getHomepageExperienceCopy("pizza_nerd");

    expect(pizzaNerd.resultDetails.length).toBeGreaterThan(beginner.resultDetails.length);
    expect(pizzaNerd.resultDetails.join(" ")).toContain("baker");
    expect(pizzaNerd.resultNote).toContain("starter activity");
  });

  it("keeps experience-level homepage copy English and free of unavailable feature claims", () => {
    const forbiddenLanguage = /\b(Aloittelija|Harrastaja|Nybörjare|Entusiast)\b|[äöåÄÖÅ]/;
    const unavailableClaims = /\b(cloud sync|photo upload|share card|public bake page|guaranteed result|perfect pizza)\b/i;

    for (const entry of Object.values(homepageExperienceCopy)) {
      const text = [
        entry.heroIntro,
        entry.workflowHint,
        entry.calculatorIntro,
        entry.quickIntro,
        entry.flourIntro,
        entry.resultNote,
        entry.saveBakeHelp,
        ...entry.resultDetails,
      ].join(" ");

      expect(text).not.toMatch(forbiddenLanguage);
      expect(text).not.toMatch(unavailableClaims);
      expect(entry.saveBakeHelp).toMatch(/^Save/);
    }
  });
});
