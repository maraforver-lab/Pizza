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
import {
  getDoughGuideSessionContext,
  getDoughGuideStepPersonalization,
} from "@/lib/dough-guide-session-context";
import { createPizzaSession } from "@/lib/pizza-session";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const now = new Date("2026-07-11T10:00:00.000Z");

function coldSession() {
  return createPizzaSession({
    id: "dough-guide-cold-session",
    status: "planning",
    currentStep: "recipe",
    experienceLevel: "pizza_nerd",
    pizzaStyle: "home-oven",
    pizzaPreset: "margherita",
    pizzaCount: 8,
    doughBallWeight: 260,
    flour: "tipo-00",
    flourSituation: "has_w_range",
    availableFlourWRanges: ["w_260_300"],
    yeastType: "idy",
    targetEatTime: "2026-07-13T10:00:00.000Z",
    plannedFermentationHours: 48,
    fermentationTemperatureCOverride: 4,
    timeline: {
      targetEatTime: "2026-07-13T10:00:00.000Z",
      steps: [
        { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-11T10:00:00.000Z", status: "todo" },
        { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-11T10:30:00.000Z", status: "todo" },
        { id: "cold-ferment", label: "Cold fermentation", scheduledAt: "2026-07-11T11:00:00.000Z", status: "todo" },
        { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-13T06:00:00.000Z", status: "todo" },
        { id: "room-temperature-rest", label: "Room temperature rest", scheduledAt: "2026-07-13T07:00:00.000Z", status: "todo" },
        { id: "bake-pizza", label: "Bake pizza", scheduledAt: "2026-07-13T10:00:00.000Z", status: "todo" },
      ],
    },
  }, now);
}

function roomSession() {
  return createPizzaSession({
    id: "dough-guide-room-session",
    status: "planning",
    currentStep: "recipe",
    experienceLevel: "beginner",
    pizzaStyle: "pizza-oven",
    pizzaPreset: "margherita",
    pizzaCount: 4,
    doughBallWeight: 260,
    flour: "tipo-00",
    yeastType: "ady",
    targetEatTime: "2026-07-11T18:00:00.000Z",
    fermentationTemperatureCOverride: 22,
  }, now);
}

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
    expect(page).toContain("getActivePizzaSession");
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

    expect(page).not.toMatch(/updatePizzaSession|generateAndSave|mark.*done|completeTimeline|completeKitchen/i);
    expect(content).not.toMatch(/pizzaCount|session\.|recipeSnapshot|yeastAmount|scheduledAt|targetEatTime|fridgeTemperature|roomTemperature|getActivePizzaSession|PizzaSession|260 g|4 °C/);
    expect(content).toContain("Use the ingredient amounts from your recipe");
    expect(content).toContain("Follow your dough plan");
  });

  it("shows a no-session fallback card while preserving the generic guide", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");
    const context = getDoughGuideSessionContext(null, now);

    expect(context.hasActiveSession).toBe(false);
    expect(context.summaryRows).toEqual([]);
    expect(page).toContain("No active Pizza Session");
    expect(page).toContain("You can use this guide without a session.");
    expect(page).toContain('href="/session/start"');
    expect(page).toContain("Start a Pizza Session");
    expect(page).toContain("Continue to {nextStep.actionName}");
  });

  it("builds a compact active-session summary from existing recipe/session values", () => {
    const context = getDoughGuideSessionContext(coldSession(), now);
    const summary = Object.fromEntries(context.summaryRows.map((row) => [row.label, row.value]));

    expect(context.hasActiveSession).toBe(true);
    expect(summary["Dough balls"]).toBe("8 × 260 g");
    expect(summary.Hydration).toBe("64%");
    expect(summary.Flour).toBe("Pizza flour / Tipo 00");
    expect(summary["Flour strength"]).toBe("W 260–300");
    expect(summary.Yeast).toContain("Instant dry yeast");
    expect(summary.Fermentation).toBe("48h cold fermentation");
    expect(summary["Cold temperature"]).toBe("4°C");
    expect(summary["Room-temperature finish"]).toBe("3 h");
    expect(summary.Yeast).not.toMatch(/NaN|Infinity|undefined/);
  });

  it("shows exact measured ingredient quantities from the active Dough Plan on the Measure step", () => {
    const context = getDoughGuideSessionContext(coldSession(), now);
    const measureFacts = getDoughGuideStepPersonalization("measure", context);
    const labels = measureFacts.map((fact) => fact.label);

    expect(labels).toEqual(["Flour", "Water", "Salt", "Yeast — Instant dry yeast", "Total dough"]);
    expect(measureFacts.find((fact) => fact.label === "Flour")?.value).toMatch(/\d+ g/);
    expect(measureFacts.find((fact) => fact.label.startsWith("Yeast"))?.value).toMatch(/\d+\.\d{2} g/);
  });

  it("personalizes relevant dough steps without repeating the full recipe everywhere", () => {
    const context = getDoughGuideSessionContext(coldSession(), now);

    expect(getDoughGuideStepPersonalization("mix-dough", context).map((fact) => fact.label)).toEqual(["Hydration", "Yeast", "Total dough"]);
    expect(getDoughGuideStepPersonalization("divide-dough", context)).toContainEqual({ label: "Divide", value: "Divide into 8 pieces of 260 g." });
    expect(getDoughGuideStepPersonalization("ball-dough", context)).toContainEqual({ label: "Target ball weight", value: "260 g" });
    expect(getDoughGuideStepPersonalization("release-dough-ball", context)).toContainEqual({ label: "Dough ball", value: "Release one 260 g dough ball gently." });
  });

  it("uses cold-fermentation session context without changing Guide copy globally", () => {
    const context = getDoughGuideSessionContext(coldSession(), now);
    const bulk = getDoughGuideStepPersonalization("bulk-ferment", context);
    const proof = getDoughGuideStepPersonalization("proof-dough-balls", context);
    const warm = getDoughGuideStepPersonalization("warm-dough", context);

    expect(context.fermentationType).toBe("cold");
    expect(bulk).toContainEqual({ label: "Environment", value: "Fridge / cold fermentation" });
    expect(proof).toContainEqual({ label: "Environment", value: "Cold fermentation: keep refrigerator-specific guidance from your dough plan." });
    expect(warm).toContainEqual({ label: "Room-temperature finish", value: "3 h" });
    expect(warm).toContainEqual({ label: "Timeline reminder", value: "Move the dough from the refrigerator according to your Timeline." });
  });

  it("uses room-temperature session context without refrigerator-specific personalized guidance", () => {
    const context = getDoughGuideSessionContext(roomSession(), now);
    const proof = getDoughGuideStepPersonalization("proof-dough-balls", context);
    const warm = getDoughGuideStepPersonalization("warm-dough", context);
    const combined = [...proof, ...warm].map((fact) => fact.value).join(" ");

    expect(context.fermentationType).toBe("room");
    expect(context.roomTemperatureCelsius).toBe(22);
    expect(proof).toContainEqual({ label: "Environment", value: "Room-temperature proof: no refrigerator step is needed." });
    expect(warm).toContainEqual({ label: "Room-temperature plan", value: "Keep following the room-temperature proof in your plan." });
    expect(combined).not.toMatch(/Move the dough from the refrigerator|Cold fermentation:/);
  });

  it("omits missing or invalid optional active-session values safely", () => {
    const partial = createPizzaSession({
      id: "dough-guide-partial",
      status: "planning",
      currentStep: "recipe",
      pizzaCount: 2,
      recipeSnapshot: {
        balls: 2,
        ballWeight: 260,
        flourAmount: Number.NaN,
        waterAmount: -10,
        saltAmount: Number.POSITIVE_INFINITY,
        leavenerAmount: undefined,
      },
      timeline: {
        targetEatTime: "not-a-date",
        steps: [
          { id: "mix-dough", label: "Mix dough", scheduledAt: "bad-date", status: "todo" },
          { id: "rest-dough", label: "Rest dough", scheduledAt: "also-bad", status: "todo" },
        ],
      },
    }, now);
    const context = getDoughGuideSessionContext(partial, now);
    const allValues = [...context.summaryRows, ...context.ingredientRows].map((row) => row.value).join(" ");

    expect(context.hasActiveSession).toBe(true);
    expect(allValues).not.toMatch(/NaN|Infinity|undefined|null|bad-date/);
    expect(context.ingredientRows.some((row) => row.label === "Flour")).toBe(false);
    expect(getDoughGuideStepPersonalization("bulk-ferment", context).map((fact) => fact.value).join(" ")).not.toMatch(/fridge|room-temperature/i);
  });

  it("keeps personalization read-only and avoids calculation or completion mutations", () => {
    const adapter = source("lib/dough-guide-session-context.ts");
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(adapter).toContain("buildSessionRecipe(session, now)");
    expect(adapter).not.toMatch(/calculateDoughIngredients|calculateContinuousYeastRecommendation|updatePizzaSession|setActivePizzaSession|localStorage\.setItem|complete|mark.*done/i);
    expect(page).not.toMatch(/updatePizzaSession|setActivePizzaSession|localStorage\.setItem|mark.*done|complete/i);
    expect(adapter).toContain("Flour strength");
    expect(adapter).not.toMatch(/W 220 versus W 340|too weak|too strong|risk|warning/i);
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
