"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import EditableNumberInput from "@/components/EditableNumberInput";
import { DoughToolsIcon } from "@/components/icons";
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
import { quickCalculatorInputFromSearch } from "@/lib/quick-calculator/quick-calculator-storage";
import {
  createQuickRecipeImageDataUrl,
  dataUrlToQuickRecipeFile,
  downloadQuickRecipeImageDataUrl,
  QUICK_RECIPE_IMAGE_HEIGHT,
  QUICK_RECIPE_IMAGE_WIDTH,
} from "@/lib/quick-calculator/quick-recipe-image-export";
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

type ShareImageStatus = "idle" | "generating" | "shared" | "preview" | "error";
type PendingLevelChange = {
  body: string;
  nextInput: QuickCalculatorInput;
  targetLevel: ExperienceLevel;
  title: string;
} | null;

const numberInputClassName = "h-12 w-full min-w-0 rounded-2xl border border-ink/10 bg-white px-3 text-base font-extrabold tabular-nums text-ink outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10";

const enthusiastKeys = [
  "pizzaCount",
  "doughBallWeightGrams",
  "hydrationPercent",
  "saltPercent",
  "wastePercent",
  "yeastType",
  "fermentationDuration",
  "fermentationEnvironment",
] as const satisfies readonly (keyof QuickCalculatorInput)[];

const beginnerTechnicalKeys = Object.keys(quickCalculatorDefaults).filter((key) => key !== "pizzaCount") as (keyof QuickCalculatorInput)[];
const enthusiastUnsupportedKeys = Object.keys(quickCalculatorDefaults).filter((key) => !(enthusiastKeys as readonly string[]).includes(key)) as (keyof QuickCalculatorInput)[];

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

function valuesDiffer(current: QuickCalculatorInput, defaults: QuickCalculatorInput, keys: (keyof QuickCalculatorInput)[]) {
  return keys.some((key) => current[key] !== defaults[key]);
}

function beginnerRecommendedInput(current: QuickCalculatorInput): QuickCalculatorInput {
  return {
    ...quickCalculatorDefaults,
    pizzaCount: current.pizzaCount,
  };
}

function enthusiastRecommendedInput(current: QuickCalculatorInput): QuickCalculatorInput {
  const currentResult = calculateQuickDough(current);
  return {
    ...quickCalculatorDefaults,
    pizzaCount: current.pizzaCount,
    doughBallWeightGrams: currentResult.sizing.doughWeightPerPieceGrams,
    hydrationPercent: current.hydrationPercent,
    saltPercent: current.saltPercent,
    wastePercent: current.wastePercent,
    yeastType: current.yeastType,
    fermentationDuration: current.fermentationDuration,
    fermentationEnvironment: current.fermentationEnvironment,
    fermentationTemperatureCelsius: defaultQuickFermentationTemperature(current.fermentationEnvironment),
  };
}

function safeInitialInput(input: QuickCalculatorInput, level: ExperienceLevel) {
  if (level === "beginner") return beginnerRecommendedInput(input);
  if (level === "enthusiast") return enthusiastRecommendedInput(input);
  return input;
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
    <div className={`min-w-0 rounded-[1.2rem] border p-3 sm:p-4 ${secondary ? "border-ink/10 bg-ink/[.025]" : "border-white/80 bg-white/76 shadow-sm"}`}>
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
          -
        </button>
        <EditableNumberInput
          id={id}
          value={value}
          min={min}
          max={max}
          className={`${numberInputClassName} border-0 text-center focus:ring-0`}
          aria-label={label}
          onValueChange={onChange}
        />
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
      {description && <span className={`mt-1 block text-xs leading-5 ${selected ? "text-white/72" : "text-ink/52"}`}>{description}</span>}
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
      className="group min-w-0 rounded-[1.35rem] border border-ink/10 bg-white/70 p-4 shadow-sm backdrop-blur sm:p-5"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
        <span className="min-w-0">
          <span className="block text-base font-extrabold text-ink">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-ink/58 sm:text-sm">{intro}</span>
          {summary && (
            <span className="mt-2 inline-flex max-w-full rounded-full bg-ink/[.055] px-3 py-1 text-[11px] font-extrabold text-ink/58">
              {summary}
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-extrabold text-ink/60 group-open:hidden">
          Open
        </span>
        <span className="hidden shrink-0 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-extrabold text-ink/60 group-open:inline-flex">
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
    <label className="min-w-0 rounded-[1.2rem] border border-white/80 bg-white/76 p-4 shadow-sm">
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
                active ? "bg-ink text-white shadow-sm" : "text-ink/64 hover:bg-cream hover:text-ink"
              }`}
            >
              {option.label}
              {active && <span className="sr-only"> selected</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RecipeResultPanel({
  result,
  experienceLevel,
  shareStatus,
  onShareRecipe,
}: {
  result: ReturnType<typeof calculateQuickDough>;
  experienceLevel: ExperienceLevel;
  shareStatus: ShareImageStatus;
  onShareRecipe: () => void;
}) {
  const selectedEnvironment = quickCalculatorEnvironmentOptions.find((option) => option.value === result.input.fermentationEnvironment)
    ?? quickCalculatorEnvironmentOptions[0];
  const yeastLabel = quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Yeast";
  const showTechnicalSupport = experienceLevel !== "beginner";
  const showTinyYeastNote = result.ingredients.leavener > 0 && result.ingredients.leavener < 0.1 && experienceLevel !== "beginner";

  const ingredientRows = [
    ["Flour", result.ingredients.flour, false],
    ["Water", result.ingredients.water, false],
    ["Salt", result.ingredients.salt, false],
    ["Yeast", result.ingredients.leavener, true],
  ] as const;

  return (
    <aside
      className="min-w-0 rounded-[1.6rem] border border-ink/10 bg-white p-4 text-ink shadow-card sm:p-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1"
      aria-labelledby="quick-calculator-results"
      aria-live="polite"
      data-quick-result-panel
      data-quick-live-recipe
    >
      <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Live recipe</p>
      <h2 id="quick-calculator-results" className="mt-2 font-display text-3xl font-semibold">Live recipe</h2>
      <p className="mt-4 text-3xl font-black leading-tight text-ink sm:text-4xl" data-quick-dough-ball-summary>
        {result.input.pizzaCount} dough balls x {formatGrams(result.sizing.doughWeightPerPieceGrams)} g
      </p>
      <p className="mt-2 text-lg font-extrabold text-forest">
        Total dough {formatGrams(result.ingredients.total)} g
      </p>

      <dl className="mt-5 divide-y divide-ink/10" data-quick-ingredient-list>
        {ingredientRows.map(([label, value, precise]) => (
          <div key={label} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-3 first:pt-0 last:pb-0">
            <dt className="text-sm font-extrabold text-ink/64">{label}</dt>
            <dd className="text-2xl font-black tabular-nums text-ink">
              {formatGrams(value, precise)} <span className="text-sm font-bold text-ink/45">g</span>
              {label === "Yeast" && <span className="mt-1 block text-right text-[11px] font-bold text-ink/45">{yeastLabel}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 rounded-2xl bg-cream/70 px-4 py-3 text-sm font-bold leading-6 text-ink/68">
        {result.input.fermentationDuration} · {selectedEnvironment.label} · {experienceLevel === "beginner"
          ? "Ferment cold for the most forgiving result."
          : `${formatTemperature(result.input.fermentationTemperatureCelsius)} C`}
      </p>

      {showTechnicalSupport && (
        <p className="mt-3 text-xs font-bold leading-5 text-ink/52">
          {result.input.hydrationPercent}% hydration · {result.input.saltPercent}% salt · {formatPercent(result.bakerPercentages.yeast, 3)}% yeast.
        </p>
      )}
      {showTinyYeastNote && (
        <p className="mt-3 rounded-2xl bg-oven-gold/25 px-4 py-3 text-xs font-extrabold leading-5 text-ink/68">
          Very small yeast amounts may require a 0.01 g scale.
        </p>
      )}

      <button
        type="button"
        onClick={onShareRecipe}
        disabled={shareStatus === "generating"}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-tomato px-5 py-3 text-sm font-extrabold text-white transition hover:bg-tomato/90 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2"
        data-quick-share-recipe-image
      >
        <DoughToolsIcon name="share" size={20} />
        {shareStatus === "generating" ? "Creating image..." : "Share recipe"}
      </button>

      {shareStatus !== "idle" && (
        <p className="mt-3 rounded-2xl bg-ink/[.045] px-4 py-3 text-xs font-extrabold text-ink/62" role={shareStatus === "error" ? "alert" : "status"}>
          {shareStatus === "shared" && "Recipe image shared."}
          {shareStatus === "preview" && "Preview ready. Save the image or close the preview."}
          {shareStatus === "error" && "Recipe image sharing is unavailable in this browser."}
          {shareStatus === "generating" && "Creating a local recipe image."}
        </p>
      )}
    </aside>
  );
}

export default function QuickDoughCalculator() {
  const [input, setInput] = useState<QuickCalculatorInput>(quickCalculatorDefaults);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());
  const [pendingLevelChange, setPendingLevelChange] = useState<PendingLevelChange>(null);
  const [shareStatus, setShareStatus] = useState<ShareImageStatus>("idle");
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const result = useMemo(() => calculateQuickDough(input), [input]);

  const selectedEnvironment = quickCalculatorEnvironmentOptions.find((option) => option.value === result.input.fermentationEnvironment)
    ?? quickCalculatorEnvironmentOptions[0];
  const yeastLabel = quickCalculatorYeastOptions.find((option) => option.value === result.input.yeastType)?.label ?? "Yeast";
  const isBeginner = experienceLevel === "beginner";
  const isEnthusiast = experienceLevel === "enthusiast";
  const isPizzaNerd = experienceLevel === "pizza_nerd";
  const formulaDefaultOpen = isEnthusiast || isPizzaNerd;
  const yeastTemperatureDefaultOpen = isPizzaNerd;
  const bakerPercentagesDefaultOpen = isPizzaNerd;
  const sizingActive = result.input.sizingMode !== "ball-weight" || result.input.pizzaStyle !== "neapolitan";
  const prefermentActive = result.input.prefermentMethod !== "direct";
  const technicalToolsActive = result.input.customIngredientsEnabled
    || result.input.flourBlendEnabled
    || result.input.targetDoughTemperatureCelsius !== quickCalculatorDefaults.targetDoughTemperatureCelsius;
  const fermentationTemperatureSummary = `${selectedEnvironment.label} · ${formatTemperature(result.input.fermentationTemperatureCelsius)} C`;

  useEffect(() => {
    const savedLevel = readExperienceLevelPreference();
    const sharedInput = typeof window !== "undefined"
      ? quickCalculatorInputFromSearch(window.location.search)
      : undefined;

    setExperienceLevel(savedLevel);
    if (sharedInput) {
      setInput(safeInitialInput(sharedInput, savedLevel));
    } else {
      setInput((current) => safeInitialInput(current, savedLevel));
    }
  }, []);

  const applyGuidanceLevel = (level: ExperienceLevel, nextInput?: QuickCalculatorInput) => {
    const savedLevel = writeExperienceLevelPreference(level);
    setExperienceLevel(savedLevel);
    if (nextInput) setInput(nextInput);
    setShareStatus("idle");
  };

  const requestGuidanceLevel = (level: ExperienceLevel) => {
    if (level === experienceLevel) return;

    if ((experienceLevel === "beginner" && level !== "beginner")
      || (experienceLevel === "enthusiast" && level === "pizza_nerd")) {
      applyGuidanceLevel(level);
      return;
    }

    if (level === "beginner" && valuesDiffer(result.input, quickCalculatorDefaults, beginnerTechnicalKeys)) {
      setPendingLevelChange({
        targetLevel: level,
        nextInput: beginnerRecommendedInput(result.input),
        title: "Use Beginner recommended settings?",
        body: "This resets advanced recipe settings to the DoughTools recommendation. Your pizza count stays the same.",
      });
      return;
    }

    if (level === "enthusiast" && valuesDiffer(result.input, quickCalculatorDefaults, enthusiastUnsupportedKeys)) {
      setPendingLevelChange({
        targetLevel: level,
        nextInput: enthusiastRecommendedInput(result.input),
        title: "Use Enthusiast practical settings?",
        body: "This resets Pizza Nerd-only recipe settings. Your pizza count and practical recipe controls stay the same.",
      });
      return;
    }

    applyGuidanceLevel(level);
  };

  const confirmPendingLevelChange = () => {
    if (!pendingLevelChange) return;
    applyGuidanceLevel(pendingLevelChange.targetLevel, pendingLevelChange.nextInput);
    setPendingLevelChange(null);
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

  const shareRecipeImage = async () => {
    setShareStatus("generating");
    setSharePreviewUrl(null);

    try {
      const dataUrl = createQuickRecipeImageDataUrl(result, experienceLevel);
      const file = dataUrlToQuickRecipeFile(dataUrl);
      const sharePayload = {
        files: [file],
        text: "Dough recipe planned with DoughTools.",
        title: "DoughTools dough recipe",
      };

      if (navigator.share && (!navigator.canShare || navigator.canShare(sharePayload))) {
        const nativeShareResult = await Promise.race([
          navigator.share(sharePayload).then(() => "shared" as const).catch(() => "preview" as const),
          new Promise<"preview">((resolve) => {
            window.setTimeout(() => resolve("preview"), 1800);
          }),
        ]);

        if (nativeShareResult === "shared") {
          setShareStatus("shared");
          return;
        }
      }

      setSharePreviewUrl(dataUrl);
      setShareStatus("preview");
    } catch {
      setShareStatus("error");
    }
  };

  const savePreviewImage = () => {
    if (!sharePreviewUrl) return;
    downloadQuickRecipeImageDataUrl(sharePreviewUrl);
  };

  const formulaControls = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumberField id="quick-hydration" label="Hydration" value={result.input.hydrationPercent} min={40} max={100} step={0.5} suffix="%" onChange={(value) => updateInput(setInput, "hydrationPercent", value)} />
      <NumberField id="quick-salt" label="Salt" value={result.input.saltPercent} min={0} max={10} step={0.1} suffix="%" onChange={(value) => updateInput(setInput, "saltPercent", value)} />
      <NumberField id="quick-extra-dough" label="Extra dough" value={result.input.wastePercent} min={0} max={25} step={0.5} suffix="%" secondary onChange={(value) => updateInput(setInput, "wastePercent", value)} />
    </div>
  );

  const yeastControls = (
    <div className="grid gap-4 sm:grid-cols-2">
      {isPizzaNerd && (
        <NumberField id="quick-fermentation-temperature" label="Fermentation temperature" value={result.input.fermentationTemperatureCelsius} min={0} max={30} suffix="C" onChange={(value) => updateInput(setInput, "fermentationTemperatureCelsius", value)} />
      )}
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
      <section className="rounded-[1.35rem] border border-ink/10 bg-white/65 p-4" aria-labelledby="quick-dough-temperature-heading">
        <h3 id="quick-dough-temperature-heading" className="text-xl font-extrabold text-ink">Target dough temperature and water temperature</h3>
        <p className="mt-2 text-xs leading-5 text-ink/52">Water temperature estimate only; it does not change the ingredient formula.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField id="quick-target-dough-temperature" label="Target dough temperature" value={result.input.targetDoughTemperatureCelsius} min={10} max={35} step={0.5} suffix="C" onChange={(value) => updateInput(setInput, "targetDoughTemperatureCelsius", value)} />
          <NumberField id="quick-flour-temperature" label="Flour temperature" value={result.input.flourTemperatureCelsius} min={0} max={35} step={0.5} suffix="C" onChange={(value) => updateInput(setInput, "flourTemperatureCelsius", value)} />
          <NumberField id="quick-room-temperature" label="Room temperature" value={result.input.roomTemperatureCelsius} min={0} max={35} step={0.5} suffix="C" onChange={(value) => updateInput(setInput, "roomTemperatureCelsius", value)} />
          <NumberField id="quick-preferment-temperature" label="Preferment temperature" value={result.input.prefermentTemperatureCelsius} min={0} max={35} step={0.5} suffix="C" secondary={result.input.prefermentMethod === "direct"} onChange={(value) => updateInput(setInput, "prefermentTemperatureCelsius", value)} />
          <NumberField id="quick-mixer-friction" label="Mixer friction heat" value={result.input.mixerFrictionCelsius} min={0} max={20} step={0.5} suffix="C" onChange={(value) => updateInput(setInput, "mixerFrictionCelsius", value)} />
          <div className="rounded-[1.2rem] bg-ink/[.04] p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-ink/42">Required water</p>
            <p className="mt-2 text-3xl font-extrabold text-ink">{formatTemperature(result.advancedTools.waterTemperature.requiredWaterTemperatureCelsius)} C</p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-ink/10 bg-white/65 p-4" aria-labelledby="quick-yeast-tools-heading">
        <h3 id="quick-yeast-tools-heading" className="text-xl font-extrabold text-ink">Yeast converter and reverse fermentation</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.2rem] border border-white/80 bg-white/70 p-4 shadow-sm">
            <h4 className="text-sm font-extrabold text-ink/72">Yeast converter</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <NumberField id="quick-yeast-conversion-amount" label="Yeast amount" value={result.input.yeastConversionAmountGrams} min={0} max={500} step={0.1} suffix="g" onChange={(value) => updateInput(setInput, "yeastConversionAmountGrams", value)} />
              <SelectField<YeastType> id="quick-yeast-conversion-from" label="From" value={result.input.yeastConversionFrom} options={quickCalculatorYeastOptions.filter((option) => option.value === "idy" || option.value === "ady" || option.value === "cy")} onChange={(value) => updateInput(setInput, "yeastConversionFrom", value)} />
              <SelectField<YeastType> id="quick-yeast-conversion-to" label="To" value={result.input.yeastConversionTo} options={quickCalculatorYeastOptions.filter((option) => option.value === "idy" || option.value === "ady" || option.value === "cy")} onChange={(value) => updateInput(setInput, "yeastConversionTo", value)} />
            </div>
            <p className="mt-3 rounded-2xl bg-ink/[.04] px-4 py-3 text-sm font-extrabold text-ink">Converted yeast: {formatGrams(result.advancedTools.yeastConversion.convertedGrams, true)} g</p>
          </div>
          <div className="rounded-[1.2rem] border border-white/80 bg-white/70 p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-extrabold text-ink/72">Reverse fermentation</h4>
            <NumberField id="quick-reverse-fermentation-hours" label="Reverse fermentation target" value={result.input.reverseFermentationHours} min={1} max={96} step={1} suffix="h" onChange={(value) => updateInput(setInput, "reverseFermentationHours", value)} />
            <p className="mt-3 rounded-2xl bg-ink/[.04] px-4 py-3 text-sm font-extrabold text-ink">Yeast for target: {formatGrams(result.advancedTools.reverseFermentation.yeastGramsForTargetHours, true)} g</p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.35rem] border border-ink/10 bg-white/65 p-4" aria-labelledby="quick-custom-tools-heading">
        <h3 id="quick-custom-tools-heading" className="text-xl font-extrabold text-ink">Custom ingredients and flour blend</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.2rem] border border-white/80 bg-white/70 p-4 shadow-sm">
            <label className="flex items-start gap-3 text-sm font-extrabold text-ink/72">
              <input type="checkbox" checked={result.input.customIngredientsEnabled} onChange={(event) => updateInput(setInput, "customIngredientsEnabled", event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-ink/20 text-tomato focus:ring-tomato" />
              Add optional oil, sugar or malt amounts
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <NumberField id="quick-oil-percent" label="Oil" value={result.input.oilPercent} min={0} max={20} step={0.5} suffix="%" onChange={(value) => updateInput(setInput, "oilPercent", value)} secondary={!result.input.customIngredientsEnabled} />
              <NumberField id="quick-sugar-percent" label="Sugar" value={result.input.sugarPercent} min={0} max={20} step={0.5} suffix="%" onChange={(value) => updateInput(setInput, "sugarPercent", value)} secondary={!result.input.customIngredientsEnabled} />
              <NumberField id="quick-malt-percent" label="Malt" value={result.input.maltPercent} min={0} max={10} step={0.1} suffix="%" onChange={(value) => updateInput(setInput, "maltPercent", value)} secondary={!result.input.customIngredientsEnabled} />
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-white/80 bg-white/70 p-4 shadow-sm">
            <label className="flex items-start gap-3 text-sm font-extrabold text-ink/72">
              <input type="checkbox" checked={result.input.flourBlendEnabled} onChange={(event) => updateInput(setInput, "flourBlendEnabled", event.target.checked)} className="mt-0.5 h-5 w-5 rounded border-ink/20 text-tomato focus:ring-tomato" />
              Split total flour into a simple two-flour blend
            </label>
            <div className="mt-4">
              <NumberField id="quick-flour-blend-primary" label="Primary flour" value={result.input.flourBlendPrimaryPercent} min={0} max={100} step={1} suffix="%" secondary={!result.input.flourBlendEnabled} onChange={(value) => updateInput(setInput, "flourBlendPrimaryPercent", value)} />
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(233,75,46,0.10),transparent_32rem),linear-gradient(180deg,#fff8f1_0%,#f6ecdf_48%,#fff8f1_100%)] text-ink">
      <main className="px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="max-w-3xl" aria-labelledby="quick-calculator-heading" data-quick-page-identity>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-tomato">Quick calculator</p>
            <h1 id="quick-calculator-heading" className="mt-2 font-display text-4xl font-semibold leading-none sm:text-5xl">
              Quick Dough Calculator
            </h1>
            {!isBeginner && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65 sm:text-base">
                Get the dough amounts you need, then adjust only what matters.
              </p>
            )}
            <QuickCalculatorGuidanceTabs level={experienceLevel} onSelectLevel={requestGuidanceLevel} />
            {isBeginner && (
              <p className="mt-3 max-w-2xl rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold leading-6 text-ink/68" data-quick-beginner-recommended-note>
                Choose how many pizzas you want to make. DoughTools uses a reliable recommended recipe.
              </p>
            )}
          </section>

          <div className={`mt-5 grid min-w-0 gap-5 ${isBeginner ? "lg:grid-cols-[minmax(0,0.55fr)_minmax(22rem,0.45fr)]" : "lg:grid-cols-[minmax(0,0.98fr)_minmax(22rem,0.58fr)]"} lg:items-start`} data-quick-level-layout={experienceLevel}>
            <RecipeResultPanel result={result} experienceLevel={experienceLevel} shareStatus={shareStatus} onShareRecipe={shareRecipeImage} />

            <section className="grid min-w-0 gap-4 lg:col-start-1 lg:row-start-1" aria-label="Quick calculator controls" data-quick-essential-controls>
              <section className="min-w-0 rounded-[1.55rem] border border-white/80 bg-white/74 p-4 shadow-card backdrop-blur sm:p-5" aria-labelledby="quick-adjust-recipe-heading">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Batch</p>
                    <h2 id="quick-adjust-recipe-heading" className="mt-2 font-display text-3xl font-semibold">Adjust the recipe</h2>
                  </div>
                  <p className="text-xs font-bold leading-5 text-ink/52 sm:max-w-xs sm:text-right">
                    {result.input.pizzaCount} pizzas · {formatGrams(result.sizing.doughWeightPerPieceGrams)} g each
                  </p>
                </div>

                <div className={`mt-4 grid gap-4 ${isBeginner ? "" : "sm:grid-cols-2"}`}>
                  <NumberField id="quick-pizza-count" label="Number of pizzas" value={result.input.pizzaCount} min={1} max={50} suffix="pizzas" onChange={(value) => updateInput(setInput, "pizzaCount", value)} />
                  {!isBeginner && (
                    <NumberField id="quick-ball-weight" label="Dough-ball weight" value={result.input.doughBallWeightGrams} min={100} max={1000} step={5} suffix="g" onChange={(value) => updateInput(setInput, "doughBallWeightGrams", value)} />
                  )}
                </div>

                {!isBeginner && (
                  <>
                    <fieldset className="mt-5">
                      <legend className="text-sm font-extrabold text-ink/72">Fermentation duration</legend>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {quickCalculatorDurationOptions.map((option) => (
                          <OptionButton<QuickFermentationDuration> key={option.value} label={option.label} selected={result.input.fermentationDuration === option.value} onClick={() => updateInput(setInput, "fermentationDuration", option.value)} />
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
                            description={option.value === "room" ? "Room temperature · 22 C" : "Cold fermentation · 4 C"}
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
                  </>
                )}
              </section>

              {!isBeginner && (
                <>
                  <OptionalControlGroup id="quick-formula-controls" title="Adjust hydration, salt and extra dough" intro="Change dough texture, salt level and extra dough." summary={`${result.input.hydrationPercent}% hydration · ${result.input.saltPercent}% salt`} defaultOpen={formulaDefaultOpen}>
                    {formulaControls}
                  </OptionalControlGroup>

                  <OptionalControlGroup id="quick-yeast-temperature-controls" title="Change yeast and temperature" intro={isPizzaNerd ? "Set yeast type and exact fermentation temperature." : "Set yeast type without exposing technical temperature controls."} summary={`${yeastLabel} · ${fermentationTemperatureSummary}`} defaultOpen={yeastTemperatureDefaultOpen || (isPizzaNerd && result.input.fermentationTemperatureCelsius !== defaultQuickFermentationTemperature(result.input.fermentationEnvironment))}>
                    {yeastControls}
                    <p className="mt-3 rounded-2xl bg-ink/[.04] px-4 py-3 text-xs font-extrabold text-ink/58">
                      Precise yeast amount: {formatGrams(result.ingredients.leavener, true)} g.
                    </p>
                  </OptionalControlGroup>
                </>
              )}

              {isPizzaNerd && (
                <>
                  <OptionalControlGroup id="quick-sizing-controls" title="Change pizza size or shape" intro="Use presets, diameter, pan dimensions or a known target weight." summary={sizingActive ? `${result.sizing.style.label} · ${formatGrams(result.sizing.doughWeightPerPieceGrams)} g each` : `${formatGrams(result.sizing.doughWeightPerPieceGrams)} g dough balls`} defaultOpen={sizingActive}>
                    <fieldset>
                      <legend className="text-sm font-extrabold text-ink/72">Pizza style</legend>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {quickPizzaStylePresets.map((style) => (
                          <OptionButton<QuickPizzaStyleId> key={style.id} label={style.label} description={style.shape === "round" ? "Round pizza" : "Pan pizza"} selected={result.input.pizzaStyle === style.id} onClick={() => applyStyle(style.id)} />
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
                          <OptionButton<QuickPizzaSizingMode> key={value} label={label} description={description} selected={result.input.sizingMode === value} onClick={() => updateInput(setInput, "sizingMode", value as QuickPizzaSizingMode)} />
                        ))}
                      </div>
                    </fieldset>

                    {result.input.sizingMode === "round" && (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <NumberField id="quick-pizza-diameter" label="Pizza diameter" value={result.input.diameterCm} min={10} max={80} step={1} suffix="cm" onChange={(value) => updateInput(setInput, "diameterCm", value)} />
                        <NumberField id="quick-thickness-factor" label="Thickness factor" value={result.input.thicknessFactor} min={0.15} max={0.75} step={0.01} suffix="g/cm2" onChange={(value) => updateInput(setInput, "thicknessFactor", value)} />
                      </div>
                    )}

                    {result.input.sizingMode === "pan" && (
                      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <NumberField id="quick-pan-width" label="Pan width" value={result.input.panWidthCm} min={10} max={80} step={1} suffix="cm" onChange={(value) => updateInput(setInput, "panWidthCm", value)} />
                        <NumberField id="quick-pan-length" label="Pan length" value={result.input.panLengthCm} min={10} max={120} step={1} suffix="cm" onChange={(value) => updateInput(setInput, "panLengthCm", value)} />
                        <NumberField id="quick-dough-loading" label="Dough loading" value={result.input.doughLoadingGramsPerSquareCm} min={0.25} max={1.2} step={0.01} suffix="g/cm2" onChange={(value) => updateInput(setInput, "doughLoadingGramsPerSquareCm", value)} />
                        <p className="rounded-[1.2rem] bg-ink/[.04] p-4 text-xs font-bold leading-5 text-ink/58 md:col-span-2 lg:col-span-3">
                          Pan loading guidance: lower g/cm2 is thinner, around 0.74 g/cm2 is balanced for this preset, and higher values bake thicker.
                        </p>
                      </div>
                    )}

                    {result.input.sizingMode === "custom" && (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <NumberField id="quick-custom-dough-weight" label="Custom dough weight" value={result.input.customDoughWeightGrams} min={100} max={2000} step={5} suffix="g" onChange={(value) => updateInput(setInput, "customDoughWeightGrams", value)} />
                        <div className="rounded-[1.2rem] border border-ink/10 bg-cream/50 p-4">
                          <p className="text-sm font-extrabold text-ink/72">I already know the dough weight</p>
                          <p className="mt-2 text-xs leading-5 text-ink/50">Use this when you already know the target dough weight per pizza or pan.</p>
                        </div>
                      </div>
                    )}
                  </OptionalControlGroup>

                  <OptionalControlGroup id="quick-preferment-controls" title="Use a preferment" intro="Split flour and water into a preferment build." summary={prefermentActive ? `${result.preferment.label} active` : "Direct dough"} defaultOpen={prefermentActive}>
                    <fieldset>
                      <legend className="text-sm font-extrabold text-ink/72">Dough method</legend>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {quickPrefermentPresets.map((preset) => (
                          <OptionButton<QuickPrefermentMethod> key={preset.id} label={preset.label} description={preset.description} selected={result.input.prefermentMethod === preset.id} onClick={() => applyPreferment(preset.id)} />
                        ))}
                      </div>
                    </fieldset>

                    {result.input.prefermentMethod !== "direct" && (
                      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <NumberField id="quick-prefermented-flour" label="Prefermented flour" value={result.input.prefermentedFlourPercent} min={5} max={80} step={1} suffix="%" onChange={(value) => updateInput(setInput, "prefermentedFlourPercent", value)} />
                        <NumberField id="quick-preferment-hydration" label="Preferment hydration" value={result.input.prefermentHydrationPercent} min={40} max={125} step={1} suffix="%" onChange={(value) => updateInput(setInput, "prefermentHydrationPercent", value)} />
                        {result.input.prefermentMethod === "levain" && (
                          <NumberField id="quick-preferment-inoculation" label="Levain inoculation" value={result.input.prefermentInoculationPercent} min={1} max={60} step={1} suffix="%" onChange={(value) => updateInput(setInput, "prefermentInoculationPercent", value)} />
                        )}
                      </div>
                    )}
                  </OptionalControlGroup>

                  <section aria-labelledby="quick-advanced-tools-heading" data-quick-advanced-section>
                    <OptionalControlGroup id="quick-technical-tools" title="Dough-temperature and flour tools" intro="Optional tools for temperature planning, yeast conversion, custom ingredients and flour blending." summary={technicalToolsActive ? "Technical settings active" : "Tools available"} defaultOpen={technicalToolsActive}>
                      <h3 id="quick-advanced-tools-heading" className="sr-only">Dough-temperature and flour tools</h3>
                      {advancedControls}
                    </OptionalControlGroup>
                  </section>

                  <OptionalControlGroup id="quick-bakers-percentages" title="View baker's percentages" intro="Formula percentages appear after the ingredient result." summary={`Water ${formatPercent(result.bakerPercentages.water)}% · Salt ${formatPercent(result.bakerPercentages.salt)}%`} defaultOpen={bakerPercentagesDefaultOpen}>
                    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      {[
                        ["Flour", "100%"],
                        ["Water", `${formatPercent(result.bakerPercentages.water)}%`],
                        ["Salt", `${formatPercent(result.bakerPercentages.salt)}%`],
                        ["Yeast", `${formatPercent(result.bakerPercentages.yeast, 3)}%`],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-ink/[.04] p-4">
                          <dt className="text-ink/45">{label}</dt>
                          <dd className="mt-1 font-extrabold tabular-nums text-ink">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </OptionalControlGroup>

                  <OptionalControlGroup id="quick-calculation-assumptions" title="View calculation assumptions" intro="Check normalized calculation settings." summary={`${result.settings.fermentation} · ${formatTemperature(result.settings.temperature)} C`} defaultOpen={false}>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-2xl bg-ink/[.04] p-4"><dt className="text-ink/45">Dough method</dt><dd className="mt-1 font-extrabold">{result.preferment.label}</dd></div>
                      <div className="rounded-2xl bg-ink/[.04] p-4"><dt className="text-ink/45">Fermentation temp</dt><dd className="mt-1 font-extrabold">{formatTemperature(result.input.fermentationTemperatureCelsius)} C</dd></div>
                      <div className="rounded-2xl bg-ink/[.04] p-4"><dt className="text-ink/45">Target dough temp</dt><dd className="mt-1 font-extrabold">{formatTemperature(result.input.targetDoughTemperatureCelsius)} C</dd></div>
                      <div className="rounded-2xl bg-ink/[.04] p-4"><dt className="text-ink/45">Water estimate</dt><dd className="mt-1 font-extrabold">{formatTemperature(result.advancedTools.waterTemperature.requiredWaterTemperatureCelsius)} C</dd></div>
                    </dl>
                  </OptionalControlGroup>
                </>
              )}

              <section className="grid gap-3 rounded-[1.35rem] border border-ink/10 bg-white/70 p-4 text-sm font-extrabold shadow-sm sm:grid-cols-2 lg:grid-cols-1" aria-label="Quick calculator next steps">
                <Link href="/guides/dough" className="rounded-2xl bg-white px-4 py-3 text-ink transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  New to pizza dough? Learn the process →
                </Link>
                <Link href="/session/start" className="rounded-2xl bg-white px-4 py-3 text-ink transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato" data-quick-session-cta>
                  Need the full process? Plan a pizza →
                </Link>
                <p className="text-xs font-bold leading-5 text-ink/52 sm:col-span-2 lg:col-span-1">
                  Quick Calculator does not create or prepopulate a Pizza Plan.
                </p>
              </section>
            </section>
          </div>
        </div>
      </main>

      {pendingLevelChange && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4" role="dialog" aria-modal="true" aria-labelledby="quick-level-reset-title">
          <div className="w-full max-w-md rounded-[1.6rem] bg-white p-5 shadow-overlay">
            <h2 id="quick-level-reset-title" className="font-display text-3xl font-semibold">{pendingLevelChange.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/64">{pendingLevelChange.body}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={confirmPendingLevelChange} className="min-h-12 rounded-2xl bg-tomato px-4 py-3 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                {pendingLevelChange.targetLevel === "beginner" ? "Use recommended settings" : "Use practical settings"}
              </button>
              <button type="button" onClick={() => setPendingLevelChange(null)} className="min-h-12 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-extrabold text-ink/64 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Keep current level
              </button>
            </div>
          </div>
        </div>
      )}

      {sharePreviewUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/45 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="quick-share-preview-title">
          <div className="w-full max-w-sm rounded-[1.6rem] bg-white p-4 shadow-overlay">
            <h2 id="quick-share-preview-title" className="font-display text-2xl font-semibold">Recipe image preview</h2>
            <Image
              src={sharePreviewUrl}
              alt="Generated DoughTools dough recipe share image preview."
              width={QUICK_RECIPE_IMAGE_WIDTH}
              height={QUICK_RECIPE_IMAGE_HEIGHT}
              unoptimized
              className="mt-4 w-full rounded-2xl border border-ink/10"
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={savePreviewImage} className="min-h-11 rounded-2xl bg-tomato px-4 py-3 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Save image
              </button>
              <button type="button" onClick={() => { setSharePreviewUrl(null); setShareStatus("idle"); }} className="min-h-11 rounded-2xl border border-ink/10 px-4 py-3 text-sm font-extrabold text-ink/64 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
