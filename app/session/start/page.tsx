"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { GuidanceModeBadge } from "@/components/ExperienceLevelSelector";
import {
  getExperienceLevelConfig,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import {
  pizzaSessionContinueHref,
  type PizzaSession,
  type PizzaSessionStep,
} from "@/lib/pizza-session";
import { pizzaSessionPresets, type PizzaPresetId } from "@/lib/pizza-session-presets";
import {
  buildPizzaSessionTargetTime,
  getPizzaSessionDayQuickChoices,
  pizzaSessionTimeQuickChoices,
  type PizzaSessionDayQuickChoiceId,
  type PizzaSessionTimeQuickChoiceId,
} from "@/lib/session-time-quick-choices";
import {
  createAndSavePizzaSession,
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
  setActivePizzaSession,
  updatePizzaSession,
} from "@/lib/pizza-session-storage";

type WizardStep = "path" | "preset" | "time" | "quantity" | "flour" | "summary";
type SessionStyle = "home-oven" | "pizza-oven" | "pan-tray";

const wizardSteps: WizardStep[] = ["path", "preset", "time", "quantity", "flour", "summary"];

const styleOptions = [
  {
    id: "home-oven",
    label: "Home oven pizza",
    description: "A calm, reliable pizza path for a normal electric oven, stone, steel or sturdy tray.",
  },
  {
    id: "pizza-oven",
    label: "Pizza oven pizza",
    description: "A higher-heat path for Ooni, Gozney, Chef Matteo or a similar pizza oven.",
  },
  {
    id: "pan-tray",
    label: "Pan / tray pizza",
    description: "A forgiving bake where the pan supports the dough and launch stress stays low.",
  },
] as const;

const flourOptions = [
  { id: "plain", label: "All-purpose / plain flour", description: "Easy to find. Best with moderate hydration." },
  { id: "bread", label: "Bread flour / strong flour", description: "Stronger gluten and a safer choice for longer rests." },
  { id: "tipo-00", label: "Pizza flour / tipo 00", description: "Designed for pizza, especially with hotter ovens." },
  { id: "not-sure", label: "Not sure yet", description: "You can choose the exact flour later in the calculator." },
] as const;

const levelCopy: Record<ExperienceLevel, Record<WizardStep, string>> = {
  beginner: {
    path: "Choose how you will bake. This sets the first safe defaults before the dough plan.",
    preset: "Choose the pizza you want to shop and prepare for. You can still adjust details later.",
    time: "Choose when you want to eat or bake. We’ll use this time to build your pizza timeline.",
    quantity: "Choose how many pizzas you want. Six small pizzas or one pan pizza are common starting points.",
    flour: "Choose the closest flour. If you do not know, choose not sure yet.",
    summary: "Your first decisions are saved. Next, build the dough plan.",
  },
  enthusiast: {
    path: "The baking path controls bake heat, dough size and how forgiving the process should be.",
    preset: "The pizza preset keeps the session practical: sauce, cheese and toppings can follow the same plan.",
    time: "We’ll plan dough, preparation and bake steps backwards from this time.",
    quantity: "Pizza count controls total dough, sauce, cheese and prep work.",
    flour: "Flour strength affects hydration, fermentation length and handling.",
    summary: "The session is ready for a dough plan, timeline and shopping list.",
  },
  pizza_nerd: {
    path: "This sets the first bake-environment constraint. The exact formula still comes from the calculator model.",
    preset: "Preset choice is stored separately from baking path so dough setup and topping plan do not get mixed together.",
    time: "Pick the target pizza time. Timeline steps are rounded to practical 15-minute increments; active night tasks are avoided where possible while passive fermentation can continue overnight.",
    quantity: "This becomes the first batch-size variable before exact dough-ball and formula tuning.",
    flour: "This is a coarse flour class, not a W-value or protein analysis. Fine tuning remains available later.",
    summary: "The local session now has enough context to hand off to recipe calculation without changing formulas.",
  },
};

function stepToSessionStep(step: WizardStep): PizzaSessionStep {
  if (step === "path" || step === "preset") return "style";
  return step === "summary" ? "recipe" : step;
}

function stepIndex(step: WizardStep) {
  return Math.max(0, wizardSteps.indexOf(step));
}

function initialWizardStep(session: PizzaSession): WizardStep {
  if (session.currentStep === "time") return "time";
  if (session.currentStep === "quantity") return "quantity";
  if (session.currentStep === "oven") return "flour";
  if (session.currentStep === "flour") return "flour";
  if (session.currentStep === "recipe") return "summary";
  if (session.pizzaStyle && !session.pizzaPreset) return "preset";
  return "path";
}

function optionClass(active: boolean) {
  return `min-h-24 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
    active ? "border-tomato bg-tomato/10 shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30"
  }`;
}

export default function StartPizzaSessionPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [step, setStep] = useState<WizardStep>("path");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [targetTimeDraft, setTargetTimeDraft] = useState("");
  const [selectedDayChoice, setSelectedDayChoice] = useState<PizzaSessionDayQuickChoiceId | undefined>();
  const [selectedTimeChoice, setSelectedTimeChoice] = useState<PizzaSessionTimeQuickChoiceId | undefined>();
  const targetTimeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    const level = readExperienceLevelPreference();
    const active = getActivePizzaSession();
    const nextSession = active ?? createAndSavePizzaSession({
      status: "planning",
      currentStep: "style",
      experienceLevel: level,
    });

    setActivePizzaSession(nextSession.id);
    setExperienceLevel(level);
    setSession(nextSession);
    setTargetTimeDraft(nextSession.targetEatTime ?? "");
    if (nextSession.targetEatTime) {
      setSelectedDayChoice("custom-date");
      setSelectedTimeChoice("custom-time");
    }
    setStep(initialWizardStep(nextSession));
    setReady(true);
  }, []);

  const experience = getExperienceLevelConfig(experienceLevel);
  const progress = stepIndex(step) + 1;

  const savePatch = (
    patch: Partial<Omit<PizzaSession, "id" | "schemaVersion" | "createdAt">>,
    nextStep: WizardStep = step,
  ) => {
    if (!session) return;
    const updated = updatePizzaSession(session.id, {
      ...patch,
      status: "planning",
      currentStep: stepToSessionStep(nextStep),
      experienceLevel,
    });
    if (updated) {
      setSession(updated);
      setActivePizzaSession(updated.id);
    }
  };

  const selectStyle = (value: SessionStyle) => {
    const ovenType = value === "pizza-oven" ? "gas" : value === "pan-tray" ? "pan" : "home";
    const pizzaCount = value === "pan-tray" ? 1 : session?.pizzaCount ?? 6;
    savePatch({ pizzaStyle: value, ovenType, pizzaCount }, "path");
  };

  const selectPreset = (pizzaPreset: PizzaPresetId) => savePatch({ pizzaPreset }, "preset");
  const selectFlour = (flour: string) => savePatch({ flour }, "flour");
  const setQuantity = (pizzaCount: number) => savePatch({ pizzaCount }, "quantity");
  const setTargetTime = (targetEatTime: string) => {
    setTargetTimeDraft(targetEatTime);
    savePatch({ targetEatTime }, "time");
  };

  const selectDayChoice = (choice: PizzaSessionDayQuickChoiceId) => {
    setSelectedDayChoice(choice);
    if (choice === "custom-date") return;
    const targetEatTime = buildPizzaSessionTargetTime(choice, selectedTimeChoice);
    if (targetEatTime) setTargetTime(targetEatTime);
  };

  const selectTimeChoice = (choice: PizzaSessionTimeQuickChoiceId) => {
    setSelectedTimeChoice(choice);
    if (choice === "custom-time") return;
    const targetEatTime = buildPizzaSessionTargetTime(selectedDayChoice, choice);
    if (targetEatTime) setTargetTime(targetEatTime);
  };

  const goToStep = (nextStep: WizardStep) => {
    const targetEatTime = step === "time" ? targetTimeDraft || targetTimeInputRef.current?.value || session?.targetEatTime : session?.targetEatTime;
    savePatch({
      targetEatTime,
    }, nextStep);
    setStep(nextStep);
  };

  const continueStep = () => {
    const index = stepIndex(step);
    const nextStep = wizardSteps[Math.min(wizardSteps.length - 1, index + 1)];
    goToStep(nextStep);
  };

  const backStep = () => {
    const index = stepIndex(step);
    const previousStep = wizardSteps[Math.max(0, index - 1)];
    goToStep(previousStep);
  };

  const canContinue =
    (step === "path" && Boolean(session?.pizzaStyle))
    || (step === "preset" && Boolean(session?.pizzaPreset))
    || (step === "time" && Boolean(targetTimeDraft || session?.targetEatTime))
    || (step === "quantity" && Boolean(session?.pizzaCount))
    || (step === "flour" && Boolean(session?.flour))
    || step === "summary";

  if (!ready || !session) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
          Loading your local pizza session…
        </div>
      </main>
    );
  }

  const selectedStyle = styleOptions.find((option) => option.id === session.pizzaStyle);
  const selectedPreset = pizzaSessionPresets.find((option) => option.id === session.pizzaPreset);
  const selectedFlour = flourOptions.find((option) => option.id === session.flour);
  const dayChoices = getPizzaSessionDayQuickChoices();
  const showCustomTargetInput = selectedDayChoice === "custom-date" || selectedTimeChoice === "custom-time";
  const lastSaved = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.lastSavedAt));
  const continueHref = pizzaSessionContinueHref({ ...session, currentStep: "recipe" });

  return (
    <main className="min-h-screen bg-cream px-4 py-5 pb-28 text-ink sm:px-6 sm:py-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="order-2 rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur lg:order-1 lg:sticky lg:top-6 lg:self-start">
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-extrabold" aria-label="DoughTools home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white">○</span>
            Dough<span className="text-tomato">Tools</span>
          </Link>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Start Pizza Session</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-none">One clear decision at a time.</h1>
          <p className="mt-4 text-sm leading-6 text-ink/55">{levelCopy[experienceLevel][step]}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <GuidanceModeBadge level={experienceLevel} />
            <span className="rounded-full bg-leaf/10 px-3 py-2 text-xs font-extrabold text-leaf">
              Step {progress} of {wizardSteps.length}
            </span>
          </div>
          <ol className="mt-6 grid gap-2" aria-label="Pizza Session progress">
            {wizardSteps.map((item, index) => (
              <li key={item} className={`rounded-xl px-3 py-2 text-xs font-bold ${item === step ? "bg-ink text-white" : index < stepIndex(step) ? "bg-leaf/10 text-leaf" : "bg-ink/[.04] text-ink/45"}`}>
                <span className="sr-only">{item === step ? "Current step: " : index < stepIndex(step) ? "Completed step: " : "Upcoming step: "}</span>
                {index + 1}. {item === "path" ? "Baking path" : item === "preset" ? "Pizza preset" : item === "summary" ? "Dough plan" : item[0].toUpperCase() + item.slice(1)}
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-2xl bg-cream p-4 text-xs leading-5 text-ink/50">
            {PIZZA_SESSION_LOCAL_ONLY_COPY} Cloud sync is not active yet, so return on the same device and browser.
          </p>
        </aside>

        <section className="order-1 min-w-0 rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-card backdrop-blur sm:p-8 lg:order-2" aria-live="polite">
          <div className="mb-6 flex flex-col gap-3 border-b border-ink/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Autosaved locally</p>
              <h2 className="mt-2 font-display text-4xl font-semibold leading-none">
                {step === "path" && "How will you bake your pizza?"}
                {step === "preset" && "Which pizza are you planning?"}
                {step === "time" && "When do you want pizza?"}
                {step === "quantity" && "How many pizzas?"}
                {step === "flour" && "What flour do you have?"}
                {step === "summary" && "Your Pizza Session is ready."}
              </h2>
            </div>
            <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${experience.badgeClassName}`}>
              {experience.marker} {experience.label}
            </span>
          </div>

          {step === "path" && (
            <div className="grid gap-3 md:grid-cols-3">
              {styleOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => selectStyle(option.id)} aria-pressed={session.pizzaStyle === option.id} className={optionClass(session.pizzaStyle === option.id)}>
                  <span className="block text-lg font-extrabold">{option.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink/55">{option.description}</span>
                  {session.pizzaStyle === option.id && <span className="mt-3 block text-xs font-extrabold text-tomato">Selected</span>}
                </button>
              ))}
            </div>
          )}

          {step === "preset" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pizzaSessionPresets.map((preset) => (
                <button key={preset.id} type="button" onClick={() => selectPreset(preset.id)} aria-pressed={session.pizzaPreset === preset.id} className={optionClass(session.pizzaPreset === preset.id)}>
                  <span className="block text-lg font-extrabold">{preset.marker} {preset.name}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink/55">{preset.shortDescription}</span>
                  {session.pizzaPreset === preset.id && <span className="mt-3 block text-xs font-extrabold text-tomato">Selected</span>}
                </button>
              ))}
            </div>
          )}

          {step === "time" && (
            <div className="grid gap-6">
              <p className="max-w-2xl text-sm leading-6 text-ink/60">
                Choose a target eating or baking time. DoughTools will build your dough, preparation and bake timeline backwards from this.
              </p>

              <section aria-labelledby="session-day-choice-heading">
                <h3 id="session-day-choice-heading" className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Choose day</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {dayChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => selectDayChoice(choice.id)}
                      aria-pressed={selectedDayChoice === choice.id}
                      className={`min-h-20 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                        selectedDayChoice === choice.id ? "border-tomato bg-tomato/10 shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30"
                      }`}
                    >
                      <span className="block text-sm font-extrabold text-ink">{choice.label}</span>
                      {choice.displayDate && <span className="mt-1 block text-xs font-bold text-ink/45">{choice.displayDate}</span>}
                      {selectedDayChoice === choice.id && <span className="mt-2 block text-[11px] font-extrabold uppercase tracking-[.12em] text-tomato">Selected</span>}
                    </button>
                  ))}
                </div>
              </section>

              {selectedDayChoice && (
                <section aria-labelledby="session-time-choice-heading">
                  <h3 id="session-time-choice-heading" className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Choose time</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {pizzaSessionTimeQuickChoices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => selectTimeChoice(choice.id)}
                        aria-pressed={selectedTimeChoice === choice.id}
                        className={`min-h-20 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                          selectedTimeChoice === choice.id ? "border-tomato bg-tomato/10 shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30"
                        }`}
                      >
                        <span className="block text-sm font-extrabold text-ink">{choice.label}</span>
                        {choice.time && <span className="mt-1 block text-xs font-bold text-ink/45">{choice.time}</span>}
                        {selectedTimeChoice === choice.id && <span className="mt-2 block text-[11px] font-extrabold uppercase tracking-[.12em] text-tomato">Selected</span>}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {showCustomTargetInput && (
                <label className="block max-w-md text-sm font-extrabold text-ink/65">
                  Custom target date and time
                  <input
                    ref={targetTimeInputRef}
                    type="datetime-local"
                    value={targetTimeDraft}
                    onChange={(event) => setTargetTime(event.target.value)}
                    onInput={(event) => setTargetTime(event.currentTarget.value)}
                    className="mt-3 h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-bold text-ink outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20"
                  />
                  <span className="mt-3 block text-xs font-normal leading-5 text-ink/45">
                    Use this when the quick choices are not exact enough.
                  </span>
                </label>
              )}

              {targetTimeDraft && (
                <p className="rounded-2xl bg-leaf/[.08] px-4 py-3 text-sm font-bold text-leaf">
                  Target pizza time: {targetTimeDraft.replace("T", " at ")}
                </p>
              )}
            </div>
          )}

          {step === "quantity" && (
            <div>
              <div className="flex max-w-sm items-center gap-3">
                <button type="button" onClick={() => setQuantity(Math.max(1, (session.pizzaCount ?? 6) - 1))} className="grid h-14 w-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato" aria-label="Decrease pizza count">−</button>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={session.pizzaCount ?? 6}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  className="h-14 min-w-0 flex-1 rounded-2xl border border-ink/10 bg-white px-4 text-center text-2xl font-extrabold outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20"
                  aria-label="Pizza count"
                />
                <button type="button" onClick={() => setQuantity(Math.min(24, (session.pizzaCount ?? 6) + 1))} className="grid h-14 w-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato" aria-label="Increase pizza count">+</button>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/50">This is saved as the first batch-size decision. Exact dough-ball weight stays in the calculator.</p>
            </div>
          )}

          {step === "flour" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {flourOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => selectFlour(option.id)} aria-pressed={session.flour === option.id} className={optionClass(session.flour === option.id)}>
                  <span className="block text-lg font-extrabold">{option.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink/55">{option.description}</span>
                  {session.flour === option.id && <span className="mt-3 block text-xs font-extrabold text-tomato">Selected</span>}
                </button>
              ))}
            </div>
          )}

          {step === "summary" && (
            <div className="grid gap-5">
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Baking path", selectedStyle?.label ?? "Not selected yet"],
                  ["Pizza preset", selectedPreset?.name ?? "Not selected yet"],
                  ["Target time", session.targetEatTime || "Not set yet"],
                  ["Pizza count", `${session.pizzaCount ?? 6}`],
                  ["Flour", selectedFlour?.label ?? "Not sure yet"],
                  ["Session status", session.status],
                  ["Last saved", lastSaved],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-cream p-4">
                    <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/35">{label}</dt>
                    <dd className="mt-1 text-lg font-extrabold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-[1.5rem] bg-leaf/[.1] p-5">
                <h3 className="font-display text-2xl font-semibold">Next recommended action</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  Build the dough plan from this starting setup, then continue to timeline and shopping.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <Link href="/session/recipe" className="rounded-2xl bg-tomato px-4 py-3 text-center text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Build dough plan →
                  </Link>
                  <Link href="/session/timeline" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Open timeline →
                  </Link>
                  <Link href="/session/shopping" className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Shopping list →
                  </Link>
                  <Link href={continueHref} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Continue later
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={backStep} disabled={step === "path"} className="min-h-12 rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/60 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
              Back
            </button>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs font-bold text-ink/40">Last saved: {lastSaved}</p>
              {step !== "summary" ? (
                <button type="button" onClick={continueStep} disabled={!canContinue} className="min-h-12 rounded-2xl bg-ink px-6 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-40">
                  Continue
                </button>
              ) : (
                <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-6 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white">
                  Back to DoughTools
                </Link>
              )}
            </div>
          </div>
        </section>

        <footer className="lg:col-span-2">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
