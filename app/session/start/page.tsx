"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  type PizzaSessionRecipeParams,
  type PizzaSessionStep,
} from "@/lib/pizza-session";
import {
  createAndSavePizzaSession,
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
  setActivePizzaSession,
  updatePizzaSession,
} from "@/lib/pizza-session-storage";

type WizardStep = "style" | "time" | "quantity" | "oven" | "flour" | "summary";
type SessionStyle = "home-oven" | "pizza-oven" | "pan-tray";

const wizardSteps: WizardStep[] = ["style", "time", "quantity", "oven", "flour", "summary"];

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

const ovenOptions = [
  { id: "home", label: "Home oven", description: "Electric oven with a tray, stone or baking steel." },
  { id: "gas", label: "Pizza oven", description: "High-heat gas or outdoor pizza oven." },
  { id: "pan", label: "Pan / tray bake", description: "A pan-supported bake in an oven." },
  { id: "not-sure", label: "Not sure yet", description: "Keep the session flexible and decide later." },
] as const;

const flourOptions = [
  { id: "plain", label: "All-purpose / plain flour", description: "Easy to find. Best with moderate hydration." },
  { id: "bread", label: "Bread flour / strong flour", description: "Stronger gluten and a safer choice for longer rests." },
  { id: "tipo-00", label: "Pizza flour / tipo 00", description: "Designed for pizza, especially with hotter ovens." },
  { id: "not-sure", label: "Not sure yet", description: "You can choose the exact flour later in the calculator." },
] as const;

const levelCopy: Record<ExperienceLevel, Record<WizardStep, string>> = {
  beginner: {
    style: "Pick the pizza that feels closest to your plan. You can change details later.",
    time: "Choose when you want to eat or bake. A rough time is enough for now.",
    quantity: "Choose how many pizzas you want. Six small pizzas or one pan pizza are common starting points.",
    oven: "Choose the oven you will probably use. Not sure yet is okay.",
    flour: "Choose the closest flour. If you do not know, choose not sure yet.",
    summary: "Your first decisions are saved. Next, build the dough recipe or come back later.",
  },
  enthusiast: {
    style: "Style affects dough size, hydration, topping load and baking heat.",
    time: "Target time lets DoughTools later build a practical fermentation and baking schedule.",
    quantity: "Pizza count controls total dough, sauce, cheese and prep work.",
    oven: "Oven choice changes bake time, moisture tolerance and how much topping is safe.",
    flour: "Flour strength affects hydration, fermentation length and handling.",
    summary: "The session is ready for a recipe calculation and later timeline planning.",
  },
  pizza_nerd: {
    style: "This only sets the first planning direction. Deeper variables stay in the calculator and future labs.",
    time: "Later patches can derive fermentation steps from this target, but Patch 32 stores only the target safely.",
    quantity: "This becomes the first batch-size variable before exact dough-ball and formula tuning.",
    oven: "Heat transfer and bake duration are downstream constraints; exact temperatures remain in the tools.",
    flour: "This is a coarse flour class, not a W-value or protein analysis. Fine tuning remains available later.",
    summary: "The local session now has enough context to hand off to recipe calculation without changing formulas.",
  },
};

function stepToSessionStep(step: WizardStep): PizzaSessionStep {
  return step === "summary" ? "recipe" : step;
}

function styleToRecipeDefaults(style: string | undefined, pizzaCount: number | undefined, ovenType: string | undefined, flour: string | undefined): PizzaSessionRecipeParams {
  const count = pizzaCount && pizzaCount > 0 ? pizzaCount : style === "pan-tray" ? 1 : 6;
  const flourId = flour === "tipo-00" ? "caputo-pizzeria" : flour === "bread" ? "caputo-cuoco" : "caputo-pizzeria";

  if (style === "pan-tray") {
    return {
      balls: count,
      ballWeight: 650,
      waste: 3,
      hydration: 75,
      salt: 2.8,
      yeastType: "idy",
      fermentation: "48h-cold",
      temperature: 4,
      style: "pan",
      oven: "home",
      flour: flourId,
      pizzaStyle: "detroit",
    };
  }

  if (style === "pizza-oven" || ovenType === "gas") {
    return {
      balls: count,
      ballWeight: 260,
      waste: 3,
      hydration: 64,
      salt: 2.8,
      yeastType: "idy",
      fermentation: "12h-room",
      temperature: 22,
      style: "balanced",
      oven: "gas",
      flour: flourId,
      pizzaStyle: "neapolitan",
    };
  }

  return {
    balls: count,
    ballWeight: 270,
    waste: 3,
    hydration: 64,
    salt: 2.8,
    yeastType: "idy",
    fermentation: "24h-cold",
    temperature: 4,
    style: "balanced",
    oven: "home",
    flour: flourId,
    pizzaStyle: "new-york",
  };
}

function stepIndex(step: WizardStep) {
  return Math.max(0, wizardSteps.indexOf(step));
}

function initialWizardStep(session: PizzaSession): WizardStep {
  if (session.currentStep === "time") return "time";
  if (session.currentStep === "quantity") return "quantity";
  if (session.currentStep === "oven") return "oven";
  if (session.currentStep === "flour") return "flour";
  if (session.currentStep === "recipe") return "summary";
  return "style";
}

function optionClass(active: boolean) {
  return `min-h-24 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
    active ? "border-tomato bg-tomato/10 shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30"
  }`;
}

export default function StartPizzaSessionPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [step, setStep] = useState<WizardStep>("style");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
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
    setStep(initialWizardStep(nextSession));
    setReady(true);
  }, []);

  const experience = getExperienceLevelConfig(experienceLevel);
  const progress = stepIndex(step) + 1;

  const recipeParams = useMemo(
    () => styleToRecipeDefaults(session?.pizzaStyle, session?.pizzaCount, session?.ovenType, session?.flour),
    [session?.flour, session?.ovenType, session?.pizzaCount, session?.pizzaStyle],
  );
  const recipeQuery = new URLSearchParams(Object.entries(recipeParams).map(([key, value]) => [key, String(value)])).toString();

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
    savePatch({ pizzaStyle: value, ovenType, pizzaCount }, "style");
  };

  const selectOven = (ovenType: string) => savePatch({ ovenType }, "oven");
  const selectFlour = (flour: string) => savePatch({ flour }, "flour");
  const setQuantity = (pizzaCount: number) => savePatch({ pizzaCount }, "quantity");
  const setTargetTime = (targetEatTime: string) => savePatch({ targetEatTime }, "time");

  const goToStep = (nextStep: WizardStep) => {
    const targetEatTime = step === "time" ? targetTimeInputRef.current?.value ?? session?.targetEatTime : session?.targetEatTime;
    savePatch({
      targetEatTime,
      recipeParams: nextStep === "summary" ? recipeParams : session?.recipeParams,
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
  const selectedOven = ovenOptions.find((option) => option.id === session.ovenType);
  const selectedFlour = flourOptions.find((option) => option.id === session.flour);
  const lastSaved = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(session.lastSavedAt));
  const continueHref = pizzaSessionContinueHref({ ...session, recipeParams, currentStep: "recipe" });

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
                {index + 1}. {item === "summary" ? "Summary" : item[0].toUpperCase() + item.slice(1)}
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
                {step === "style" && "What pizza do you want to make?"}
                {step === "time" && "When do you want to eat or bake?"}
                {step === "quantity" && "How many pizzas?"}
                {step === "oven" && "What oven are you using?"}
                {step === "flour" && "What flour do you have?"}
                {step === "summary" && "Your Pizza Session is ready."}
              </h2>
            </div>
            <span className={`w-fit rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${experience.badgeClassName}`}>
              {experience.marker} {experience.label}
            </span>
          </div>

          {step === "style" && (
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

          {step === "time" && (
            <label className="block max-w-md text-sm font-extrabold text-ink/65">
              Target eating or baking time
              <input
                ref={targetTimeInputRef}
                type="datetime-local"
                value={session.targetEatTime ?? ""}
                onChange={(event) => setTargetTime(event.target.value)}
                className="mt-3 h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-bold text-ink outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20"
              />
              <span className="mt-3 block text-xs font-normal leading-5 text-ink/45">
                A rough time is enough. Later planner patches can turn this into a full timeline.
              </span>
            </label>
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

          {step === "oven" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {ovenOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => selectOven(option.id)} aria-pressed={session.ovenType === option.id} className={optionClass(session.ovenType === option.id)}>
                  <span className="block text-lg font-extrabold">{option.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink/55">{option.description}</span>
                  {session.ovenType === option.id && <span className="mt-3 block text-xs font-extrabold text-tomato">Selected</span>}
                </button>
              ))}
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
                  ["Style", selectedStyle?.label ?? "Not selected yet"],
                  ["Target time", session.targetEatTime || "Not set yet"],
                  ["Pizza count", `${session.pizzaCount ?? 6}`],
                  ["Oven", selectedOven?.label ?? "Not sure yet"],
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
                  Build the dough recipe from this starting setup. Timeline, shopping list and kitchen mode will come later.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Link href={`/?${recipeQuery}`} className="rounded-2xl bg-tomato px-4 py-3 text-center text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Build recipe →
                  </Link>
                  <Link href={`/plan?${recipeQuery}`} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Plan timeline →
                  </Link>
                  <Link href={continueHref} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center text-sm font-extrabold text-ink/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                    Continue later
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={backStep} disabled={step === "style"} className="min-h-12 rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/60 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
              Back
            </button>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-xs font-bold text-ink/40">Last saved: {lastSaved}</p>
              {step !== "summary" ? (
                <button type="button" onClick={continueStep} className="min-h-12 rounded-2xl bg-ink px-6 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white">
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
