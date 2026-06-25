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
} from "@/lib/pizza-session-timeline";
import { MemoryStorage } from "./helpers";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Pizza Session timeline", () => {
  it("adds the /session/timeline route and timeline helper", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "timeline", "page.tsx"))).toBe(true);
    expect(existsSync(join(process.cwd(), "lib", "pizza-session-timeline.ts"))).toBe(true);

    const page = source("app/session/timeline/page.tsx");
    expect(page).toContain("Your pizza timeline");
    expect(page).toContain("Next step");
    expect(page).toContain("Saved in this browser");
    expect(page).toContain("Open full Planner");
    expect(page).toContain("Copy schedule");
    expect(page).toContain("Mark done");
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
