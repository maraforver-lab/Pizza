import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  findPizzaTroubleshootingProblem,
  getPizzaTroubleshootingLevelPresentation,
  getPizzaTroubleshootingCategoryForProblem,
  getSafeDoughGuideReturnPath,
  isPizzaTroubleshootingTopicId,
  pizzaTroubleshootingTopicIds,
  searchPizzaTroubleshootingProblems,
  troubleshootingCategories,
  troubleshootingCategoryMeta,
  troubleshootingSections,
} from "@/lib/pizza-troubleshooting";
import {
  buildPizzaTroubleshootingCategoryHref,
  getPizzaSessionBakingTroubleshootingLink,
  getPizzaSessionToppingsTroubleshootingLink,
} from "@/lib/pizza-session-troubleshooting-links";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const troubleshootingRoute = "app/guide/pizza-troubleshooting/page.tsx";
const troubleshootingClient = "components/guide/PizzaTroubleshootingGuideClient.tsx";
const troubleshootingPageSource = () => `${source(troubleshootingRoute)}\n${source(troubleshootingClient)}`;
const patch304TopicIds = [
  "dough-dry-skin",
  "dough-balls-spread-flat",
  "dough-underproofed",
  "dough-overproofed",
  "dough-too-cold",
  "dough-too-warm",
  "weak-gluten-structure",
  "dough-collapses-after-rising",
] as const;

const patch305ShapingTopicIds = [
  "dough-sticks-to-work-surface",
  "pizza-center-too-thin",
  "pizza-loses-round-shape",
  "rim-flattened-during-shaping",
  "dough-stretches-unevenly",
  "dough-tears-moving-to-peel",
] as const;

const patch305LaunchingTopicIds = [
  "pizza-sticks-to-peel",
  "pizza-folds-during-launch",
  "toppings-slide-during-launch",
  "too-much-flour-under-pizza",
  "pizza-stretches-on-peel",
  "launch-takes-too-long",
] as const;

const patch305TopicIds = [...patch305ShapingTopicIds, ...patch305LaunchingTopicIds] as const;

const patch306NewBakingTopicIds = [
  "gummy-layer-under-toppings",
  "top-burns-before-bottom",
  "rim-does-not-rise",
  "pizza-bakes-unevenly",
  "center-raw-or-doughy",
  "oven-loses-heat-between-pizzas",
] as const;

const patch306MergedBakingTopicIds = ["base-burns-underneath", "home-oven-pale-soft"] as const;

const patch306BakingTopicIds = [...patch306NewBakingTopicIds, ...patch306MergedBakingTopicIds] as const;

const patch306ToppingTopicIds = [
  "cheese-burns-too-early",
  "cheese-releases-oil",
  "toppings-slide-after-baking",
  "sauce-makes-center-watery",
  "mozzarella-releases-water",
  "pizza-overloaded-with-toppings",
  "toppings-cook-unevenly",
  "rim-scorched-by-sauce-or-cheese",
] as const;

const patch306NewTopicIds = [...patch306NewBakingTopicIds, ...patch306ToppingTopicIds] as const;

const originalTopicIds = [
  "dough-not-rising",
  "dough-too-sticky",
  "dough-springs-back",
  "dough-tears",
  "pizza-sticks-to-peel",
  "pizza-soggy-middle",
  "crust-burns-middle-doughy",
  "base-burns-underneath",
  "toppings-release-water",
  "home-oven-pale-soft",
] as const;

const allTopics = () => troubleshootingSections.flatMap((section) => section.problems);

describe("Pizza Troubleshooting Guide", () => {
  it("adds the standalone guide route with a symptom-first hero", () => {
    expect(existsSync(join(process.cwd(), troubleshootingRoute))).toBe(true);

    const page = troubleshootingPageSource();

    expect(page).toContain("Pizza Troubleshooting");
    expect(page).toContain("What went wrong with your pizza?");
    expect(page).toContain("Choose the symptom that looks closest to yours");
    expect(page).toContain("Find my problem");
    expect(page).toContain("Browse all categories");
  });

  it("renders the five workflow troubleshooting categories", () => {
    expect(troubleshootingCategories.map((category) => category.id)).toEqual([
      "dough-fermentation",
      "shaping",
      "launching",
      "baking",
      "toppings",
    ]);
    expect(troubleshootingSections.map((section) => section.title)).toEqual([
      "Dough & fermentation",
      "Stretching & shaping",
      "Launching",
      "Baking",
      "Toppings & cheese",
    ]);
    expect(troubleshootingSections.every((section) => section.problems.length > 0)).toBe(true);
    expect(troubleshootingCategoryMeta.baking.plainDescription).toContain("base");
    expect(troubleshootingCategoryMeta.launching.icon).toBe("forward");
  });

  it("keeps the existing ten problem titles and adds the Patch 304, Patch 305 and Patch 306 topics", () => {
    const topics = allTopics();
    const titles = topics.map((problem) => problem.title);

    expect(titles).toContain("Dough is not rising");
    expect(titles).toContain("Dough is too sticky");
    expect(titles).toContain("Dough develops a dry skin");
    expect(titles).toContain("Dough balls spread flat");
    expect(titles).toContain("Dough is underproofed");
    expect(titles).toContain("Dough is overproofed");
    expect(titles).toContain("Dough is too cold to stretch");
    expect(titles).toContain("Dough is too warm and loose");
    expect(titles).toContain("Weak gluten structure");
    expect(titles).toContain("Dough collapses after rising");
    expect(titles).toContain("Dough springs back");
    expect(titles).toContain("Dough tears or gets holes");
    expect(titles).toContain("Dough sticks to the work surface");
    expect(titles).toContain("Center becomes too thin");
    expect(titles).toContain("Pizza loses its round shape");
    expect(titles).toContain("Rim gets flattened during shaping");
    expect(titles).toContain("Dough stretches unevenly");
    expect(titles).toContain("Dough tears while moving to the peel");
    expect(titles).toContain("Pizza sticks to the peel");
    expect(titles).toContain("Pizza folds during launch");
    expect(titles).toContain("Toppings slide during launch");
    expect(titles).toContain("Too much flour or semolina burns underneath");
    expect(titles).toContain("Pizza stretches out of shape on the peel");
    expect(titles).toContain("Launch takes too long");
    expect(titles).toContain("Pizza is soggy in the middle");
    expect(titles).toContain("Crust burns but middle is doughy");
    expect(titles).toContain("Base burns underneath");
    expect(titles).toContain("Gummy layer under the toppings");
    expect(titles).toContain("Top burns before the bottom is ready");
    expect(titles).toContain("Rim does not rise");
    expect(titles).toContain("Pizza bakes unevenly");
    expect(titles).toContain("Center stays raw or doughy");
    expect(titles).toContain("Oven loses heat between pizzas");
    expect(titles).toContain("Toppings release too much water");
    expect(titles).toContain("Cheese burns before the pizza is ready");
    expect(titles).toContain("Cheese releases oil");
    expect(titles).toContain("Toppings slide off after baking");
    expect(titles).toContain("Sauce makes the center watery");
    expect(titles).toContain("Fresh mozzarella releases too much water");
    expect(titles).toContain("Pizza is overloaded with toppings");
    expect(titles).toContain("Toppings cook unevenly");
    expect(titles).toContain("Rim is scorched by sauce or cheese");
    expect(titles).toContain("Home oven pizza is pale or soft");
    expect(pizzaTroubleshootingTopicIds).toHaveLength(43);
    expect(new Set(pizzaTroubleshootingTopicIds).size).toBe(pizzaTroubleshootingTopicIds.length);
    for (const id of originalTopicIds) {
      expect(pizzaTroubleshootingTopicIds).toContain(id);
    }
    for (const id of patch304TopicIds) {
      expect(pizzaTroubleshootingTopicIds).toContain(id);
    }
    for (const id of patch305TopicIds) {
      expect(pizzaTroubleshootingTopicIds).toContain(id);
    }
    for (const id of patch306NewTopicIds) {
      expect(pizzaTroubleshootingTopicIds).toContain(id);
    }
    expect(pizzaTroubleshootingTopicIds).not.toContain("bottom-pale-and-soft");
    expect(pizzaTroubleshootingTopicIds).not.toContain("bottom-burns-before-top");
  });

  it("places Patch 304 topics only under Dough & fermentation without adding categories", () => {
    const doughSection = troubleshootingSections.find((section) => section.id === "dough-fermentation");
    if (!doughSection) throw new Error("Expected dough-fermentation section");

    expect(troubleshootingSections.map((section) => section.id)).toEqual([
      "dough-fermentation",
      "shaping",
      "launching",
      "baking",
      "toppings",
    ]);
    for (const id of patch304TopicIds) {
      expect(doughSection.problems.map((problem) => problem.id)).toContain(id);
      const owningSections = troubleshootingSections.filter((section) => section.problems.some((problem) => problem.id === id));
      expect(owningSections.map((section) => section.id)).toEqual(["dough-fermentation"]);
    }
  });

  it("places Patch 305 topics only under Stretching & shaping and Launching without adding categories", () => {
    const shapingSection = troubleshootingSections.find((section) => section.id === "shaping");
    const launchingSection = troubleshootingSections.find((section) => section.id === "launching");
    if (!shapingSection || !launchingSection) throw new Error("Expected shaping and launching sections");

    expect(troubleshootingSections.map((section) => section.id)).toEqual([
      "dough-fermentation",
      "shaping",
      "launching",
      "baking",
      "toppings",
    ]);
    for (const id of patch305ShapingTopicIds) {
      expect(shapingSection.problems.map((problem) => problem.id)).toContain(id);
      const owningSections = troubleshootingSections.filter((section) => section.problems.some((problem) => problem.id === id));
      expect(owningSections.map((section) => section.id)).toEqual(["shaping"]);
    }
    for (const id of patch305LaunchingTopicIds) {
      expect(launchingSection.problems.map((problem) => problem.id)).toContain(id);
      const owningSections = troubleshootingSections.filter((section) => section.problems.some((problem) => problem.id === id));
      expect(owningSections.map((section) => section.id)).toEqual(["launching"]);
    }
    expect(pizzaTroubleshootingTopicIds.filter((id) => id === "pizza-sticks-to-peel")).toHaveLength(1);
  });

  it("places Patch 306 baking and topping topics in the existing Baking and Toppings sections", () => {
    const bakingSection = troubleshootingSections.find((section) => section.id === "baking");
    const toppingsSection = troubleshootingSections.find((section) => section.id === "toppings");
    if (!bakingSection || !toppingsSection) throw new Error("Expected baking and toppings sections");

    expect(troubleshootingSections.map((section) => section.id)).toEqual([
      "dough-fermentation",
      "shaping",
      "launching",
      "baking",
      "toppings",
    ]);
    expect(bakingSection.problems).toHaveLength(10);
    expect(toppingsSection.problems).toHaveLength(9);

    for (const id of patch306BakingTopicIds) {
      expect(bakingSection.problems.map((problem) => problem.id)).toContain(id);
      const owningSections = troubleshootingSections.filter((section) => section.problems.some((problem) => problem.id === id));
      expect(owningSections.map((section) => section.id)).toEqual(["baking"]);
    }
    for (const id of patch306ToppingTopicIds) {
      expect(toppingsSection.problems.map((problem) => problem.id)).toContain(id);
      const owningSections = troubleshootingSections.filter((section) => section.problems.some((problem) => problem.id === id));
      expect(owningSections.map((section) => section.id)).toEqual(["toppings"]);
    }
  });

  it("exposes stable baking and toppings anchors for Pizza Session contextual help", () => {
    const page = troubleshootingPageSource();

    expect(buildPizzaTroubleshootingCategoryHref("baking")).toBe("/guide/pizza-troubleshooting#baking");
    expect(buildPizzaTroubleshootingCategoryHref("toppings")).toBe("/guide/pizza-troubleshooting#toppings");
    expect(getPizzaSessionBakingTroubleshootingLink().href).toBe("/guide/pizza-troubleshooting#baking");
    expect(getPizzaSessionToppingsTroubleshootingLink().href).toBe("/guide/pizza-troubleshooting#toppings");
    expect(troubleshootingCategories.map((category) => category.id)).toContain("baking");
    expect(troubleshootingCategories.map((category) => category.id)).toContain("toppings");
    expect(troubleshootingSections.map((section) => section.id)).toContain("baking");
    expect(troubleshootingSections.map((section) => section.id)).toContain("toppings");
    expect(page).toContain("window.location.hash");
    expect(page).toContain("scroll-mt-24");
  });

  it("uses compact problem cards and one focused problem detail pattern", () => {
    const page = troubleshootingPageSource();
    const firstProblem = troubleshootingSections[0].problems[0];

    expect(firstProblem.shortSymptom).toBeTruthy();
    expect(page).toContain("function ProblemCard");
    expect(page).toContain("Diagnose this problem");
    expect(page).toContain("function ProblemDetail");
    expect(page).toContain("What to do now");
    expect(page).toContain("Why this probably happened");
    expect(page).toContain("How to tell");
    expect(page).toContain("Change this next time");
    expect(page).toContain("Quick check:");
    expect(page).not.toContain("modeLabel");
  });

  it("adds a problem finder, symptom search and concise diagnostic guidance", () => {
    const page = troubleshootingPageSource();

    expect(page).toContain("Problem finder");
    expect(page).toContain("Start with what you can see.");
    expect(page).toContain("hasActiveFilter");
    expect(page).toContain("This keeps the guide focused so you do not have to scroll through all 43 problems at once.");
    expect(page).toContain("Describe the problem");
    expect(page).toContain("No exact match found.");
    expect(page).toContain("Clear search");
    expect(page).toContain("How to troubleshoot");
    expect(page).toContain("Make one careful change.");
    expect(page).toContain("Record what improved on the next bake.");
  });

  it("keeps related guide links restrained and internal", () => {
    const page = troubleshootingPageSource();

    expect(page).toContain("Keep learning after the diagnosis");
    expect(page).toContain('href: "/guides/dough"');
    expect(page).toContain('href: "/guide"');
    expect(page).toContain('href: "/ovens"');
    expect(page).toContain('href: "/session/start"');
  });

  it("uses local images and CSS-based diagnostic diagrams without remote images", () => {
    const page = troubleshootingPageSource();

    expect(page).toContain('import Image from "next/image"');
    expect(page).toContain("role=\"img\"");
    expect(page).toContain("aria-label=\"Diagnostic diagram");
    expect(page).toContain("problem.image.src");
    expect(page).not.toContain("http://");
    expect(page).not.toContain("https://");
  });

  it("maps every current topic to a local diagnostic troubleshooting image", () => {
    const page = troubleshootingPageSource();
    const data = source("lib/pizza-troubleshooting.ts");
    const topics = allTopics();

    expect(topics).toHaveLength(43);
    expect(page).toContain("problem.image.src");
    expect(page).toContain("problem.image.alt");
    expect(page).toContain("function DiagnosticComparison");
    expect(page).toContain("<figcaption");
    expect(data).toContain("type PizzaTroubleshootingImage");

    for (const topic of topics) {
      expect(topic.image.src).toMatch(/^\/images\/troubleshooting\/.*\.webp$/);
      expect(topic.image.alt).toBeTruthy();
      expect(topic.image.width).toBe(1200);
      expect(topic.image.height).toBe(800);
      expect(topic.image.caption).toBeTruthy();
      expect(["symptom", "comparison", "corrected-result"]).toContain(topic.image.kind);
      expect(existsSync(join(process.cwd(), "public", topic.image.src))).toBe(true);
      expect(topic.image.src).not.toContain("http://");
      expect(topic.image.src).not.toContain("https://");
    }
  });

  it("adds distinct content and related links for the new dough-fermentation topics", () => {
    const page = troubleshootingPageSource();
    const topics = allTopics();

    expect(page).toContain("Related troubleshooting");
    expect(page).toContain("Related troubleshooting for");
    for (const id of patch304TopicIds) {
      const topic = topics.find((problem) => problem.id === id);
      if (!topic) throw new Error(`Missing ${id}`);
      expect(topic.shortSymptom).toBeTruthy();
      expect(topic.likelyCauses.length).toBeGreaterThanOrEqual(2);
      expect(topic.fixNow.length).toBeGreaterThanOrEqual(1);
      expect(topic.preventNextTime.length).toBeGreaterThanOrEqual(2);
      expect(topic.quickCheck).toBeTruthy();
      expect(topic.title).not.toMatch(/shaping|launch|bake|topping/i);
      for (const relatedId of topic.relatedTopicIds ?? []) {
        expect(isPizzaTroubleshootingTopicId(relatedId)).toBe(true);
        expect(findPizzaTroubleshootingProblem(relatedId)).toBeTruthy();
      }
    }
  });

  it("adds complete content, local images and resolved related links for Patch 305 shaping and launching topics", () => {
    const topics = allTopics();
    const imagePaths = new Set<string>();

    for (const id of patch305TopicIds) {
      const topic = topics.find((problem) => problem.id === id);
      if (!topic) throw new Error(`Missing ${id}`);
      expect(topic.shortSymptom).toBeTruthy();
      expect(topic.likelyCauses.length).toBeGreaterThanOrEqual(2);
      expect(topic.fixNow.length).toBeGreaterThanOrEqual(1);
      expect(topic.preventNextTime.length).toBeGreaterThanOrEqual(2);
      expect(topic.quickCheck).toBeTruthy();
      expect(topic.image.src).toMatch(/^\/images\/troubleshooting\/.*\.webp$/);
      expect(existsSync(join(process.cwd(), "public", topic.image.src))).toBe(true);
      expect(topic.image.width).toBe(1200);
      expect(topic.image.height).toBe(800);
      expect(topic.image.alt).toBeTruthy();
      expect(topic.image.kind).toBe("symptom");
      imagePaths.add(topic.image.src);
      for (const relatedId of topic.relatedTopicIds ?? []) {
        expect(isPizzaTroubleshootingTopicId(relatedId)).toBe(true);
        expect(findPizzaTroubleshootingProblem(relatedId)).toBeTruthy();
      }
    }
    expect(imagePaths.size).toBe(patch305TopicIds.length);
    expect(findPizzaTroubleshootingProblem("pizza-sticks-to-peel")?.problem.image.src).toBe(
      "/images/troubleshooting/pizza-sticks-to-peel.webp",
    );
  });

  it("adds complete content, local images and resolved related links for Patch 306 baking and topping topics", () => {
    const topics = allTopics();
    const imagePaths = new Set<string>();

    for (const id of [...patch306NewTopicIds, ...patch306MergedBakingTopicIds]) {
      const topic = topics.find((problem) => problem.id === id);
      if (!topic) throw new Error(`Missing ${id}`);
      expect(topic.shortSymptom).toBeTruthy();
      expect(topic.symptomDetails).toBeTruthy();
      expect(topic.likelyCauses.length).toBeGreaterThanOrEqual(2);
      expect(topic.fixNow.length).toBeGreaterThanOrEqual(1);
      expect(topic.preventNextTime.length).toBeGreaterThanOrEqual(2);
      expect(topic.quickCheck).toBeTruthy();
      expect(topic.image.src).toMatch(/^\/images\/troubleshooting\/.*\.webp$/);
      expect(existsSync(join(process.cwd(), "public", topic.image.src))).toBe(true);
      expect(topic.image.width).toBe(1200);
      expect(topic.image.height).toBe(800);
      expect(topic.image.alt).toBeTruthy();
      expect(["symptom", "comparison"]).toContain(topic.image.kind);
      imagePaths.add(topic.image.src);
      for (const relatedId of topic.relatedTopicIds ?? []) {
        expect(isPizzaTroubleshootingTopicId(relatedId)).toBe(true);
        expect(findPizzaTroubleshootingProblem(relatedId)).toBeTruthy();
      }
    }
    for (const id of patch306NewTopicIds) {
      const topic = topics.find((problem) => problem.id === id);
      if (!topic) throw new Error(`Missing ${id}`);
      expect(imagePaths.has(topic.image.src)).toBe(true);
    }
  });

  it("keeps Patch 306 baking and topping overlaps distinguishable", () => {
    const gummyLayer = findPizzaTroubleshootingProblem("gummy-layer-under-toppings")?.problem;
    const rawCenter = findPizzaTroubleshootingProblem("center-raw-or-doughy")?.problem;
    const sauceWatery = findPizzaTroubleshootingProblem("sauce-makes-center-watery")?.problem;
    const mozzarellaWater = findPizzaTroubleshootingProblem("mozzarella-releases-water")?.problem;
    const baseBurn = findPizzaTroubleshootingProblem("base-burns-underneath")?.problem;
    const homeOvenPale = findPizzaTroubleshootingProblem("home-oven-pale-soft")?.problem;
    const flourBurn = findPizzaTroubleshootingProblem("too-much-flour-under-pizza")?.problem;
    const topBurns = findPizzaTroubleshootingProblem("top-burns-before-bottom")?.problem;
    const cheeseBurns = findPizzaTroubleshootingProblem("cheese-burns-too-early")?.problem;
    const rimNoRise = findPizzaTroubleshootingProblem("rim-does-not-rise")?.problem;
    const toppingsAfterBake = findPizzaTroubleshootingProblem("toppings-slide-after-baking")?.problem;
    const toppingsDuringLaunch = findPizzaTroubleshootingProblem("toppings-slide-during-launch")?.problem;
    const overloaded = findPizzaTroubleshootingProblem("pizza-overloaded-with-toppings")?.problem;
    const toppingsUneven = findPizzaTroubleshootingProblem("toppings-cook-unevenly")?.problem;

    expect(gummyLayer?.symptomDetails).toContain("unlike a center that is raw all the way through");
    expect(rawCenter?.symptomDetails).toContain("dough itself");
    expect(sauceWatery?.symptomDetails).toContain("sauce layer");
    expect(mozzarellaWater?.quickCheck).toContain("mozzarella pieces");
    expect(baseBurn?.symptomDetails).toContain("bottom-heat");
    expect(homeOvenPale?.symptomDetails).toContain("bottom staying pale and soft");
    expect(flourBurn?.symptomDetails).toContain("bench and peel preparation");
    expect(topBurns?.quickCheck).toContain("top already dark");
    expect(cheeseBurns?.quickCheck).toContain("cheese dark");
    expect(rimNoRise?.symptomDetails).toContain("not the same as dough that never fermented");
    expect(toppingsAfterBake?.symptomDetails).toContain("after baking and serving");
    expect(toppingsDuringLaunch?.symptomDetails).toContain("launch-specific");
    expect(overloaded?.quickCheck).toContain("base stops moving freely");
    expect(toppingsUneven?.quickCheck).toContain("larger or denser toppings");
  });

  it("keeps shaping and launching overlaps distinguishable", () => {
    const workSurface = findPizzaTroubleshootingProblem("dough-sticks-to-work-surface")?.problem;
    const peelStick = findPizzaTroubleshootingProblem("pizza-sticks-to-peel")?.problem;
    const transferTear = findPizzaTroubleshootingProblem("dough-tears-moving-to-peel")?.problem;
    const generalTear = findPizzaTroubleshootingProblem("dough-tears")?.problem;
    const centerThin = findPizzaTroubleshootingProblem("pizza-center-too-thin")?.problem;
    const weakGluten = findPizzaTroubleshootingProblem("weak-gluten-structure")?.problem;
    const roundShape = findPizzaTroubleshootingProblem("pizza-loses-round-shape")?.problem;
    const peelDistortion = findPizzaTroubleshootingProblem("pizza-stretches-on-peel")?.problem;
    const toppingSlide = findPizzaTroubleshootingProblem("toppings-slide-during-launch")?.problem;
    const toppingWater = findPizzaTroubleshootingProblem("toppings-release-water")?.problem;
    const flourBurn = findPizzaTroubleshootingProblem("too-much-flour-under-pizza")?.problem;
    const baseBurn = findPizzaTroubleshootingProblem("base-burns-underneath")?.problem;
    const launchDelay = findPizzaTroubleshootingProblem("launch-takes-too-long")?.problem;

    expect(workSurface?.symptomDetails).toContain("before peel transfer");
    expect(peelStick?.symptomDetails).toContain("peel-stage");
    expect(transferTear?.symptomDetails).toContain("transfer from work surface to peel");
    expect(generalTear?.quickCheck).toContain("weak spot");
    expect(centerThin?.quickCheck).toContain("central area");
    expect(weakGluten?.quickCheck).toContain("thin, elastic membrane");
    expect(roundShape?.quickCheck).toContain("before the dough reaches the peel");
    expect(peelDistortion?.symptomDetails).toContain("after bench shaping");
    expect(toppingSlide?.symptomDetails).toContain("launch-specific");
    expect(toppingWater?.quickCheck).toContain("watery");
    expect(flourBurn?.symptomDetails).toContain("bench and peel preparation");
    expect(baseBurn?.quickCheck).toContain("baking surface");
    expect(launchDelay?.quickCheck).toContain("sitting on the peel");
  });

  it("keeps overlapping dough problems distinguishable", () => {
    const underproofed = findPizzaTroubleshootingProblem("dough-underproofed")?.problem;
    const tooCold = findPizzaTroubleshootingProblem("dough-too-cold")?.problem;
    const overproofed = findPizzaTroubleshootingProblem("dough-overproofed")?.problem;
    const tooWarm = findPizzaTroubleshootingProblem("dough-too-warm")?.problem;
    const weakGluten = findPizzaTroubleshootingProblem("weak-gluten-structure")?.problem;
    const tears = findPizzaTroubleshootingProblem("dough-tears")?.problem;
    const spreadFlat = findPizzaTroubleshootingProblem("dough-balls-spread-flat")?.problem;
    const collapsed = findPizzaTroubleshootingProblem("dough-collapses-after-rising")?.problem;
    const drySkin = findPizzaTroubleshootingProblem("dough-dry-skin")?.problem;

    expect(underproofed?.quickCheck).toContain("indentation");
    expect(tooCold?.quickCheck).toContain("cold in the center");
    expect(overproofed?.quickCheck).toContain("finger indentation");
    expect(tooWarm?.quickCheck).toContain("noticeably warm");
    expect(weakGluten?.quickCheck).toContain("thin, elastic membrane");
    expect(tears?.quickCheck).toContain("weak spot");
    expect(spreadFlat?.quickCheck).toContain("spread again quickly");
    expect(collapsed?.quickCheck).toContain("rise well first");
    expect(drySkin?.quickCheck).toContain("leathery");
    expect(underproofed?.relatedTopicIds).toEqual(["dough-springs-back", "dough-not-rising", "dough-too-cold"]);
    expect(overproofed?.relatedTopicIds).toEqual(["dough-balls-spread-flat", "dough-too-warm", "dough-collapses-after-rising"]);
    expect(weakGluten?.relatedTopicIds).toEqual(["dough-tears", "dough-balls-spread-flat"]);
  });

  it("uses accessible HTML comparison labels instead of text embedded in images", () => {
    const page = troubleshootingPageSource();
    const comparisonTopics = troubleshootingSections
      .flatMap((section) => section.problems)
      .filter((topic) => topic.image.kind === "comparison");

    expect(comparisonTopics.length).toBeGreaterThan(0);
    expect(page).toContain("<dl");
    expect(page).toContain("Problem");
    expect(page).toContain("Better result");
    for (const topic of comparisonTopics) {
      expect(topic.image.comparisonLabels?.problem).toBeTruthy();
      expect(topic.image.comparisonLabels?.better).toBeTruthy();
    }
  });

  it("supports stable topic deep links and invalid-topic fallback", () => {
    const page = troubleshootingPageSource();

    expect(isPizzaTroubleshootingTopicId("dough-too-sticky")).toBe(true);
    expect(isPizzaTroubleshootingTopicId("not-a-topic")).toBe(false);
    expect(findPizzaTroubleshootingProblem("dough-too-sticky")?.problem.title).toBe("Dough is too sticky");
    expect(getPizzaTroubleshootingCategoryForProblem("dough-too-sticky")).toBe("dough-fermentation");
    expect(findPizzaTroubleshootingProblem("not-a-topic")).toBeUndefined();
    expect(page).toContain("searchParams?: Promise<Record<string, string | string[] | undefined>>");
    expect(page).toContain("firstParam(params?.problem) ?? firstParam(params?.topic)");
    expect(page).toContain("isPizzaTroubleshootingTopicId(requestedTopic)");
    expect(page).toContain("buildProblemHref");
    expect(page).toContain("problem-detail");
    expect(page).toContain("id={`topic-${problem.id}`}");
  });

  it("searches by title, symptom phrase, alias, case-insensitive text and category", () => {
    expect(searchPizzaTroubleshootingProblems("sticky dough").map(({ problem }) => problem.id)).toContain("dough-too-sticky");
    expect(searchPizzaTroubleshootingProblems("PALE BASE").map(({ problem }) => problem.id)).toContain("home-oven-pale-soft");
    expect(searchPizzaTroubleshootingProblems("pizza will not launch").map(({ problem }) => problem.id)).toContain("pizza-sticks-to-peel");
    expect(searchPizzaTroubleshootingProblems("milky water").map(({ problem }) => problem.id)).toContain("mozzarella-releases-water");
    expect(searchPizzaTroubleshootingProblems("sticky dough", "baking")).toEqual([]);
    expect(searchPizzaTroubleshootingProblems("", "baking")).toHaveLength(10);
  });

  it("accepts only safe Dough Guide return paths", () => {
    const page = troubleshootingPageSource();

    expect(getSafeDoughGuideReturnPath("/guides/dough?step=mix-dough")).toBe("/guides/dough?step=mix-dough");
    expect(getSafeDoughGuideReturnPath(encodeURIComponent("/guides/dough?step=ball-dough"))).toBe("/guides/dough?step=ball-dough");
    expect(getSafeDoughGuideReturnPath("https://evil.example/guides/dough")).toBeNull();
    expect(getSafeDoughGuideReturnPath("//evil.example/guides/dough")).toBeNull();
    expect(getSafeDoughGuideReturnPath("javascript:alert(1)")).toBeNull();
    expect(getSafeDoughGuideReturnPath("/account")).toBeNull();
    expect(page).toContain("Back to Dough Guide");
    expect(page).toContain("getSafeDoughGuideReturnPath(params?.from)");
  });

  it("links the troubleshooting guide from the existing Guide index", () => {
    const guide = source("app/guide/page.tsx");

    expect(guide).toContain("Pizza Troubleshooting");
    expect(guide).toContain("Find causes and fixes when dough, baking or toppings go wrong.");
    expect(guide).toContain('href: "/guide/pizza-troubleshooting"');
  });

  it("keeps Pizza Session pages free of embedded troubleshooting guide content while allowing contextual links", () => {
    const nonContextualSessionPages = [
      "app/session/start/page.tsx",
      "app/session/recipe/page.tsx",
      "app/session/shopping/page.tsx",
    ];
    const contextualSessionPages = [
      "app/session/timeline/page.tsx",
      "app/session/kitchen/page.tsx",
      "app/session/review/page.tsx",
    ];

    for (const pagePath of nonContextualSessionPages) {
      const page = source(pagePath);
      expect(page).not.toContain("Pizza Troubleshooting Guide");
      expect(page).not.toContain("/guide/pizza-troubleshooting");
    }
    for (const pagePath of contextualSessionPages) {
      const page = source(pagePath);
      expect(page).not.toContain("Pizza Troubleshooting Guide");
      expect(page).toContain("getPizzaSession");
      expect(page).toContain("TroubleshootingLink");
    }
  });

  it("does not render the removed bottom CTA or footer meta area on the troubleshooting page", () => {
    const page = troubleshootingPageSource();
    const data = source("lib/pizza-troubleshooting.ts");

    expect(page).toContain("Pizza Troubleshooting Guide");
    expect(data).toContain("Dough is not rising");
    expect(data).toContain("Home oven pizza is pale or soft");
    expect(page).not.toContain("Plan your next pizza session");
    expect(page).not.toContain("Start Pizza Session");
    expect(page).not.toContain("Creator Mara Forever");
    expect(page).not.toContain("View updates");
    expect(page).not.toContain("AppSignature");
  });

  it("removes the troubleshooting experience-level UI while preserving the reusable data helper", () => {
    const page = troubleshootingPageSource();
    const data = source("lib/pizza-troubleshooting.ts");

    expect(page).not.toContain("readExperienceLevelPreference");
    expect(page).not.toContain("useState<ExperienceLevel>");
    expect(page).not.toContain("writeExperienceLevelPreference");
    expect(page).not.toContain("troubleshootingExperienceLevel");
    expect(page).not.toContain("Guidance mode");
    expect(page).not.toContain("Beginner view");
    expect(data).toContain("normalizeExperienceLevel");
    expect(data).toContain("getPizzaTroubleshootingLevelPresentation");
  });

  it("keeps one topic library and legacy presentation helper without using it on the page", () => {
    const topic = findPizzaTroubleshootingProblem("pizza-overloaded-with-toppings")?.problem;
    const page = troubleshootingPageSource();
    if (!topic) throw new Error("Missing pizza-overloaded-with-toppings");

    const beginner = getPizzaTroubleshootingLevelPresentation(topic, "beginner");
    const enthusiast = getPizzaTroubleshootingLevelPresentation(topic, "enthusiast");
    const pizzaNerd = getPizzaTroubleshootingLevelPresentation(topic, "pizza_nerd");

    expect(beginner.levelLabel).toBe("Beginner");
    expect(enthusiast.levelLabel).toBe("Enthusiast");
    expect(pizzaNerd.levelLabel).toBe("Pizza Nerd");
    expect(beginner.likelyCauses.length).toBeLessThanOrEqual(3);
    expect(beginner.fixNow.length).toBeLessThanOrEqual(3);
    expect(beginner.preventNextTime.length).toBeLessThanOrEqual(3);
    expect(beginner.showMoreDetail).toBe(true);
    expect(enthusiast.likelyCauses).toEqual(topic.likelyCauses);
    expect(enthusiast.fixNow).toEqual(topic.fixNow);
    expect(enthusiast.preventNextTime).toEqual(topic.preventNextTime);
    expect(enthusiast.diagnosticNote).toBe(topic.symptomDetails);
    expect(pizzaNerd.likelyCauses).toEqual(topic.likelyCauses);
    expect(pizzaNerd.relatedTopicIds).toEqual(topic.relatedTopicIds);
    expect(page).not.toContain("getPizzaTroubleshootingLevelPresentation(");
  });

  it("falls back invalid troubleshooting presentation levels to Beginner without changing topic data", () => {
    const topic = findPizzaTroubleshootingProblem("center-raw-or-doughy")?.problem;
    if (!topic) throw new Error("Missing center-raw-or-doughy");

    const invalid = getPizzaTroubleshootingLevelPresentation(topic, "expert");

    expect(invalid.level).toBe("beginner");
    expect(invalid.levelLabel).toBe("Beginner");
    expect(invalid.likelyCauses).toEqual(topic.likelyCauses.slice(0, 3));
    expect(topic.likelyCauses.length).toBeGreaterThanOrEqual(invalid.likelyCauses.length);
    expect(findPizzaTroubleshootingProblem(topic.id)?.problem).toBe(topic);
  });
});
