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
    expect(page).toContain("Next step");
    expect(page).toContain("Saved in this browser");
    expect(page).toContain("Open Kitchen Mode");
    expect(page).toContain("Review dough plan");
    expect(page).toContain("Session summary");
    expect(page).toContain("How this timeline works");
    expect(page).toContain("Mark done");
    expect(page).toContain("Quiet-hours warning");
    expect(page).not.toContain("Copy schedule");
    expect(page).not.toContain("Create shopping list");
    expect(page).not.toContain("Open full Planner");
  });

  it("keeps the hero focused on the next timeline step and Kitchen Mode", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("Next step: {nextStep.label}");
    expect(page).toContain("Next step: Get pizza ingredients");
    expect(page).toContain("formatShortDateTime(nextStep.scheduledAt)");
    expect(page).toContain("href={shoppingIsNext ? \"/session/shopping\" : \"/session/kitchen\"}");
    expect(page).toContain("Open Kitchen Mode →");
    expect(page).toContain("Open shopping list →");
    expect(page).toContain("href=\"/session/recipe\"");
    expect(page).toContain("Review dough plan →");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).toContain("Shopping list");
    expect(page).not.toContain("recipeQuery ? `/plan?");
  });

  it("adds a shopping checkpoint before service and bake steps without changing timeline data", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function ShoppingCheckpointCard");
    expect(page).toContain("Shopping checkpoint");
    expect(page).toContain("Get pizza ingredients");
    expect(page).toContain("Check sauce, cheese and toppings before baking.");
    expect(page).toContain("You can do this while the dough is resting or fermenting.");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).toContain("Open shopping list →");
    expect(page).toContain("shoppingCheckpointState(session, nextStep)");
    expect(page).toContain("const firstServiceStepIndex = timeline?.steps.findIndex(isServiceTimelineStep) ?? -1");
    expect(page).toContain("const shoppingCheckpointInsertIndex = timeline");
    expect(page).toContain("index === shoppingCheckpointInsertIndex");
    expect(page).toContain("shoppingCheckpointInsertIndex === timeline.steps.length");
    expect(page.indexOf("index === shoppingCheckpointInsertIndex")).toBeLessThan(page.indexOf("Step {index + 1}"));
    expect(page).not.toContain("Create shopping list");
    expect(page).not.toContain("Open full Planner");
  });

  it("keeps the shopping checkpoint visible in normal timeline rendering instead of hiding it behind completion state", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("<ShoppingCheckpointCard checkpointState={checkpointState} shoppingIsNext={shoppingIsNext} />");
    expect(page).not.toContain("session?.shoppingList && <ShoppingCheckpointCard");
    expect(page).not.toContain("allStepsComplete && <ShoppingCheckpointCard");
    expect(page).not.toContain("shoppingIsNext && <ShoppingCheckpointCard");
    expect(page).not.toMatch(/\b(Avaa|Ostoskor|Juusto|Täytteet|Seuraava)\b/);
  });

  it("allows the hero to treat shopping as the next step after dough work", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("const shoppingIsNext = checkpointState === \"Next\"");
    expect(page).toContain("href={shoppingIsNext ? \"/session/shopping\" : \"/session/kitchen\"}");
    expect(page).toContain("{shoppingIsNext ? \"Open shopping list →\" : \"Open Kitchen Mode →\"}");
    expect(page).toContain("if (session?.shoppingList) return \"Done\"");
    expect(page).toContain("if (isDoughTimelineStep(nextStep)) return \"Upcoming\"");
    expect(page).toContain("if (isServiceTimelineStep(nextStep) || !nextStep) return \"Next\"");
  });

  it("shows a compact session summary without making oven a separate item", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("[\"Pizza preset\", preset?.name ?? \"Not set\"]");
    expect(page).toContain("[\"Target time\", formatDateTime(targetTime)]");
    expect(page).toContain("[\"Pizza count\"");
    expect(page).toContain("[\"Ball weight\", formatBallWeight(session)]");
    expect(page).toContain("[\"Flour\", flourLabel(session.recipeSnapshot?.flour ?? session.flour)]");
    expect(page).toContain("[\"Hydration\", formatPercent(session.recipeSnapshot?.hydration)]");
    expect(page).toContain("[\"Fermentation\", session.recipeSnapshot?.fermentation ?? \"Not set\"]");
    expect(page).toContain("[\"Yeast type\", formatYeastType(session)]");
    expect(page).not.toContain("[\"Oven\"");
  });

  it("renders timeline cards with step number, title, date/time, status and relative timing", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("Step {index + 1}");
    expect(page).toContain("formatShortDateTime(step.scheduledAt)");
    expect(page).toContain("{step.label}");
    expect(page).toContain("{step.description}");
    expect(page).toContain("statusLabel(step, shoppingIsNext ? undefined : nextStep)");
    expect(page).toContain("relativeFromTarget(step.scheduledAt, targetTime)");
    expect(page).toContain("step.id === nextStep?.id");
  });

  it("formats hero target time as a human-readable value with year", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("year: \"numeric\"");
    expect(page).toContain("Target: {formatDateTime(targetTime)}");
    expect(page).not.toContain("Target: {timeline.targetEatTime");
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
