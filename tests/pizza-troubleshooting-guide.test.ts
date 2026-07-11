import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  findPizzaTroubleshootingProblem,
  getSafeDoughGuideReturnPath,
  isPizzaTroubleshootingTopicId,
  pizzaTroubleshootingTopicIds,
  troubleshootingCategories,
  troubleshootingSections,
} from "@/lib/pizza-troubleshooting";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const troubleshootingRoute = "app/guide/pizza-troubleshooting/page.tsx";
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

    const page = source(troubleshootingRoute);

    expect(page).toContain("Pizza troubleshooting");
    expect(page).toContain("What went wrong with your pizza?");
    expect(page).toContain("Choose the problem that looks closest to yours");
    expect(page).toContain("Pizza usually goes wrong for a reason");
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

  it("uses the requested problem-card fields", () => {
    const page = source(troubleshootingRoute);
    const firstProblem = troubleshootingSections[0].problems[0];

    expect(firstProblem.shortSymptom).toBeTruthy();
    expect(page).toContain("Symptom");
    expect(page).toContain("Likely causes");
    expect(page).toContain("Fix now");
    expect(page).toContain("Prevent next time");
    expect(page).toContain("Quick check:");
  });

  it("adds a quick problem finder and concise diagnostic guidance", () => {
    const page = source(troubleshootingRoute);

    expect(page).toContain("Quick problem finder");
    expect(page).toContain("Start with the symptom area");
    expect(page).toContain("Symptom → likely causes → fix now → prevent next time");
    expect(page).toContain("General diagnostic guidance");
    expect(page).toContain("Change one variable at a time");
    expect(page).toContain("Take notes on dough temperature, fermentation time and oven behavior.");
  });

  it("keeps related guide links restrained and internal", () => {
    const page = source(troubleshootingRoute);

    expect(page).toContain("Related guides");
    expect(page).toContain('href="/guides/dough"');
    expect(page).toContain('href="/guide"');
    expect(page).toContain('href="/calculator/quick"');
  });

  it("uses lightweight CSS-based guide visuals without remote images", () => {
    const page = source(troubleshootingRoute);

    expect(page).toContain('import Image from "next/image"');
    expect(page).toContain("function VisualPanel");
    expect(page).toContain("radial-gradient");
    expect(page).toContain("aria-hidden=\"true\"");
    expect(page).not.toContain("http://");
    expect(page).not.toContain("https://");
  });

  it("maps every current topic to a local diagnostic troubleshooting image", () => {
    const page = source(troubleshootingRoute);
    const data = source("lib/pizza-troubleshooting.ts");
    const topics = allTopics();

    expect(topics).toHaveLength(43);
    expect(page).toContain("problem.image.src");
    expect(page).toContain("problem.image.alt");
    expect(page).toContain("problem.image.kind === \"comparison\"");
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
    const page = source(troubleshootingRoute);
    const topics = allTopics();

    expect(page).toContain("Related troubleshooting");
    expect(page).toContain("Related troubleshooting topics for");
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
    const page = source(troubleshootingRoute);
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
    const page = source(troubleshootingRoute);

    expect(isPizzaTroubleshootingTopicId("dough-too-sticky")).toBe(true);
    expect(isPizzaTroubleshootingTopicId("not-a-topic")).toBe(false);
    expect(findPizzaTroubleshootingProblem("dough-too-sticky")?.problem.title).toBe("Dough is too sticky");
    expect(findPizzaTroubleshootingProblem("not-a-topic")).toBeUndefined();
    expect(page).toContain("searchParams?: Promise<Record<string, string | string[] | undefined>>");
    expect(page).toContain("isPizzaTroubleshootingTopicId(requestedTopic)");
    expect(page).toContain("Selected troubleshooting topic");
    expect(page).toContain("aria-current={active ? \"true\" : undefined}");
    expect(page).toContain("id={`topic-${problem.id}`}");
  });

  it("accepts only safe Dough Guide return paths", () => {
    const page = source(troubleshootingRoute);

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

    expect(guide).toContain("Pizza Troubleshooting Guide");
    expect(guide).toContain(
      "Common pizza dough and baking problems — what causes them, how to fix them now, and how to prevent them next time.",
    );
    expect(guide).toContain('href="/guide/pizza-troubleshooting"');
  });

  it("keeps Pizza Session pages free of troubleshooting guide content", () => {
    const sessionPages = [
      "app/session/start/page.tsx",
      "app/session/recipe/page.tsx",
      "app/session/shopping/page.tsx",
      "app/session/timeline/page.tsx",
      "app/session/kitchen/page.tsx",
      "app/session/review/page.tsx",
    ];

    for (const pagePath of sessionPages) {
      const page = source(pagePath);
      expect(page).not.toContain("Pizza Troubleshooting Guide");
      expect(page).not.toContain("/guide/pizza-troubleshooting");
    }
  });

  it("does not render the removed bottom CTA or footer meta area on the troubleshooting page", () => {
    const page = source(troubleshootingRoute);
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
});
