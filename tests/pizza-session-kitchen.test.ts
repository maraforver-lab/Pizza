import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createPizzaSession, pizzaSessionContinueHref } from "@/lib/pizza-session";
import {
  completeKitchenTimelineStep,
  getKitchenModeState,
  getKitchenTaskInstruction,
  isMixDoughStep,
  recipeSnapshotIngredientLines,
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

describe("Pizza Session Kitchen Mode", () => {
  it("adds the /session/kitchen route with local-first task UI and safe states", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "kitchen", "page.tsx"))).toBe(true);
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("\"use client\"");
    expect(page).toContain("Kitchen Mode");
    expect(page).toContain("What to do now");
    expect(page).toContain("Mark done");
    expect(page).toContain("No active session yet");
    expect(page).toContain("Create a timeline first");
    expect(page).toContain("Dough plan details are missing");
    expect(page).toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
    expect(page).toContain("No cloud sync, reminders, notifications");
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

  it("returns safe missing states for missing active session and timeline", () => {
    expect(getKitchenModeState(undefined)).toEqual({ ok: false, missingReason: "no-session" });
    expect(getKitchenModeState(createPizzaSession({ id: "missing-timeline" }))).toEqual({ ok: false, missingReason: "missing-timeline" });
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

    const updated = completeKitchenTimelineStep(
      session,
      "mix-dough",
      storage,
      new Date("2026-06-25T10:30:00.000Z"),
    );

    expect(updated?.timeline?.steps[0].status).toBe("done");
    expect(getKitchenModeState(updated).ok && getKitchenModeState(updated).currentStep?.id).toBe("rest-dough");
    expect(updated?.currentStep).toBe("prep");
    expect(updated?.status).toBe("preparing");
    expect(updated?.updatedAt).toBe("2026-06-25T10:30:00.000Z");
    expect(updated?.lastSavedAt).toBe("2026-06-25T10:30:00.000Z");
    expect(updated?.recipeSnapshot?.flourAmount).toBe(623.2);
    expect(updated?.shoppingList?.presetName).toBe("Margherita");
    expect(getActivePizzaSession(storage)?.id).toBe(session.id);
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("mix-dough");
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

    const updated = completeKitchenTimelineStep(session, "bake-pizza", storage);
    expect(updated?.currentStep).toBe("review");
    expect(updated?.status).toBe("reviewing");
  });

  it("shows recipe snapshot ingredient lines for Mix dough without recalculating", () => {
    const lines = recipeSnapshotIngredientLines(recipeSnapshot);

    expect(lines.map((line) => line.label)).toEqual([
      "Total dough",
      "Flour",
      "Water",
      "Salt",
      "Yeast / leavener",
      "Dough balls",
    ]);
    expect(lines.map((line) => line.value).join(" ")).toContain("4 × 260 g");
    expect(recipeSnapshotIngredientLines(undefined)).toEqual([]);
    expect(isMixDoughStep(sampleTimeline.steps[0])).toBe(true);
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

  it("connects timeline, shopping and Continue Session to Kitchen Mode where appropriate", () => {
    const timelinePage = source("app/session/timeline/page.tsx");
    const shoppingPage = source("app/session/shopping/page.tsx");
    const dataDoc = source("docs/pizza-session-data-model.md");

    expect(timelinePage).toContain("/session/kitchen");
    expect(timelinePage).toContain("/session/review");
    expect(shoppingPage).toContain("/session/kitchen");
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
