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
  "/session/recipe",
  "/session/timeline",
  "/session/shopping",
  "/session/kitchen",
  "/session/review",
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
  "/account",
  "/updates",
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

  it("contains the required compact eight-step session flow", () => {
    expect(homepageContent.workflow.map((step) => step.title)).toEqual([
      "How you bake",
      "Pizza style",
      "When to eat",
      "How many",
      "Flour",
      "Dough plan",
      "Timeline",
      "Shopping list",
    ]);
  });

  it("positions DoughTools as a clean session-first pizza-making homepage", () => {
    expect(homepageContent.hero.eyebrow).toBe("Pizza-making made simple");
    expect(homepageContent.hero.intro).toContain("one pizza session");
    expect(homepageContent.hero.intro).toContain("dough plan");
    expect(homepageContent.hero.intro).toContain("timeline");
    expect(homepageContent.hero.intro).toContain("kitchen steps");
    expect(homepageContent.trust).toEqual([
      "Saved locally",
      "Private",
      "No tracking",
      "You control your session data",
    ]);
  });

  it("explains the user benefit without claiming cloud sync or guarantees", () => {
    const text = [homepageContent.hero.intro, ...homepageContent.benefits, ...homepageContent.trust].join(" ");

    expect(text).toContain("Dough amounts calculated");
    expect(text).toContain("Local-first saved progress");
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

  it("renders the minimal beta front door instead of old homepage clutter", () => {
    const homepage = source("app/page.tsx");
    const content = source("lib/homepage.ts");
    const guidance = source("components/HomepageGuidanceLevelSection.tsx");
    const continueCard = source("components/ContinuePizzaSessionCard.tsx");
    const header = source("components/GlobalToolNavigation.tsx");
    const updateNotice = source("components/LatestUpdateNotice.tsx");
    const nextStep = source("components/WorkflowNextStep.tsx");

    expect(content).toContain("Start Pizza Session");
    expect(content).toContain("Pizza-making made simple");
    expect(homepage).toContain("ContinuePizzaSessionCard");
    expect(homepage).toContain('variant="hero"');
    expect(homepage).toContain("HomepageGuidanceLevelSection");
    expect(homepage).toContain("HomeCalculatorWorkspace");
    expect(homepage).toContain("calculatorViewFor");
    expect(homepage).toContain('return "entry"');
    expect(homepage).toContain('return "full"');
    expect(homepage).toContain("/images/homepage/hero-desktop-bg.png");
    expect(homepage).toContain("/images/homepage/hero-mobile-bg.png");
    expect(homepage).toContain("supplied Image 3 is the desktop background asset");
    expect(homepage).toContain("supplied Image 4 is the mobile background asset");
    expect(homepage).not.toContain("/images/homepage-hero-desktop.png");
    expect(homepage).not.toContain("/images/homepage-hero-mobile.png");
    expect(homepage).toContain("min-h-[calc(100vh-4rem)]");
    expect(homepage).toContain("bg-[linear-gradient(90deg");
    expect(guidance).toContain("Experience level");
    expect(guidance).toContain("EXPERIENCE_LEVELS.map");
    expect(guidance).toContain("writeExperienceLevelPreference");
    expect(continueCard).toContain('variant = "default"');
    expect(continueCard).toContain('variant === "hero"');
    expect(continueCard).toContain("Continue Pizza Session");
    expect(continueCard).toContain("pizzaSessionContinueHref(session)");
    expect(continueCard).toContain("Cloud sync is not active yet.");
    expect(header).toContain("href=\"/\"");
    expect(header).toContain("href=\"/account\"");
    expect(header).toContain("Tools");
    expect(header).toContain("Pizza dough calculator");
    expect(header).toContain("Calculate flour, water, salt and yeast.");
    expect(header).toContain('href="/?calculator=1"');
    expect(header).not.toMatch(/Dough Calculator|Make pizza|Learn & troubleshoot|My DoughTools|More tools/);
    expect(updateNotice).toContain('pathname === "/"');
    expect(nextStep).not.toContain('"/":');
    expect(homepage).not.toContain("homepageContent.hero.secondaryCta.href");
    expect(homepage).not.toContain("homepageContent.hero.learnCta.href");
    expect(homepage).not.toContain("Your pizza session in 8 steps");
    expect(homepage).not.toContain("All tools at your fingertips");
    expect(homepage).not.toContain("homepageContent.workflow.map");
    expect(homepage).not.toContain("homepageContent.coreTools.map");
    expect(homepage).not.toContain("homepageContent.secondaryTools");
    expect(homepage).not.toContain("InstallAppPrompt");
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

    expect(homepage).toContain("calculatorViewFor(params)");
    expect(homepage).toContain('return "full"');
    expect(homepage).toContain("return <HomeCalculatorWorkspace variant={calculatorView} />");
    expect(homepageContent.hero.secondaryCta.href).toBe("/?calculator=1");
    expect(calculatorWorkspace).toContain("Build the dough recipe.");
    expect(calculatorWorkspace).toContain("Ready to mix");
    expect(calculatorWorkspace).toContain("Save recipe");
  });

  it("documents the session-first homepage cleanup without launch or cloud claims", () => {
    const doc = source("docs/homepage-session-first-cleanup.md");
    const visualDoc = source("docs/homepage-session-first-visual-cleanup.md");
    const minimalDoc = source("docs/homepage-minimal-ux-lockdown.md");

    expect(doc).toContain("Patch 37");
    expect(visualDoc).toContain("Patch 39");
    expect(minimalDoc).toContain("Patch 40");
    expect(doc).toContain("Start Pizza Session");
    expect(visualDoc).toContain("/session/start");
    expect(minimalDoc).toContain("minimal beta front door");
    expect(doc).toContain("/session/recipe");
    expect(doc).toContain("/session/timeline");
    expect(doc).toContain("/session/shopping");
    expect(doc).toContain("/session/kitchen");
    expect(visualDoc).toContain("/session/review");
    expect(doc).toContain("/?calculator=1");
    expect(minimalDoc).toContain("The DoughTools logo points to `/`");
    expect(visualDoc).toContain("does not change dough formulas");
    expect([doc, visualDoc, minimalDoc].join("\n")).not.toMatch(/cloud sync is active|Google indexing is enabled|analytics added|tracking added/i);
  });

  it("keeps the homepage primary and secondary CTAs pointed at the approved targets", () => {
    const homepage = source("app/page.tsx");

    expect(homepageContent.hero.primaryCta.href).toBe("/session/start");
    expect(homepageContent.hero.secondaryCta.href).toBe("/?calculator=1");
    expect(homepage).toContain("href={homepageContent.hero.primaryCta.href}");
    expect(homepage).not.toContain("href={homepageContent.hero.secondaryCta.href}");
    expect(homepage).not.toContain("Learn how it works");
  });

  it("restores a compact Tools menu that opens the existing calculator route", () => {
    const header = source("components/GlobalToolNavigation.tsx");
    const homepage = source("app/page.tsx");

    expect(header).toContain("<details");
    expect(header).toContain("Tools");
    expect(header).toContain("Pizza dough calculator");
    expect(header).toContain("Calculate flour, water, salt and yeast.");
    expect(header).toContain('href="/?calculator=1"');
    expect(homepage).toContain("calculatorViewFor");
    expect(homepage).toContain('params.calculator !== undefined) return "entry"');
    expect(homepage).toContain("return <HomeCalculatorWorkspace variant={calculatorView} />");
    expect(homepageContent.hero.secondaryCta.href).toBe("/?calculator=1");
  });

  it("opens the Tools calculator link into a focused existing calculator entry view", () => {
    const homepage = source("app/page.tsx");
    const calculatorWorkspace = source("components/HomeCalculatorWorkspace.tsx");

    expect(homepage).toContain('if (keys.length === 1 && params.calculator !== undefined) return "entry"');
    expect(homepage).toContain("return <HomeCalculatorWorkspace variant={calculatorView} />");
    expect(calculatorWorkspace).toContain('variant?: "full" | "entry"');
    expect(calculatorWorkspace).toContain('const focusedEntry = variant === "entry"');
    expect(calculatorWorkspace).toContain("What kind of pizza do you want?");
    expect(calculatorWorkspace).toContain("if (focusedEntry) return;");
    expect(calculatorWorkspace).toContain("const advancedOpen = !focusedEntry &&");
    expect(calculatorWorkspace).toContain('focusedEntry ? "max-w-3xl" : "max-w-6xl"');
    expect(calculatorWorkspace).toContain("{!focusedEntry && (");
    expect(calculatorWorkspace).toContain("lg:grid-cols-[1.2fr_.8fr]");
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

  it("keeps homepage experience card and indicator state tied to the same selected level", () => {
    const guidance = source("components/HomepageGuidanceLevelSection.tsx");

    expect(guidance).toContain("const selected = experienceLevel === level.id");
    expect(guidance).toContain("hasUserSelectedLevel.current");
    expect(guidance).toContain("aria-pressed={selected}");
    expect(guidance).toContain("data-experience-level={level.id}");
    expect(guidance).toContain("data-selected={selected}");
    expect(guidance).toContain("data-active-indicator={selected}");
    expect(guidance).toContain("ACTIVE_DOT_CLASS");
    expect(guidance).toContain("bg-leaf shadow-[0_0_0_3px_rgba(58,163,106,0.18)]");
    expect(guidance).toContain("selected ? `${ACTIVE_DOT_CLASS} opacity-100 scale-100`");
    expect(guidance).toContain("\"scale-0 bg-transparent opacity-0\"");
    expect(guidance).toContain("selectedCardClassByLevel[level.id]");
    expect(guidance).not.toContain("className={`h-3 w-3 rounded-full ${config.markerClassName}`}");
    expect(guidance).not.toContain("data-active-indicator={level.id === \"beginner\"}");
    expect(guidance).not.toContain("bg-ink/15");
  });

  it("uses a stacked mobile homepage experience selector while preserving the desktop three-column layout", () => {
    const guidance = source("components/HomepageGuidanceLevelSection.tsx");

    expect(guidance).toContain("grid grid-cols-1 gap-2 sm:grid-cols-3");
    expect(guidance).toContain("min-h-14");
    expect(guidance).toContain("justify-start");
    expect(guidance).toContain("sm:min-h-16 sm:justify-center");
    expect(guidance).toContain("data-active-indicator={selected}");
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
