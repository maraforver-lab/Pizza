"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { CloudPizzaSessionSync } from "@/components/session/CloudPizzaSessionSync";
import { SessionRouteState } from "@/components/session/SessionRouteState";
import { SavePizzaSessionToAccount } from "@/components/session/SavePizzaSessionToAccount";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import type { PizzaSession } from "@/lib/pizza-session";
import { PIZZA_SESSION_LOCAL_ONLY_COPY, updatePizzaSession } from "@/lib/pizza-session-storage";
import { buildSessionFermentationDisplay } from "@/lib/session-fermentation-display";
import {
  buildLongHorizonStartRecommendation,
  type LongHorizonFermentationOption,
} from "@/lib/session-long-horizon-start";
import {
  generateAndSaveActiveSessionRecipe,
  type SessionRecipeBuildResult,
} from "@/lib/session-recipe";
import {
  calculateSessionPizzaSauce,
  formatSauceCanPurchase,
  formatGrams as formatSauceGrams,
} from "@/lib/pizza-sauce-calculator";
import { normalizePizzaMixForCount } from "@/lib/pizza-session-shopping-list";
import { yeastTypeLabel } from "@/lib/yeast-types";

function formatGram(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (value > 0 && value < 10) return `${value.toFixed(2)} g`;
  return `${Math.round(value)} g`;
}

function amountCardTone(label: string) {
  if (label === "Water") return "text-sky-600";
  if (label === "Salt") return "text-ink/55";
  if (label.startsWith("Yeast")) return "text-tomato";
  return "text-leaf";
}

function formatAvailableHours(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Time not available";
  if (value < 1) return `${Math.round(value * 60)} min`;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} h`;
}

function fermentationDurationOptions(availableHours?: number) {
  if (typeof availableHours !== "number" || !Number.isFinite(availableHours)) return [];
  if (availableHours < 24 || availableHours > 72) return [];
  const roundedAvailable = Math.round(availableHours * 10) / 10;
  return [...new Set([24, 48, 72, roundedAvailable]
    .filter((value) => value >= 24 && value <= 72 && value <= availableHours)
    .sort((a, b) => a - b))];
}

function formatFermentationLength(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "Not selected";
  return `${Math.round(value * 10) / 10} h`;
}

function activeFermentationMode(result: Extract<SessionRecipeBuildResult, { ok: true }>) {
  return result.continuousYeast?.recommendation.fermentationMode
    ?? (result.settings.fermentation.endsWith("cold") ? "cold" : "room");
}

function fermentationTemperatureBounds(mode: "cold" | "room") {
  return mode === "cold"
    ? { min: 2, max: 8, defaultValue: 4, label: "Cold fermentation temperature" }
    : { min: 18, max: 26, defaultValue: 22, label: "Room fermentation temperature" };
}

function hydrationImpactMessage(current: number, baseline: number) {
  if (current > baseline) {
    return "Higher hydration makes the dough softer and stickier. It can bake lighter and more open, but it may be harder to ball, stretch, and launch.";
  }
  if (current < baseline) {
    return "Lower hydration makes the dough firmer and easier to handle. It may stretch less easily and can bake a little drier or less open.";
  }
  return null;
}

function fermentationOptionIsActive(selected: number | undefined, option: number) {
  return typeof selected === "number" && Number.isFinite(selected) && Math.abs(selected - option) < 0.11;
}

function formatPlanningDateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date not available";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function samePlanStart(a?: string, b?: string) {
  if (!a || !b) return false;
  const left = new Date(a);
  const right = new Date(b);
  return Number.isFinite(left.getTime())
    && Number.isFinite(right.getTime())
    && left.getTime() === right.getTime();
}

function longHorizonOptionIsSelected(session: PizzaSession, option: LongHorizonFermentationOption) {
  return session.doughStartMode === "later"
    && session.plannedFermentationHours === option.durationHours
    && samePlanStart(session.doughEarliestStartTime, option.startIso);
}

function selectedFlourLabel(value?: string) {
  if (value === "plain") return "All-purpose flour";
  if (value === "bread") return "Bread flour / strong flour";
  if (value === "tipo-00") return "Pizza flour / Tipo 00";
  return "Pizza flour / Tipo 00";
}

function missingCopy(reason: Exclude<SessionRecipeBuildResult, { ok: true }>["missingReason"]) {
  if (reason === "no-session") {
    return {
      action: "Plan my next pizza",
      actionHref: "/session/start",
      body: "Start by choosing when you want to eat and what kind of pizza you want to make.",
      title: "No active pizza plan",
      variant: "no-session" as const,
    };
  }
  if (reason === "missing-path") {
    return {
      action: "Complete my pizza plan",
      actionHref: "/session/start",
      body: "The dough plan needs to know whether you are baking in a home oven, pizza oven or pan.",
      title: "Your dough plan is not ready yet.",
      variant: "step-unavailable" as const,
    };
  }
  if (reason === "missing-preset") {
    return {
      action: "Complete my pizza plan",
      actionHref: "/session/start",
      body: "The pizza style keeps dough planning separate from the topping choices you’ll allocate in Shopping.",
      title: "Your dough plan is not ready yet.",
      variant: "step-unavailable" as const,
    };
  }
  if (reason === "missing-quantity") {
    return {
      action: "Complete my pizza plan",
      actionHref: "/session/start",
      body: "The dough plan needs a number of pizzas before it can calculate the total dough.",
      title: "Your dough plan is not ready yet.",
      variant: "step-unavailable" as const,
    };
  }
  return {
    action: "Complete my pizza plan",
    actionHref: "/session/start",
    body: "Pick the closest flour type in the session starter. Exact flour tuning remains available in the full calculator.",
    title: "Your dough plan is not ready yet.",
    variant: "step-unavailable" as const,
  };
}

export default function SessionRecipePage() {
  const [ready, setReady] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [result, setResult] = useState<SessionRecipeBuildResult | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    try {
      const saved = generateAndSaveActiveSessionRecipe();
      setSession(saved.session ?? null);
      setResult(saved.result);
    } catch {
      setRouteError(true);
    } finally {
      setReady(true);
    }
  }, []);

  if (routeError) {
    return (
      <SessionRouteState
        action={{ href: "/session/start", label: "Start a new plan" }}
        body="Something interrupted the local session check. Try again, or start a fresh pizza plan."
        eyebrow="Dough Plan"
        onRetry={() => window.location.reload()}
        title="We couldn’t open your pizza plan."
        variant="error"
      />
    );
  }

  if (!ready || !result) {
    return (
      <SessionRouteState
        body="Checking this browser for an active pizza plan before building the dough recipe."
        eyebrow="Dough Plan"
        title="Opening your pizza plan"
        variant="checking"
      />
    );
  }

  if (!result.ok || !session) {
    const copy = missingCopy(result.ok ? "no-session" : result.missingReason);
    return (
      <SessionRouteState
        action={{ href: copy.actionHref, label: copy.action }}
        eyebrow="Pizza Session recipe"
        title={copy.title}
        body={copy.body}
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, tracking or public sharing is active.`}
        variant={copy.variant}
      />
    );
  }

  const selectedYeastLabel = yeastTypeLabel(result.settings.yeastType);
  const doughIngredientRows = [
    { label: "Flour", value: formatGram(result.ingredients.flour), icon: "wheat", description: "The base of your dough." },
    { label: "Water", value: formatGram(result.ingredients.water), icon: "water", description: "Hydrates the flour." },
    { label: "Salt", value: formatGram(result.ingredients.salt), icon: "salt", description: "Adds flavor and strength." },
    {
      label: `Yeast — ${selectedYeastLabel}`,
      value: formatGram(result.ingredients.leavener),
      icon: "yeast",
      description: `${selectedYeastLabel} amount for this dough plan.`,
      note: result.continuousYeast?.summary,
      caution: result.continuousYeast?.recommendation.cautions[0] ?? result.continuousYeast?.recommendation.warnings[0],
    },
    { label: "Total dough", value: formatGram(result.ingredients.total), icon: "mixing-bowl", description: "Your full dough batch.", summary: true },
  ] satisfies Array<{ label: string; value: string; icon: DoughToolsIconName; description: string; note?: string; caution?: string; summary?: boolean }>;
  const planningInfo = result.planningInfo;
  const planningResult = planningInfo.ok ? planningInfo.result : null;
  const fermentationDisplay = buildSessionFermentationDisplay({
    session,
    snapshot: result.recipeSnapshot,
    basis: result.continuousYeast?.recommendation,
  });
  const doughPlanHeroBody = fermentationDisplay.durationHours && fermentationDisplay.durationHours > 24
    ? "Choose the fermentation length that fits your bake day. Longer fermentation can build deeper flavor, but it also needs flour strong enough for the selected time."
    : "Get your dough ingredients and amounts ready before you start.";
  const longHorizonRecommendation = buildLongHorizonStartRecommendation({
    planningResult,
    selectedFlourLabel: selectedFlourLabel(session.flour),
  });
  const selectedLongHorizonOption = longHorizonRecommendation?.options.find((option) => (
    longHorizonOptionIsSelected(session, option)
  ));
  const longHorizonNeedsSelection = Boolean(longHorizonRecommendation && !selectedLongHorizonOption);
  const coldFermentationOptions = fermentationDurationOptions(result.continuousYeast?.availableFermentationHours);
  const showColdFermentationSelector = Boolean(
    result.continuousYeast?.recommendation.fermentationMode === "cold"
    && coldFermentationOptions.length > 0
    && !longHorizonRecommendation,
  );
  const selectedFermentationHours = result.continuousYeast?.selectedFermentationHours;
  const showPizzaNerdControls = session.experienceLevel === "pizza_nerd";
  const fermentationModeForControls = activeFermentationMode(result);
  const temperatureBounds = fermentationTemperatureBounds(fermentationModeForControls);
  const activeFermentationTemperatureC = result.continuousYeast?.recommendation.temperatureC
    ?? result.settings.temperature
    ?? temperatureBounds.defaultValue;
  const defaultHydration = session.pizzaStyle === "pan-tray" || session.ovenType === "pan" ? 75 : 64;
  const hydrationImpact = hydrationImpactMessage(result.settings.hydration, defaultHydration);
  const sauceSummary = calculateSessionPizzaSauce({
    pizzaMix: normalizePizzaMixForCount(result.settings.pizzas, session.pizzaMix, session.pizzaPreset),
    ovenType: result.recipeSnapshot.oven ?? session.ovenType,
    pizzaStyle: session.pizzaStyle,
  });
  const saucePerPizzaLabel = sauceSummary.lines.length === 1
    ? `${sauceSummary.lines[0].sauceGramsPerPizza} g per pizza`
    : "varies by pizza mix";

  const regenerateRecipeAfterSessionUpdate = (updated?: PizzaSession) => {
    const saved = generateAndSaveActiveSessionRecipe();
    setSession(saved.session ?? updated ?? session);
    setResult(saved.result);
  };

  const updatePlannedFermentationHours = (plannedFermentationHours: number) => {
    if (!session) return;
    const updated = updatePizzaSession(session.id, {
      plannedFermentationHours,
      currentStep: "recipe",
      status: "planning",
    });
    regenerateRecipeAfterSessionUpdate(updated);
  };

  const updateLongHorizonPlan = (option: LongHorizonFermentationOption) => {
    if (!session) return;
    const updated = updatePizzaSession(session.id, {
      plannedFermentationHours: option.durationHours,
      doughStartMode: "later",
      doughEarliestStartTime: option.startIso,
      currentStep: "recipe",
      status: "planning",
    });
    regenerateRecipeAfterSessionUpdate(updated);
  };

  const updateHydrationOverride = (value: number) => {
    if (!session || value < 50 || value > 80) return;
    const updated = updatePizzaSession(session.id, {
      hydrationPercentOverride: value,
      currentStep: "recipe",
      status: "planning",
    });
    regenerateRecipeAfterSessionUpdate(updated);
  };

  const stepHydrationOverride = (delta: number) => {
    updateHydrationOverride(Math.max(50, Math.min(80, result.settings.hydration + delta)));
  };

  const updateTemperatureOverride = (value: number) => {
    if (!session || value < temperatureBounds.min || value > temperatureBounds.max) return;
    const updated = updatePizzaSession(session.id, {
      fermentationTemperatureCOverride: value,
      currentStep: "recipe",
      status: "planning",
    });
    regenerateRecipeAfterSessionUpdate(updated);
  };

  const stepTemperatureOverride = (delta: number) => {
    updateTemperatureOverride(Math.max(
      temperatureBounds.min,
      Math.min(temperatureBounds.max, activeFermentationTemperatureC + delta),
    ));
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 pb-24 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <CloudPizzaSessionSync session={session} />
      <SessionWorkspaceLayout activeStep={6} hideLocalSaveNote>
        <SessionStepHero
          step={6}
          label="Dough Plan"
          pageType="Reference page"
          title="Your Dough Plan is ready."
          body={doughPlanHeroBody}
          level={session.experienceLevel}
          levelCompactOnMobile
          hideBodyOnMobile
          hideMeta
        />

        {showColdFermentationSelector && (
          <section className="mt-4 rounded-[1.5rem] border border-leaf/25 bg-leaf/[.07] p-4 shadow-card sm:mt-6 sm:rounded-[2rem] sm:p-6 lg:p-7" aria-labelledby="fermentation-duration-heading">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Fermentation length</p>
                <h2 id="fermentation-duration-heading" className="mt-2 font-display text-3xl font-semibold">Choose your fermentation length</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                  Pick the cold fermentation length that fits your bake day. A longer fermentation can build deeper flavor and a more developed dough, but it also needs flour strong enough to hold its structure over time. DoughTools uses your choice to guide yeast amount, start time, and flour-strength recommendations.
                </p>
              </div>
              <span className="w-fit rounded-full bg-white/80 px-3 py-2 text-xs font-extrabold text-ink/55">
                Available window: {formatAvailableHours(result.continuousYeast?.availableFermentationHours)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {coldFermentationOptions.map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => updatePlannedFermentationHours(hours)}
                  aria-pressed={fermentationOptionIsActive(selectedFermentationHours, hours)}
                  className={`min-h-11 rounded-2xl px-4 text-sm font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                    fermentationOptionIsActive(selectedFermentationHours, hours)
                      ? "bg-tomato text-white"
                      : "bg-white text-ink/65 ring-1 ring-ink/10 hover:text-tomato"
                  }`}
                >
                  {formatFermentationLength(hours)} cold
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="mt-4 flex flex-col sm:mt-6">
          <div className="order-2 mt-4 sm:order-1 sm:mt-0">
            <SavePizzaSessionToAccount session={session} />
          </div>

        <section className="order-1 sm:order-2 sm:mt-6" aria-label="Dough plan details">
          <div className="grid min-w-0 gap-4 sm:gap-5">
            <article className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-6 lg:p-7">
              <div className="grid gap-5">
                <section aria-labelledby="ingredients-amounts-heading" className="min-w-0 rounded-[1.25rem] bg-cream/70 p-3.5 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 id="ingredients-amounts-heading" className="font-display text-2xl font-semibold">Ingredients & amounts</h3>
                    <span className="rounded-full bg-leaf/10 px-3 py-1.5 text-xs font-extrabold text-leaf">Weigh for best results</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/55">
                    Use these amounts when mixing your dough.
                  </p>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-3">
                      <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Dough balls</dt>
                      <dd className="mt-1 text-sm font-extrabold text-ink">{result.settings.pizzas} × {result.settings.ballWeight} g</dd>
                    </div>
                    {showPizzaNerdControls && (
                      <div className="rounded-2xl border border-leaf/20 bg-white p-3" aria-label="Pizza Nerd controls">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-leaf">Pizza Nerd controls</p>
                            <p className="mt-1 text-xs font-bold leading-5 text-ink/50">Fine-tune dough behavior.</p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[18rem]">
                            <label className="grid gap-1 text-xs font-extrabold text-ink/55">
                              <span>Hydration</span>
                              <span className="grid min-h-11 grid-cols-[2.75rem_1fr_2.75rem] overflow-hidden rounded-2xl border border-ink/10 bg-cream">
                                <button
                                  type="button"
                                  aria-label="Decrease hydration"
                                  disabled={result.settings.hydration <= 50}
                                  onClick={() => stepHydrationOverride(-1)}
                                  className="text-lg font-extrabold text-ink/65 transition hover:bg-white disabled:cursor-not-allowed disabled:text-ink/25"
                                >
                                  <DoughToolsIcon name="remove" size={16} strokeWidth={2.4} />
                                </button>
                                <span className="flex items-center justify-center border-x border-ink/10 bg-white/55 text-base font-extrabold text-ink">
                                  {result.settings.hydration}%
                                </span>
                                <button
                                  type="button"
                                  aria-label="Increase hydration"
                                  disabled={result.settings.hydration >= 80}
                                  onClick={() => stepHydrationOverride(1)}
                                  className="text-lg font-extrabold text-ink/65 transition hover:bg-white disabled:cursor-not-allowed disabled:text-ink/25"
                                >
                                  <DoughToolsIcon name="add" size={16} strokeWidth={2.4} />
                                </button>
                              </span>
                            </label>
                            <label className="grid gap-1 text-xs font-extrabold text-ink/55">
                              <span>Temperature</span>
                              <span className="grid min-h-11 grid-cols-[2.75rem_1fr_2.75rem] overflow-hidden rounded-2xl border border-ink/10 bg-cream">
                                <button
                                  type="button"
                                  aria-label="Decrease fermentation temperature"
                                  disabled={activeFermentationTemperatureC <= temperatureBounds.min}
                                  onClick={() => stepTemperatureOverride(-1)}
                                  className="text-lg font-extrabold text-ink/65 transition hover:bg-white disabled:cursor-not-allowed disabled:text-ink/25"
                                >
                                  <DoughToolsIcon name="remove" size={16} strokeWidth={2.4} />
                                </button>
                                <span className="flex items-center justify-center border-x border-ink/10 bg-white/55 text-base font-extrabold text-ink">
                                  {activeFermentationTemperatureC} °C
                                </span>
                                <button
                                  type="button"
                                  aria-label="Increase fermentation temperature"
                                  disabled={activeFermentationTemperatureC >= temperatureBounds.max}
                                  onClick={() => stepTemperatureOverride(1)}
                                  className="text-lg font-extrabold text-ink/65 transition hover:bg-white disabled:cursor-not-allowed disabled:text-ink/25"
                                >
                                  <DoughToolsIcon name="add" size={16} strokeWidth={2.4} />
                                </button>
                              </span>
                            </label>
                          </div>
                        </div>
                        {hydrationImpact && (
                          <p className="mt-3 rounded-2xl bg-leaf/[.08] p-3 text-xs font-bold leading-5 text-ink/65">
                            <span className="block text-[0.65rem] font-extrabold uppercase tracking-[.16em] text-leaf">Hydration impact</span>
                            <span className="mt-1 block">{hydrationImpact}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </dl>
                  <dl className="mt-4 grid gap-2.5">
                    {doughIngredientRows.map((item) => (
                      <div key={item.label} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border p-3.5 ${item.summary ? "border-leaf/25 bg-leaf/[.08]" : "border-white/80 bg-white"}`}>
                        <dt className="contents">
                          <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-cream text-ink/60 shadow-sm">
                            <DoughToolsIcon name={item.icon} size={24} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-extrabold text-ink">{item.label}</span>
                            <span className="mt-0.5 block text-xs leading-4 text-ink/45">{item.description}</span>
                            {"note" in item && item.note && (
                              <span className="mt-1 block text-xs font-bold leading-5 text-leaf">{item.note}</span>
                            )}
                            {"caution" in item && item.caution && (
                              <span className="mt-1 block text-xs font-bold leading-5 text-tomato">{item.caution}</span>
                            )}
                          </span>
                        </dt>
                        <dd className={`text-right text-xl font-extrabold sm:text-2xl ${amountCardTone(item.label)}`}>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {sauceSummary.finishedSauceGrams > 0 && (
                  <>
                    <details className="min-w-0 rounded-[1.25rem] bg-cream/70 p-3.5 sm:hidden">
                      <summary className="cursor-pointer list-none font-display text-2xl font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                        Sauce for this plan
                      </summary>
                      <p className="mt-2 text-sm leading-6 text-ink/55">
                        Use this when preparing toppings. Shopping rounds tomato cans separately.
                      </p>
                      <dl className="mt-3 grid gap-2">
                        <div className="rounded-2xl bg-white p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Use on pizzas</dt>
                          <dd className="mt-1 text-sm font-extrabold text-ink">{formatSauceGrams(sauceSummary.finishedSauceGrams)} total · {saucePerPizzaLabel}</dd>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Prepare</dt>
                          <dd className="mt-1 text-sm font-extrabold text-ink">{formatSauceGrams(sauceSummary.preparationSauceGrams)} with {sauceSummary.reservePercent}% reserve</dd>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Shopping</dt>
                          <dd className="mt-1 text-sm font-extrabold text-ink">Buy {formatSauceCanPurchase(sauceSummary.cansNeeded, sauceSummary.canSizeGrams)}</dd>
                        </div>
                      </dl>
                    </details>
                    <section aria-labelledby="session-recipe-sauce-heading" className="hidden min-w-0 rounded-[1.25rem] bg-cream/70 p-3.5 sm:block sm:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 id="session-recipe-sauce-heading" className="font-display text-2xl font-semibold">Sauce for this plan</h3>
                        <span className="rounded-full bg-tomato/10 px-3 py-1.5 text-xs font-extrabold text-tomato">Prepare separately</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink/55">
                        Use this when preparing toppings. Shopping rounds tomato cans separately.
                      </p>
                      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-2xl bg-white p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Use on pizzas</dt>
                          <dd className="mt-1 text-sm font-extrabold text-ink">{formatSauceGrams(sauceSummary.finishedSauceGrams)} total · {saucePerPizzaLabel}</dd>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Prepare</dt>
                          <dd className="mt-1 text-sm font-extrabold text-ink">{formatSauceGrams(sauceSummary.preparationSauceGrams)} with {sauceSummary.reservePercent}% reserve</dd>
                        </div>
                        <div className="rounded-2xl bg-white p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Shopping</dt>
                          <dd className="mt-1 text-sm font-extrabold text-ink">Buy {formatSauceCanPurchase(sauceSummary.cansNeeded, sauceSummary.canSizeGrams)}</dd>
                        </div>
                      </dl>
                    </section>
                  </>
                )}
              </div>
            </article>

            {longHorizonRecommendation && (
              <article className="rounded-[1.5rem] border border-tomato/20 bg-tomato/[.06] p-4 shadow-card sm:rounded-[2rem] sm:p-6 lg:p-7" aria-labelledby="long-horizon-start-plan-heading">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Long-horizon start plan</p>
                    <h3 id="long-horizon-start-plan-heading" className="mt-2 font-display text-3xl font-semibold">{longHorizonRecommendation.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{longHorizonRecommendation.summary}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3 text-sm leading-6 text-ink/70 lg:min-w-[17rem]">
                    <span className="block text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Recommended plan</span>
                    <span className="mt-1 block font-extrabold text-ink">
                      Start {formatPlanningDateTime(longHorizonRecommendation.recommendedStartIso)}
                    </span>
                    <span className="mt-1 block">48h cold fermentation</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 lg:grid-cols-3">
                  {longHorizonRecommendation.options.map((option) => (
                    <button
                      key={option.durationHours}
                      type="button"
                      onClick={() => updateLongHorizonPlan(option)}
                      aria-pressed={longHorizonOptionIsSelected(session, option)}
                      className={`rounded-2xl border bg-white p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                        longHorizonOptionIsSelected(session, option)
                          ? "border-tomato/45 ring-2 ring-tomato/20"
                          : option.isRecommended
                            ? "border-leaf/30 ring-1 ring-leaf/20 hover:border-tomato/30"
                            : "border-ink/10 hover:border-tomato/30"
                      }`}
                    >
                      <span className="block text-sm font-extrabold text-ink">{option.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink/65">
                        Start {formatPlanningDateTime(option.startIso)}
                      </span>
                      <span className="mt-2 block text-xs font-bold leading-5 text-ink/55">{option.flourGuidance}</span>
                      <span className={`mt-3 inline-flex min-h-10 items-center justify-center rounded-2xl px-3 text-xs font-extrabold ${
                        longHorizonOptionIsSelected(session, option)
                          ? "bg-tomato text-white"
                          : "bg-cream text-ink/65"
                      }`}>
                        {longHorizonOptionIsSelected(session, option) ? (
                          <span className="inline-flex items-center justify-center gap-1">
                            Selected plan <DoughToolsIcon name="check" size={16} strokeWidth={2.4} />
                          </span>
                        ) : "Select this plan"}
                      </span>
                    </button>
                  ))}
                </div>

                {!selectedLongHorizonOption && (
                  <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-extrabold leading-6 text-tomato">
                    Select one of these plans before continuing so DoughTools can calculate yeast, flour guidance, Timeline, and Kitchen Mode from the chosen fermentation window.
                  </p>
                )}

                <div className="mt-3 grid gap-2 rounded-2xl bg-white/80 p-3 text-sm leading-6 text-ink/65 sm:grid-cols-2">
                  <p><span className="font-extrabold text-ink">Selected flour:</span> {longHorizonRecommendation.selectedFlourLabel}</p>
                  <p><span className="font-extrabold text-ink">Recommended flour for 48–72h cold fermentation:</span> {longHorizonRecommendation.recommendedFlourLabel}, {longHorizonRecommendation.recommendedFlourStrengthGuidance}</p>
                </div>
              </article>
            )}
          </div>
        </section>
        </div>

        <BottomActionBar
          back={(
            <Link
              href="/session/start"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
            >
              Back
            </Link>
          )}
          primary={(
            longHorizonNeedsSelection ? (
              <button
                type="button"
                disabled
                className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-ink/20 px-5 text-sm font-extrabold text-ink/50 shadow-sm sm:w-auto"
              >
                Select a fermentation plan first
              </button>
            ) : (
              <Link
                href="/session/shopping"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
              >
                Continue to Shopping →
              </Link>
            )
          )}
        />
      </SessionWorkspaceLayout>
    </main>
  );
}
