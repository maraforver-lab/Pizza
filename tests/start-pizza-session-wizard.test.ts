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
import { createPizzaSession } from "@/lib/pizza-session";
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
      "Oven",
      "Pizza style",
      "When",
      "Quantity",
      "Flour situation",
      "Dough Plan",
      "Choose pizzas & Shopping",
      "Timeline",
      "Kitchen Mode",
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
    expect(doc).toContain("Create my pizza plan");
  });

  it("adds the /session/start route with the expected wizard steps", () => {
    expect(existsSync(join(process.cwd(), "app", "session", "start", "page.tsx"))).toBe(true);
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("\"use client\"");
    expect(page).toContain("Choose your oven");
    expect(page).toContain("Choose your pizza style");
    expect(page).toContain("DoughTools currently plans Neapolitan-style pizza for home ovens and pizza ovens. Toppings are chosen later for the shopping list.");
    expect(page).toContain("Neapolitan-style");
    expect(page).not.toContain("What pizza are you making?");
    expect(page).not.toContain("Pick the pizza style you want to make.");
    expect(page).not.toContain("Choose your topping plan");
    expect(page).toContain("When do you want pizza?");
    expect(page).toContain("When can you start the dough?");
    expect(page).toContain("Start now");
    expect(page).toContain("Later");
    expect(page).toContain("Let DoughTools recommend");
    expect(page).toContain("This helps DoughTools calculate the real fermentation window later.");
    expect(page).toContain("How many pizzas?");
    expect(page).toContain("Dough ball size");
    expect(page).toContain("This controls how much dough each pizza uses.");
    expect(page).toContain("Yeast type");
    expect(page).toContain("Choose the yeast you will use. This affects the yeast amount.");
    expect(page).toContain("normalizeSessionYeastType(session?.yeastType)");
    expect(page).toContain("savePatch({ yeastType: normalizeSessionYeastType(yeastType) }, \"quantity\")");
    const yeastTypes = source("lib/yeast-types.ts");
    expect(yeastTypes).toContain('DEFAULT_SESSION_YEAST_TYPE: YeastType = "ady"');
    expect(yeastTypes).toContain("Dry yeast");
    expect(yeastTypes).toContain("Fresh yeast");
    expect(yeastTypes).toContain("Instant dry yeast");
    expect(yeastTypes).toContain("Default for most home bakers");
    expect(yeastTypes).toContain("Use if you bake with refrigerated fresh yeast");
    expect(yeastTypes).toContain("Stronger dry yeast, usually used in smaller amounts");
    expect(page).toContain("const DOUGH_BALL_WEIGHT_OPTIONS = [220, 240, 260, 280, 300] as const");
    expect(page).toContain("const doughBallWeightGuidance");
    expect(page).toContain("{weight} g");
    expect(page).toContain("About 30–32 cm");
    expect(page).toContain("Most popular");
    expect(page).toContain("Custom grams per dough ball");
    expect(page).toContain("Use {MIN_DOUGH_BALL_WEIGHT}–{MAX_DOUGH_BALL_WEIGHT} g for round pizzas.");
    expect(page).toContain("mx-auto grid max-w-4xl gap-4 sm:gap-5");
    expect(page).not.toContain("lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]");
    expect(page).toContain("Do you already have flour?");
    expect(page).toContain("DoughTools can recommend what to buy, or use the W-value range of the flour you already have.");
    expect(page).toContain("You’re ready for your Dough Plan.");
    expect(page).toContain("You chose the key setup details. Next, DoughTools turns them into a personalized Dough Plan and ingredient amounts.");
    expect(page).toContain("Home oven");
    expect(page).toContain("Pizza oven");
    expect(page).not.toContain('id: "pan-tray",');
    expect(page).not.toContain("Not sure yet");
    expect(page).toContain("grid gap-3 sm:grid-cols-2");
    expect(page).not.toContain("wizardPresetOptions.map");
    expect(page).not.toContain("Simple cheese");
    expect(page).not.toContain("Margherita");
    expect(page).not.toContain("Pepperoni");
    expect(page).not.toContain("Veggie");
    expect(page).not.toContain("Hawaiian");
    expect(page).not.toContain("Mushroom");
    expect(page).not.toContain("Meat lovers");
    expect(page).not.toContain("White pizza");
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
    expect(page).toContain("No, recommend what to buy");
    expect(page).not.toContain("I don’t know the W-value");
    expect(page).toContain("W 180–220");
    expect(page).toContain("W 220–260");
    expect(page).toContain("W 260–300");
    expect(page).toContain("W 300–340");
    expect(page).toContain("W 340+");
    expect(page).not.toContain('label: "Not sure"');
    expect(page).toContain("sm:grid-cols-2 lg:grid-cols-3");
    expect(page).not.toContain("What oven are you using?");
    expect(page).not.toContain("const ovenOptions");
    expect(page).not.toContain('step === "oven" && Boolean(session?.ovenType)');
  });

  it("shows dough ball size and yeast type controls only for Pizza Nerd users", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("function shouldShowPizzaNerdDoughControls(level: ExperienceLevel)");
    expect(page).toContain("return level === \"pizza_nerd\"");
    expect(page).toContain("const showPizzaNerdDoughControls = shouldShowPizzaNerdDoughControls(experienceLevel)");
    expect(page).toContain("{showPizzaNerdDoughControls && (");
    expect(page).toContain("Dough ball size");
    expect(page).toContain("Custom grams per dough ball");
    expect(page).toContain("Yeast type");
    expect(page).toContain("sessionYeastTypeOptions.map");
  });

  it("uses simple dough and yeast defaults for Beginner and Enthusiast sessions", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("const SIMPLE_SESSION_DOUGH_BALL_WEIGHT = 260");
    expect(page).toContain("function simpleDoughDefaultsPatchForLevel(level: ExperienceLevel, session: PizzaSession): PizzaSessionPatch");
    expect(page).toContain("if (shouldShowPizzaNerdDoughControls(level)) return {}");
    expect(page).toContain("doughBallWeight: SIMPLE_SESSION_DOUGH_BALL_WEIGHT");
    expect(page).toContain("yeastType: DEFAULT_SESSION_YEAST_TYPE");
    expect(page).toContain("const simpleDefaultsPatch = simpleDoughDefaultsPatchForLevel(sessionLevel, supportedSession)");
    expect(page).toContain("setCustomDoughBallWeightDraft(String(effectiveDoughBallWeight(experienceScopedSession)))");
    expect(source("lib/yeast-types.ts")).toContain('DEFAULT_SESSION_YEAST_TYPE: YeastType = "ady"');
  });

  it("keeps the setup to the first five V2 choices and routes quantity directly to flour", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('type WizardStep = "path" | "preset" | "time" | "quantity" | "flour" | "summary"');
    expect(page).toContain('const wizardSteps: WizardStep[] = ["path", "preset", "time", "quantity", "flour", "summary"]');
    expect(page).toContain("const journeySteps = [");
    expect(page).toContain("Oven");
    expect(page).toContain("Pizza style");
    expect(page).not.toContain('label: "Topping plan"');
    expect(page).toContain("When");
    expect(page).toContain("Quantity");
    expect(page).toContain("Flour situation");
    expect(page).toContain("Dough Plan");
    expect(page).toContain("Choose pizzas & Shopping");
    expect(page).toContain("Kitchen Mode");
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
    expect(page.indexOf('label: "Pizza oven"')).toBeLessThan(page.indexOf('label: "Home oven"'));
    expect(page).not.toContain('id: "pan-tray",');
    expect(page).not.toContain("Not sure yet");
    expect(page).toContain("grid gap-3 sm:grid-cols-2");
    expect(page).toContain("Neapolitan-style");
    expect(page).toContain("Toppings come later.");
    expect(page).not.toContain("Simple cheese");
    expect(page).not.toContain("Margherita");
    expect(page).not.toContain("Pepperoni");
    expect(page).not.toContain("Veggie");
    expect(page).not.toContain("Hawaiian");
    expect(page).not.toContain("Mushroom");
    expect(page).not.toContain("Meat lovers");
    expect(page).not.toContain("White pizza");
    expect(page).not.toContain("I’ll decide toppings later");
    expect(page).toContain("No, recommend what to buy");
    expect(page).not.toContain("I don’t know the W-value");
    expect(page).toContain("W 180–220");
    expect(page).toContain("W 220–260");
    expect(page).toContain("W 260–300");
    expect(page).toContain("W 300–340");
    expect(page).toContain("W 340+");
    expect(page).not.toContain('label: "Not sure"');
    expect(page).toContain("grid min-h-[4rem] grid-cols-[auto_1fr] items-start gap-2.5");
    expect(page).toContain("sm:block sm:min-h-[7rem]");
    expect(page).toContain("grid h-8 w-8 shrink-0");
    expect(page).toContain("sm:h-11 sm:w-11");
    expect(page).toContain("const selectDoughStyle");
    expect(page).toContain("DEFAULT_SESSION_TOPPING_PRESET");
    expect(page).toContain("doughStyleOptions.map");
    expect(page).toContain("className={optionClass(hasSelectedDoughStyle)}");
    expect(page).toContain("col-start-2 block pr-8");
    expect(page).toContain("aria-pressed={session.pizzaStyle === option.id}");
    expect(page).toContain("aria-pressed={hasSelectedDoughStyle}");
    expect(page).toContain("aria-pressed={session.flourSituation === option.id}");
    expect(page).toContain("aria-pressed={active}");
    expect(page).toContain("toggleFlourWRange");
    expect(page).toContain("availableFlourWRanges");
    expect(page).toContain("selectFlourSituation");
    expect(page).toContain("availableFlourWRanges: undefined");
    expect(page).toContain('flourSituation: nextRanges.length ? "has_w_range" : undefined');
    expect(page).toContain("step === \"preset\" && Boolean(session?.pizzaPreset)");
    expect(page).toContain("step === \"flour\" && Boolean(session?.flour || session?.flourSituation || session?.availableFlourWRanges?.length)");
    expect(page).toContain("disabled={!canContinue}");
    expect(page).not.toContain("className={`${optionClass(session.flour === option.id)} flex min-h-24 items-center gap-4`}");
  });

  it("prevents duplicate guidance and mobile step indicators on the session start page", () => {
    const page = source("app/session/start/page.tsx");
    const journeyProgressUses = page.match(/Step \$\{journeyProgress\} of \$\{journeySteps.length\}/g) ?? [];

    expect(journeyProgressUses).toHaveLength(1);
    expect(page).toContain('<aside className="hidden rounded-[1.75rem]');
    expect(page).toContain('<div className="hidden">');
    expect(page).toContain('aria-label="Pizza Session journey"');
    expect(page).toContain('aria-label="Pizza Session setup progress"');
    expect(page).toContain("setup complete. Dough Plan next.");
    expect(page).toContain('<SessionExperienceLevelBadge level={experienceLevel} compact className="mb-3 sm:hidden" />');
    expect(page).toContain('<SessionExperienceLevelBadge level={experienceLevel} className="mb-3 hidden sm:inline-flex" />');
    expect(page).not.toContain("GuidanceModeBadge");
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

  it("supports desktop sidebar links back to completed setup steps", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("function wizardStepFromQuery");
    expect(page).toContain("function wizardStepHref");
    expect(page).toContain("useRouter");
    expect(page).toContain("useSearchParams");
    expect(page).toContain("Suspense");
    expect(page).toContain("<StartPizzaSessionContent />");
    expect(page).toContain('href: "/session/start?step=path"');
    expect(page).toContain('href: "/session/start?step=preset"');
    expect(page).toContain('href: "/session/start?step=time"');
    expect(page).toContain('href: "/session/start?step=quantity"');
    expect(page).toContain('href: "/session/start?step=flour"');
    expect(page).toContain("const query = new URLSearchParams(window.location.search)");
    expect(page).toContain('const requestedStep = wizardStepFromQuery(query.get("step"))');
    expect(page).toContain('const requestedStep = wizardStepFromQuery(searchParams.get("step"))');
    expect(page).toContain("setStep((currentStep) => requestedStep === currentStep ? currentStep : requestedStep)");
    expect(page).toContain("router.replace(wizardStepHref(nextStep), { scroll: false })");
    expect(page).toContain("const restoredStep = requestedStep ?? wizardStepFromQuery");
    expect(page).toContain("setStep(restoredStep)");
    expect(page).toContain("lastRoute: requestedStep ? wizardStepHref(requestedStep) : wizardStepHref(\"path\")");
    expect(page).toContain('value !== "summary"');
    expect(page).toContain("const canNavigate = state === \"complete\"");
    expect(page).toContain("onClick={() => goToStep(wizardSteps[index])}");
    expect(page).toContain("<Link href={item.href}");
    expect(page).toContain("aria-label={`Go to ${item.label}`}");
    expect(page).toContain("cursor-pointer transition hover:bg-leaf/15");
    expect(page).toContain("cursor-default select-none");
    expect(page).toContain("aria-disabled={state === \"upcoming\" ? true : undefined}");
  });

  it("maps old removed oven fallback choices to Pizza oven safely", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('nextSession.pizzaStyle === "not-sure"');
    expect(page).toContain('pizzaStyle: "pizza-oven"');
    expect(page).toContain('ovenType: "gas"');
    expect(page).not.toContain('label: "Not sure yet"');
  });

  it("maps old removed flour fallback choices to Tipo 00 safely", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('nextSession.flour === "not-sure"');
    expect(page).toContain('flour: "tipo-00"');
    expect(page).not.toContain('label: "Not sure"');
    expect(page).toContain('step === "flour" && Boolean(session?.flour || session?.flourSituation || session?.availableFlourWRanges?.length)');
  });

  it("keeps the final guided step focused on one primary next action", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("You’re ready for your Dough Plan.");
    expect(page).toContain("You chose the key setup details. Next, DoughTools turns them into a personalized Dough Plan and ingredient amounts.");
    expect(page).toContain("Create my pizza plan");
    expect(page).toContain("const continueToRecipe = async (options: { replaceActiveCloudSession?: boolean } = {})");
    expect(page).toContain("await materializeCloudBackedPizzaSession(saved,");
    expect(page).toContain("router.push(\"/session/recipe\")");
    expect(page).toContain("onClick={() => continueToRecipe()}");
    expect(page).toContain("ActiveCloudSessionConflictChoice");
    expect(page).toContain("Continue current pizza");
    expect(page).toContain("Keep editing");
    expect(page).toContain("Use this new pizza plan");
    expect(page).toContain("Replace and create new plan");
    expect(page).toContain("hideStickyActionForConflict");
    expect(page).toContain("continueToRecipe({ replaceActiveCloudSession: true })");
    expect(page).toContain('aria-label="Back"');
    expect(page).toContain('name="back"');
    expect(page).toContain('step !== "path" &&');
    expect(page).toContain('h-12 w-12 px-0 sm:hidden');
    expect(page).toContain('hidden sm:inline-flex sm:w-auto');
    expect(page).not.toContain("Save and continue later");
    expect(page.match(/Create my pizza plan/g) ?? []).toHaveLength(1);
    expect(page).toContain("Back");
    expect(page).not.toContain("Saved locally");
    expect(page).not.toContain("hidden items-center gap-1 text-xs font-bold text-ink/40 sm:flex");
    expect(page).not.toContain("Next: build your dough plan");
    expect(page).not.toContain("Last saved:");
    expect(page).not.toContain("Open timeline →");
    expect(page).not.toContain("Shopping list →");
    expect(page).not.toContain("Back to DoughTools");
    expect(page).not.toContain("Open Kitchen Mode");
    expect(page).not.toContain("Open full Calculator");
    expect(page).not.toContain("Open Dough Doctor");
    expect(page).not.toContain("[\"Oven\"");
  });

  it("shows setup summary choices as six readable cards", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("const setupSummaryCards = [");
    expect(page).toContain('label: "Oven"');
    expect(page).toContain('label: "Style"');
    expect(page).not.toContain('label: "Toppings"');
    expect(page).toContain('label: "When"');
    expect(page).toContain('label: "Dough start"');
    expect(page).toContain('label: "Quantity"');
    expect(page).toContain('`${session.pizzaCount ?? 4} pizzas · ${selectedDoughBallWeight} g each`');
    expect(page).toContain('label: "Flour situation"');
    expect(page).toContain("grid gap-3 sm:grid-cols-2 xl:grid-cols-3");
    expect(page).not.toContain("grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6");
    expect(page).toContain("text-base font-extrabold leading-6 text-ink");
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

  it("uses local storage for guests and cloud-first restoration for signed-in starts", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("getActivePizzaSession");
    expect(page).toContain("createPlanningDraftSession");
    expect(page).toContain("savePizzaSession");
    expect(page).toContain("clearActivePizzaSession");
    expect(page).toContain("setActivePizzaSession");
    expect(page).toContain("updatePizzaSession");
    expect(page).toContain('const shouldStartNewSession = query.get("new") === "1"');
    expect(page).toContain('const shouldReplaceExistingSession = query.get("replace") === "1"');
    expect(page).toContain('const shouldPreserveLocalHandoff = query.get("handoff") === "1"');
    expect(page).toContain("if (shouldStartNewSession && shouldReplaceExistingSession)");
    expect(page).toContain("let active = shouldStartNewSession ? undefined : existingBeforeNew");
    expect(page).toContain("if (!shouldStartNewSession && !shouldPreserveLocalHandoff)");
    expect(page).toContain("const canonical = await resolveCanonicalActivePizzaSession()");
    expect(page).toContain("active = canonical.state === \"active\" ? canonical.session : undefined");
    expect(page).toContain("setLoadError(canonical.error)");
    expect(page).toContain("clearCloudBackedActivePizzaSessionPointer()");
    expect(page).toContain("void queueCloudActivePizzaSessionSave(session).then");
    expect(page).toContain("status: \"planning\"");
    expect(page).toContain("currentStep");
    expect(page).not.toContain("PIZZA_SESSION_LOCAL_ONLY_COPY");
  });

  it("uses session experience level as the source of truth after local or cloud restore", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("const preferredLevel = readExperienceLevelPreference()");
    expect(page).toContain("experienceLevel: preferredLevel");
    expect(page).toContain("const sessionLevel = baseSession.experienceLevel");
    expect(page).toContain("experienceLevel: session.experienceLevel");
    expect(page).toContain("simpleDoughDefaultsPatchForLevel(sessionLevel, supportedSession)");
    expect(page).toContain("setExperienceLevel(sessionLevel)");
    expect(page).not.toContain("const level = readExperienceLevelPreference()");
    expect(page).not.toContain("setExperienceLevel(level)");
    expect(page).not.toContain("simpleDoughDefaultsPatchForLevel(level, supportedSession)");
  });

  it("keeps Beginner, Enthusiast and Pizza Nerd on the active local session across updates", () => {
    for (const level of ["beginner", "enthusiast", "pizza_nerd"] as const) {
      const storage = new MemoryStorage();
      const started = createAndSavePizzaSession(
        { id: `local-${level}`, status: "planning", currentStep: "style", experienceLevel: level },
        storage,
        new Date("2026-07-10T10:00:00.000Z"),
      );
      setActivePizzaSession(started.id, storage);

      const updated = updatePizzaSession(
        started.id,
        {
          currentStep: "recipe",
          pizzaStyle: "pizza-oven",
          targetEatTime: "2026-07-11T18:00",
          experienceLevel: getActivePizzaSession(storage)?.experienceLevel,
        },
        storage,
        new Date("2026-07-10T10:05:00.000Z"),
      );

      expect(updated?.experienceLevel).toBe(level);
      expect(getActivePizzaSession(storage)?.experienceLevel).toBe(level);
    }
  });

  it("does not let stale local default preference overwrite an existing Pizza Nerd session", () => {
    const storage = new MemoryStorage();
    storage.setItem(EXPERIENCE_LEVEL_STORAGE_KEY, "beginner");
    const started = createAndSavePizzaSession(
      { id: "stale-default-guard", status: "planning", currentStep: "style", experienceLevel: "pizza_nerd" },
      storage,
      new Date("2026-07-10T10:00:00.000Z"),
    );
    setActivePizzaSession(started.id, storage);

    const sessionLevel = getActivePizzaSession(storage)?.experienceLevel;
    const updated = updatePizzaSession(
      started.id,
      {
        currentStep: "recipe",
        experienceLevel: sessionLevel,
      },
      storage,
      new Date("2026-07-10T10:05:00.000Z"),
    );

    expect(storage.getItem(EXPERIENCE_LEVEL_STORAGE_KEY)).toBe("beginner");
    expect(updated?.experienceLevel).toBe("pizza_nerd");
    expect(getActivePizzaSession(storage)?.experienceLevel).toBe("pizza_nerd");
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
        flourSituation: "has_w_range",
        availableFlourWRanges: ["w_260_300", "w_300_340"],
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
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_260_300", "w_300_340"],
      pizzaPreset: "diavola",
      currentStep: "recipe",
    });
    expect(updated?.updatedAt).not.toBe(started.updatedAt);
    expect(updated?.lastSavedAt).not.toBe(started.lastSavedAt);
  });

  it("documents the new-session defaults for Pizza oven, Neapolitan-style and recommend-flour setup", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain('pizzaStyle: "pizza-oven"');
    expect(page).toContain('ovenType: "gas"');
    expect(page).toContain("pizzaPreset: DEFAULT_SESSION_TOPPING_PRESET");
    expect(page).toContain('flourSituation: "recommend"');
    expect(page).toContain("DEFAULT_SESSION_FORMULA_FLOUR");
    expect(page).toContain('if (session.currentStep === "style") return "path";');
  });

  it("normalizes optional flour situation and W-value ranges without breaking old flour sessions", () => {
    const oldSession = createPizzaSession({ flour: "tipo-00" });
    const rangeSession = createPizzaSession({
      flour: "tipo-00",
      flourSituation: "has_w_range",
      availableFlourWRanges: ["w_260_300", "w_260_300", "w_340_plus"],
    });
    const recommendSession = createPizzaSession({
      flour: "tipo-00",
      flourSituation: "recommend",
      availableFlourWRanges: ["w_180_220"],
    });

    expect(oldSession.flour).toBe("tipo-00");
    expect(oldSession.flourSituation).toBeUndefined();
    expect(oldSession.availableFlourWRanges).toBeUndefined();
    expect(rangeSession.availableFlourWRanges).toEqual(["w_260_300", "w_340_plus"]);
    expect(recommendSession.flourSituation).toBe("recommend");
    expect(recommendSession.flour).toBe("tipo-00");
    expect(createPizzaSession({ flourSituation: "unknown_w" }).flourSituation).toBe("recommend");
  });

  it("normalizes optional dough ball weight without breaking old quantity sessions", () => {
    const oldSession = createPizzaSession({ pizzaCount: 4 });
    const twoForty = createPizzaSession({ pizzaCount: 4, doughBallWeight: 240 });
    const twoSixty = createPizzaSession({ pizzaCount: 4, doughBallWeight: 260 });
    const twoEighty = createPizzaSession({ pizzaCount: 4, doughBallWeight: 280 });
    const custom = createPizzaSession({ pizzaCount: 4, doughBallWeight: 300 });
    const tooSmall = createPizzaSession({ pizzaCount: 4, doughBallWeight: 120 });
    const tooLarge = createPizzaSession({ pizzaCount: 4, doughBallWeight: 400 });

    expect(oldSession.doughBallWeight).toBeUndefined();
    expect(twoForty.doughBallWeight).toBe(240);
    expect(twoSixty.doughBallWeight).toBe(260);
    expect(twoEighty.doughBallWeight).toBe(280);
    expect(custom.doughBallWeight).toBe(300);
    expect(tooSmall.doughBallWeight).toBeUndefined();
    expect(tooLarge.doughBallWeight).toBeUndefined();
  });

  it("captures the current target time input before leaving the time step", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("useRef<HTMLInputElement>");
    expect(page).toContain("const targetTimeInputRef");
    expect(page).toContain("const [targetTimeDraft, setTargetTimeDraft]");
    expect(page).toContain("ref={targetTimeInputRef}");
    expect(page).toContain("ref={doughStartTimeInputRef}");
    expect(page).toContain("setTargetTimeDraft(targetEatTime)");
    expect(page).toContain("setDoughStartMode");
    expect(page).toContain("setDoughEarliestStartTime");
    expect(page).toContain("onInput={(event) => setTargetTime(event.currentTarget.value)}");
    expect(page).toContain("const targetEatTime = step === \"time\" ? targetTimeDraft || targetTimeInputRef.current?.value || session?.targetEatTime : session?.targetEatTime");
    expect(page).toContain("doughStartMode === \"later\"");
    expect(page).toContain("doughStartTimeInputRef.current?.value || session?.doughEarliestStartTime");
    expect(page).toContain("step === \"time\" && Boolean(targetTimeDraft || session?.targetEatTime)");
    expect(page).toContain("targetEatTime,");
    expect(page).toContain("value: formatSetupSummaryTime(session.targetEatTime)");
    expect(page).toContain("DoughTools will build your dough, preparation and bake timeline backwards from this.");
    expect(page).not.toContain("Later planner patches can turn this into a full timeline");
  });

  it("adds compact dough start availability controls to the existing time step", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("const doughStartOptions");
    expect(page).toContain('id: "now", label: "Start now"');
    expect(page).toContain('id: "later", label: "Later"');
    expect(page).toContain('id: "recommend", label: "Let DoughTools recommend"');
    expect(page).toContain("const activeDoughStartMode = session.doughStartMode ?? \"recommend\"");
    expect(page).toContain('aria-labelledby="dough-start-availability-heading"');
    expect(page).toContain("Earliest dough start date and time");
    expect(page).toContain("activeDoughStartMode === \"later\"");
    expect(page).toContain("Use the first moment you can realistically mix the dough.");
    expect(page).toContain("((session?.doughStartMode ?? \"recommend\") !== \"later\" || Boolean(session?.doughEarliestStartTime))");
  });

  it("persists dough start availability without changing old session compatibility", () => {
    const storage = new MemoryStorage();
    const oldSession = createPizzaSession({
      id: "old-session-without-dough-start",
      status: "planning",
      currentStep: "time",
    }, new Date("2026-06-25T10:00:00.000Z"));

    expect(oldSession.doughStartMode).toBeUndefined();
    expect(oldSession.doughEarliestStartTime).toBeUndefined();

    const started = createAndSavePizzaSession(
      { id: "dough-start-session", status: "planning", currentStep: "time", experienceLevel: "beginner" },
      storage,
      new Date("2026-06-25T10:00:00.000Z"),
    );
    setActivePizzaSession(started.id, storage);

    const startNow = updatePizzaSession(
      started.id,
      {
        doughStartMode: "now",
        doughEarliestStartTime: "2026-06-26T09:00",
      },
      storage,
      new Date("2026-06-25T10:05:00.000Z"),
    );

    expect(startNow?.doughStartMode).toBe("now");
    expect(startNow?.doughEarliestStartTime).toBeUndefined();

    const later = updatePizzaSession(
      started.id,
      {
        doughStartMode: "later",
        doughEarliestStartTime: "2026-06-26T09:00",
      },
      storage,
      new Date("2026-06-25T10:10:00.000Z"),
    );

    expect(later?.doughStartMode).toBe("later");
    expect(later?.doughEarliestStartTime).toBe("2026-06-26T09:00");
    expect(getActivePizzaSession(storage)?.doughEarliestStartTime).toBe("2026-06-26T09:00");

    const recommend = updatePizzaSession(
      started.id,
      {
        doughStartMode: "recommend",
        doughEarliestStartTime: "2026-06-26T09:00",
      },
      storage,
      new Date("2026-06-25T10:15:00.000Z"),
    );

    expect(recommend?.doughStartMode).toBe("recommend");
    expect(recommend?.doughEarliestStartTime).toBeUndefined();
    expect(getPizzaSession(started.id, storage)).toMatchObject({
      doughStartMode: "recommend",
    });
    expect(getPizzaSession(started.id, storage)?.doughEarliestStartTime).toBeUndefined();
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

  it("connects the homepage and legacy /start URL to the wizard without reintroducing the beta page", () => {
    const startPage = source("app/start/page.tsx");
    const homepage = source("lib/homepage.ts");

    expect(homepageContent.hero.primaryCta).toEqual({ label: "Plan a pizza", href: "/session/start" });
    expect(homepage).toContain("Plan a pizza");
    expect(homepage).toContain("/session/start");
    expect(startPage).toContain("permanentRedirect");
    expect(startPage).toContain('"/session/start"');
    expect(startPage).not.toContain('"use client"');
    expect(startPage).not.toContain("Start Here");
    expect(startPage).not.toContain("Start Pizza Session");
  });

  it("renders the start form without creating a ghost session and persists only on plan creation", () => {
    const page = source("app/session/start/page.tsx");
    const docs = source("docs/pizza-session-autosave-and-resume.md");

    expect(page).toContain("function createPlanningDraftSession");
    expect(page).toContain("const baseSession = active ?? createPlanningDraftSession(preferredLevel, requestedStep)");
    expect(page).toContain("const shouldPersistInitialSession = Boolean(active)");
    expect(page).toContain("if (shouldPersistInitialSession) setActivePizzaSession(experienceScopedSession.id)");
    expect(page).toContain("const persistedActiveSession = getActivePizzaSession()?.id === session.id");
    expect(page).toContain("if (getActivePizzaSession()?.id !== session.id) return");
    expect(page).toContain("const readyForRecipe = applySessionPatchInMemory(session, { lastRoute: \"/session/recipe\" }, \"summary\", experienceLevel, \"/session/recipe\")");
    expect(page).toContain("const saved = savePizzaSession(readyForRecipe)");
    expect(page).toContain("setActivePizzaSession(saved.id)");
    expect(page).toContain("await materializeCloudBackedPizzaSession(saved,");
    expect(page).toContain("Creating pizza plan...");
    expect(page).toContain("We could not save this pizza plan to your account yet.");
    expect(page).not.toContain("function StartPizzaSessionEntry()");
    expect(page).not.toContain("setNeedsExplicitStart");
    expect(page).not.toContain("const baseSession = active ?? createAndSavePizzaSession");
    expect(page).not.toContain("Loading your local pizza session");
    expect(page).toContain("lastRoute: \"/session/recipe\"");
    expect(docs).toContain("Opening `/session/start` without an active session renders the normal planning form with an in-memory draft.");
    expect(docs).toContain("does not add multiple active sessions");
  });

  it("requires confirmation before replacing an existing active setup draft", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("function ReplaceActiveSessionChoice");
    expect(page).toContain("Active pizza plan found");
    expect(page).toContain("Continue my plan");
    expect(page).toContain('href="/session/start?new=1&replace=1"');
    expect(page).toContain("const shouldReplaceExistingSession = query.get(\"replace\") === \"1\"");
    expect(page).toContain("if (shouldStartNewSession && existingBeforeNew && !shouldReplaceExistingSession)");
    expect(page).toContain("setReplaceCandidate(existingBeforeNew)");
  });

  it("uses cloud authority instead of asking users to choose between local and cloud sessions", () => {
    const page = source("app/session/start/page.tsx");
    const docs = source("docs/pizza-session-autosave-and-resume.md");

    expect(page).toContain("resolveCanonicalActivePizzaSession");
    expect(page).not.toContain("function SessionConflictChoice");
    expect(page).not.toContain("You have two active pizza plans.");
    expect(page).not.toContain("Continue this device’s plan");
    expect(page).not.toContain("Continue saved plan");
    expect(page).not.toContain("setConflictCloudRow");
    expect(docs).toContain("the cloud active session wins");
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
    expect(page).toContain('<SessionExperienceLevelBadge level={experienceLevel} compact className="mb-3 sm:hidden" />');
    expect(page).toContain('<SessionExperienceLevelBadge level={experienceLevel} className="mb-3 hidden sm:inline-flex" />');
    expect(levels).toContain("Beginner");
    expect(levels).toContain("Enthusiast");
    expect(levels).toContain("Pizza Nerd");
    expect(levels).toContain("rgba(58, 163, 106");
    expect(levels).toContain("rgba(242, 161, 95");
    expect(levels).toContain("rgba(235, 87, 127");
    expect(page).not.toMatch(/Home Pizza Maker|intermediate|advanced/);
  });

  it("hides the flour default planning note on mobile without removing flour choices", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).toContain("flourSituationOptions.map");
    expect(page).toContain("flourWRangeOptions.map");
    expect(page).toContain("toggleFlourWRange");
    expect(page).toContain("Continue setup");
    expect(page).toContain("Ingredient amounts still use the current safe flour default in this patch.");
    expect(page).toContain('className="hidden rounded-2xl border border-ink/10 bg-cream/60 p-3 text-xs font-bold leading-5 text-ink/55 sm:block"');
  });

  it("keeps the global brand in the header without duplicating it inside the desktop session sidebar", () => {
    const page = source("app/session/start/page.tsx");
    const headerLogoIndex = page.indexOf('aria-label="DoughTools home"');
    const sidebarIndex = page.indexOf("<aside");

    expect(headerLogoIndex).toBeGreaterThan(-1);
    expect(sidebarIndex).toBeGreaterThan(-1);
    expect(page.indexOf('aria-label="DoughTools home"', sidebarIndex)).toBe(-1);
    expect(page).toContain("Set up your pizza session.</h1>");
    expect(page).not.toContain('<p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza Session V2</p>');
  });

  it("removes the Session Start sidebar local-save note and adds laptop-height density classes", () => {
    const page = source("app/session/start/page.tsx");

    expect(page).not.toContain("You can change anything later. No worries!");
    expect(page).not.toContain("No cloud sync.</span>");
    expect(page).toContain("[@media_(min-width:1024px)_and_(max-height:860px)]");
    expect(page).toContain("[@media_(min-width:1024px)_and_(max-height:860px)]:lg:grid-cols-[14rem_minmax(0,1fr)]");
    expect(page).toContain("[@media_(min-width:1024px)_and_(max-height:860px)]:min-h-12");
    expect(page).toContain("[@media_(min-width:1024px)_and_(max-height:860px)]:p-5");
  });

  it("is honest about local-first behavior and avoids unavailable claims", () => {
    const page = source("app/session/start/page.tsx");
    const doc = source("docs/start-pizza-session-wizard.md");
    const dataDoc = source("docs/pizza-session-data-model.md");
    const combined = [page, doc, dataDoc].join("\n");

    expect(combined).toMatch(/Pizza [Ss]essions are currently saved in this browser on this device/);
    expect(combined).toMatch(/cloud sync|Cloud sync is not active yet/);
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
    expect(page).toContain("buttonClass");
    expect(page).toContain("focusRingClass");
    expect(page).toContain("border-action-primary");
    expect(page).toContain("bg-action-primary/[.06]");
  });

  it("adds Patch 32 to the public update history", () => {
    const changelog = source("lib/changelog.ts");

    expect(changelog).toContain("Session recipe build step");
    expect(changelog).toContain("Wizard copy clarified for baking path and pizza preset choices");
    expect(changelog).toContain("Progress is autosaved to the active browser session");
    expect(changelog).toContain("No cloud sync, reminders, tracking or indexing behavior added");
  });
});
