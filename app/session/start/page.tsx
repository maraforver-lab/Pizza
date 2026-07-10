"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import {
  clearCloudBackedActivePizzaSessionPointer,
  saveCloudActivePizzaSession,
} from "@/lib/cloud-pizza-session-client";
import { normalizeCloudPizzaSessionRow } from "@/lib/cloud-pizza-sessions";
import { restoreCloudPizzaSessionToLocal } from "@/lib/cloud-pizza-session-restore";
import {
  getExperienceLevelCornerAccentStyle,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import {
  type PizzaSessionDoughStartMode,
  type PizzaSessionFlourSituation,
  type PizzaSessionFlourWRange,
  type PizzaSession,
  type PizzaSessionStep,
} from "@/lib/pizza-session";
import {
  buildPizzaSessionTargetTime,
  getDefaultPizzaSessionTargetTime,
  getPizzaSessionDayQuickChoices,
  pizzaSessionTimeQuickChoices,
  type PizzaSessionDayQuickChoiceId,
  type PizzaSessionTimeQuickChoiceId,
} from "@/lib/session-time-quick-choices";
import {
  clearActivePizzaSession,
  createAndSavePizzaSession,
  getActivePizzaSession,
  PIZZA_SESSION_LOCAL_ONLY_COPY,
  setActivePizzaSession,
  updatePizzaSession,
} from "@/lib/pizza-session-storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_SESSION_YEAST_TYPE, normalizeSessionYeastType, sessionYeastTypeOptions } from "@/lib/yeast-types";

type WizardStep = "path" | "preset" | "time" | "quantity" | "flour" | "summary";
type SessionStyle = "home-oven" | "pizza-oven" | "pan-tray" | "not-sure";

const wizardSteps: WizardStep[] = ["path", "preset", "time", "quantity", "flour", "summary"];
const DEFAULT_SESSION_TOPPING_PRESET = "margherita";

const journeySteps = [
  { label: "Oven", href: "/session/start?step=path", phase: "Setup" },
  { label: "Pizza style", href: "/session/start?step=preset", phase: "Setup" },
  { label: "When", href: "/session/start?step=time", phase: "Setup" },
  { label: "Quantity", href: "/session/start?step=quantity", phase: "Setup" },
  { label: "Flour situation", href: "/session/start?step=flour", phase: "Setup" },
  { label: "Dough Plan", href: "/session/recipe", phase: "Plan" },
  { label: "Choose pizzas & Shopping", href: "/session/shopping", phase: "Prepare" },
  { label: "Timeline", href: "/session/timeline", phase: "Plan" },
  { label: "Kitchen Mode", href: "/session/kitchen", phase: "Bake" },
  { label: "Review", href: "/session/review", phase: "Improve" },
] as const;

const styleOptions = [
  {
    id: "pizza-oven",
    label: "Pizza oven",
    icon: "◠",
    description: "Use a high-heat pizza oven like Ooni, Gozney or similar.",
    badge: "Most popular",
  },
  {
    id: "home-oven",
    label: "Home oven",
    icon: "▤",
    description: "Use a normal home oven with a tray, stone or steel.",
    badge: undefined,
  },
] as const;

const sessionStyleLabels: Record<string, string> = {
  "home-oven": "Home oven",
  "pizza-oven": "Pizza oven",
  "pan-tray": "Pan / tray",
};

const DEFAULT_SESSION_FORMULA_FLOUR = "tipo-00";

const flourSituationOptions: Array<{
  id: PizzaSessionFlourSituation;
  label: string;
  icon: string;
  description: string;
}> = [
  { id: "recommend", label: "No, recommend what to buy", icon: "🛒", description: "DoughTools can suggest a flour strength later." },
];

const flourWRangeOptions: Array<{
  id: PizzaSessionFlourWRange;
  label: string;
  icon: string;
  description: string;
}> = [
  { id: "w_180_220", label: "W 180–220", icon: "▣", description: "Short same-day doughs." },
  { id: "w_220_260", label: "W 220–260", icon: "▣", description: "Short to 24h fermentation." },
  { id: "w_260_300", label: "W 260–300", icon: "▥", description: "Good for 24–48h cold fermentation." },
  { id: "w_300_340", label: "W 300–340", icon: "▥", description: "Good for 48–72h cold fermentation." },
  { id: "w_340_plus", label: "W 340+", icon: "◒", description: "Very strong flour, use with caution." },
] as const;

const doughStartOptions: Array<{
  id: PizzaSessionDoughStartMode;
  label: string;
  description: string;
}> = [
  { id: "now", label: "Start now", description: "I can make the dough as soon as the plan is ready." },
  { id: "later", label: "Later", description: "I can only start after a specific date and time." },
  { id: "recommend", label: "Let DoughTools recommend", description: "Use the bake time to suggest the best start window." },
];

const DOUGH_BALL_WEIGHT_OPTIONS = [220, 240, 260, 280, 300] as const;
const MIN_DOUGH_BALL_WEIGHT = 180;
const MAX_DOUGH_BALL_WEIGHT = 350;
const SIMPLE_SESSION_DOUGH_BALL_WEIGHT = 260;

const doughBallWeightGuidance: Record<typeof DOUGH_BALL_WEIGHT_OPTIONS[number], {
  pizzaSize: string;
  bestFor: string;
  reason: string;
  visual: string;
}> = {
  220: {
    pizzaSize: "Smaller pizza",
    bestFor: "lighter appetite or smaller home setups",
    reason: "Easier to handle and stretch.",
    visual: "◔",
  },
  240: {
    pizzaSize: "Balanced small",
    bestFor: "making several pizzas",
    reason: "Still light, with enough rim to feel satisfying.",
    visual: "◑",
  },
  260: {
    pizzaSize: "About 30–32 cm",
    bestFor: "classic Neapolitan-style balance",
    reason: "A strong default for most sessions.",
    visual: "◕",
  },
  280: {
    pizzaSize: "Larger pizza",
    bestFor: "bigger appetite or larger oven space",
    reason: "More generous crust and center.",
    visual: "●",
  },
  300: {
    pizzaSize: "Large pizza",
    bestFor: "very filling pizzas",
    reason: "Needs more stretching room and oven capacity.",
    visual: "⬤",
  },
};

const doughStyleOptions = [
  {
    id: "neapolitan-style",
    label: "Neapolitan-style",
    icon: "◠",
    description: "Thin pizza with an airy rim. V1 plans this style for home ovens and pizza ovens.",
  },
] as const;

const wizardStepLabels: Record<WizardStep, string> = {
  path: "Oven",
  preset: "Pizza style",
  time: "When",
  quantity: "Quantity",
  flour: "Flour situation",
  summary: "Setup ready",
};

const wizardStepQuestions: Record<WizardStep, string> = {
  path: "Choose your oven",
  preset: "Choose your pizza style",
  time: "When do you want pizza?",
  quantity: "How many pizzas?",
  flour: "Do you already have flour?",
  summary: "You’re ready for your Dough Plan.",
};

const wizardStepHelpers: Record<WizardStep, string> = {
  path: "Choose the oven setup for this Dough Plan.",
  preset: "DoughTools currently plans Neapolitan-style pizza for home ovens and pizza ovens. Toppings are chosen later for the shopping list.",
  time: "We’ll work backwards and build the right timeline.",
  quantity: "We’ll calculate the right amount of dough.",
  flour: "DoughTools can recommend what to buy, or use the W-value range of the flour you already have.",
  summary: "You chose the key setup details. Next, DoughTools turns them into a personalized Dough Plan and ingredient amounts.",
};

const levelCopy: Record<ExperienceLevel, Record<WizardStep, string>> = {
  beginner: {
    path: "We’ll build your Dough Plan step by step.",
    preset: "Start with the dough style. Toppings come later when you build the shopping list.",
    time: "Pick the time you want pizza. DoughTools will plan backwards from there.",
    quantity: "Choose a simple number. You can tune exact dough size later.",
    flour: "If you do not know the W-value, choose recommend what to buy. DoughTools can still keep going safely.",
    summary: "Your first decisions are saved. Next, build the Dough Plan.",
  },
  enthusiast: {
    path: "The baking path controls bake heat, dough size and how forgiving the process should be.",
    preset: "This keeps dough style separate from topping choices so fermentation and flour guidance stay clean.",
    time: "We’ll plan dough, preparation and bake steps backwards from this time.",
    quantity: "Pizza count controls total dough, sauce, cheese and prep work.",
    flour: "W-value range gives a practical flour-strength signal for fermentation planning.",
    summary: "The session is ready for a Dough Plan, Shopping list and Timeline.",
  },
  pizza_nerd: {
    path: "This sets the first bake-environment constraint. The exact formula still comes from the calculator model.",
    preset: "V1 uses a Neapolitan-style dough assumption while legacy topping preset storage remains compatibility data for Shopping.",
    time: "Pick the target pizza time. Timeline steps are rounded to practical 15-minute increments; active night tasks are avoided where possible while passive fermentation can continue overnight.",
    quantity: "This becomes the first batch-size variable before exact dough-ball and formula tuning.",
    flour: "Capture the flour W-range now. Formula calculations still use the legacy flour default until a later planning patch consumes these ranges.",
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

function journeyProgressForStep(step: WizardStep) {
  return step === "summary" ? 6 : stepIndex(step) + 1;
}

function journeyStepState(index: number, currentJourneyStep: number) {
  if (index + 1 < currentJourneyStep) return "complete";
  if (index + 1 === currentJourneyStep) return "current";
  return "upcoming";
}

function initialWizardStep(session: PizzaSession): WizardStep {
  if (session.currentStep === "style") return "path";
  if (session.currentStep === "time") return "time";
  if (session.currentStep === "quantity") return "quantity";
  if (session.currentStep === "oven") return "flour";
  if (session.currentStep === "flour") return "flour";
  if (session.currentStep === "recipe") return "summary";
  if (session.pizzaStyle && !session.pizzaPreset) return "preset";
  return "path";
}

function wizardStepFromQuery(value: string | null): WizardStep | undefined {
  if (!value) return undefined;
  return wizardSteps.includes(value as WizardStep) && value !== "summary" ? value as WizardStep : undefined;
}

function wizardStepHref(step: WizardStep) {
  return `/session/start?step=${step}`;
}

function optionClass(active: boolean, density: "default" | "compact" = "default") {
  const sizeClass = density === "compact"
    ? "min-h-[6.75rem] rounded-[1rem] p-2.5 sm:min-h-[7rem] sm:rounded-[1.1rem] sm:p-3"
    : "grid min-h-[4rem] grid-cols-[auto_1fr] items-start gap-2.5 rounded-[1.1rem] p-3 sm:block sm:min-h-[7rem] sm:rounded-[1.25rem] sm:p-4";
  return `relative border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${sizeClass} ${
    active ? "border-tomato bg-tomato/[.06] shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30 hover:shadow-sm"
  }`;
}

function selectedIndicator(active: boolean) {
  return (
    <span
      aria-hidden="true"
      className={`absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full border text-[0.65rem] font-black ${
        active ? "border-tomato bg-tomato text-white" : "border-ink/15 bg-white text-transparent"
      }`}
    >
      ✓
    </span>
  );
}

function iconBadge(icon: string, density: "default" | "compact" = "default") {
  return (
    <span aria-hidden="true" className={density === "compact" ? "mb-2 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cream text-lg shadow-sm sm:h-9 sm:w-9 sm:text-xl" : "grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cream text-lg shadow-sm sm:mb-3 sm:h-11 sm:w-11 sm:text-2xl"}>
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

function formatTargetDate(value?: string) {
  if (!value) return "Not set yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set yet";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTargetClockTime(value?: string) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSetupSummaryTime(value?: string) {
  if (!value) return "Not set yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set yet";
  const showYear = date.getFullYear() !== new Date().getFullYear();
  const dateText = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(showYear ? { year: "numeric" } : {}),
  }).format(date).replace(",", "");
  const timeText = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${dateText} · ${timeText}`;
}

function doughStartModeLabel(mode?: PizzaSessionDoughStartMode) {
  if (mode === "now") return "Start now";
  if (mode === "later") return "Later";
  return "Let DoughTools recommend";
}

function formatDoughStartPreference(session: PizzaSession) {
  const mode = session.doughStartMode ?? "recommend";
  if (mode === "later") {
    return session.doughEarliestStartTime
      ? `Later · ${formatSetupSummaryTime(session.doughEarliestStartTime)}`
      : "Later · time not set";
  }
  return doughStartModeLabel(mode);
}

function defaultDoughBallWeight(session: PizzaSession) {
  if (session.pizzaStyle === "pan-tray" || session.ovenType === "pan") return 650;
  if (session.pizzaStyle === "pizza-oven" || session.ovenType === "gas") return 260;
  return 270;
}

function effectiveDoughBallWeight(session: PizzaSession) {
  return session.doughBallWeight ?? defaultDoughBallWeight(session);
}

function shouldShowPizzaNerdDoughControls(level: ExperienceLevel) {
  return level === "pizza_nerd";
}

function simpleDoughDefaultsPatchForLevel(level: ExperienceLevel, session: PizzaSession): Partial<PizzaSession> {
  if (shouldShowPizzaNerdDoughControls(level)) return {};
  return {
    ...(session.doughBallWeight !== SIMPLE_SESSION_DOUGH_BALL_WEIGHT
      ? { doughBallWeight: SIMPLE_SESSION_DOUGH_BALL_WEIGHT }
      : {}),
    ...(session.yeastType !== DEFAULT_SESSION_YEAST_TYPE
      ? { yeastType: DEFAULT_SESSION_YEAST_TYPE }
      : {}),
  };
}

function validRoundDoughBallWeight(value: number) {
  return Number.isFinite(value) && value >= MIN_DOUGH_BALL_WEIGHT && value <= MAX_DOUGH_BALL_WEIGHT;
}

function validSessionDoughBallWeight(session: PizzaSession) {
  const weight = effectiveDoughBallWeight(session);
  if (session.pizzaStyle === "pan-tray" || session.ovenType === "pan") return weight === 650;
  return validRoundDoughBallWeight(weight);
}

function formatFlourSituationSummary(session: PizzaSession) {
  if (session.flourSituation === "recommend") return "Recommend what to buy";
  if (session.availableFlourWRanges?.length) {
    return session.availableFlourWRanges
      .map((range) => flourWRangeOptions.find((option) => option.id === range)?.label)
      .filter(Boolean)
      .join(", ");
  }
  if (session.flour) return "Legacy flour choice saved";
  return "Not selected yet";
}

function isValidTargetTime(value?: string) {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()));
}

function StartPizzaSessionLoading() {
  return (
    <main className="min-h-screen bg-cream px-4 py-10 text-ink">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
        Loading your local pizza session…
      </div>
    </main>
  );
}

function StartPizzaSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [step, setStep] = useState<WizardStep>("path");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const [targetTimeDraft, setTargetTimeDraft] = useState("");
  const [customDoughBallWeightDraft, setCustomDoughBallWeightDraft] = useState("");
  const [selectedDayChoice, setSelectedDayChoice] = useState<PizzaSessionDayQuickChoiceId | undefined>();
  const [selectedTimeChoice, setSelectedTimeChoice] = useState<PizzaSessionTimeQuickChoiceId | undefined>();
  const targetTimeInputRef = useRef<HTMLInputElement>(null);
  const doughStartTimeInputRef = useRef<HTMLInputElement>(null);
  const lastCloudSaveKey = useRef("");

  useEffect(() => {
    document.documentElement.lang = "en";
    let mounted = true;

    async function loadInitialSession() {
      const preferredLevel = readExperienceLevelPreference();
      const query = new URLSearchParams(window.location.search);
      const shouldStartNewSession = query.get("new") === "1";
      const shouldPreserveLocalHandoff = query.get("handoff") === "1";
      if (shouldStartNewSession) {
        clearActivePizzaSession();
      }

      let active = shouldStartNewSession ? undefined : getActivePizzaSession();
      if (!shouldStartNewSession && !shouldPreserveLocalHandoff) {
        try {
          const supabase = getSupabaseBrowserClient();
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const response = await fetch("/api/pizza-sessions/active", { method: "GET" });
            if (response.ok) {
              const payload = await response.json().catch(() => ({}));
              const row = normalizeCloudPizzaSessionRow(payload.session);
              if (row) {
                active = restoreCloudPizzaSessionToLocal(row);
              } else {
                clearCloudBackedActivePizzaSessionPointer();
                active = undefined;
              }
            }
          }
        } catch {
          // Fall back to the browser-local guest flow if account lookup is unavailable.
        }
      }

      const baseSession = active ?? createAndSavePizzaSession({
        status: "planning",
        currentStep: "style",
        experienceLevel: preferredLevel,
        pizzaStyle: "pizza-oven",
        ovenType: "gas",
        pizzaPreset: DEFAULT_SESSION_TOPPING_PRESET,
        pizzaCount: 4,
        flourSituation: "recommend",
        flour: DEFAULT_SESSION_FORMULA_FLOUR,
      });
      const sessionLevel = baseSession.experienceLevel;
      const hasSavedTargetTime = isValidTargetTime(baseSession.targetEatTime);
      const defaultTargetEatTime = getDefaultPizzaSessionTargetTime();
      const nextSession = hasSavedTargetTime
        ? baseSession
        : updatePizzaSession(baseSession.id, {
          targetEatTime: defaultTargetEatTime,
          status: "planning",
          currentStep: baseSession.currentStep,
          experienceLevel: sessionLevel,
        }) ?? { ...baseSession, targetEatTime: defaultTargetEatTime };

      const supportedSession = nextSession.pizzaStyle === "not-sure" || nextSession.flour === "not-sure" || nextSession.flourSituation === "unknown_w"
        ? updatePizzaSession(nextSession.id, {
          ...(nextSession.pizzaStyle === "not-sure" ? { pizzaStyle: "pizza-oven", ovenType: "gas" } : {}),
          ...(nextSession.flour === "not-sure" ? { flour: "tipo-00" } : {}),
          ...(nextSession.flourSituation === "unknown_w" ? { flourSituation: "recommend" as const } : {}),
          status: "planning",
          currentStep: nextSession.currentStep,
          experienceLevel: sessionLevel,
        }) ?? {
          ...nextSession,
          ...(nextSession.pizzaStyle === "not-sure" ? { pizzaStyle: "pizza-oven", ovenType: "gas" } : {}),
          ...(nextSession.flour === "not-sure" ? { flour: "tipo-00" } : {}),
          ...(nextSession.flourSituation === "unknown_w" ? { flourSituation: "recommend" as const } : {}),
        }
        : nextSession;

      const simpleDefaultsPatch = simpleDoughDefaultsPatchForLevel(sessionLevel, supportedSession);
      const experienceScopedSession = Object.keys(simpleDefaultsPatch).length
        ? updatePizzaSession(supportedSession.id, {
          ...simpleDefaultsPatch,
          status: "planning",
          currentStep: supportedSession.currentStep,
          experienceLevel: sessionLevel,
        }) ?? {
          ...supportedSession,
          ...simpleDefaultsPatch,
          experienceLevel: sessionLevel,
        }
        : supportedSession;

      if (!mounted) return;
      setActivePizzaSession(experienceScopedSession.id);
      setExperienceLevel(sessionLevel);
      setSession(experienceScopedSession);
      setTargetTimeDraft(experienceScopedSession.targetEatTime ?? "");
      setCustomDoughBallWeightDraft(String(effectiveDoughBallWeight(experienceScopedSession)));
      if (hasSavedTargetTime) {
        setSelectedDayChoice("custom-date");
        setSelectedTimeChoice("custom-time");
      } else {
        setSelectedDayChoice("tomorrow");
        setSelectedTimeChoice("dinner");
      }
      const requestedStep = wizardStepFromQuery(query.get("step"));
      setStep(requestedStep ?? initialWizardStep(experienceScopedSession));
      setReady(true);
    }

    void loadInitialSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const requestedStep = wizardStepFromQuery(searchParams.get("step"));
    if (requestedStep) {
      setStep((currentStep) => requestedStep === currentStep ? currentStep : requestedStep);
    }
  }, [ready, searchParams]);

  useEffect(() => {
    if (!ready || !session) return;
    const cloudSaveKey = [
      session.id,
      session.currentStep,
      session.status,
      session.updatedAt,
      session.lastSavedAt,
    ].join(":");
    if (lastCloudSaveKey.current === cloudSaveKey) return;
    lastCloudSaveKey.current = cloudSaveKey;
    void saveCloudActivePizzaSession(session).catch(() => {
      // Keep the local guest/session flow usable if account sync is unavailable.
    });
  }, [ready, session]);

  const progress = stepIndex(step) + 1;
  const journeyProgress = journeyProgressForStep(step);
  const setupPercent = Math.round((progress / wizardSteps.length) * 100);
  const journeyPercent = Math.round((journeyProgress / journeySteps.length) * 100);
  const setupProgress = step === "summary" ? wizardSteps.length : progress;

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
    if (!session?.doughBallWeight) {
      setCustomDoughBallWeightDraft(String(value === "pizza-oven" ? 260 : value === "pan-tray" ? 650 : 270));
    }
    savePatch({ pizzaStyle: value, ovenType, pizzaCount }, "path");
  };

  const selectDoughStyle = () => {
    // Keep legacy topping preset storage populated for old sessions while
    // Shopping owns the actual pizza mix allocation.
    savePatch({ pizzaPreset: session?.pizzaPreset ?? DEFAULT_SESSION_TOPPING_PRESET }, "preset");
  };
  const selectFlourSituation = (flourSituation: PizzaSessionFlourSituation) => {
    savePatch({
      flourSituation,
      availableFlourWRanges: undefined,
      flour: session?.flour ?? DEFAULT_SESSION_FORMULA_FLOUR,
    }, "flour");
  };
  const toggleFlourWRange = (range: PizzaSessionFlourWRange) => {
    const current = session?.availableFlourWRanges ?? [];
    const nextRanges = current.includes(range)
      ? current.filter((item) => item !== range)
      : [...current, range];
    savePatch({
      flourSituation: nextRanges.length ? "has_w_range" : undefined,
      availableFlourWRanges: nextRanges.length ? nextRanges : undefined,
      flour: session?.flour ?? DEFAULT_SESSION_FORMULA_FLOUR,
    }, "flour");
  };
  const setQuantity = (pizzaCount: number) => savePatch({ pizzaCount }, "quantity");
  const setDoughBallWeight = (doughBallWeight: number) => {
    if (!validRoundDoughBallWeight(doughBallWeight)) return;
    setCustomDoughBallWeightDraft(String(doughBallWeight));
    savePatch({ doughBallWeight }, "quantity");
  };
  const setYeastType = (yeastType: PizzaSession["yeastType"]) => {
    savePatch({ yeastType: normalizeSessionYeastType(yeastType) }, "quantity");
  };
  const commitCustomDoughBallWeight = () => {
    if (!session) return;
    const parsed = Number(customDoughBallWeightDraft);
    if (validRoundDoughBallWeight(parsed)) {
      setDoughBallWeight(Math.round(parsed));
      return;
    }
    setCustomDoughBallWeightDraft(String(effectiveDoughBallWeight(session)));
  };
  const setTargetTime = (targetEatTime: string) => {
    setTargetTimeDraft(targetEatTime);
    savePatch({ targetEatTime }, "time");
  };

  const setDoughStartMode = (doughStartMode: PizzaSessionDoughStartMode) => {
    savePatch({
      doughStartMode,
      doughEarliestStartTime: doughStartMode === "later" ? session?.doughEarliestStartTime : undefined,
    }, "time");
  };

  const setDoughEarliestStartTime = (doughEarliestStartTime: string) => {
    savePatch({ doughStartMode: "later", doughEarliestStartTime }, "time");
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
    const patch: Partial<Omit<PizzaSession, "id" | "schemaVersion" | "createdAt">> = {
      targetEatTime,
    };
    if (step === "time") {
      const doughStartMode = session?.doughStartMode ?? "recommend";
      patch.doughStartMode = doughStartMode;
      patch.doughEarliestStartTime = doughStartMode === "later"
        ? doughStartTimeInputRef.current?.value || session?.doughEarliestStartTime
        : undefined;
    }
    savePatch(patch, nextStep);
    setStep(nextStep);
    router.replace(wizardStepHref(nextStep), { scroll: false });
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

  const selectedDoughBallWeight = session ? effectiveDoughBallWeight(session) : 270;
  const selectedYeastType = normalizeSessionYeastType(session?.yeastType);
  const customDoughBallWeightNumber = Number(customDoughBallWeightDraft);
  const customDoughBallWeightInvalid = Boolean(customDoughBallWeightDraft)
    && session?.pizzaStyle !== "pan-tray"
    && session?.ovenType !== "pan"
    && !validRoundDoughBallWeight(customDoughBallWeightNumber);
  const canContinue =
    (step === "path" && Boolean(session?.pizzaStyle))
    || (step === "preset" && Boolean(session?.pizzaPreset))
    || (step === "time" && Boolean(targetTimeDraft || session?.targetEatTime) && ((session?.doughStartMode ?? "recommend") !== "later" || Boolean(session?.doughEarliestStartTime)))
    || (step === "quantity" && Boolean(session?.pizzaCount) && Boolean(session && validSessionDoughBallWeight(session)) && !customDoughBallWeightInvalid)
    || (step === "flour" && Boolean(session?.flour || session?.flourSituation || session?.availableFlourWRanges?.length))
    || step === "summary";

  if (!ready || !session) {
    return <StartPizzaSessionLoading />;
  }

  const selectedOvenLabel = session.pizzaStyle ? sessionStyleLabels[session.pizzaStyle] : undefined;
  const hasSelectedDoughStyle = Boolean(session.pizzaPreset);
  const flourSummary = formatFlourSituationSummary(session);
  const dayChoices = getPizzaSessionDayQuickChoices();
  const showCustomTargetInput = selectedDayChoice === "custom-date" || selectedTimeChoice === "custom-time";
  const activeDoughStartMode = session.doughStartMode ?? "recommend";
  const levelMainAccent = getExperienceLevelCornerAccentStyle(experienceLevel);
  const showPizzaNerdDoughControls = shouldShowPizzaNerdDoughControls(experienceLevel);
  const setupSummaryCards = [
    { label: "Oven", value: selectedOvenLabel ?? "Not selected yet", icon: "🔥" },
    { label: "Style", value: hasSelectedDoughStyle ? "Neapolitan-style" : "Not selected yet", icon: "🍕" },
    { label: "When", value: formatSetupSummaryTime(session.targetEatTime), icon: "🕒" },
    { label: "Dough start", value: formatDoughStartPreference(session), icon: "⏱" },
    { label: "Quantity", value: `${session.pizzaCount ?? 4} pizzas · ${selectedDoughBallWeight} g each`, icon: "◌" },
    { label: "Flour situation", value: flourSummary, icon: "▣" },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(226,71,38,0.10),transparent_32rem),linear-gradient(135deg,#f7f0e4,#fffaf2_45%,#f4eadc)] px-4 py-4 pb-16 text-ink sm:px-6 sm:py-6">
      <SessionViewportReset watchKey={step} />
      <header className="mx-auto mb-4 flex max-w-6xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 text-sm font-extrabold" aria-label="DoughTools home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-sm">○</span>
          <span className="text-lg">Dough<span className="text-tomato">Tools</span></span>
        </Link>
        <Link href="/account" className="rounded-full border border-ink/10 bg-white/80 px-4 py-3 text-xs font-extrabold text-ink/70 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
          Sign in
        </Link>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden rounded-[1.75rem] border border-white/80 bg-white/75 p-4 shadow-card backdrop-blur lg:sticky lg:top-5 lg:block lg:self-start">
          <h1 className="font-display text-3xl font-semibold leading-none">Set up your pizza session.</h1>
          <p className="mt-3 text-sm leading-5 text-ink/55">First choose the basics. Dough Plan, pizza choices, Shopping, Timeline, Kitchen Mode and Review come next.</p>
          <div className="mt-4 rounded-2xl border border-ink/10 bg-white p-3">
            <div className="flex items-center justify-between text-xs font-extrabold text-ink/65">
              <span>{step === "summary" ? "Setup ready" : `Step ${journeyProgress} of ${journeySteps.length}`}</span>
              <span>{journeyPercent}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-leaf transition-all" style={{ width: `${journeyPercent}%` }} />
            </div>
            <p className="mt-2 text-[11px] font-bold text-ink/45">Setup is steps 1–5 of the full pizza journey.</p>
          </div>
          <ol className="mt-5 grid gap-1.5" aria-label="Pizza Session journey">
            {journeySteps.map((item, index) => {
              const state = journeyStepState(index, journeyProgress);
              const canNavigate = state === "complete";
              const content = (
                <>
                  <span className="sr-only">{state === "current" ? "Current journey step: " : state === "complete" ? "Completed journey step: " : "Upcoming journey step: "}</span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full ${state === "current" ? "bg-white text-ink" : state === "complete" ? "bg-leaf text-white" : "bg-ink/10 text-ink/45"}`}>
                    {state === "complete" ? "✓" : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{item.label}</span>
                    <span className={`block text-[10px] ${state === "current" ? "text-white/55" : "text-ink/35"}`}>{item.phase}</span>
                  </span>
                </>
              );
              const className = `flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold ${state === "current" ? "bg-ink text-white" : state === "complete" ? "bg-leaf/10 text-leaf" : "bg-ink/[.04] text-ink/45"}`;
              return (
                <li key={item.label}>
                  {canNavigate ? (
                    index < wizardSteps.length ? (
                      <button type="button" onClick={() => goToStep(wizardSteps[index])} className={`${className} w-full cursor-pointer transition hover:bg-leaf/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream`} aria-label={`Go to ${item.label}`}>
                        {content}
                      </button>
                    ) : (
                      <Link href={item.href} className={`${className} cursor-pointer transition hover:bg-leaf/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream`} aria-label={`Go to ${item.label}`}>
                        {content}
                      </Link>
                    )
                  ) : (
                    <div className={`${className} cursor-default select-none`} aria-current={state === "current" ? "step" : undefined} aria-disabled={state === "upcoming" ? true : undefined}>
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="mt-5 rounded-2xl bg-cream/70 p-3 text-xs leading-5 text-ink/50">
            <strong className="block text-sm text-ink">You can change anything later. No worries!</strong>
            <span className="mt-2 block">{PIZZA_SESSION_LOCAL_ONLY_COPY}</span>
            <span className="mt-1 block">No cloud sync.</span>
          </div>
        </aside>

        <section
          className="min-w-0 rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card backdrop-blur sm:p-6 lg:rounded-[2rem]"
          style={levelMainAccent}
          aria-live="polite"
        >
          <div className="mb-3 lg:hidden">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[.18em] text-tomato">
              <span>{step === "summary" ? "Setup ready" : `Setup step ${setupProgress} of ${wizardSteps.length}`}</span>
            </div>
            <div className="mt-2 flex gap-1.5" aria-label="Pizza Session setup progress">
              {wizardSteps.map((item, index) => (
                <span
                  key={item}
                  className={`h-2 flex-1 rounded-full ${index + 1 === setupProgress ? "bg-tomato" : index + 1 < setupProgress ? "bg-tomato/45" : "bg-ink/12"}`}
                  aria-label={`${index + 1}. ${wizardStepLabels[item]}`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] font-bold normal-case tracking-normal text-ink/40">{setupPercent}% setup complete. Dough Plan next.</p>
          </div>

          <div className="mb-4 flex flex-col gap-3 pb-1 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-semibold leading-none sm:text-4xl">
                {wizardStepQuestions[step]}
              </h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-ink/60 sm:mt-3 sm:text-sm">{wizardStepHelpers[step]}</p>
            </div>
            {step === "time" && targetTimeDraft && (
              <div className="w-full rounded-2xl border border-leaf/15 bg-leaf/[.07] px-4 py-3 text-left shadow-sm sm:w-auto sm:min-w-48 sm:text-right" aria-live="polite">
                <p className="text-[0.65rem] font-black uppercase tracking-[.16em] text-leaf/75">Target pizza time</p>
                <p className="mt-1 text-sm font-extrabold leading-5 text-ink">{formatTargetDate(targetTimeDraft)}</p>
                <p className="font-display text-2xl font-semibold leading-none text-leaf">{formatTargetClockTime(targetTimeDraft)}</p>
              </div>
            )}
          </div>

          {step === "path" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {styleOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => selectStyle(option.id)} aria-pressed={session.pizzaStyle === option.id} className={optionClass(session.pizzaStyle === option.id)}>
                  {selectedIndicator(session.pizzaStyle === option.id)}
                  {iconBadge(option.icon)}
                  <span className="col-start-2 block pr-8 text-sm font-extrabold sm:col-auto sm:text-lg">{option.label}</span>
                  <span className="col-start-2 mt-0.5 block text-xs leading-4 text-ink/55 sm:col-auto sm:mt-1 sm:text-sm sm:leading-5">{option.description}</span>
                  {option.badge && <span className="col-start-2 mt-1.5 inline-flex w-fit rounded-full bg-tomato/10 px-2.5 py-1 text-[11px] font-extrabold text-tomato sm:col-auto sm:mt-2 sm:text-xs">{option.badge}</span>}
                  {session.pizzaStyle === option.id && <span className="col-start-2 mt-1.5 block text-xs font-extrabold uppercase tracking-[.14em] text-tomato sm:col-auto sm:mt-2">Selected</span>}
                </button>
              ))}
            </div>
          )}

          {step === "preset" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {doughStyleOptions.map((option) => (
                <button key={option.id} type="button" onClick={selectDoughStyle} aria-pressed={hasSelectedDoughStyle} className={optionClass(hasSelectedDoughStyle)}>
                  {selectedIndicator(hasSelectedDoughStyle)}
                  {iconBadge(option.icon)}
                  <span className="col-start-2 block pr-8 text-sm font-extrabold sm:col-auto sm:text-lg">{option.label}</span>
                  <span className="col-start-2 mt-0.5 block text-xs leading-4 text-ink/55 sm:col-auto sm:mt-1 sm:text-sm sm:leading-5">{option.description}</span>
                  {hasSelectedDoughStyle && <span className="col-start-2 mt-1.5 block text-xs font-extrabold uppercase tracking-[.14em] text-tomato sm:col-auto sm:mt-2">Selected</span>}
                </button>
              ))}
              <div className="rounded-[1.1rem] border border-dashed border-ink/15 bg-cream/60 p-3 text-xs leading-5 text-ink/55 sm:p-4 sm:text-sm">
                <strong className="block text-ink">Toppings come later.</strong>
                This step chooses the dough style. You’ll allocate toppings and pizza types later in Shopping.
              </div>
            </div>
          )}

          {step === "time" && (
            <div className="grid gap-4">
              <p className="max-w-2xl text-xs leading-5 text-ink/60 sm:text-sm">
                Choose a target pizza time. DoughTools will build your dough, preparation and bake timeline backwards from this.
              </p>

              <section aria-labelledby="session-day-choice-heading">
                <h3 id="session-day-choice-heading" className="text-sm font-extrabold text-ink">Pick a day</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {dayChoices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => selectDayChoice(choice.id)}
                      aria-pressed={selectedDayChoice === choice.id}
                      className={`min-h-14 rounded-2xl border p-2 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:min-h-16 sm:p-2.5 ${
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
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {pizzaSessionTimeQuickChoices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => selectTimeChoice(choice.id)}
                        aria-pressed={selectedTimeChoice === choice.id}
                        aria-label={choice.time ? `${choice.label} — ${choice.time}` : choice.label}
                      className={`min-h-14 rounded-2xl border p-2 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:min-h-16 sm:p-2.5 ${
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

              <section aria-labelledby="dough-start-availability-heading" className="rounded-[1.25rem] border border-ink/10 bg-white/80 p-3.5 shadow-sm sm:p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 id="dough-start-availability-heading" className="text-sm font-extrabold text-ink">When can you start the dough?</h3>
                    <p className="mt-1 text-xs leading-5 text-ink/55">This helps DoughTools calculate the real fermentation window later.</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {doughStartOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setDoughStartMode(option.id)}
                      aria-pressed={activeDoughStartMode === option.id}
                      className={`min-h-16 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                        activeDoughStartMode === option.id ? "border-tomato bg-tomato/[.06] shadow-sm" : "border-ink/10 bg-white hover:border-tomato/30"
                      }`}
                    >
                      <span className="block text-sm font-extrabold text-ink">{option.label}</span>
                      <span className="mt-1 block text-xs leading-4 text-ink/55">{option.description}</span>
                    </button>
                  ))}
                </div>
                {activeDoughStartMode === "later" && (
                  <label className="mt-4 block max-w-md text-sm font-extrabold text-ink/65">
                    Earliest dough start date and time
                    <input
                      ref={doughStartTimeInputRef}
                      type="datetime-local"
                      value={session.doughEarliestStartTime ?? ""}
                      onChange={(event) => setDoughEarliestStartTime(event.target.value)}
                      onInput={(event) => setDoughEarliestStartTime(event.currentTarget.value)}
                      className="mt-3 h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-bold text-ink outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20"
                    />
                    <span className="mt-3 block text-xs font-normal leading-5 text-ink/45">
                      Use the first moment you can realistically mix the dough.
                    </span>
                  </label>
                )}
              </section>
            </div>
          )}

          {step === "quantity" && (
            <div className="mx-auto grid max-w-4xl gap-4 sm:gap-5">
              <section className="rounded-[1.5rem] border border-ink/10 bg-cream/65 p-4 sm:p-5" aria-labelledby="pizza-count-heading">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 id="pizza-count-heading" className="text-sm font-extrabold text-ink">Pizza amount</h3>
                    <p className="mt-1 text-xs font-bold leading-5 text-ink/50">Choose how many dough balls to make.</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-ink/45">{session.pizzaCount ?? 4} pizzas</span>
                </div>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button type="button" onClick={() => setQuantity(Math.max(1, (session.pizzaCount ?? 4) - 1))} className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:h-12 sm:w-12" aria-label="Decrease pizza count">−</button>
                  <div className="min-w-20 text-center">
                    <div className="font-display text-5xl font-semibold leading-none text-tomato sm:text-6xl">{session.pizzaCount ?? 4}</div>
                    <div className="mt-1 text-sm font-extrabold text-ink">pizzas</div>
                  </div>
                  <button type="button" onClick={() => setQuantity(Math.min(24, (session.pizzaCount ?? 4) + 1))} className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:h-12 sm:w-12" aria-label="Increase pizza count">+</button>
                </div>
                <div className="mt-5">
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Quick picks</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {[1, 2, 3, 4, 6, 8].map((amount) => (
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
                <label className="mt-5 block text-center text-xs font-extrabold text-ink/45">
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
              </section>

              {showPizzaNerdDoughControls && (
                <>
                  <section className="rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="dough-ball-size-heading">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 id="dough-ball-size-heading" className="text-sm font-extrabold text-ink">Dough ball size</h3>
                        <p className="mt-1 text-xs font-bold leading-5 text-ink/50">This controls how much dough each pizza uses.</p>
                      </div>
                      <span className="rounded-full bg-leaf/10 px-3 py-1.5 text-xs font-extrabold text-leaf">{selectedDoughBallWeight} g each</span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {DOUGH_BALL_WEIGHT_OPTIONS.map((weight) => {
                        const guidance = doughBallWeightGuidance[weight];
                        const active = selectedDoughBallWeight === weight;
                        return (
                          <button
                            key={weight}
                            type="button"
                            onClick={() => setDoughBallWeight(weight)}
                            aria-pressed={active}
                            className={`min-h-28 rounded-2xl border p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                              active ? "border-tomato bg-tomato/[.08] shadow-sm" : "border-ink/10 bg-cream text-ink/70"
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span>
                                <span className="block text-base font-extrabold text-ink">{weight} g</span>
                                <span className="mt-1 block text-xs font-bold leading-5 text-ink/55">{guidance.pizzaSize}</span>
                              </span>
                              <span aria-hidden="true" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg ${active ? "bg-white text-tomato" : "bg-white text-ink/45"}`}>
                                {guidance.visual}
                              </span>
                            </span>
                            {weight === 260 && (
                              <span className="mt-2 inline-flex rounded-full bg-leaf/10 px-2.5 py-1 text-[11px] font-extrabold text-leaf">
                                Most popular
                              </span>
                            )}
                            <span className="mt-2 block text-xs font-bold leading-5 text-ink/60">{guidance.bestFor}</span>
                            <span className="mt-1 block text-xs leading-5 text-ink/45">{guidance.reason}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setCustomDoughBallWeightDraft(String(selectedDoughBallWeight))}
                        aria-pressed={!DOUGH_BALL_WEIGHT_OPTIONS.includes(selectedDoughBallWeight as typeof DOUGH_BALL_WEIGHT_OPTIONS[number])}
                        className={`min-h-28 rounded-2xl border p-3 text-left text-sm font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                          !DOUGH_BALL_WEIGHT_OPTIONS.includes(selectedDoughBallWeight as typeof DOUGH_BALL_WEIGHT_OPTIONS[number]) ? "border-tomato bg-tomato text-white" : "border-ink/10 bg-cream text-ink/70"
                        }`}
                      >
                        <span className="block text-base">Custom</span>
                        <span className="mt-2 block text-xs font-bold leading-5 opacity-70">Use 180–350 g if your oven or appetite needs a different size.</span>
                      </button>
                    </div>
                    <label className="mt-5 block text-xs font-extrabold text-ink/50">
                      Custom grams per dough ball
                      <input
                        type="number"
                        inputMode="numeric"
                        min={MIN_DOUGH_BALL_WEIGHT}
                        max={MAX_DOUGH_BALL_WEIGHT}
                        value={customDoughBallWeightDraft}
                        onChange={(event) => setCustomDoughBallWeightDraft(event.currentTarget.value)}
                        onBlur={commitCustomDoughBallWeight}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.currentTarget.blur();
                          }
                        }}
                        className={`mt-2 h-12 w-full rounded-2xl border bg-white px-3 text-lg font-extrabold text-ink outline-none focus:ring-2 focus:ring-tomato/20 ${
                          customDoughBallWeightInvalid ? "border-tomato" : "border-ink/10 focus:border-tomato"
                        }`}
                        aria-describedby="dough-ball-weight-helper"
                        aria-invalid={customDoughBallWeightInvalid}
                      />
                    </label>
                    <p id="dough-ball-weight-helper" className={`mt-2 text-xs font-bold leading-5 ${customDoughBallWeightInvalid ? "text-tomato" : "text-ink/45"}`}>
                      Use {MIN_DOUGH_BALL_WEIGHT}–{MAX_DOUGH_BALL_WEIGHT} g for round pizzas. Invalid custom values are not saved.
                    </p>
                  </section>

                  <section className="rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="yeast-type-heading">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 id="yeast-type-heading" className="text-sm font-extrabold text-ink">Yeast type</h3>
                        <p className="mt-1 text-xs font-bold leading-5 text-ink/50">Choose the yeast you will use. This affects the yeast amount.</p>
                      </div>
                      <span className="mt-1 w-fit rounded-full bg-cream px-3 py-1.5 text-xs font-extrabold text-ink/45 sm:mt-0">
                        {sessionYeastTypeOptions.find((option) => option.id === selectedYeastType)?.label ?? "Dry yeast"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {sessionYeastTypeOptions.map((option) => {
                        const active = selectedYeastType === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setYeastType(option.id)}
                            aria-pressed={active}
                            className={`min-h-24 rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                              active ? "border-tomato bg-tomato/[.08] shadow-sm" : "border-ink/10 bg-cream text-ink/70 hover:border-tomato/30"
                            }`}
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span>
                                <span className="block text-base font-extrabold text-ink">{option.label}</span>
                                <span className="mt-2 block text-xs font-bold leading-5 text-ink/55">{option.description}</span>
                              </span>
                              <span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${active ? "bg-tomato text-white" : "bg-white text-ink/35"}`}>
                                {active ? "✓" : ""}
                              </span>
                            </span>
                            {active && <span className="mt-2 block text-xs font-extrabold uppercase tracking-[.14em] text-tomato">Selected</span>}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {step === "flour" && (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {flourSituationOptions.map((option) => (
                  <button key={option.id} type="button" onClick={() => selectFlourSituation(option.id)} aria-pressed={session.flourSituation === option.id} className={optionClass(session.flourSituation === option.id)}>
                    {selectedIndicator(session.flourSituation === option.id)}
                    {iconBadge(option.icon)}
                    <span className="col-start-2 block pr-8 text-sm font-extrabold sm:col-auto sm:text-lg">{option.label}</span>
                    <span className="col-start-2 mt-0.5 block text-xs leading-4 text-ink/55 sm:col-auto sm:mt-1 sm:text-sm sm:leading-5">{option.description}</span>
                    {session.flourSituation === option.id && <span className="col-start-2 mt-1.5 block text-xs font-extrabold uppercase tracking-[.14em] text-tomato sm:col-auto sm:mt-2">Selected</span>}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-sm font-extrabold text-ink">If you know the W-value, select one or more ranges</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {flourWRangeOptions.map((option) => {
                    const active = Boolean(session.availableFlourWRanges?.includes(option.id));
                    return (
                      <button key={option.id} type="button" onClick={() => toggleFlourWRange(option.id)} aria-pressed={active} className={optionClass(active)}>
                        {selectedIndicator(active)}
                        {iconBadge(option.icon)}
                        <span className="col-start-2 block pr-8 text-sm font-extrabold sm:col-auto sm:text-lg">{option.label}</span>
                        <span className="col-start-2 mt-0.5 block text-xs leading-4 text-ink/55 sm:col-auto sm:mt-1 sm:text-sm sm:leading-5">{option.description}</span>
                        {active && <span className="col-start-2 mt-1.5 block text-xs font-extrabold uppercase tracking-[.14em] text-tomato sm:col-auto sm:mt-2">Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="rounded-2xl border border-ink/10 bg-cream/60 p-3 text-xs font-bold leading-5 text-ink/55">
                Ingredient amounts still use the current safe flour default in this patch. W-value ranges are saved as planning context for later recommendations.
              </p>
            </div>
          )}

          {step === "summary" && (
            <div className="grid gap-4">
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {setupSummaryCards.map((item) => (
                  <div key={item.label} className="min-w-0 rounded-[1.25rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-4">
                    <dt className="flex items-center justify-between gap-2">
                      <span className="text-[0.65rem] font-black uppercase tracking-[.16em] text-ink/40">{item.label}</span>
                      <span aria-hidden="true" className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-cream text-sm">{item.icon}</span>
                    </dt>
                    <dd className="mt-2 text-base font-extrabold leading-6 text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <BottomActionBar
            back={(
              <button type="button" onClick={backStep} disabled={step === "path"} className="min-h-12 w-full rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/60 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
                Back
              </button>
            )}
            primary={(
              <div className="flex flex-col gap-2 sm:items-end">
              {step !== "summary" ? (
                <button type="button" onClick={continueStep} disabled={!canContinue} className="min-h-14 w-full rounded-2xl bg-tomato px-8 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:bg-ink/20 disabled:text-ink/40 sm:w-auto">
                  Continue →
                </button>
              ) : (
                <Link href="/session/recipe" className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-tomato px-8 text-sm font-extrabold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:w-auto">
                  Build my Dough Plan →
                </Link>
              )}
              <p className="hidden text-xs font-bold text-ink/40 sm:block">Saved locally ✓</p>
            </div>
            )}
          />
        </section>
      </div>
    </main>
  );
}

export default function StartPizzaSessionPage() {
  return (
    <Suspense fallback={<StartPizzaSessionLoading />}>
      <StartPizzaSessionContent />
    </Suspense>
  );
}
