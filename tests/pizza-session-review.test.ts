import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAndSavePizzaSession,
  getActivePizzaSession,
  getPizzaSession,
  PIZZA_SESSIONS_STORAGE_KEY,
  setActivePizzaSession,
} from "@/lib/pizza-session-storage";
import {
  completeSessionReview,
  getSessionReviewCopy,
  normalizeSessionReviewInput,
  saveSessionReview,
  SESSION_REVIEW_LOCAL_ONLY_COPY,
  sessionSummaryLines,
} from "@/lib/pizza-session-review";
import { MemoryStorage } from "./helpers";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const timeline = {
  generatedAt: "2026-06-25T10:00:00.000Z",
  targetEatTime: "2026-06-27T18:30",
  steps: [
    { id: "mix-dough", label: "Mix dough", status: "done" as const, kind: "active" as const },
    { id: "bake-pizza", label: "Bake pizza", status: "todo" as const, kind: "active" as const },
    { id: "review-result", label: "Review result", status: "todo" as const, kind: "active" as const },
  ],
};

describe("Pizza Session review and bake notes", () => {
  it("adds the /session/review route with safe states and local-first copy", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "review", "page.tsx"))).toBe(true);
    const page = source("app/session/review/page.tsx");

    expect(page).toContain("\"use client\"");
    expect(page).toContain("SessionStepHero");
    expect(page).toContain("step={10}");
    expect(page).toContain("Review your pizza");
    expect(page).toContain("How did your pizza turn out? Save useful variables like hydration, fermentation time, flour, oven heat, topping load and bake timing.");
    expect(page).toContain("hideMeta");
    expect(page).not.toContain("desktopAside");
    expect(page).not.toContain("Step 10: Review");
    expect(page).not.toContain("Learning page</");
    expect(page).toContain("No pizza session to review");
    expect(page).toContain("Overall result");
    expect(page).toContain("1 — Poor");
    expect(page).toContain("5 — Excellent");
    expect(page).toContain("What worked well?");
    expect(page).toContain("What would you improve?");
    expect(page).toContain("Additional notes");
    expect(page).toContain("Save review →");
    expect(page).toContain("Review saved in this browser.");
    expect(page).toContain("SESSION_REVIEW_LOCAL_ONLY_COPY");
    expect(page).toContain("BottomActionBar");
    expect(page).toContain("href=\"/session/kitchen\"");
    expect(page).not.toContain("Review and notes");
    expect(page).not.toContain("Capture the variables worth testing next.");
    expect(page).not.toContain("Next time I want to try…");
    expect(page).not.toContain("Free notes");
    expect(page).not.toContain("Session summary");
    expect(page).not.toContain("Photos and sharing");
    expect(page).not.toContain("<AppSignature");
    expect(page).not.toMatch(/upload photo|share result card|copy public link|cloud sync is active|Google indexing enabled/i);
  });

  it("replaces large review textareas with optional multi-select feedback chips", () => {
    const page = source("app/session/review/page.tsx");

    expect(page.indexOf("Overall result")).toBeLessThan(page.indexOf("What worked well?"));
    expect(page.indexOf("What worked well?")).toBeLessThan(page.indexOf("What would you improve?"));
    expect(page.indexOf("What would you improve?")).toBeLessThan(page.indexOf("Additional notes"));
    expect(page.indexOf("Additional notes")).toBeLessThan(page.indexOf("Save review →"));
    [
      "Great crust",
      "Good oven spring",
      "Nice chew",
      "Good flavour",
      "Right amount of toppings",
      "Good cheese melt",
      "Easy to handle dough",
      "Timing worked well",
      "More fermentation",
      "Less fermentation",
      "Higher hydration",
      "Lower hydration",
      "Hotter oven",
      "Less toppings",
      "More salt",
      "Thinner stretch",
    ].forEach((option) => {
      expect(page).toContain(option);
    });
    expect(page).toContain("FeedbackChipGroup");
    expect(page).toContain("aria-pressed={active}");
    expect(page).toContain("whatWorked.length ? whatWorked.join(\"; \") : legacyWhatWorked");
    expect(page).toContain("improveNextTime.length ? improveNextTime.join(\"; \") : legacyImproveNextTime");
    expect(page).not.toContain("placeholder={copy.whatWorkedPlaceholder}");
    expect(page).not.toContain("placeholder={copy.improvePlaceholder}");
    expect(page).not.toContain("placeholder={copy.nextTimeTryPlaceholder}");
  });

  it("keeps after-save actions clear", () => {
    const page = source("app/session/review/page.tsx");

    expect(page).toContain("Review saved");
    expect(page).toContain("Your notes are saved in this browser.");
    expect(page).toContain("Start a new Pizza Session →");
    expect(page).toContain("Back to Kitchen Mode");
    expect(page).toContain("View timeline");
    expect(page).not.toMatch(/full timeline|shopping list|dough amounts|recipe snapshot/i);
  });

  it("normalizes rating and text review input safely", () => {
    expect(normalizeSessionReviewInput({
      rating: 7,
      notes: "  good bake ",
      whatWorked: "  crust ",
      improveNextTime: "  less sauce ",
      nextTimeTry: "  hotter oven ",
    })).toEqual({
      rating: 5,
      notes: "good bake",
      review: {
        whatWorked: "crust",
        improveNextTime: "less sauce",
        nextTimeTry: "hotter oven",
      },
    });

    expect(normalizeSessionReviewInput({ rating: 0, notes: " " })).toEqual({
      rating: undefined,
      notes: undefined,
      review: {
        whatWorked: undefined,
        improveNextTime: undefined,
        nextTimeTry: undefined,
      },
    });
  });

  it("saves rating, notes, what worked and improvement fields into Pizza Session", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "review-save",
      status: "baking",
      currentStep: "bake",
      pizzaPreset: "Diavola",
      pizzaCount: 4,
      targetEatTime: "2026-06-27T18:30",
      ovenType: "gas",
      recipeSnapshot: { balls: 4, ballWeight: 260, flourAmount: 623.2 },
      timeline,
      shoppingList: {
        presetName: "Diavola",
        groups: [{ group: "Toppings", items: [{ id: "salami", label: "Spicy salami", status: "need_to_buy" }] }],
      },
    }, storage, new Date("2026-06-25T10:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const updated = saveSessionReview(
      session,
      {
        rating: 4,
        notes: "Bottom was crisp.",
        whatWorked: "Timeline was useful.",
        improveNextTime: "Dry mushrooms better.",
        nextTimeTry: "Use a hotter oven.",
      },
      storage,
      new Date("2026-06-25T11:00:00.000Z"),
    );

    expect(updated).toMatchObject({
      id: session.id,
      status: "reviewing",
      currentStep: "review",
      rating: 4,
      notes: "Bottom was crisp.",
      review: {
        whatWorked: "Timeline was useful.",
        improveNextTime: "Dry mushrooms better.",
        nextTimeTry: "Use a hotter oven.",
        savedAt: "2026-06-25T11:00:00.000Z",
      },
      updatedAt: "2026-06-25T11:00:00.000Z",
      lastSavedAt: "2026-06-25T11:00:00.000Z",
    });
    expect(updated?.recipeSnapshot?.flourAmount).toBe(623.2);
    expect(updated?.timeline?.steps).toHaveLength(3);
    expect(updated?.shoppingList?.presetName).toBe("Diavola");
    expect(getActivePizzaSession(storage)?.id).toBe(session.id);
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("Timeline was useful");
  });

  it("completes the session, clears active id and preserves stored review data", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "review-complete",
      status: "reviewing",
      currentStep: "review",
      recipeSnapshot: { balls: 2, ballWeight: 270 },
      timeline,
    }, storage, new Date("2026-06-25T10:00:00.000Z"));
    setActivePizzaSession(session.id, storage);

    const completed = completeSessionReview(
      session,
      {
        rating: 5,
        notes: "Best batch so far.",
        whatWorked: "Long preheat.",
        improveNextTime: "Try less salami.",
        nextTimeTry: "Bake one pizza hotter.",
      },
      storage,
      new Date("2026-06-25T12:00:00.000Z"),
    );

    expect(completed?.status).toBe("completed");
    expect(completed?.currentStep).toBe("review");
    expect(completed?.rating).toBe(5);
    expect(completed?.review?.whatWorked).toBe("Long preheat.");
    expect(completed?.review?.improveNextTime).toBe("Try less salami.");
    expect(completed?.review?.nextTimeTry).toBe("Bake one pizza hotter.");
    expect(completed?.review?.savedAt).toBe("2026-06-25T12:00:00.000Z");
    expect(completed?.updatedAt).toBe("2026-06-25T12:00:00.000Z");
    expect(completed?.lastSavedAt).toBe("2026-06-25T12:00:00.000Z");
    expect(getActivePizzaSession(storage)).toBeUndefined();
    expect(getPizzaSession(session.id, storage)?.status).toBe("completed");
    expect(getPizzaSession(session.id, storage)?.recipeSnapshot?.balls).toBe(2);
  });

  it("provides session summary and level-aware review copy without separate pages", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "review-summary",
      experienceLevel: "pizza_nerd",
      pizzaPreset: "Margherita",
      pizzaCount: 6,
      targetEatTime: "2026-06-27T18:30",
      ovenType: "home",
      timeline,
    }, storage);
    const summary = sessionSummaryLines(session).flatMap((line) => [...line]).join(" ");
    const beginner = getSessionReviewCopy("beginner");
    const enthusiast = getSessionReviewCopy("enthusiast");
    const nerd = getSessionReviewCopy("pizza_nerd");

    expect(summary).toContain("Margherita");
    expect(summary).toContain("6 pizzas");
    expect(summary).toContain("Target time");
    expect(beginner.intro).toContain("rate");
    expect(enthusiast.intro).toContain("timing");
    expect(nerd.intro).toContain("hydration");
    expect(SESSION_REVIEW_LOCAL_ONLY_COPY).toContain("saved locally in this browser");
  });

  it("loads old sessions without review data safely", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({
      id: "old-review-session",
      status: "reviewing",
      currentStep: "review",
    }, storage);

    const saved = saveSessionReview(session, {}, storage, new Date("2026-06-25T13:00:00.000Z"));

    expect(session.review).toBeUndefined();
    expect(saved?.review?.savedAt).toBe("2026-06-25T13:00:00.000Z");
  });

  it("connects Kitchen Mode and Timeline to review without changing Journal storage", () => {
    const kitchen = source("app/session/kitchen/page.tsx");
    const timelinePage = source("app/session/timeline/page.tsx");
    const journal = source("app/journal/page.tsx");

    expect(kitchen).toContain("/session/review");
    expect(kitchen).toContain("Review your pizza →");
    expect(timelinePage).toContain("/session/review");
    expect(timelinePage).toContain("Review your pizza →");
    expect(timelinePage).not.toContain("Review session");
    expect(journal).toContain("@/lib/pizza-journal");
    expect(journal).toContain("loadJournalEntries");
    expect([kitchen, timelinePage].join("\n")).not.toMatch(/upload photo|share card|public link|analytics added|tracking added/i);
  });

  it("documents Patch 38 and keeps unavailable claims out", () => {
    const doc = source("docs/session-review-bake-notes.md");
    const dataDoc = source("docs/pizza-session-data-model.md");
    const kitchenDoc = source("docs/kitchen-mode.md");
    const changelog = source("lib/changelog.ts");
    const combined = [doc, dataDoc, kitchenDoc, changelog].join("\n");

    expect(doc).toContain("/session/review");
    expect(doc).toContain("review.whatWorked");
    expect(doc).toContain("review.improveNextTime");
    expect(doc).toContain("clears the active Pizza Session id");
    expect(changelog).toContain("Session review and bake notes");
    expect(combined).not.toMatch(/Google indexing enabled|analytics added|tracking added|cloud sync is active|photo upload is available|public sharing is available/i);
  });
});
