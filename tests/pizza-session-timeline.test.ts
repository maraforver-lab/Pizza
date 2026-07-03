import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createPizzaSession } from "@/lib/pizza-session";
import {
  createAndSavePizzaSession,
  getActivePizzaSession,
  PIZZA_SESSIONS_STORAGE_KEY,
  setActivePizzaSession,
} from "@/lib/pizza-session-storage";
import {
  formatTimelinePlainText,
  generateAndSaveActivePizzaSessionTimeline,
  generatePizzaSessionTimeline,
  getNextTimelineStep,
  getTimelineNote,
  markPizzaSessionTimelineStepDone,
  QUIET_HOURS_END,
  QUIET_HOURS_START,
  QUIET_HOURS_WARNING,
  TIMELINE_ROUNDING_MINUTES,
} from "@/lib/pizza-session-timeline";
import {
  resolveSessionDoughStartTime,
  timelineStepsForPlanningSummaryDisplay,
} from "@/lib/pizza-session-timeline-display";
import { buildSessionRecipe } from "@/lib/session-recipe";
import { MemoryStorage } from "./helpers";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function isQuietHours(value: string) {
  const hour = new Date(value).getHours();
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

describe("Pizza Session timeline", () => {
  it("adds the /session/timeline route and timeline helper", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "timeline", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "lib", "pizza-session-timeline.ts"))).toBe(true);

    const page = source("app/session/timeline/page.tsx");
    expect(page).toContain("Your pizza timeline");
    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={8}");
    expect(page).toContain("hideMeta");
    expect(page).toContain("Follow the key moments and you’ll always know what to do next.");
    expect(page).toContain("Next up");
    expect(page).toContain("Timeline planning summary");
    expect(page).toContain("Planning timing notes");
    expect(page).toContain("What happens when");
    expect(page).toContain("Timing highlights");
    expect(page).toContain("Full timeline");
    expect(page).toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
    expect(page).toContain("Start dough →");
    expect(page).toContain("BottomActionBar");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).toContain("href={nextAction.href}");
    expect(page).toContain("desktopAside={renderNextActionCard()}");
    expect(page).toContain("<div className=\"lg:hidden\">");
    expect(page).not.toContain("Session summary");
    expect(page).not.toContain("Step 7: Timeline");
    expect(page).not.toContain("This page is for timing. Kitchen Mode is where you do the active cooking steps.");
    expect(page).not.toContain("How this timeline works");
    expect(page).not.toContain("Mark done");
    expect(page).not.toContain("Edit session choices");
    expect(page).not.toContain("Review session");
    expect(page).toContain("Quiet-hours warning");
    expect(page).not.toContain("Copy schedule");
    expect(page).not.toContain("Create shopping list");
    expect(page).not.toContain("Open full Planner");
    expect(page).not.toContain("<AppSignature");
  });

  it("shows a compact planning timing summary without changing timeline generation", () => {
    const page = source("app/session/timeline/page.tsx");
    const helper = source("lib/pizza-session-timeline.ts");

    expect(page).toContain("buildSessionRecipe(session ?? undefined)");
    expect(page).toContain("timelineStepsForPlanningSummaryDisplay");
    expect(page).toContain("resolveSessionDoughStartTime");
    expect(page).toContain("Timeline planning summary");
    expect(page).toContain("Timeline guidance is based on available session choices.");
    expect(page).toContain("Overall risk");
    expect(page).toContain("What to adjust first");
    expect(page).toContain("combinedRisk.summary");
    expect(page).toContain("Bake target");
    expect(page).toContain("Available time");
    expect(page).toContain("Start window");
    expect(page).toContain("Dough start");
    expect(page).toContain("Fermentation place");
    expect(page).toContain("Fermentation temperature");
    expect(page).toContain("Add bake time and dough plan details for stronger timing recommendations.");
    expect(page).not.toContain("Dough planning notes");
    expect(helper).not.toContain("buildPlanningResult");
    expect(helper).not.toContain("buildSessionRecipe");
  });

  it("aligns the displayed full timeline with a 7-hour same-day room planning summary", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      id: "same-day-display-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-02T16:00",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");
    expect(recipe.planningInfo.result.availableFermentationHours).toBe(7);
    expect(recipe.planningInfo.result.fermentationSetupRecommendation?.recommendedSetup).toBe("same_day_room");
    expect(recipe.planningInfo.result.startWindowRecommendation?.category).toBe("start_now");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    expect(generated.steps.some((step) => step.id === "cold-ferment")).toBe(true);
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
    });

    expect(displayed.some((step) => step.id === "cold-ferment")).toBe(false);
    expect(displayed.map((step) => step.label)).toContain("Room fermentation");
    expect(displayed.map((step) => step.label)).toContain("Final room rest");
    expect(displayed.find((step) => step.id === "room-temperature-rest")?.helperCopy)
      .toContain("Same-day timing");
    expect(new Date(displayed.find((step) => step.id === "mix-dough")?.scheduledAt ?? 0).getTime())
      .toBeGreaterThanOrEqual(now.getTime());
    expect(displayed.find((step) => step.id === "bake-pizza")?.scheduledAt)
      .toBe(new Date("2026-07-02T16:00").toISOString());
    expect(displayed.find((step) => step.id === "preheat-oven")?.scheduledAt)
      .toBe(new Date("2026-07-02T15:00").toISOString());
    expect(displayed.every((step) => step.status === "todo")).toBe(true);
  });

  it("uses doughStartMode now to anchor same-day dough actions at the current planning time", () => {
    const now = new Date("2026-07-02T14:00:00");
    const session = createPizzaSession({
      id: "same-day-start-now-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-02T20:00",
      doughStartMode: "now",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
    });

    expect(resolveSessionDoughStartTime({ planningResult: recipe.planningInfo.result, session })).toMatchObject({
      mode: "now",
      label: "Dough start: now",
      startsAt: now.toISOString(),
    });
    expect(displayed.some((step) => step.id === "cold-ferment")).toBe(false);
    expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(now.toISOString());
    expect(displayed.find((step) => step.id === "bake-pizza")?.scheduledAt).toBe(new Date("2026-07-02T20:00").toISOString());
  });

  it("uses a valid later dough start time without mutating persisted timeline statuses", () => {
    const now = new Date("2026-07-02T18:00:00");
    const laterStart = "2026-07-03T09:00";
    const session = createPizzaSession({
      id: "later-dough-start-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-05T12:00",
      doughStartMode: "later",
      doughEarliestStartTime: laterStart,
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    generated.steps[0] = { ...generated.steps[0], status: "done" };
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
    });
    const laterStartDate = new Date(laterStart);

    expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(laterStartDate.toISOString());
    expect(displayed.find((step) => step.id === "rest-dough")?.scheduledAt).toBe(new Date(laterStartDate.getTime() + 30 * 60_000).toISOString());
    expect(displayed.find((step) => step.id === "cold-ferment")?.scheduledAt).toBe(new Date(laterStartDate.getTime() + 60 * 60_000).toISOString());
    expect(displayed.find((step) => step.id === "mix-dough")?.status).toBe("done");
    expect(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt).not.toBe(laterStartDate.toISOString());
  });

  it("keeps a cautious fallback when a later dough start time is invalid or after the bake target", () => {
    const now = new Date("2026-07-02T18:00:00");
    const session = createPizzaSession({
      id: "invalid-later-dough-start-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-03T12:00",
      doughStartMode: "later",
      doughEarliestStartTime: "2026-07-03T13:00",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
    });
    const resolution = resolveSessionDoughStartTime({ planningResult: recipe.planningInfo.result, session });

    expect(resolution.warning).toContain("after the bake target");
    expect(resolution.startsAt).toBeUndefined();
    expect(displayed).not.toBe(generated.steps);
    expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(now.toISOString());
  });

  it("preserves recommendation-based timeline behavior when doughStartMode is recommend", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      id: "recommend-dough-start-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-04T16:00",
      doughStartMode: "recommend",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
    });

    expect(resolveSessionDoughStartTime({ planningResult: recipe.planningInfo.result, session })).toMatchObject({
      mode: "recommend",
      label: "Dough start: DoughTools recommendation",
    });
    expect(displayed).toBe(generated.steps);
  });

  it("can anchor a weekend cold fermentation display from the stated dough start time", () => {
    const now = new Date("2026-07-02T18:00:00");
    const session = createPizzaSession({
      id: "weekend-cold-start-now-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-04T12:00",
      doughStartMode: "now",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
    });

    expect(displayed.some((step) => step.id === "cold-ferment")).toBe(true);
    expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(now.toISOString());
    expect(displayed.find((step) => step.id === "cold-ferment")?.scheduledAt).toBe(new Date(now.getTime() + 60 * 60_000).toISOString());
  });

  it("preserves longer cold-fermentation timeline display when same-day start-now alignment does not apply", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      id: "long-cold-display-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-04T16:00",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
    });

    expect(displayed).toBe(generated.steps);
    expect(displayed.some((step) => step.id === "cold-ferment")).toBe(true);
    expect(displayed.find((step) => step.id === "room-temperature-rest")?.label)
      .toBe("Room temperature rest");
  });

  it("keeps session timeline display consistent across longer planning horizons", () => {
    const now = new Date("2026-07-02T09:00:00");
    const horizons = [
      { label: "24h", targetEatTime: "2026-07-03T09:00", expectedStartWindow: "day_before", adjustsPastStart: true },
      { label: "48h", targetEatTime: "2026-07-04T09:00", expectedStartWindow: "one_to_three_days_before", adjustsPastStart: false },
      { label: "72h", targetEatTime: "2026-07-05T09:00", expectedStartWindow: "one_to_three_days_before", adjustsPastStart: false },
      { label: "7d", targetEatTime: "2026-07-09T09:00", expectedStartWindow: "not_enough_information", adjustsPastStart: false },
    ];

    for (const horizon of horizons) {
      const session = createPizzaSession({
        id: `timeline-horizon-${horizon.label}`,
        status: "planning",
        currentStep: "recipe",
        targetEatTime: horizon.targetEatTime,
        pizzaStyle: "home-oven",
        pizzaPreset: "margherita",
        pizzaCount: 4,
        ovenType: "home",
        flour: "tipo-00",
      }, now);
      const recipe = buildSessionRecipe(session, now);
      if (!recipe.ok || !recipe.planningInfo.ok) throw new Error(`Expected planning info for ${horizon.label}`);
      expect(recipe.planningInfo.result.startWindowRecommendation?.category).toBe(horizon.expectedStartWindow);

      const generated = generatePizzaSessionTimeline(session, now).timeline!;
      const displayed = timelineStepsForPlanningSummaryDisplay({
        steps: generated.steps,
        planningResult: recipe.planningInfo.result,
      });

      expect(displayed.some((step) => step.id === "cold-ferment")).toBe(true);
      if (horizon.adjustsPastStart) {
        expect(displayed).not.toBe(generated.steps);
        expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(now.toISOString());
      } else {
        expect(displayed).toBe(generated.steps);
        expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt);
      }
      expect(new Date(displayed.find((step) => step.id === "mix-dough")?.scheduledAt ?? 0).getTime()).toBeGreaterThanOrEqual(now.getTime());
    }
  });

  it("keeps Next up focused on the real next action", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function nextActionForTimeline");
    expect(page).toContain("cta: \"Start dough →\"");
    expect(page).toContain("cta: \"Continue baking →\"");
    expect(page).toContain("cta: \"Review your pizza →\"");
    expect(page).toContain("href={nextAction.href}");
    expect(page).toContain("{nextAction.title}");
    expect(page).toContain("{nextAction.subtext}");
    expect(page).toContain("const renderNextActionCard");
    expect(page).not.toContain("timeline-next-action-heading");
    expect(page).toContain("Review shopping →");
    expect(page).toContain("href: \"/session/kitchen?from=timeline\"");
    expect(page).toContain("href: \"/session/review\"");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).not.toContain("Recommended action");
    expect(page).not.toContain("aria-labelledby=\"next-up-heading\"");
    expect(page).not.toContain("recipeQuery ? `/plan?");
  });

  it("adds a shopping checkpoint before service and bake steps without changing timeline data", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function ShoppingCheckpointRow");
    expect(page).toContain("Shopping checkpoint");
    expect(page).toContain("Shopping review");
    expect(page).toContain("Shopping should be handled before Timeline.");
    expect(page).not.toContain("Pizza choices and shopping");
    expect(page).toContain("Timeline stays focused on when to work; Shopping owns toppings and buy-list checks.");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).toContain("Review shopping →");
    expect(page).toContain("shoppingCheckpointState(session)");
    expect(page).toContain("const firstServiceStepIndex = displayTimelineSteps.findIndex(isServiceTimelineStep)");
    expect(page).toContain("const shoppingCheckpointInsertIndex = firstServiceStepIndex");
    expect(page).toContain("index === shoppingCheckpointInsertIndex");
    expect(page).toContain("shoppingCheckpointInsertIndex === displayTimelineSteps.length");
    expect(page.indexOf("index === shoppingCheckpointInsertIndex")).toBeLessThan(page.indexOf("Step {index + 1}"));
    expect(page).not.toContain("Create shopping list");
    expect(page).not.toContain("Open full Planner");
  });

  it("keeps the shopping checkpoint visible in normal timeline rendering instead of hiding it behind completion state", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("<ShoppingCheckpointRow checkpointState={checkpointState} />");
    expect(page).not.toContain("session?.shoppingList && <ShoppingCheckpointRow");
    expect(page).not.toContain("allStepsComplete && <ShoppingCheckpointRow");
    expect(page).not.toContain("shoppingIsNext && <ShoppingCheckpointRow");
    expect(page).not.toMatch(/\b(Avaa|Ostoskor|Juusto|Täytteet|Seuraava)\b/);
  });

  it("keeps shopping as a review checkpoint instead of the next Timeline action", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).not.toContain("const shoppingIsNext = checkpointState === \"Next\"");
    expect(page).not.toContain("if (shoppingIsNext)");
    expect(page).not.toContain("cta: \"Open shopping list →\"");
    expect(page).toContain("if (session?.shoppingList) return \"Done\"");
    expect(page).toContain("return \"Check\"");
  });

  it("removes the repeated summary/sidebar from the timeline overview", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).not.toContain("Session summary");
    expect(page).not.toContain("[\"Pizza preset\"");
    expect(page).not.toContain("[\"Target time\"");
    expect(page).not.toContain("[\"Pizza count\"");
    expect(page).not.toContain("[\"Ball weight\"");
    expect(page).not.toContain("[\"Flour\"");
    expect(page).not.toContain("[\"Hydration\"");
    expect(page).not.toContain("[\"Fermentation\"");
    expect(page).not.toContain("[\"Yeast type\"");
    expect(page).not.toContain("[\"Oven\"");
  });

  it("renders timeline cards with step number, title, date/time, status and relative timing", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("Step {index + 1}");
    expect(page).toContain("formatShortDateTime(step.scheduledAt)");
    expect(page).toContain("{step.label}");
    expect(page).toContain("{step.description}");
    expect(page).toContain("statusLabel(step, nextStep)");
    expect(page).toContain("relativeFromTarget(step.scheduledAt, targetTime)");
    expect(page).toContain("step.id === nextStep?.id");
    expect(page).toContain("timelineStepIcon(step)");
    expect(page).not.toContain("onClick={() => markDone(step.id)}");
  });

  it("renders critical moments as a chronological what-happens-when list", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function getCriticalMoments");
    expect(page).toContain("function relativeFromNow");
    expect(page).toContain("\"cold-ferment\"");
    expect(page).toContain("\"room-temperature-rest\"");
    expect(page).toContain("\"preheat-oven\"");
    expect(page).toContain("\"bake-pizza\"");
    expect(page).toContain("criticalMoments.map((step)");
    expect(page).toContain("criticalMomentTitle(step)");
    expect(page).toContain("Put dough in fridge");
    expect(page).toContain("Take dough out");
    expect(page).toContain("formatTimelineDate(step.scheduledAt)");
    expect(page).toContain("formatTimelineTime(step.scheduledAt)");
    expect(page).toContain("relativeFromNow(step.scheduledAt)");
    expect(page).toContain("What happens when");
    expect(page).toContain("The most important moments from your actual pizza timeline.");
    expect(page).toContain("return diffMinutes > 0 ? `In ${parts}` : `${parts} ago`");
    expect(page).toContain("return aTime - bTime");
    expect(page).not.toContain("Don’t miss these moments");
    expect(page).not.toContain("These are pulled from your actual timeline, not a separate checklist.");
    expect(page).not.toContain("sm:grid-cols-2 sm:gap-3");
  });

  it("keeps Back and Next navigation aligned with the next action", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).toContain("href={nextAction.href}");
    expect(page).toContain("{nextAction.cta}");
    expect(page).toContain("BottomActionBar");
    expect(page).not.toContain("Review dough plan →");
  });

  it("keeps timeline page focused without repeated metadata or footer clutter", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("year: \"numeric\"");
    expect(page).not.toContain("Target: {formatDateTime(targetTime)}");
    expect(page).not.toContain("Target: {timeline.targetEatTime");
    expect(page).not.toContain("Pizza preset");
    expect(page).not.toContain("Pizza count");
    expect(page).not.toContain("Ball weight");
    expect(page).not.toContain("<AppSignature");
  });

  it("generates backward scheduled timeline steps from targetEatTime", () => {
    const session = createPizzaSession({
      id: "timeline-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-06-27T18:30",
      pizzaStyle: "pizza-oven",
      pizzaCount: 6,
      ovenType: "gas",
      flour: "tipo-00",
    }, new Date("2026-06-25T10:00:00.000Z"));

    const result = generatePizzaSessionTimeline(session, new Date("2026-06-25T10:05:00.000Z"));

    expect(result.ok).toBe(true);
    expect(result.timeline?.targetEatTime).toBe("2026-06-27T18:30");
    expect(result.timeline?.generatedAt).toBe("2026-06-25T10:05:00.000Z");
    expect(result.timeline?.steps.map((step) => step.label)).toEqual([
      "Mix dough",
      "Rest dough",
      "Cold ferment",
      "Ball dough",
      "Room temperature rest",
      "Preheat oven",
      "Prepare sauce and toppings",
      "Bake pizza",
      "Review result",
    ]);
    expect(result.timeline?.steps[0].scheduledAt).toBeDefined();
    expect(new Date(result.timeline?.steps[0].scheduledAt ?? 0).getTime()).toBeLessThan(new Date("2026-06-27T18:30").getTime());
    expect(result.timeline?.steps.find((step) => step.id === "bake-pizza")?.scheduledAt).toBeDefined();
    expect(result.nextStep?.id).toBe("mix-dough");
    expect(result.assumptions.join(" ")).toContain("practical guide");
  });

  it("rounds user-facing scheduled times to practical 15-minute increments", () => {
    const session = createPizzaSession({
      id: "rounding-session",
      targetEatTime: "2026-06-27T18:37",
    });

    const timeline = generatePizzaSessionTimeline(session).timeline!;

    expect(TIMELINE_ROUNDING_MINUTES).toBe(15);
    for (const step of timeline.steps) {
      const minutes = new Date(step.scheduledAt!).getMinutes();
      expect(minutes % 15).toBe(0);
    }
  });

  it("keeps active tasks out of the 22:00–07:00 quiet window where practical", () => {
    const session = createPizzaSession({
      id: "quiet-avoid-session",
      targetEatTime: "2026-06-27T08:30",
    });

    const timeline = generatePizzaSessionTimeline(session).timeline!;
    const activeSteps = timeline.steps.filter((step) => step.kind === "active");

    expect(activeSteps.map((step) => step.label)).toEqual([
      "Mix dough",
      "Ball dough",
      "Preheat oven",
      "Prepare sauce and toppings",
      "Bake pizza",
      "Review result",
    ]);
    expect(activeSteps.every((step) => !isQuietHours(step.scheduledAt!))).toBe(true);
  });

  it("allows passive fermentation and rest steps to cross the quiet window", () => {
    const session = createPizzaSession({
      id: "passive-overnight-session",
      targetEatTime: "2026-06-27T08:30",
    });

    const timeline = generatePizzaSessionTimeline(session).timeline!;
    const passiveSteps = timeline.steps.filter((step) => step.kind === "passive");

    expect(passiveSteps.map((step) => step.label)).toEqual([
      "Rest dough",
      "Cold ferment",
      "Room temperature rest",
    ]);
    expect(passiveSteps.some((step) => isQuietHours(step.scheduledAt!))).toBe(true);
    expect(passiveSteps.every((step) => step.quietHoursWarning === undefined)).toBe(true);
  });

  it("adds a visible warning if an active overnight task cannot be avoided", () => {
    const session = createPizzaSession({
      id: "overnight-warning-session",
      targetEatTime: "2026-06-27T06:30",
    });

    const timeline = generatePizzaSessionTimeline(session).timeline!;
    const bake = timeline.steps.find((step) => step.id === "bake-pizza");
    const review = timeline.steps.find((step) => step.id === "review-result");

    expect(bake?.kind).toBe("active");
    expect(bake?.scheduledAt && isQuietHours(bake.scheduledAt)).toBe(true);
    expect(bake?.quietHoursWarning).toBe(QUIET_HOURS_WARNING);
    expect(review?.quietHoursWarning).toBe(QUIET_HOURS_WARNING);
  });

  it("returns safe states for missing or invalid target time", () => {
    expect(generatePizzaSessionTimeline(undefined).missingReason).toBe("no-session");
    expect(generatePizzaSessionTimeline(createPizzaSession({ id: "missing-time" })).missingReason).toBe("missing-target-time");
    expect(generatePizzaSessionTimeline(createPizzaSession({ id: "invalid-time", targetEatTime: "not-a-date" })).missingReason).toBe("invalid-target-time");
  });

  it("saves generated timeline to active local Pizza Session and preserves key fields", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "active-timeline",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-06-27T18:30",
      pizzaStyle: "pizza-oven",
      pizzaCount: 4,
      ovenType: "gas",
      flour: "tipo-00",
      recipeParams: { balls: 4, oven: "gas" },
    }, storage, new Date("2026-06-25T10:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const { session: updated, result } = generateAndSaveActivePizzaSessionTimeline(storage, new Date("2026-06-25T10:15:00.000Z"));

    expect(result.ok).toBe(true);
    expect(updated?.id).toBe(session.id);
    expect(updated?.targetEatTime).toBe("2026-06-27T18:30");
    expect(updated?.pizzaStyle).toBe("pizza-oven");
    expect(updated?.pizzaCount).toBe(4);
    expect(updated?.ovenType).toBe("gas");
    expect(updated?.flour).toBe("tipo-00");
    expect(updated?.currentStep).toBe("timeline");
    expect(updated?.updatedAt).toBe("2026-06-25T10:15:00.000Z");
    expect(updated?.lastSavedAt).toBe("2026-06-25T10:15:00.000Z");
    expect(updated?.timeline?.steps.length).toBeGreaterThan(0);
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("mix-dough");
    expect(getActivePizzaSession(storage)?.id).toBe(session.id);
  });

  it("does not generate timeline for completed or archived active sessions", () => {
    const storage = new MemoryStorage();
    const completed = createAndSavePizzaSession({
      id: "completed-session",
      status: "completed",
      currentStep: "review",
      targetEatTime: "2026-06-27T18:30",
    }, storage);
    setActivePizzaSession(completed.id, storage);

    const { session, result } = generateAndSaveActivePizzaSessionTimeline(storage);

    expect(session).toBeUndefined();
    expect(result.ok).toBe(false);
    expect(result.missingReason).toBe("no-session");
  });

  it("marks a local timeline step done and moves the next step indicator", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "mark-done-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-06-27T18:30",
    }, storage);
    setActivePizzaSession(session.id, storage);
    const generated = generateAndSaveActivePizzaSessionTimeline(storage).session;
    expect(generated?.timeline).toBeDefined();

    const updated = markPizzaSessionTimelineStepDone(generated!, "mix-dough", storage, new Date("2026-06-25T11:00:00.000Z"));

    expect(updated?.timeline?.steps[0].status).toBe("done");
    expect(getNextTimelineStep(updated?.timeline)?.id).toBe("rest-dough");
    expect(updated?.currentStep).toBe("timeline");
  });

  it("provides level-aware copy and plain-text schedule without cloud or reminder claims", () => {
    const session = createPizzaSession({
      id: "copy-session",
      experienceLevel: "pizza_nerd",
      targetEatTime: "2026-06-27T18:30",
    });
    const timeline = generatePizzaSessionTimeline(session).timeline!;
    const firstStep = timeline.steps[0];

    expect(getTimelineNote(firstStep, "beginner")).toContain("Do this first");
    expect(getTimelineNote(firstStep, "enthusiast")).toContain("rest");
    expect(getTimelineNote(firstStep, "pizza_nerd")).toContain("offset");
    expect(formatTimelinePlainText(session, timeline)).toContain("DoughTools pizza timeline");
    expect(formatTimelinePlainText(session, timeline)).toContain("Pizza Nerd");
    expect(formatTimelinePlainText(session, timeline)).not.toMatch(/cloud sync|push notification|email reminder/i);
  });

  it("documents Patch 33 timeline behavior and local-first limitations", () => {
    expect(existsSync(join(process.cwd(), "docs", "session-timeline.md"))).toBe(true);
    const doc = source("docs/session-timeline.md");
    const dataDoc = source("docs/pizza-session-data-model.md");

    expect(doc).toContain("/session/timeline");
    expect(doc).toContain("backward");
    expect(doc).toContain("targetEatTime");
    expect(doc).toContain("saved locally");
    expect(doc).toContain("push notifications");
    expect(doc).toContain("email reminders");
    expect(doc).toContain("cloud sync");
    expect(dataDoc).toContain("Patch 33");
    expect(dataDoc).toContain("session timeline");
  });

  it("adds Patch 33 to update history without unavailable claims", () => {
    const changelog = source("lib/changelog.ts");

    expect(changelog).toContain("Session timeline and backward schedule");
    expect(changelog).toContain("Backward-planned pizza preparation steps");
    expect(changelog).toContain("Active session timeline saved locally");
    expect(changelog).toContain("No reminders, tracking, cloud sync or indexing behavior added");
    expect(changelog).not.toMatch(/cloud sync is active|push notifications enabled|email reminders enabled|Google indexing enabled/i);
  });
});
