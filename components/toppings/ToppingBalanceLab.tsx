"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import SiteFooter from "@/components/SiteFooter";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { LearningBreadcrumbs } from "@/components/learning/RelatedLearning";
import { settingsFromUrl } from "@/lib/recipe-url";
import type { PizzaStyleId } from "@/lib/saved-recipes";
import type { CheeseType, DrainState, PizzaGeometry } from "@/lib/topping-calculator";
import {
  buildToppingBalanceSearch,
  calculateToppingBalance,
  normalizeToppingGeometry,
  parseToppingBalanceSearch,
  toppingBalanceDefaultState,
  toppingBalancePresets,
  type BalanceLevel,
  type ToppingBalancePreset,
  type ToppingBalanceState,
  type ToppingLoadTeachingLevel,
} from "@/lib/topping-balance-lab";

const cheeseOptions: Array<{ value: CheeseType; label: string; description: string }> = [
  { value: "fior-di-latte", label: "Fior di latte", description: "Fresh cow’s-milk mozzarella; delicious but moisture-sensitive." },
  { value: "buffalo", label: "Buffalo mozzarella", description: "Aromatic and wetter; use restraint and drainage." },
  { value: "low-moisture", label: "Low-moisture mozzarella", description: "More predictable for home ovens and longer bakes." },
  { value: "none", label: "No cheese", description: "Useful for Marinara or sauce-focused experiments." },
];

const drainOptions: Array<{ value: DrainState; label: string; cue: string }> = [
  { value: "undrained", label: "Not drained", cue: "Visible liquid remains." },
  { value: "under-1h", label: "Short drain", cue: "Surface may still weep." },
  { value: "1-3h", label: "1–3 hours", cue: "Some moisture has left." },
  { value: "4-8h", label: "4–8 hours", cue: "Dry-looking surface, still fresh." },
  { value: "overnight", label: "Longer controlled drain", cue: "Very controlled, but avoid drying it lifeless." },
];

const toppingLoadOptions: Array<{ value: ToppingLoadTeachingLevel; label: string; description: string }> = [
  { value: "none", label: "None", description: "Only sauce and cheese." },
  { value: "light", label: "Light", description: "A few restrained toppings." },
  { value: "moderate", label: "Moderate", description: "Noticeable extra load." },
  { value: "heavy", label: "Heavy", description: "Several toppings or a thick layer." },
];

const presetCards: Array<{ id: ToppingBalancePreset; label: string; description: string }> = [
  { id: "too-little", label: "Too little", description: "Sparse coverage and a dry-looking bite." },
  { id: "balanced", label: "Balanced", description: "A practical starting point for a 32 cm pizza." },
  { id: "too-much", label: "Too much", description: "Deep sauce, cheese blanket and less bake margin." },
  { id: "wet-overload", label: "Wet overload", description: "Balanced-looking grams, but poorly drained cheese." },
  { id: "heavy-toppings", label: "Heavy topping load", description: "Extra toppings push the pizza past easy baking." },
];

type ToppingVisualState = "too-little" | "balanced" | "too-much" | "wet-overload" | "heavy-load";
type ToppingPizzaExampleId = "diavola" | "margherita" | "marinara" | "custom";

type ToppingExampleImage = {
  src: string;
  alt: string;
  label: string;
};

type ToppingPizzaExample = {
  id: ToppingPizzaExampleId;
  name: string;
  description: string;
  thumbnail: string;
  thumbnailAlt: string;
  images: Partial<Record<ToppingVisualState, ToppingExampleImage>>;
};

const visualStateLabels: Record<ToppingVisualState, string> = {
  "too-little": "Too little",
  balanced: "Balanced",
  "too-much": "Too much",
  "wet-overload": "Wet overload",
  "heavy-load": "Heavy topping load",
};

const pizzaExamples: ToppingPizzaExample[] = [
  {
    id: "diavola",
    name: "Diavola",
    description: "Tomato, fior di latte and spicy salami make topping coverage easy to compare.",
    thumbnail: "/toppings/diavola/diavola-balanced.webp",
    thumbnailAlt: "Balanced Diavola pizza with tomato, fior di latte and spicy salami.",
    images: {
      "too-little": {
        src: "/toppings/diavola/diavola-too-little.webp",
        alt: "Diavola pizza with sparse sauce, cheese and spicy salami coverage.",
        label: "Sparse Diavola reference",
      },
      balanced: {
        src: "/toppings/diavola/diavola-balanced.webp",
        alt: "Balanced Diavola pizza with tomato, fior di latte and spicy salami.",
        label: "Balanced Diavola reference",
      },
      "too-much": {
        src: "/toppings/diavola/diavola-too-much.webp",
        alt: "Diavola pizza with heavy sauce, cheese and spicy salami coverage.",
        label: "Too-much Diavola reference",
      },
      "wet-overload": {
        src: "/toppings/diavola/diavola-wet-overload.webp",
        alt: "Diavola pizza with wet-looking fior di latte and visible moisture risk.",
        label: "Wet-overload Diavola reference",
      },
      "heavy-load": {
        src: "/toppings/diavola/diavola-heavy-load.webp",
        alt: "Diavola pizza with dense spicy salami and heavy topping coverage.",
        label: "Heavy-load Diavola reference",
      },
    },
  },
  {
    id: "margherita",
    name: "Margherita",
    description: "A balanced tomato, fior di latte and basil reference for classic restraint.",
    thumbnail: "/toppings/examples/margherita-balanced.webp",
    thumbnailAlt: "Balanced Margherita pizza with tomato, fior di latte and basil.",
    images: {
      balanced: {
        src: "/toppings/examples/margherita-balanced.webp",
        alt: "Balanced Margherita pizza with tomato, fior di latte and basil.",
        label: "Balanced Margherita reference",
      },
    },
  },
  {
    id: "marinara",
    name: "Marinara",
    description: "A cheese-free tomato, garlic, oregano and olive-oil reference.",
    thumbnail: "/toppings/examples/marinara-balanced.webp",
    thumbnailAlt: "Balanced Marinara pizza with tomato, garlic, oregano and olive oil.",
    images: {
      balanced: {
        src: "/toppings/examples/marinara-balanced.webp",
        alt: "Balanced Marinara pizza with tomato, garlic, oregano and olive oil.",
        label: "Balanced Marinara reference",
      },
    },
  },
  {
    id: "custom",
    name: "Custom",
    description: "Keep your current controls as the source of truth and compare them against Diavola references.",
    thumbnail: "/toppings/diavola/diavola-balanced.webp",
    thumbnailAlt: "Balanced Diavola comparison pizza used as a custom visual reference.",
    images: {},
  },
];

type ToppingLesson = {
  id: string;
  eyebrow: string;
  title: string;
  icon: DoughToolsIconName;
  states: readonly [string, string][];
  link?: { href: string; label: string };
};

const lessons: ToppingLesson[] = [
  {
    id: "sauce-lesson",
    eyebrow: "Sauce lesson",
    title: "Sauce controls coverage and moisture.",
    icon: "water",
    states: [
      ["Too little", "Large dry-looking gaps, weak tomato presence and cheese that dominates the bite."],
      ["Balanced", "Thin even coverage, no pools, a clear rim, and tomato presence without flooding the center."],
      ["Too much", "Deep layer, pooled sauce, toppings sliding, slower base baking and possible wet center."],
    ],
    link: { href: "/sauce", label: "Open Sauce guides" },
  },
  {
    id: "cheese-lesson",
    eyebrow: "Cheese lesson",
    title: "Cheese should support the pizza, not bury it.",
    icon: "pizza",
    states: [
      ["Too little", "Sparse melt and dry bites; still intentional for some styles."],
      ["Balanced", "Visible sauce remains and the cheese melts without forming a heavy lid."],
      ["Too much", "A thick blanket traps steam, releases oil, slows the bake and can dominate dough and sauce."],
    ],
  },
  {
    id: "drainage-lesson",
    eyebrow: "Fresh mozzarella",
    title: "Drainage changes how much water reaches the pizza.",
    icon: "water",
    states: [
      ["Too wet", "Obvious liquid, pieces weep immediately, and the center receives extra water."],
      ["Ready", "Surface looks dry rather than dripping, pieces retain shape, and no large pool remains."],
      ["Too dry", "Extreme drying can reduce the fresh character you wanted from fior di latte."],
    ],
  },
];

const commonMistakes = [
  ["Covering the pizza with a continuous cheese blanket", "It traps steam and hides the sauce. Leave gaps and keep the melt loose."],
  ["Using a deep layer of sauce", "The base has to bake through water before it can set. Spread thinly and weigh while learning."],
  ["Failing to drain fresh mozzarella", "The cheese may look normal before baking but release water in the oven. Drain and blot the surface."],
  ["Stacking several wet toppings", "Mushrooms, tomato, spinach and wet cheese add up. Prepare wet ingredients before topping."],
  ["Building the pizza too early before launch", "Sauce and cheese start hydrating the dough. Top close to baking time."],
  ["Copying gram amounts from another pizza size", "A larger pizza has more topped area. Compare grams per 100 cm², not grams alone."],
  ["Ignoring the rim and usable topped area", "The rim stays clear, so toppings sit on a smaller area than the full diameter suggests."],
  ["Using the same topping load for every oven", "Home ovens and high-heat ovens handle moisture differently."],
  ["Treating every topping as equal moisture", "Cured meat and fresh tomato do not behave the same way."],
  ["Adding more because the uncooked pizza looks sparse", "Pizza fills visually as cheese melts; restraint often bakes better."],
] as const;

type ToppingReferenceCategory = "sauce" | "cheese" | "moisture";
type ToppingReferenceState = "light" | "balanced" | "heavy" | "wet" | "drained";

const referenceImageGroups: Array<{
  id: ToppingReferenceCategory;
  label: string;
  title: string;
  description: string;
  items: Array<{
    state: ToppingReferenceState;
    label: string;
    src: string;
    alt: string;
    note: string;
  }>;
}> = [
  {
    id: "sauce",
    label: "Sauce",
    title: "Sauce coverage changes the bake.",
    description: "Compare how the same pizza base reads when the tomato layer is restrained, balanced or too deep.",
    items: [
      {
        state: "light",
        label: "Light sauce",
        src: "/toppings/references/sauce-light.webp",
        alt: "Pizza with sparse tomato sauce coverage and visible untopped dough between sauce patches.",
        note: "Useful when the bite feels dry or tomato disappears.",
      },
      {
        state: "balanced",
        label: "Balanced sauce",
        src: "/toppings/references/sauce-balanced.webp",
        alt: "Pizza with an even tomato sauce layer and a clear raised rim.",
        note: "A thin, even layer supports the dough without flooding the center.",
      },
      {
        state: "heavy",
        label: "Heavy sauce",
        src: "/toppings/references/sauce-heavy.webp",
        alt: "Pizza with a deep tomato sauce layer and visible wet pools near the center.",
        note: "A deep layer adds water the base must bake through.",
      },
    ],
  },
  {
    id: "cheese",
    label: "Cheese",
    title: "Cheese should melt in balance with the sauce.",
    description: "Compare sparse coverage, restrained islands and a continuous blanket that can trap steam.",
    items: [
      {
        state: "light",
        label: "Light cheese",
        src: "/toppings/references/cheese-light.webp",
        alt: "Pizza with sparse melted fior di latte pieces and tomato sauce visible between them.",
        note: "Light cheese can be intentional, but it changes the bite and visual balance.",
      },
      {
        state: "balanced",
        label: "Balanced cheese",
        src: "/toppings/references/cheese-balanced.webp",
        alt: "Pizza with restrained melted fior di latte islands and visible tomato sauce.",
        note: "Sauce remains visible and the cheese does not become a lid.",
      },
      {
        state: "heavy",
        label: "Heavy cheese",
        src: "/toppings/references/cheese-heavy.webp",
        alt: "Pizza covered by a near-continuous blanket of melted mozzarella.",
        note: "A cheese blanket can slow evaporation and dominate the bake.",
      },
    ],
  },
  {
    id: "moisture",
    label: "Mozzarella moisture",
    title: "Fresh mozzarella moisture matters before it reaches the pizza.",
    description: "The same grams behave differently when the cheese is wet versus properly drained.",
    items: [
      {
        state: "wet",
        label: "Still wet",
        src: "/toppings/references/mozzarella-wet.webp",
        alt: "Fresh fior di latte pieces sitting in visible milky liquid.",
        note: "Wet cheese carries extra water into the center.",
      },
      {
        state: "drained",
        label: "Drained",
        src: "/toppings/references/mozzarella-drained.webp",
        alt: "Fresh fior di latte pieces with a dry-looking surface and no pooling liquid.",
        note: "Drained cheese keeps freshness while reducing water risk.",
      },
    ],
  },
] as const;

function levelLabel(level: BalanceLevel) {
  return ({
    "very-light": "Very light",
    light: "Light",
    balanced: "Balanced",
    heavy: "Heavy",
    overloaded: "Overloaded",
  } as const)[level];
}

function baseStateFromLocation() {
  const shared = settingsFromUrl(window.location.search);
  const style = (shared.pizzaStyleId ?? toppingBalanceDefaultState.style) as PizzaStyleId;
  return parseToppingBalanceSearch(window.location.search, {
    style,
    oven: shared.ovenType ?? toppingBalanceDefaultState.oven,
  });
}

function writeUrl(state: ToppingBalanceState, mode: "push" | "replace") {
  const query = buildToppingBalanceSearch(state);
  const nextUrl = `${window.location.pathname}?${query}`;
  if (mode === "push") {
    window.history.pushState(null, "", nextUrl);
  } else {
    window.history.replaceState(null, "", nextUrl);
  }
  window.dispatchEvent(new Event("doughtools:urlchange"));
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}

function NumberControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [editing, value]);

  const commitValue = (raw: string) => {
    const next = clampNumber(Number(raw), min, max);
    setDraft(String(next));
    setEditing(false);
    onChange(next);
  };

  const setValue = (next: number) => {
    const clamped = clampNumber(next, min, max);
    setDraft(String(clamped));
    onChange(clamped);
  };

  return (
    <label className="block rounded-[1.25rem] border border-ink/10 bg-white p-4" data-topping-number-control>
      <span className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">{label}</span>
      <span className="mt-3 grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => setValue(value - step)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-flour font-extrabold transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          −
        </button>
        <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center rounded-2xl border border-ink/10 bg-warm-background px-3">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            onFocus={() => setEditing(true)}
            onChange={(event) => {
              const nextDraft = event.target.value;
              setDraft(nextDraft);
              if (nextDraft.trim() !== "" && Number.isFinite(Number(nextDraft))) {
                onChange(clampNumber(Number(nextDraft), min, max));
              }
            }}
            onBlur={(event) => commitValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitValue(event.currentTarget.value);
                event.currentTarget.blur();
              }
            }}
            className="min-w-0 bg-transparent py-3 text-center text-lg font-extrabold tabular-nums text-ink outline-none"
          />
          <span className="text-xs font-extrabold text-ink/40">{unit}</span>
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => setValue(value + step)}
          className="grid h-11 w-11 place-items-center rounded-2xl border border-ink/10 bg-flour font-extrabold transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        >
          +
        </button>
      </span>
    </label>
  );
}

function GeometryControls({
  geometry,
  onChange,
}: {
  geometry: PizzaGeometry;
  onChange: (geometry: PizzaGeometry) => void;
}) {
  if (geometry.shape === "round") {
    return (
      <div className="mt-4 grid gap-3">
        <NumberControl label="Diameter" value={geometry.diameter} min={18} max={45} unit="cm" onChange={(diameter) => onChange({ shape: "round", diameter, rim: geometry.rim })} />
        <NumberControl label="Untopped rim" value={geometry.rim} min={0} max={8} step={0.5} unit="cm" onChange={(rim) => onChange({ shape: "round", diameter: geometry.diameter, rim })} />
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <NumberControl label="Width" value={geometry.width} min={12} max={60} unit="cm" onChange={(width) => onChange({ shape: "rectangle", width, length: geometry.length, rim: geometry.rim })} />
        <NumberControl label="Length" value={geometry.length} min={12} max={80} unit="cm" onChange={(length) => onChange({ shape: "rectangle", width: geometry.width, length, rim: geometry.rim })} />
      </div>
      <NumberControl label="Untopped rim" value={geometry.rim} min={0} max={8} step={0.5} unit="cm" onChange={(rim) => onChange({ shape: "rectangle", width: geometry.width, length: geometry.length, rim })} />
    </div>
  );
}

function visualStateForResult(state: ToppingBalanceState, result: ReturnType<typeof calculateToppingBalance>): ToppingVisualState {
  if (result.moistureLevel === "high") return "wet-overload";
  if (state.toppingLoad === "heavy" || result.combinedLevel === "overloaded") return "heavy-load";
  if (result.combinedLevel === "very-light" || result.combinedLevel === "light") return "too-little";
  if (result.combinedLevel === "heavy") return "too-much";
  return "balanced";
}

function imageForExample(example: ToppingPizzaExample, visualState: ToppingVisualState) {
  const fallback = pizzaExamples[0];
  const image = example.images[visualState] ?? example.images.balanced;
  if (image) {
    return {
      image,
      fallbackName: null as string | null,
      effectiveState: example.images[visualState] ? visualState : "balanced" as ToppingVisualState,
    };
  }

  return {
    image: fallback.images[visualState] ?? fallback.images.balanced!,
    fallbackName: fallback.name,
    effectiveState: visualState,
  };
}

function ToppingPizzaExampleSelector({
  selected,
  onChange,
}: {
  selected: ToppingPizzaExampleId;
  onChange: (example: ToppingPizzaExampleId) => void;
}) {
  return (
    <label className="block text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">
      Pizza example
      <select
        value={selected}
        onChange={(event) => onChange(event.target.value as ToppingPizzaExampleId)}
        className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-3 text-sm font-bold normal-case tracking-normal text-ink outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20"
      >
        {pizzaExamples.map((example) => (
          <option key={example.id} value={example.id}>{example.name}</option>
        ))}
      </select>
    </label>
  );
}

function ToppingExampleDialog({
  open,
  selected,
  onChange,
  onClose,
  returnFocusRef,
}: {
  open: boolean;
  selected: ToppingPizzaExampleId;
  onChange: (example: ToppingPizzaExampleId) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement;
    const returnFocusNode = returnFocusRef.current;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      if (previousActive instanceof HTMLElement) {
        previousActive.focus();
      } else {
        returnFocusNode?.focus();
      }
    };
  }, [onClose, open, returnFocusRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-ink/45 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pizza-example-dialog-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-[2rem] bg-warm-background p-4 shadow-overlay sm:max-w-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Visual reference</p>
            <h2 id="pizza-example-dialog-title" className="mt-2 font-display text-3xl font-semibold">Choose a pizza example</h2>
            <p className="mt-2 text-sm leading-6 text-ink/62">The example changes the teaching photo only. Your sauce, cheese and topping values stay unchanged.</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/10 bg-white text-ink transition hover:border-tomato/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
            aria-label="Close pizza example chooser"
          >
            <DoughToolsIcon name="close" size={20} />
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {pizzaExamples.map((example) => {
            const active = selected === example.id;
            return (
              <button
                key={example.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  onChange(example.id);
                  onClose();
                }}
                className={`grid grid-cols-[5rem_minmax(0,1fr)] gap-3 rounded-[1.25rem] border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${active ? "border-tomato bg-tomato/10" : "border-ink/10 bg-white hover:border-tomato/30"}`}
              >
                <Image
                  src={example.thumbnail}
                  alt=""
                  width={160}
                  height={160}
                  sizes="5rem"
                  className="aspect-square rounded-2xl object-cover"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold">{example.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/58">{example.description}</span>
                  {active && <span className="mt-2 inline-flex rounded-full bg-ink px-2 py-1 text-[10px] font-extrabold text-white">Selected</span>}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ToppingRealisticReference({
  state,
  result,
  selectedExample,
  onExampleChange,
}: {
  state: ToppingBalanceState;
  result: ReturnType<typeof calculateToppingBalance>;
  selectedExample: ToppingPizzaExampleId;
  onExampleChange: (example: ToppingPizzaExampleId) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const visualButtonRef = useRef<HTMLButtonElement | null>(null);
  const visualState = visualStateForResult(state, result);
  const example = pizzaExamples.find((item) => item.id === selectedExample) ?? pizzaExamples[0];
  const { image, fallbackName, effectiveState } = imageForExample(example, visualState);
  const cheeseGrams = state.cheeseType === "none" ? 0 : state.cheeseGrams;
  const referenceName = fallbackName ? `${fallbackName} comparison reference` : `${example.name} reference`;
  const setupSummary = `${state.sauceGrams} g sauce · ${cheeseGrams} g cheese · ${state.geometry.shape === "round" ? `${state.geometry.diameter} cm pizza` : `${state.geometry.width} × ${state.geometry.length} cm pizza`} · ${state.geometry.rim} cm rim`;

  useEffect(() => {
    setImageFailed(false);
  }, [image.src]);

  return (
    <figure className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-card sm:p-6" aria-label={`${referenceName}: ${visualStateLabels[visualState]}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Real-world reference</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Visual example</h2>
          <p className="mt-2 text-sm leading-6 text-ink/62">{example.description}</p>
          <p className="sr-only" aria-live="polite">{example.name} {visualStateLabels[effectiveState].toLowerCase()} reference selected.</p>
        </div>
        <div className="w-full sm:w-56">
          <ToppingPizzaExampleSelector selected={selectedExample} onChange={onExampleChange} />
        </div>
      </div>

      <button
        ref={visualButtonRef}
        type="button"
        onClick={() => setDialogOpen(true)}
        className="group mt-5 block w-full overflow-hidden rounded-[1.75rem] bg-flour text-left shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
        aria-label="Change pizza example"
      >
        <span className="relative block aspect-square">
          {imageFailed ? (
            <span className="grid h-full place-items-center p-6 text-center text-sm font-extrabold text-ink/62">Visual reference unavailable</span>
          ) : (
            <Image
              src={image.src}
              alt={image.alt}
              width={1200}
              height={1200}
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
              onError={() => setImageFailed(true)}
            />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-ink/78 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur">
            {example.name} · {visualStateLabels[effectiveState]}
          </span>
          {fallbackName && (
            <span className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/88 px-3 py-2 text-xs font-bold text-ink shadow-soft backdrop-blur">
              {example.name} does not have this full comparison series yet, so this uses a Diavola comparison reference.
            </span>
          )}
        </span>
      </button>

      <figcaption className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">Your current setup</p>
          <p className="mt-2 text-sm font-extrabold text-ink">{setupSummary}</p>
          <p className="mt-2 text-sm leading-6 text-ink/62">
            The photograph represents the nearest visual category, not the exact gram-perfect pizza. {result.likelyEffect}
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-4 inline-flex min-h-11 items-center rounded-full text-sm font-extrabold text-tomato underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            Change pizza example
          </button>
        </div>
        <div className="rounded-2xl bg-ink p-4 text-white">
          <span className="text-xs font-extrabold uppercase tracking-[.16em] text-white/45">Combined load</span>
          <strong className="mt-1 block font-display text-3xl">{levelLabel(result.combinedLevel)}</strong>
          <span className="mt-1 block text-xs text-white/58">{result.combinedDensity} g / 100 cm²</span>
        </div>
      </figcaption>

      <ToppingExampleDialog
        open={dialogOpen}
        selected={selectedExample}
        onChange={onExampleChange}
        onClose={() => setDialogOpen(false)}
        returnFocusRef={visualButtonRef}
      />
    </figure>
  );
}

function ReferenceComparison({ activeLevel }: { activeLevel: BalanceLevel }) {
  const cards = [
    { level: "light" as BalanceLevel, title: "Too little", text: "Large uncovered areas and weak topping presence." },
    { level: "balanced" as BalanceLevel, title: "Balanced", text: "Thin coverage, visible sauce, clear rim and controlled moisture." },
    { level: "overloaded" as BalanceLevel, title: "Too much", text: "Deep sauce, cheese blanket and less room for the base to bake." },
  ];

  return (
    <section className="grid gap-3 lg:grid-cols-3" aria-label="Too little, balanced and too much topping reference">
      {cards.map((card) => {
        const active = card.level === activeLevel || (activeLevel === "very-light" && card.level === "light") || (activeLevel === "heavy" && card.level === "overloaded");
        return (
          <article key={card.title} className={`rounded-[1.5rem] border p-4 ${active ? "border-tomato bg-tomato/10" : "border-ink/10 bg-white"}`}>
            <div className="flex items-center gap-3">
              <span className={`h-4 w-4 rounded-full ${card.level === "light" ? "bg-oven-gold" : card.level === "balanced" ? "bg-leaf" : "bg-tomato"}`} aria-hidden="true" />
              <h3 className="text-sm font-extrabold">{card.title}</h3>
              {active && <span className="ml-auto rounded-full bg-ink px-2 py-1 text-[10px] font-extrabold text-white">Current zone</span>}
            </div>
            <p className="mt-3 text-sm leading-6 text-ink/58">{card.text}</p>
          </article>
        );
      })}
    </section>
  );
}

function referenceStateForLevel(level: BalanceLevel): ToppingReferenceState {
  if (level === "very-light" || level === "light") return "light";
  if (level === "balanced") return "balanced";
  return "heavy";
}

function referenceStateForDrainState(drainState: DrainState): ToppingReferenceState {
  return drainState === "undrained" || drainState === "under-1h" || drainState === "1-3h" ? "wet" : "drained";
}

function ToppingReferenceGallery({
  state,
  result,
}: {
  state: ToppingBalanceState;
  result: ReturnType<typeof calculateToppingBalance>;
}) {
  const [activeGroupId, setActiveGroupId] = useState<ToppingReferenceCategory>("sauce");
  const activeGroup = referenceImageGroups.find((group) => group.id === activeGroupId) ?? referenceImageGroups[0];
  const suggestedState = activeGroup.id === "sauce"
    ? referenceStateForLevel(result.sauceLevel)
    : activeGroup.id === "cheese"
      ? referenceStateForLevel(result.cheeseLevel)
      : referenceStateForDrainState(state.drainState);
  const [manualState, setManualState] = useState<ToppingReferenceState | null>(null);
  const activeState = manualState && activeGroup.items.some((item) => item.state === manualState)
    ? manualState
    : suggestedState;
  const activeItem = activeGroup.items.find((item) => item.state === activeState) ?? activeGroup.items[0];

  useEffect(() => {
    setManualState(null);
  }, [activeGroupId, result.sauceLevel, result.cheeseLevel, state.drainState]);

  return (
    <section className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-card sm:p-6" aria-labelledby="reference-images-title" data-topping-reference-gallery>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,.84fr)_minmax(18rem,.56fr)] lg:items-center">
        <figure className="overflow-hidden rounded-[1.5rem] bg-flour">
          <Image
            src={activeItem.src}
            alt={activeItem.alt}
            width={960}
            height={960}
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="aspect-square h-auto w-full object-cover"
          />
          <figcaption className="border-t border-ink/10 bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{activeGroup.label}</p>
            <h3 className="mt-2 text-base font-extrabold">{activeItem.label}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/62">{activeItem.note}</p>
          </figcaption>
        </figure>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Realistic references</p>
          <h2 id="reference-images-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
            {activeGroup.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-ink/62">{activeGroup.description}</p>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1" role="group" aria-label="Choose topping reference topic">
            {referenceImageGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-pressed={group.id === activeGroup.id}
                onClick={() => setActiveGroupId(group.id)}
                className={`min-h-11 rounded-2xl border px-4 py-3 text-left text-sm font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                  group.id === activeGroup.id ? "border-tomato bg-tomato/10 text-ink" : "border-ink/10 bg-flour text-ink/60 hover:border-tomato/30"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`Choose ${activeGroup.label.toLowerCase()} reference state`}>
            {activeGroup.items.map((item) => (
              <button
                key={item.state}
                type="button"
                aria-pressed={item.state === activeItem.state}
                onClick={() => setManualState(item.state)}
                className={`min-h-10 rounded-full px-4 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                  item.state === activeItem.state ? "bg-ink text-white" : "bg-flour text-ink/58 hover:text-ink"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-flour p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">Current lab signal</p>
            <p className="mt-2 text-sm leading-6 text-ink/62">
              The selected reference follows the current sauce, cheese or drainage state, but you can switch states to compare the teaching images directly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ToppingBalanceLab() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<ToppingBalanceState>(toppingBalanceDefaultState);
  const [selectedExample, setSelectedExample] = useState<ToppingPizzaExampleId>("diavola");
  const result = useMemo(() => calculateToppingBalance(state), [state]);

  useEffect(() => {
    const initial = baseStateFromLocation();
    setState(initial);
    writeUrl(initial, "replace");
    setReady(true);
    document.documentElement.lang = "en";

    const restoreFromUrl = () => setState(baseStateFromLocation());
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, []);

  const updateState = (updater: (current: ToppingBalanceState) => ToppingBalanceState, mode: "push" | "replace" = "replace") => {
    setState((current) => {
      const next = updater(current);
      if (ready) writeUrl(next, mode);
      return next;
    });
  };

  const setPreset = (preset: ToppingBalancePreset) => {
    updateState((current) => ({
      ...current,
      ...toppingBalancePresets[preset],
    }), "push");
  };

  const setGeometry = (geometry: PizzaGeometry) => updateState((current) => ({ ...current, geometry: normalizeToppingGeometry(geometry) }));
  const resetToBalanced = () => setPreset("balanced");

  if (!ready) {
    return <main className="min-h-screen bg-warm-background" />;
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-warm-background text-ink">
      <section className="bg-forest-dark text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,.82fr)_minmax(18rem,.48fr)] lg:px-8">
          <div>
            <div className="[&_a]:text-oven-gold [&_span]:text-white/60">
              <LearningBreadcrumbs current="Topping guides" />
            </div>
            <p className="text-xs font-extrabold uppercase tracking-[.24em] text-oven-gold">Topping guides</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold leading-[.94] tracking-tight sm:text-6xl lg:text-7xl">
              See what too much looks like.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/76">
              Adjust sauce and cheese, compare the result, and learn how topping weight and moisture change the bake.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#interactive-lab" className="inline-flex min-h-12 items-center justify-center rounded-full bg-tomato px-6 text-sm font-extrabold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-white hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Start the experiment
              </a>
              <button type="button" onClick={() => setPreset("balanced")} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                See the balanced example
              </button>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/12 bg-white/10 p-5 shadow-card backdrop-blur lg:self-end">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-oven-gold">Central lesson</p>
            <p className="mt-3 text-sm leading-7 text-white/74">
              More toppings do not automatically create a better pizza. Balance comes from coverage, topped area,
              moisture, cheese behavior and oven heat working together.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <section id="interactive-lab" className="scroll-mt-24" aria-labelledby="lab-title">
          <div className="mb-6 max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Interactive workspace</p>
            <h2 id="lab-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Build and compare the topping load.</h2>
            <p className="mt-4 text-sm leading-7 text-ink/62">
              Numbers support the lesson; the visual is the point. Change one thing, watch the coverage, then read the
              likely consequence before the pizza reaches the oven.
            </p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,.62fr)_minmax(0,1fr)]">
            <div className="space-y-5 lg:order-2" data-topping-visual-result>
              <ToppingRealisticReference
                state={state}
                result={result}
                selectedExample={selectedExample}
                onExampleChange={setSelectedExample}
              />
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite" aria-label="Current topping balance details">
                {[
                  ["Usable topped area", `${result.usableArea} cm²`, "The clear rim is excluded."],
                  ["Sauce density", `${result.sauceDensity} g / 100 cm²`, `Suggested start: ${result.recommendedSauceRange[0]}–${result.recommendedSauceRange[1]} g.`],
                  ["Cheese density", `${result.cheeseDensity} g / 100 cm²`, `Suggested start: ${result.recommendedCheeseRange[0]}–${result.recommendedCheeseRange[1]} g.`],
                  ["Moisture risk", result.moistureLevel, "Affected by fresh cheese drainage and extra toppings."],
                ].map(([label, value, note]) => (
                  <div key={label} className="rounded-[1.35rem] border border-ink/10 bg-white p-4 shadow-soft">
                    <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink/42">{label}</p>
                    <strong className="mt-2 block text-xl capitalize">{value}</strong>
                    <p className="mt-2 text-xs leading-5 text-ink/52">{note}</p>
                  </div>
                ))}
              </section>
              <ReferenceComparison activeLevel={result.combinedLevel} />
              <section className="rounded-[1.75rem] border border-leaf/20 bg-leaf/10 p-5" aria-labelledby="recommendation-title">
                <h3 id="recommendation-title" className="font-display text-2xl font-semibold">What to adjust next</h3>
                <p className="mt-3 text-sm leading-7 text-ink/68">{result.recommendedAdjustment}</p>
              </section>
            </div>

            <aside className="space-y-4 lg:order-1 lg:sticky lg:top-24" data-topping-controls>
              <section className="rounded-[1.75rem] border border-ink/10 bg-white/82 p-4 shadow-card sm:p-5" aria-labelledby="preset-title">
                <h3 id="preset-title" className="font-display text-2xl font-semibold">Build and compare presets</h3>
                <div className="mt-4 grid gap-2">
                  {presetCards.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPreset(preset.id)}
                      className="rounded-2xl border border-ink/10 bg-white p-3 text-left transition hover:border-tomato/30 hover:bg-tomato/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                    >
                      <span className="text-sm font-extrabold">{preset.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-ink/55">{preset.description}</span>
                    </button>
                  ))}
                </div>
                <button type="button" onClick={resetToBalanced} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  Reset to balanced
                </button>
              </section>

              <section className="rounded-[1.75rem] border border-ink/10 bg-white/82 p-4 shadow-card sm:p-5" aria-labelledby="geometry-title">
                <h3 id="geometry-title" className="font-display text-2xl font-semibold">Pizza dimensions</h3>
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-flour p-1">
                  {(["round", "rectangle"] as const).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      aria-pressed={state.geometry.shape === shape}
                      onClick={() => setGeometry(shape === "round"
                        ? { shape, diameter: state.geometry.shape === "round" ? state.geometry.diameter : 32, rim: state.geometry.rim }
                        : { shape, width: state.geometry.shape === "rectangle" ? state.geometry.width : 20, length: state.geometry.shape === "rectangle" ? state.geometry.length : 25, rim: state.geometry.rim })}
                      className={`rounded-xl px-3 py-2.5 text-xs font-extrabold ${state.geometry.shape === shape ? "bg-ink text-white" : "text-ink/52"}`}
                    >
                      {shape === "round" ? "Round" : "Rectangular"}
                    </button>
                  ))}
                </div>
                <GeometryControls geometry={state.geometry} onChange={setGeometry} />
              </section>

              <section className="rounded-[1.75rem] border border-ink/10 bg-white/82 p-4 shadow-card sm:p-5" aria-labelledby="sauce-cheese-title">
                <h3 id="sauce-cheese-title" className="font-display text-2xl font-semibold">Sauce and cheese</h3>
                <div className="mt-4 grid gap-3">
                  <NumberControl label="Sauce" value={state.sauceGrams} min={0} max={220} unit="g" onChange={(sauceGrams) => updateState((current) => ({ ...current, sauceGrams }))} />
                  <NumberControl label="Cheese" value={state.cheeseType === "none" ? 0 : state.cheeseGrams} min={0} max={260} unit="g" onChange={(cheeseGrams) => updateState((current) => ({ ...current, cheeseGrams }))} />
                </div>
                <label className="mt-4 block text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">
                  Cheese type
                  <select
                    value={state.cheeseType}
                    onChange={(event) => updateState((current) => ({ ...current, cheeseType: event.target.value as CheeseType }))}
                    className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20"
                  >
                    {cheeseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {(state.cheeseType === "fior-di-latte" || state.cheeseType === "buffalo") && (
                  <div className="mt-4">
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">Mozzarella drainage</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {drainOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={state.drainState === option.value}
                          onClick={() => updateState((current) => ({ ...current, drainState: option.value }))}
                          className={`rounded-full px-3 py-2 text-[11px] font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${state.drainState === option.value ? "bg-leaf text-white" : "bg-flour text-ink/58"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <label className="mt-4 block text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">
                  Additional topping load
                  <select
                    value={state.toppingLoad}
                    onChange={(event) => updateState((current) => ({ ...current, toppingLoad: event.target.value as ToppingLoadTeachingLevel }), "push")}
                    className="mt-2 h-12 w-full rounded-2xl border border-ink/10 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-tomato focus:ring-2 focus:ring-tomato/20"
                  >
                    {toppingLoadOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </section>
            </aside>
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7" aria-labelledby="area-title">
          <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Topped area</p>
              <h2 id="area-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">The rim is not part of the topping area.</h2>
              <p className="mt-4 text-sm leading-7 text-ink/62">
                A 32 cm pizza is not topped edge to edge. DoughTools calculates the usable topped radius by subtracting
                the clear rim, then compares sauce and cheese per 100 cm². The density is a practical clue, not a promise.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-flour p-5">
              <dl className="grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">Full pizza area</dt>
                  <dd className="mt-2 text-2xl font-extrabold">{result.fullArea} cm²</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">Usable topping area</dt>
                  <dd className="mt-2 text-2xl font-extrabold">{result.usableArea} cm²</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/45">Total pre-bake load</dt>
                  <dd className="mt-2 text-2xl font-extrabold">{result.totalPreBakeGrams} g</dd>
                </div>
              </dl>
              <details className="mt-5 rounded-2xl bg-white p-4">
                <summary className="cursor-pointer text-sm font-extrabold marker:text-tomato">How this is calculated</summary>
                <p className="mt-3 text-sm leading-6 text-ink/62">
                  Round pizza usable radius = pizza radius minus rim width. Usable topped area = π × usable radius².
                  Rectangular pizzas subtract the clear rim from width and length. Sauce, cheese and teaching topping
                  load are then normalized per 100 cm².
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <article key={lesson.id} id={lesson.id} className="scroll-mt-24 rounded-[1.75rem] border border-ink/10 bg-white p-5 shadow-card">
              <DoughToolsIcon name={lesson.icon} size={32} className="text-tomato" />
              <p className="mt-4 text-xs font-extrabold uppercase tracking-[.18em] text-ink/42">{lesson.eyebrow}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">{lesson.title}</h2>
              <div className="mt-5 grid gap-3">
                {lesson.states.map(([title, text]) => (
                  <div key={title} className="rounded-2xl bg-flour p-4">
                    <h3 className="text-sm font-extrabold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/62">{text}</p>
                  </div>
                ))}
              </div>
              {lesson.link && (
                <Link href={lesson.link.href} className="mt-5 inline-flex text-sm font-extrabold text-tomato underline-offset-4 hover:underline">
                  {lesson.link.label} →
                </Link>
              )}
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-[2rem] bg-forest-dark p-5 text-white shadow-raised sm:p-7 lg:grid lg:grid-cols-[.8fr_1.2fr] lg:gap-8" aria-labelledby="combined-load-title">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">Combined load</p>
            <h2 id="combined-load-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Sauce and cheese cannot be judged alone.</h2>
            <p className="mt-4 text-sm leading-7 text-white/68">
              Balanced sauce plus excessive cheese can still overload a pizza. Balanced grams plus wet mozzarella can
              behave like too much. Extra vegetables, cured meat and cheese all add weight, water, fat or salt.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-0">
            {[
              ["Sauce load", `${state.sauceGrams} g`, "Coverage and tomato moisture."],
              ["Cheese load", `${state.cheeseType === "none" ? 0 : state.cheeseGrams} g`, "Melt, water and browning."],
              ["Additional topping load", `${result.extraToppingGrams} g`, "Weight and ingredient moisture."],
              ["Ingredient moisture", result.moistureLevel, "Drainage and preparation."],
            ].map(([label, value, text]) => (
              <div key={label} className="rounded-[1.25rem] border border-white/12 bg-white/8 p-4">
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-white/42">{label}</p>
                <strong className="mt-2 block text-xl capitalize">{value}</strong>
                <p className="mt-2 text-xs leading-5 text-white/58">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[.78fr_1.22fr]" aria-labelledby="oven-interaction-title">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Oven interaction</p>
            <h2 id="oven-interaction-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">The oven changes how forgiving the topping load feels.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-soft">
              <h3 className="text-base font-extrabold">High-heat short bake</h3>
              <p className="mt-3 text-sm leading-6 text-ink/62">There is less time for moisture to evaporate. Restrained topping volume and managed fresh mozzarella matter.</p>
            </article>
            <article className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-soft">
              <h3 className="text-base font-extrabold">Home-oven longer bake</h3>
              <p className="mt-3 text-sm leading-6 text-ink/62">There is more time, but prolonged moisture can soften the center while cheese overbrowns before the base is ready.</p>
            </article>
          </div>
        </section>

        <div className="mt-12">
          <ToppingReferenceGallery state={state} result={result} />
        </div>

        <section className="mt-12 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-card sm:p-7" aria-labelledby="mistakes-title">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Common mistakes</p>
          <h2 id="mistakes-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">What overloaded pizza looks like before it fails.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {commonMistakes.map(([title, body]) => (
              <article key={title} className="rounded-[1.25rem] bg-flour p-4">
                <h3 className="text-sm font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/62">{body}</p>
              </article>
            ))}
          </div>
          <Link href="/guide/pizza-troubleshooting#toppings" className="mt-6 inline-flex text-sm font-extrabold text-tomato underline-offset-4 hover:underline">
            Troubleshoot toppings that slide, flood or bake unevenly →
          </Link>
        </section>

        <section className="mt-12 rounded-[2rem] bg-tomato p-6 text-white shadow-card sm:p-8 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8" aria-labelledby="final-cta-title">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-white/70">Use what you learned</p>
            <h2 id="final-cta-title" className="mt-3 font-display text-3xl font-semibold sm:text-5xl">
              Ready to use this balance in your next pizza?
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/74">Use what you learned when you build your next plan.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Link href="/session/start" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-extrabold text-tomato shadow-soft transition hover:-translate-y-0.5 hover:bg-flour focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Plan a pizza
            </Link>
            <Link href="/guide" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Return to Pizza guides
            </Link>
          </div>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
