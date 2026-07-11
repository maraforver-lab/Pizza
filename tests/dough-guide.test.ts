import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOUGH_GUIDE_LEVEL_LABELS,
  DOUGH_GUIDE_STEP_IDS,
  doughGuideSteps,
  getDoughGuideLevelDetails,
  getDoughGuideStepById,
  getDoughGuideStepIndex,
} from "@/lib/dough-guide";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Pizza Dough Guide foundation", () => {
  it("adds the public /guides/dough route with approved heading and metadata", () => {
    expect(existsSync(join(process.cwd(), "app/guides/dough/page.tsx"))).toBe(true);

    const route = source("app/guides/dough/page.tsx");
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(route).toContain("Pizza Dough Guide | DoughTools");
    expect(route).toContain("Learn how to make pizza dough step by step");
    expect(route).toContain("<DoughGuidePageClient />");
    expect(page).toContain("Pizza Dough Guide");
    expect(page).toContain("from the first mix to a dough ball that is ready to stretch");
    expect(page).not.toContain("redirect(");
    expect(page).not.toContain("getActivePizzaSession");
  });

  it("defines all twelve stable Dough Guide step ids in order", () => {
    expect(DOUGH_GUIDE_STEP_IDS).toEqual([
      "prepare",
      "measure",
      "mix-dough",
      "rest-dough",
      "develop-dough",
      "bulk-ferment",
      "divide-dough",
      "ball-dough",
      "proof-dough-balls",
      "warm-dough",
      "check-readiness",
      "release-dough-ball",
    ]);
    expect(doughGuideSteps.map((step) => step.id)).toEqual([...DOUGH_GUIDE_STEP_IDS]);
  });

  it("defaults safely to the first step and resolves valid query step ids", () => {
    expect(getDoughGuideStepById(undefined).id).toBe("prepare");
    expect(getDoughGuideStepById("not-real").id).toBe("prepare");
    expect(getDoughGuideStepIndex("not-real")).toBe(0);
    expect(getDoughGuideStepById("mix-dough").title).toBe("Mix dough");
    expect(getDoughGuideStepIndex("mix-dough")).toBe(2);
  });

  it("keeps the active step hierarchy action-first and mobile-friendly", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page).toContain("Do this now");
    expect(page).toContain("You are ready when");
    expect(page).toContain("Common mistake");
    expect(page).toContain("How to fix it");
    expect(page).toContain("Why this matters");
    expect(page.indexOf("Do this now")).toBeLessThan(page.indexOf("Why this matters"));
    expect(page).toContain("Step {activeIndex + 1} of {doughGuideSteps.length}");
    expect(page).toContain("lg:grid-cols-[20rem_minmax(0,1fr)]");
    expect(page).not.toContain("<table");
  });

  it("uses query-string step navigation with previous and next actions", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page).toContain("useSearchParams");
    expect(page).toContain("searchParams.get(\"step\")");
    expect(page).toContain("getDoughGuideStepById(stepParam)");
    expect(page).toContain("aria-current={active ? \"step\" : undefined}");
    expect(page).toContain("Previous step");
    expect(page).toContain("Continue to {nextStep.actionName}");
    expect(page).toContain("Dough is ready to stretch");
    expect(page).toContain("href={`/guides/dough?step=${nextStep.id}`}");
    expect(page).toContain("href={`/guides/dough?step=${previousStep.id}`}");
  });

  it("provides Beginner, Enthusiast and Pizza Nerd content without a guide-only level state", () => {
    const beginner = getDoughGuideLevelDetails(getDoughGuideStepById("mix-dough"), "beginner").join(" ");
    const enthusiast = getDoughGuideLevelDetails(getDoughGuideStepById("mix-dough"), "enthusiast").join(" ");
    const nerd = getDoughGuideLevelDetails(getDoughGuideStepById("mix-dough"), "pizza_nerd").join(" ");
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(DOUGH_GUIDE_LEVEL_LABELS.beginner).toBe("Beginner guidance");
    expect(DOUGH_GUIDE_LEVEL_LABELS.enthusiast).toBe("Enthusiast guidance");
    expect(DOUGH_GUIDE_LEVEL_LABELS.pizza_nerd).toBe("Pizza Nerd guidance");
    expect(beginner).toContain("Sticky at this stage is normal");
    expect(enthusiast).toContain("Different recipes use different mixing orders");
    expect(nerd).toContain("gluten");
    expect(page).toContain("readExperienceLevelPreference");
    expect(page).toContain("useState<ExperienceLevel>(\"beginner\")");
    expect(page).not.toContain("writeExperienceLevelPreference");
    expect(page).not.toContain("doughGuideExperienceLevel");
  });

  it("keeps step terminology aligned with Timeline and Kitchen actions", () => {
    const titles = doughGuideSteps.map((step) => step.actionName);

    expect(titles).toContain("Mix dough");
    expect(titles).toContain("Rest dough");
    expect(titles).toContain("Bulk fermentation");
    expect(titles).toContain("Ball dough");
    expect(titles).toContain("Prepare for stretching");
  });

  it("keeps readiness comparison stacked and avoids a desktop-only wide table", () => {
    const readiness = getDoughGuideStepById("check-readiness");
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(readiness.readinessStates?.map((state) => state.label)).toEqual(["Underproofed", "Ready", "Overproofed"]);
    expect(readiness.readinessStates?.flatMap((state) => state.signs).join(" ")).toContain("strong immediate spring-back");
    expect(readiness.readinessStates?.flatMap((state) => state.signs).join(" ")).toContain("gentle indentation returns slowly");
    expect(readiness.readinessStates?.flatMap((state) => state.signs).join(" ")).toContain("collapse during handling");
    expect(page).toContain("md:grid-cols-3");
    expect(page).not.toContain("<table");
  });

  it("renders optional local images only when a step has an approved local asset", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");
    const imageSources = doughGuideSteps.map((step) => step.image?.src).filter(Boolean);

    expect(page).toContain("if (!step.image)");
    expect(page).toContain("<Image");
    expect(imageSources.every((src) => src?.startsWith("/dough-guide/"))).toBe(true);
    expect(page).not.toMatch(/https?:\/\//);
  });

  it("does not read or render active Pizza Session quantities or timeline times", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");
    const content = source("lib/dough-guide.ts");

    expect(page).not.toMatch(/pizzaCount|session\.|recipeSnapshot|yeastAmount|scheduledAt|targetEatTime|fridgeTemperature|roomTemperature|getActivePizzaSession|PizzaSession/);
    expect(content).not.toMatch(/pizzaCount|session\.|recipeSnapshot|yeastAmount|scheduledAt|targetEatTime|fridgeTemperature|roomTemperature|getActivePizzaSession|PizzaSession|260 g|4 °C/);
    expect(content).toContain("Use the ingredient amounts from your recipe");
    expect(content).toContain("Follow your dough plan");
  });

  it("links Dough Guide from existing guide navigation while keeping troubleshooting available", () => {
    const header = source("components/GlobalToolNavigation.tsx");
    const guideIndex = source("app/guide/page.tsx");
    const navigation = source("lib/navigation.ts");

    expect(header).toContain("Dough Guide");
    expect(header).toContain('href="/guides/dough"');
    expect(header).toContain("Pizza Troubleshooting Guide");
    expect(header).toContain('href="/guide/pizza-troubleshooting"');
    expect(guideIndex).toContain("Pizza Dough Guide");
    expect(guideIndex).toContain('href="/guides/dough"');
    expect(navigation).toContain('id: "dough-guide"');
    expect(navigation).toContain('href: "/guides/dough"');
  });

  it("preserves Guide dropdown close behavior and disclosure accessibility", () => {
    const header = source("components/GlobalToolNavigation.tsx");
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(header).toContain("setGuideMenuOpen(false)");
    expect(header).toContain("}, [pathname]);");
    expect(header).toContain("guideMenuOpen && !guideMenuRef.current?.contains(target)");
    expect(header).toContain("event.key === \"Escape\"");
    expect(page).toContain("aria-expanded={open}");
    expect(page).toContain("aria-controls={panelId}");
    expect(page).toContain("focus-visible:ring");
  });

  it("keeps Dough Guide scoped before stretching, sauce, toppings and baking", () => {
    const finalStep = getDoughGuideStepById("release-dough-ball");

    expect(finalStep.title).toBe("Release the dough ball for stretching");
    expect(finalStep.readyWhen.join(" ")).toContain("ready to stretch into a pizza base");
    expect(finalStep.doThisNow.join(" ")).toContain("the next action is stretching, which is outside this guide");
  });
});
