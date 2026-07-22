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
import {
  formatEarlyTimelineStartTime,
  shouldWarnBeforeEarlyTimelineStart,
} from "@/lib/timeline-early-start-warning";
import { formatSessionPlannedTime } from "@/lib/session-time-display";
import { formatTimelineLiveTiming } from "@/lib/timeline-live-timing";
import { applyPizzaSessionStepRuntime } from "@/lib/pizza-session-step-runtime";
import { MemoryStorage } from "./helpers";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function isQuietHours(value: string) {
  const hour = new Date(value).getHours();
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

describe("Pizza Session timeline", () => {
  it("formats live Timeline step timing for future, ready, overdue and missing states", () => {
    const now = new Date("2026-07-08T10:00:00.000Z");

    expect(formatTimelineLiveTiming("2026-07-08T12:15:00.000Z", now)).toEqual({
      kind: "future",
      label: "Starts in 2 h 15 min",
    });
    expect(formatTimelineLiveTiming("2026-07-08T10:00:45.000Z", now)).toEqual({
      kind: "future",
      label: "Starts in 45 sec",
    });
    expect(formatTimelineLiveTiming("2026-07-08T10:00:00.000Z", now)).toEqual({
      kind: "ready",
      label: "READY NOW",
    });
    expect(formatTimelineLiveTiming("2026-07-08T09:48:00.000Z", now)).toEqual({
      kind: "overdue",
      label: "OVERDUE",
      value: "−12 min",
    });
    expect(formatTimelineLiveTiming("2026-07-08T08:42:00.000Z", now)).toEqual({
      kind: "overdue",
      label: "OVERDUE",
      value: "−1 h 18 min",
    });
    expect(formatTimelineLiveTiming(undefined, now)).toEqual({
      kind: "unknown",
      label: "Timing not set",
    });
  });

  it("formats planned Timeline and Kitchen times for nearby and future dates", () => {
    const now = new Date("2026-07-10T09:00:00");

    expect(formatSessionPlannedTime("2026-07-10T15:00:00", now)).toBe("Today 15:00");
    expect(formatSessionPlannedTime("2026-07-11T15:00:00", now)).toBe("Tomorrow 15:00");
    expect(formatSessionPlannedTime("2026-07-13T15:00:00", now)).toBe("Monday 15:00");
    expect(formatSessionPlannedTime("2026-07-19T15:00:00", now)).toBe("Sun, 19 Jul · 15:00");
    expect(formatSessionPlannedTime("2027-07-19T15:00:00", now)).toBe("Mon, 19 Jul 2027 · 15:00");
    expect(formatSessionPlannedTime(undefined, now)).toBe("Timing not set");
  });

  it("preserves step runtime timestamps separately from the planned timeline schedule", () => {
    const session = createPizzaSession({
      id: "runtime-session",
      status: "preparing",
      currentStep: "prep",
      timeline: {
        generatedAt: "2026-07-10T05:00:00.000Z",
        targetEatTime: "2026-07-11T12:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-10T05:30:00.000Z", status: "done", kind: "active" },
          { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-10T06:00:00.000Z", status: "todo", kind: "passive" },
          { id: "cold-ferment", label: "Cold fermentation", scheduledAt: "2026-07-10T06:20:00.000Z", status: "todo", kind: "passive" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-07-10T05:43:00.000Z",
          actualCompletedAt: "2026-07-10T05:53:00.000Z",
        },
      },
    });

    expect(session.stepRuntime?.["mix-dough"]?.actualStartedAt).toBe("2026-07-10T05:43:00.000Z");
    expect(session.timeline?.steps.find((step) => step.id === "rest-dough")?.scheduledAt).toBe("2026-07-10T06:00:00.000Z");

    const runtimeSteps = applyPizzaSessionStepRuntime(session.timeline!.steps, session.stepRuntime);
    const restStep = runtimeSteps.find((step) => step.id === "rest-dough");

    expect(restStep?.plannedScheduledAt).toBe("2026-07-10T06:00:00.000Z");
    expect(restStep?.runtimeStartsAt).toBe("2026-07-10T05:53:00.000Z");
    expect(restStep?.runtimeEndsAt).toBe("2026-07-10T06:23:00.000Z");
    expect(restStep?.scheduledAt).toBe("2026-07-10T06:23:00.000Z");
    expect(session.timeline?.steps.find((step) => step.id === "cold-ferment")?.scheduledAt).toBe("2026-07-10T06:20:00.000Z");
  });

  it("adds the /session/timeline route and timeline helper", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "timeline", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "lib", "pizza-session-timeline.ts"))).toBe(true);

    const page = source("app/session/timeline/page.tsx");
    expect(page).toContain("title=\"Timeline\"");
    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={8}");
    expect(page).toContain("hideMeta");
    expect(page).toContain("Use this preparation timeline to see the next required action, its planned time and when to start cooking.");
    expect(page).not.toContain("Next up</p>");
    expect(page).toContain("Now");
    expect(page).toContain("Planned for");
    expect(page).toContain("Next:");
    expect(page).toContain("Target");
    expect(page).toContain("Timing");
    expect(page).toContain("Start cooking");
    expect(page).toContain("formatMobileFirstStepStartLine");
    expect(page).toContain("firstMixStepIsWaitingToBegin");
    expect(page).toContain("First step");
    expect(page).toContain("Mix the dough");
    expect(page).toContain("until you begin");
    expect(page).toContain("Start making the dough");
    expect(page).not.toContain("Open Mix dough step");
    expect(page).toContain("timeline-current-action-card");
    expect(page).toContain("actionableTimelineSteps");
    expect(page).toContain("currentActionStep");
    expect(page).toContain("followingActionStep");
    expect(page).toContain("timelineStepIcon(currentActionStep)");
    expect(page).toContain("timelineStepIconTone(currentActionStep)");
    expect(page).toContain("timelineStepIcon(followingActionStep)");
    expect(page).toContain("timelineStepIconTone(followingActionStep)");
    expect(page).toContain("formatTimelineLiveTiming");
    expect(page).toContain("stepProgressLabel");
    expect(page).toContain("setInterval(() => setCurrentTime(new Date()), 15_000)");
    expect(page).not.toContain("Timeline planning summary");
    expect(page).not.toContain("Planning timing notes");
    expect(page).not.toContain("What happens when");
    expect(page).not.toContain("Timing highlights");
    expect(page).toContain("Timeline steps");
    expect(page).toContain("Preparation timeline");
    expect(page).toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
    expect(page).toContain("Start cooking");
    expect(page).not.toContain("Start mixing now →");
    expect(page).not.toContain("Start balling now →");
    expect(page).not.toContain("BottomActionBar");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).toContain("onClick={handleNextAction}");
    expect(page).toContain("<SessionWorkspaceLayout activeStep={8} hideLocalSaveNote>");
    expect(page).toContain("{renderNextActionCard()}");
    expect(page).toContain('cardClass({ className: "p-4 shadow-sm sm:p-5", variant: "success" })');
    expect(page).toContain("formatSessionPlannedTime(currentActionTime, currentTime)");
    expect(page).toContain("formatSessionPlannedTime(followingActionStep.scheduledAt, currentTime)");
    expect(page).not.toContain("timeline-next-step-heading");
    expect(page).not.toContain("rounded-[1.25rem] border border-white/75 bg-white/85 p-4");
    expect(page).not.toContain("desktopAside={renderNextActionCard()}");
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

  it("removes the repeated planning timing summary without changing timeline generation", () => {
    const page = source("app/session/timeline/page.tsx");
    const helper = source("lib/pizza-session-timeline.ts");

    expect(page).toContain("buildSessionRecipe(session ?? undefined)");
    expect(page).toContain("timelineStepsForPlanningSummaryDisplay");
    expect(page).not.toContain("Timeline planning summary");
    expect(page).not.toContain("Timeline guidance is based on available session choices.");
    expect(page).not.toContain("readablePlanningLabel");
    expect(page).not.toMatch(/Not enough information/i);
    expect(page).not.toContain("Saved as you go.");
    expect(page).not.toContain("Bake target");
    expect(page).not.toContain("Available time");
    expect(page).not.toContain("Fermentation plan");
    expect(page).not.toContain("fermentationDisplay.label");
    expect(page).not.toContain("fermentationPlanPlace");
    expect(page).not.toContain("Overall risk");
    expect(page).not.toContain("What to adjust first");
    expect(page).not.toContain("displayedRiskSummary");
    expect(page).not.toContain("Start window");
    expect(page).not.toContain("Dough start");
    expect(page).not.toContain("Fermentation place");
    expect(page).not.toContain("Fermentation temperature");
    expect(page).not.toContain("Selected fermentation");
    expect(page).not.toContain("buildSessionFermentationDisplay");
    expect(page).not.toContain("Add bake time and dough plan details for stronger timing recommendations.");
    expect(page).not.toContain("Dough planning notes");
    expect(helper).not.toContain("buildPlanningResult");
    expect(helper).toContain("buildSessionRecipe");
  });

  it("keeps the simplified Timeline fallback copy without risk-specific guidance", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).not.toContain("Add bake time and dough plan details for stronger timing recommendations.");
    expect(page).not.toContain("Timeline guidance is using your saved bake target.");
    expect(page).not.toContain("Use the timing notes and long-horizon options");
  });

  it("removes cold-specific fermentation summary copy with the repeated risk block", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).not.toContain("Cold fermentation");
    expect(page).not.toContain("cold fermentation gives more control");
  });

  it("maps small visual badges to key timeline step types", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function timelineStepIcon(step?: PizzaSessionTimelineStep)");
    expect(page).toContain('step?.id === "mix-dough"');
    expect(page).toContain('step?.id === "rest-dough"');
    expect(page).toContain('step?.id === "cold-ferment"');
    expect(page).toContain('step?.id === "room-ferment" || step?.id === "ferment-dough"');
    expect(page).toContain('step?.id === "ball-dough"');
    expect(page).toContain('step?.id === "preheat-oven"');
    expect(page).toContain('step?.id === "prepare-sauce-toppings"');
    expect(page).toContain('step?.id === "bake-pizza"');
    expect(page).toContain("function timelineStepIconTone(step?: PizzaSessionTimelineStep)");
    expect(page).toContain("bg-leaf/10 text-leaf ring-leaf/15");
    expect(page).toContain("bg-tomato/10 text-tomato ring-tomato/15");
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
      recipeSnapshot: { fermentation: "6h-room" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");
    expect(recipe.planningInfo.result.availableFermentationHours).toBe(7);
    expect(recipe.planningInfo.result.fermentationSetupRecommendation?.recommendedSetup).toBe("same_day_room");
    expect(recipe.planningInfo.result.startWindowRecommendation?.category).toBe("start_now");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    expect(generated.steps.some((step) => step.id === "cold-ferment")).toBe(false);
    expect(generated.steps.map((step) => step.label)).toContain("Room temperature ferment");
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
    });

    expect(displayed.some((step) => step.id === "cold-ferment")).toBe(false);
    expect(displayed.map((step) => step.label)).toContain("Room temperature ferment");
    expect(displayed.map((step) => step.label)).toContain("Final room rest");
    expect(displayed.find((step) => step.id === "room-temperature-rest")?.helperCopy)
      .toContain("final room rest");
    expect(new Date(displayed.find((step) => step.id === "mix-dough")?.scheduledAt ?? 0).getTime())
      .toBeGreaterThanOrEqual(now.getTime());
    expect(displayed.find((step) => step.id === "bake-pizza")?.scheduledAt)
      .toBe(new Date("2026-07-02T16:00").toISOString());
    expect(displayed.find((step) => step.id === "preheat-oven")?.scheduledAt)
      .toBe(new Date("2026-07-02T14:45").toISOString());
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
      recipeSnapshot: { fermentation: "6h-room" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
      anchorTime: generated.anchorTime,
    });

    expect(resolveSessionDoughStartTime({ planningResult: recipe.planningInfo.result, session, anchorTime: generated.anchorTime })).toMatchObject({
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
      plannedFermentationHours: 48,
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
    expect(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(laterStartDate.toISOString());
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
    expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt);
    expect(displayed.find((step) => step.id === "rest-dough")?.scheduledAt).toBe(generated.steps.find((step) => step.id === "rest-dough")?.scheduledAt);
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
    expect(displayed).toStrictEqual(generated.steps);
  });

  it("stores a missed recommended dough start as a stable timeline snapshot", () => {
    const now = new Date("2026-07-03T15:18:00");
    const target = new Date("2026-07-04T18:00:00");
    const session = createPizzaSession({
      id: "missed-recommend-dough-start-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-04T18:00",
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
    const generatedMix = generated.steps.find((step) => step.id === "mix-dough");
    expect(generatedMix?.scheduledAt).toBe(now.toISOString());

    const resolution = resolveSessionDoughStartTime({
      planningResult: recipe.planningInfo.result,
      session,
      steps: generated.steps,
      now,
    });
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
      now,
    });

    expect(resolution).toMatchObject({
      mode: "recommend",
      label: "Dough start: DoughTools recommendation",
    });
    expect(resolution.warning).toBeUndefined();
    expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(now.toISOString());
    expect(displayed.find((step) => step.id === "cold-ferment")?.scheduledAt)
      .toBe(new Date(now.getTime() + 60 * 60_000).toISOString());
    expect(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(now.toISOString());
    expect(Math.round((target.getTime() - new Date(displayed.find((step) => step.id === "mix-dough")!.scheduledAt!).getTime()) / 3_600_000))
      .toBe(27);
  });

  it("keeps a future recommended dough start when the recommendation has not passed", () => {
    const now = new Date("2026-07-02T09:00:00");
    const session = createPizzaSession({
      id: "future-recommend-dough-start-session",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-04T18:00",
      doughStartMode: "recommend",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
      recipeSnapshot: { fermentation: "48h-cold" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
      now,
    });
    const resolution = resolveSessionDoughStartTime({
      planningResult: recipe.planningInfo.result,
      session,
      steps: generated.steps,
      now,
    });

    expect(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(now.toISOString());
    expect(generated.steps.find((step) => step.id === "cold-ferment")?.scheduledAt)
      .toBe(new Date(now.getTime() + 60 * 60_000).toISOString());
    expect(displayed).toStrictEqual(generated.steps);
    expect(resolution.warning).toBeUndefined();
    expect(resolution.label).toBe("Dough start: DoughTools recommendation");
  });

  it.each([
    { label: "24h", plannedHours: 24 },
    { label: "48h", plannedHours: 48 },
    { label: "72h", plannedHours: 72 },
    { label: "26.3h", plannedHours: 26.3 },
  ])("uses the selected $label fermentation length as the Timeline dough-start basis", ({ plannedHours }) => {
    const now = new Date("2026-07-02T09:00:00");
    const target = new Date("2026-07-07T16:00:00");
    const expectedStart = new Date(target.getTime() - plannedHours * 3_600_000);
    const session = createPizzaSession({
      id: `selected-fermentation-${plannedHours}-timeline`,
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-07T16:00",
      doughStartMode: "recommend",
      plannedFermentationHours: plannedHours,
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
      recipeSnapshot: { fermentation: "12h-room" },
    }, now);

    const generated = generatePizzaSessionTimeline(session, now).timeline!;

    expect(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(expectedStart.toISOString());
    expect(generated.steps.find((step) => step.id === "rest-dough")?.scheduledAt)
      .toBe(new Date(expectedStart.getTime() + 30 * 60_000).toISOString());
    expect(generated.steps.find((step) => step.id === "cold-ferment")?.scheduledAt)
      .toBe(new Date(expectedStart.getTime() + 60 * 60_000).toISOString());
    expect(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .not.toBe(new Date(target.getTime() - 30 * 3_600_000).toISOString());
  });

  it("uses an under-24h room fermentation basis without forcing the Timeline to 24h", () => {
    const now = new Date("2026-07-02T08:00:00");
    const target = new Date("2026-07-02T20:00:00");
    const session = createPizzaSession({
      id: "under-24h-room-fermentation-timeline",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-02T20:00",
      doughStartMode: "recommend",
      pizzaStyle: "pizza-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "gas",
      flour: "tipo-00",
      recipeSnapshot: { fermentation: "12h-room" },
    }, now);

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const roomFerment = generated.steps.find((step) => step.id === "room-ferment");

    expect(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(new Date(target.getTime() - 12 * 3_600_000).toISOString());
    expect(roomFerment?.scheduledAt).toBe(new Date(now.getTime() + 60 * 60_000).toISOString());
    expect(roomFerment).toMatchObject({
      label: "Room temperature ferment",
      description: "Keep the covered dough at room temperature for the planned fermentation time.",
    });
    expect(generated.steps.some((step) => step.id === "cold-ferment")).toBe(false);
  });

  it("changes the generated schedule and input signature when selected fermentation length changes", () => {
    const now = new Date("2026-07-02T09:00:00");
    const base = {
      status: "planning" as const,
      currentStep: "recipe" as const,
      targetEatTime: "2026-07-07T16:00",
      doughStartMode: "recommend" as const,
      pizzaStyle: "home-oven" as const,
      pizzaPreset: "margherita" as const,
      pizzaCount: 4,
      ovenType: "home" as const,
      flour: "tipo-00" as const,
      recipeSnapshot: { fermentation: "12h-room" as const },
    };
    const selected24 = createPizzaSession({
      ...base,
      id: "selected-24h-timeline-signature",
      plannedFermentationHours: 24,
    }, now);
    const selected48 = createPizzaSession({
      ...base,
      id: "selected-48h-timeline-signature",
      plannedFermentationHours: 48,
    }, now);

    const timeline24 = generatePizzaSessionTimeline(selected24, now).timeline!;
    const timeline48 = generatePizzaSessionTimeline(selected48, now).timeline!;

    expect(timeline24.inputSignature).not.toBe(timeline48.inputSignature);
    expect(timeline24.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .not.toBe(timeline48.steps.find((step) => step.id === "mix-dough")?.scheduledAt);
    expect(timeline24.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(new Date("2026-07-06T16:00").toISOString());
    expect(timeline48.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(new Date("2026-07-05T16:00").toISOString());
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
      recipeSnapshot: { fermentation: "48h-cold" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
      anchorTime: generated.anchorTime,
    });

    expect(displayed.some((step) => step.id === "cold-ferment")).toBe(true);
    expect(displayed.find((step) => step.id === "cold-ferment")).toMatchObject({
      label: "Cold fermentation",
      description: "Keep the covered dough in the fridge for the planned cold fermentation time.",
      beginnerNote: "Keep the dough covered in the fridge at the planned temperature.",
    });
    expect(displayed.map((step) => `${step.label} ${step.description} ${step.beginnerNote}`).join(" "))
      .not.toMatch(/Room temperature ferment|at room temperature/i);
    expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(now.toISOString());
    expect(displayed.find((step) => step.id === "cold-ferment")?.scheduledAt).toBe(new Date(now.getTime() + 60 * 60_000).toISOString());
  });

  it("normalizes stale room fermentation timeline copy to cold copy when the selected plan is cold", () => {
    const now = new Date("2026-07-02T18:00:00");
    const session = createPizzaSession({
      id: "timeline-stale-room-copy-cold-plan",
      status: "planning",
      currentStep: "timeline",
      targetEatTime: "2026-07-04T12:00",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
      recipeSnapshot: { fermentation: "48h-cold" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const staleSteps = generated.steps.map((step) => (
      step.id === "cold-ferment"
        ? {
          ...step,
          id: "room-ferment",
          label: "Room temperature ferment",
          description: "Keep the covered dough at room temperature for the planned fermentation time.",
          beginnerNote: "Keep the dough covered and let it rise at room temperature.",
        }
        : step
    ));
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: staleSteps,
      planningResult: recipe.planningInfo.result,
      session,
    });
    const fermentationStep = displayed.find((step) => step.id === "cold-ferment");

    expect(fermentationStep).toMatchObject({
      label: "Cold fermentation",
      description: "Keep the covered dough in the fridge for the planned cold fermentation time.",
      beginnerNote: "Keep the dough covered in the fridge at the planned temperature.",
    });
    expect(displayed.some((step) => step.id === "room-ferment")).toBe(false);
    expect(displayed.map((step) => `${step.label} ${step.description} ${step.beginnerNote}`).join(" "))
      .not.toMatch(/Room temperature ferment|at room temperature/i);
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
      recipeSnapshot: { fermentation: "48h-cold" },
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
    expect(displayed.find((step) => step.id === "cold-ferment")?.label).toBe("Cold fermentation");
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
        recipeSnapshot: { fermentation: "48h-cold" },
      }, now);
      const recipe = buildSessionRecipe(session, now);
      if (!recipe.ok || !recipe.planningInfo.ok) throw new Error(`Expected planning info for ${horizon.label}`);
      expect(recipe.planningInfo.result.startWindowRecommendation?.category).toBe(horizon.expectedStartWindow);

      const generated = generatePizzaSessionTimeline(session, now).timeline!;
      const displayed = timelineStepsForPlanningSummaryDisplay({
        steps: generated.steps,
        planningResult: recipe.planningInfo.result,
        session,
      });

      expect(displayed.some((step) => step.id === "cold-ferment")).toBe(true);
      if (horizon.adjustsPastStart) {
        expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(now.toISOString());
      } else {
        expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt);
      }
      expect(new Date(displayed.find((step) => step.id === "mix-dough")?.scheduledAt ?? 0).getTime()).toBeGreaterThanOrEqual(now.getTime());
    }
  });

  it("uses the selected long-horizon fermentation option to anchor displayed dough timing", () => {
    const now = new Date("2026-07-02T09:00:00");
    const target = new Date("2026-07-10T09:00:00");
    const selectedStart = new Date(target.getTime() - 48 * 3_600_000);
    const session = createPizzaSession({
      id: "timeline-selected-long-horizon-option",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-10T09:00",
      doughStartMode: "later",
      doughEarliestStartTime: selectedStart.toISOString(),
      plannedFermentationHours: 48,
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
      now,
    });

    expect(recipe.continuousYeast?.basisLabel).toBe("48 h cold fermentation");
    expect(generated.steps.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(selectedStart.toISOString());
    expect(displayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(selectedStart.toISOString());
    expect(displayed.find((step) => step.id === "rest-dough")?.scheduledAt)
      .toBe(new Date(selectedStart.getTime() + 30 * 60_000).toISOString());
    expect(displayed.find((step) => step.id === "cold-ferment")?.scheduledAt)
      .toBe(new Date(selectedStart.getTime() + 60 * 60_000).toISOString());
    expect(displayed.find((step) => step.id === "cold-ferment")?.label).toBe("Cold fermentation");
  });

  it("prefers selected cold fermentation over a stale room recipe snapshot in Timeline display", () => {
    const now = new Date("2026-07-02T09:00:00");
    const target = new Date("2026-07-10T09:00:00");
    const selectedStart = new Date(target.getTime() - 48 * 3_600_000);
    const session = createPizzaSession({
      id: "timeline-selected-cold-stale-room-snapshot",
      status: "planning",
      currentStep: "timeline",
      targetEatTime: "2026-07-10T09:00",
      doughStartMode: "later",
      doughEarliestStartTime: selectedStart.toISOString(),
      plannedFermentationHours: 48,
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
      recipeSnapshot: { fermentation: "12h-room" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const staleSteps = generated.steps.map((step) => (
      step.id === "cold-ferment"
        ? {
          ...step,
          id: "room-ferment",
          label: "Room temperature ferment",
          description: "Keep the covered dough at room temperature for the planned fermentation time.",
          beginnerNote: "Keep the dough covered and let it rise at room temperature.",
        }
        : step
    ));
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: staleSteps,
      planningResult: recipe.planningInfo.result,
      session,
      now,
    });
    const fermentationStep = displayed.find((step) => step.id === "cold-ferment");

    expect(recipe.continuousYeast?.basisLabel).toBe("48 h cold fermentation");
    expect(fermentationStep).toMatchObject({
      label: "Cold fermentation",
      description: "Keep the covered dough in the fridge for the planned cold fermentation time.",
      beginnerNote: "Keep the dough covered in the fridge at the planned temperature.",
    });
    expect(displayed.some((step) => step.id === "room-ferment")).toBe(false);
    expect(displayed.map((step) => `${step.label} ${step.description} ${step.beginnerNote}`).join(" "))
      .not.toMatch(/Room temperature ferment|at room temperature/i);
  });

  it("uses the recipe cold fermentation basis over a stale room recipe snapshot in Timeline display", () => {
    const now = new Date("2026-07-02T20:00:00");
    const session = createPizzaSession({
      id: "timeline-recipe-cold-basis-stale-room-snapshot",
      status: "planning",
      currentStep: "timeline",
      targetEatTime: "2026-07-04T12:00",
      doughStartMode: "now",
      pizzaStyle: "pizza-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "gas",
      flour: "tipo-00",
      recipeSnapshot: { fermentation: "12h-room" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
      fermentationMode: recipe.continuousYeast?.recommendation.fermentationMode,
      anchorTime: generated.anchorTime,
    });
    const fermentationStep = displayed.find((step) => step.id === "cold-ferment");

    expect(recipe.continuousYeast?.basisLabel).toBe("40 h cold fermentation");
    expect(generated.steps.some((step) => step.id === "cold-ferment")).toBe(true);
    expect(generated.steps.some((step) => step.id === "room-ferment")).toBe(false);
    expect(fermentationStep).toMatchObject({
      label: "Cold fermentation",
      description: "Keep the covered dough in the fridge for the planned cold fermentation time.",
      beginnerNote: "Keep the dough covered in the fridge at the planned temperature.",
    });
    expect(displayed.some((step) => step.id === "room-ferment")).toBe(false);
    expect(`${fermentationStep?.label} ${fermentationStep?.description} ${fermentationStep?.beginnerNote}`)
      .not.toMatch(/Room temperature ferment|at room temperature/i);
  });

  it("keeps room-temperature fermentation Timeline copy for room fermentation plans", () => {
    const now = new Date("2026-07-08T10:00:00.000Z");
    const session = createPizzaSession({
      id: "timeline-room-fermentation-copy",
      status: "planning",
      currentStep: "timeline",
      targetEatTime: "2026-07-08T20:00",
      doughStartMode: "now",
      pizzaStyle: "pizza-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "gas",
      flour: "tipo-00",
      recipeSnapshot: { fermentation: "12h-room" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
      anchorTime: generated.anchorTime,
    });
    const fermentationStep = displayed.find((step) => step.id === "room-ferment");

    expect(fermentationStep).toMatchObject({
      label: "Room temperature ferment",
      description: "Keep the covered dough at room temperature for the planned fermentation time.",
      beginnerNote: "Keep the dough covered and let it rise at room temperature.",
    });
    expect(displayed.map((step) => `${step.label} ${step.description} ${step.beginnerNote}`).join(" "))
      .not.toMatch(/Cold fermentation|fridge/i);
  });

  it("uses neutral Timeline fermentation copy when fermentation type cannot be resolved", () => {
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: [{
        id: "cold-ferment",
        label: "Cold ferment",
        status: "todo",
        kind: "passive",
        description: "Move the dough into a cool fermentation phase if your plan uses cold time.",
        helperCopy: "Cold time slows fermentation and gives more scheduling flexibility.",
      }],
    });

    expect(displayed[0]).toMatchObject({
      id: "ferment-dough",
      label: "Ferment dough",
      description: "Keep the dough covered and follow the planned fermentation timing.",
      helperCopy: "Fermentation timing affects dough strength, flavor, and readiness.",
    });
    expect(`${displayed[0].label} ${displayed[0].description} ${displayed[0].helperCopy}`)
      .not.toMatch(/fridge|cold fermentation|room temperature/i);
  });

  it("derives current and next actionable Timeline steps from the generated step order", () => {
    const now = new Date("2026-07-08T10:00:00.000Z");
    const session = createPizzaSession({
      id: "timeline-current-action-order",
      status: "planning",
      currentStep: "timeline",
      targetEatTime: "2026-07-08T20:00",
      doughStartMode: "now",
      pizzaStyle: "pizza-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "gas",
      flour: "tipo-00",
      recipeSnapshot: { fermentation: "12h-room" },
    }, now);
    const recipe = buildSessionRecipe(session, now);
    if (!recipe.ok || !recipe.planningInfo.ok) throw new Error("Expected planning info");

    const generated = generatePizzaSessionTimeline(session, now).timeline!;
    const displayed = timelineStepsForPlanningSummaryDisplay({
      steps: generated.steps,
      planningResult: recipe.planningInfo.result,
      session,
      anchorTime: generated.anchorTime,
    });
    const actionable = displayed.filter((step) => step.id !== "review-result");

    expect(actionable[0].id).toBe("mix-dough");
    expect(actionable[1].id).toBe("rest-dough");
    expect(actionable.find((step) => step.id === "room-ferment")?.id).toBe("room-ferment");

    const afterMix = actionable.map((step) => (
      step.id === "mix-dough" ? { ...step, status: "done" as const } : step
    ));
    expect(afterMix.find((step) => step.status === "todo")?.id).toBe("rest-dough");
  });

  it("keeps the Timeline hero focused on current action and live next timing", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function nextActionForTimeline");
    expect(page).toContain("function actionableTimelineSteps");
    expect(page).toContain("const currentActionStep = actionableSteps.find((step) => step.status === \"todo\")");
    expect(page).toContain("const followingActionStep = currentActionIndex >= 0");
    expect(page).toContain("Now");
    expect(page).toContain("Planned for");
    expect(page).toContain("Next:");
    expect(page).toContain('<div className="hidden min-w-0 sm:block">');
    expect(page).toContain('firstMixStepIsWaitingToBegin ? "hidden sm:grid" : "grid"');
    expect(page).toContain('<div className="mt-4 sm:hidden">');
    expect(page).toContain('<div className="mt-4 hidden items-start gap-2 border-t border-ink/10 pt-3 text-sm font-extrabold leading-6 text-ink/65 sm:flex">');
    expect(page).toContain("formatTimelineLiveTiming(currentActionTime, currentTime)");
    expect(page).toContain("formatTimelineLiveTiming(followingActionStep?.scheduledAt, currentTime)");
    expect(page).toContain("const nextStepSummary = followingActionStep");
    expect(page).toContain("formatSessionPlannedTime(currentActionTime, currentTime)");
    expect(page).toContain("formatSessionPlannedTime(followingActionStep.scheduledAt, currentTime)");
    expect(page).not.toContain(">Scheduled<");
    expect(page).toContain("Step ${currentActionIndex + 1} of ${actionableSteps.length}");
    expect(page).toContain("timelineStartActionLabel()");
    expect(page).toContain("cta: \"Start cooking\"");
    expect(page).toContain("cta: \"Review my pizza\"");
    expect(page).toContain("onClick={handleNextAction}");
    expect(page).toContain("{nextAction.title}");
    expect(page).toContain("{nextAction.subtext}");
    expect(page).toContain('<p className="mt-3 hidden text-sm leading-6 text-ink/60 sm:block">{nextAction.subtext}</p>');
    expect(page).toContain('levelCompactOnMobile');
    expect(page).toContain('hideBodyOnMobile');
    expect(page).toContain('className: "hidden px-3 py-2 sm:inline-flex"');
    expect(page).toContain("const renderNextActionCard");
    expect(page).not.toContain("const nextStep = displayTimelineSteps.find((step) => step.status === \"todo\")");
    expect(page).not.toContain("timeline-next-action-heading");
    expect(page).not.toContain("timeline-next-step-heading");
    expect(page).not.toContain("Review shopping →");
    expect(page).toContain("href: \"/session/kitchen?from=timeline\"");
    expect(page).toContain("href: \"/session/review\"");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).not.toContain("Recommended action");
    expect(page).not.toContain("aria-labelledby=\"next-up-heading\"");
    expect(page).not.toContain("recipeQuery ? `/plan?");
  });

  it("uses shared visual-system helpers for Timeline cards, status badges and actions", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("buttonClass");
    expect(page).toContain("cardClass");
    expect(page).toContain("statusPillClass");
    expect(page).toContain('variant: "success"');
    expect(page).not.toContain('variant: "guidance"');
    expect(page).toContain("bg-status-success/10");
    expect(page).toContain("bg-action-primary/10");
    expect(page).toContain('step.id === "bake-pizza"');
    expect(page).not.toContain('tone: "forest"');
  });

  it("adds a shopping checkpoint before service and bake steps without changing timeline data", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function ShoppingCheckpointRow");
    expect(page).toContain("Shopping checkpoint");
    expect(page).toContain("Shopping list");
    expect(page).not.toContain("Shopping should be handled before Timeline.");
    expect(page).not.toContain("Pizza choices and shopping");
    expect(page).not.toContain("Timeline stays focused on when to work; Shopping owns toppings and buy-list checks.");
    expect(page).toContain("Use Back if you still need to check ingredients.");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).not.toContain("Review shopping →");
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

  it("renders compact timeline rows with step number, title, date/time, status and relative timing", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("Step {index + 1}");
    expect(page).not.toContain("formatShortDateTime(step.scheduledAt)");
    expect(page).toContain("{step.label}");
    expect(page).toContain("{step.description}");
    expect(page).toContain("statusLabel(step, currentActionStep)");
    expect(page).toContain("relativeFromTarget(step.scheduledAt, targetTime)");
    expect(page).toContain("step.id === currentActionStep?.id");
    expect(page).toContain("formatTimelineDate(step.scheduledAt)");
    expect(page).toContain("formatTimelineTime(step.scheduledAt)");
    expect(page).not.toContain('data-testid="timeline-step-media-panel"');
    expect(page).not.toContain("function TimelineStepMediaPanel");
    expect(page).not.toContain("flex min-w-0 items-stretch gap-3");
    expect(page).not.toContain("w-[5.5rem]");
    expect(page).not.toContain("<TimelineStepMediaPanel step={step} />");
    expect(page).not.toContain("function timelineStepImagePath");
    expect(page).not.toContain('data-testid="timeline-step-media-image"');
    expect(page).not.toContain('src={imagePath}');
    expect(page).not.toContain('getDoughStepPrimaryImageForTimelineStep(step.id)');
    expect(page).not.toContain("return doughStepImage.src");
    expect(page).not.toContain('getDoughStepPrimaryImageForTimelineStep("mix-dough")?.src');
    expect(page).not.toContain('"/dough-guide/guide-step-03-mix.webp"');
    expect(page).not.toContain('return "/images/timeline/preheat-oven.webp"');
    expect(page).not.toContain('return "/images/timeline/prepare-toppings.webp"');
    expect(page).not.toContain('return "/images/timeline/bake-pizza.webp"');
    expect(page).not.toContain('return "/images/timeline/review-result.webp"');
    expect(page).not.toMatch(/https?:\/\//);
    expect(page).not.toContain("bottom-5 left-1/2 h-9 w-16");
    expect(page).not.toContain("rounded-2xl text-xl ring-1 sm:h-12 sm:w-12 sm:text-2xl");
    expect(page).not.toContain('data-testid="timeline-step-watermark"');
    expect(page).not.toContain("onClick={() => markDone(step.id)}");
  });

  it("removes critical moments as a separate chronological what-happens-when list", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).not.toContain("function getCriticalMoments");
    expect(page).not.toContain("function relativeFromNow");
    expect(page).toContain("\"cold-ferment\"");
    expect(page).toContain("\"room-temperature-rest\"");
    expect(page).toContain("\"preheat-oven\"");
    expect(page).toContain("\"bake-pizza\"");
    expect(page).not.toContain("criticalMoments.map((step)");
    expect(page).not.toContain("criticalMomentTitle(step)");
    expect(page).not.toContain("Cold fermentation");
    expect(page).not.toContain("Put dough in fridge");
    expect(page).not.toContain("Take dough out");
    expect(page).toContain("formatTimelineDate(step.scheduledAt)");
    expect(page).toContain("formatTimelineTime(step.scheduledAt)");
    expect(page).not.toContain("relativeFromNow(step.scheduledAt)");
    expect(page).not.toContain("What happens when");
    expect(page).not.toContain("The most important moments from your actual pizza timeline.");
    expect(page).not.toContain("return diffMinutes > 0 ? `In ${parts}` : `${parts} ago`");
    expect(page).not.toContain("return aTime - bTime");
    expect(page).not.toContain("Don’t miss these moments");
    expect(page).not.toContain("These are pulled from your actual timeline, not a separate checklist.");
    expect(page).not.toContain("sm:grid-cols-2 sm:gap-3");
  });

  it("keeps Back and Next navigation aligned with the next action", () => {
    const page = source("app/session/timeline/page.tsx");
    const actionBlock = page.slice(page.indexOf("<button"), page.indexOf("<section aria-labelledby=\"full-timeline-heading\""));
    const backBlock = page.slice(page.indexOf("<nav aria-label=\"Timeline navigation\""), page.indexOf("<section aria-labelledby=\"timeline-guidance-heading\""));

    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).toContain("startCurrentRuntimeStepAndGoToKitchen");
    expect(page).toContain("router.push(nextAction.href)");
    expect(page).toContain("{nextAction.cta}");
    expect(page).not.toContain("BottomActionBar");
    expect(backBlock).toContain("href=\"/session/shopping\"");
    expect(backBlock).toContain("Back");
    expect(actionBlock).toContain("type=\"button\"");
    expect(actionBlock).toContain("onClick={handleNextAction}");
    expect(actionBlock).toContain("{nextAction.cta}");
    expect(page.match(/onClick=\{handleNextAction\}/g)?.length).toBe(1);
    expect(page.indexOf("timeline-current-action-card")).toBeLessThan(page.indexOf("aria-label=\"Pizza timeline steps\""));
    expect(page.indexOf("aria-label=\"Pizza timeline steps\"")).toBeLessThan(page.indexOf("<nav aria-label=\"Timeline navigation\""));
    expect(page).not.toContain("Review dough plan →");
  });

  it("simplifies the Timeline page ending without changing the action row", () => {
    const page = source("app/session/timeline/page.tsx");
    const helper = source("lib/pizza-session-timeline.ts");
    const backBlock = page.slice(page.indexOf("<nav aria-label=\"Timeline navigation\""), page.indexOf("<section aria-labelledby=\"timeline-guidance-heading\""));

    expect(page).not.toContain("Timing assumptions");
    expect(page).not.toContain("timeline.assumptions");
    expect(page).not.toContain("The target time is treated as the planned eating or baking moment saved in the Pizza Session.");
    expect(page).not.toContain("Timing is a practical guide, not a guarantee.");
    expect(page).not.toContain("User-facing times are rounded to practical 15-minute increments.");
    expect(page).not.toContain("Active tasks try to avoid the 22:00–07:00 quiet window");
    expect(page).not.toContain("SessionLocalOnlyNote");
    expect(page).not.toContain("No cloud sync, push notifications or email reminders are active yet.");
    expect(page).not.toContain("rounded-[1.5rem] border border-ink/10 bg-white/60");
    expect(page).toContain("overflow-x-clip");
    expect(backBlock).toContain("href=\"/session/shopping\"");
    expect(backBlock).toContain("Back");
    expect(backBlock).not.toContain("onClick={handleNextAction}");
    expect(backBlock).not.toContain("{nextAction.cta}");
    expect(backBlock).toContain("buttonClass({ className: \"w-full sm:w-auto\", variant: \"secondary\" })");
    expect(backBlock).toContain('className="mt-5 hidden justify-start border-t border-ink/10 pt-4 sm:mt-6 sm:flex"');
    expect(page.indexOf("aria-label=\"Pizza timeline steps\"")).toBeLessThan(page.indexOf("<nav aria-label=\"Timeline navigation\""));
    expect(helper).toContain("DEFAULT_TIMELINE_ASSUMPTIONS");
    expect(helper).toContain("TIMELINE_ROUNDING_MINUTES = 15");
    expect(helper).toContain("QUIET_HOURS_START = 22");
    expect(helper).toContain("QUIET_HOURS_END = 7");
  });

  it("warns before starting a scheduled dough step more than 60 minutes early", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(shouldWarnBeforeEarlyTimelineStart(
      "2026-07-08T20:00:00",
      new Date("2026-07-08T10:00:00"),
    )).toBe(true);
    expect(formatEarlyTimelineStartTime("2026-07-08T20:00:00")).toBe("Wed 8 Jul at 20:00");
    expect(page).toContain("shouldWarnBeforeEarlyTimelineStart(nextAction.scheduledAt)");
    expect(page).toContain("setEarlyStartStep(currentActionStep ?? null)");
    expect(page).toContain("Start making the dough early?");
    expect(page).toContain("Your planned start time is in {formatTimelineStartRemainingDuration(earlyStartStep.scheduledAt, currentTime)}.");
    expect(page).toContain("Starting now will move your dough-making schedule earlier.");
    expect(page).toContain("Keep the planned time");
    expect(page).toContain("Start making the dough");
    expect(page).toContain("formatTimelineStartRemainingDuration");
    expect(page).toContain("startCurrentRuntimeStepAndGoToKitchen()");
    expect(page).toContain("startPizzaSessionTimelineStep(session, currentActionStep.id)");
    expect(page).toContain("aria-modal=\"true\"");
  });

  it("does not warn at 60 minutes, due time or overdue time", () => {
    expect(shouldWarnBeforeEarlyTimelineStart(
      "2026-07-08T20:00:00",
      new Date("2026-07-08T19:00:00"),
    )).toBe(false);
    expect(shouldWarnBeforeEarlyTimelineStart(
      "2026-07-08T20:00:00",
      new Date("2026-07-08T20:00:00"),
    )).toBe(false);
    expect(shouldWarnBeforeEarlyTimelineStart(
      "2026-07-08T20:00:00",
      new Date("2026-07-08T20:05:00"),
    )).toBe(false);
    expect(shouldWarnBeforeEarlyTimelineStart("not-a-date", new Date("2026-07-08T10:00:00"))).toBe(false);
  });

  it("keeps timeline page focused without repeated metadata or footer clutter", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).not.toContain("year: \"numeric\"");
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
      "Room temperature ferment",
      "Ball dough",
      "Final room rest",
      "Preheat oven",
      "Prepare sauce and toppings",
      "Bake pizza",
      "Review result",
    ]);
    expect(result.timeline?.steps[0].scheduledAt).toBeDefined();
    expect(new Date(result.timeline?.steps[0].scheduledAt ?? 0).getTime()).toBeLessThan(new Date("2026-06-27T18:30").getTime());
    expect(result.timeline?.steps[0].description).toContain("dry yeast");
    expect(result.timeline?.steps.find((step) => step.id === "bake-pizza")?.scheduledAt).toBeDefined();
    expect(result.nextStep?.id).toBe("mix-dough");
    expect(result.assumptions.join(" ")).toContain("practical guide");
  });

  it("uses the selected yeast type in Timeline mix-dough copy when the recipe snapshot has one", () => {
    const session = createPizzaSession({
      id: "timeline-yeast-type-session",
      targetEatTime: "2026-06-27T18:30",
      recipeSnapshot: {
        yeastType: "idy",
      },
    });

    const timeline = generatePizzaSessionTimeline(session).timeline!;

    expect(timeline.steps[0].label).toBe("Mix dough");
    expect(timeline.steps[0].description).toContain("instant dry yeast");
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
      "Ferment dough",
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

  it("does not rebase Kitchen progress to Timeline when Back opens an older timeline snapshot", () => {
    const storage = new MemoryStorage();
    const kitchenSession = createAndSavePizzaSession({
      id: "timeline-back-kitchen-progress",
      status: "preparing",
      currentStep: "prep",
      targetEatTime: "2026-07-04T20:00:00.000Z",
      targetBakeTime: "2026-07-04T20:00:00.000Z",
      pizzaCount: 2,
      doughBallWeight: 260,
      recipeSnapshot: {
        balls: 2,
        ballWeight: 260,
        fermentation: "24h-cold",
      },
      timeline: {
        generatedAt: "2026-07-04T09:30:00.000Z",
        targetEatTime: "2026-07-04T20:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "done", kind: "active", scheduledAt: "2026-07-04T10:05:00.000Z" },
          { id: "ball-dough", label: "Ball dough", status: "todo", kind: "active", scheduledAt: "2026-07-04T11:00:00.000Z" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-07-04T10:05:00.000Z",
          actualCompletedAt: "2026-07-04T10:15:00.000Z",
        },
      },
      updatedAt: "2026-07-04T10:15:00.000Z",
      lastSavedAt: "2026-07-04T10:15:00.000Z",
    }, storage, new Date("2026-07-04T10:15:00.000Z"));
    setActivePizzaSession(kitchenSession.id, storage);

    const { session: afterBack, result } = generateAndSaveActivePizzaSessionTimeline(storage, new Date("2026-07-04T10:30:00.000Z"));

    expect(result.ok).toBe(true);
    expect(afterBack?.currentStep).toBe("prep");
    expect(afterBack?.updatedAt).toBe("2026-07-04T10:15:00.000Z");
    expect(afterBack?.timeline?.steps.find((step) => step.id === "mix-dough")?.status).toBe("done");
    expect(afterBack?.stepRuntime?.["mix-dough"]?.actualCompletedAt).toBe("2026-07-04T10:15:00.000Z");
    expect(getActivePizzaSession(storage)?.currentStep).toBe("prep");
  });

  it("keeps a start-now room-temperature Timeline stable after Kitchen Mode and Back", () => {
    const storage = new MemoryStorage();
    const firstOpen = new Date("2026-07-08T16:20:00.000Z");
    const backToTimeline = new Date("2026-07-08T17:10:00.000Z");
    const session = createAndSavePizzaSession({
      id: "timeline-kitchen-back-stability",
      status: "planning",
      currentStep: "recipe",
      targetEatTime: "2026-07-09T12:15:00.000Z",
      targetBakeTime: "2026-07-09T12:15:00.000Z",
      doughStartMode: "now",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      doughBallWeight: 260,
      ovenType: "home",
      flour: "tipo-00",
      yeastType: "instant-dry",
      recipeSnapshot: {
        balls: 4,
        ballWeight: 260,
        fermentation: "12h-room",
      },
    }, storage, firstOpen);
    setActivePizzaSession(session.id, storage);

    const first = generateAndSaveActivePizzaSessionTimeline(storage, firstOpen).session!;
    const firstRecipe = buildSessionRecipe(first, firstOpen);
    if (!firstRecipe.ok || !firstRecipe.planningInfo.ok) throw new Error("Expected planning info");
    const firstDisplayed = timelineStepsForPlanningSummaryDisplay({
      steps: first.timeline!.steps,
      planningResult: firstRecipe.planningInfo.result,
      session: first,
      anchorTime: first.timeline!.anchorTime,
    });

    const second = generateAndSaveActivePizzaSessionTimeline(storage, backToTimeline).session!;
    const secondRecipe = buildSessionRecipe(second, backToTimeline);
    if (!secondRecipe.ok || !secondRecipe.planningInfo.ok) throw new Error("Expected planning info");
    const secondDisplayed = timelineStepsForPlanningSummaryDisplay({
      steps: second.timeline!.steps,
      planningResult: secondRecipe.planningInfo.result,
      session: second,
      anchorTime: second.timeline!.anchorTime,
    });

    expect(first.timeline?.anchorTime).toBe(firstOpen.toISOString());
    expect(second.timeline?.anchorTime).toBe(firstOpen.toISOString());
    expect(second.timeline?.generatedAt).toBe(first.timeline?.generatedAt);
    expect(second.updatedAt).toBe(first.updatedAt);
    expect(second.lastSavedAt).toBe(first.lastSavedAt);
    expect(firstDisplayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(firstOpen.toISOString());
    expect(secondDisplayed.find((step) => step.id === "mix-dough")?.scheduledAt).toBe(firstOpen.toISOString());
    expect(secondDisplayed.find((step) => step.id === "rest-dough")?.scheduledAt)
      .toBe(new Date(firstOpen.getTime() + 30 * 60_000).toISOString());
    expect(secondDisplayed.find((step) => step.id === "room-ferment")?.scheduledAt)
      .toBe(new Date(firstOpen.getTime() + 60 * 60_000).toISOString());
    expect(secondDisplayed.find((step) => step.id === "bake-pizza")?.scheduledAt)
      .toBe("2026-07-09T12:00:00.000Z");
    expect(secondDisplayed.some((step) => step.id === "cold-ferment")).toBe(false);
    expect(secondDisplayed.map((step) => `${step.label} ${step.description} ${step.helperCopy}`).join(" "))
      .not.toMatch(/Cold ferment|fridge|Take dough out|Cold time slows/i);
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

  it("moves optional Dough Guide help into a secondary disclosure without replacing the primary action", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("getDoughGuideLinkForSessionStep(currentActionStep, \"/session/timeline\")");
    expect(page).toContain("const [guidanceOpen, setGuidanceOpen] = useState(false)");
    expect(page).toContain("timeline-optional-guidance-panel");
    expect(page).toContain("aria-expanded={guidanceOpen}");
    expect(page).toContain("currentDoughGuideLink.href");
    expect(page).toContain("currentDoughGuideLink.ariaLabel");
    expect(page).toContain("{currentDoughGuideLink.label}");
    expect(page).toContain("{nextAction.cta}");
    expect(page).toContain("onClick={handleNextAction}");
    expect(page.match(/onClick=\{handleNextAction\}/g)?.length).toBe(1);
    expect(page.indexOf("aria-label=\"Pizza timeline steps\"")).toBeLessThan(page.indexOf("timeline-optional-guidance-panel"));
    expect(page).toContain("shouldWarnBeforeEarlyTimelineStart(nextAction.scheduledAt)");
  });

  it("keeps baking troubleshooting help in the optional guidance disclosure", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("getPizzaSessionBakingTroubleshootingLink");
    expect(page).toContain("const bakingTroubleshootingLink = getPizzaSessionBakingTroubleshootingLink()");
    expect(page).not.toContain('step.id === "bake-pizza" &&');
    expect(page).toContain("timeline-optional-guidance-panel");
    expect(page).toContain("bakingTroubleshootingLink.href");
    expect(page).toContain("bakingTroubleshootingLink.ariaLabel");
    expect(page).toContain("{bakingTroubleshootingLink.label}");
    expect(page).toContain("{nextAction.cta}");
    expect(page).toContain("onClick={handleNextAction}");
    expect(page).toContain("shouldWarnBeforeEarlyTimelineStart(nextAction.scheduledAt)");
  });
});
