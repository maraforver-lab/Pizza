"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import EditableNumberInput from "@/components/EditableNumberInput";
import SiteFooter from "@/components/SiteFooter";
import {
  EXPERIENCE_LEVELS,
  getDefaultExperienceLevel,
  readExperienceLevelPreference,
  writeExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import {
  applyQuickPizzaStylePreset,
  quickPizzaStylePresets,
  type QuickPizzaSizingMode,
  type QuickPizzaStyleId,
} from "@/lib/quick-calculator/pizza-sizing";
import {
  applyQuickPrefermentPreset,
  quickPrefermentPresets,
  type QuickPrefermentMethod,
} from "@/lib/quick-calculator/quick-preferments";
import {
  buildQuickCalculatorShareUrl,
  deleteQuickCalculatorSavedRecipe,
  duplicateQuickCalculatorSavedRecipe,
  loadQuickCalculatorSavedRecipes,
  quickCalculatorInputFromSearch,
  renameQuickCalculatorSavedRecipe,
  saveQuickCalculatorRecipe,
  storeQuickCalculatorSavedRecipes,
  type QuickCalculatorSavedRecipeV1,
} from "@/lib/quick-calculator/quick-calculator-storage";
import {
  calculateQuickDough,
  defaultQuickFermentationTemperature,
  getQuickCalculatorPresentation,
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
type RecipeNotice = "idle" | "saved" | "loaded" | "deleted" | "duplicated" | "renamed" | "storage-error";

const numberInputClassName = "h-12 w-full min-w-0 rounded-2xl border border-ink/10 bg-white px-3 text-base font-extrabold tabular-nums text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10";

const quickResultTeachingCopy: Record<ExperienceLevel, string> = {
  beginner: "Weigh every ingredient accurately. Flour and water create the dough, salt adds flavour and strength, and the small yeast amount controls how quickly it ferments.",
  enthusiast: "Hydration describes the water compared with the flour. More water can create a lighter dough, but it also makes handling more demanding.",
  pizza_nerd: "Treat flour as 100%. Water, salt and yeast are baker's percentages relative to flour, which keeps the formula scalable across different batch sizes.",
};

const quickResultNextSteps = [
  ["Weigh accurately", "Use a digital scale for every ingredient."],
  ["Mix completely", "Continue until no dry flour remains."],
  ["Follow the fermentation plan", "Time and temperature determine when the dough is ready."],
] as const;

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

function formatTemperature(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

function savedRecipeSummary(input: QuickCalculatorInput) {
  const savedResult = calculateQuickDough(input);
  return `${savedResult.input.pizzaCount} ${savedResult.input.sizingMode === "pan" ? "pans" : "pizzas"} × ${formatGrams(savedResult.sizing.doughWeightPerPieceGrams)} g · ${savedResult.sizing.style.label} · ${savedResult.preferment.label}`;
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
    <div className={`min-w-0 rounded-[1.35rem] border p-4 ${secondary ? "border-ink/10 bg-ink/[.025]" : "border-white/80 bg-white/70 shadow-sm"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="min-w-0 text-sm font-extrabold leading-5 text-ink/72">{label}</label>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-ink/[.055] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-ink/45">{suffix}</span>
      </div>
      <div className="mt-3 grid grid-cols-[2.5rem_minmax(3.5rem,1fr)_auto_2.5rem] items-stretch overflow-hidden rounded-2xl border border-ink/10 bg-white sm:grid-cols-[3rem_minmax(5.75rem,1fr)_auto_3rem]" data-quick-number-control>
        <button
          type="button"
          onClick={decrease}
          disabled={value <= min}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="grid h-11 place-items-center border-r border-ink/10 text-xl font-black text-ink/65 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:h-12 sm:text-2xl"
        >
          −
        </button>
        <div className="min-w-0">
          <EditableNumberInput
            id={id}
            value={value}
            min={min}
            max={max}
            className={`${numberInputClassName} border-0 text-center focus:ring-0`}
            aria-label={label}
            onValueChange={onChange}
          />
        </div>
        <span className="flex h-11 shrink-0 items-center justify-center whitespace-nowrap border-l border-ink/10 bg-cream/45 px-2 text-[11px] font-extrabold text-ink/42 sm:h-12 sm:px-2.5 sm:text-xs" aria-hidden="true" data-quick-number-unit>{suffix}</span>
        <button
          type="button"
          onClick={increase}
          disabled={value >= max}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="grid h-11 place-items-center border-l border-ink/10 text-xl font-black text-ink/65 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-35 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:h-12 sm:text-2xl"
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

function OptionalControlGroup({
  id,
  title,
  intro,
  summary,
  defaultOpen,
  children,
}: {
  id: string;
  title: string;
  intro: string;
  summary?: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <details
      id={id}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group min-w-0 rounded-[1.5rem] border border-ink/10 bg-white/68 p-4 shadow-sm backdrop-blur sm:p-5"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
        <span className="min-w-0">
          <span className="block text-base font-extrabold text-ink">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-ink/52 sm:text-sm">{intro}</span>
          {summary && (
            <span className="mt-2 inline-flex max-w-full rounded-full bg-ink/[.055] px-3 py-1 text-[11px] font-extrabold text-ink/52">
              {summary}
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-extrabold text-ink/55 group-open:hidden">
          Open
        </span>
        <span className="hidden shrink-0 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-extrabold text-ink/55 group-open:inline-flex">
          Close
        </span>
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="min-w-0 rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm">
      <span className="text-sm font-extrabold text-ink/72">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-3 h-12 w-full min-w-0 rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function QuickCalculatorGuidanceTabs({
  level,
  onSelectLevel,
}: {
  level: ExperienceLevel;
  onSelectLevel: (level: ExperienceLevel) => void;
}) {
  return (
    <section className="mt-4" aria-labelledby="quick-guidance-tabs-heading" data-quick-guidance-tabs>
      <h2 id="quick-guidance-tabs-heading" className="sr-only">Guidance depth</h2>
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-ink/10 bg-white/72 p-1 shadow-sm" role="group" aria-label="Quick Calculator guidance level">
        {EXPERIENCE_LEVELS.map((option) => {
          const active = option.id === level;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectLevel(option.id)}
              aria-pressed={active}
              aria-label={`Select ${option.label} guidance level`}
              className={`min-h-11 rounded-xl px-2 py-2 text-center text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:text-sm ${
                active ? "bg-ink text-white shadow-sm" : "text-ink/58 hover:bg-cream hover:text-ink"
              }`}
            >
              {option.label}
              {active && <span className="sr-only"> selected</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs font-bold text-ink/45">Changes guidance depth only.</p>
    </section>
  );
}

function RecipeResultPanel({
  result,
  presentation,
  experienceLevel,
  copyState,
  shareState,
  recipeNotice,
  onCopyRecipe,
  onSaveRecipe,
  onCopyShareUrl,
  onResetCalculator,
}: {
  result: ReturnType<typeof calculateQuickDough>;
  presentation: ReturnType<typeof getQuickCalculatorPresentation>;
  experienceLevel: ExperienceLevel;
  copyState: CopyState;
  shareState: CopyState;
  recipeNotice: RecipeNotice;
  onCopyRecipe: () => void;
  onSaveRecipe: () => void;
  onCopyShareUrl: () => void;
  onResetCalculator: () => void;
}) {
  const selectedEnvironment = quickCalculatorEnvironmentOptions.find((option) => option.value === result.input.fermentationEnvironment)
    ?? quickCalculatorEnvironmentOptions[0];
  const yeastLabel = quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Leavening";
  const optionalIngredientRows = result.advancedTools.customIngredients.enabled
    ? [
        ["Oil", result.advancedTools.customIngredients.oilGrams],
        ["Sugar", result.advancedTools.customIngredients.sugarGrams],
        ["Malt", result.advancedTools.customIngredients.maltGrams],
      ].filter(([, value]) => Number(value) > 0)
    : [];
  const primaryResults = [
    ["Total dough", `${formatGrams(result.ingredients.total)} g`, "Complete batch"],
    ["Dough balls", String(result.input.pizzaCount), "Pieces in this batch"],
    ["Dough ball weight", `${formatGrams(result.sizing.doughWeightPerPieceGrams)} g`, "Each portion"],
  ] as const;
  const ingredientRows = [
    ["Flour", result.ingredients.flour, false],
    ["Water", result.ingredients.water, false],
    ["Salt", result.ingredients.salt, false],
    [yeastLabel, result.ingredients.leavener, true],
    ...optionalIngredientRows.map(([label, value]) => [label, value, false] as const),
  ] as const;
  const selectedTeaching = quickResultTeachingCopy[experienceLevel];

  return (
    <aside
      className="min-w-0 rounded-[1.75rem] bg-ink p-4 text-white shadow-card sm:p-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1"
      aria-labelledby="quick-calculator-results"
      aria-live="polite"
      data-quick-result-panel
      data-quick-live-recipe
    >
      <p className="text-xs font-extrabold uppercase tracking-[.22em] text-white/45">Live recipe</p>
      <h2 id="quick-calculator-results" className="mt-2 font-display text-3xl font-semibold">Live recipe</h2>
      <p className="mt-2 text-sm leading-6 text-white/58">
        {result.input.hydrationPercent}% hydration · {result.input.fermentationDuration} {selectedEnvironment.label.toLowerCase()} · {formatTemperature(result.input.fermentationTemperatureCelsius)} °C
      </p>

      <dl className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {primaryResults.map(([label, value, helper]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[.055] p-3" data-quick-primary-result>
            <dt className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/40">{label}</dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums">{value}</dd>
            <p className="mt-1 text-[11px] leading-4 text-white/36">{helper}</p>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        <h3 className="text-sm font-extrabold text-white">Ingredient amounts</h3>
        <dl className="mt-3 divide-y divide-white/10">
          {ingredientRows.map(([label, value, precise]) => (
          <div key={String(label)} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <dt className="text-sm font-semibold text-white/62">{label === yeastLabel ? "Yeast" : label}</dt>
            <dd className="text-2xl font-extrabold tabular-nums">
              {formatGrams(Number(value), Boolean(precise))} <span className="text-sm text-white/35">g</span>
              {label === yeastLabel && <span className="mt-1 block text-right text-[11px] font-bold text-white/35">{yeastLabel}</span>}
            </dd>
          </div>
          ))}
        </dl>
      </div>

      <p className="mt-4 rounded-2xl border border-white/10 bg-white/[.045] p-3 text-sm leading-6 text-white/64">
        {selectedTeaching}
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2" data-quick-result-actions>
        <button
          type="button"
          onClick={onCopyRecipe}
          className="rounded-2xl bg-tomato px-3 py-3 text-xs font-extrabold text-white transition hover:bg-tomato/90 active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:text-sm"
          aria-label="Copy recipe"
        >
          {copyState === "copied" ? "Copied" : copyState === "unavailable" ? "Unavailable" : "Copy recipe"}
        </button>
        <button
          type="button"
          onClick={onSaveRecipe}
          className="rounded-2xl border border-white/15 bg-white/[.06] px-3 py-3 text-xs font-extrabold text-white/82 transition hover:bg-white/[.1] active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:text-sm"
          aria-label="Save recipe"
        >
          Save recipe
        </button>
        <button
          type="button"
          onClick={onCopyShareUrl}
          className="rounded-2xl border border-white/15 bg-white/[.06] px-3 py-3 text-xs font-extrabold text-white/82 transition hover:bg-white/[.1] active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:text-sm"
          aria-label="Share recipe"
        >
          {shareState === "copied" ? "Shared" : shareState === "unavailable" ? "Unavailable" : "Share recipe"}
        </button>
      </div>

      {(copyState !== "idle" || shareState !== "idle" || recipeNotice !== "idle") && (
        <p className="mt-3 rounded-2xl bg-white/[.06] px-4 py-3 text-xs font-extrabold text-white/70" role={copyState === "unavailable" || shareState === "unavailable" || recipeNotice === "storage-error" ? "alert" : "status"}>
          {copyState === "copied" && "Recipe copied."}
          {copyState === "unavailable" && "Copy is unavailable in this browser."}
          {shareState === "copied" && "Share link copied."}
          {shareState === "unavailable" && "Share link copy is unavailable in this browser."}
          {recipeNotice === "saved" && "Recipe saved in this browser."}
          {recipeNotice === "loaded" && "Recipe loaded."}
          {recipeNotice === "deleted" && "Recipe deleted."}
          {recipeNotice === "duplicated" && "Recipe duplicated."}
          {recipeNotice === "renamed" && "Recipe renamed."}
          {recipeNotice === "storage-error" && "This browser could not update saved recipes."}
        </p>
      )}

      <p className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-xs leading-5 text-white/42">
        Saved recipes stay in this browser. Sharing creates a link containing these calculator settings.
      </p>

      <button
        type="button"
        onClick={onResetCalculator}
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-2xl border border-white/15 px-4 py-2.5 text-xs font-extrabold text-white/56 transition hover:bg-white/[.06] hover:text-white active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        Reset calculator
      </button>

      {presentation.resultDetail !== "simple" && (
        <p className="mt-3 text-xs leading-5 text-white/42">
          Same input values produce the same ingredient output in every guidance mode.
        </p>
      )}

      <p className="mt-3 text-xs font-bold leading-5 text-white/45">
        Very small yeast amounts may require a 0.01 g scale.
      </p>
    </aside>
  );
}

export default function QuickDoughCalculator() {
  const [input, setInput] = useState<QuickCalculatorInput>(quickCalculatorDefaults);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [shareState, setShareState] = useState<CopyState>("idle");
  const [recipeNotice, setRecipeNotice] = useState<RecipeNotice>("idle");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());
  const [recipeName, setRecipeName] = useState("My quick dough");
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<QuickCalculatorSavedRecipeV1[]>([]);
  const result = useMemo(() => calculateQuickDough(input), [input]);
  const presentation = getQuickCalculatorPresentation(experienceLevel);

  const selectedEnvironment = quickCalculatorEnvironmentOptions.find((option) => option.value === result.input.fermentationEnvironment)
    ?? quickCalculatorEnvironmentOptions[0];
  const yeastLabel = quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Leavening";
  const quantityLabel = result.input.sizingMode === "pan" ? "Number of pans" : "Number of pizzas";
  const formulaDefaultOpen = experienceLevel !== "beginner";
  const yeastTemperatureDefaultOpen = experienceLevel === "pizza_nerd";
  const bakerPercentagesDefaultOpen = experienceLevel === "pizza_nerd";
  const sizingActive = result.input.sizingMode !== "ball-weight" || result.input.pizzaStyle !== "neapolitan";
  const prefermentActive = result.input.prefermentMethod !== "direct";
  const technicalToolsActive = result.input.customIngredientsEnabled
    || result.input.flourBlendEnabled
    || result.input.targetDoughTemperatureCelsius !== quickCalculatorDefaults.targetDoughTemperatureCelsius;
  const fermentationTemperatureSummary = `${selectedEnvironment.label} · ${formatTemperature(result.input.fermentationTemperatureCelsius)} °C`;
  const formulaItems = [
    ["Flour", "100%"],
    ["Water", `${formatPercent(result.bakerPercentages.water)}%`],
    ["Salt", `${formatPercent(result.bakerPercentages.salt)}%`],
    ["Yeast", presentation.showTechnicalResult ? `${formatPercent(result.bakerPercentages.yeast, 3)}%` : `${formatGrams(result.ingredients.leavener, true)} g`],
  ] as const;

  const updateGuidanceLevel = (level: ExperienceLevel) => {
    const savedLevel = writeExperienceLevelPreference(level);

    setExperienceLevel(savedLevel);
  };

  useEffect(() => {
    setExperienceLevel(readExperienceLevelPreference());
    setSavedRecipes(loadQuickCalculatorSavedRecipes());
    const sharedInput = typeof window !== "undefined"
      ? quickCalculatorInputFromSearch(window.location.search)
      : undefined;
    if (sharedInput) {
      setInput(sharedInput);
      setRecipeName("Shared quick recipe");
      setActiveRecipeId(null);
      setRecipeNotice("loaded");
    }
  }, []);

  const resetCalculator = () => {
    setInput(quickCalculatorDefaults);
    setCopyState("idle");
    setShareState("idle");
    setRecipeNotice("idle");
    setRecipeName("My quick dough");
    setActiveRecipeId(null);
  };

  const applyStyle = (styleId: QuickPizzaStyleId) => {
    setInput((current) => {
      const sizing = applyQuickPizzaStylePreset({
        sizingMode: current.sizingMode,
        pizzaStyle: current.pizzaStyle,
        quantity: current.pizzaCount,
        ballWeightGrams: current.doughBallWeightGrams,
        diameterCm: current.diameterCm,
        panWidthCm: current.panWidthCm,
        panLengthCm: current.panLengthCm,
        thicknessFactor: current.thicknessFactor,
        doughLoadingGramsPerSquareCm: current.doughLoadingGramsPerSquareCm,
        customDoughWeightGrams: current.customDoughWeightGrams,
      }, styleId);

      return {
        ...current,
        pizzaCount: sizing.quantity,
        doughBallWeightGrams: sizing.ballWeightGrams,
        sizingMode: sizing.sizingMode,
        pizzaStyle: sizing.pizzaStyle,
        diameterCm: sizing.diameterCm,
        panWidthCm: sizing.panWidthCm,
        panLengthCm: sizing.panLengthCm,
        thicknessFactor: sizing.thicknessFactor,
        doughLoadingGramsPerSquareCm: sizing.doughLoadingGramsPerSquareCm,
        customDoughWeightGrams: sizing.customDoughWeightGrams,
      };
    });
  };

  const persistRecipes = (next: QuickCalculatorSavedRecipeV1[], notice: RecipeNotice) => {
    try {
      storeQuickCalculatorSavedRecipes(next);
      setSavedRecipes(next);
      setRecipeNotice(notice);
    } catch {
      setRecipeNotice("storage-error");
    }
  };

  const saveCurrentRecipe = () => {
    const next = saveQuickCalculatorRecipe(savedRecipes, result.input, recipeName, activeRecipeId);
    const saved = activeRecipeId
      ? next.find((recipe) => recipe.id === activeRecipeId)
      : next[0];
    persistRecipes(next, "saved");
    if (saved) {
      setActiveRecipeId(saved.id);
      setRecipeName(saved.name);
    }
  };

  const loadSavedRecipe = (recipe: QuickCalculatorSavedRecipeV1) => {
    setInput(recipe.input);
    setRecipeName(recipe.name);
    setActiveRecipeId(recipe.id);
    setCopyState("idle");
    setShareState("idle");
    setRecipeNotice("loaded");
  };

  const renameSavedRecipe = (id: string, name: string) => {
    const next = renameQuickCalculatorSavedRecipe(savedRecipes, id, name);
    persistRecipes(next, "renamed");
    if (activeRecipeId === id) setRecipeName(next.find((recipe) => recipe.id === id)?.name ?? name);
  };

  const duplicateSavedRecipe = (id: string) => {
    persistRecipes(duplicateQuickCalculatorSavedRecipe(savedRecipes, id), "duplicated");
  };

  const deleteSavedRecipe = (id: string) => {
    persistRecipes(deleteQuickCalculatorSavedRecipe(savedRecipes, id), "deleted");
    if (activeRecipeId === id) {
      setActiveRecipeId(null);
      setRecipeName("My quick dough");
    }
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

  const copyShareUrl = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(buildQuickCalculatorShareUrl(result.input));
      setShareState("copied");
    } catch {
      setShareState("unavailable");
    }
  };

  const formulaControls = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
  );

  const commercialYeastOptions = quickCalculatorYeastOptions.filter((option) => option.value === "idy" || option.value === "ady" || option.value === "cy");

  const fermentationDetailControls = (
    <div className="grid gap-4 sm:grid-cols-2">
      <NumberField
        id="quick-fermentation-temperature"
        label="Fermentation temperature"
        value={result.input.fermentationTemperatureCelsius}
        min={0}
        max={30}
        suffix="°C"
        onChange={(value) => updateInput(setInput, "fermentationTemperatureCelsius", value)}
      />
      <SelectField<YeastType>
        id="quick-yeast-type"
        label="Yeast type"
        value={result.input.yeastType}
        options={quickCalculatorYeastOptions}
        onChange={(value) => updateInput(setInput, "yeastType", value)}
      />
    </div>
  );

  const advancedControls = (
    <div className="grid gap-4" data-quick-advanced-tools>
      <section className="rounded-[1.5rem] border border-ink/10 bg-white/65 p-4" aria-labelledby="quick-dough-temperature-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-tomato">Dough temperature</p>
            <h3 id="quick-dough-temperature-heading" className="mt-1 text-xl font-extrabold text-ink">Target dough temperature and water temperature</h3>
          </div>
          <p className="text-xs leading-5 text-ink/45 sm:max-w-xs sm:text-right">
            Water temperature estimate only; it does not change the ingredient formula.
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            id="quick-target-dough-temperature"
            label="Target dough temperature"
            value={result.input.targetDoughTemperatureCelsius}
            min={10}
            max={35}
            step={0.5}
            suffix="°C"
            onChange={(value) => updateInput(setInput, "targetDoughTemperatureCelsius", value)}
          />
          <NumberField
            id="quick-flour-temperature"
            label="Flour temperature"
            value={result.input.flourTemperatureCelsius}
            min={0}
            max={35}
            step={0.5}
            suffix="°C"
            onChange={(value) => updateInput(setInput, "flourTemperatureCelsius", value)}
          />
          <NumberField
            id="quick-room-temperature"
            label="Room temperature"
            value={result.input.roomTemperatureCelsius}
            min={0}
            max={35}
            step={0.5}
            suffix="°C"
            onChange={(value) => updateInput(setInput, "roomTemperatureCelsius", value)}
          />
          <NumberField
            id="quick-preferment-temperature"
            label="Preferment temperature"
            value={result.input.prefermentTemperatureCelsius}
            min={0}
            max={35}
            step={0.5}
            suffix="°C"
            secondary={result.input.prefermentMethod === "direct"}
            onChange={(value) => updateInput(setInput, "prefermentTemperatureCelsius", value)}
          />
          <NumberField
            id="quick-mixer-friction"
            label="Mixer friction heat"
            value={result.input.mixerFrictionCelsius}
            min={0}
            max={20}
            step={0.5}
            suffix="°C"
            onChange={(value) => updateInput(setInput, "mixerFrictionCelsius", value)}
          />
          <div className="rounded-[1.35rem] bg-ink/[.04] p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">Required water</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">
              {formatTemperature(result.advancedTools.waterTemperature.requiredWaterTemperatureCelsius)} °C
            </p>
            <p className="mt-1 text-xs leading-5 text-ink/45">
              {result.advancedTools.waterTemperature.factorCount} factors · includes preferment temperature only for prefermented dough.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-ink/10 bg-white/65 p-4" aria-labelledby="quick-yeast-tools-heading">
        <h3 id="quick-yeast-tools-heading" className="text-xl font-extrabold text-ink">Yeast tools</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm">
            <h4 className="text-sm font-extrabold text-ink/72">Yeast converter</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <NumberField
                id="quick-yeast-conversion-amount"
                label="Yeast amount"
                value={result.input.yeastConversionAmountGrams}
                min={0}
                max={500}
                step={0.1}
                suffix="g"
                onChange={(value) => updateInput(setInput, "yeastConversionAmountGrams", value)}
              />
              <SelectField<YeastType>
                id="quick-yeast-conversion-from"
                label="From"
                value={result.input.yeastConversionFrom}
                options={commercialYeastOptions}
                onChange={(value) => updateInput(setInput, "yeastConversionFrom", value)}
              />
              <SelectField<YeastType>
                id="quick-yeast-conversion-to"
                label="To"
                value={result.input.yeastConversionTo}
                options={commercialYeastOptions}
                onChange={(value) => updateInput(setInput, "yeastConversionTo", value)}
              />
            </div>
            <p className="mt-3 rounded-2xl bg-ink/[.04] px-4 py-3 text-sm font-extrabold text-ink">
              Converted yeast: {formatGrams(result.advancedTools.yeastConversion.convertedGrams, true)} g
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-extrabold text-ink/72">Reverse fermentation</h4>
            <p className="mb-3 text-xs leading-5 text-ink/45">Estimate the yeast amount for a target fermentation time.</p>
            <NumberField
              id="quick-reverse-fermentation-hours"
              label="Reverse fermentation target"
              value={result.input.reverseFermentationHours}
              min={1}
              max={96}
              step={1}
              suffix="h"
              onChange={(value) => updateInput(setInput, "reverseFermentationHours", value)}
            />
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-ink/45">Yeast for target</dt>
              <dd className="text-right font-extrabold">{formatGrams(result.advancedTools.reverseFermentation.yeastGramsForTargetHours, true)} g</dd>
              <dt className="text-ink/45">Current yeast estimates</dt>
              <dd className="text-right font-extrabold">
                {result.advancedTools.reverseFermentation.estimatedHoursFromCurrentYeast === null
                  ? "—"
                  : `${formatTemperature(result.advancedTools.reverseFermentation.estimatedHoursFromCurrentYeast)} h`}
              </dd>
            </dl>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-ink/10 bg-white/65 p-4" aria-labelledby="quick-custom-tools-heading">
        <h3 id="quick-custom-tools-heading" className="text-xl font-extrabold text-ink">Custom ingredients and Flour blend</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm">
            <label className="flex items-start gap-3 text-sm font-extrabold text-ink/72">
              <input
                type="checkbox"
                checked={result.input.customIngredientsEnabled}
                onChange={(event) => updateInput(setInput, "customIngredientsEnabled", event.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-ink/20 text-tomato focus:ring-tomato"
              />
              Add optional oil, sugar or malt amounts
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <NumberField id="quick-oil-percent" label="Oil" value={result.input.oilPercent} min={0} max={20} step={0.5} suffix="%" onChange={(value) => updateInput(setInput, "oilPercent", value)} secondary={!result.input.customIngredientsEnabled} />
              <NumberField id="quick-sugar-percent" label="Sugar" value={result.input.sugarPercent} min={0} max={20} step={0.5} suffix="%" onChange={(value) => updateInput(setInput, "sugarPercent", value)} secondary={!result.input.customIngredientsEnabled} />
              <NumberField id="quick-malt-percent" label="Malt" value={result.input.maltPercent} min={0} max={10} step={0.1} suffix="%" onChange={(value) => updateInput(setInput, "maltPercent", value)} secondary={!result.input.customIngredientsEnabled} />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><dt className="text-ink/42">Oil</dt><dd className="font-extrabold">{formatGrams(result.advancedTools.customIngredients.oilGrams)} g</dd></div>
              <div><dt className="text-ink/42">Sugar</dt><dd className="font-extrabold">{formatGrams(result.advancedTools.customIngredients.sugarGrams)} g</dd></div>
              <div><dt className="text-ink/42">Malt</dt><dd className="font-extrabold">{formatGrams(result.advancedTools.customIngredients.maltGrams)} g</dd></div>
            </dl>
            {result.advancedTools.customIngredients.enabled && (
              <p className="mt-3 rounded-2xl bg-ink/[.04] px-4 py-3 text-xs font-extrabold text-ink/58">
                Enhanced dough total: {formatGrams(
                  result.ingredients.total
                  + result.advancedTools.customIngredients.oilGrams
                  + result.advancedTools.customIngredients.sugarGrams
                  + result.advancedTools.customIngredients.maltGrams,
                )} g
              </p>
            )}
          </div>
          <div className="rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm">
            <label className="flex items-start gap-3 text-sm font-extrabold text-ink/72">
              <input
                type="checkbox"
                checked={result.input.flourBlendEnabled}
                onChange={(event) => updateInput(setInput, "flourBlendEnabled", event.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-ink/20 text-tomato focus:ring-tomato"
              />
              Split total flour into a simple two-flour blend
            </label>
            <div className="mt-4">
              <NumberField
                id="quick-flour-blend-primary"
                label="Primary flour"
                value={result.input.flourBlendPrimaryPercent}
                min={0}
                max={100}
                step={1}
                suffix="%"
                secondary={!result.input.flourBlendEnabled}
                onChange={(value) => updateInput(setInput, "flourBlendPrimaryPercent", value)}
              />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <dt className="text-ink/45">Primary {formatPercent(result.input.flourBlendPrimaryPercent, 0)}%</dt><dd className="text-right font-extrabold">{formatGrams(result.advancedTools.flourBlend.primaryFlourGrams)} g</dd>
              <dt className="text-ink/45">Secondary flour {formatPercent(result.input.flourBlendSecondaryPercent, 0)}%</dt><dd className="text-right font-extrabold">{formatGrams(result.advancedTools.flourBlend.secondaryFlourGrams)} g</dd>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );

  const applyPreferment = (method: QuickPrefermentMethod) => {
    setInput((current) => {
      const preferment = applyQuickPrefermentPreset({
        method: current.prefermentMethod,
        prefermentedFlourPercent: current.prefermentedFlourPercent,
        prefermentHydrationPercent: current.prefermentHydrationPercent,
        prefermentInoculationPercent: current.prefermentInoculationPercent,
      }, method);

      return {
        ...current,
        prefermentMethod: preferment.method,
        prefermentedFlourPercent: preferment.prefermentedFlourPercent,
        prefermentHydrationPercent: preferment.prefermentHydrationPercent,
        prefermentInoculationPercent: preferment.prefermentInoculationPercent,
      };
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(233,75,46,0.10),transparent_32rem),linear-gradient(180deg,#fff8f1_0%,#f6ecdf_48%,#fff8f1_100%)] text-ink">
      <main className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="max-w-3xl" aria-labelledby="quick-calculator-heading" data-quick-page-identity>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Quick calculator</p>
            <h1 id="quick-calculator-heading" className="mt-2 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Quick Dough Calculator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65 sm:text-base">
              Get the dough amounts you need, then adjust only what matters.
            </p>
            <QuickCalculatorGuidanceTabs level={experienceLevel} onSelectLevel={updateGuidanceLevel} />
          </section>

          <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.98fr)_minmax(22rem,0.58fr)] lg:items-start">
            <RecipeResultPanel
              result={result}
              presentation={presentation}
              experienceLevel={experienceLevel}
              copyState={copyState}
              shareState={shareState}
              recipeNotice={recipeNotice}
              onCopyRecipe={copyRecipe}
              onSaveRecipe={saveCurrentRecipe}
              onCopyShareUrl={copyShareUrl}
              onResetCalculator={resetCalculator}
            />

            <section className="grid min-w-0 gap-4 lg:col-start-1 lg:row-start-1" aria-label="Quick calculator controls" data-quick-essential-controls>
              <section className="min-w-0 rounded-[1.75rem] border border-white/80 bg-white/74 p-4 shadow-card backdrop-blur sm:p-5" aria-labelledby="quick-adjust-recipe-heading">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Batch</p>
                    <h2 id="quick-adjust-recipe-heading" className="mt-2 font-display text-3xl font-semibold">Adjust the recipe</h2>
                  </div>
                  <p className="text-xs font-bold leading-5 text-ink/45 sm:max-w-xs sm:text-right">
                    {result.input.pizzaCount} {result.input.sizingMode === "pan" ? "pans" : "pizzas"} · {formatGrams(result.sizing.doughWeightPerPieceGrams)} g each
                  </p>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <NumberField
                    id="quick-pizza-count"
                    label={quantityLabel}
                    value={result.input.pizzaCount}
                    min={1}
                    max={50}
                    suffix={result.input.sizingMode === "pan" ? "pans" : "pizzas"}
                    onChange={(value) => updateInput(setInput, "pizzaCount", value)}
                  />
                  {result.input.sizingMode === "ball-weight" ? (
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
                  ) : (
                    <div className="rounded-[1.35rem] border border-white/80 bg-white/70 p-4 shadow-sm">
                      <p className="text-sm font-extrabold text-ink/72">Current selected sizing result</p>
                      <p className="mt-3 text-3xl font-extrabold tabular-nums text-ink">{formatGrams(result.sizing.doughWeightPerPieceGrams)} g</p>
                      <p className="mt-1 text-xs leading-5 text-ink/45">Change pizza size or shape below.</p>
                    </div>
                  )}
                </div>

                <fieldset className="mt-5">
                  <legend className="text-sm font-extrabold text-ink/72">Fermentation duration</legend>
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
                  <legend className="text-sm font-extrabold text-ink/72">Fermentation environment</legend>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {quickCalculatorEnvironmentOptions.map((option) => (
                      <OptionButton<QuickFermentationEnvironment>
                        key={option.value}
                        label={option.label}
                        description={option.value === "room" ? "Room temperature · 22 °C" : "Cold fermentation · 4 °C"}
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
              </section>

              <OptionalControlGroup
                id="quick-formula-controls"
                title="Adjust hydration, salt and extra dough"
                intro="Change dough texture, salt level and extra dough without changing the calculator contract."
                summary={`${result.input.hydrationPercent}% hydration · ${result.input.saltPercent}% salt`}
                defaultOpen={formulaDefaultOpen}
              >
                {formulaControls}
              </OptionalControlGroup>

              <OptionalControlGroup
                id="quick-yeast-temperature-controls"
                title="Change yeast and temperature"
                intro="Set yeast type and the effective fermentation temperature."
                summary={`${yeastLabel} · ${fermentationTemperatureSummary}`}
                defaultOpen={yeastTemperatureDefaultOpen || result.input.fermentationTemperatureCelsius !== defaultQuickFermentationTemperature(result.input.fermentationEnvironment)}
              >
                {fermentationDetailControls}
                <p className="mt-3 rounded-2xl bg-ink/[.04] px-4 py-3 text-xs font-extrabold text-ink/58">
                  Precise yeast amount: {formatGrams(result.ingredients.leavener, true)} g. Very small yeast amounts may require a 0.01 g scale.
                </p>
              </OptionalControlGroup>

              <OptionalControlGroup
                id="quick-sizing-controls"
                title="Change pizza size or shape"
                intro="Use presets, diameter, pan dimensions or a known target weight."
                summary={sizingActive ? `${result.sizing.style.label} · ${formatGrams(result.sizing.doughWeightPerPieceGrams)} g each` : `${formatGrams(result.sizing.doughWeightPerPieceGrams)} g dough balls`}
                defaultOpen={sizingActive}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza and sizing</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold">What are you making?</h3>
                  </div>
                  <p className="text-xs font-bold leading-5 text-ink/45 sm:max-w-xs sm:text-right">
                    Style changes sizing defaults only. Formula and fermentation stay as selected.
                  </p>
                </div>

                <fieldset className="mt-5">
                  <legend className="text-sm font-extrabold text-ink/72">Pizza style</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {quickPizzaStylePresets.map((style) => (
                      <OptionButton<QuickPizzaStyleId>
                        key={style.id}
                        label={style.label}
                        description={style.shape === "round" ? "Round pizza" : "Pan pizza"}
                        selected={result.input.pizzaStyle === style.id}
                        onClick={() => applyStyle(style.id)}
                      />
                    ))}
                  </div>
                </fieldset>

                <fieldset className="mt-5">
                  <legend className="text-sm font-extrabold text-ink/72">Sizing mode</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["ball-weight", "Dough-ball weight", "Use grams per pizza"],
                      ["round", "Pizza diameter", "Derive from diameter"],
                      ["pan", "Pan size", "Derive from pan area"],
                      ["custom", "I already know the dough weight", "Set target weight"],
                    ].map(([value, label, description]) => (
                      <OptionButton<QuickPizzaSizingMode>
                        key={value}
                        label={label}
                        description={description}
                        selected={result.input.sizingMode === value}
                        onClick={() => updateInput(setInput, "sizingMode", value as QuickPizzaSizingMode)}
                      />
                    ))}
                  </div>
                </fieldset>

                {result.input.sizingMode === "round" && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <NumberField id="quick-pizza-diameter" label="Pizza diameter" value={result.input.diameterCm} min={10} max={80} step={1} suffix="cm" onChange={(value) => updateInput(setInput, "diameterCm", value)} />
                    <NumberField id="quick-thickness-factor" label="Thickness factor" value={result.input.thicknessFactor} min={0.15} max={0.75} step={0.01} suffix="g/cm²" onChange={(value) => updateInput(setInput, "thicknessFactor", value)} />
                  </div>
                )}

                {result.input.sizingMode === "pan" && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <NumberField id="quick-pan-width" label="Pan width" value={result.input.panWidthCm} min={10} max={80} step={1} suffix="cm" onChange={(value) => updateInput(setInput, "panWidthCm", value)} />
                    <NumberField id="quick-pan-length" label="Pan length" value={result.input.panLengthCm} min={10} max={120} step={1} suffix="cm" onChange={(value) => updateInput(setInput, "panLengthCm", value)} />
                    <NumberField id="quick-dough-loading" label="Dough loading" value={result.input.doughLoadingGramsPerSquareCm} min={0.25} max={1.2} step={0.01} suffix="g/cm²" onChange={(value) => updateInput(setInput, "doughLoadingGramsPerSquareCm", value)} />
                    <p className="rounded-[1.35rem] bg-ink/[.04] p-4 text-xs font-bold leading-5 text-ink/52 md:col-span-2 lg:col-span-3">
                      Pan loading guidance: lower g/cm² is thinner, around 0.74 g/cm² is balanced for this preset, and higher values bake thicker.
                    </p>
                  </div>
                )}

                {result.input.sizingMode === "custom" && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <NumberField id="quick-custom-dough-weight" label="Custom dough weight" value={result.input.customDoughWeightGrams} min={100} max={2000} step={5} suffix="g" onChange={(value) => updateInput(setInput, "customDoughWeightGrams", value)} />
                    <div className="rounded-[1.35rem] border border-ink/10 bg-cream/50 p-4">
                      <p className="text-sm font-extrabold text-ink/72">I already know the dough weight</p>
                      <p className="mt-2 text-xs leading-5 text-ink/50">
                        Use this when you already know the target dough weight per pizza or pan.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 rounded-[1.35rem] bg-ink/[.04] p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">Derived dough size</p>
                  <p className="mt-2 text-2xl font-extrabold text-ink">
                    {formatGrams(result.sizing.doughWeightPerPieceGrams)} g <span className="text-sm font-bold text-ink/45">each</span>
                  </p>
                  {result.sizing.areaSquareCm && (
                    <p className="mt-1 text-xs leading-5 text-ink/48">
                      {Math.round(result.sizing.areaSquareCm)} cm² · {(result.sizing.loadingGramsPerSquareCm ?? 0).toFixed(2)} g/cm²
                    </p>
                  )}
                </div>
              </OptionalControlGroup>

              <OptionalControlGroup
                id="quick-preferment-controls"
                title="Use a preferment"
                intro="Keep the same target dough while splitting flour and water into a preferment build."
                summary={prefermentActive ? `${result.preferment.label} active` : "Direct dough"}
                defaultOpen={prefermentActive}
              >
                <fieldset>
                  <legend className="text-sm font-extrabold text-ink/72">Dough method</legend>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {quickPrefermentPresets.map((preset) => (
                      <OptionButton<QuickPrefermentMethod>
                        key={preset.id}
                        label={preset.label}
                        description={preset.description}
                        selected={result.input.prefermentMethod === preset.id}
                        onClick={() => applyPreferment(preset.id)}
                      />
                    ))}
                  </div>
                </fieldset>

                {result.input.prefermentMethod === "direct" ? (
                  <div className="mt-5 rounded-[1.35rem] bg-ink/[.04] p-4">
                    <p className="text-sm font-extrabold text-ink/72">No preferment</p>
                    <p className="mt-1 text-xs leading-5 text-ink/48">All flour, water, salt and yeast are mixed in the final dough.</p>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <NumberField id="quick-prefermented-flour" label="Prefermented flour" value={result.input.prefermentedFlourPercent} min={5} max={80} step={1} suffix="%" onChange={(value) => updateInput(setInput, "prefermentedFlourPercent", value)} />
                      <NumberField id="quick-preferment-hydration" label="Preferment hydration" value={result.input.prefermentHydrationPercent} min={40} max={125} step={1} suffix="%" onChange={(value) => updateInput(setInput, "prefermentHydrationPercent", value)} />
                      {result.input.prefermentMethod === "levain" ? (
                        <NumberField id="quick-preferment-inoculation" label="Levain inoculation" value={result.input.prefermentInoculationPercent} min={1} max={60} step={1} suffix="%" onChange={(value) => updateInput(setInput, "prefermentInoculationPercent", value)} />
                      ) : (
                        <div className="rounded-[1.35rem] border border-ink/10 bg-cream/50 p-4">
                          <p className="text-sm font-extrabold text-ink/72">Commercial yeast split</p>
                          <p className="mt-2 text-xs leading-5 text-ink/50">
                            The current yeast amount is assigned to the preferment build for this method.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1.35rem] bg-ink/[.04] p-4">
                        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">Preferment build</p>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <dt className="text-ink/45">Flour</dt><dd className="text-right font-extrabold">{formatGrams(result.preferment.build.flourGrams)} g</dd>
                          <dt className="text-ink/45">Water</dt><dd className="text-right font-extrabold">{formatGrams(result.preferment.build.waterGrams)} g</dd>
                          <dt className="text-ink/45">{result.input.prefermentMethod === "levain" ? "Levain build" : "Yeast"}</dt>
                          <dd className="text-right font-extrabold">
                            {result.input.prefermentMethod === "levain"
                              ? `${formatGrams(result.preferment.build.starterGrams)} g`
                              : `${formatGrams(result.preferment.build.commercialYeastGrams, true)} g`}
                          </dd>
                        </dl>
                      </div>
                      <div className="rounded-[1.35rem] bg-white p-4 ring-1 ring-ink/10">
                        <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">Final dough additions</p>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <dt className="text-ink/45">Flour</dt><dd className="text-right font-extrabold">{formatGrams(result.preferment.finalDough.flourGrams)} g</dd>
                          <dt className="text-ink/45">Water</dt><dd className="text-right font-extrabold">{formatGrams(result.preferment.finalDough.waterGrams)} g</dd>
                          <dt className="text-ink/45">Salt</dt><dd className="text-right font-extrabold">{formatGrams(result.preferment.finalDough.saltGrams)} g</dd>
                        </dl>
                      </div>
                    </div>
                  </>
                )}
              </OptionalControlGroup>

              <section aria-labelledby="quick-advanced-tools-heading" data-quick-advanced-section>
                <OptionalControlGroup
                  id="quick-technical-tools"
                  title="Dough-temperature and flour tools"
                  intro="Optional tools for temperature planning, yeast conversion, custom ingredients and flour blending."
                  summary={technicalToolsActive ? "Technical settings active" : "Tools available"}
                  defaultOpen={technicalToolsActive}
                >
                  <h3 id="quick-advanced-tools-heading" className="sr-only">Dough-temperature and flour tools</h3>
                  {advancedControls}
                </OptionalControlGroup>
              </section>

              <OptionalControlGroup
                id="quick-bakers-percentages"
                title="View baker's percentages"
                intro="Formula percentages appear after the ingredient result."
                summary={`Water ${formatPercent(result.bakerPercentages.water)}% · Salt ${formatPercent(result.bakerPercentages.salt)}%`}
                defaultOpen={bakerPercentagesDefaultOpen}
              >
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {formulaItems.map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-ink/[.04] p-4">
                      <dt className="text-ink/45">{label}</dt>
                      <dd className="mt-1 font-extrabold tabular-nums text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs leading-5 text-ink/45">
                  Flour 100% - Water {formatPercent(result.bakerPercentages.water)}% - Salt {formatPercent(result.bakerPercentages.salt)}% - Yeast calculated for the selected time and temperature.
                </p>
              </OptionalControlGroup>

              <OptionalControlGroup
                id="quick-calculation-assumptions"
                title="View calculation assumptions"
                intro="Check the normalized calculation settings behind the visible recipe."
                summary={`${result.settings.fermentation} · ${formatTemperature(result.settings.temperature)} °C`}
                defaultOpen={false}
              >
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl bg-ink/[.04] p-4"><dt className="text-ink/45">Dough method</dt><dd className="mt-1 font-extrabold">{result.preferment.label}</dd></div>
                  <div className="rounded-2xl bg-ink/[.04] p-4"><dt className="text-ink/45">Fermentation temp</dt><dd className="mt-1 font-extrabold">{formatTemperature(result.input.fermentationTemperatureCelsius)} °C</dd></div>
                  <div className="rounded-2xl bg-ink/[.04] p-4"><dt className="text-ink/45">Target dough temp</dt><dd className="mt-1 font-extrabold">{formatTemperature(result.input.targetDoughTemperatureCelsius)} °C</dd></div>
                  <div className="rounded-2xl bg-ink/[.04] p-4"><dt className="text-ink/45">Water estimate</dt><dd className="mt-1 font-extrabold">{formatTemperature(result.advancedTools.waterTemperature.requiredWaterTemperatureCelsius)} °C</dd></div>
                </dl>
              </OptionalControlGroup>
            </section>

            <section className="min-w-0 rounded-[1.75rem] border border-white/80 bg-white/72 p-4 shadow-card backdrop-blur sm:p-5 lg:col-span-2" aria-labelledby="quick-recipe-management-heading" data-quick-save-share>
              <div className="grid gap-4 md:grid-cols-[minmax(0,0.75fr)_minmax(16rem,0.45fr)] md:items-start">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Saved recipes</p>
                  <h2 id="quick-recipe-management-heading" className="mt-2 font-display text-3xl font-semibold">Saved calculator recipes</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/58">
                    Load, rename, duplicate or delete browser-local Quick Calculator recipes.
                  </p>
                </div>
                <label className="rounded-[1.35rem] border border-ink/10 bg-white p-4">
                  <span className="text-sm font-extrabold text-ink/72">Recipe name for Save recipe</span>
                  <input
                    id="quick-recipe-name"
                    value={recipeName}
                    onChange={(event) => setRecipeName(event.target.value)}
                    className="mt-3 h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm font-extrabold text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10"
                    placeholder="Friday quick dough"
                  />
                </label>
              </div>

              <div className="mt-5">
                {savedRecipes.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-ink/15 bg-cream/45 px-4 py-6 text-sm leading-6 text-ink/48">
                    No saved calculator recipes yet. Use Save recipe near the result to store this setup in this browser.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {savedRecipes.map((recipe) => (
                      <article key={recipe.id} className="grid gap-3 rounded-2xl border border-ink/10 bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div className="min-w-0">
                          <label className="text-[10px] font-extrabold uppercase tracking-[.16em] text-ink/38" htmlFor={`quick-saved-recipe-${recipe.id}`}>
                            Saved calculator recipe
                          </label>
                          <input
                            id={`quick-saved-recipe-${recipe.id}`}
                            value={recipe.name}
                            onChange={(event) => renameSavedRecipe(recipe.id, event.target.value)}
                            className="mt-2 h-11 w-full rounded-xl border border-ink/10 px-3 text-sm font-extrabold text-ink outline-none focus:border-tomato focus:ring-4 focus:ring-tomato/10"
                          />
                          <p className="mt-2 text-xs leading-5 text-ink/45">
                            {savedRecipeSummary(recipe.input)}
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3 md:min-w-[18rem]">
                          <button type="button" onClick={() => loadSavedRecipe(recipe)} className="rounded-xl bg-tomato px-3 py-2.5 text-xs font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">Load</button>
                          <button type="button" onClick={() => duplicateSavedRecipe(recipe.id)} className="rounded-xl border border-ink/10 px-3 py-2.5 text-xs font-extrabold text-ink/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">Duplicate</button>
                          <button type="button" onClick={() => deleteSavedRecipe(recipe.id)} className="rounded-xl border border-tomato/20 px-3 py-2.5 text-xs font-extrabold text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="grid min-w-0 gap-4 lg:col-span-2 lg:grid-cols-2" aria-label="Quick calculator next steps">
              <section className="rounded-[1.75rem] border border-white/80 bg-white/72 p-4 shadow-card backdrop-blur sm:p-5" aria-labelledby="quick-next-steps-heading">
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Learning</p>
                <h2 id="quick-next-steps-heading" className="mt-2 font-display text-3xl font-semibold">Learn how to make the dough</h2>
                <ol className="mt-4 grid gap-2">
                  {quickResultNextSteps.map(([title, body], index) => (
                    <li key={title} className="flex gap-3 rounded-2xl bg-ink/[.04] p-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-extrabold text-ink/60 ring-1 ring-ink/10">{index + 1}</span>
                      <span>
                        <span className="block text-sm font-extrabold text-ink">{title}</span>
                        <span className="mt-1 block text-xs leading-5 text-ink/48">{body}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <Link href="/guides/dough" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink px-4 py-3 text-sm font-extrabold text-white transition hover:bg-ink/90 active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto">
                  Learn how to make the dough
                </Link>
              </section>

              <aside className="rounded-[1.75rem] border border-ink/10 bg-cream/55 p-4 shadow-sm sm:p-5" aria-labelledby="quick-session-cta-heading" data-quick-session-cta>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/42">Need the full process?</p>
                <h2 id="quick-session-cta-heading" className="mt-2 font-display text-3xl font-semibold text-ink">Plan a pizza</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">
                  Pizza Plan starts separately and does not automatically import this Quick Calculator recipe.
                </p>
                <Link
                  href="/session/start"
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
                >
                  Plan a pizza
                </Link>
                <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-xs font-bold leading-5 text-ink/45">
                  Quick Calculator does not create a Pizza Plan or account record.
                </p>
              </aside>
            </section>
          </div>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}
