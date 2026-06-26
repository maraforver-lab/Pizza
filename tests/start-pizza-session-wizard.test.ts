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
import {
  buildPizzaSessionTargetTime,
  getDefaultPizzaSessionTargetTime,
  getPizzaSessionDayQuickChoices,
  pizzaSessionTimeQuickChoices,
} from "@/lib/session-time-quick-choices";

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
    expect(page).toContain("How will you bake your pizza?");
    expect(page).toContain("What kind of pizza are you making?");
    expect(page).toContain("When do you want pizza?");
    expect(page).toContain("How many pizzas?");
    expect(page).toContain("What flour do you have?");
    expect(page).toContain("Your starting setup is ready.");
    expect(page).toContain("Home oven");
    expect(page).toContain("Pizza oven");
    expect(page).toContain("Pan / tray bake");
    expect(page).toContain("Not sure yet");
    expect(page).toContain("wizardPresetOptions.map");
    expect(page).toContain("Simple cheese");
    expect(page).toContain("Margherita");
    expect(page).toContain("Pepperoni");
    expect(page).toContain("Veggie");
    expect(page).toContain("I’ll decide toppings later");
    expect(source("lib/pizza-session-presets.ts")).toContain("Margherita");
    expect(source("lib/pizza-session-presets.ts")).toContain("Marinara");
    expect(source("lib/pizza-session-presets.ts")).toContain("Diavola");
    expect(source("lib/pizza-session-presets.ts")).toContain("Funghi");
    expect(source("lib/pizza-session-presets.ts")).toContain("Pepperoni / Salami");
    expect(source("lib/pizza-session-presets.ts")).toContain("Simple cheese pizza");
    expect(page).toContain("Pizza flour / Tipo 00");
    expect(page).toContain("Bread flour / Strong flour");
    expect(page).toContain("All-purpose flour");
    expect(page).not.toContain("What oven are you using?");
    expect(page).not.toContain("const ovenOptions");
    expect(page).not.toContain('step === "oven" && Boolean(session?.ovenType)');
  });

  it("keeps the wizard to six beginner-friendly steps and routes quantity directly to flour", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('type WizardStep = "path" | "preset" | "time" | "quantity" | "flour" | "summary"');
    expect(page).toContain('const wizardSteps: WizardStep[] = ["path", "preset", "time", "quantity", "flour", "summary"]');
    expect(page).toContain("Baking path");
    expect(page).toContain("Pizza style");
    expect(page).toContain("When");
    expect(page).toContain("How many");
    expect(page).toContain("Flour");
    expect(page).toContain("Your plan");
    expect(page).toContain("Step {progress} of {wizardSteps.length}");
    expect(page.indexOf('"quantity"')).toBeLessThan(page.indexOf('"flour"'));
    expect(page.indexOf('"flour"')).toBeLessThan(page.indexOf('"summary"'));
  });

  it("prevents duplicate guidance and mobile step indicators on the session start page", () => {
    const page = source("app/session/start/page.tsx");
    const guidanceBadgeUses = page.match(/<GuidanceModeBadge level=\{experienceLevel\} \/>/g) ?? [];

    expect(guidanceBadgeUses).toHaveLength(2);
    expect(page).toContain('<aside className="hidden rounded-[2rem]');
    expect(page).toContain('<div className="mb-6 lg:hidden">');
    expect(page).not.toContain("{experience.marker} Guidance mode: {experience.label}");
    expect(page).not.toContain("sm:inline-flex ${experience.badgeClassName}");
    expect(page).toContain('<p className="hidden text-xs font-extrabold uppercase tracking-[.2em] text-tomato lg:block">Step {progress} of {wizardSteps.length}</p>');
  });

  it("maps old saved sessions from the removed oven step safely to flour", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('if (session.currentStep === "oven") return "flour";');
    expect(page).toContain("const ovenType = value === \"pizza-oven\" ? \"gas\" : value === \"pan-tray\" ? \"pan\" : \"home\";");
    expect(page).toContain("savePatch({ pizzaStyle: value, ovenType, pizzaCount }, \"path\")");
  });

  it("keeps the final guided step focused on one primary next action", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("Next: build your dough plan");
    expect(page).toContain("We’ll calculate the dough amount, flour, water, salt, yeast and timing from your choices.");
    expect(page).toContain("Build my dough plan →");
    expect(page).toContain("Save and continue later");
    expect(page).not.toContain("Open timeline →");
    expect(page).not.toContain("Shopping list →");
    expect(page).not.toContain("Back to DoughTools");
    expect(page).not.toContain("Kitchen Mode");
    expect(page).not.toContain("Open full Calculator");
    expect(page).not.toContain("Open Dough Doctor");
    expect(page).not.toContain("[\"Oven\"");
  });

  it("formats the final target time for people instead of showing raw ISO text", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("function formatTargetTime");
    expect(page).toContain("weekday: \"short\"");
    expect(page).toContain("month: \"short\"");
    expect(page).toContain("hour: \"2-digit\"");
    expect(page).toContain("[\"When\", formatTargetTime(session.targetEatTime)]");
    expect(page).not.toContain("[\"Target time\", session.targetEatTime || \"Not set yet\"]");
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
    expect(page).toContain("pizzaSessionContinueHref");
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
        pizzaPreset: "diavola",
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
      pizzaPreset: "diavola",
      currentStep: "recipe",
    });
    expect(updated?.updatedAt).not.toBe(started.updatedAt);
    expect(updated?.lastSavedAt).not.toBe(started.lastSavedAt);
  });

  it("captures the current target time input before leaving the time step", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("useRef<HTMLInputElement>");
    expect(page).toContain("const targetTimeInputRef");
    expect(page).toContain("const [targetTimeDraft, setTargetTimeDraft]");
    expect(page).toContain("ref={targetTimeInputRef}");
    expect(page).toContain("setTargetTimeDraft(targetEatTime)");
    expect(page).toContain("onInput={(event) => setTargetTime(event.currentTarget.value)}");
    expect(page).toContain("const targetEatTime = step === \"time\" ? targetTimeDraft || targetTimeInputRef.current?.value || session?.targetEatTime : session?.targetEatTime");
    expect(page).toContain("step === \"time\" && Boolean(targetTimeDraft || session?.targetEatTime)");
    expect(page).toContain("targetEatTime,");
    expect(page).toContain("[\"When\", formatTargetTime(session.targetEatTime)]");
    expect(page).toContain("DoughTools will build your dough, preparation and bake timeline backwards from this.");
    expect(page).not.toContain("Later planner patches can turn this into a full timeline");
  });

  it("defaults new sessions without a target time to tomorrow dinner without overwriting saved targets", () => {
    const page = source("app/session/start/page.tsx");

    expect(getDefaultPizzaSessionTargetTime(new Date("2026-06-26T10:00:00"))).toBe("2026-06-27T18:00");
    expect(page).toContain("function isValidTargetTime");
    expect(page).toContain("const hasSavedTargetTime = isValidTargetTime(baseSession.targetEatTime)");
    expect(page).toContain("const defaultTargetEatTime = getDefaultPizzaSessionTargetTime()");
    expect(page).toContain("targetEatTime: defaultTargetEatTime");
    expect(page).toContain('setSelectedDayChoice("tomorrow")');
    expect(page).toContain('setSelectedTimeChoice("dinner")');
    expect(page).toContain('setSelectedDayChoice("custom-date")');
    expect(page).toContain('setSelectedTimeChoice("custom-time")');
    expect(page).toContain("step === \"time\" && Boolean(targetTimeDraft || session?.targetEatTime)");
  });

  it("scrolls the current decision panel into view after Continue or Back changes steps", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("const stepPanelRef = useRef<HTMLElement>(null)");
    expect(page).toContain("const didRenderInitialStepRef = useRef(false)");
    expect(page).toContain("stepPanelRef.current?.scrollIntoView");
    expect(page).toContain("prefers-reduced-motion: reduce");
    expect(page).toContain("behavior: prefersReducedMotion ? \"auto\" : \"smooth\"");
    expect(page).toContain("}, [ready, step]);");
    expect(page).toContain("ref={stepPanelRef}");
  });

  it("offers quick day and time choices before the custom date/time input", () => {
    const page = source("app/session/start/page.tsx");
    const choices = getPizzaSessionDayQuickChoices(new Date("2026-06-26T10:00:00"));

    expect(choices.map((choice) => choice.label)).toEqual([
      "Today",
      "Tomorrow",
      "Sunday",
      "Monday",
      "Custom date",
    ]);
    expect(pizzaSessionTimeQuickChoices.map((choice) => choice.label)).toEqual([
      "Lunch",
      "Afternoon",
      "Dinner",
      "Evening",
      "Custom time",
    ]);
    expect(page).toContain("getPizzaSessionDayQuickChoices");
    expect(page).toContain("pizzaSessionTimeQuickChoices.map");
    expect(page).toContain("Custom target date and time");
    expect(page).not.toContain("Next Friday");
    expect(page).not.toContain("Next Saturday");
    expect(page).not.toContain("Next Sunday");
  });

  it("uses rolling local calendar days instead of fixed next weekday choices", () => {
    const fridayChoices = getPizzaSessionDayQuickChoices(new Date("2026-06-26T10:00:00"));

    expect(fridayChoices.map((choice) => choice.date)).toEqual([
      "2026-06-26",
      "2026-06-27",
      "2026-06-28",
      "2026-06-29",
      undefined,
    ]);
    expect(fridayChoices.map((choice) => choice.label)).toEqual(["Today", "Tomorrow", "Sunday", "Monday", "Custom date"]);
  });

  it("builds the same target datetime value from quick day and time choices", () => {
    expect(buildPizzaSessionTargetTime("tomorrow", "dinner", new Date("2026-06-25T10:00:00"))).toBe("2026-06-26T18:00");
    expect(buildPizzaSessionTargetTime("day-after-tomorrow", "lunch", new Date("2026-06-25T10:00:00"))).toBe("2026-06-27T12:00");
    expect(buildPizzaSessionTargetTime("custom-date", "dinner", new Date("2026-06-25T10:00:00"))).toBe("");
    expect(buildPizzaSessionTargetTime("tomorrow", "custom-time", new Date("2026-06-25T10:00:00"))).toBe("");
  });

  it("connects the homepage and Start Here page to the wizard without removing /start", () => {
    const startPage = source("app/start/page.tsx");
    const homepage = source("lib/homepage.ts");

    expect(homepageContent.hero.primaryCta).toEqual({ label: "Start Pizza Session", href: "/session/start" });
    expect(homepage).toContain("Start Pizza Session");
    expect(homepage).toContain("/session/start");
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
    expect(combined).toMatch(/No cloud sync|Cloud sync is not active yet/);
    expect(doc).toContain("/session/start");
    expect(doc).toContain("doughtools:pizza-sessions-v1");
    expect(doc).toContain("doughtools:active-pizza-session-id");
    expect(doc).toContain("/session/recipe");
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
    expect(page).toContain("disabled={!canContinue}");
    expect(page).toContain("aria-label=\"Decrease pizza count\"");
    expect(page).toContain("aria-label=\"Increase pizza count\"");
    expect(page).toContain("focus-visible:ring");
    expect(page).toContain("Back");
    expect(page).toContain("Continue");
  });

  it("adds Patch 32 to the public update history", () => {
    const changelog = source("lib/changelog.ts");

    expect(changelog).toContain("Session recipe build step");
    expect(changelog).toContain("Wizard copy clarified for baking path and pizza preset choices");
    expect(changelog).toContain("Progress is autosaved to the active browser session");
    expect(changelog).toContain("No cloud sync, reminders, tracking or indexing behavior added");
  });
});
