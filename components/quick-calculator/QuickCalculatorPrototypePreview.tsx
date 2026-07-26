"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import {
  EXPERIENCE_LEVELS,
  getExperienceLevelConfig,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import type { QuickCalculatorPrototypeRegistration } from "@/lib/quick-calculator-prototypes";
import {
  calculateQuickCalculatorPrototypeResult,
  quickCalculatorPrototypeSampleInput,
  type QuickCalculatorPrototypeEditableInput,
} from "@/lib/quick-calculator-prototype-results";
import {
  quickCalculatorDurationOptions,
  quickCalculatorEnvironmentOptions,
  type QuickFermentationDuration,
  type QuickFermentationEnvironment,
} from "@/lib/quick-calculator/quick-dough-calculator";

type PrototypeInputKey = keyof QuickCalculatorPrototypeEditableInput;

const prototypeGuidanceCopy: Record<ExperienceLevel, { heading: string; body: string }> = {
  beginner: {
    heading: "Clear recipe first",
    body: "Start from the recommended batch and adjust only the visible basics: pizzas, dough-ball weight and fermentation.",
  },
  enthusiast: {
    heading: "Practical control",
    body: "Use the same result while comparing how batch size, fermentation and formula changes affect the finished dough.",
  },
  pizza_nerd: {
    heading: "Technical readout",
    body: "Keep the numerical output fixed while exposing the formula assumptions and baker's percentage context around it.",
  },
};

const stageDefinitions = [
  { id: "pizza", label: "Pizza", title: "Pizza and quantity", icon: "pizza" },
  { id: "time", label: "Time", title: "Time and temperature", icon: "clock" },
  { id: "formula", label: "Formula", title: "Formula balance", icon: "scale" },
  { id: "result", label: "Result", title: "Recipe result", icon: "checklist" },
] as const satisfies readonly { id: string; label: string; title: string; icon: DoughToolsIconName }[];

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

function updatePrototypeInput<K extends PrototypeInputKey>(
  setInput: (updater: (current: QuickCalculatorPrototypeEditableInput) => QuickCalculatorPrototypeEditableInput) => void,
  key: K,
  value: QuickCalculatorPrototypeEditableInput[K],
) {
  setInput((current) => ({ ...current, [key]: value }));
}

function PrototypeNumberControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  const decrease = () => onChange(Math.max(min, Number((value - step).toFixed(2))));
  const increase = () => onChange(Math.min(max, Number((value + step).toFixed(2))));

  return (
    <div className="min-w-0 rounded-[1.35rem] border border-ink/10 bg-white/78 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-extrabold leading-5 text-ink/72">{label}</label>
        <span className="rounded-full bg-cream px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-ink/45">{suffix}</span>
      </div>
      <div className="mt-3 grid grid-cols-[2.5rem_minmax(3.5rem,1fr)_auto_2.5rem] overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="grid min-h-11 place-items-center border-r border-ink/10 text-xl font-black text-ink/62 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          -
        </button>
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11 min-w-0 border-0 bg-white px-2 text-center text-base font-extrabold tabular-nums text-ink outline-none focus:ring-0"
        />
        <span className="flex min-h-11 items-center border-l border-ink/10 bg-cream/45 px-2 text-[11px] font-extrabold text-ink/42" aria-hidden="true">
          {suffix}
        </span>
        <button
          type="button"
          onClick={increase}
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="grid min-h-11 place-items-center border-l border-ink/10 text-xl font-black text-ink/62 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          +
        </button>
      </div>
    </div>
  );
}

function PrototypeSegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="rounded-[1.35rem] border border-ink/10 bg-white/78 p-3 shadow-sm">
      <legend className="text-sm font-extrabold text-ink/72">{label}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`min-h-11 rounded-2xl border px-3 text-sm font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                selected ? "border-tomato bg-tomato text-white" : "border-ink/10 bg-white text-ink/65 hover:border-tomato/30"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function PrototypeTitleRow({
  prototype,
}: {
  prototype: QuickCalculatorPrototypeRegistration;
}) {
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white/78 px-4 py-3 shadow-sm sm:px-5" data-prototype-title-row>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold leading-none text-ink sm:text-3xl">{prototype.name}</h1>
            <span className="rounded-full border border-leaf/20 bg-leaf/[.08] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-[.14em] text-leaf">
              {prototype.status}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-5 text-ink/58">
            {prototype.purpose}
          </p>
        </div>
      </div>
    </section>
  );
}

function GuidancePrototypeControl({
  level,
  onChange,
}: {
  level: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
}) {
  const selectedLevel = getExperienceLevelConfig(level);

  return (
    <section
      className="rounded-[1.25rem] border border-ink/10 bg-white/72 p-2 shadow-sm"
      aria-labelledby="quick-prototype-guidance-heading"
      data-prototype-guidance-control
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <fieldset>
          <legend id="quick-prototype-guidance-heading" className="sr-only">Choose prototype guidance level</legend>
          <div className="flex min-w-0 gap-1 overflow-x-auto rounded-2xl bg-cream/80 p-1" role="group" aria-label="Prototype guidance level">
            {EXPERIENCE_LEVELS.map((option) => {
              const active = option.id === selectedLevel.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange(option.id)}
                  className={`min-h-10 shrink-0 rounded-xl border px-3 text-sm font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                    active ? "border-ink bg-white text-ink shadow-sm" : "border-transparent text-ink/58 hover:bg-white/70 hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <p className="px-2 text-xs font-extrabold leading-5 text-ink/48">
          Guidance changes explanation depth only.
        </p>
      </div>
    </section>
  );
}

function PrototypeResultCapsule({
  result,
  compact = false,
}: {
  result: ReturnType<typeof calculateQuickCalculatorPrototypeResult>;
  compact?: boolean;
}) {
  const yeastLabel = result.input.yeastType === "idy" ? "Instant dry yeast" : "Yeast";
  const ingredients = [
    ["Flour", `${formatGrams(result.ingredients.flour)} g`],
    ["Water", `${formatGrams(result.ingredients.water)} g`],
    ["Salt", `${formatGrams(result.ingredients.salt)} g`],
    [yeastLabel, `${formatGrams(result.ingredients.leavener, true)} g`],
  ] as const;

  return (
    <section
      className={`rounded-[2rem] bg-ink p-5 text-white shadow-card ${compact ? "" : "sm:p-7"}`}
      aria-labelledby="quick-prototype-result-heading"
      aria-live="polite"
      data-prototype-result-capsule
    >
      <p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/45">Live recipe</p>
      <h2 id="quick-prototype-result-heading" className="mt-2 font-display text-3xl font-semibold leading-none">
        {formatGrams(result.ingredients.total)} g total dough
      </h2>
      <p className="mt-3 text-sm font-bold leading-6 text-white/60">
        {result.input.pizzaCount} pizzas x {formatGrams(result.sizing.doughWeightPerPieceGrams)} g | {result.input.hydrationPercent}% hydration | {result.input.fermentationDuration} {result.input.fermentationEnvironment}
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ingredients.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/8 p-3">
            <dt className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/42">{label}</dt>
            <dd className="mt-1 text-lg font-extrabold tabular-nums text-white">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PrototypeActions() {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-white/75 p-3 shadow-sm" data-prototype-visual-actions>
      <div className="grid grid-cols-3 gap-2">
        {["Copy", "Save", "Share"].map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setNotice(`${label} is visual only in this admin prototype.`)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-3 text-sm font-extrabold text-ink/68 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            {label}
          </button>
        ))}
      </div>
      {notice ? (
        <p className="mt-2 rounded-xl bg-leaf/[.08] px-3 py-2 text-xs font-extrabold text-leaf" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

function PrototypeNotes({
  level,
}: {
  level: ExperienceLevel;
}) {
  const selectedLevel = getExperienceLevelConfig(level);
  const selectedCopy = prototypeGuidanceCopy[selectedLevel.id];

  return (
    <section className="mt-6 rounded-[1.5rem] border border-ink/10 bg-white/76 p-4 shadow-sm sm:p-5" aria-labelledby="quick-prototype-notes-heading" data-prototype-notes>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Prototype notes</p>
          <h2 id="quick-prototype-notes-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
            Calculator-first comparison
          </h2>
        </div>
        <div className="grid gap-3 text-sm font-bold leading-6 text-ink/58 sm:grid-cols-2">
          <p>Shared sample: 4 pizzas, 260 g dough balls, 24 h cold fermentation, default hydration, default salt and instant dry yeast.</p>
          <p>Edits are in-memory only. Copy, Save and Share are visual prototype controls and do not write storage, sessions, APIs or database data.</p>
          <p>Public `/calculator/quick`, saved recipes and share URLs remain unchanged.</p>
          <p><span className="font-extrabold text-ink">{selectedCopy.heading}:</span> {selectedCopy.body}</p>
        </div>
      </div>
    </section>
  );
}

function EssentialControls({
  input,
  setInput,
  secondary = false,
}: {
  input: QuickCalculatorPrototypeEditableInput;
  setInput: (updater: (current: QuickCalculatorPrototypeEditableInput) => QuickCalculatorPrototypeEditableInput) => void;
  secondary?: boolean;
}) {
  return (
    <div className={`grid gap-3 ${secondary ? "" : "sm:grid-cols-2"}`} data-prototype-essential-controls>
      <PrototypeNumberControl
        id="prototype-pizza-count"
        label="Pizzas"
        value={input.pizzaCount}
        min={1}
        max={12}
        suffix="pizzas"
        onChange={(value) => updatePrototypeInput(setInput, "pizzaCount", value)}
      />
      <PrototypeNumberControl
        id="prototype-ball-weight"
        label="Dough-ball weight"
        value={input.doughBallWeightGrams}
        min={180}
        max={360}
        step={5}
        suffix="g"
        onChange={(value) => updatePrototypeInput(setInput, "doughBallWeightGrams", value)}
      />
    </div>
  );
}

function FormulaControls({
  input,
  setInput,
}: {
  input: QuickCalculatorPrototypeEditableInput;
  setInput: (updater: (current: QuickCalculatorPrototypeEditableInput) => QuickCalculatorPrototypeEditableInput) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-prototype-formula-controls>
      <PrototypeNumberControl
        id="prototype-hydration"
        label="Hydration"
        value={input.hydrationPercent}
        min={55}
        max={75}
        step={0.5}
        suffix="%"
        onChange={(value) => updatePrototypeInput(setInput, "hydrationPercent", value)}
      />
      <PrototypeNumberControl
        id="prototype-salt"
        label="Salt"
        value={input.saltPercent}
        min={1.5}
        max={3.5}
        step={0.1}
        suffix="%"
        onChange={(value) => updatePrototypeInput(setInput, "saltPercent", value)}
      />
    </div>
  );
}

function FermentationControls({
  input,
  setInput,
}: {
  input: QuickCalculatorPrototypeEditableInput;
  setInput: (updater: (current: QuickCalculatorPrototypeEditableInput) => QuickCalculatorPrototypeEditableInput) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-prototype-fermentation-controls>
      <PrototypeSegmentedControl<QuickFermentationDuration>
        label="Fermentation time"
        value={input.fermentationDuration}
        options={quickCalculatorDurationOptions}
        onChange={(value) => updatePrototypeInput(setInput, "fermentationDuration", value)}
      />
      <PrototypeSegmentedControl<QuickFermentationEnvironment>
        label="Fermentation"
        value={input.fermentationEnvironment}
        options={quickCalculatorEnvironmentOptions}
        onChange={(value) => updatePrototypeInput(setInput, "fermentationEnvironment", value)}
      />
    </div>
  );
}

function PrototypeDisclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[1.5rem] border border-ink/10 bg-white/62 p-4 shadow-sm"
      data-prototype-disclosure
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
        <span className="text-sm font-extrabold text-ink">{title}</span>
        <span className="text-xs font-extrabold text-tomato group-open:hidden">Show</span>
        <span className="hidden text-xs font-extrabold text-tomato group-open:inline">Hide</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function FormulaReadout({ result }: { result: ReturnType<typeof calculateQuickCalculatorPrototypeResult> }) {
  return (
    <dl className="grid gap-2 rounded-[1.5rem] border border-ink/10 bg-white/70 p-4 text-sm" data-prototype-formula-readout>
      <div className="flex justify-between gap-3">
        <dt className="font-bold text-ink/48">Flour</dt>
        <dd className="font-extrabold text-ink">100%</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="font-bold text-ink/48">Water</dt>
        <dd className="font-extrabold text-ink">{formatPercent(result.bakerPercentages.water)}%</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="font-bold text-ink/48">Salt</dt>
        <dd className="font-extrabold text-ink">{formatPercent(result.bakerPercentages.salt)}%</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="font-bold text-ink/48">Yeast</dt>
        <dd className="font-extrabold text-ink">{formatPercent(result.bakerPercentages.yeast, 3)}%</dd>
      </div>
    </dl>
  );
}

function InstantRecipeConcept({
  input,
  setInput,
  result,
}: {
  input: QuickCalculatorPrototypeEditableInput;
  setInput: (updater: (current: QuickCalculatorPrototypeEditableInput) => QuickCalculatorPrototypeEditableInput) => void;
  result: ReturnType<typeof calculateQuickCalculatorPrototypeResult>;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,0.58fr)]" data-prototype-layout="instant">
      <section className="order-2 grid min-w-0 gap-4 rounded-[2rem] border border-ink/10 bg-cream/70 p-4 shadow-sm sm:p-5 lg:order-1" aria-label="Instant Recipe controls">
          <div className="mb-4">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Fast edit</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Change the recipe without hunting for controls</h2>
          </div>
          <EssentialControls input={input} setInput={setInput} />
          <FermentationControls input={input} setInput={setInput} />
        <PrototypeDisclosure title="Adjust hydration and salt" defaultOpen>
          <FormulaControls input={input} setInput={setInput} />
        </PrototypeDisclosure>
        <PrototypeDisclosure title="What the formula means">
          <FormulaReadout result={result} />
        </PrototypeDisclosure>
      </section>
      <aside className="order-1 grid min-w-0 gap-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
        <PrototypeResultCapsule result={result} />
        <PrototypeActions />
      </aside>
    </div>
  );
}

function GuidedBuilderConcept({
  input,
  setInput,
  result,
}: {
  input: QuickCalculatorPrototypeEditableInput;
  setInput: (updater: (current: QuickCalculatorPrototypeEditableInput) => QuickCalculatorPrototypeEditableInput) => void;
  result: ReturnType<typeof calculateQuickCalculatorPrototypeResult>;
}) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const activeStage = stageDefinitions[activeStageIndex] ?? stageDefinitions[0];
  const stageContent = [
    <EssentialControls key="pizza" input={input} setInput={setInput} secondary />,
    <FermentationControls key="time" input={input} setInput={setInput} />,
    <FormulaControls key="formula" input={input} setInput={setInput} />,
    <div key="result" className="grid gap-4">
      <PrototypeResultCapsule result={result} compact />
      <FormulaReadout result={result} />
    </div>,
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)_minmax(20rem,0.55fr)]" data-prototype-layout="guided">
      <nav className="rounded-[2rem] border border-ink/10 bg-white/72 p-3 shadow-sm" aria-label="Guided Builder stages">
        <ol className="grid gap-2">
          {stageDefinitions.map((stage, index) => {
            const active = index === activeStageIndex;
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  onClick={() => setActiveStageIndex(index)}
                  aria-current={active ? "step" : undefined}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border px-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                    active ? "border-tomato bg-tomato text-white" : "border-ink/10 bg-cream/40 text-ink hover:border-tomato/25"
                  }`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/80 text-xs font-extrabold text-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold">{stage.label}</span>
                    <span className={`block text-xs ${active ? "text-white/70" : "text-ink/45"}`}>{stage.title}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <section className="rounded-[2rem] border border-ink/10 bg-cream/72 p-4 shadow-sm sm:p-6" aria-labelledby="guided-builder-current-stage">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">
          Step {activeStageIndex + 1} of {stageDefinitions.length}
        </p>
        <h2 id="guided-builder-current-stage" className="mt-2 flex items-center gap-3 font-display text-3xl font-semibold text-ink">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-white text-tomato">
            <DoughToolsIcon name={activeStage.icon} size={24} />
          </span>
          {activeStage.title}
        </h2>
        <div className="mt-5">{stageContent[activeStageIndex]}</div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveStageIndex((index) => Math.max(0, index - 1))}
            disabled={activeStageIndex === 0}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink/68 transition hover:border-tomato/25 disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setActiveStageIndex((index) => Math.min(stageDefinitions.length - 1, index + 1))}
            disabled={activeStageIndex === stageDefinitions.length - 1}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-tomato px-4 text-sm font-extrabold text-white transition hover:bg-forest disabled:opacity-45 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            Next
          </button>
        </div>
      </section>
      <aside className="grid gap-4 lg:sticky lg:top-6 lg:self-start">
        <section className="rounded-[2rem] border border-ink/10 bg-white/78 p-4 shadow-sm">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Mini result</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink">{formatGrams(result.ingredients.total)} g</p>
          <p className="mt-2 text-sm font-bold leading-6 text-ink/55">
            {result.input.pizzaCount} x {formatGrams(result.sizing.doughWeightPerPieceGrams)} g | {formatGrams(result.ingredients.leavener, true)} g instant dry yeast
          </p>
        </section>
        <PrototypeActions />
      </aside>
    </div>
  );
}

function WorkbenchSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: DoughToolsIconName;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white/72 p-4 shadow-sm" aria-labelledby={`workbench-${title.toLowerCase()}-heading`} data-workbench-primary-section={title.toLowerCase()}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-tomato/15 bg-tomato/[.06] text-tomato">
          <DoughToolsIcon name={icon} size={24} />
        </span>
        <h2 id={`workbench-${title.toLowerCase()}-heading`} className="font-display text-2xl font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function WorkbenchConcept({
  input,
  setInput,
  result,
}: {
  input: QuickCalculatorPrototypeEditableInput;
  setInput: (updater: (current: QuickCalculatorPrototypeEditableInput) => QuickCalculatorPrototypeEditableInput) => void;
  result: ReturnType<typeof calculateQuickCalculatorPrototypeResult>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(23rem,0.42fr)]" data-prototype-layout="workbench">
      <div className="order-2 grid min-w-0 gap-4 xl:order-1">
        <WorkbenchSection title="Batch" icon="pizza">
          <EssentialControls input={input} setInput={setInput} />
        </WorkbenchSection>
        <WorkbenchSection title="Fermentation" icon="clock">
          <FermentationControls input={input} setInput={setInput} />
        </WorkbenchSection>
        <WorkbenchSection title="Formula" icon="scale">
          <FormulaControls input={input} setInput={setInput} />
        </WorkbenchSection>
        <p className="rounded-[1.25rem] border border-ink/10 bg-white/62 px-4 py-3 text-sm font-bold leading-6 text-ink/52">
          Workbench keeps related controls in broad sections so labels and values stay readable while the result remains visible.
        </p>
      </div>
      <aside className="order-1 grid min-w-0 gap-4 xl:order-2 xl:sticky xl:top-6 xl:self-start">
        <PrototypeResultCapsule result={result} compact />
        <PrototypeActions />
        <PrototypeDisclosure title="Technical summary" defaultOpen>
          <FormulaReadout result={result} />
        </PrototypeDisclosure>
      </aside>
    </div>
  );
}

export default function QuickCalculatorPrototypePreview({
  prototype,
}: {
  prototype: QuickCalculatorPrototypeRegistration;
}) {
  const [input, setInput] = useState<QuickCalculatorPrototypeEditableInput>(quickCalculatorPrototypeSampleInput);
  const [level, setLevel] = useState<ExperienceLevel>("beginner");
  const result = useMemo(() => calculateQuickCalculatorPrototypeResult(input), [input]);

  return (
    <main
      className="min-h-screen bg-cream px-4 py-4 pb-20 text-ink sm:px-6 sm:py-5"
      data-quick-calculator-prototype={prototype.id}
      data-prototype-connected-to-canonical-engine="calculateQuickDough"
    >
      <div className="mx-auto max-w-7xl">
        <PrototypeTitleRow prototype={prototype} />

        <div className="mt-3">
          <GuidancePrototypeControl level={level} onChange={setLevel} />
        </div>

        <div className="mt-4">
          {prototype.id === "instant" ? (
            <InstantRecipeConcept input={input} setInput={setInput} result={result} />
          ) : null}
          {prototype.id === "guided" ? (
            <GuidedBuilderConcept input={input} setInput={setInput} result={result} />
          ) : null}
          {prototype.id === "workbench" ? (
            <WorkbenchConcept input={input} setInput={setInput} result={result} />
          ) : null}
        </div>

        <PrototypeNotes level={level} />

        <section className="mt-4 rounded-[1.5rem] border border-ink/10 bg-white/70 p-4 shadow-sm sm:p-5" aria-labelledby="quick-prototype-boundary-heading">
          <h2 id="quick-prototype-boundary-heading" className="font-display text-2xl font-semibold text-ink">
            Prototype boundary
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-ink/58">
            This admin-only surface compares presentation structures. It calls the existing Quick Calculator engine for the same result, does not write storage, does not create sessions and does not alter the public calculator route.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin#admin-quick-calculator-prototypes-heading"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/68 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <DoughToolsIcon name="back" size={20} />
              Back to prototypes
            </Link>
            <Link
              href="/calculator/quick"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              View public calculator
              <DoughToolsIcon name="forward" size={20} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
