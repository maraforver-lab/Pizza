import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createPizzaSession, pizzaSessionContinueHref } from "@/lib/pizza-session";
import { generatePizzaSessionTimeline } from "@/lib/pizza-session-timeline";
import {
  completeKitchenTimelineStep,
  doughKitchenIngredientLines,
  getKitchenModeForStep,
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
    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={9}");
    expect(page).toContain("hideMeta");
    expect(page).toContain("Mark step as done");
    expect(page).toContain("No active pizza session");
    expect(page).toContain("Create a timeline first");
    expect(page).toContain("Ingredient amounts unavailable");
    expect(page).toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
    expect(page).toContain("kitchenBackHrefFromSource");
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

  it("does not show Kitchen Mode Mix dough in the past when the recommended start has passed", () => {
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
    expect(storedMix?.scheduledAt).toBe(new Date("2026-07-03T12:00:00").toISOString());

    const state = getKitchenModeState(session, now);
    expect(state.ok).toBe(true);
    if (!state.ok) throw new Error("Expected kitchen state");
    expect(state.currentStep?.id).toBe("mix-dough");
    expect(state.currentStep?.scheduledAt).toBe(now.toISOString());
    expect(state.currentStep?.helperCopy).toContain("ideal dough start time has passed");
    expect(session.timeline?.steps.find((step) => step.id === "mix-dough")?.scheduledAt)
      .toBe(new Date("2026-07-03T12:00:00").toISOString());
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

    expect(lines.map((line) => line.label)).toEqual(["Flour", "Water", "Salt", "Yeast / leavener"]);
    expect(lines.map((line) => line.label)).not.toContain("Sauce");
    expect(lines.map((line) => line.label)).not.toContain("Cheese");
    expect(lines.map((line) => line.label)).not.toContain("Toppings");
  });

  it("renders a baseline service mode without a pizza-by-pizza order board", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("Service reminders");
    expect(page).toContain("Pizza count:");
    expect(page).toContain("Keep sauce, cheese and toppings ready, then follow the current task.");
    expect(page).not.toMatch(/order board|ticket rail|table service/i);
  });

  it("prepares a completion transition to review and notes", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("Pizza session complete");
    expect(page).toContain("Save what worked and what you want to improve next time.");
    expect(page).toContain("Review your pizza →");
    expect(page).toContain("href=\"/session/review\"");
    expect(page).not.toContain("All kitchen steps done");
    expect(page).not.toContain("Ready for review");
  });

  it("aligns Kitchen Mode with Pizza Session V2 execution structure", () => {
    const page = source("app/session/kitchen/page.tsx");

    expect(page).toContain("step={9}");
    expect(page).toContain("Needed now");
    expect(page).toContain("BottomActionBar");
    expect(page).toContain("href={backHref}");
    expect(page).toContain("Mark step as done →");
    expect(page).toContain("kitchenBackHrefFromSource(source)");
    expect(page).toContain("kitchenBackHrefFromReferrer(document.referrer)");
    expect(page).toContain("setSession(updated)");
    expect(page).toContain("if (value === \"timeline\") return \"/session/timeline\"");
    expect(page).toContain("if (value === \"review\") return \"/session/review\"");
    expect(page).toContain("return \"/session/shopping\"");
    expect(page).not.toContain("<StatusPill");
    expect(page).not.toContain("Step 9: Kitchen Mode");
    expect(page).not.toContain("Current step");
    expect(page).not.toContain("Do this now");
    expect(page).not.toContain("SessionLocalOnlyNote");
    expect(page).not.toContain("saveMessage");
    expect(page).not.toContain("marked done. Progress saved in this browser.");
    expect(page).not.toContain('role="status"');
    expect(page).not.toContain("<AppSignature");
    expect(page).not.toContain("Open full Calculator");
    expect(page).not.toContain("Open baking timer");
    expect(page).not.toContain("Review dough plan");
    expect(page).not.toContain("Back to timeline");
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
