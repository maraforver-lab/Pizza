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
  getDoughGuideTroubleshootingLabel,
} from "@/lib/dough-guide";
import {
  DOUGH_STEP_PRIMARY_IMAGES,
  getDoughStepPrimaryImageForBeginnerStep,
  getDoughStepPrimaryImageForTimelineStep,
} from "@/lib/dough-step-images";
import {
  getDoughGuideFlourGuidance,
  getDoughGuideSessionContext,
  getDoughGuideStepFlourGuidance,
  getDoughGuideStepPersonalization,
} from "@/lib/dough-guide-session-context";
import { createPizzaSession } from "@/lib/pizza-session";
import { isPizzaTroubleshootingTopicId } from "@/lib/pizza-troubleshooting";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { metadataForRoute } from "@/lib/seo-config";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const now = new Date("2026-07-11T10:00:00.000Z");

function allGuideVisuals() {
  return doughGuideSteps.flatMap((step) => [
    ...(step.image ? [step.image] : []),
    ...(step.visualSequence?.items ?? []),
    ...(step.visualComparison?.items ?? []),
  ]);
}

function secondaryGuideVisuals() {
  return doughGuideSteps.flatMap((step) => [
    ...(step.visualSequence?.items ?? []),
    ...(step.visualComparison?.items ?? []),
  ]);
}

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

function shortRoomFlourSession() {
  return createPizzaSession({
    id: "dough-guide-short-room-flour-session",
    status: "planning",
    currentStep: "recipe",
    experienceLevel: "beginner",
    pizzaStyle: "pizza-oven",
    pizzaPreset: "margherita",
    pizzaCount: 4,
    doughBallWeight: 260,
    flour: "tipo-00",
    flourSituation: "has_w_range",
    availableFlourWRanges: ["w_180_220"],
    yeastType: "ady",
    targetEatTime: "2026-07-11T16:00:00.000Z",
    fermentationTemperatureCOverride: 22,
  }, now);
}

function seventyTwoHourFlourSession() {
  return createPizzaSession({
    id: "dough-guide-72h-flour-session",
    status: "planning",
    currentStep: "recipe",
    experienceLevel: "pizza_nerd",
    pizzaStyle: "home-oven",
    pizzaPreset: "margherita",
    pizzaCount: 4,
    doughBallWeight: 260,
    flour: "tipo-00",
    flourSituation: "has_w_range",
    availableFlourWRanges: ["w_300_340"],
    yeastType: "idy",
    targetEatTime: "2026-07-14T10:00:00.000Z",
    plannedFermentationHours: 72,
    fermentationTemperatureCOverride: 4,
  }, now);
}

function cautionFlourSession() {
  return createPizzaSession({
    id: "dough-guide-caution-flour-session",
    status: "planning",
    currentStep: "recipe",
    experienceLevel: "enthusiast",
    pizzaStyle: "home-oven",
    pizzaPreset: "margherita",
    pizzaCount: 4,
    doughBallWeight: 260,
    flour: "tipo-00",
    flourSituation: "has_w_range",
    availableFlourWRanges: ["w_180_220"],
    yeastType: "ady",
    targetEatTime: "2026-07-13T10:00:00.000Z",
    plannedFermentationHours: 48,
    fermentationTemperatureCOverride: 4,
  }, now);
}

describe("Pizza Dough Guide foundation", () => {
  it("adds the public /guides/dough route with approved heading and metadata", () => {
    expect(existsSync(join(process.cwd(), "app/guides/dough/page.tsx"))).toBe(true);

    const route = source("app/guides/dough/page.tsx");
    const page = source("components/guide/DoughGuidePageClient.tsx");
    const metadata = metadataForRoute("/guides/dough");

    expect(metadata.title).toBe("Pizza Dough Guide | DoughTools");
    expect(metadata.description).toContain("Learn how to make pizza dough step by step");
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
    expect(page).toContain('className="hidden lg:sticky lg:top-24 lg:block"');
    expect(page).not.toContain("<table");
  });

  it("uses the active Guide image as responsive layout media instead of a separate progress card", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page).not.toContain("Current progress");
    expect(page).not.toContain("Active step: {activeStep.actionName}. Guidance mode:");
    expect(page).not.toContain("getExperienceLevelConfig");
    expect(page).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]");
    expect(page).toContain('className="mt-6 hidden lg:mt-0 lg:block"');
    expect(page).toContain('className="mt-5 lg:hidden"');
    expect(page.match(/<StepVisual step=\{activeStep\} priority \/>/g)).toHaveLength(2);
    expect(page).not.toContain("xl:grid-cols-[minmax(0,1fr)_20rem]");
  });

  it("keeps the generic hero information note desktop-only", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page).toContain("This guide works with or without a Pizza Session. When a session is active, it adds your dough-plan values without changing the session.");
    expect(page).toContain('className="mt-4 hidden max-w-2xl rounded-2xl bg-leaf/[.08] p-4 text-sm font-bold leading-6 text-ink/65 lg:block"');
  });

  it("places the compact image after the active step orientation and before the immediate action", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    const summaryIndex = page.indexOf("{activeStep.summary}");
    const mobileImageIndex = page.indexOf('className="mt-5 lg:hidden"');
    const doThisNowIndex = page.indexOf("Do this now");

    expect(summaryIndex).toBeGreaterThan(-1);
    expect(mobileImageIndex).toBeGreaterThan(summaryIndex);
    expect(mobileImageIndex).toBeLessThan(doThisNowIndex);
  });

  it("keeps the current instruction ahead of session and flour context", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page.indexOf("Do this now")).toBeLessThan(page.indexOf("<PreparePlanSummaryCard context={sessionContext} flourGuidance={flourGuidance} />"));
    expect(page).not.toContain("<SessionContextCard context={sessionContext} />");
    expect(page).not.toContain("<FlourGuidanceCard guidance={flourGuidance} />");
    expect(page).not.toContain("<StepPersonalizationCard facts={stepPersonalization} />");
    expect(page).not.toContain("Your plan for this step");
  });

  it("keeps mobile step progression primary and labels the active step without relying only on color", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page).toContain("aria-current={active ? \"step\" : undefined}");
    expect(page).toContain("Current");
    expect(page).toContain("order-1 inline-flex min-h-12 items-center justify-center rounded-2xl bg-tomato");
    expect(page).toContain("order-2 inline-flex min-h-12 items-center justify-center rounded-2xl border");
    expect(page.match(/Continue to \{nextStep\.actionName\}/g)).toHaveLength(1);
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
    expect(page).toContain("buildDoughGuideHref(nextStep.id, sessionReturnPath ?? undefined)");
    expect(page).toContain("buildDoughGuideHref(previousStep.id, sessionReturnPath ?? undefined)");
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
    expect(imageSources).toHaveLength(12);
    expect(imageSources.every((src) => src?.startsWith("/dough-guide/"))).toBe(true);
    expect(imageSources.every((src) => src?.startsWith("/dough-guide/guide-step-"))).toBe(true);
    expect(page).not.toMatch(/https?:\/\//);
  });

  it("uses the Patch 277 custom photo assets for all twelve Dough Guide steps", () => {
    const imageSources = doughGuideSteps.map((step) => step.image?.src);

    expect(imageSources).toEqual([
      "/dough-guide/guide-step-01-prepare.webp",
      "/dough-guide/guide-step-02-measure.webp",
      "/dough-guide/guide-step-03-mix.webp",
      "/dough-guide/guide-step-04-rest.webp",
      "/dough-guide/guide-step-05-develop.webp",
      "/dough-guide/guide-step-06-bulk.webp",
      "/dough-guide/guide-step-07-divide.webp",
      "/dough-guide/guide-step-08-ball.webp",
      "/dough-guide/guide-step-09-proof.webp",
      "/dough-guide/guide-step-10-warm.webp",
      "/dough-guide/guide-step-11-readiness.webp",
      "/dough-guide/guide-step-12-release.webp",
    ]);
    for (const src of imageSources) {
      expect(src).toBeTruthy();
      expect(existsSync(join(process.cwd(), "public", src!.slice(1)))).toBe(true);
    }
  });

  it("uses the shared master primary image map for every Dough Guide hero image", () => {
    const masterImages = DOUGH_GUIDE_STEP_IDS.map((id) => DOUGH_STEP_PRIMARY_IMAGES[id]);
    const guideImages = doughGuideSteps.map((step) => step.image);
    const guideSource = source("lib/dough-guide.ts");

    expect(masterImages).toHaveLength(12);
    expect(guideImages).toEqual(masterImages);
    expect(guideSource).toContain('image: getDoughStepPrimaryImage("prepare")');
    expect(guideSource).toContain('image: getDoughStepPrimaryImage("release-dough-ball")');
    for (const image of masterImages) {
      expect(image.src).toMatch(/^\/dough-guide\/guide-step-.*\.webp$/);
      expect(image.src).not.toMatch(/teaching-step/);
      expect(existsSync(join(process.cwd(), "public", image.src.slice(1)))).toBe(true);
    }
  });

  it("maps matching Timeline dough actions to the shared primary images without taking over service steps", () => {
    expect(getDoughStepPrimaryImageForTimelineStep("mix-dough")?.src).toBe(
      DOUGH_STEP_PRIMARY_IMAGES["mix-dough"].src,
    );
    expect(getDoughStepPrimaryImageForTimelineStep("rest-dough")?.src).toBe(
      DOUGH_STEP_PRIMARY_IMAGES["rest-dough"].src,
    );
    expect(getDoughStepPrimaryImageForTimelineStep("cold-ferment")?.src).toBe(
      DOUGH_STEP_PRIMARY_IMAGES["bulk-ferment"].src,
    );
    expect(getDoughStepPrimaryImageForTimelineStep("room-temperature-rest")?.src).toBe(
      DOUGH_STEP_PRIMARY_IMAGES["warm-dough"].src,
    );
    expect(getDoughStepPrimaryImageForTimelineStep("preheat-oven")).toBeUndefined();
    expect(getDoughStepPrimaryImageForTimelineStep("prepare-toppings")).toBeUndefined();
    expect(getDoughStepPrimaryImageForTimelineStep("bake-pizza")).toBeUndefined();
  });

  it("maps matching legacy beginner step ids to shared primary images without preserving Plan-only bake fallback", () => {
    expect(getDoughStepPrimaryImageForBeginnerStep("mix")?.src).toBe(DOUGH_STEP_PRIMARY_IMAGES["mix-dough"].src);
    expect(getDoughStepPrimaryImageForBeginnerStep("knead")?.src).toBe(
      DOUGH_STEP_PRIMARY_IMAGES["develop-dough"].src,
    );
    expect(getDoughStepPrimaryImageForBeginnerStep("cold")?.src).toBe(
      DOUGH_STEP_PRIMARY_IMAGES["proof-dough-balls"].src,
    );
    expect(getDoughStepPrimaryImageForBeginnerStep("final")?.src).toBe(
      DOUGH_STEP_PRIMARY_IMAGES["check-readiness"].src,
    );
    expect(getDoughStepPrimaryImageForBeginnerStep("bake")).toBeUndefined();
  });

  it("uses improved local Warm and Release step photos with accurate accessibility text", () => {
    const warmStep = getDoughGuideStepById("warm-dough");
    const releaseStep = getDoughGuideStepById("release-dough-ball");

    expect(warmStep.image?.src).toBe("/dough-guide/guide-step-10-warm.webp");
    expect(releaseStep.image?.src).toBe("/dough-guide/guide-step-12-release.webp");
    expect(existsSync(join(process.cwd(), "public", warmStep.image!.src.slice(1)))).toBe(true);
    expect(existsSync(join(process.cwd(), "public", releaseStep.image!.src.slice(1)))).toBe(true);
    expect(warmStep.image?.src).not.toMatch(/^https?:\/\//);
    expect(releaseStep.image?.src).not.toMatch(/^https?:\/\//);
    expect(warmStep.image?.alt).toMatch(/covered dough balls/i);
    expect(warmStep.image?.alt).toMatch(/room temperature|relaxing/i);
    expect(warmStep.image?.alt).toMatch(/cold storage/i);
    expect(`${warmStep.image?.alt} ${warmStep.image?.caption}`).not.toMatch(/\b2 h\b|two-hour|fixed time|universal waiting time/i);
    expect(releaseStep.image?.alt).toMatch(/dough scraper/i);
    expect(releaseStep.image?.alt).toMatch(/releasing an intact dough ball/i);
    expect(releaseStep.image?.alt).toMatch(/floured work surface/i);
    expect(releaseStep.doThisNow.join(" ")).toContain("the next action is stretching, which is outside this guide");
  });

  it("defines local typed visual learning assets with alt text and dimensions", () => {
    const visuals = allGuideVisuals();

    expect(visuals.length).toBeGreaterThan(24);
    for (const visual of visuals) {
      expect(visual.src).toMatch(/^\/dough-guide\//);
      expect(visual.src).not.toMatch(/^https?:\/\//);
      expect(existsSync(join(process.cwd(), "public", visual.src.slice(1)))).toBe(true);
      expect(visual.alt.length).toBeGreaterThan(20);
      if (visual.kind !== "photo") {
        expect(visual.width).toBeGreaterThan(0);
        expect(visual.height).toBeGreaterThan(0);
      }
    }
  });

  it("uses realistic local WebP teaching photos for every secondary visual", () => {
    const secondaryVisuals = secondaryGuideVisuals();

    expect(secondaryVisuals).toHaveLength(18);
    for (const visual of secondaryVisuals) {
      expect(visual.kind).toBe("photo");
      expect(visual.src).toMatch(/^\/dough-guide\/teaching-step-.*\.webp$/);
      expect(visual.src).not.toMatch(/\.svg$/);
      expect(visual.width).toBe(1200);
      expect(visual.height).toBe(900);
      expect(existsSync(join(process.cwd(), "public", visual.src.slice(1)))).toBe(true);
    }
  });

  it("keeps primary Guide images separate from secondary teaching images", () => {
    const primaryImages = doughGuideSteps.map((step) => step.image?.src);
    const secondaryImages = secondaryGuideVisuals().map((visual) => visual.src);

    expect(primaryImages.every((src) => src?.startsWith("/dough-guide/guide-step-"))).toBe(true);
    expect(secondaryImages.every((src) => src.startsWith("/dough-guide/teaching-step-"))).toBe(true);
    expect(secondaryImages.some((src) => primaryImages.includes(src))).toBe(false);
  });

  it("keeps a meaningful secondary visual for each Dough Guide step", () => {
    for (const step of doughGuideSteps) {
      const secondaryCount = (step.visualSequence?.items.length ?? 0) + (step.visualComparison?.items.length ?? 0);

      expect(secondaryCount, `${step.id} secondary visual count`).toBeGreaterThan(0);
    }
  });

  it("adds step-specific visual learning for mixing, rest, development, bulk, divide, proof, warm and release", () => {
    expect(getDoughGuideStepById("mix-dough").visualSequence?.title).toBe("Rough is normal at first");
    expect(getDoughGuideStepById("mix-dough").visualSequence?.items[0].caption).toContain("rough but normal");
    expect(getDoughGuideStepById("rest-dough").visualSequence?.summary).toContain("flour hydrates");
    expect(getDoughGuideStepById("develop-dough").visualSequence?.items[0].caption).toContain("Stop before the surface tears");
    expect(getDoughGuideStepById("bulk-ferment").visualSequence?.items[0].caption).toContain("not every dough must exactly double");
    expect(getDoughGuideStepById("divide-dough").visualSequence?.items[0].caption).toContain("weigh the piece");
    expect(getDoughGuideStepById("proof-dough-balls").visualSequence?.items[0].caption).toContain("Avoid dried skin");
    expect(getDoughGuideStepById("warm-dough").visualSequence?.items[0].caption).not.toMatch(/2 h|two-hour|universal warm-up duration/i);
    expect(getDoughGuideStepById("release-dough-ball").visualSequence?.items[0].caption).toContain("ready to stretch");
    expect(getDoughGuideStepById("release-dough-ball").visualSequence?.items[0].caption).not.toMatch(/top|sauce|bake/i);
  });

  it("renders a five-stage Ball dough visual sequence with ordered movement labels", () => {
    const sequence = getDoughGuideStepById("ball-dough").visualSequence;

    expect(sequence?.title).toBe("Ball dough sequence");
    expect(sequence?.items).toHaveLength(5);
    expect(sequence?.items.map((item) => item.caption)).toEqual([
      "1. Gather the edges toward the center.",
      "2. Place the seam underneath.",
      "3. Pull and rotate gently to organize the surface.",
      "4. Build a smooth surface with controlled tension.",
      "5. Stop before the skin tears.",
    ]);
    expect(sequence?.note).toContain("Stop before the skin tears");
  });

  it("adds an accessible Underproofed / Ready / Overproofed visual comparison", () => {
    const comparison = getDoughGuideStepById("check-readiness").visualComparison;
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(comparison?.title).toBe("Readiness comparison");
    expect(comparison?.items.map((item) => item.label)).toEqual(["Underproofed", "Ready", "Overproofed"]);
    expect(comparison?.items[0].teachingPoints).toContain("springs back quickly");
    expect(comparison?.items[1].teachingPoints).toContain("visible gas development");
    expect(comparison?.items[2].teachingPoints).toContain("fragile and sticky");
    expect(comparison?.note).toContain("Use several signs together");
    expect(page).toContain("VisualComparisonCard");
    expect(page).toContain("md:grid-cols-3");
    expect(page).not.toContain("<table");
  });

  it("keeps visual depth tied to the existing experience level source", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");
    const mixVisual = getDoughGuideStepById("mix-dough").visualSequence?.items[0];

    expect(mixVisual?.levelNotes?.beginner?.join(" ")).toContain("Do not add extra flour");
    expect(mixVisual?.levelNotes?.enthusiast?.join(" ")).toContain("hydration and unity");
    expect(mixVisual?.levelNotes?.pizza_nerd?.join(" ")).toContain("mechanical work");
    expect(page).toContain("visual.levelNotes?.[experienceLevel]");
    expect(page).not.toContain("doughGuideVisualLevel");
    expect(page).not.toContain("setVisualLevel");
  });

  it("renders only active-step visual learning and avoids gallery dependencies", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");
    const packageJson = source("package.json");

    expect(page).toContain("activeStep.visualSequence");
    expect(page).toContain("activeStep.visualComparison");
    expect(page).toContain("priority");
    expect(page).not.toMatch(/carousel|swiper|slick|keen-slider/i);
    expect(packageJson).not.toMatch(/swiper|slick-carousel|keen-slider|embla-carousel/i);
  });

  it("maps Dough Guide mistakes only to existing troubleshooting topics", () => {
    const mapped = doughGuideSteps.flatMap((step) => step.troubleshooting ?? []);

    expect(mapped.length).toBeGreaterThan(12);
    for (const link of mapped) {
      expect(isPizzaTroubleshootingTopicId(link.topicId)).toBe(true);
      expect(link.beginnerLabel).toBeTruthy();
    }
    expect(getDoughGuideStepById("mix-dough").troubleshooting?.map((link) => link.topicId)).toEqual(["dough-too-sticky", "dough-tears"]);
    expect(getDoughGuideStepById("bulk-ferment").troubleshooting?.map((link) => link.topicId)).toContain("dough-not-rising");
    expect(getDoughGuideStepById("ball-dough").troubleshooting?.map((link) => link.topicId)).toContain("dough-springs-back");
    expect(getDoughGuideStepById("check-readiness").troubleshooting?.map((link) => link.topicId)).toEqual(["dough-not-rising", "dough-too-sticky", "dough-springs-back"]);
  });

  it("adapts troubleshooting link labels to the existing experience level", () => {
    const link = getDoughGuideStepById("check-readiness").troubleshooting?.[0];
    if (!link) throw new Error("Expected readiness troubleshooting link");

    expect(getDoughGuideTroubleshootingLabel(link, "beginner")).toBe("Why is my dough underproofed?");
    expect(getDoughGuideTroubleshootingLabel(link, "enthusiast")).toBe("Check underproofing signs");
    expect(getDoughGuideTroubleshootingLabel(link, "pizza_nerd")).toBe("Review underfermentation");
  });

  it("renders contextual troubleshooting links as secondary actions with safe return context", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page).toContain("Need more help?");
    expect(page).toContain("getDoughGuideTroubleshootingLabel(link, experienceLevel)");
    expect(page).toContain("/guide/pizza-troubleshooting?topic=${topicId}&from=");
    expect(page).toContain("#topic-${topicId}");
    expect(page).toContain("encodeURIComponent(buildDoughGuideHref(stepId, sessionReturnPath ?? undefined))");
    expect(page).toContain("aria-label={`${getDoughGuideTroubleshootingLabel(link, experienceLevel)} in Pizza Troubleshooting Guide`}");
    expect(page).not.toMatch(/updatePizzaSession|setActivePizzaSession|localStorage\.setItem|mark.*done|complete/i);
    expect(page.match(/Continue to \{nextStep\.actionName\}/g)).toHaveLength(1);
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

  it("keeps the current dough plan card visible only on the Prepare step", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page).toContain('const showPreparePlanSummary = activeStep.id === "prepare"');
    expect(page).toContain("{showPreparePlanSummary && (");
    expect(page).toContain("<PreparePlanSummaryCard context={sessionContext} flourGuidance={flourGuidance} />");
    expect(page).toContain("Your dough plan");
    expect(page).toContain('className="mt-4 hidden lg:block"');
    expect(page).toContain("lg:block");
    expect(page).not.toContain("Your current dough plan");
    expect(page).not.toContain("For your flour");
    expect(page).not.toContain("activeStep.id !== \"prepare\"");
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
    expect(adapter).not.toMatch(/calculateDoughIngredients|calculateContinuousYeastRecommendation|updatePizzaSession|setActivePizzaSession|localStorage\.setItem|completeSession|completeKitchen|mark.*done/i);
    expect(page).not.toMatch(/updatePizzaSession|setActivePizzaSession|localStorage\.setItem|mark.*done|complete/i);
    expect(adapter).toContain("Flour strength");
    expect(adapter).not.toMatch(/W 220 versus W 340|too weak|too strong|risk|warning/i);
  });

  it("reuses the existing below-24-hour flour fit result for Guide flour guidance", () => {
    const session = shortRoomFlourSession();
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok) throw new Error("Expected valid short room recipe");
    const context = getDoughGuideSessionContext(session, now);
    const guidance = getDoughGuideFlourGuidance(context.flourContext, "beginner");

    expect(recipe.flourWGuidance?.recommendationLabel).toBe("W 180–260");
    expect(context.flourContext?.recommendationLabel).toBe(recipe.flourWGuidance?.recommendationLabel);
    expect(context.flourContext?.compatibilityCategory).toBe(recipe.flourWGuidance?.fitLevel);
    expect(guidance?.explanation).toContain("closer attention");
    expect(guidance?.payAttentionTo.join(" ")).toContain("dough balls beginning to spread");
    expect(guidance?.levelDetails.join(" ")).toContain("active plan");
  });

  it("reuses the existing long-fermentation flour fit result without expanding the plan", () => {
    const session = coldSession();
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok) throw new Error("Expected valid cold recipe");
    const context = getDoughGuideSessionContext(session, now);
    const guidance = getDoughGuideFlourGuidance(context.flourContext, "enthusiast");

    expect(recipe.flourWGuidance?.recommendationLabel).toBe("W 260–300");
    expect(recipe.flourWGuidance?.fitLevel).toBe("suitable");
    expect(context.flourContext?.recommendationLabel).toBe("W 260–300");
    expect(guidance?.facts).toContainEqual({ label: "Flour strength", value: "W 260–300" });
    expect(guidance?.levelDetails.join(" ")).toContain("Long-process flour can tolerate a more demanding plan");
    expect(guidance?.levelDetails.join(" ")).not.toContain("72");
  });

  it("reuses the existing up-to-72-hour behavior and Pizza Nerd technical context", () => {
    const session = seventyTwoHourFlourSession();
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok) throw new Error("Expected valid 72h recipe");
    const context = getDoughGuideSessionContext(session, now);
    const guidance = getDoughGuideFlourGuidance(context.flourContext, "pizza_nerd");

    expect(recipe.flourWGuidance).toMatchObject({
      recommendationLabel: "W 300–340",
      fitLevel: "suitable",
    });
    expect(context.flourContext?.recommendationLabel).toBe("W 300–340");
    expect(guidance?.levelDetails.join(" ")).toContain("alveographic strength");
    expect(guidance?.levelDetails.join(" ")).toContain("P/L balance");
    expect(guidance?.levelDetails.join(" ")).toContain("similar W labels");
    expect(guidance?.explanation).not.toContain("guarantee");
  });

  it("shows existing compatibility cautions as non-blocking flour guidance", () => {
    const session = cautionFlourSession();
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok) throw new Error("Expected valid caution recipe");
    const context = getDoughGuideSessionContext(session, now);
    const guidance = getDoughGuideFlourGuidance(context.flourContext, "enthusiast");

    expect(recipe.flourWGuidance?.fitLevel).toBe("caution");
    expect(context.flourContext?.compatibilityLabel).toBe("Pay closer attention");
    expect(guidance?.caution).toBeTruthy();
    expect(guidance?.explanation).toContain("does not change the recipe");
    expect(guidance?.payAttentionTo.length).toBeGreaterThan(1);
  });

  it("adds step-specific flour guidance without changing quantities or schedule", () => {
    const shortContext = getDoughGuideSessionContext(shortRoomFlourSession(), now);
    const longContext = getDoughGuideSessionContext(coldSession(), now);

    expect(getDoughGuideStepFlourGuidance("measure", shortContext.flourContext)).toContainEqual({
      label: "Flour reminder",
      value: "Use the calculated ingredient quantities. Do not change water or flour from this Guide.",
    });
    expect(getDoughGuideStepFlourGuidance("mix-dough", shortContext.flourContext)).toContainEqual({
      label: "Flour handling",
      value: "Avoid unnecessary prolonged mixing once the dough has the required structure.",
    });
    expect(getDoughGuideStepFlourGuidance("mix-dough", longContext.flourContext)).toContainEqual({
      label: "Flour handling",
      value: "Strong dough may initially feel resistant; rest can help more than extra mixing.",
    });
    expect(getDoughGuideStepFlourGuidance("proof-dough-balls", shortContext.flourContext).map((fact) => fact.value).join(" ")).toContain("loss of height");
    expect(getDoughGuideStepFlourGuidance("check-readiness", longContext.flourContext).map((fact) => fact.value).join(" ")).toContain("Strong spring-back");
    expect(getDoughGuideStepFlourGuidance("release-dough-ball", shortContext.flourContext).map((fact) => fact.value).join(" ")).not.toMatch(/top|bake|launch/i);
  });

  it("keeps missing flour, missing W and unknown compatibility neutral", () => {
    const noFlour = createPizzaSession({
      id: "dough-guide-no-flour",
      status: "planning",
      currentStep: "recipe",
      pizzaCount: 4,
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      targetEatTime: "2026-07-12T10:00:00.000Z",
    }, now);
    const context = getDoughGuideSessionContext(noFlour, now);
    const guidance = getDoughGuideFlourGuidance(context.flourContext, "beginner");

    expect(context.flourContext).toBeUndefined();
    expect(guidance).toBeUndefined();
    expect(getDoughGuideStepFlourGuidance("bulk-ferment", context.flourContext)).toEqual([]);
  });

  it("does not introduce independent Guide-only W bands or mutation paths", () => {
    const adapter = source("lib/dough-guide-session-context.ts");
    const component = source("components/guide/DoughGuidePageClient.tsx");

    expect(adapter).toContain("type { SessionFlourWGuidance }");
    expect(adapter).toContain("recommendationLabel");
    expect(adapter).not.toMatch(/w_180_220|w_220_260|w_260_300|w_300_340|W 220–259|W 260–319|very strong|moderate|protein-to-W|W-to-protein/i);
    expect(adapter).not.toMatch(/calculateDoughIngredients|calculateContinuousYeastRecommendation|updatePizzaSession|setActivePizzaSession|localStorage\.setItem|Timeline output|Kitchen Mode output/i);
    expect(component).toContain("<PreparePlanSummaryCard context={sessionContext} flourGuidance={flourGuidance} />");
    expect(component).not.toContain("<FlourGuidanceCard");
    expect(component.match(/Continue to \{nextStep\.actionName\}/g)).toHaveLength(1);
  });

  it("links Dough Guide from existing guide navigation while keeping troubleshooting available", () => {
    const header = source("components/GlobalToolNavigation.tsx");
    const guideIndex = source("app/guide/page.tsx");
    const navigation = source("lib/navigation.ts");

    expect(header).toContain("Make the dough");
    expect(header).toContain('href: "/guides/dough"');
    expect(header).toContain("Fix pizza problems");
    expect(header).toContain('href: "/guide/pizza-troubleshooting"');
    expect(guideIndex).toContain("How to make pizza dough");
    expect(guideIndex).toContain('href: "/guides/dough"');
    expect(navigation).toContain('id: "dough-guide"');
    expect(navigation).toContain('href: "/guides/dough"');
  });

  it("preserves Guide dropdown close behavior and disclosure accessibility", () => {
    const header = source("components/GlobalToolNavigation.tsx");
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(header).toContain("setOpenMenu(null)");
    expect(header).toContain("}, [pathname]);");
    expect(header).toContain("navigationRootRef.current?.contains(target)");
    expect(header).toContain("event.key === \"Escape\"");
    expect(header).toContain('aria-controls="global-learning-menu"');
    expect(header).toContain('role="menu" aria-label="Pizza guides menu"');
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

  it("supports safe return links from Timeline and Kitchen Mode without changing normal Guide visits", () => {
    const page = source("components/guide/DoughGuidePageClient.tsx");

    expect(page).toContain('getSafeDoughGuideSessionReturnPath(searchParams.get("from"))');
    expect(page).toContain("Back to Timeline");
    expect(page).toContain("Back to Kitchen Mode");
    expect(page).toContain('href={sessionReturnPath}');
    expect(page).toContain("<StepNavigation activeIndex={activeIndex} sessionReturnPath={sessionReturnPath} />");
    expect(page).toContain("sessionReturnPath={sessionReturnPath}");
    expect(page).toContain("buildDoughGuideHref(step.id, sessionReturnPath ?? undefined)");
    expect(page).toContain("buildDoughGuideHref(nextStep.id, sessionReturnPath ?? undefined)");
    expect(page).toContain("buildDoughGuideHref(previousStep.id, sessionReturnPath ?? undefined)");
  });
});
