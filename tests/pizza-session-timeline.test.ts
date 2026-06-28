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
    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={7}");
    expect(page).toContain("Timeline");
    expect(page).toContain("Timeline page");
    expect(page).toContain("Follow the key moments and you’ll always know what to do next.");
    expect(page).toContain("Next up");
    expect(page).toContain("What happens when");
    expect(page).toContain("Timing highlights");
    expect(page).toContain("Full timeline");
    expect(page).toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
    expect(page).toContain("Start dough →");
    expect(page).toContain("BottomActionBar");
    expect(page).toContain("href=\"/session/recipe\"");
    expect(page).toContain("href={nextAction.href}");
    expect(page).not.toContain("Session summary");
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

  it("keeps Next up focused on the real next action", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function nextActionForTimeline");
    expect(page).toContain("title: \"Get pizza ingredients\"");
    expect(page).toContain("cta: \"Start dough →\"");
    expect(page).toContain("cta: \"Continue baking →\"");
    expect(page).toContain("cta: \"Review your pizza →\"");
    expect(page).toContain("href={nextAction.href}");
    expect(page).toContain("{nextAction.title}");
    expect(page).toContain("{nextAction.subtext}");
    expect(page).toContain("Recommended action");
    expect(page).toContain("Open shopping list →");
    expect(page).toContain("href: \"/session/kitchen\"");
    expect(page).toContain("href: \"/session/review\"");
    expect(page).toContain("href=\"/session/shopping\"");
    expect(page).not.toContain("recipeQuery ? `/plan?");
  });

  it("adds a shopping checkpoint before service and bake steps without changing timeline data", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("function ShoppingCheckpointRow");
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

    expect(page).toContain("<ShoppingCheckpointRow checkpointState={checkpointState} shoppingIsNext={shoppingIsNext} />");
    expect(page).not.toContain("session?.shoppingList && <ShoppingCheckpointRow");
    expect(page).not.toContain("allStepsComplete && <ShoppingCheckpointRow");
    expect(page).not.toContain("shoppingIsNext && <ShoppingCheckpointRow");
    expect(page).not.toMatch(/\b(Avaa|Ostoskor|Juusto|Täytteet|Seuraava)\b/);
  });

  it("allows the next action to treat shopping as the next step after dough work", () => {
    const page = source("app/session/timeline/page.tsx");

    expect(page).toContain("const shoppingIsNext = checkpointState === \"Next\"");
    expect(page).toContain("if (shoppingIsNext)");
    expect(page).toContain("cta: \"Open shopping list →\"");
    expect(page).toContain("href: \"/session/shopping\"");
    expect(page).toContain("if (session?.shoppingList) return \"Done\"");
    expect(page).toContain("if (isDoughTimelineStep(nextStep)) return \"Upcoming\"");
    expect(page).toContain("if (isServiceTimelineStep(nextStep) || !nextStep) return \"Next\"");
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
    expect(page).toContain("statusLabel(step, shoppingIsNext ? undefined : nextStep)");
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

    expect(page).toContain("href=\"/session/recipe\"");
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
