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
  it("documents the canonical Pizza Session V2 journey", () => {
    const docPath = join(process.cwd(), "docs", "pizza-session-v2-journey.md");
    expect(existsSync(docPath)).toBe(true);
    const doc = source("docs/pizza-session-v2-journey.md");

    for (const label of [
      "How you bake",
      "Pizza style",
      "When to eat",
      "How many",
      "Flour",
      "Dough plan",
      "Timeline",
      "Shopping list",
      "Kitchen mode",
      "Review",
    ]) {
      expect(doc).toContain(label);
    }

    expect(doc).toContain("`/session/start`");
    expect(doc).toContain("`/session/recipe`");
    expect(doc).toContain("`/session/timeline`");
    expect(doc).toContain("`/session/shopping`");
    expect(doc).toContain("`/session/kitchen`");
    expect(doc).toContain("`/session/review`");
    expect(doc).toContain("Build my dough plan →");
  });

  it("adds the /session/start route with the expected wizard steps", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "start", "page.tsx"))).toBe(true);
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("\"use client\"");
    expect(page).toContain("How will you bake your pizza?");
    expect(page).toContain("What pizza are you making?");
    expect(page).toContain("When do you want pizza?");
    expect(page).toContain("How many pizzas?");
    expect(page).toContain("What flour do you have?");
    expect(page).toContain("You’re ready for your dough plan.");
    expect(page).toContain("You chose the key setup details. Next, DoughTools turns them into a personalized dough plan and ingredient amounts.");
    expect(page).toContain("Home oven");
    expect(page).toContain("Pizza oven");
    expect(page).toContain("Pan / tray");
    expect(page).not.toContain("Not sure yet");
    expect(page).toContain("grid gap-3 sm:grid-cols-3");
    expect(page).toContain("wizardPresetOptions.map");
    expect(page).toContain("Simple cheese");
    expect(page).toContain("Margherita");
    expect(page).toContain("Pepperoni");
    expect(page).toContain("Veggie");
    expect(page).toContain("Hawaiian");
    expect(page).toContain("Mushroom");
    expect(page).toContain("Meat lovers");
    expect(page).toContain("White pizza");
    expect(page).not.toContain("I’ll decide toppings later");
    expect(source("lib/pizza-session-presets.ts")).toContain("Margherita");
    expect(source("lib/pizza-session-presets.ts")).toContain("Marinara");
    expect(source("lib/pizza-session-presets.ts")).toContain("Diavola");
    expect(source("lib/pizza-session-presets.ts")).toContain("Funghi");
    expect(source("lib/pizza-session-presets.ts")).toContain("Pepperoni / Salami");
    expect(source("lib/pizza-session-presets.ts")).toContain("Simple cheese pizza");
    expect(source("lib/pizza-session-presets.ts")).toContain("Hawaiian");
    expect(source("lib/pizza-session-presets.ts")).toContain("Mushroom");
    expect(source("lib/pizza-session-presets.ts")).toContain("Meat lovers");
    expect(source("lib/pizza-session-presets.ts")).toContain("White pizza");
    expect(page).toContain("Pizza flour / Tipo 00");
    expect(page).toContain("Bread flour / Strong flour");
    expect(page).toContain("All-purpose flour");
    expect(page).not.toContain('label: "Not sure"');
    expect(page).not.toContain("What oven are you using?");
    expect(page).not.toContain("const ovenOptions");
    expect(page).not.toContain('step === "oven" && Boolean(session?.ovenType)');
  });

  it("keeps the setup to the first five V2 choices and routes quantity directly to flour", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('type WizardStep = "path" | "preset" | "time" | "quantity" | "flour" | "summary"');
    expect(page).toContain('const wizardSteps: WizardStep[] = ["path", "preset", "time", "quantity", "flour", "summary"]');
    expect(page).toContain("const journeySteps = [");
    expect(page).toContain("How you bake");
    expect(page).toContain("Pizza style");
    expect(page).toContain("When to eat");
    expect(page).toContain("How many");
    expect(page).toContain("Flour");
    expect(page).toContain("Dough plan");
    expect(page).toContain("Shopping list");
    expect(page).toContain("Kitchen mode");
    expect(page).toContain("Review");
    expect(page).toContain("journeyProgressForStep");
    expect(page).toContain("Setup is steps 1–5 of the full pizza journey.");
    expect(page).toContain("Step ${journeyProgress} of ${journeySteps.length}");
    expect(page.indexOf('"quantity"')).toBeLessThan(page.indexOf('"flour"'));
    expect(page.indexOf('"flour"')).toBeLessThan(page.indexOf('"summary"'));
  });

  it("keeps Step 1, Step 2 and Step 5 option cards mobile-friendly and accessible", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("Home oven");
    expect(page).toContain("Pizza oven");
    expect(page).toContain("Pan / tray");
    expect(page).not.toContain("Not sure yet");
    expect(page).toContain("grid gap-3 sm:grid-cols-3");
    expect(page).toContain("Simple cheese");
    expect(page).toContain("Margherita");
    expect(page).toContain("Pepperoni");
    expect(page).toContain("Veggie");
    expect(page).toContain("Hawaiian");
    expect(page).toContain("Mushroom");
    expect(page).toContain("Meat lovers");
    expect(page).toContain("White pizza");
    expect(page).not.toContain("I’ll decide toppings later");
    expect(page).toContain("Pizza flour / Tipo 00");
    expect(page).toContain("Bread flour / Strong flour");
    expect(page).toContain("All-purpose flour");
    expect(page).not.toContain('label: "Not sure"');
    expect(page).toContain("grid min-h-[4rem] grid-cols-[auto_1fr] items-start gap-2.5");
    expect(page).toContain("sm:block sm:min-h-[7rem]");
    expect(page).toContain("grid h-8 w-8 shrink-0");
    expect(page).toContain("sm:h-11 sm:w-11");
    expect(page).toContain('className={optionClass(session.pizzaPreset === preset.id, "compact")}');
    expect(page).toContain("grid grid-cols-2 gap-2.5 lg:grid-cols-4");
    expect(page).toContain("min-h-[6.75rem]");
    expect(page).toContain("mb-2 grid h-8 w-8 shrink-0");
    expect(page).toContain("col-start-2 block pr-8");
    expect(page).toContain("aria-pressed={session.pizzaStyle === option.id}");
    expect(page).toContain("aria-pressed={session.pizzaPreset === preset.id}");
    expect(page).toContain("aria-pressed={session.flour === option.id}");
    expect(page).toContain("step === \"preset\" && Boolean(session?.pizzaPreset)");
    expect(page).toContain("step === \"flour\" && Boolean(session?.flour)");
    expect(page).toContain("disabled={!canContinue}");
    expect(page).not.toContain("className={`${optionClass(session.flour === option.id)} flex min-h-24 items-center gap-4`}");
  });

  it("prevents duplicate guidance and mobile step indicators on the session start page", () => {
    const page = source("app/session/start/page.tsx");
    const journeyProgressUses = page.match(/Step \$\{journeyProgress\} of \$\{journeySteps.length\}/g) ?? [];

    expect(journeyProgressUses).toHaveLength(1);
    expect(page).toContain('<aside className="hidden rounded-[1.75rem]');
    expect(page).toContain('<div className="mb-3 lg:hidden">');
    expect(page).toContain('aria-label="Pizza Session journey"');
    expect(page).toContain('aria-label="Pizza Session setup progress"');
    expect(page).toContain("setup complete. Dough plan next.");
    expect(page).not.toContain("GuidanceModeBadge");
    expect(page).not.toContain("Guidance mode:");
    expect(page).not.toContain("Pizza Session V2");
    expect(page).not.toContain("{experience.marker} Guidance mode: {experience.label}");
    expect(page).not.toContain("sm:inline-flex ${experience.badgeClassName}");
    expect(page).not.toContain('<p className="hidden text-xs font-extrabold uppercase tracking-[.2em] text-tomato lg:block">Step {progress} of {wizardSteps.length}</p>');
    expect(page).not.toContain('<footer className="hidden opacity-70 lg:col-span-2 lg:block">');
  });

  it("maps old saved sessions from the removed oven step safely to flour", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('if (session.currentStep === "oven") return "flour";');
    expect(page).toContain("const ovenType = value === \"pizza-oven\" ? \"gas\" : value === \"pan-tray\" ? \"pan\" : \"home\";");
    expect(page).toContain("savePatch({ pizzaStyle: value, ovenType, pizzaCount }, \"path\")");
  });

  it("maps old removed oven fallback choices to Home oven safely", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('nextSession.pizzaStyle === "not-sure"');
    expect(page).toContain('pizzaStyle: "home-oven"');
    expect(page).toContain('ovenType: "home"');
    expect(page).not.toContain('label: "Not sure yet"');
  });

  it("maps old removed flour fallback choices to Tipo 00 safely", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('nextSession.flour === "not-sure"');
    expect(page).toContain('flour: "tipo-00"');
    expect(page).not.toContain('label: "Not sure"');
    expect(page).toContain('step === "flour" && Boolean(session?.flour)');
  });

  it("keeps the final guided step focused on one primary next action", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("You’re ready for your dough plan.");
    expect(page).toContain("You chose the key setup details. Next, DoughTools turns them into a personalized dough plan and ingredient amounts.");
    expect(page).toContain("Build my dough plan →");
    expect(page).toContain('href="/session/recipe"');
    expect(page).not.toContain("Save and continue later");
    expect(page.match(/Build my dough plan →/g)).toHaveLength(1);
    expect(page).toContain("Back");
    expect(page).toContain("Saved locally ✓");
    expect(page.indexOf("Build my dough plan →")).toBeLessThan(page.indexOf("Saved locally ✓"));
    expect(page).not.toContain("Next: build your dough plan");
    expect(page).not.toContain("Last saved:");
    expect(page).not.toContain("Open timeline →");
    expect(page).not.toContain("Shopping list →");
    expect(page).not.toContain("Back to DoughTools");
    expect(page).not.toContain("Kitchen Mode");
    expect(page).not.toContain("Open full Calculator");
    expect(page).not.toContain("Open Dough Doctor");
    expect(page).not.toContain("[\"Oven\"");
  });

  it("shows setup summary choices as five compact cards", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("const setupSummaryCards = [");
    expect(page).toContain('label: "Bake"');
    expect(page).toContain('label: "Style"');
    expect(page).toContain('label: "When"');
    expect(page).toContain('label: "How many"');
    expect(page).toContain('label: "Flour"');
    expect(page).toContain("grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5");
    expect(page).not.toContain("[\"How you bake\"");
    expect(page).not.toContain("[\"Pizza style\"");
    expect(page).not.toContain("flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-3.5");
  });

  it("formats the final target time for people instead of showing raw ISO text", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("function formatTargetTime");
    expect(page).toContain("function formatTargetDate");
    expect(page).toContain("function formatTargetClockTime");
    expect(page).toContain("function formatSetupSummaryTime");
    expect(page).toContain("date.getFullYear() !== new Date().getFullYear()");
    expect(page).toContain("return `${dateText} · ${timeText}`");
    expect(page).toContain("weekday: \"short\"");
    expect(page).toContain("month: \"short\"");
    expect(page).toContain("hour: \"2-digit\"");
    expect(page).toContain("value: formatSetupSummaryTime(session.targetEatTime)");
    expect(page).not.toContain("[\"Target time\", session.targetEatTime || \"Not set yet\"]");
  });

  it("shows target pizza time as a compact time-step summary instead of a full-width bar", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('step === "time" && targetTimeDraft');
    expect(page).toContain("Target pizza time</p>");
    expect(page).toContain("{formatTargetDate(targetTimeDraft)}");
    expect(page).toContain("{formatTargetClockTime(targetTimeDraft)}");
    expect(page).toContain("sm:w-auto sm:min-w-48 sm:text-right");
    expect(page).not.toContain("Target pizza time: {formatTargetTime(targetTimeDraft)}");
    expect(page).not.toContain("rounded-2xl bg-leaf/[.08] px-4 py-3 text-sm font-bold text-leaf");
  });

  it("uses Patch 31 local storage helpers for creation, active id and autosave", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("getActivePizzaSession");
    expect(page).toContain("createAndSavePizzaSession");
    expect(page).toContain("setActivePizzaSession");
    expect(page).toContain("updatePizzaSession");
    expect(page).toContain("status: \"planning\"");
    expect(page).toContain("currentStep");
    expect(page).toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
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
    expect(page).toContain("value: formatSetupSummaryTime(session.targetEatTime)");
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

  it("resets the session viewport after Continue or Back changes steps", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("SessionViewportReset");
    expect(page).toContain("<SessionViewportReset watchKey={step} />");
    expect(page).not.toContain("scrollIntoView");
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
    expect(page).toContain("getExperienceLevelCornerAccentStyle");
    expect(page).toContain("const levelMainAccent = getExperienceLevelCornerAccentStyle(experienceLevel)");
    expect(levels).toContain("Beginner");
    expect(levels).toContain("Enthusiast");
    expect(levels).toContain("Pizza Nerd");
    expect(levels).toContain("rgba(58, 163, 106");
    expect(levels).toContain("rgba(242, 161, 95");
    expect(levels).toContain("rgba(235, 87, 127");
    expect(page).not.toMatch(/Home Pizza Maker|intermediate|advanced/);
  });

  it("keeps the global brand in the header without duplicating it inside the desktop session sidebar", () => {
    const page = source("app/session/start/page.tsx");
    const headerLogoIndex = page.indexOf('aria-label="DoughTools home"');
    const sidebarIndex = page.indexOf("<aside");

    expect(headerLogoIndex).toBeGreaterThan(-1);
    expect(sidebarIndex).toBeGreaterThan(-1);
    expect(page.indexOf('aria-label="DoughTools home"', sidebarIndex)).toBe(-1);
    expect(page).toContain('<h1 className="font-display text-3xl font-semibold leading-none">Set up your pizza session.</h1>');
    expect(page).not.toContain('<p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza Session V2</p>');
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

    expect(page).toContain("aria-label=\"Pizza Session setup progress\"");
    expect(page).toContain("Current journey step:");
    expect(page).toContain("Completed journey step:");
    expect(page).toContain("Upcoming journey step:");
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
