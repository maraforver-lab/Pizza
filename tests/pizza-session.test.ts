import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXPERIENCE_LEVEL_STORAGE_KEY } from "@/lib/experience-levels";
import {
  ACTIVE_PIZZA_SESSION_STORAGE_KEY,
  archivePizzaSession,
  clearActivePizzaSession,
  completePizzaSession,
  createAndSavePizzaSession,
  getActivePizzaSession,
  getPizzaSession,
  getPizzaSessions,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
  PIZZA_SESSIONS_STORAGE_KEY,
  savePizzaSession,
  setActivePizzaSession,
  updatePizzaSession,
} from "@/lib/pizza-session-storage";
import {
  createPizzaSession,
  createSessionFromRecipeParams,
  deserializePizzaSession,
  isPizzaSession,
  migratePizzaSession,
  pizzaSessionContinueHref,
  pizzaSessionRecipeQuery,
  PIZZA_SESSION_SCHEMA_VERSION,
  PIZZA_SESSION_STATUSES,
  PIZZA_SESSION_STEPS,
  serializePizzaSession,
  validatePizzaSession,
} from "@/lib/pizza-session";
import { MemoryStorage } from "./helpers";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Pizza Session data model", () => {
  it("defines schema version, allowed statuses and allowed current steps", () => {
    expect(PIZZA_SESSION_SCHEMA_VERSION).toBe(1);
    expect(PIZZA_SESSION_STATUSES).toEqual(["draft", "planning", "preparing", "baking", "reviewing", "completed", "archived"]);
    expect(PIZZA_SESSION_STEPS).toEqual(["style", "time", "quantity", "oven", "flour", "recipe", "timeline", "shopping", "prep", "bake", "review"]);
  });

  it("creates a valid beginner session by default", () => {
    const session = createPizzaSession({ id: "session-1" }, new Date("2026-06-25T10:00:00.000Z"));

    expect(session).toMatchObject({
      id: "session-1",
      schemaVersion: 1,
      status: "draft",
      currentStep: "style",
      experienceLevel: "beginner",
      yeastType: "ady",
      createdAt: "2026-06-25T10:00:00.000Z",
      updatedAt: "2026-06-25T10:00:00.000Z",
      lastOpenedAt: "2026-06-25T10:00:00.000Z",
      lastSavedAt: "2026-06-25T10:00:00.000Z",
    });
    expect(validatePizzaSession(session)).toBe(true);
    expect(isPizzaSession(session)).toBe(true);
  });

  it("normalizes invalid status, step and experience level safely", () => {
    const session = createPizzaSession({
      id: "session-normalized",
      status: "lost" as never,
      currentStep: "unknown" as never,
      experienceLevel: "advanced" as never,
    });

    expect(session.status).toBe("draft");
    expect(session.currentStep).toBe("style");
    expect(session.experienceLevel).toBe("pizza_nerd");
    expect(session.yeastType).toBe("ady");
  });

  it("normalizes supported Pizza Session yeast types while keeping dry yeast as the default", () => {
    expect(createPizzaSession({ yeastType: "ady" }).yeastType).toBe("ady");
    expect(createPizzaSession({ yeastType: "cy" }).yeastType).toBe("cy");
    expect(createPizzaSession({ yeastType: "idy" }).yeastType).toBe("idy");
    expect(createPizzaSession({ yeastType: "ssd" }).yeastType).toBe("ady");
    expect(createPizzaSession({ yeastType: "unknown" }).yeastType).toBe("ady");
  });

  it("creates a planning session from recipe query parameters without changing query format", () => {
    const session = createSessionFromRecipeParams(
      "?balls=4&ballWeight=270&waste=3&hydration=70&salt=2.8&yeastType=idy&fermentation=48h-cold&oven=gas&flour=caputo-pizzeria&pizzaStyle=contemporary",
      { id: "from-query", experienceLevel: "enthusiast" },
      new Date("2026-06-25T11:00:00.000Z"),
    );

    expect(session.status).toBe("planning");
    expect(session.currentStep).toBe("recipe");
    expect(session.experienceLevel).toBe("enthusiast");
    expect(session.pizzaCount).toBe(4);
    expect(session.doughBallWeight).toBe(270);
    expect(session.yeastType).toBe("idy");
    expect(session.recipeParams).toMatchObject({ balls: "4", hydration: "70", oven: "gas" });
    expect(session.recipeSnapshot).toMatchObject({
      balls: 4,
      ballWeight: 270,
      hydration: 70,
      salt: 2.8,
      waste: 3,
      yeastType: "idy",
      fermentation: "48h-cold",
      flour: "caputo-pizzeria",
      oven: "gas",
      pizzaStyle: "contemporary",
    });
    expect(pizzaSessionRecipeQuery(session)).toContain("balls=4");
    expect(pizzaSessionRecipeQuery(session)).toContain("pizzaStyle=contemporary");
  });

  it("serializes, deserializes and rejects malformed or future-version data safely", () => {
    const session = createPizzaSession({ id: "round-trip" });

    expect(deserializePizzaSession(serializePizzaSession(session))).toEqual(session);
    expect(deserializePizzaSession("{broken")).toBeUndefined();
    expect(migratePizzaSession(undefined)).toBeUndefined();
    expect(migratePizzaSession({ schemaVersion: 1 })).toBeUndefined();
    expect(migratePizzaSession({ ...session, schemaVersion: 2 })).toBeUndefined();
  });

  it("normalizes optional planned fermentation hours as a bounded 24–72h planning choice", () => {
    expect(createPizzaSession({ plannedFermentationHours: 24 }).plannedFermentationHours).toBe(24);
    expect(createPizzaSession({ plannedFermentationHours: 48 }).plannedFermentationHours).toBe(48);
    expect(createPizzaSession({ plannedFermentationHours: 72 }).plannedFermentationHours).toBe(72);
    expect(createPizzaSession({ plannedFermentationHours: 12 }).plannedFermentationHours).toBeUndefined();
    expect(createPizzaSession({ plannedFermentationHours: 96 }).plannedFermentationHours).toBeUndefined();
  });
});

describe("Pizza Session local storage", () => {
  it("uses dedicated local-first storage keys and copy", () => {
    expect(PIZZA_SESSIONS_STORAGE_KEY).toBe("doughtools:pizza-sessions-v1");
    expect(ACTIVE_PIZZA_SESSION_STORAGE_KEY).toBe("doughtools:active-pizza-session-id");
    expect(PIZZA_SESSION_LOCAL_ONLY_COPY).toContain("saved in this browser");
    expect(EXPERIENCE_LEVEL_STORAGE_KEY).toBe("doughtools.experienceLevel");
  });

  it("returns safe defaults for empty, missing window and malformed storage", () => {
    const storage = new MemoryStorage();

    expect(getPizzaSessions(storage)).toEqual([]);
    storage.setItem(PIZZA_SESSIONS_STORAGE_KEY, "{broken");
    expect(getPizzaSessions(storage)).toEqual([]);
    storage.setItem(PIZZA_SESSIONS_STORAGE_KEY, JSON.stringify({ id: "not-array" }));
    expect(getPizzaSessions(storage)).toEqual([]);
    expect(getPizzaSessions()).toEqual([]);
  });

  it("creates, saves and reads sessions without touching saved recipe storage", () => {
    const storage = new MemoryStorage();

    const session = createAndSavePizzaSession({
      id: "stored-session",
      status: "planning",
      currentStep: "recipe",
      experienceLevel: "pizza_nerd",
    }, storage, new Date("2026-06-25T12:00:00.000Z"));

    expect(getPizzaSessions(storage)).toEqual([session]);
    expect(getPizzaSession("stored-session", storage)).toEqual(session);
    expect(storage.getItem("doughtools-saved-recipes-v1")).toBeNull();
  });

  it("updates updatedAt and lastSavedAt while preserving createdAt and id", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({ id: "autosave" }, storage, new Date("2026-06-25T12:00:00.000Z"));

    const updated = updatePizzaSession(
      session.id,
      { notes: "Dough mixed.", currentStep: "timeline" },
      storage,
      new Date("2026-06-25T12:30:00.000Z"),
    );

    expect(updated?.id).toBe(session.id);
    expect(updated?.createdAt).toBe(session.createdAt);
    expect(updated?.updatedAt).toBe("2026-06-25T12:30:00.000Z");
    expect(updated?.lastSavedAt).toBe("2026-06-25T12:30:00.000Z");
    expect(updated?.notes).toBe("Dough mixed.");
    expect(updated?.currentStep).toBe("timeline");
  });

  it("stores, retrieves and clears active session id", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({ id: "active-session", status: "planning" }, storage);

    setActivePizzaSession(session.id, storage);
    expect(storage.getItem(ACTIVE_PIZZA_SESSION_STORAGE_KEY)).toBe(session.id);
    expect(getActivePizzaSession(storage)?.id).toBe(session.id);

    clearActivePizzaSession(storage);
    expect(getActivePizzaSession(storage)).toBeUndefined();
  });

  it("does not treat completed or archived sessions as active", () => {
    const storage = new MemoryStorage();
    const session = createAndSavePizzaSession({ id: "done-soon", status: "planning" }, storage);
    setActivePizzaSession(session.id, storage);

    completePizzaSession(session.id, storage, new Date("2026-06-25T13:00:00.000Z"));
    expect(getActivePizzaSession(storage)).toBeUndefined();
    expect(storage.getItem(ACTIVE_PIZZA_SESSION_STORAGE_KEY)).toBeNull();

    const second = createAndSavePizzaSession({ id: "archive-soon", status: "planning" }, storage);
    setActivePizzaSession(second.id, storage);
    archivePizzaSession(second.id, storage, new Date("2026-06-25T14:00:00.000Z"));
    expect(getActivePizzaSession(storage)).toBeUndefined();
  });

  it("maps Continue Session links to existing routes only", () => {
    const recipeSession = createSessionFromRecipeParams("balls=6&hydration=64", { id: "recipe-link" });
    const timelineSession = createPizzaSession({ id: "timeline-link", currentStep: "timeline", recipeParams: recipeSession.recipeParams });
    const activeTimelineSession = createPizzaSession({
      id: "active-timeline-link",
      currentStep: "timeline",
      timeline: { steps: [{ id: "mix-dough", label: "Mix dough", status: "todo" }] },
    });
    const shoppingSession = createPizzaSession({ id: "shopping-link", currentStep: "shopping", recipeParams: recipeSession.recipeParams });
    const prepSession = createPizzaSession({ id: "prep-link", currentStep: "prep", recipeParams: recipeSession.recipeParams });
    const reviewSession = createPizzaSession({ id: "review-link", currentStep: "review", recipeParams: recipeSession.recipeParams });
    const styleSession = createPizzaSession({ id: "style-link", currentStep: "style" });

    expect(pizzaSessionContinueHref(recipeSession)).toBe("/session/recipe");
    expect(pizzaSessionContinueHref(timelineSession)).toBe("/session/timeline");
    expect(pizzaSessionContinueHref(activeTimelineSession)).toBe("/session/kitchen");
    expect(pizzaSessionContinueHref(shoppingSession)).toBe("/session/shopping");
    expect(pizzaSessionContinueHref(prepSession)).toBe("/session/kitchen");
    expect(pizzaSessionContinueHref(reviewSession)).toBe("/session/review");
    expect(pizzaSessionContinueHref(styleSession)).toBe("/session/start");
  });

  it("documents Pizza Session storage and local-first limitations", () => {
    expect(existsSync(join(process.cwd(), "docs", "pizza-session-data-model.md"))).toBe(true);
    const doc = source("docs/pizza-session-data-model.md");
    const persistence = source("docs/persistence-baseline.md");

    expect(doc).toContain("Patch 31");
    expect(doc).toContain("doughtools:pizza-sessions-v1");
    expect(doc).toContain("doughtools:active-pizza-session-id");
    expect(doc).toContain("uploaded to Supabase");
    expect(doc).toContain("cloud sync");
    expect(doc).toContain("Patch 32 adds the first guided `/session/start` wizard");
    expect(doc).toContain("When `currentStep` is `recipe`, Continue Session resumes at `/session/recipe`.");
    expect(doc).toContain("When `currentStep` is `prep` or `bake`, Continue Session resumes at `/session/kitchen`.");
    expect(doc).toContain("When `currentStep` is `review`, Continue Session resumes at `/session/review`");
    expect(persistence).toContain("Pizza Sessions");
    expect(persistence).toContain("Completed or archived sessions are not treated as the active session");
  });

  it("adds accessible Continue Session UI without fake cloud or wizard claims", () => {
    const component = source("components/ContinuePizzaSessionCard.tsx");
    const homepage = source("app/page.tsx");
    const account = source("app/account/page.tsx");

    expect(component).toContain("\"use client\"");
    expect(component).toContain("getActivePizzaSession");
    expect(component).toContain("if (!ready || !session) return null");
    expect(component).toContain("Continue Pizza Session");
    expect(component).toContain("Cloud sync is not active yet");
    expect(component).toContain("focus-visible:ring");
    expect(homepage).toContain("ContinuePizzaSessionCard");
    expect(account).toContain("Pizza sessions are currently saved in this browser on this device");
    expect([component, homepage, account].join("\n")).not.toMatch(
      /Available on all devices|Backed up in the cloud|Cloud sync is active|Synced across devices|Push notifications enabled/i,
    );
  });
});
