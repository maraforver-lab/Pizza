"use client";

import { useMemo, useState } from "react";
import EditableNumberInput from "@/components/EditableNumberInput";
import {
  calculateQuickDough,
  quickCalculatorDefaults,
  quickCalculatorFermentationOptions,
  quickCalculatorYeastOptions,
  type QuickCalculatorInput,
} from "@/lib/quick-calculator/quick-dough-calculator";
import type { Fermentation, YeastType } from "@/lib/saved-recipes";

const numberInputClassName = "mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10";
const selectClassName = "mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10";

function formatGrams(value: number, precise = false) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: precise ? 2 : 0,
    minimumFractionDigits: precise ? 2 : 0,
  }).format(value);
}

function updateInput<K extends keyof QuickCalculatorInput>(
  setInput: (updater: (current: QuickCalculatorInput) => QuickCalculatorInput) => void,
  key: K,
  value: QuickCalculatorInput[K],
) {
  setInput((current) => ({ ...current, [key]: value }));
}

export default function QuickDoughCalculator() {
  const [input, setInput] = useState<QuickCalculatorInput>(quickCalculatorDefaults);
  const result = useMemo(() => calculateQuickDough(input), [input]);

  const selectedFermentation = quickCalculatorFermentationOptions.find((option) => option.value === result.input.fermentation)
    ?? quickCalculatorFermentationOptions[0];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(233,75,46,0.10),transparent_32rem),linear-gradient(180deg,#fff8f1_0%,#f6ecdf_48%,#fff8f1_100%)] px-4 py-8 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.65fr)] lg:items-start">
        <section className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-card backdrop-blur sm:p-7" aria-labelledby="quick-calculator-heading">
          <p className="text-xs font-extrabold uppercase tracking-[.26em] text-tomato">DoughTools calculator</p>
          <h1 id="quick-calculator-heading" className="mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl">
            Quick Dough Calculator
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/65 sm:text-base">
            A standalone calculator for ingredient amounts only. It does not read, create or update a Pizza Session.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-ink/70">Dough balls / pizzas</span>
              <EditableNumberInput
                value={result.input.pizzaCount}
                min={1}
                max={50}
                className={numberInputClassName}
                aria-label="Dough balls or pizzas"
                onValueChange={(value) => updateInput(setInput, "pizzaCount", value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink/70">Dough ball weight</span>
              <EditableNumberInput
                value={result.input.doughBallWeightGrams}
                min={100}
                max={1000}
                className={numberInputClassName}
                aria-label="Dough ball weight in grams"
                onValueChange={(value) => updateInput(setInput, "doughBallWeightGrams", value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink/70">Hydration</span>
              <EditableNumberInput
                value={result.input.hydrationPercent}
                min={40}
                max={100}
                className={numberInputClassName}
                aria-label="Hydration percentage"
                onValueChange={(value) => updateInput(setInput, "hydrationPercent", value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink/70">Salt</span>
              <EditableNumberInput
                value={result.input.saltPercent}
                min={0}
                max={10}
                className={numberInputClassName}
                aria-label="Salt percentage"
                onValueChange={(value) => updateInput(setInput, "saltPercent", value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink/70">Leavening type</span>
              <select
                value={result.input.yeastType}
                onChange={(event) => updateInput(setInput, "yeastType", event.target.value as YeastType)}
                className={selectClassName}
                aria-label="Leavening type"
              >
                {quickCalculatorYeastOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink/70">Fermentation</span>
              <select
                value={result.input.fermentation}
                onChange={(event) => {
                  const fermentation = event.target.value as Fermentation;
                  const option = quickCalculatorFermentationOptions.find((item) => item.value === fermentation);
                  setInput((current) => ({
                    ...current,
                    fermentation,
                    fermentationTemperatureCelsius: option?.temperatureCelsius ?? current.fermentationTemperatureCelsius,
                  }));
                }}
                className={selectClassName}
                aria-label="Fermentation preset"
              >
                {quickCalculatorFermentationOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink/70">Fermentation temperature</span>
              <EditableNumberInput
                value={result.input.fermentationTemperatureCelsius}
                min={0}
                max={30}
                className={numberInputClassName}
                aria-label="Fermentation temperature in Celsius"
                onValueChange={(value) => updateInput(setInput, "fermentationTemperatureCelsius", value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink/70">Extra for waste</span>
              <EditableNumberInput
                value={result.input.wastePercent}
                min={0}
                max={25}
                className={numberInputClassName}
                aria-label="Extra for waste percentage"
                onValueChange={(value) => updateInput(setInput, "wastePercent", value)}
              />
            </label>
          </div>

          <p className="mt-6 rounded-2xl bg-ink/[.04] p-4 text-xs leading-5 text-ink/55">
            Foundation mode: this page only calculates dough ingredient amounts. Planning workflows and account storage remain separate.
          </p>
        </section>

        <aside className="rounded-[2rem] bg-ink p-5 text-white shadow-card sm:p-7" aria-labelledby="quick-calculator-results">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/45">Result</p>
          <h2 id="quick-calculator-results" className="mt-2 font-display text-3xl font-semibold">Ingredient amounts</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            {result.input.pizzaCount} × {result.input.doughBallWeightGrams} g · {result.input.hydrationPercent}% hydration · {selectedFermentation.label}
          </p>

          <dl className="mt-6 divide-y divide-white/10">
            {[
              ["Total dough", result.ingredients.total, false],
              ["Flour", result.ingredients.flour, false],
              ["Water", result.ingredients.water, false],
              ["Salt", result.ingredients.salt, false],
              [quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Leavening", result.ingredients.leavener, true],
            ].map(([label, value, precise]) => (
              <div key={String(label)} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <dt className="text-sm font-semibold text-white/62">{label}</dt>
                <dd className="text-2xl font-extrabold tabular-nums">
                  {formatGrams(Number(value), Boolean(precise))} <span className="text-sm text-white/35">g</span>
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </main>
  );
}
