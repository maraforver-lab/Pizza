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
type SessionStyle = "home-oven" | "pizza-oven" | "pan-tray" | "not-sure";

const wizardSteps: WizardStep[] = ["path", "preset", "time", "quantity", "flour", "summary"];

const styleOptions = [
  {
    id: "home-oven",
    label: "Home oven",
    icon: "▤",
    description: "Use a normal home oven with a tray, stone or steel.",
    badge: "Most popular",
  },
  {
    id: "pizza-oven",
    label: "Pizza oven",
    icon: "◠",
    description: "Use a high-heat pizza oven like Ooni, Gozney or similar.",
    badge: undefined,
  },
  {
    id: "pan-tray",
    label: "Pan / tray bake",
    icon: "▱",
    description: "Easiest option. Bake in a tray or pan.",
    badge: undefined,
  },
  {
    id: "not-sure",
    label: "Not sure yet",
    icon: "?",
    description: "Choose this if you want DoughTools to stay flexible.",
    badge: undefined,
  },
] as const;

const flourOptions = [
  { id: "tipo-00", label: "Pizza flour / Tipo 00", icon: "▣", description: "The best choice for pizza. Strong and high protein." },
  { id: "bread", label: "Bread flour / Strong flour", icon: "▥", description: "Great for chewy crusts and good rise." },
  { id: "plain", label: "All-purpose flour", icon: "◒", description: "Works in a pinch. Results may vary." },
  { id: "not-sure", label: "Not sure", icon: "?", description: "We’ll use a safe default." },
] as const;

const wizardStepLabels: Record<WizardStep, string> = {
  path: "Baking path",
  preset: "Pizza style",
  time: "When",
  quantity: "How many",
  flour: "Flour",
  summary: "Your plan",
};

const wizardStepQuestions: Record<WizardStep, string> = {
  path: "How will you bake your pizza?",
  preset: "What kind of pizza are you making?",
  time: "When do you want pizza?",
  quantity: "How many pizzas?",
  flour: "What flour do you have?",
  summary: "Your starting setup is ready.",
};

const wizardStepHelpers: Record<WizardStep, string> = {
  path: "This helps us suggest the right dough plan and timeline for you.",
  preset: "This helps us suggest a better plan and shopping list.",
  time: "We’ll work backwards and build the right timeline.",
  quantity: "We’ll calculate the right amount of dough.",
  flour: "This helps us suggest the right hydration and fermentation.",
  summary: "Here’s what we’ll use to build your dough plan.",
};

const wizardPresetOptions: Array<{
  id: PizzaPresetId;
  label: string;
  icon: string;
  description: string;
}> = [
  { id: "simple-cheese", label: "Simple cheese", icon: "🧀", description: "Classic cheese pizza with tomato sauce." },
  { id: "margherita", label: "Margherita", icon: "🍅", description: "Tomato, mozzarella and fresh basil." },
  { id: "pepperoni-salami", label: "Pepperoni", icon: "🍕", description: "Pepperoni with tomato sauce." },
  { id: "funghi", label: "Veggie", icon: "🥬", description: "Vegetables and tomato sauce." },
  { id: "marinara", label: "I’ll decide toppings later", icon: "?", description: "No problem, we’ll keep it flexible." },
];

const levelCopy: Record<ExperienceLevel, Record<WizardStep, string>> = {
  beginner: {
    path: "We’ll build your dough plan step by step.",
    preset: "Pick the pizza you want to make. You can change this later.",
    time: "Pick the time you want pizza. DoughTools will plan backwards from there.",
    quantity: "Choose a simple number. You can tune exact dough size later.",
    flour: "Choose the closest flour. If you are not sure, safe defaults keep going.",
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
  return `relative min-h-28 rounded-[1.35rem] border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:p-5 ${
    active ? "border-tomato bg-tomato/[.06] shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30 hover:shadow-sm"
  }`;
}

function selectedIndicator(active: boolean) {
  return (
    <span
      aria-hidden="true"
      className={`absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full border text-xs font-black ${
        active ? "border-tomato bg-tomato text-white" : "border-ink/15 bg-white text-transparent"
      }`}
    >
      ✓
    </span>
  );
}

function iconBadge(icon: string) {
  return (
    <span aria-hidden="true" className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-cream text-3xl shadow-sm">
      {icon}
    </span>
  );
}

function formatTargetTime(value?: string) {
  if (!value) return "Not set yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set yet";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
  const stepPanelRef = useRef<HTMLElement>(null);
  const didRenderInitialStepRef = useRef(false);

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

  useEffect(() => {
    if (!ready) return;
    if (!didRenderInitialStepRef.current) {
      didRenderInitialStepRef.current = true;
      return;
    }

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    stepPanelRef.current?.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [ready, step]);

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
    const pizzaCount = value === "pan-tray" ? 1 : session?.pizzaCount ?? 4;
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
  const selectedWizardPreset = wizardPresetOptions.find((option) => option.id === session.pizzaPreset);
  const selectedFlour = flourOptions.find((option) => option.id === session.flour);
  const dayChoices = getPizzaSessionDayQuickChoices();
  const showCustomTargetInput = selectedDayChoice === "custom-date" || selectedTimeChoice === "custom-time";
  const lastSaved = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.lastSavedAt));
  const continueHref = pizzaSessionContinueHref({ ...session, currentStep: "recipe" });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(226,71,38,0.10),transparent_32rem),linear-gradient(135deg,#f7f0e4,#fffaf2_45%,#f4eadc)] px-4 py-5 pb-28 text-ink sm:px-6 sm:py-8">
      <header className="mx-auto mb-5 flex max-w-6xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 text-sm font-extrabold" aria-label="DoughTools home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-sm">○</span>
          <span className="text-lg">Dough<span className="text-tomato">Tools</span></span>
        </Link>
        <Link href="/account" className="rounded-full border border-ink/10 bg-white/80 px-4 py-3 text-xs font-extrabold text-ink/70 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
          Sign in
        </Link>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="hidden rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur lg:sticky lg:top-6 lg:block lg:self-start">
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-extrabold" aria-label="DoughTools home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white">○</span>
            Dough<span className="text-tomato">Tools</span>
          </Link>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Start Pizza Session</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-none">One clear decision at a time.</h1>
          <p className="mt-4 text-sm leading-6 text-ink/55">We’ll build your dough plan step by step.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <GuidanceModeBadge level={experienceLevel} />
          </div>
          <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-4">
            <div className="flex items-center justify-between text-xs font-extrabold text-ink/65">
              <span>Step {progress} of {wizardSteps.length}</span>
              <span>{Math.round((progress / wizardSteps.length) * 100)}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${(progress / wizardSteps.length) * 100}%` }} />
            </div>
          </div>
          <ol className="mt-6 grid gap-2" aria-label="Pizza Session progress">
            {wizardSteps.map((item, index) => (
              <li key={item} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold ${item === step ? "bg-ink text-white" : index < stepIndex(step) ? "bg-leaf/10 text-leaf" : "bg-ink/[.04] text-ink/45"}`}>
                <span className="sr-only">{item === step ? "Current step: " : index < stepIndex(step) ? "Completed step: " : "Upcoming step: "}</span>
                <span className={`grid h-6 w-6 place-items-center rounded-full ${item === step ? "bg-white text-ink" : index < stepIndex(step) ? "bg-leaf text-white" : "bg-ink/10 text-ink/45"}`}>
                  {index < stepIndex(step) ? "✓" : index + 1}
                </span>
                {wizardStepLabels[item]}
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-2xl bg-cream p-4 text-xs leading-5 text-ink/55">
            <strong className="block text-sm text-ink">You can change anything later. No worries!</strong>
            <span className="mt-2 block">{PIZZA_SESSION_LOCAL_ONLY_COPY}</span>
            <span className="mt-1 block">No cloud sync.</span>
          </div>
        </aside>

        <section ref={stepPanelRef} className="min-w-0 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-card backdrop-blur sm:p-8 lg:rounded-[2.5rem]" aria-live="polite">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[.18em] text-tomato">
              <span>Step {progress} of {wizardSteps.length}</span>
              <GuidanceModeBadge level={experienceLevel} />
            </div>
            <div className="mt-4 flex gap-2" aria-label="Pizza Session progress">
              {wizardSteps.map((item, index) => (
                <span
                  key={item}
                  className={`h-2.5 flex-1 rounded-full ${item === step ? "bg-tomato" : index < stepIndex(step) ? "bg-tomato/45" : "bg-ink/12"}`}
                  aria-label={`${index + 1}. ${wizardStepLabels[item]}`}
                />
              ))}
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-3 pb-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Step {progress} of {wizardSteps.length}</p>
              <h2 className="mt-2 font-display text-4xl font-semibold leading-none">
                {wizardStepQuestions[step]}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60">{wizardStepHelpers[step]}</p>
            </div>
            <span className={`hidden w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 sm:inline-flex ${experience.badgeClassName}`}>
              {experience.marker} Guidance mode: {experience.label}
            </span>
          </div>

          {step === "path" && (
            <div className="grid gap-3 md:grid-cols-2">
              {styleOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => selectStyle(option.id)} aria-pressed={session.pizzaStyle === option.id} className={optionClass(session.pizzaStyle === option.id)}>
                  {selectedIndicator(session.pizzaStyle === option.id)}
                  {iconBadge(option.icon)}
                  <span className="block pr-8 text-xl font-extrabold">{option.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink/55">{option.description}</span>
                  {option.badge && <span className="mt-4 inline-flex rounded-full bg-tomato/10 px-3 py-1.5 text-xs font-extrabold text-tomato">{option.badge}</span>}
                  {session.pizzaStyle === option.id && <span className="mt-3 block text-xs font-extrabold uppercase tracking-[.14em] text-tomato">Selected</span>}
                </button>
              ))}
            </div>
          )}

          {step === "preset" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {wizardPresetOptions.map((preset) => (
                <button key={preset.id} type="button" onClick={() => selectPreset(preset.id)} aria-pressed={session.pizzaPreset === preset.id} className={optionClass(session.pizzaPreset === preset.id)}>
                  {selectedIndicator(session.pizzaPreset === preset.id)}
                  {iconBadge(preset.icon)}
                  <span className="block pr-8 text-lg font-extrabold">{preset.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink/55">{preset.description}</span>
                  {session.pizzaPreset === preset.id && <span className="mt-3 block text-xs font-extrabold uppercase tracking-[.14em] text-tomato">Selected</span>}
                </button>
              ))}
            </div>
          )}

          {step === "time" && (
            <div className="grid gap-6">
              <p className="max-w-2xl text-sm leading-6 text-ink/60">
                Choose a target pizza time. DoughTools will build your dough, preparation and bake timeline backwards from this.
              </p>

              <section aria-labelledby="session-day-choice-heading">
                <h3 id="session-day-choice-heading" className="text-sm font-extrabold text-ink">Pick a day</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {dayChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => selectDayChoice(choice.id)}
                      aria-pressed={selectedDayChoice === choice.id}
                      className={`min-h-20 rounded-2xl border p-3 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                        selectedDayChoice === choice.id ? "border-tomato bg-tomato text-white shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30"
                      }`}
                    >
                      <span className="block text-sm font-extrabold">{choice.label}</span>
                      {choice.displayDate && <span className={`mt-1 block text-xs font-bold ${selectedDayChoice === choice.id ? "text-white/75" : "text-ink/45"}`}>{choice.displayDate}</span>}
                    </button>
                  ))}
                </div>
              </section>

              {selectedDayChoice && (
                <section aria-labelledby="session-time-choice-heading">
                  <h3 id="session-time-choice-heading" className="text-sm font-extrabold text-ink">What time?</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {pizzaSessionTimeQuickChoices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => selectTimeChoice(choice.id)}
                        aria-pressed={selectedTimeChoice === choice.id}
                        aria-label={choice.time ? `${choice.label} — ${choice.time}` : choice.label}
                        className={`min-h-20 rounded-2xl border p-3 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                          selectedTimeChoice === choice.id ? "border-tomato bg-tomato text-white shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30"
                        }`}
                      >
                        <span className="block text-sm font-extrabold">{choice.label}</span>
                        {choice.time && <span className={`mt-1 block text-xs font-bold ${selectedTimeChoice === choice.id ? "text-white/75" : "text-ink/45"}`}>{choice.time}</span>}
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
                  Target pizza time: {formatTargetTime(targetTimeDraft)}
                </p>
              )}
            </div>
          )}

          {step === "quantity" && (
            <div className="mx-auto max-w-md">
              <div className="flex items-center justify-center gap-5">
                <button type="button" onClick={() => setQuantity(Math.max(1, (session.pizzaCount ?? 4) - 1))} className="grid h-14 w-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato" aria-label="Decrease pizza count">−</button>
                <div className="min-w-24 text-center">
                  <div className="font-display text-7xl font-semibold leading-none text-tomato">{session.pizzaCount ?? 4}</div>
                  <div className="mt-1 text-sm font-extrabold text-ink">pizzas</div>
                </div>
                <button type="button" onClick={() => setQuantity(Math.min(24, (session.pizzaCount ?? 4) + 1))} className="grid h-14 w-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato" aria-label="Increase pizza count">+</button>
              </div>
              <div className="mt-8">
                <p className="text-sm font-extrabold text-ink">Quick picks</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setQuantity(amount)}
                      aria-pressed={(session.pizzaCount ?? 4) === amount}
                      className={`min-h-12 rounded-2xl border text-sm font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                        (session.pizzaCount ?? 4) === amount ? "border-tomato bg-tomato text-white" : "border-ink/10 bg-white text-ink/70"
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-6 block text-center text-xs font-extrabold text-ink/45">
                Custom amount
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={session.pizzaCount ?? 4}
                  onChange={(event) => setQuantity(Math.min(24, Math.max(1, Number(event.target.value) || 1)))}
                  className="mx-auto mt-2 h-12 w-24 rounded-2xl border border-ink/10 bg-white px-3 text-center text-lg font-extrabold text-ink outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20"
                  aria-label="Pizza count"
                />
              </label>
            </div>
          )}

          {step === "flour" && (
            <div className="grid gap-3">
              {flourOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => selectFlour(option.id)} aria-pressed={session.flour === option.id} className={`${optionClass(session.flour === option.id)} flex min-h-24 items-center gap-4`}>
                  {selectedIndicator(session.flour === option.id)}
                  <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cream text-3xl shadow-sm">{option.icon}</span>
                  <span className="block pr-8">
                    <span className="block text-lg font-extrabold">{option.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-ink/55">{option.description}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === "summary" && (
            <div className="grid gap-5">
              <dl className="grid gap-3">
                {[
                  ["Baking path", selectedStyle?.label ?? "Not selected yet"],
                  ["Pizza style", selectedWizardPreset?.label ?? selectedPreset?.name ?? "Not selected yet"],
                  ["When", formatTargetTime(session.targetEatTime)],
                  ["How many", `${session.pizzaCount ?? 4} pizzas`],
                  ["Flour", selectedFlour?.label ?? "Not sure yet"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4">
                    <dt className="flex items-center gap-3 text-sm font-extrabold text-ink/65">
                      <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-leaf text-xs text-white">✓</span>
                      {label}
                    </dt>
                    <dd className="text-right text-sm font-extrabold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-[1.5rem] bg-leaf/[.1] p-5">
                <h3 className="font-display text-2xl font-semibold">Next: build your dough plan</h3>
                <p className="mt-2 text-sm leading-6 text-ink/60">
                  We’ll calculate the dough amount, flour, water, salt, yeast and timing from your choices.
                </p>
                <div className="mt-4 grid gap-2 sm:max-w-sm">
                  <Link href="/session/recipe" className="rounded-2xl bg-tomato px-4 py-3 text-center text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Build my dough plan →
                  </Link>
                  <Link href={continueHref} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Save and continue later
                  </Link>
                </div>
                <p className="mt-4 text-xs font-bold text-ink/45">Last saved: {lastSaved}</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={backStep} disabled={step === "path"} className="min-h-12 rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/60 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
              Back
            </button>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs font-bold text-ink/40">Saved locally ✓</p>
              {step !== "summary" ? (
                <button type="button" onClick={continueStep} disabled={!canContinue} className="min-h-14 w-full rounded-2xl bg-tomato px-8 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:bg-ink/20 disabled:text-ink/40 sm:w-auto">
                  Continue →
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <footer className="opacity-70 lg:col-span-2">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
