"use client";

import { useMemo, useState } from "react";
import EditableNumberInput from "@/components/EditableNumberInput";
import {
  calculateQuickDough,
  defaultQuickFermentationTemperature,
  quickCalculatorDefaults,
  quickCalculatorDurationOptions,
  quickCalculatorEnvironmentOptions,
  quickCalculatorYeastOptions,
  type QuickCalculatorInput,
  type QuickFermentationDuration,
  type QuickFermentationEnvironment,
} from "@/lib/quick-calculator/quick-dough-calculator";
import type { YeastType } from "@/lib/saved-recipes";

type CopyState = "idle" | "copied" | "unavailable";

const numberInputClassName = "h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 pr-11 text-base font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10";

function formatGrams(value: number, precise = false) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: precise ? 2 : 0,
    minimumFractionDigits: precise ? 2 : 0,
  }).format(value);
}

function formatPercent(value: number, digits = 1) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function updateInput<K extends keyof QuickCalculatorInput>(
  setInput: (updater: (current: QuickCalculatorInput) => QuickCalculatorInput) => void,
  key: K,
  value: QuickCalculatorInput[K],
) {
  setInput((current) => ({ ...current, [key]: value }));
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
  secondary = false,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
  secondary?: boolean;
}) {
  const decrease = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const increase = () => onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <div className={`rounded-[1.35rem] border p-4 ${secondary ? "border-ink/10 bg-ink/[.025]" : "border-white/80 bg-white/70 shadow-sm"}`}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-extrabold text-ink/72">{label}</label>
        <span className="rounded-full bg-ink/[.055] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-ink/45">{suffix}</span>
      </div>
      <div className="mt-3 grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="grid h-12 place-items-center border-r border-ink/10 text-2xl font-black text-ink/65 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          −
        </button>
        <div className="relative min-w-0">
          <EditableNumberInput
            id={id}
            value={value}
            min={min}
            max={max}
            className={`${numberInputClassName} border-0 text-center focus:ring-0`}
            aria-label={label}
            onValueChange={onChange}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/35">{suffix}</span>
        </div>
        <button
          type="button"
          onClick={increase}
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="grid h-12 place-items-center border-l border-ink/10 text-2xl font-black text-ink/65 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          +
        </button>
      </div>
    </div>
  );
}

function OptionButton<T extends string>({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
        selected ? "border-tomato bg-tomato text-white shadow-lg shadow-tomato/15" : "border-ink/10 bg-white text-ink hover:border-ink/25"
      }`}
    >
      <span className="block text-sm font-extrabold">{label}</span>
      {description && <span className={`mt-1 block text-xs leading-5 ${selected ? "text-white/72" : "text-ink/48"}`}>{description}</span>}
    </button>
  );
}

export default function QuickDoughCalculator() {
  const [input, setInput] = useState<QuickCalculatorInput>(quickCalculatorDefaults);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const result = useMemo(() => calculateQuickDough(input), [input]);

  const selectedEnvironment = quickCalculatorEnvironmentOptions.find((option) => option.value === result.input.fermentationEnvironment)
    ?? quickCalculatorEnvironmentOptions[0];
  const yeastLabel = quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Leavening";

  const resetCalculator = () => {
    setInput(quickCalculatorDefaults);
    setCopyState("idle");
  };

  const copyRecipe = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(result.summaryText);
      setCopyState("copied");
    } catch {
      setCopyState("unavailable");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(233,75,46,0.10),transparent_32rem),linear-gradient(180deg,#fff8f1_0%,#f6ecdf_48%,#fff8f1_100%)] px-4 py-6 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-7" aria-labelledby="quick-calculator-heading">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.58fr)] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.26em] text-tomato">DoughTools calculator</p>
              <h1 id="quick-calculator-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
                Quick Dough Calculator
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/65 sm:text-base">
                Enter dough values, get ingredient amounts, then leave with the recipe. This tool does not save or start a pizza workflow.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-[1.5rem] bg-ink/[.04] p-3 text-center">
              <div className="rounded-2xl bg-white p-3">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.14em] text-ink/40">Batch</span>
                <strong className="mt-1 block text-lg text-ink">{result.input.pizzaCount} × {result.input.doughBallWeightGrams} g</strong>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <span className="block text-[10px] font-extrabold uppercase tracking-[.14em] text-ink/40">Total dough</span>
                <strong className="mt-1 block text-lg text-ink">{formatGrams(result.ingredients.total)} g</strong>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.62fr)] lg:items-start">
          <section className="grid gap-5" aria-label="Quick calculator inputs">
            <div className="rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">01 · Batch</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">Pizza count and dough size</h2>
                </div>
                <p className="text-xs font-bold leading-5 text-ink/45 sm:max-w-xs sm:text-right">Results update immediately as values change.</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <NumberField
                  id="quick-pizza-count"
                  label="Number of pizzas"
                  value={result.input.pizzaCount}
                  min={1}
                  max={50}
                  suffix="pizzas"
                  onChange={(value) => updateInput(setInput, "pizzaCount", value)}
                />
                <NumberField
                  id="quick-ball-weight"
                  label="Dough-ball weight"
                  value={result.input.doughBallWeightGrams}
                  min={100}
                  max={1000}
                  step={5}
                  suffix="g"
                  onChange={(value) => updateInput(setInput, "doughBallWeightGrams", value)}
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-6">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">02 · Formula</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">Baker’s percentages</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <NumberField
                  id="quick-hydration"
                  label="Hydration"
                  value={result.input.hydrationPercent}
                  min={40}
                  max={100}
                  step={0.5}
                  suffix="%"
                  onChange={(value) => updateInput(setInput, "hydrationPercent", value)}
                />
                <NumberField
                  id="quick-salt"
                  label="Salt"
                  value={result.input.saltPercent}
                  min={0}
                  max={10}
                  step={0.1}
                  suffix="%"
                  onChange={(value) => updateInput(setInput, "saltPercent", value)}
                />
                <NumberField
                  id="quick-extra-dough"
                  label="Extra dough"
                  value={result.input.wastePercent}
                  min={0}
                  max={25}
                  step={0.5}
                  suffix="%"
                  secondary
                  onChange={(value) => updateInput(setInput, "wastePercent", value)}
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-6">
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">03 · Fermentation</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">Time, place and yeast</h2>

              <fieldset className="mt-5">
                <legend className="text-sm font-extrabold text-ink/72">Fermentation time</legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {quickCalculatorDurationOptions.map((option) => (
                    <OptionButton<QuickFermentationDuration>
                      key={option.value}
                      label={option.label}
                      selected={result.input.fermentationDuration === option.value}
                      onClick={() => updateInput(setInput, "fermentationDuration", option.value)}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-5">
                <legend className="text-sm font-extrabold text-ink/72">Fermentation</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {quickCalculatorEnvironmentOptions.map((option) => (
                    <OptionButton<QuickFermentationEnvironment>
                      key={option.value}
                      label={option.label}
                      description={option.value === "room" ? "Default 22 °C" : "Default 4 °C"}
                      selected={result.input.fermentationEnvironment === option.value}
                      onClick={() => {
                        setInput((current) => ({
                          ...current,
                          fermentationEnvironment: option.value,
                          fermentationTemperatureCelsius: defaultQuickFermentationTemperature(option.value),
                        }));
                      }}
                    />
                  ))}
                </div>
              </fieldset>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <NumberField
                  id="quick-fermentation-temperature"
                  label="Fermentation temperature"
                  value={result.input.fermentationTemperatureCelsius}
                  min={0}
                  max={30}
                  suffix="°C"
                  onChange={(value) => updateInput(setInput, "fermentationTemperatureCelsius", value)}
                />
                <label className="rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm">
                  <span className="text-sm font-extrabold text-ink/72">Yeast type</span>
                  <select
                    value={result.input.yeastType}
                    onChange={(event) => updateInput(setInput, "yeastType", event.target.value as YeastType)}
                    className="mt-3 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
                    aria-label="Yeast type"
                  >
                    {quickCalculatorYeastOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] bg-ink p-5 text-white shadow-card sm:p-7 lg:sticky lg:top-6" aria-labelledby="quick-calculator-results" aria-live="polite">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/45">Result</p>
            <h2 id="quick-calculator-results" className="mt-2 font-display text-3xl font-semibold">Ingredient amounts</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              {result.input.pizzaCount} pizzas × {result.input.doughBallWeightGrams} g · {result.input.hydrationPercent}% hydration · {selectedEnvironment.label}
            </p>

            <dl className="mt-6 divide-y divide-white/10">
              {[
                ["Total dough", result.ingredients.total, false],
                ["Flour", result.ingredients.flour, false],
                ["Water", result.ingredients.water, false],
                ["Salt", result.ingredients.salt, false],
                [yeastLabel, result.ingredients.leavener, true],
              ].map(([label, value, precise]) => (
                <div key={String(label)} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <dt className="text-sm font-semibold text-white/62">{label}</dt>
                  <dd className="text-2xl font-extrabold tabular-nums">
                    {formatGrams(Number(value), Boolean(precise))} <span className="text-sm text-white/35">g</span>
                  </dd>
                </div>
              ))}
            </dl>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.045] p-4" aria-labelledby="quick-bakers-percentages">
              <h3 id="quick-bakers-percentages" className="text-sm font-extrabold text-white">Baker’s percentages</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-white/45">Flour</dt><dd className="font-extrabold">100%</dd></div>
                <div><dt className="text-white/45">Water</dt><dd className="font-extrabold">{formatPercent(result.bakerPercentages.water)}%</dd></div>
                <div><dt className="text-white/45">Salt</dt><dd className="font-extrabold">{formatPercent(result.bakerPercentages.salt)}%</dd></div>
                <div><dt className="text-white/45">{yeastLabel}</dt><dd className="font-extrabold">{formatPercent(result.bakerPercentages.yeast, 3)}%</dd></div>
              </dl>
            </section>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyRecipe}
                className="rounded-2xl bg-tomato px-4 py-3 text-sm font-extrabold text-white transition hover:bg-tomato/90 active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                {copyState === "copied" ? "Recipe copied" : copyState === "unavailable" ? "Copy unavailable" : "Copy recipe"}
              </button>
              <button
                type="button"
                onClick={resetCalculator}
                className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-extrabold text-white/70 transition hover:bg-white/[.06] hover:text-white active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Reset calculator
              </button>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/42">
              No session is created. No account or workflow data is saved.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
