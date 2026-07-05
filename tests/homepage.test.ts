import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homepageContent } from "@/lib/homepage";
import { getDefaultExperienceLevel } from "@/lib/experience-levels";
import { getHomepageExperienceCopy, homepageExperienceCopy } from "@/lib/homepage-experience-copy";
import {
  clearActivePizzaSession,
  createAndSavePizzaSession,
  getActivePizzaSession,
  setActivePizzaSession,
} from "@/lib/pizza-session-storage";
import { MemoryStorage } from "./helpers";

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
    expect(homepageContent.hero.h1).toBe("Pizza night, planned from dough to oven.");
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
    expect(homepageContent.hero.intro).toContain("Tell DoughTools when you want to bake");
    expect(homepageContent.hero.intro).toContain("dough plan");
    expect(homepageContent.hero.intro).toContain("shopping list");
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

  it("renders the full Pizza Session landing page instead of old homepage clutter", () => {
    const homepage = source("app/page.tsx");
    const content = source("lib/homepage.ts");
    const guidance = source("components/HomepageGuidanceLevelSection.tsx");
    const continueCard = source("components/ContinuePizzaSessionCard.tsx");
    const header = source("components/GlobalToolNavigation.tsx");
    const updateNotice = source("components/LatestUpdateNotice.tsx");
    const nextStep = source("components/WorkflowNextStep.tsx");

    expect(content).toContain("Start Pizza Session");
    expect(content).toContain("Pizza-making made simple");
    expect(content).toContain("Pizza night, planned from dough to oven.");
    expect(content).toContain("Tell DoughTools when you want to bake");
    expect(homepage).toContain("ContinuePizzaSessionCard");
    expect(homepage).toContain('variant="hero"');
    expect(homepage).toContain("HomepageGuidanceLevelSection");
    expect(homepage).toContain("HomeCalculatorWorkspace");
    expect(homepage).toContain("calculatorViewFor");
    expect(homepage).toContain('params.calculator === "2" ? "guided" : "entry"');
    expect(homepage).toContain('return "full"');
    expect(homepage).toContain("/images/homepage/hero-desktop-bg.png");
    expect(homepage).toContain("Example session");
    expect(homepage).toContain("Saturday 20:00");
    expect(homepage).toContain("6 × 260 g");
    expect(homepage).toContain("24h cold");
    expect(homepage).toContain("Flour, tomatoes, mozzarella, basil, yeast, olive oil");
    expect(homepage).toContain("Everything you need for a better pizza session");
    expect(homepage).toContain("Get the dough right");
    expect(homepage).toContain("Know when to start");
    expect(homepage).toContain("Stay focused while baking");
    expect(homepage).toContain("Guidance that fits your skill level");
    expect(homepage).toContain("More than a dough calculator");
    expect(homepage).toContain("Normal calculator");
    expect(homepage).toContain("Plans the whole pizza session");
    expect(homepage).toContain("Ready to plan your next pizza night?");
    expect(homepage).toContain("No account needed. Your session is saved locally on this device.");
    expect(homepage).not.toContain("/images/homepage-hero-desktop.png");
    expect(homepage).not.toContain("/images/homepage-hero-mobile.png");
    expect(homepage).toContain("lg:min-h-[42rem]");
    expect(homepage).toContain("hidden w-[64%] lg:block");
    expect(homepage).toContain("object-[68%_center]");
    expect(homepage).toContain("lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,0.82fr)]");
    expect(homepage).toContain("/images/homepage/hero-mobile-bg.png");
    expect(homepage).toContain("sm:hidden");
    expect(homepage).toContain("overflow-x-clip");
    expect(homepage).not.toContain("mt-[35vh]");
    expect(guidance).toContain("Experience level");
    expect(guidance).toContain("EXPERIENCE_LEVELS.map");
    expect(guidance).toContain("writeExperienceLevelPreference");
    expect(continueCard).toContain('variant = "default"');
    expect(continueCard).toContain('variant === "hero"');
    expect(continueCard).toContain("Continue Pizza Session");
    expect(continueCard).toContain("pizzaSessionContinueHref(session)");
    expect(continueCard).toContain("Signed-in users can save an in-progress copy");
    expect(continueCard).toContain("Active pizza session");
    expect(header).toContain("href=\"/\"");
    expect(header).not.toContain("href=\"/account\"");
    expect(header).not.toContain("Your account");
    expect(header).not.toContain("accountActive");
    expect(header).toContain("Tools");
    expect(header).toContain("Guide");
    expect(header).toContain("Guide and glossary");
    expect(header).toContain("Learn terminology, flour strength and dough principles.");
    expect(header).toContain("Pizza Troubleshooting Guide");
    expect(header).toContain("Fix common dough, topping and baking problems.");
    expect(header).toContain('href="/guide/pizza-troubleshooting"');
    expect(header).toContain("aria-label=\"Guide menu\"");
    expect(header).toContain("setGuideMenuOpen(false)");
    expect(header).toContain("Lab");
    expect(header).toContain("About");
    expect(header).toContain("Start Pizza Session");
    expect(header).toContain("Pizza dough calculator");
    expect(header).toContain("Calculate flour, water, salt and yeast.");
    expect(header).toContain("Calculator v1");
    expect(header).toContain("Full-control planning lab for dough variables and risk.");
    expect(header).toContain('href="/?calculator=1"');
    expect(header).toContain("Calculator v2");
    expect(header).toContain("Guided recommendation from bake time and ingredients.");
    expect(header).toContain('href="/?calculator=2"');
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

  it("hides Continue Pizza Session after the active session pointer is cleared", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "homepage-cleared-active-session",
      status: "reviewing",
      currentStep: "review",
    }, storage);
    setActivePizzaSession(session.id, storage);

    expect(getActivePizzaSession(storage)?.currentStep).toBe("review");

    clearActivePizzaSession(storage);

    expect(getActivePizzaSession(storage)).toBeUndefined();
    expect(homepageContent.hero.primaryCta.label).toBe("Start Pizza Session");
    expect(source("components/ContinuePizzaSessionCard.tsx")).toContain("if (!ready || (!session && !cloudSession)) return null");
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
    expect(header).toContain("Calculator v1");
    expect(header).toContain("Full-control planning lab for dough variables and risk.");
    expect(header).toContain('href="/?calculator=1"');
    expect(header).toContain("Calculator v2");
    expect(header).toContain("Guided recommendation from bake time and ingredients.");
    expect(header).toContain('href="/?calculator=2"');
    expect(homepage).toContain("calculatorViewFor");
    expect(homepage).toContain('params.calculator === "2" ? "guided" : "entry"');
    expect(homepage).toContain("return <HomeCalculatorWorkspace variant={calculatorView} />");
    expect(homepageContent.hero.secondaryCta.href).toBe("/?calculator=1");
  });

  it("opens the Tools calculator link into a focused existing calculator entry view", () => {
    const homepage = source("app/page.tsx");
    const calculatorWorkspace = source("components/HomeCalculatorWorkspace.tsx");

    expect(homepage).toContain('if (keys.length === 1 && params.calculator !== undefined) return params.calculator === "2" ? "guided" : "entry"');
    expect(homepage).toContain("return <HomeCalculatorWorkspace variant={calculatorView} />");
    expect(calculatorWorkspace).toContain('variant?: "full" | "entry" | "guided"');
    expect(calculatorWorkspace).toContain('const focusedEntry = variant === "entry"');
    expect(calculatorWorkspace).toContain('const guidedEntry = variant === "guided"');
    expect(calculatorWorkspace).toContain("const standaloneEntry = focusedEntry || guidedEntry");
    expect(calculatorWorkspace).toContain("When do you want to bake pizza?");
    expect(calculatorWorkspace).toContain("if (standaloneEntry) return;");
    expect(calculatorWorkspace).toContain("const advancedOpen = !standaloneEntry &&");
    expect(calculatorWorkspace).toContain("mx-auto max-w-6xl");
    expect(calculatorWorkspace).toContain("{!standaloneEntry && (");
    expect(calculatorWorkspace).toContain("lg:grid-cols-[1.2fr_.8fr]");
    expect(calculatorWorkspace).toContain("xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]");
    expect(calculatorWorkspace).toContain("AdvancedCalculatorStandaloneControls");
    expect(calculatorWorkspace).toContain("AdvancedCalculatorPlanningShell");
    expect(calculatorWorkspace).toContain("AdvancedCalculatorTopSummary");
    expect(calculatorWorkspace).toContain("Top summary bar");
    expect(calculatorWorkspace).toContain("Planning Engine v1");
    expect(calculatorWorkspace).toContain("Results and recommendations");
    expect(calculatorWorkspace).toContain("Ingredient amounts");
    expect(calculatorWorkspace).toContain("Plan risk summary");
    expect(calculatorWorkspace).toContain("What to adjust first");
    expect(calculatorWorkspace).toContain("Dough formula fit");
    expect(calculatorWorkspace).toContain("Hydration, salt &amp; oven fit");
    expect(calculatorWorkspace).toContain("Planning warnings");
    expect(calculatorWorkspace).toContain("Start window");
    expect(calculatorWorkspace).toContain("When to start");
    expect(calculatorWorkspace).toContain("Fermentation setup");
    expect(calculatorWorkspace).toContain("Recommended setup");
    expect(calculatorWorkspace).toContain("Dough style guidance");
    expect(calculatorWorkspace).toContain("Flour guidance");
    expect(calculatorWorkspace).toContain("Yeast guidance");
    expect(calculatorWorkspace).toContain("Planning summary");
    expect(calculatorWorkspace).toContain("Variables that affect this plan");
    expect(calculatorWorkspace).toContain("Temperature guidance");
    expect(calculatorWorkspace).toContain("buildPlanningResult(planningInputFromCalculator");
    expect(calculatorWorkspace).toContain("Secondary guidance is available below without turning this into a full workflow.");
  });

  it("opens the Tools Calculator v2 link into a guided standalone calculator view without changing Pizza Session", () => {
    const header = source("components/GlobalToolNavigation.tsx");
    const homepage = source("app/page.tsx");
    const calculatorWorkspace = source("components/HomeCalculatorWorkspace.tsx");
    const sessionStart = source("app/session/start/page.tsx");

    expect(header).toContain("Calculator v2");
    expect(header).toContain("Guided recommendation from bake time and ingredients.");
    expect(header).toContain('href="/?calculator=2"');
    expect(homepage).toContain('params.calculator === "2" ? "guided" : "entry"');
    expect(calculatorWorkspace).toContain('variant?: "full" | "entry" | "guided"');
    expect(calculatorWorkspace).toContain("GuidedCalculatorV2");
    expect(calculatorWorkspace).toContain("Calculator v2");
    expect(calculatorWorkspace).toContain("Guided dough plan");
    expect(calculatorWorkspace).toContain("Starting information");
    expect(calculatorWorkspace).toContain("Bake date");
    expect(calculatorWorkspace).toContain("Bake time");
    expect(calculatorWorkspace).toContain("Default for Calculator v2.");
    expect(calculatorWorkspace).toContain("Available yeast options");
    expect(calculatorWorkspace).toContain("Available flour options / active flour");
    expect(calculatorWorkspace).toContain("Current active flour");
    expect(calculatorWorkspace).toContain("Available flour recommendation");
    expect(calculatorWorkspace).toContain("Recommended flour");
    expect(calculatorWorkspace).toContain("If your active flour is not ideal");
    expect(calculatorWorkspace).toContain("Available choices considered");
    expect(calculatorWorkspace).toContain("availableFlourRecommendation");
    expect(calculatorWorkspace).toContain("Number of pizzas / dough balls");
    expect(calculatorWorkspace).toContain("Dough ball weight");
    expect(calculatorWorkspace).toContain("Estimated pizza diameter");
    expect(calculatorWorkspace).toContain("Fermentation place and temperature");
    expect(calculatorWorkspace).toContain("Advanced tuning");
    expect(calculatorWorkspace).toContain("One recommended plan");
    expect(calculatorWorkspace).toContain("Recommended dough plan");
    expect(calculatorWorkspace).toContain("Ingredient amounts");
    expect(calculatorWorkspace).toContain("What to adjust first");
    expect(calculatorWorkspace).toContain("Key guidance");
    expect(calculatorWorkspace).toContain("existing calculator and planning engine");
    expect(calculatorWorkspace).not.toContain("Pizza Session integration");
    expect(sessionStart).not.toContain("GuidedCalculatorV2");
    expect(sessionStart).not.toContain("Calculator v2");
    expect(sessionStart).not.toContain("One recommended plan");
    expect(sessionStart).not.toContain("Available flour recommendation");
  });

  it("adds a standalone advanced calculator variable view without changing Pizza Session", () => {
    const calculatorWorkspace = source("components/HomeCalculatorWorkspace.tsx");
    const sessionStart = source("app/session/start/page.tsx");

    expect(calculatorWorkspace).toContain("AdvancedCalculatorStandaloneControls");
    expect(calculatorWorkspace).toContain("Calculator v1");
    expect(calculatorWorkspace).toContain("Full-control lab");
    expect(calculatorWorkspace).toContain("Top summary bar");
    expect(calculatorWorkspace).toContain("Essential setup");
    expect(calculatorWorkspace).toContain("Formula tuning");
    expect(calculatorWorkspace).toContain("Bake target");
    expect(calculatorWorkspace).toContain("Pizza style");
    expect(calculatorWorkspace).toContain("Pizza amount");
    expect(calculatorWorkspace).toContain("Dough formula");
    expect(calculatorWorkspace).toContain("Dough plan parameters");
    expect(calculatorWorkspace).toContain("Bake date");
    expect(calculatorWorkspace).toContain("Bake time");
    expect(calculatorWorkspace).toContain("Available time");
    expect(calculatorWorkspace).toContain("Recommendations use your actual time until bake.");
    expect(calculatorWorkspace).toContain("Presets are only shortcuts — 8h, 10h, 26h or 41h plans are valid too.");
    expect(calculatorWorkspace).toContain("Dough balls / pizzas");
    expect(calculatorWorkspace).toContain("Dough ball weight");
    expect(calculatorWorkspace).toContain("Total dough");
    expect(calculatorWorkspace).toContain("Hydration");
    expect(calculatorWorkspace).toContain("Salt %");
    expect(calculatorWorkspace).toContain("Yeast type");
    expect(calculatorWorkspace).toContain("Oven type");
    expect(calculatorWorkspace).toContain("Dough type / style");
    expect(calculatorWorkspace).toContain("Dough style target");
    expect(calculatorWorkspace).toContain("Fermentation mode");
    expect(calculatorWorkspace).toContain("These modes are planning shortcuts and reference ranges.");
    expect(calculatorWorkspace).toContain("adapts to the real available time from your bake date and time");
    expect(calculatorWorkspace).toContain("Room temperature");
    expect(calculatorWorkspace).toContain("Fridge temperature");
    expect(calculatorWorkspace).toContain("Flour type / suitability");
    expect(calculatorWorkspace).toContain("Mixing method");
    expect(calculatorWorkspace).toContain("Hand mixing");
    expect(calculatorWorkspace).toContain("Stand mixer / kitchen machine");
    expect(calculatorWorkspace).toContain("Spiral mixer");
    expect(calculatorWorkspace).toContain("Target dough temperature");
    expect(calculatorWorkspace).toContain("Mixer friction heat");
    expect(calculatorWorkspace).toContain("Protein %");
    expect(calculatorWorkspace).toContain("W-value");
    expect(calculatorWorkspace).toContain("Show optional fields");
    expect(calculatorWorkspace).toContain("These values are optional and do not change the ingredient formula in v1.");
    expect(calculatorWorkspace).toContain("DoughTools does not pretend exact flour behavior from these values yet.");
    expect(calculatorWorkspace).toContain('useState<PlanningMixingMethod>("hand_mixing")');
    expect(calculatorWorkspace).toContain("useState(22)");
    expect(calculatorWorkspace).toContain("useState(4)");
    expect(calculatorWorkspace).toContain('useState("18:00")');
    expect(calculatorWorkspace).toContain("defaultBakeDateValue");
    expect(calculatorWorkspace).toContain("optionalPlanningNumber(targetDoughTemperature)");
    expect(calculatorWorkspace).toContain("optionalPlanningNumber(mixerFrictionHeat)");
    expect(calculatorWorkspace).toContain("planningMixingMethod");
    expect(calculatorWorkspace).toContain("planningRoomTemperature");
    expect(calculatorWorkspace).toContain("planningFridgeTemperature");
    expect(calculatorWorkspace).toContain("Ingredient amounts, the main risk and the next adjustment stay upfront.");
    expect(calculatorWorkspace).toContain("Details / guidance");
    expect(calculatorWorkspace).toContain("Open advanced guidance cards");
    expect(calculatorWorkspace).toContain("combinedRiskSummary");
    expect(calculatorWorkspace).toContain("Plan risk summary");
    expect(calculatorWorkspace).toContain("RiskBadge");
    expect(calculatorWorkspace).toContain("guidanceCardClasses");
    expect(calculatorWorkspace).toContain("Overall risk");
    expect(calculatorWorkspace).toContain("Main reason");
    expect(calculatorWorkspace).toContain("Suggested first adjustment");
    expect(calculatorWorkspace).toContain("formulaFitGuidance");
    expect(calculatorWorkspace).toContain("Overall formula fit");
    expect(calculatorWorkspace).toContain("Hydration fit");
    expect(calculatorWorkspace).toContain("Salt fit");
    expect(calculatorWorkspace).toContain("Oven fit");
    expect(calculatorWorkspace).toContain("startWindowRecommendation");
    expect(calculatorWorkspace).toContain("Recommended window");
    expect(calculatorWorkspace).toContain("Broad start range");
    expect(calculatorWorkspace).toContain("Window fit");
    expect(calculatorWorkspace).toContain("Window risk");
    expect(calculatorWorkspace).toContain("Available time until bake");
    expect(calculatorWorkspace).toContain("Selected setup fit");
    expect(calculatorWorkspace).toContain("Risk level");
    expect(calculatorWorkspace).toContain("planningFermentationModeFromRecipe");
    expect(calculatorWorkspace).toContain("fermentationSetupRecommendation");
    expect(calculatorWorkspace).toContain("doughTypeGuidance");
    expect(calculatorWorkspace).toContain("Selected dough type");
    expect(calculatorWorkspace).toContain("Style fit");
    expect(calculatorWorkspace).toContain("Style risk");
    expect(calculatorWorkspace).toContain("flourGuidance");
    expect(calculatorWorkspace).toContain("Flour risk");
    expect(calculatorWorkspace).toContain("Advanced context");
    expect(calculatorWorkspace).toContain("proteinPercent: optionalPlanningNumber(proteinPercent)");
    expect(calculatorWorkspace).toContain("wValue: optionalPlanningNumber(wValue)");
    expect(calculatorWorkspace).toContain("yeastGuidance");
    expect(calculatorWorkspace).toContain("Broad fit / risk");
    expect(calculatorWorkspace).toContain("Fresh yeast equivalent");
    expect(calculatorWorkspace).toContain("calculatedYeastGrams: recipe.leavener");
    expect(calculatorWorkspace).toContain("calculatedFlourGrams: recipe.flour");
    expect(sessionStart).not.toContain("AdvancedCalculatorStandaloneControls");
    expect(sessionStart).not.toContain("Plan risk summary");
    expect(sessionStart).not.toContain("What to adjust first");
    expect(sessionStart).not.toContain("Dough formula fit");
    expect(sessionStart).not.toContain("Hydration, salt &amp; oven fit");
    expect(sessionStart).not.toContain("Start window");
    expect(sessionStart).not.toContain("When to start");
    expect(sessionStart).not.toContain("Fermentation setup");
    expect(sessionStart).not.toContain("Dough style guidance");
    expect(sessionStart).not.toContain("Flour guidance");
    expect(sessionStart).not.toContain("Yeast guidance");
    expect(sessionStart).not.toContain("planningMixingMethod");
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

  it("keeps the homepage hero image, CTA and experience selector balanced responsively", () => {
    const homepage = source("app/page.tsx");

    expect(homepage).toContain("overflow-x-clip");
    expect(homepage).toContain("lg:min-h-[42rem]");
    expect(homepage).toContain("hidden w-[64%] lg:block");
    expect(homepage).toContain("object-[68%_center]");
    expect(homepage).toContain("lg:grid-cols-[minmax(0,0.92fr)_minmax(24rem,0.82fr)]");
    expect(homepage).toContain("text-[clamp(3.25rem,13vw,5rem)]");
    expect(homepage).toContain("sm:w-auto");
    expect(homepage).toContain("HomepageGuidanceLevelSection");
    expect(homepage).toContain("lg:grid-cols-[0.75fr_1fr]");
    expect(homepage).toContain("sm:grid-cols-3 lg:grid-cols-1");
    expect(homepage).toContain("ContinuePizzaSessionCard");
    expect(homepage).toContain("lg:absolute lg:left-0 lg:top-8");
    expect(homepage).toContain("sm:hidden");
    expect(homepage).toContain("sm:grid");
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
