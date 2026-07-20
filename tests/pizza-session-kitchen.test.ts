import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getExperienceLevelConfig } from "@/lib/experience-levels";
import { createPizzaSession, pizzaSessionContinueHref } from "@/lib/pizza-session";
import { generatePizzaSessionTimeline } from "@/lib/pizza-session-timeline";
import { formatTimelineLiveTiming } from "@/lib/timeline-live-timing";
import {
  completeKitchenTimelineStep,
  doughKitchenIngredientLines,
  formatKitchenFermentationCountdown,
  formatKitchenMixingWindowStatus,
  formatKitchenPlannedDuration,
  formatKitchenRestCountdown,
  formatKitchenStepWaitLabel,
  getEarlyTimedKitchenCompletionWarning,
  getKitchenFermentationMobileSummary,
  getKitchenExperienceGuidance,
  getKitchenModeForStep,
  getKitchenModeState,
  getKitchenPlannedFermentationDurationMinutes,
  getKitchenRestNextFermentationLabel,
  getKitchenStepWaitInfo,
  getKitchenTaskPresentation,
  getKitchenTaskInstruction,
  isKitchenFermentationStep,
  isMixDoughStep,
  recipeSnapshotIngredientLines,
  resolvePersistedKitchenStepId,
  shouldConfirmEarlyKitchenStepCompletion,
} from "@/lib/pizza-session-kitchen";
import {
  createAndSavePizzaSession,
  getActivePizzaSession,
  PIZZA_SESSIONS_STORAGE_KEY,
  setActivePizzaSession,
} from "@/lib/pizza-session-storage";
import { MemoryStorage } from "./helpers";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const sampleTimeline = {
  generatedAt: "2026-06-25T10:00:00.000Z",
  targetEatTime: "2026-06-27T18:30",
  steps: [
    {
      id: "mix-dough",
      label: "Mix dough",
      scheduledAt: "2026-06-26T12:30:00.000Z",
      status: "todo" as const,
      kind: "active" as const,
    },
    {
      id: "rest-dough",
      label: "Rest dough",
      scheduledAt: "2026-06-26T13:00:00.000Z",
      status: "todo" as const,
      kind: "passive" as const,
    },
    {
      id: "bake-pizza",
      label: "Bake pizza",
      scheduledAt: "2026-06-27T18:20:00.000Z",
      status: "todo" as const,
      kind: "active" as const,
    },
  ],
};

const recipeSnapshot = {
  balls: 4,
  ballWeight: 260,
  totalDough: 1040,
  flourAmount: 623.2,
  waterAmount: 398.85,
  saltAmount: 17.45,
  leavenerAmount: 0.5,
};

function fermentationTimeline(persistedFermentationId: string, label: string) {
  return {
    generatedAt: "2026-07-10T15:00:00.000Z",
    targetEatTime: "2026-07-11T08:00:00.000Z",
    steps: [
      { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-10T15:26:00.000Z", status: "done" as const, kind: "active" as const },
      { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-10T15:56:00.000Z", status: "done" as const, kind: "passive" as const },
      { id: persistedFermentationId, label, scheduledAt: "2026-07-10T16:26:00.000Z", status: "todo" as const, kind: "passive" as const },
      { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T02:26:00.000Z", status: "todo" as const, kind: "active" as const },
      { id: "room-temperature-rest", label: "Room temperature rest", scheduledAt: "2026-07-11T03:26:00.000Z", status: "todo" as const, kind: "passive" as const },
      { id: "preheat-oven", label: "Preheat oven", scheduledAt: "2026-07-11T05:26:00.000Z", status: "todo" as const, kind: "active" as const },
      { id: "bake-pizza", label: "Bake pizza", scheduledAt: "2026-07-11T08:00:00.000Z", status: "todo" as const, kind: "active" as const },
    ],
  };
}

function completedDoughRuntime() {
  return {
    "mix-dough": {
      actualCompletedAt: "2026-07-10T15:46:00.000Z",
    },
    "rest-dough": {
      actualCompletedAt: "2026-07-10T16:16:00.000Z",
    },
  };
}

describe("Pizza Session Kitchen Mode", () => {
  it("adds the /session/kitchen route with local-first task UI and safe states", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "kitchen", "page.tsx"))).toBe(true);
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("\"use client\"");
    expect(page).toContain("Kitchen Mode");
    expect(page).not.toContain("SessionStepHero");
    expect(page).not.toContain("Follow one step at a time.");
    expect(page).toContain("hideLocalSaveNote");
    expect(page).toContain("Step complete");
    expect(page).toContain("Kitchen Mode is not ready yet");
    expect(page).toContain("Build my timeline");
    expect(page).toContain("variant=\"no-session\"");
    expect(page).toContain("variant=\"step-unavailable\"");
    expect(page).toContain("Ingredient amounts unavailable");
    expect(page).not.toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
    expect(page).not.toContain("Saved as you go.");
    expect(page).not.toContain("kitchenBackHrefFromSource");
    expect(page).not.toMatch(/Cloud sync is active|push notifications enabled|Google indexing enabled/i);
  });

  it("selects the first todo task, exposes the next task and handles completed timelines", () => {
    const session = createPizzaSession({
      id: "kitchen-state",
      timeline: {
        ...sampleTimeline,
        steps: [
          { ...sampleTimeline.steps[0], status: "done" },
          sampleTimeline.steps[1],
          sampleTimeline.steps[2],
        ],
      },
    });

    const state = getKitchenModeState(session);
    expect(state.ok).toBe(true);
    if (!state.ok) throw new Error("Expected kitchen state");
    expect(state.currentStep?.id).toBe("rest-dough");
    expect(state.nextStep?.id).toBe("bake-pizza");
    expect(state.doneCount).toBe(1);
    expect(state.totalCount).toBe(3);

    const completed = getKitchenModeState(createPizzaSession({
      id: "kitchen-complete",
      timeline: { ...sampleTimeline, steps: sampleTimeline.steps.map((step) => ({ ...step, status: "done" as const })) },
    }));
    expect(completed.ok && completed.currentStep).toBeUndefined();
  });

  it("treats review-result as the post-kitchen completion transition", () => {
    const state = getKitchenModeState(createPizzaSession({
      id: "kitchen-review-transition",
      timeline: {
        ...sampleTimeline,
        steps: [
          { ...sampleTimeline.steps[0], status: "done" },
          { ...sampleTimeline.steps[1], status: "done" },
          { ...sampleTimeline.steps[2], status: "done" },
          {
            id: "review-result",
            label: "Review result",
            scheduledAt: "2026-06-27T19:00:00.000Z",
            status: "todo" as const,
            kind: "active" as const,
          },
        ],
      },
    }));

    expect(state.ok).toBe(true);
    if (!state.ok) throw new Error("Expected kitchen state");
    expect(state.currentStep).toBeUndefined();
    expect(state.nextStep).toBeUndefined();
  });

  it("returns safe missing states for missing active session and timeline", () => {
    expect(getKitchenModeState(undefined)).toEqual({ ok: false, missingReason: "no-session" });
    expect(getKitchenModeState(createPizzaSession({ id: "missing-timeline" }))).toEqual({ ok: false, missingReason: "missing-timeline" });
  });

  it("uses the stable Timeline snapshot when Kitchen Mode opens after a missed recommended start", () => {
    const now = new Date("2026-07-03T15:18:00");
    const session = createPizzaSession({
      id: "kitchen-missed-recommend-start",
      status: "planning",
      currentStep: "timeline",
      targetEatTime: "2026-07-04T18:00",
      doughStartMode: "recommend",
      pizzaStyle: "home-oven",
      pizzaPreset: "margherita",
      pizzaCount: 4,
      ovenType: "home",
      flour: "tipo-00",
      timeline: generatePizzaSessionTimeline(createPizzaSession({
        id: "kitchen-missed-recommend-start",
        status: "planning",
        currentStep: "timeline",
        targetEatTime: "2026-07-04T18:00",
        doughStartMode: "recommend",
        pizzaStyle: "home-oven",
        pizzaPreset: "margherita",
        pizzaCount: 4,
        ovenType: "home",
        flour: "tipo-00",
      }, now), now).timeline,
    }, now);

    const storedMix = session.timeline?.steps.find((step) => step.id === "mix-dough");
    expect(storedMix?.scheduledAt).toBe(now.toISOString());

    const state = getKitchenModeState(session, now);
    expect(state.ok).toBe(true);
    if (!state.ok) throw new Error("Expected kitchen state");
    expect(state.currentStep?.id).toBe("mix-dough");
    expect(state.currentStep?.scheduledAt).toBe(now.toISOString());
    expect(session.timeline?.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(now.toISOString());
  });

  it("uses a selected long-horizon plan for Kitchen Mode displayed dough timing", () => {
    const now = new Date("2026-07-02T09:00:00");
    const target = new Date("2026-07-10T09:00:00");
    const selectedStart = new Date(target.getTime() - 48 * 3_600_000);
    const base = createPizzaSession({
      id: "kitchen-selected-long-horizon-option",
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
    }, now);
    const session = createPizzaSession({
      ...base,
      timeline: generatePizzaSessionTimeline(base, now).timeline,
    }, now);

    const state = getKitchenModeState(session, now);
    expect(state.ok).toBe(true);
    if (!state.ok) throw new Error("Expected kitchen state");
    expect(state.currentStep?.id).toBe("mix-dough");
    expect(state.currentStep?.scheduledAt).toBe(selectedStart.toISOString());
    expect(session.timeline?.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(selectedStart.toISOString());
  });

  it("marks the current kitchen task done, advances currentStep and preserves local session data", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-mark-done",
      status: "planning",
      currentStep: "timeline",
      targetEatTime: "2026-06-27T18:30",
      recipeSnapshot,
      shoppingList: {
        presetId: "margherita",
        presetName: "Margherita",
        groups: [{ group: "Dough", items: [{ id: "flour", label: "Flour", status: "need_to_buy" }] }],
      },
      timeline: sampleTimeline,
    }, storage, new Date("2026-06-25T10:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const result = completeKitchenTimelineStep(
      session,
      "mix-dough",
      storage,
      new Date("2026-06-25T10:30:00.000Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected step completion");
    const updated = result.session;

    expect(result.completedStepId).toBe("mix-dough");
    expect(result.nextStepId).toBe("rest-dough");
    expect(updated.timeline?.steps[0].status).toBe("done");
    expect(updated.stepRuntime?.["mix-dough"]?.actualStartedAt).toBe("2026-06-25T10:30:00.000Z");
    expect(updated.stepRuntime?.["mix-dough"]?.actualCompletedAt).toBe("2026-06-25T10:30:00.000Z");
    expect(getKitchenModeState(updated).ok && getKitchenModeState(updated).currentStep?.id).toBe("rest-dough");
    expect(updated.currentStep).toBe("prep");
    expect(updated.status).toBe("preparing");
    expect(updated.updatedAt).toBe("2026-06-25T10:30:00.000Z");
    expect(updated.lastSavedAt).toBe("2026-06-25T10:30:00.000Z");
    expect(updated.recipeSnapshot?.flourAmount).toBe(623.2);
    expect(updated.shoppingList?.presetName).toBe("Margherita");
    expect(getActivePizzaSession(storage)?.id).toBe(session.id);
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("mix-dough");
  });

  it("uses actual Mix completion to run the following Rest for exactly 30 minutes without changing the stored schedule", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-runtime-rest",
      status: "planning",
      currentStep: "timeline",
      timeline: sampleTimeline,
    }, storage, new Date("2026-06-25T09:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const result = completeKitchenTimelineStep(
      session,
      "mix-dough",
      storage,
      new Date("2026-06-25T10:45:00.000Z"),
    );
    if (!result.ok) throw new Error("Expected updated session");
    const updated = result.session;

    const originalRest = session.timeline?.steps.find((step) => step.id === "rest-dough");
    const state = getKitchenModeState(updated, new Date("2026-06-25T10:46:00.000Z"));
    if (!state.ok || !state.currentStep) throw new Error("Expected kitchen rest state");

    const expectedRuntimeEnd = new Date(new Date("2026-06-25T10:45:00.000Z").getTime() + 30 * 60_000).toISOString();

    expect(state.currentStep.id).toBe("rest-dough");
    expect(state.currentStep.scheduledAt).toBe(expectedRuntimeEnd);
    expect(updated.timeline?.steps.find((step) => step.id === "rest-dough")?.scheduledAt).toBe(originalRest?.scheduledAt);
    expect(updated.timeline?.steps.find((step) => step.id === "bake-pizza")?.scheduledAt).toBe(sampleTimeline.steps[2].scheduledAt);
    expect(updated.stepRuntime?.["mix-dough"]?.actualCompletedAt).toBe("2026-06-25T10:45:00.000Z");
  });

  it("advances overdue room fermentation to Ball dough and records runtime completion", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-overdue-room-fermentation-complete",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "12h-room" },
      timeline: {
        generatedAt: "2026-07-10T15:00:00.000Z",
        targetEatTime: "2026-07-11T08:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-10T15:26:00.000Z", status: "done", kind: "active" },
          { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-10T15:56:00.000Z", status: "done", kind: "passive" },
          { id: "room-ferment", label: "Room temperature ferment", scheduledAt: "2026-07-10T16:26:00.000Z", status: "todo", kind: "passive" },
          { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T02:26:00.000Z", status: "todo", kind: "active" },
          { id: "room-temperature-rest", label: "Room temperature rest", scheduledAt: "2026-07-11T03:26:00.000Z", status: "todo", kind: "passive" },
          { id: "preheat-oven", label: "Preheat oven", scheduledAt: "2026-07-11T05:26:00.000Z", status: "todo", kind: "active" },
          { id: "bake-pizza", label: "Bake pizza", scheduledAt: "2026-07-11T08:00:00.000Z", status: "todo", kind: "active" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualCompletedAt: "2026-07-10T15:46:00.000Z",
        },
        "rest-dough": {
          actualCompletedAt: "2026-07-10T16:16:00.000Z",
        },
      },
    }, storage, new Date("2026-07-10T15:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const before = getKitchenModeState(session, new Date("2026-07-11T03:00:00.000Z"));
    if (!before.ok || !before.currentStep) throw new Error("Expected overdue fermentation state");
    expect(before.currentStep.id).toBe("room-ferment");
    expect(getKitchenStepWaitInfo(before.currentStep, new Date("2026-07-11T03:00:00.000Z")).isTooEarly).toBe(false);

    const result = completeKitchenTimelineStep(
      session,
      "room-ferment",
      storage,
      new Date("2026-07-11T03:00:00.000Z"),
    );
    if (!result.ok) throw new Error("Expected updated session");
    const updated = result.session;

    const after = getKitchenModeState(updated, new Date("2026-07-11T03:00:01.000Z"));
    if (!after.ok || !after.currentStep) throw new Error("Expected next kitchen state");
    expect(result.completedStepId).toBe("room-ferment");
    expect(result.nextStepId).toBe("ball-dough");
    expect(updated.timeline?.steps.find((step) => step.id === "room-ferment")?.status).toBe("done");
    expect(updated.stepRuntime?.["room-ferment"]?.actualCompletedAt).toBe("2026-07-11T03:00:00.000Z");
    expect(after.currentStep.id).toBe("ball-dough");
    expect(after.currentStep.scheduledAt).toBe("2026-07-11T03:00:00.000Z");
    expect(getActivePizzaSession(storage)?.stepRuntime?.["room-ferment"]?.actualCompletedAt).toBe("2026-07-11T03:00:00.000Z");
  });

  it("advances exact-match cold fermentation to Ball dough and records runtime completion", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-cold-fermentation-complete",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "24h-cold" },
      timeline: fermentationTimeline("cold-ferment", "Cold fermentation"),
      stepRuntime: completedDoughRuntime(),
    }, storage, new Date("2026-07-10T15:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const before = getKitchenModeState(session, new Date("2026-07-11T03:00:00.000Z"));
    if (!before.ok || !before.currentStep) throw new Error("Expected cold fermentation state");
    expect(before.currentStep.id).toBe("cold-ferment");

    const result = completeKitchenTimelineStep(
      session,
      before.currentStep,
      storage,
      new Date("2026-07-11T03:00:00.000Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected cold fermentation completion");

    expect(result.completedStepId).toBe("cold-ferment");
    expect(result.nextStepId).toBe("ball-dough");
    expect(result.session.timeline?.steps.find((step) => step.id === "cold-ferment")?.status).toBe("done");
    expect(result.session.stepRuntime?.["cold-ferment"]?.actualCompletedAt).toBe("2026-07-11T03:00:00.000Z");
    const after = getKitchenModeState(result.session, new Date("2026-07-11T03:00:01.000Z"));
    expect(after.ok && after.currentStep?.id).toBe("ball-dough");
  });

  it("completes the persisted room-ferment step when Kitchen displays cold-ferment for a legacy session", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-displayed-cold-persisted-room",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "24h-cold" },
      timeline: fermentationTimeline("room-ferment", "Room temperature ferment"),
      stepRuntime: completedDoughRuntime(),
    }, storage, new Date("2026-07-10T15:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const before = getKitchenModeState(session, new Date("2026-07-11T03:00:00.000Z"));
    if (!before.ok || !before.currentStep) throw new Error("Expected displayed cold fermentation state");
    expect(before.currentStep.id).toBe("cold-ferment");
    expect(session.timeline?.steps.some((step) => step.id === "cold-ferment")).toBe(false);

    const resolution = resolvePersistedKitchenStepId(session, before.currentStep, new Date("2026-07-11T03:00:00.000Z"));
    expect(resolution.ok && resolution.step.id).toBe("room-ferment");

    const result = completeKitchenTimelineStep(
      session,
      before.currentStep,
      storage,
      new Date("2026-07-11T03:00:00.000Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected legacy mismatch completion");

    expect(result.completedStepId).toBe("room-ferment");
    expect(result.nextStepId).toBe("ball-dough");
    expect(result.session.timeline?.steps.find((step) => step.id === "room-ferment")?.status).toBe("done");
    expect(result.session.timeline?.steps.find((step) => step.id === "room-ferment")?.scheduledAt).toBe("2026-07-10T16:26:00.000Z");
    expect(result.session.timeline?.steps.some((step) => step.id === "cold-ferment")).toBe(false);
    expect(result.session.stepRuntime?.["room-ferment"]?.actualCompletedAt).toBe("2026-07-11T03:00:00.000Z");
    expect(result.session.stepRuntime?.["cold-ferment"]).toBeUndefined();
    expect(getKitchenModeState(result.session, new Date("2026-07-11T03:00:01.000Z")).ok && getKitchenModeState(result.session, new Date("2026-07-11T03:00:01.000Z")).currentStep?.id).toBe("ball-dough");
    expect(getActivePizzaSession(storage)?.stepRuntime?.["room-ferment"]?.actualCompletedAt).toBe("2026-07-11T03:00:00.000Z");
  });

  it("completes the persisted cold-ferment step when Kitchen displays room-ferment for a legacy session", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-displayed-room-persisted-cold",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "12h-room" },
      timeline: fermentationTimeline("cold-ferment", "Cold fermentation"),
      stepRuntime: completedDoughRuntime(),
    }, storage, new Date("2026-07-10T15:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const before = getKitchenModeState(session, new Date("2026-07-11T03:00:00.000Z"));
    if (!before.ok || !before.currentStep) throw new Error("Expected displayed room fermentation state");
    expect(before.currentStep.id).toBe("room-ferment");
    expect(session.timeline?.steps.some((step) => step.id === "room-ferment")).toBe(false);

    const result = completeKitchenTimelineStep(
      session,
      before.currentStep,
      storage,
      new Date("2026-07-11T03:00:00.000Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected legacy mismatch completion");

    expect(result.completedStepId).toBe("cold-ferment");
    expect(result.nextStepId).toBe("ball-dough");
    expect(result.session.timeline?.steps.find((step) => step.id === "cold-ferment")?.status).toBe("done");
    expect(result.session.timeline?.steps.find((step) => step.id === "cold-ferment")?.scheduledAt).toBe("2026-07-10T16:26:00.000Z");
    expect(result.session.timeline?.steps.some((step) => step.id === "room-ferment")).toBe(false);
    expect(result.session.stepRuntime?.["cold-ferment"]?.actualCompletedAt).toBe("2026-07-11T03:00:00.000Z");
    expect(result.session.stepRuntime?.["room-ferment"]).toBeUndefined();
    expect(getKitchenModeState(result.session, new Date("2026-07-11T03:00:01.000Z")).ok && getKitchenModeState(result.session, new Date("2026-07-11T03:00:01.000Z")).currentStep?.id).toBe("ball-dough");
  });

  it("keeps legacy fermentation completion idempotent across repeated stale clicks", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-legacy-fermentation-repeat",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "24h-cold" },
      timeline: fermentationTimeline("room-ferment", "Room temperature ferment"),
      stepRuntime: completedDoughRuntime(),
    }, storage, new Date("2026-07-10T15:00:00.000Z"));
    setActivePizzaSession(session.id, storage);
    const before = getKitchenModeState(session, new Date("2026-07-11T03:00:00.000Z"));
    if (!before.ok || !before.currentStep) throw new Error("Expected displayed cold fermentation state");

    const first = completeKitchenTimelineStep(session, before.currentStep, storage, new Date("2026-07-11T03:00:00.000Z"));
    if (!first.ok) throw new Error("Expected first completion");
    const second = completeKitchenTimelineStep(first.session, before.currentStep, storage, new Date("2026-07-11T03:05:00.000Z"));
    if (!second.ok) throw new Error("Expected idempotent second completion");

    expect(second.completedStepId).toBe("room-ferment");
    expect(second.session.stepRuntime?.["room-ferment"]?.actualCompletedAt).toBe("2026-07-11T03:00:00.000Z");
    expect(getKitchenModeState(second.session, new Date("2026-07-11T03:05:01.000Z")).ok && getKitchenModeState(second.session, new Date("2026-07-11T03:05:01.000Z")).currentStep?.id).toBe("ball-dough");
  });

  it("does not complete arbitrary fermentation steps when legacy candidates are ambiguous", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-ambiguous-fermentation",
      status: "preparing",
      currentStep: "prep",
      timeline: {
        generatedAt: "2026-07-10T15:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", status: "done" as const, kind: "active" as const },
          { id: "legacy-ferment-a", label: "Ferment dough", scheduledAt: "2026-07-10T16:00:00.000Z", status: "todo" as const, kind: "passive" as const },
          { id: "legacy-ferment-b", label: "Ferment dough", scheduledAt: "2026-07-10T16:30:00.000Z", status: "todo" as const, kind: "passive" as const },
          { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T02:26:00.000Z", status: "todo" as const, kind: "active" as const },
        ],
      },
    }, storage, new Date("2026-07-10T15:00:00.000Z"));
    setActivePizzaSession(session.id, storage);
    const beforeStorage = storage.getItem(PIZZA_SESSIONS_STORAGE_KEY);

    const result = completeKitchenTimelineStep(
      session,
      { id: "ferment-dough", label: "Ferment dough", status: "todo", scheduledAt: "2026-07-11T03:00:00.000Z" },
      storage,
      new Date("2026-07-11T03:00:00.000Z"),
    );

    expect(result).toEqual({ ok: false, reason: "ambiguous_fermentation_step" });
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toBe(beforeStorage);
    expect(getActivePizzaSession(storage)?.stepRuntime).toBeUndefined();
  });

  it("keeps older sessions on the planned schedule when runtime completion data is absent", () => {
    const session = createPizzaSession({
      id: "kitchen-legacy-no-runtime",
      status: "preparing",
      currentStep: "prep",
      timeline: {
        ...sampleTimeline,
        steps: [
          { ...sampleTimeline.steps[0], status: "done" },
          sampleTimeline.steps[1],
          sampleTimeline.steps[2],
        ],
      },
    });

    const state = getKitchenModeState(session, new Date("2026-06-25T10:46:00.000Z"));
    if (!state.ok || !state.currentStep) throw new Error("Expected planned fallback state");

    expect(state.currentStep.id).toBe("rest-dough");
    expect(state.currentStep.scheduledAt).toBe(sampleTimeline.steps[1].scheduledAt);
    expect(state.currentStep.runtimeStartsAt).toBeUndefined();
  });

  it("preserves the original room fermentation duration after the mandatory Rest runtime", () => {
    const session = createPizzaSession({
      id: "kitchen-room-fermentation-runtime",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "12h-room" },
      timeline: {
        generatedAt: "2026-07-10T15:00:00.000Z",
        targetEatTime: "2026-07-11T08:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-10T15:26:00.000Z", status: "done", kind: "active" },
          { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-10T15:56:00.000Z", status: "done", kind: "passive" },
          { id: "room-ferment", label: "Room temperature ferment", scheduledAt: "2026-07-10T16:26:00.000Z", status: "todo", kind: "passive" },
          { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T02:26:00.000Z", status: "todo", kind: "active" },
          { id: "room-temperature-rest", label: "Room temperature rest", scheduledAt: "2026-07-11T03:26:00.000Z", status: "todo", kind: "passive" },
          { id: "preheat-oven", label: "Preheat oven", scheduledAt: "2026-07-11T05:26:00.000Z", status: "todo", kind: "active" },
          { id: "bake-pizza", label: "Bake pizza", scheduledAt: "2026-07-11T08:00:00.000Z", status: "todo", kind: "active" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-07-10T15:26:00.000Z",
          actualCompletedAt: "2026-07-10T15:46:00.000Z",
        },
        "rest-dough": {
          actualStartedAt: "2026-07-10T15:46:00.000Z",
          actualCompletedAt: "2026-07-10T16:16:00.000Z",
        },
      },
    });

    const state = getKitchenModeState(session, new Date("2026-07-10T16:20:00.000Z"));
    if (!state.ok || !state.currentStep) throw new Error("Expected fermentation state");

    expect(state.currentStep.id).toBe("room-ferment");
    expect(state.currentStep.scheduledAt).toBe("2026-07-11T02:16:00.000Z");
    expect(state.currentStep.runtimeStartsAt).toBe("2026-07-10T16:16:00.000Z");
    expect(session.timeline?.steps.find((step) => step.id === "room-ferment")?.scheduledAt).toBe("2026-07-10T16:26:00.000Z");
  });

  it("preserves 24 hour cold fermentation from the effective Rest completion", () => {
    const session = createPizzaSession({
      id: "kitchen-cold-fermentation-runtime",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "24h-cold" },
      timeline: {
        generatedAt: "2026-07-10T15:00:00.000Z",
        targetEatTime: "2026-07-12T08:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-10T15:26:00.000Z", status: "done", kind: "active" },
          { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-10T15:56:00.000Z", status: "done", kind: "passive" },
          { id: "cold-ferment", label: "Cold fermentation", scheduledAt: "2026-07-10T16:26:00.000Z", status: "todo", kind: "passive" },
          { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T16:26:00.000Z", status: "todo", kind: "active" },
          { id: "room-temperature-rest", label: "Room temperature rest", scheduledAt: "2026-07-11T17:26:00.000Z", status: "todo", kind: "passive" },
          { id: "preheat-oven", label: "Preheat oven", scheduledAt: "2026-07-11T19:26:00.000Z", status: "todo", kind: "active" },
          { id: "bake-pizza", label: "Bake pizza", scheduledAt: "2026-07-12T08:00:00.000Z", status: "todo", kind: "active" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualStartedAt: "2026-07-10T15:26:00.000Z",
          actualCompletedAt: "2026-07-10T16:10:00.000Z",
        },
        "rest-dough": {
          actualStartedAt: "2026-07-10T16:10:00.000Z",
          actualCompletedAt: "2026-07-10T16:40:00.000Z",
        },
      },
    });

    const state = getKitchenModeState(session, new Date("2026-07-10T16:45:00.000Z"));
    if (!state.ok || !state.currentStep) throw new Error("Expected cold fermentation state");

    expect(state.currentStep.id).toBe("cold-ferment");
    expect(state.currentStep.scheduledAt).toBe("2026-07-11T16:40:00.000Z");
    expect(state.currentStep.runtimeStartsAt).toBe("2026-07-10T16:40:00.000Z");
    expect(state.executionConflict).toBeUndefined();
  });

  it("starts warm ball rest from actual Ball completion and preserves the planned rest window", () => {
    const session = createPizzaSession({
      id: "kitchen-ball-rest-runtime",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "24h-cold" },
      timeline: {
        generatedAt: "2026-07-10T15:00:00.000Z",
        targetEatTime: "2026-07-12T08:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-10T15:26:00.000Z", status: "done", kind: "active" },
          { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-10T15:56:00.000Z", status: "done", kind: "passive" },
          { id: "cold-ferment", label: "Cold fermentation", scheduledAt: "2026-07-10T16:26:00.000Z", status: "done", kind: "passive" },
          { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T16:26:00.000Z", status: "done", kind: "active" },
          { id: "room-temperature-rest", label: "Room temperature rest", scheduledAt: "2026-07-11T17:26:00.000Z", status: "todo", kind: "passive" },
          { id: "preheat-oven", label: "Preheat oven", scheduledAt: "2026-07-11T19:26:00.000Z", status: "todo", kind: "active" },
          { id: "bake-pizza", label: "Bake pizza", scheduledAt: "2026-07-12T08:00:00.000Z", status: "todo", kind: "active" },
        ],
      },
      stepRuntime: {
        "ball-dough": {
          actualStartedAt: "2026-07-11T16:26:00.000Z",
          actualCompletedAt: "2026-07-11T16:40:00.000Z",
        },
      },
    });

    const state = getKitchenModeState(session, new Date("2026-07-11T16:45:00.000Z"));
    if (!state.ok || !state.currentStep) throw new Error("Expected ball rest state");

    expect(state.currentStep.id).toBe("room-temperature-rest");
    expect(state.currentStep.scheduledAt).toBe("2026-07-11T18:40:00.000Z");
    expect(state.currentStep.runtimeStartsAt).toBe("2026-07-11T16:40:00.000Z");
  });

  it("reports a target conflict instead of shortening biological phases", () => {
    const session = createPizzaSession({
      id: "kitchen-target-conflict",
      status: "preparing",
      currentStep: "prep",
      recipeSnapshot: { fermentation: "12h-room" },
      timeline: {
        generatedAt: "2026-07-10T15:00:00.000Z",
        targetEatTime: "2026-07-11T20:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-11T08:00:00.000Z", status: "done", kind: "active" },
          { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-11T08:30:00.000Z", status: "done", kind: "passive" },
          { id: "room-ferment", label: "Room temperature ferment", scheduledAt: "2026-07-11T09:00:00.000Z", status: "todo", kind: "passive" },
          { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T19:00:00.000Z", status: "todo", kind: "active" },
          { id: "room-temperature-rest", label: "Room temperature rest", scheduledAt: "2026-07-11T19:15:00.000Z", status: "todo", kind: "passive" },
          { id: "preheat-oven", label: "Preheat oven", scheduledAt: "2026-07-11T19:45:00.000Z", status: "todo", kind: "active" },
          { id: "bake-pizza", label: "Bake pizza", scheduledAt: "2026-07-11T20:00:00.000Z", status: "todo", kind: "active" },
        ],
      },
      stepRuntime: {
        "mix-dough": {
          actualCompletedAt: "2026-07-11T10:00:00.000Z",
        },
        "rest-dough": {
          actualCompletedAt: "2026-07-11T10:30:00.000Z",
        },
      },
    });

    const state = getKitchenModeState(session, new Date("2026-07-11T10:35:00.000Z"));
    if (!state.ok || !state.currentStep) throw new Error("Expected target conflict state");

    expect(state.currentStep.id).toBe("room-ferment");
    expect(state.currentStep.scheduledAt).toBe("2026-07-11T20:30:00.000Z");
    expect(state.executionConflict).toEqual({
      delayMinutes: 75,
      originalTargetAt: "2026-07-11T20:00:00.000Z",
      readyAt: "2026-07-11T21:15:00.000Z",
    });
    expect(session.timeline?.targetEatTime).toBe("2026-07-11T20:00:00.000Z");
  });

  it("moves to bake and review steps without creating public or cloud behavior", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "kitchen-bake",
      status: "preparing",
      currentStep: "prep",
      timeline: {
        ...sampleTimeline,
        steps: [
          { ...sampleTimeline.steps[0], status: "done" },
          { ...sampleTimeline.steps[1], status: "done" },
          sampleTimeline.steps[2],
        ],
      },
    }, storage);

    const result = completeKitchenTimelineStep(session, "bake-pizza", storage);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected bake completion");
    expect(result.completedStepId).toBe("bake-pizza");
    expect(result.nextStepId).toBeNull();
    expect(result.session.currentStep).toBe("review");
    expect(result.session.status).toBe("reviewing");
  });

  it("shows recipe snapshot ingredient lines for Mix dough without recalculating", () => {
    const lines = recipeSnapshotIngredientLines(recipeSnapshot);

    expect(lines.map((line) => line.label)).toEqual([
      "Total dough",
      "Flour",
      "Water",
      "Salt",
      "Yeast — Dry yeast",
      "Dough balls",
    ]);
    expect(lines).toContainEqual({ label: "Flour", value: "623 g" });
    expect(lines).toContainEqual({ label: "Water", value: "399 g" });
    expect(lines).toContainEqual({ label: "Salt", value: "17 g" });
    expect(lines).toContainEqual({ label: "Yeast — Dry yeast", value: "0.5 g" });
    expect(lines.map((line) => line.value).join(" ")).toContain("4 × 260 g");
    expect(recipeSnapshotIngredientLines(undefined)).toEqual([]);
    expect(isMixDoughStep(sampleTimeline.steps[0])).toBe(true);
  });

  it("classifies kitchen tasks into Dough Kitchen Mode and Pizza Service Mode", () => {
    expect(getKitchenModeForStep({ id: "mix-dough", label: "Mix dough", status: "todo" })).toBe("dough");
    expect(getKitchenModeForStep({ id: "cold-ferment", label: "Cold ferment", status: "todo" })).toBe("dough");
    expect(getKitchenModeForStep({ id: "ball-dough", label: "Ball dough", status: "todo" })).toBe("dough");
    expect(getKitchenModeForStep({ id: "room-temperature-rest", label: "Room temperature rest", status: "todo" })).toBe("dough");
    expect(getKitchenModeForStep({ id: "preheat-oven", label: "Preheat oven", status: "todo" })).toBe("service");
    expect(getKitchenModeForStep({ id: "prepare-sauce-toppings", label: "Prepare sauce and toppings", status: "todo" })).toBe("service");
    expect(getKitchenModeForStep({ id: "bake-pizza", label: "Bake pizza", status: "todo" })).toBe("service");
    expect(getKitchenModeForStep(undefined)).toBe("complete");
  });

  it("limits Dough Kitchen Mode ingredient lines to dough ingredients", () => {
    const lines = doughKitchenIngredientLines(recipeSnapshot);

    expect(lines.map((line) => line.label)).toEqual(["Flour", "Water", "Salt", "Yeast — Dry yeast"]);
    expect(lines.map((line) => line.label)).not.toContain("Sauce");
    expect(lines.map((line) => line.label)).not.toContain("Cheese");
    expect(lines.map((line) => line.label)).not.toContain("Toppings");
  });

  it("removes the generic service reminders fallback without removing service actions", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).not.toContain("Service reminders");
    expect(page).not.toContain("Keep sauce, cheese and toppings ready, then follow the current task.");
    expect(page).not.toContain('kitchenMode === "service" && (');
    expect(page).toContain("Oven preheated");
    expect(page).toContain("Pizza menu");
    expect(page).not.toMatch(/order board|ticket rail|table service/i);
  });

  it("adds contextual Toppings guidance only inside More guidance for the sauce-and-toppings step", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain('const showToppingBalanceLink = currentStep?.id === "prepare-sauce-toppings"');
    expect(page).toContain("{showToppingBalanceLink &&");
    expect(page).toContain("Review sauce, cheese and topping amounts if the pizza may become too wet or heavily loaded.");
    expect(page).toContain('href="/toppings"');
    expect(page.match(/href="\/toppings"/g)).toHaveLength(1);
    expect(page).toContain("Check topping balance");
    expect(page.indexOf("<details")).toBeLessThan(page.indexOf("{showToppingBalanceLink &&"));
    expect(page.indexOf("{showToppingBalanceLink &&")).toBeLessThan(page.indexOf("</details>"));
    expect(page).not.toContain("Continue to Toppings");
    expect(page).not.toContain("Required topping setup");
    expect(page).not.toContain('target="_blank"');
    expect(page).not.toContain("queueCloudActivePizzaSessionSave(session");
    expect(page).not.toContain("queueKitchenProgressSync(session");
  });

  it("prepares a completion transition to review and notes", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("Pizza session complete");
    expect(page).toContain("Save what worked and what you want to improve next time.");
    expect(page).toContain("Review my pizza");
    expect(page).toContain("href=\"/session/review\"");
    expect(page).not.toContain("All kitchen steps done");
    expect(page).not.toContain("Ready for review");
  });

  it("aligns Kitchen Mode with Pizza Session V2 execution structure", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("activeStep={9}");
    expect(page).toContain("hideLocalSaveNote");
    expect(page).toContain("Needed now");
    expect(page).toContain("role=\"progressbar\"");
    expect(page).toContain("Kitchen progress: ${progressLabel}");
    expect(page).toContain("aria-valuenow={kitchenState.currentIndex + 1}");
    expect(page).toContain("{kitchenState.currentIndex + 1} / {kitchenState.totalCount}");
    expect(page).toContain("formatTimelineLiveTiming");
    expect(page).toContain("currentLiveTiming");
    expect(page).toContain("nextLiveTiming");
    expect(page).toContain("compactKitchenTiming");
    expect(page).toContain("formatRuntimeClockTime(kitchenState.nextStep.scheduledAt)");
    expect(page).toContain("Planned ${plannedClock}");
    expect(page).toContain("Current step");
    expect(page).toContain("<h1 id=\"current-kitchen-task\"");
    expect(page).not.toContain("levelModeLabel(experience.label)");
    expect(page).not.toContain("${label} mode");
    expect(page).not.toContain("kitchenStepIcon(currentStep)");
    expect(page).not.toContain("kitchenStepIconTone(currentStep)");
    expect(page).not.toContain("Do this");
    expect(page).not.toContain("What is happening now");
    expect(page).toContain("Current task instruction");
    expect(page).toContain("Ready when:");
    expect(page).toContain("shouldShowKitchenCompletionCue");
    expect(page).toContain("More guidance");
    expect(page).not.toContain("Need more help?");
    expect(page).not.toContain("id=\"kitchen-do-this-heading\"");
    expect(page).not.toContain("id=\"kitchen-done-heading\"");
    expect(page).not.toContain("id=\"kitchen-technique-heading\"");
    expect(page).not.toContain("function formatKitchenClockTime");
    expect(page).not.toContain("Planned at");
    expect(page).not.toContain("Live timing");
    expect(page).not.toContain("You are done when");
    expect(page).toContain("What this should look like");
    expect(page).toContain("{experience.label} guidance");
    expect(page).toContain("getKitchenExperienceGuidance(currentStep, session.experienceLevel, session)");
    expect(page).toContain("What to look for");
    expect(page).toContain("Why it matters");
    expect(page).toContain("Keep in mind");
    expect(page).toContain("Next:");
    expect(page).toContain("const nextStepSummary = kitchenState.nextStep");
    expect(page).toContain(": \"Review your pizza session\"");
    expect(page).toContain("BottomActionBar");
    expect(page).not.toContain("href={backHref}");
    expect(page).toContain("Change pizza menu");
    expect(page).toContain("View full schedule");
    expect(page).toContain("href=\"/session/timeline\"");
    expect(page).toContain("Done baking? Review session");
    expect(page).toContain("setSession(updated)");
    expect(page).not.toContain("kitchenBackHrefFromSource(source)");
    expect(page).not.toContain("kitchenBackHrefFromReferrer(document.referrer)");
    expect(page).not.toContain("<StatusPill");
    expect(page).not.toContain("Step 9: Kitchen Mode");
    expect(page).not.toContain("Do this now");
    expect(page).not.toContain("before target");
    expect(page).not.toContain("SessionLocalOnlyNote");
    expect(page).not.toContain("saveMessage");
    expect(page).not.toContain("marked done. Progress saved in this browser.");
    expect(page).not.toContain("<AppSignature");
    expect(page).not.toContain("Open full Calculator");
    expect(page).not.toContain("Open baking timer");
    expect(page).not.toContain("Review dough plan");
    expect(page).not.toContain("Back to timeline");
  });

  it("implements Patch 397B focused execution actions without normal application Back", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("More guidance");
    expect(page).toContain("Change pizza menu");
    expect(page).toContain("View full schedule");
    expect(page).toContain('className="max-sm:[&>div:first-child]:hidden"');
    expect(page).toContain('href="/session/timeline"');
    expect(page).toContain("Total pizzas are locked for this session.");
    expect(page).toContain("Menu is locked once baking starts.");
    expect(page).not.toContain("Desktop keeps the extra technique context nearby");
    expect(page).not.toContain("kitchenBackHrefFromSource");
    expect(page).not.toContain("kitchenBackHrefFromReferrer");
    expect(page).not.toContain("href={backHref}");
  });

  it("adds a compact locked-count Kitchen menu editor with atomic save semantics", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("menuEditorOpen");
    expect(page).toContain('role="dialog"');
    expect(page).toContain('aria-modal="true"');
    expect(page).toContain('aria-labelledby="kitchen-menu-editor-heading"');
    expect(page).toContain("draftPizzaMix");
    expect(page).toContain("adjustPizzaMixAllocation(draftNormalizedMix, pizzaType, delta, lockedPizzaCount)");
    expect(page).toContain("normalizePizzaMixForCount(lockedPizzaCount, session.pizzaMix, session.pizzaPreset)");
    expect(page).toContain("const latestSession = getActivePizzaSession()");
    expect(page).toContain("latestSession.id !== session.id");
    expect(page).toContain("savePizzaSessionMenuMix(latestSession, draftNormalizedMix, undefined, now)");
    expect(page).toContain("queueKitchenProgressSync(updatedSession)");
    expect(page).toContain("setSession(updatedSession)");
    expect(page).toContain("Close pizza menu editor");
    expect(page).toContain("Cancel");
    expect(page).toContain("Save changes");
    expect(page).toContain("Decrease ${option.name} count");
    expect(page).toContain("Increase ${option.name} count");
  });

  it("locks Kitchen menu editing when bake phase has started", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("function kitchenBakePhaseStarted");
    expect(page).toContain('session.currentStep === "bake"');
    expect(page).toContain('currentStep?.id === "bake-pizza"');
    expect(page).toContain('session.stepRuntime?.["bake-pizza"]');
    expect(page).toContain('bakeStep?.status === "done"');
    expect(page).toContain("disabled={!menuCanEdit}");
    expect(page).toContain("Menu is locked once baking starts.");
  });

  it("maps small Kitchen Mode visuals to key step types", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("SessionExperienceLevelBadge level={session.experienceLevel} compact");
    expect(page).toContain("role=\"progressbar\"");
    expect(page).toContain("bg-ink/65");
    expect(page).not.toContain("function kitchenStepIcon(step?: { id: string })");
  });

  it("renders the Kitchen Mode early-step wait notice and confirmation controls", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("getKitchenStepWaitInfo(currentStep, currentTime)");
    expect(page).toContain("const EARLY_COMPLETION_PREFERENCE_ENFORCED = false");
    expect(page).toContain("fetch(\"/api/account/preferences\"");
    expect(page).toContain("!EARLY_COMPLETION_PREFERENCE_ENFORCED");
    expect(page).toContain("accountAllowsEarlyTimedCompletion");
    expect(page).toContain("currentStepCanConfirmEarlyCompletion");
    expect(page).toContain("{waitInfo.waitLabel} before this step.");
    expect(page).toContain("currentStepCompletionBlocked");
    expect(page).toContain("This step is ready at");
    expect(page).toContain("disabled={primaryActionDisabled}");
    expect(page).toContain("aria-describedby={currentStepCompletionBlocked ? \"kitchen-wait-status\" : undefined}");
    expect(page).toContain("getEarlyTimedKitchenCompletionWarning(currentStep, waitInfo.remainingMinutes)");
    expect(page).toContain("Keep waiting");
    expect(page).toContain("Mark complete early");
    expect(page).toContain("aria-describedby=\"early-kitchen-step-description\"");
    expect(page).toContain("earlyKeepWaitingRef.current?.focus()");
    expect(page).toContain("setConfirmEarlyCompletion(false)");
    expect(page).toContain("const result = completeKitchenTimelineStep(session, currentStep, undefined, now)");
    expect(page).toContain("We couldn’t complete this step. Your progress is still safe. Try again.");
    expect(page).toContain("Try again");
    expect(page).toContain("setCurrentTime(now)");
    expect(page).not.toContain("Continue anyway");
  });

  it("adds one secondary Dough Guide link for the active Kitchen Mode step", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("getDoughGuideLinkForSessionStep(currentStep, \"/session/kitchen\")");
    expect(page).toContain("doughGuideLink.href");
    expect(page).toContain("doughGuideLink.ariaLabel");
    expect(page).toContain("{doughGuideLink.label}");
    expect(page).toContain("kitchenCompleteActionLabel(currentStep)");
    expect(page).toContain("Rest complete");
    expect(page).toContain("primaryActionDisabled");
  });

  it("adds secondary baking troubleshooting help for Kitchen Mode oven steps only", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("function isOvenTroubleshootingStep(step?: { id: string })");
    expect(page).toContain('step?.id === "preheat-oven" || step?.id === "bake-pizza"');
    expect(page).toContain("getPizzaSessionBakingTroubleshootingLink(\"Something looks wrong? Open baking troubleshooting\")");
    expect(page).toContain("isOvenTroubleshootingStep(currentStep) ? bakingTroubleshootingLink : null");
    expect(page).toContain("ovenTroubleshootingLink.href");
    expect(page).toContain("ovenTroubleshootingLink.ariaLabel");
    expect(page).toContain("{ovenTroubleshootingLink.label}");
    expect(page).toContain("Oven preheated");
    expect(page).toContain("Done baking? Review session");
    expect(page).not.toContain("shouldConfirmEarlyKitchenStepCompletion(currentStep, new Date())");
  });

  it("reuses shared live timing language for Kitchen Mode current and next step timing", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("import { formatTimelineLiveTiming } from \"@/lib/timeline-live-timing\"");
    expect(page).toContain("const currentLiveTiming = formatTimelineLiveTiming(currentStep?.scheduledAt, now)");
    expect(page).toContain("const nextLiveTiming = formatTimelineLiveTiming(kitchenState.nextStep?.scheduledAt, now)");
    expect(page).toContain("compactKitchenTiming(currentRuntimeStep, session, currentLiveTiming, now, currentStepHasStarted)");
    expect(page).toContain("formatRuntimeClockTime(kitchenState.nextStep.scheduledAt)");
    expect(page).toContain("liveTiming.label");
    expect(page).toContain("formatKitchenOverdueValue(liveTiming.value)");
    expect(page).toContain("nextLiveTiming.label");
    expect(page).toContain("nextLiveTiming.value");
    expect(page).toContain("window.setInterval(() => setCurrentTime(new Date()), 15_000)");
    expect(page).toContain("window.clearInterval(timer)");
    expect(page).toContain("aria-live=\"polite\"");
  });

  it("keeps Kitchen Mode timing states aligned with the Timeline live timing formatter", () => {
    const now = new Date("2026-07-10T08:00:00.000Z");

    expect(formatTimelineLiveTiming("2026-07-10T10:15:00.000Z", now)).toEqual({
      kind: "future",
      label: "Starts in 2 h 15 min",
    });
    expect(formatTimelineLiveTiming("2026-07-10T08:00:45.000Z", now)).toEqual({
      kind: "future",
      label: "Starts in 45 sec",
    });
    expect(formatTimelineLiveTiming("2026-07-10T08:00:00.000Z", now)).toEqual({
      kind: "ready",
      label: "READY NOW",
    });
    expect(formatTimelineLiveTiming("2026-07-10T07:48:00.000Z", now)).toEqual({
      kind: "overdue",
      label: "OVERDUE",
      value: "−12 min",
    });
    expect(formatTimelineLiveTiming(undefined, now)).toEqual({
      kind: "unknown",
      label: "Timing not set",
    });
  });

  it("calculates Kitchen Mode wait labels and early completion confirmation from scheduled time", () => {
    const now = new Date("2026-07-10T08:00:00.000Z");
    const fiveMinutes = { scheduledAt: "2026-07-10T08:05:00.000Z" };
    const seventyFiveMinutes = { scheduledAt: "2026-07-10T09:15:00.000Z" };
    const due = { scheduledAt: "2026-07-10T08:00:00.000Z" };
    const overdue = { scheduledAt: "2026-07-10T07:55:00.000Z" };

    expect(formatKitchenStepWaitLabel(5)).toBe("Wait 5 min");
    expect(formatKitchenStepWaitLabel(75)).toBe("Wait 1 h 15 min");
    expect(getKitchenStepWaitInfo(fiveMinutes, now)).toEqual({
      isTooEarly: true,
      remainingMinutes: 5,
      waitLabel: "Wait 5 min",
    });
    expect(getKitchenStepWaitInfo(seventyFiveMinutes, now)).toEqual({
      isTooEarly: true,
      remainingMinutes: 75,
      waitLabel: "Wait 1 h 15 min",
    });
    expect(getKitchenStepWaitInfo(due, now)).toEqual({ isTooEarly: false, remainingMinutes: 0 });
    expect(getKitchenStepWaitInfo(overdue, now)).toEqual({ isTooEarly: false, remainingMinutes: 0 });
    expect(shouldConfirmEarlyKitchenStepCompletion(fiveMinutes, now)).toBe(true);
    expect(shouldConfirmEarlyKitchenStepCompletion(due, now)).toBe(false);
  });

  it("builds exact early-completion warnings for timed biological Kitchen stages", () => {
    expect(getEarlyTimedKitchenCompletionWarning({ id: "rest-dough" }, 18)).toEqual({
      title: "The dough still needs 18 minutes of rest",
      description: "Continuing early may reduce dough relaxation and affect the next stage.",
    });
    expect(getEarlyTimedKitchenCompletionWarning({ id: "room-ferment" }, 134)).toEqual({
      title: "The dough still needs 2 h 14 min of fermentation",
      description: "Continuing early may affect dough development and the final result.",
    });
    expect(getEarlyTimedKitchenCompletionWarning({ id: "room-temperature-rest" }, 24)).toEqual({
      title: "The dough balls still need 24 minutes of proofing",
      description: "Continuing early may make the dough harder to stretch.",
    });
  });

  it("formats the mobile Rest dough countdown without changing readiness logic", () => {
    const now = new Date("2026-07-10T16:47:00.000Z");

    expect(formatKitchenRestCountdown("2026-07-10T17:14:00.000Z", now)).toBe("27:00 remaining");
    expect(formatKitchenRestCountdown("2026-07-10T16:47:45.000Z", now)).toBe("0:45 remaining");
    expect(formatKitchenRestCountdown("2026-07-10T16:47:00.000Z", now)).toBe("0:00 remaining");
    expect(formatKitchenRestCountdown("2026-07-10T16:46:30.000Z", now)).toBe("0:00 remaining");
  });

  it("formats the mobile Mix dough reserved window from actual runtime start", () => {
    const startedAt = "2026-07-10T16:44:00.000Z";

    expect(formatKitchenMixingWindowStatus(undefined, new Date("2026-07-10T16:44:00.000Z"))).toBe("30 min remaining");
    expect(formatKitchenMixingWindowStatus(startedAt, new Date("2026-07-10T16:44:30.000Z"))).toBe("30 min remaining");
    expect(formatKitchenMixingWindowStatus(startedAt, new Date("2026-07-10T17:04:00.000Z"))).toBe("10 min remaining");
    expect(formatKitchenMixingWindowStatus(startedAt, new Date("2026-07-10T17:13:30.000Z"))).toBe("less than 1 min remaining");
    expect(formatKitchenMixingWindowStatus(startedAt, new Date("2026-07-10T17:14:00.000Z"))).toBe("0 min remaining");
    expect(formatKitchenMixingWindowStatus(startedAt, new Date("2026-07-10T17:16:00.000Z"))).toBe("2 min overdue");
  });

  it("formats the mobile Fermentation countdown without changing readiness logic", () => {
    const readyAt = "2026-07-10T12:03:00.000Z";

    expect(formatKitchenFermentationCountdown(readyAt, new Date("2026-07-09T20:00:00.000Z"))).toBe("16 h 03 min remaining");
    expect(formatKitchenFermentationCountdown(readyAt, new Date("2026-07-10T12:02:30.000Z"))).toBe("less than 1 min remaining");
    expect(formatKitchenFermentationCountdown(readyAt, new Date("2026-07-10T12:03:00.000Z"))).toBe("Fermentation complete");
    expect(formatKitchenFermentationCountdown(readyAt, new Date("2026-07-10T12:05:00.000Z"))).toBe("Fermentation ready");
  });

  it("summarizes mobile Fermentation type and location from canonical session data", () => {
    const roomStep = { id: "room-ferment", label: "Room temperature ferment", status: "todo" as const };
    const coldStep = { id: "cold-ferment", label: "Cold fermentation", status: "todo" as const };
    const roomSession = createPizzaSession({
      id: "kitchen-mobile-room-fermentation-summary",
      recipeSnapshot: { fermentation: "12h-room" },
      fermentationTemperatureCOverride: 23,
    });
    const coldSession = createPizzaSession({
      id: "kitchen-mobile-cold-fermentation-summary",
      recipeSnapshot: { fermentation: "24h-cold" },
      fermentationTemperatureCOverride: 6,
    });

    expect(isKitchenFermentationStep(roomStep)).toBe(true);
    expect(getKitchenFermentationMobileSummary(roomSession, roomStep)).toEqual({
      title: "Room-temperature fermentation",
      location: "Keep the covered dough at room temperature.",
      prepInstruction: "Cover the dough and leave it to ferment at room temperature.",
    });
    expect(getKitchenFermentationMobileSummary(coldSession, coldStep)).toEqual({
      title: "Cold fermentation",
      location: "Keep the covered dough in the fridge at 6 °C.",
      prepInstruction: "Cover the dough and place it in the fridge for cold fermentation.",
    });
  });

  it("summarizes the next fermentation type and planned duration from the saved plan", () => {
    const roomSession = createPizzaSession({
      id: "kitchen-rest-room-summary",
      recipeSnapshot: { fermentation: "12h-room" },
      timeline: {
        generatedAt: "2026-07-10T15:00:00.000Z",
        targetEatTime: "2026-07-11T16:00:00.000Z",
        steps: [
          { id: "mix-dough", label: "Mix dough", scheduledAt: "2026-07-10T16:14:00.000Z", status: "done", kind: "active" },
          { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-10T17:14:00.000Z", status: "todo", kind: "passive" },
          { id: "room-ferment", label: "Room temperature ferment", scheduledAt: "2026-07-10T17:14:00.000Z", status: "todo", kind: "passive" },
          { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T13:56:00.000Z", status: "todo", kind: "active" },
        ],
      },
    });
    const coldSession = createPizzaSession({
      id: "kitchen-rest-cold-summary",
      recipeSnapshot: { fermentation: "24h-cold" },
      timeline: {
        generatedAt: "2026-07-10T15:00:00.000Z",
        targetEatTime: "2026-07-12T16:00:00.000Z",
        steps: [
          { id: "rest-dough", label: "Rest dough", scheduledAt: "2026-07-10T17:14:00.000Z", status: "todo", kind: "passive" },
          { id: "cold-ferment", label: "Cold fermentation", scheduledAt: "2026-07-10T17:14:00.000Z", status: "todo", kind: "passive" },
          { id: "ball-dough", label: "Ball dough", scheduledAt: "2026-07-11T17:14:00.000Z", status: "todo", kind: "active" },
        ],
      },
    });

    expect(getKitchenRestNextFermentationLabel(roomSession, roomSession.timeline?.steps[2])).toBe("Room-temperature fermentation");
    expect(getKitchenRestNextFermentationLabel(coldSession, coldSession.timeline?.steps[1])).toBe("Cold fermentation");
    expect(getKitchenPlannedFermentationDurationMinutes(roomSession.timeline?.steps)).toBe(20 * 60 + 42);
    expect(formatKitchenPlannedDuration(20 * 60 + 42)).toBe("20 h 42 min");
    expect(getKitchenPlannedFermentationDurationMinutes(coldSession.timeline?.steps)).toBe(24 * 60);
    expect(formatKitchenPlannedDuration(24 * 60)).toBe("24 h");
  });

  it("provides task instructions for required timeline labels and level-aware copy", () => {
    const required = [
      "mix-dough",
      "rest-dough",
      "cold-ferment",
      "ball-dough",
      "room-temperature-rest",
      "preheat-oven",
      "prepare-sauce-toppings",
      "bake-pizza",
      "review-result",
    ];

    for (const id of required) {
      const copy = getKitchenTaskInstruction({ id, label: id, status: "todo" });
      expect(copy.shortInstruction.length).toBeGreaterThan(10);
      expect(copy.beginnerWhy.length).toBeGreaterThan(10);
      expect(copy.enthusiastWhy.length).toBeGreaterThan(10);
      expect(copy.pizzaNerdWhy.length).toBeGreaterThan(10);
    }
  });

  it("adapts Kitchen Mode guidance to Beginner, Enthusiast and Pizza Nerd levels", () => {
    const mixStep = { id: "mix-dough", label: "Mix dough", status: "todo" as const };

    const beginner = getKitchenExperienceGuidance(mixStep, "beginner");
    const enthusiast = getKitchenExperienceGuidance(mixStep, "enthusiast");
    const pizzaNerd = getKitchenExperienceGuidance(mixStep, "pizza_nerd");

    expect(beginner.instruction).toBe("Mix until no dry flour remains, then cover the dough.");
    expect(beginner.reassuranceTip).toBe("Do not add extra flour just because it feels messy.");
    expect(beginner.technicalNote).toBeUndefined();

    expect(enthusiast.instruction).toContain("fully hydrated");
    expect(enthusiast.whyItMatters).toContain("predictable");
    expect(enthusiast.technicalNote).toBeUndefined();

    expect(pizzaNerd.instruction).toContain("oxidation");
    expect(pizzaNerd.technicalNote).toContain("dough temperature");
    expect(pizzaNerd.reassuranceTip).toBeUndefined();

    expect([beginner.instruction, beginner.whatToLookFor, beginner.reassuranceTip].join(" ")).not.toMatch(/oxidation|dough temperature|full gluten development/i);
    expect([enthusiast.instruction, enthusiast.whatToLookFor, enthusiast.whyItMatters].join(" ")).not.toMatch(/oxidation|full gluten development/i);
  });

  it("renders selected experience level as a compact mode badge", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).not.toContain("levelModeLabel(experience.label)");
    expect(page).not.toContain("${label} mode");
    expect(page).toContain("<SessionExperienceLevelBadge level={session.experienceLevel} compact />");
    expect(getExperienceLevelConfig("beginner").label).toBe("Beginner");
    expect(getExperienceLevelConfig("enthusiast").label).toBe("Enthusiast");
    expect(getExperienceLevelConfig("pizza_nerd").label).toBe("Pizza Nerd");
    expect(getExperienceLevelConfig("beginner").markerClassName).toBe("bg-leaf");
    expect(getExperienceLevelConfig("enthusiast").markerClassName).toBe("bg-[#f2a15f]");
    expect(getExperienceLevelConfig("pizza_nerd").markerClassName).toBe("bg-[#eb577f]");
    expect(getExperienceLevelConfig("Pizza Nerd").markerClassName).toBe("bg-[#eb577f]");
    expect(getExperienceLevelConfig("Pizza Nerd").badgeClassName).toBe(getExperienceLevelConfig("pizza_nerd").badgeClassName);
  });

  it("uses safe Beginner guidance for missing, unknown or legacy experience levels", () => {
    const bakeStep = { id: "bake-pizza", label: "Bake pizza", status: "todo" as const };

    expect(getKitchenExperienceGuidance(bakeStep, undefined)).toEqual(getKitchenExperienceGuidance(bakeStep, "beginner"));
    expect(getKitchenExperienceGuidance(bakeStep, "not-a-real-level")).toEqual(getKitchenExperienceGuidance(bakeStep, "beginner"));
    expect(getKitchenExperienceGuidance(bakeStep, "intermediate")).toEqual(getKitchenExperienceGuidance(bakeStep, "enthusiast"));
    expect(getKitchenExperienceGuidance(bakeStep, "advanced")).toEqual(getKitchenExperienceGuidance(bakeStep, "pizza_nerd"));
    expect(getKitchenExperienceGuidance(bakeStep, "Pizza Nerd")).toEqual(getKitchenExperienceGuidance(bakeStep, "pizza_nerd"));
  });

  it("keeps fermentation guidance aligned to room, cold and neutral Kitchen Mode fermentation copy", () => {
    const roomStep = { id: "cold-ferment", label: "Room temperature ferment", status: "todo" as const };
    const coldStep = { id: "cold-ferment", label: "Cold ferment", status: "todo" as const };
    const neutralStep = { id: "ferment-dough", label: "Ferment dough", status: "todo" as const };
    const roomSession = createPizzaSession({
      id: "room-guidance-session",
      recipeSnapshot: { fermentation: "12h-room" },
    });
    const coldSession = createPizzaSession({
      id: "cold-guidance-session",
      recipeSnapshot: { fermentation: "48h-cold" },
    });

    const roomBeginner = getKitchenExperienceGuidance(roomStep, "beginner", roomSession);
    const coldNerd = getKitchenExperienceGuidance(coldStep, "pizza_nerd", coldSession);
    const neutralNerd = getKitchenExperienceGuidance(neutralStep, "pizza_nerd");

    expect(roomBeginner.instruction).toContain("room temperature");
    expect(roomBeginner.reassuranceTip).toContain("Room-temperature dough moves faster");
    expect([roomBeginner.instruction, roomBeginner.whatToLookFor, roomBeginner.reassuranceTip].join(" ")).not.toMatch(/fridge|cold handling/i);

    expect(coldNerd.instruction).toContain("selected plan");
    expect(coldNerd.technicalNote).toContain("do not infer cold handling for a room-temperature plan");
    expect(neutralNerd.technicalNote).toContain("avoid assuming fridge-specific behavior");
  });

  it("renders clearer Kitchen Mode timing and technique hierarchy without alert styling for normal guidance", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("formatKitchenStepTime(currentStep.scheduledAt)");
    expect(page).toContain("compactKitchenTiming(currentRuntimeStep, session, currentLiveTiming, now, currentStepHasStarted)");
    expect(page).toContain("formatRuntimeClockTime(kitchenState.nextStep.scheduledAt)");
    expect(page).toContain("aria-labelledby=\"kitchen-step-guidance-heading\"");
    expect(page).toContain("rounded-[1.25rem] border border-leaf/10 bg-white/65");
    expect(page).toContain("Quiet-hours warning");
    expect(page).toContain("rounded-2xl bg-tomato/10");
    expect(page.indexOf("role=\"progressbar\"")).toBeLessThan(page.indexOf("Current step"));
    expect(page.indexOf("Current step")).toBeLessThan(page.indexOf("aria-live=\"polite\""));
    expect(page.indexOf("aria-live=\"polite\"")).toBeLessThan(page.indexOf("Next:"));
    expect(page.indexOf("Next:")).toBeLessThan(page.indexOf("Current task instruction"));
    expect(page).toContain("const moreGuidanceDisclosure = (");
    expect(page).toContain("{!currentStepIsBakePizza && moreGuidanceDisclosure}");
    expect(page).toContain("{currentStepIsBakePizza && moreGuidanceDisclosure}");
    expect(page.indexOf("const moreGuidanceDisclosure = (")).toBeLessThan(page.indexOf("id=\"kitchen-level-guidance-heading\""));
    expect(page.indexOf("id=\"kitchen-level-guidance-heading\"")).toBeLessThan(page.indexOf("What this should look like"));
    expect(page.indexOf("Current task instruction")).toBeLessThan(page.indexOf("{!currentStepIsBakePizza && moreGuidanceDisclosure}"));
  });

  it("adds a mobile-only Rest dough status hierarchy while preserving desktop timing detail", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("currentStepIsRestDough");
    expect(page).toContain("restMobileHiddenClass");
    expect(page).toContain("Dough is resting");
    expect(page).toContain("formatKitchenRestCountdown(currentStep?.scheduledAt, now)");
    expect(page).toContain("id=\"kitchen-rest-mobile-status\"");
    expect(page).toContain("Ready at {restReadyClock}");
    expect(page).toContain("getKitchenRestNextFermentationLabel(session, kitchenState.nextStep)");
    expect(page).toContain("Planned duration:");
    expect(page).toContain("Keep the dough covered until the timer reaches zero.");
    expect(page).toContain("className={`${compactTimingHiddenClass}grid gap-2 border-y");
    expect(page).toContain("className={`${timedWaitMobileHiddenClass}mt-5 rounded-[1.25rem]");
    expect(page).toContain("Rest complete");
  });

  it("adds a mobile-only Fermentation status hierarchy while preserving desktop timing detail", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("currentStepIsFermentation");
    expect(page).toContain("getKitchenFermentationMobileSummary(session, currentStep)");
    expect(page).toContain("formatKitchenFermentationCountdown(currentStep?.scheduledAt, now)");
    expect(page).toContain("id=\"kitchen-fermentation-mobile-status\"");
    expect(page).toContain("{fermentationMobileSummary.title}");
    expect(page).toContain("{fermentationMobileSummary.location}");
    expect(page).toContain("{fermentationCountdown}");
    expect(page).toContain("Before leaving the dough to ferment, develop it briefly as instructed by folding, stretching or kneading.");
    expect(page).toContain("{fermentationMobileSummary.prepInstruction}");
    expect(page).toContain("Next:</span> Divide and shape the dough into balls");
    expect(page).toContain("currentStepIsMixDough || currentStepIsRestDough || currentStepIsFermentation || currentStepIsBakePizza");
    expect(page).toContain("currentStepIsRestDough || currentStepIsFermentation");
    expect(page).toContain("currentStepIsFermentation ? \"max-sm:hidden \" : \"\"");
    expect(page).toContain("Fermentation complete");
    expect(page).toContain("getEarlyTimedKitchenCompletionWarning(currentStep, waitInfo.remainingMinutes)");
    expect(page).toContain("Mark complete early");
    expect(page).not.toContain("Knead the dough before fermentation");
  });

  it("adds a mobile-only Mix dough guidance hierarchy while preserving desktop timing detail", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("currentStepIsMixDough");
    expect(page).toContain("formatKitchenMixingWindowStatus(");
    expect(page).toContain("id=\"kitchen-mix-mobile-status\"");
    expect(page).toContain("Mix the dough");
    expect(page).toContain("Start mixing now");
    expect(page).toContain("You have up to 30 minutes to mix the dough.");
    expect(page).toContain("Weigh the ingredients and mix until no dry flour remains. Cover the dough when finished.");
    expect(page).toContain("When the dough is mixed, press Mixing complete. The 30-minute dough rest starts from that moment.");
    expect(page).toContain("Next:</span> Dough rest for 30 min");
    expect(page).toContain("<DoughToolsIcon name=\"mixing-bowl\"");
    expect(page).toContain("compactMobileStatusHiddenClass");
    expect(page).toContain("mixMobileHiddenClass");
    expect(page).toContain("Current step");
    expect(page).toContain("compactKitchenTiming(currentRuntimeStep, session, currentLiveTiming, now, currentStepHasStarted)");
    expect(page).toContain("Mixing complete");
    expect(page).toContain("Needed now");
    expect(page).not.toContain("function kitchenMixCountdown");
  });

  it("uses a clearer ball-dough action and done condition when dough-ball amounts are available", () => {
    const copy = getKitchenTaskPresentation({
      id: "ball-dough",
      label: "Ball dough",
      status: "todo",
      helperCopy: "Balling creates the final portions and builds surface tension.",
    }, createPizzaSession({
      id: "kitchen-ball-copy",
      recipeSnapshot: {
        balls: 8,
        ballWeight: 260,
      },
    }));

    expect(copy.title).toBe("Ball dough");
    expect(copy.shortInstruction).toBe("Shape 8 dough balls, 260 g each.");
    expect(copy.doneCondition).toBe("Each dough ball is smooth, tight, and placed seam-side down.");
    expect(copy.helperCopy).toBe("Balling creates the final portions and builds surface tension.");
  });

  it("falls back to safe ball-dough instruction when dough-ball amounts are unavailable", () => {
    const copy = getKitchenTaskPresentation({
      id: "ball-dough",
      label: "Ball dough",
      status: "todo",
    }, createPizzaSession({ id: "kitchen-ball-copy-fallback" }));

    expect(copy.shortInstruction).toBe("Divide the dough into the planned portions and shape each one into a smooth dough ball.");
  });

  it("uses oven-specific Kitchen Mode preheat and bake presentation from the shared bake profile", () => {
    const preheatStep = { id: "preheat-oven", label: "Preheat oven", status: "todo" as const };
    const bakeStep = { id: "bake-pizza", label: "Bake pizza", status: "todo" as const };
    const home = createPizzaSession({ id: "kitchen-home-oven-copy", ovenType: "home" });
    const pizza = createPizzaSession({ id: "kitchen-pizza-oven-copy", ovenType: "gas" });

    expect(getKitchenTaskPresentation(preheatStep, home).shortInstruction).toContain("home oven");
    expect(getKitchenTaskPresentation(preheatStep, home).helperCopy).toContain("stone, steel or tray");
    expect(getKitchenTaskPresentation(bakeStep, home).helperCopy).toContain("about 5 min");
    expect(getKitchenTaskPresentation(bakeStep, home).helperCopy).toContain("Rotate");

    expect(getKitchenTaskPresentation(preheatStep, pizza).shortInstruction)
      .toBe("Preheat the oven, stone, steel or pizza oven before opening the dough.");
    expect(getKitchenTaskPresentation(bakeStep, pizza).shortInstruction)
      .toBe("Open, top and bake one pizza at a time. Watch color and rotate if needed.");
  });

  it("renders room-temperature fermentation copy in Kitchen Mode when the selected plan is room fermentation", () => {
    const page = source("app/session/kitchen/page.tsx");
    const session = createPizzaSession({
      id: "kitchen-room-fermentation-copy",
      recipeSnapshot: {
        fermentation: "12h-room",
      },
    });
    const copy = getKitchenTaskPresentation({
      id: "cold-ferment",
      label: "Cold ferment",
      status: "todo",
      helperCopy: "Cold time slows fermentation and gives more scheduling flexibility.",
    }, session);

    expect(page).toContain("getKitchenTaskPresentation(currentStep, session)");
    expect(copy).toEqual({
      title: "Room temperature ferment",
      shortInstruction: "Keep the covered dough at room temperature for the planned fermentation time.",
      doneCondition: "The dough is covered and resting at room temperature on the planned schedule.",
      helperCopy: "Room temperature fermentation moves faster, so follow the planned timing closely.",
    });
    expect([copy.title, copy.shortInstruction, copy.helperCopy].join(" ")).not.toMatch(/Cold ferment|fridge|Cold time slows fermentation/i);
  });

  it("keeps cold fermentation copy in Kitchen Mode when the selected plan is cold fermentation", () => {
    const session = createPizzaSession({
      id: "kitchen-cold-fermentation-copy",
      recipeSnapshot: {
        fermentation: "48h-cold",
      },
    });
    const copy = getKitchenTaskPresentation({
      id: "cold-ferment",
      label: "Cold ferment",
      status: "todo",
    }, session);

    expect(copy).toEqual({
      title: "Cold ferment",
      shortInstruction: "Move the covered dough to the fridge if your plan uses cold fermentation.",
      doneCondition: "The dough is covered and resting in the fridge for the planned cold fermentation time.",
      helperCopy: "Cold time slows fermentation and gives more scheduling flexibility.",
    });
  });

  it("uses neutral fermentation copy when Kitchen Mode cannot determine the selected fermentation type", () => {
    const copy = getKitchenTaskPresentation({
      id: "cold-ferment",
      label: "Cold ferment",
      status: "todo",
    }, createPizzaSession({ id: "kitchen-unknown-fermentation-copy" }));

    expect(copy).toEqual({
      title: "Ferment dough",
      shortInstruction: "Keep the dough covered and follow the planned fermentation timing.",
      doneCondition: "The dough is covered and fermenting according to the planned timing.",
      helperCopy: "Fermentation timing affects dough strength, flavor, and readiness.",
    });
    expect([copy.title, copy.shortInstruction, copy.helperCopy].join(" ")).not.toMatch(/Cold ferment|fridge|Cold time slows fermentation/i);
  });

  it("connects timeline and Continue Session to Kitchen Mode while shopping hands off to Timeline", () => {
    const timelinePage = source("app/session/timeline/page.tsx");
    const shoppingPage = source("app/session/shopping/page.tsx");
    const dataDoc = source("docs/pizza-session-data-model.md");

    expect(timelinePage).toContain("/session/kitchen");
    expect(timelinePage).toContain("/session/review");
    expect(shoppingPage).toContain("/session/timeline");
    expect(shoppingPage).not.toContain("/session/kitchen?from=shopping");
    expect(dataDoc).toContain("When `currentStep` is `timeline` and the session has unfinished timeline tasks");

    const timelineSession = createPizzaSession({
      id: "continue-kitchen",
      currentStep: "timeline",
      timeline: sampleTimeline,
    });
    const prepSession = createPizzaSession({
      id: "continue-prep",
      currentStep: "prep",
    });

    expect(pizzaSessionContinueHref(timelineSession)).toBe("/session/kitchen");
    expect(pizzaSessionContinueHref(prepSession)).toBe("/session/kitchen");
  });

  it("documents Patch 36 and keeps unavailable claims out of Kitchen Mode", () => {
    const doc = source("docs/kitchen-mode.md");
    const changelog = source("lib/changelog.ts");
    const page = source("app/session/kitchen/page.tsx");

    expect(doc).toContain("/session/kitchen");
    expect(doc).toContain("first timeline step with status");
    expect(doc).toContain("does not recalculate");
    expect(doc).toContain("/session/review");
    expect(doc).toContain("does not add");
    expect(changelog).toContain("Session Kitchen Mode");
    expect(changelog).toContain("No formula, cloud sync, reminder, tracking or indexing behavior changed");
    expect([doc, changelog, page].join("\n")).not.toMatch(/Google indexing enabled|analytics added|tracking added|cloud sync is active|push notifications enabled/i);
  });
});
