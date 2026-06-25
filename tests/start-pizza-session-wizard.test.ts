import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { homepageContent } from "@/lib/homepage";
import {
  ACTIVE_PIZZA_SESSION_STORAGE_KEY,
  createAndSavePizzaSession,
  getActivePizzaSession,
  getPizzaSession,
  PIZZA_SESSIONS_STORAGE_KEY,
  setActivePizzaSession,
  updatePizzaSession,
} from "@/lib/pizza-session-storage";
import { EXPERIENCE_LEVEL_STORAGE_KEY } from "@/lib/experience-levels";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

class MemoryStorage {
  store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

describe("Start Pizza Session wizard", () => {
  it("adds the /session/start route with the expected wizard steps", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "start", "page.tsx"))).toBe(true);
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("\"use client\"");
    expect(page).toContain("What pizza do you want to make?");
    expect(page).toContain("When do you want to eat or bake?");
    expect(page).toContain("How many pizzas?");
    expect(page).toContain("What oven are you using?");
    expect(page).toContain("What flour do you have?");
    expect(page).toContain("Your Pizza Session is ready.");
    expect(page).toContain("Home oven pizza");
    expect(page).toContain("Pizza oven pizza");
    expect(page).toContain("Pan / tray pizza");
    expect(page).toContain("All-purpose / plain flour");
    expect(page).toContain("Bread flour / strong flour");
    expect(page).toContain("Pizza flour / tipo 00");
  });

  it("uses Patch 31 local storage helpers for creation, active id and autosave", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("getActivePizzaSession");
    expect(page).toContain("createAndSavePizzaSession");
    expect(page).toContain("setActivePizzaSession");
    expect(page).toContain("updatePizzaSession");
    expect(page).toContain("status: \"planning\"");
    expect(page).toContain("currentStep");
    expect(page).toContain("lastSavedAt");
    expect(page).toContain("recipeParams");
  });

  it("persists wizard-like session choices locally and updates the active session", () => {
    const storage = new MemoryStorage();
    const started = createAndSavePizzaSession(
      { id: "wizard-session", status: "planning", currentStep: "style", experienceLevel: "beginner" },
      storage,
      new Date("2026-06-25T10:00:00.000Z"),
    );
    setActivePizzaSession(started.id, storage);

    const updated = updatePizzaSession(
      started.id,
      {
        pizzaStyle: "pizza-oven",
        targetEatTime: "2026-06-27T18:30",
        pizzaCount: 6,
        ovenType: "gas",
        flour: "tipo-00",
        currentStep: "recipe",
        recipeParams: { balls: 6, oven: "gas", flour: "caputo-pizzeria" },
      },
      storage,
      new Date("2026-06-25T10:05:00.000Z"),
    );

    expect(updated).toBeDefined();
    expect(storage.getItem(PIZZA_SESSIONS_STORAGE_KEY)).toContain("pizza-oven");
    expect(storage.getItem(ACTIVE_PIZZA_SESSION_STORAGE_KEY)).toBe(started.id);
    expect(getActivePizzaSession(storage)?.id).toBe(started.id);
    expect(getPizzaSession(started.id, storage)).toMatchObject({
      pizzaStyle: "pizza-oven",
      targetEatTime: "2026-06-27T18:30",
      pizzaCount: 6,
      ovenType: "gas",
      flour: "tipo-00",
      currentStep: "recipe",
    });
    expect(updated?.updatedAt).not.toBe(started.updatedAt);
    expect(updated?.lastSavedAt).not.toBe(started.lastSavedAt);
  });

  it("connects the homepage and Start Here page to the wizard without removing /start", () => {
    const startPage = source("app/start/page.tsx");
    const homepage = source("lib/homepage.ts");

    expect(homepageContent.hero.startHereCta).toEqual({ label: "Start Pizza Session", href: "/session/start" });
    expect(homepageContent.coreTools.some((tool) => tool.name === "Start Pizza Session" && tool.href === "/session/start")).toBe(true);
    expect(homepageContent.coreTools.some((tool) => tool.name === "Start Here" && tool.href === "/start")).toBe(true);
    expect(startPage).toContain("Start Pizza Session");
    expect(startPage).toContain("href=\"/session/start\"");
  });

  it("keeps one shared wizard with Beginner, Enthusiast and Pizza Nerd guidance", () => {
    const page = source("app/session/start/page.tsx");
    const levels = source("lib/experience-levels.ts");

    expect(EXPERIENCE_LEVEL_STORAGE_KEY).toBe("doughtools.experienceLevel");
    expect(page).toContain("beginner");
    expect(page).toContain("enthusiast");
    expect(page).toContain("pizza_nerd");
    expect(page).toContain("GuidanceModeBadge");
    expect(levels).toContain("Beginner");
    expect(levels).toContain("Enthusiast");
    expect(levels).toContain("Pizza Nerd");
    expect(page).not.toMatch(/Home Pizza Maker|intermediate|advanced/);
  });

  it("is honest about local-first behavior and avoids unavailable claims", () => {
    const page = source("app/session/start/page.tsx");
    const doc = source("docs/start-pizza-session-wizard.md");
    const dataDoc = source("docs/pizza-session-data-model.md");
    const combined = [page, doc, dataDoc].join("\n");

    expect(combined).toMatch(/Pizza [Ss]essions are currently saved in this browser on this device/);
    expect(combined).toContain("Cloud sync is not active yet");
    expect(doc).toContain("/session/start");
    expect(doc).toContain("doughtools:pizza-sessions-v1");
    expect(doc).toContain("doughtools:active-pizza-session-id");
    expect(doc).toContain("full fermentation timeline generation");
    expect(doc).toContain("shopping list generation");
    expect(doc).toContain("kitchen mode");
    expect(combined).not.toMatch(/Synced across devices|Backed up in the cloud now|Push notifications enabled|Email reminders enabled|Google indexing enabled/i);
    expect(combined).not.toMatch(/analytics enabled|tracking enabled|analytics added|tracking added/i);
  });

  it("keeps accessibility markers and keyboard-friendly controls visible in source", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("aria-label=\"Pizza Session progress\"");
    expect(page).toContain("Current step:");
    expect(page).toContain("Completed step:");
    expect(page).toContain("Upcoming step:");
    expect(page).toContain("aria-pressed");
    expect(page).toContain("aria-label=\"Decrease pizza count\"");
    expect(page).toContain("aria-label=\"Increase pizza count\"");
    expect(page).toContain("focus-visible:ring");
    expect(page).toContain("Back");
    expect(page).toContain("Continue");
  });

  it("adds Patch 32 to the public update history", () => {
    const changelog = source("lib/changelog.ts");

    expect(changelog).toContain("Start Pizza Session wizard");
    expect(changelog).toContain("Style, time, quantity, oven and flour decisions saved locally");
    expect(changelog).toContain("Progress is autosaved to the active browser session");
    expect(changelog).toContain("No cloud sync, reminders, tracking or indexing behavior added");
  });
});
