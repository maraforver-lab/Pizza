import { describe, expect, it } from "vitest";
import { homepageContent } from "@/lib/homepage";
import { getDefaultExperienceLevel } from "@/lib/experience-levels";
import { getHomepageExperienceCopy, homepageExperienceCopy } from "@/lib/homepage-experience-copy";

const existingRoutes = new Set([
  "/",
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
    expect(homepageContent.hero.h1).toBe("Make better pizza with better decisions.");
  });

  it("keeps the primary CTA on the existing calculator anchor", () => {
    expect(homepageContent.hero.primaryCta).toEqual({ label: "Calculate your dough", href: "#top" });
  });

  it("keeps the secondary CTA on the experience-level anchor", () => {
    expect(homepageContent.hero.secondaryCta).toEqual({ label: "Choose your guidance level", href: "#experience-level" });
  });

  it("adds a Start Pizza Session entry point without replacing the calculator CTA", () => {
    expect(homepageContent.hero.startHereCta).toEqual({ label: "Start Pizza Session", href: "/session/start" });
    expect(homepageContent.hero.primaryCta).toEqual({ label: "Calculate your dough", href: "#top" });
    expect(homepageContent.coreTools.some((tool) => tool.href === "/session/start" && tool.name === "Start Pizza Session")).toBe(true);
    expect(homepageContent.coreTools.some((tool) => tool.href === "/start" && tool.name === "Start Here")).toBe(true);
  });

  it("contains the required four-step workflow", () => {
    expect(homepageContent.workflow.map((step) => step.title)).toEqual([
      "Choose your level",
      "Calculate your dough",
      "Plan fermentation and baking",
      "Troubleshoot and improve",
    ]);
  });

  it("positions DoughTools as a pizza-making workspace that adapts guidance", () => {
    expect(homepageContent.hero.eyebrow).toBe("Pizza-making workspace");
    expect(homepageContent.hero.intro).toContain("guidance level");
    expect(homepageContent.hero.intro).toContain("calculate dough");
    expect(homepageContent.hero.intro).toContain("plan fermentation");
    expect(homepageContent.trust.join(" ")).toContain("Beginner, Enthusiast and Pizza Nerd");
  });

  it("explains the three visible experience levels", () => {
    const workflowText = homepageContent.workflow.map((step) => `${step.title} ${step.description}`).join(" ");

    expect(workflowText).toContain("Beginner");
    expect(workflowText).toContain("Enthusiast");
    expect(workflowText).toContain("Pizza Nerd");
  });

  it("uses valid existing routes for core workflow tools", () => {
    for (const tool of homepageContent.coreTools) {
      if (tool.href.startsWith("#")) continue;
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

  it("does not include Finnish or Swedish active homepage labels", () => {
    const forbidden = /\b(Laskuri|Pizzatyylit|Aikataulu|Kalkylator|Pizzastilar|Tidsplan)\b|[äöåÄÖÅ]/;
    const labels = [
      homepageContent.hero.eyebrow,
      homepageContent.hero.h1,
      homepageContent.hero.intro,
      homepageContent.hero.primaryCta.label,
      homepageContent.hero.secondaryCta.label,
      homepageContent.hero.startHereCta.label,
      ...homepageContent.workflow.flatMap((step) => [step.title, step.description]),
      ...homepageContent.coreTools.flatMap((tool) => [tool.name, tool.description, tool.action]),
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
