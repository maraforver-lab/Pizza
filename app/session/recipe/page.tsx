"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomActionBar } from "@/components/design-system";
import { SessionEmptyState } from "@/components/session/SessionEmptyState";
import { SessionStepHero } from "@/components/session/SessionStepHero";
import { SessionViewportReset } from "@/components/session/SessionViewportReset";
import { SessionWorkspaceLayout } from "@/components/session/SessionWorkspaceLayout";
import type { PizzaSession } from "@/lib/pizza-session";
import { PIZZA_SESSION_LOCAL_ONLY_COPY, updatePizzaSession } from "@/lib/pizza-session-storage";
import { buildLongHorizonStartRecommendation } from "@/lib/session-long-horizon-start";
import {
  generateAndSaveActiveSessionRecipe,
  type SessionRecipeBuildResult,
} from "@/lib/session-recipe";

function formatGram(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (value > 0 && value < 10) return `${value.toFixed(2)} g`;
  return `${Math.round(value)} g`;
}

function amountCardTone(label: string) {
  if (label === "Water") return "text-sky-600";
  if (label === "Salt") return "text-ink/55";
  if (label === "Yeast") return "text-tomato";
  return "text-leaf";
}

function planningRiskTone(risk?: string) {
  if (risk === "high_risk" || risk === "not_recommended") return "border-tomato/35 bg-tomato/[.08] text-tomato";
  if (risk === "caution") return "border-tomato/25 bg-tomato/[.06] text-tomato";
  if (risk === "not_enough_information") return "border-ink/10 bg-cream text-ink/65";
  return "border-leaf/25 bg-leaf/[.08] text-leaf";
}

function flourFitTone(fit?: string) {
  if (fit === "caution") return "border-tomato/25 bg-tomato/[.06]";
  if (fit === "long_horizon" || fit === "unknown" || fit === "not_enough_information") return "border-ink/10 bg-cream";
  return "border-leaf/25 bg-leaf/[.08]";
}

function readablePlanningLabel(value?: string | null) {
  if (!value) return "Not enough information";
  return value.replaceAll("_", " ");
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

function selectedFlourLabel(value?: string) {
  if (value === "plain") return "All-purpose flour";
  if (value === "bread") return "Bread flour / strong flour";
  if (value === "tipo-00") return "Pizza flour / Tipo 00";
  return "Pizza flour / Tipo 00";
}

function sessionPlanningRiskSummary({
  summary,
  isColdFermentation,
}: {
  summary?: string | null;
  isColdFermentation: boolean;
}) {
  if (!summary) return summary;
  if (isColdFermentation && summary.includes("long room-temperature plan")) {
    return "This plan can work, but cold fermentation gives more control; timing, fridge temperature, and flour strength still matter.";
  }
  return summary;
}

function sessionPlanningFirstAdjustment({
  adjustment,
  isColdFermentation,
}: {
  adjustment?: string | null;
  isColdFermentation: boolean;
}) {
  if (!adjustment) return adjustment;
  if (isColdFermentation && adjustment.includes("toward cold")) {
    return "Keep the selected cold fermentation length, then watch fridge temperature and dough condition.";
  }
  return adjustment;
}

function missingCopy(reason: Exclude<SessionRecipeBuildResult, { ok: true }>["missingReason"]) {
  if (reason === "no-session") {
    return {
      title: "No active pizza session",
      body: "Start a Pizza Session first. DoughTools will save the session locally in this browser on this device.",
      action: "Start Pizza Session →",
    };
  }
  if (reason === "missing-path") {
    return {
      title: "Choose your baking path first.",
      body: "The dough plan needs to know whether you are baking in a home oven, pizza oven or pan.",
      action: "Return to session choices →",
    };
  }
  if (reason === "missing-preset") {
    return {
      title: "Choose a pizza style first.",
      body: "The pizza style keeps dough planning separate from the topping choices you’ll allocate in Shopping.",
      action: "Return to session choices →",
    };
  }
  if (reason === "missing-quantity") {
    return {
      title: "Choose the pizza count first.",
      body: "The dough plan needs a number of pizzas before it can calculate the total dough.",
      action: "Return to session choices →",
    };
  }
  return {
    title: "Choose your flour first.",
    body: "Pick the closest flour type in the session starter. Exact flour tuning remains available in the full calculator.",
    action: "Return to session choices →",
  };
}

export default function SessionRecipePage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<PizzaSession | null>(null);
  const [result, setResult] = useState<SessionRecipeBuildResult | null>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    const saved = generateAndSaveActiveSessionRecipe();
    setSession(saved.session ?? null);
    setResult(saved.result);
    setReady(true);
  }, []);

  if (!ready || !result) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10 text-ink">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-6 text-sm font-bold text-ink/50 shadow-card">
          Building your local dough plan…
        </div>
      </main>
    );
  }

  if (!result.ok || !session) {
    const copy = missingCopy(result.ok ? "no-session" : result.missingReason);
    return (
      <SessionEmptyState
        eyebrow="Pizza Session recipe"
        title={copy.title}
        body={copy.body}
        actionHref="/session/start"
        actionLabel={copy.action}
        localNote={`${PIZZA_SESSION_LOCAL_ONLY_COPY} No cloud sync, tracking or public sharing is active.`}
      />
    );
  }

  const doughIngredientRows = [
    { label: "Flour", value: formatGram(result.ingredients.flour), icon: "▣", description: "The base of your dough." },
    { label: "Water", value: formatGram(result.ingredients.water), icon: "💧", description: "Hydrates the flour." },
    { label: "Salt", value: formatGram(result.ingredients.salt), icon: "◌", description: "Adds flavor and strength." },
    {
      label: "Yeast",
      value: formatGram(result.ingredients.leavener),
      icon: "✺",
      description: "Helps the dough rise.",
      note: result.continuousYeast?.summary,
      caution: result.continuousYeast?.recommendation.cautions[0] ?? result.continuousYeast?.recommendation.warnings[0],
    },
    { label: "Total dough", value: formatGram(result.ingredients.total), icon: "🥣", description: "Your full dough batch.", summary: true },
  ];
  const planningInfo = result.planningInfo;
  const planningResult = planningInfo.ok ? planningInfo.result : null;
  const combinedRisk = planningResult?.combinedRiskSummary;
  const flourWGuidance = result.flourWGuidance;
  const longHorizonRecommendation = buildLongHorizonStartRecommendation({
    planningResult,
    selectedFlourLabel: selectedFlourLabel(session.flour),
  });
  const planningHighlights = planningResult
    ? [
      longHorizonRecommendation ? {
        label: "Start window",
        value: "Choose a 24h, 48h or 72h cold fermentation plan closer to bake day.",
      } : planningResult.startWindowRecommendation && {
        label: "Start window",
        value: planningResult.startWindowRecommendation.startWindowLabel,
      },
      planningResult.fermentationSetupRecommendation && {
        label: "Recommended setup",
        value: planningResult.fermentationSetupRecommendation.title,
      },
      planningResult.availableFlourRecommendation && {
        label: "W-value",
        value: flourWGuidance?.recommendationLabel
          ?? planningResult.availableFlourRecommendation.recommendedFlour?.label
          ?? planningResult.availableFlourRecommendation.summary,
      },
      planningResult.yeastGuidance && {
        label: "Yeast",
        value: planningResult.yeastGuidance.title,
      },
    ].filter((item): item is { label: string; value: string } => Boolean(item))
    : [];
  const displayedRiskSummary = longHorizonRecommendation
    ? "This bake target is far enough away that you should not start immediately. Use one of the planned 24h, 48h or 72h cold-fermentation start times below."
    : sessionPlanningRiskSummary({
      summary: combinedRisk?.summary,
      isColdFermentation: result.continuousYeast?.recommendation.fermentationMode === "cold",
    });
  const displayedFirstAdjustment = longHorizonRecommendation
    ? "Start at the selected option’s start time, not before."
    : sessionPlanningFirstAdjustment({
      adjustment: combinedRisk?.suggestedFirstAdjustment,
      isColdFermentation: result.continuousYeast?.recommendation.fermentationMode === "cold",
    });
  const coldFermentationOptions = fermentationDurationOptions(result.continuousYeast?.availableFermentationHours);
  const showColdFermentationSelector = Boolean(
    result.continuousYeast?.recommendation.fermentationMode === "cold"
    && coldFermentationOptions.length > 0
    && !longHorizonRecommendation,
  );
  const selectedFermentationHours = result.continuousYeast?.selectedFermentationHours;

  const updatePlannedFermentationHours = (plannedFermentationHours: number) => {
    if (!session) return;
    const updated = updatePizzaSession(session.id, {
      plannedFermentationHours,
      currentStep: "recipe",
      status: "planning",
    });
    const saved = generateAndSaveActiveSessionRecipe();
    setSession(saved.session ?? updated ?? session);
    setResult(saved.result);
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-6 pb-24 text-ink sm:px-6 sm:py-9">
      <SessionViewportReset />
      <SessionWorkspaceLayout activeStep={6}>
        <SessionStepHero
          step={6}
          label="Dough Plan"
          pageType="Reference page"
          title="Your Dough Plan is ready."
          body="Get your dough ingredients and amounts ready before you start."
          level={session.experienceLevel}
          hideMeta
        />

        <section className="mt-4 sm:mt-6" aria-label="Dough plan details">
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
                  <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3">
                      <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Dough balls</dt>
                      <dd className="mt-1 text-sm font-extrabold text-ink">{result.settings.pizzas}</dd>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Dough ball size</dt>
                      <dd className="mt-1 text-sm font-extrabold text-ink">{result.settings.ballWeight} g each</dd>
                    </div>
                    <div className="rounded-2xl bg-white p-3">
                      <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Batch size</dt>
                      <dd className="mt-1 text-sm font-extrabold text-ink">{formatGram(result.ingredients.total)}</dd>
                    </div>
                  </dl>
                  <dl className="mt-4 grid gap-2.5">
                    {doughIngredientRows.map((item) => (
                      <div key={item.label} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border p-3.5 ${item.summary ? "border-leaf/25 bg-leaf/[.08]" : "border-white/80 bg-white"}`}>
                        <dt className="contents">
                          <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-2xl bg-cream text-xl shadow-sm">{item.icon}</span>
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
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-card sm:rounded-[2rem] sm:p-6 lg:p-7" aria-labelledby="dough-planning-notes-heading">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Planning guidance</p>
                  <h3 id="dough-planning-notes-heading" className="mt-2 font-display text-3xl font-semibold">Dough planning notes</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                    Planning guidance is based on available session choices. It does not change your dough formula or ingredient amounts.
                  </p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-2 text-xs font-extrabold capitalize ${planningRiskTone(combinedRisk?.overallRiskLevel ?? (planningInfo.ok ? "low" : "not_enough_information"))}`}>
                  {readablePlanningLabel(combinedRisk?.overallRiskLevel ?? (planningInfo.ok ? "low" : "not_enough_information"))}
                </span>
              </div>

              {planningResult && combinedRisk ? (
                <div className="mt-4 grid gap-3">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,.9fr)]">
                    <section className={`rounded-[1.25rem] border p-4 ${planningRiskTone(combinedRisk.overallRiskLevel)}`}>
                      <p className="text-xs font-extrabold uppercase tracking-[.16em] opacity-70">Overall risk</p>
                      <p className="mt-2 text-sm font-extrabold leading-6 text-ink">{displayedRiskSummary}</p>
                      <div className="mt-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-ink/65">
                        <span className="block text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">What to adjust first</span>
                        <span className="mt-1 block font-bold">{displayedFirstAdjustment ?? "No major adjustment needed from the available session choices."}</span>
                      </div>
                    </section>

                    <section className="rounded-[1.25rem] border border-ink/10 bg-cream/70 p-4">
                      <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/40">Session planning context</p>
                      <dl className="mt-3 grid gap-2">
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                          <dt className="text-xs font-extrabold text-ink/45">Available time</dt>
                          <dd className="text-sm font-extrabold text-ink">{formatAvailableHours(planningResult.availableFermentationHours)}</dd>
                        </div>
                        {planningHighlights.slice(0, 4).map((item) => (
                          <div key={item.label} className="grid gap-1 rounded-2xl bg-white p-3">
                            <dt className="text-xs font-extrabold text-ink/45">{item.label}</dt>
                            <dd className="text-sm font-bold leading-5 text-ink/70">{item.value}</dd>
                          </div>
                        ))}
                        {result.continuousYeast && (
                          <>
                            <div className="grid gap-1 rounded-2xl bg-white p-3">
                              <dt className="text-xs font-extrabold text-ink/45">Planned fermentation length</dt>
                              <dd className="text-sm font-bold leading-5 text-ink/70">{formatFermentationLength(result.continuousYeast.selectedFermentationHours)}</dd>
                            </div>
                            <div className="grid gap-1 rounded-2xl bg-white p-3">
                              <dt className="text-xs font-extrabold text-ink/45">Fermentation place / temperature</dt>
                              <dd className="text-sm font-bold leading-5 text-ink/70">
                                {result.continuousYeast.recommendation.fermentationMode === "cold"
                                  ? `Cold fermentation in the fridge · ${result.continuousYeast.recommendation.temperatureC} °C`
                                  : `Room fermentation · ${result.continuousYeast.recommendation.temperatureC} °C`}
                              </dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </section>
                  </div>

                  {showColdFermentationSelector && (
                    <section className="rounded-[1.25rem] border border-leaf/25 bg-leaf/[.07] p-4" aria-labelledby="fermentation-duration-heading">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-leaf">Fermentation length</p>
                          <h4 id="fermentation-duration-heading" className="mt-2 font-display text-2xl font-semibold">Choose a cold fermentation length</h4>
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
                            Your current window can support a cold fridge fermentation between 24h and 72h. Pick the length you want DoughTools to use for yeast and flour-strength guidance.
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

                  {flourWGuidance && (
                    <section className={`rounded-[1.25rem] border p-4 ${flourFitTone(flourWGuidance.fitLevel)}`}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">W-value guidance</p>
                          <h4 className="mt-2 font-display text-2xl font-semibold">{flourWGuidance.title}</h4>
                          <p className="mt-2 text-sm font-bold leading-6 text-ink">{flourWGuidance.summary}</p>
                        </div>
                        <span className="w-fit rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs font-extrabold capitalize text-ink/60">
                          {readablePlanningLabel(flourWGuidance.fitLevel)}
                        </span>
                      </div>
                      <dl className="mt-3 grid gap-2 md:grid-cols-3">
                        <div className="rounded-2xl bg-white/80 p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Recommended flour strength</dt>
                          <dd className="mt-1 text-sm font-extrabold text-ink">{flourWGuidance.recommendationLabel}</dd>
                          {flourWGuidance.saferChoiceLabel && (
                            <dd className="mt-1 text-xs font-bold text-ink/55">Safer pick: {flourWGuidance.saferChoiceLabel}</dd>
                          )}
                        </div>
                        <div className="rounded-2xl bg-white/80 p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Available flour</dt>
                          <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">{flourWGuidance.availableFlourSummary}</dd>
                        </div>
                        <div className="rounded-2xl bg-white/80 p-3">
                          <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">Buy guidance</dt>
                          <dd className="mt-1 text-sm font-bold leading-5 text-ink/70">{flourWGuidance.recommendedBuySummary}</dd>
                        </div>
                      </dl>
                      {flourWGuidance.cautions[0] && (
                        <p className="mt-3 rounded-2xl bg-white/70 p-3 text-xs font-bold leading-5 text-tomato">
                          {flourWGuidance.cautions[0]}
                        </p>
                      )}
                    </section>
                  )}

                  {longHorizonRecommendation && (
                    <section className="rounded-[1.25rem] border border-tomato/20 bg-tomato/[.06] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Long-horizon start plan</p>
                          <h4 className="mt-2 font-display text-2xl font-semibold">{longHorizonRecommendation.title}</h4>
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

                      <dl className="mt-4 grid gap-2 lg:grid-cols-3">
                        {longHorizonRecommendation.options.map((option) => (
                          <div key={option.durationHours} className={`rounded-2xl border bg-white p-3 ${option.isRecommended ? "border-leaf/30 ring-1 ring-leaf/20" : "border-ink/10"}`}>
                            <dt className="text-sm font-extrabold text-ink">{option.label}</dt>
                            <dd className="mt-1 text-sm leading-6 text-ink/65">
                              Start {formatPlanningDateTime(option.startIso)}
                            </dd>
                            <dd className="mt-2 text-xs font-bold leading-5 text-ink/55">{option.flourGuidance}</dd>
                          </div>
                        ))}
                      </dl>

                      <div className="mt-3 grid gap-2 rounded-2xl bg-white/80 p-3 text-sm leading-6 text-ink/65 sm:grid-cols-2">
                        <p><span className="font-extrabold text-ink">Selected flour:</span> {longHorizonRecommendation.selectedFlourLabel}</p>
                        <p><span className="font-extrabold text-ink">Recommended flour for 48–72h cold fermentation:</span> {longHorizonRecommendation.recommendedFlourLabel}, {longHorizonRecommendation.recommendedFlourStrengthGuidance}</p>
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-[1.25rem] border border-ink/10 bg-cream p-4 text-sm leading-6 text-ink/65">
                  Add a valid target pizza time for stronger recommendations. The dough amounts above are still calculated from your saved session choices.
                </div>
              )}
            </article>
          </div>
        </section>

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
            <Link
              href="/session/shopping"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 sm:w-auto"
            >
              Continue to Shopping →
            </Link>
          )}
        />
      </SessionWorkspaceLayout>
    </main>
  );
}
