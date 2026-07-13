"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import AppSignature from "@/components/AppSignature";
import EditableNumberInput from "@/components/EditableNumberInput";
import { buttonClass, cardClass, cx, statusPillClass } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import { getCostComparisonSummary, type CostComparisonState } from "@/lib/cost-comparison";
import { calculatePizzaCost, type CostInputs, type CostLine } from "@/lib/cost-calculator";
import { settingsFromUrl } from "@/lib/recipe-url";

type Currency = "EUR" | "USD";

const initial: CostInputs = {
  pizzas: 6,
  diners: 6,
  ballWeight: 260,
  hydration: 64,
  salt: 2.8,
  flourPrice: 2.8,
  sauceGrams: 80,
  saucePrice: 3.5,
  cheeseGrams: 90,
  cheesePrice: 11,
  toppingGrams: 60,
  toppingPrice: 12,
  extrasPerPizza: 0.2,
  energy: 1.5,
  packagingPerPizza: 0,
  waste: 5,
  sellingPrice: 0,
};

const lineNames: Record<string, string> = {
  cheese: "Cheese",
  doughExtras: "Water, salt and yeast",
  energy: "Oven energy",
  extras: "Oil, basil and seasoning",
  flour: "Flour",
  packaging: "Box or packaging",
  sauce: "Tomato sauce",
  toppings: "Other toppings",
};

const lineIcons: Record<string, DoughToolsIconName> = {
  cheese: "pizza",
  doughExtras: "water",
  energy: "flame",
  extras: "chef-hat",
  flour: "wheat",
  packaging: "archive",
  sauce: "mixing-bowl",
  toppings: "pizza",
};

const currencyCopy = {
  EUR: { label: "Euro (€)", locale: "en-IE", symbol: "€" },
  USD: { label: "US dollar ($)", locale: "en-US", symbol: "$" },
} as const;

function money(value: number, currency: Currency) {
  return new Intl.NumberFormat(currencyCopy[currency].locale, {
    currency,
    style: "currency",
  }).format(value);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-IE", { maximumFractionDigits: digits }).format(value);
}

function safePercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.max(8, value));
}

function resultCopy(state: CostComparisonState, difference: string) {
  if (state === "missing-restaurant") {
    return {
      badge: "Add a restaurant price",
      body: "Your home cost is ready. Add a restaurant price per pizza to see the comparison.",
      title: "Your home pizza night is priced.",
    };
  }

  if (state === "home-cheaper") {
    return {
      badge: "Made-at-home advantage",
      body: "That is a lot of flour, tomatoes, and future pizza nights — at least with these assumptions.",
      title: `Your home pizza night costs ${difference} less.`,
    };
  }

  if (state === "restaurant-cheaper") {
    return {
      badge: "Restaurant wins this round",
      body: "That can happen too. Adjust the assumptions or enjoy the night off without guilt.",
      title: `The restaurant option is ${difference} less.`,
    };
  }

  return {
    badge: "Almost a tie",
    body: "Choose based on the evening you want — cooking experience or restaurant convenience.",
    title: "These pizza nights cost almost the same.",
  };
}

type NumericControlProps = {
  helper?: ReactNode;
  id: string;
  label: string;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: number;
};

function NumericControl({
  helper,
  id,
  label,
  min = 0,
  onChange,
  step = 1,
  suffix,
  value,
}: NumericControlProps) {
  const update = (next: number) => {
    const rounded = Math.round(next * 100) / 100;
    onChange(Math.max(min, rounded));
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-extrabold text-ink/70">
        {label}
      </label>
      <div className="mt-2 flex min-w-0 items-stretch rounded-2xl border border-ink/10 bg-white shadow-sm focus-within:border-tomato/45 focus-within:ring-2 focus-within:ring-tomato/15">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="grid min-h-12 w-12 shrink-0 place-items-center rounded-l-2xl text-ink/55 transition hover:bg-flour focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          onClick={() => update(value - step)}
        >
          <DoughToolsIcon name="remove" size={20} />
        </button>
        <div className="relative min-w-0 flex-1">
          <EditableNumberInput
            id={id}
            aria-label={label}
            min={min}
            value={value}
            onValueChange={update}
            className="h-12 w-full min-w-0 bg-transparent px-3 pr-14 text-center text-base font-extrabold text-ink outline-none"
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-ink/35">
              {suffix}
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="grid min-h-12 w-12 shrink-0 place-items-center rounded-r-2xl text-ink/55 transition hover:bg-flour focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          onClick={() => update(value + step)}
        >
          <DoughToolsIcon name="add" size={20} />
        </button>
      </div>
      {helper && <p className="mt-2 text-xs font-bold leading-5 text-ink/45">{helper}</p>}
    </div>
  );
}

function PanelHeading({
  accent,
  icon,
  label,
  title,
}: {
  accent: "home" | "restaurant";
  icon: DoughToolsIconName;
  label: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cx(
          "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1",
          accent === "home"
            ? "bg-leaf/10 text-leaf ring-leaf/20"
            : "bg-tomato/10 text-tomato ring-tomato/20",
        )}
        aria-hidden="true"
      >
        <DoughToolsIcon name={icon} size={24} />
      </span>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/40">{label}</p>
        <h2 className="mt-1 font-display text-3xl font-semibold leading-tight text-ink">{title}</h2>
      </div>
    </div>
  );
}

function BreakdownLine({
  currency,
  line,
}: {
  currency: Currency;
  line: CostLine;
}) {
  return (
    <li className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-white/70 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-flour text-ink/55" aria-hidden="true">
        <DoughToolsIcon name={lineIcons[line.id] ?? "check"} size={20} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-ink/70">{lineNames[line.id] ?? line.id}</span>
        <span className="block text-xs font-bold text-ink/40">
          {formatNumber(line.amount)} {line.unit}
        </span>
      </span>
      <strong className="break-words text-right text-sm text-ink">{money(line.cost, currency)}</strong>
    </li>
  );
}

function ComparisonVisual({
  currency,
  homeTotal,
  restaurantTotal,
}: {
  currency: Currency;
  homeTotal: number;
  restaurantTotal: number;
}) {
  const max = Math.max(homeTotal, restaurantTotal, 1);
  const homeWidth = safePercent((homeTotal / max) * 100);
  const restaurantWidth = restaurantTotal > 0 ? safePercent((restaurantTotal / max) * 100) : 8;

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[.08] p-4" aria-label="Home and restaurant total comparison">
      <div className="grid gap-4">
        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-extrabold text-white/65">
            <span>Made at home</span>
            <span>{money(homeTotal, currency)}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-leaf" style={{ width: `${homeWidth}%` }} aria-hidden="true" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-extrabold text-white/65">
            <span>Restaurant order</span>
            <span>{money(restaurantTotal, currency)}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-tomato" style={{ width: `${restaurantWidth}%` }} aria-hidden="true" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-white/45">
        The bars are only a visual hint. The exact totals above are the source of truth.
      </p>
    </div>
  );
}

export default function PizzaCostsPlayfulClient() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [ready, setReady] = useState(false);
  const [values, setValues] = useState<CostInputs>(initial);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedCurrency = localStorage.getItem("doughtools-currency") as Currency | null;
    const shared = settingsFromUrl(location.search);
    const params = new URLSearchParams(location.search);
    const amount = (key: string, fallback: number) => {
      const value = Number(params.get(key));
      return Number.isFinite(value) && value >= 0 ? value : fallback;
    };

    setCurrency(storedCurrency === "EUR" || storedCurrency === "USD" ? storedCurrency : "EUR");
    setValues((current) => ({
      ...current,
      ballWeight: shared.ballWeight ?? current.ballWeight,
      cheeseGrams: amount("cheeseGrams", current.cheeseGrams),
      diners: shared.pizzas ?? current.diners,
      hydration: shared.hydration ?? current.hydration,
      pizzas: shared.pizzas ?? current.pizzas,
      salt: shared.salt ?? current.salt,
      sauceGrams: amount("sauceGrams", current.sauceGrams),
      toppingGrams: amount("toppingGrams", current.toppingGrams),
    }));
    document.documentElement.lang = "en";
    setReady(true);
  }, []);

  const result = useMemo(() => calculatePizzaCost(values), [values]);
  const comparison = useMemo(
    () => getCostComparisonSummary({ homeTotal: result.total, restaurantTotal: result.revenue }),
    [result.revenue, result.total],
  );

  if (!ready) return <main className="min-h-screen bg-cream" />;

  const currencySymbol = currencyCopy[currency].symbol;
  const perKg = `${currencySymbol}/kg`;
  const perPizza = `${currencySymbol}/pizza`;
  const formatMoney = (value: number) => money(value, currency);
  const differenceText = formatMoney(comparison.absoluteDifference);
  const copy = resultCopy(comparison.state, differenceText);

  const changeCurrency = (next: Currency) => {
    setCurrency(next);
    localStorage.setItem("doughtools-currency", next);
  };

  const updateValue = (key: keyof CostInputs) => (value: number) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const focusInputs = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    inputRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-cream px-4 py-5 text-ink sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex min-h-12 w-fit items-center gap-3 rounded-2xl pr-3 text-sm font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato text-white" aria-hidden="true">
              <DoughToolsIcon name="pizza" size={24} />
            </span>
            <span>Dough<span className="text-tomato">Tools</span></span>
          </Link>
          <nav aria-label="Costs page links" className="flex flex-wrap gap-2">
            <Link href="/toppings" className={buttonClass({ className: "min-h-10 px-3 text-xs", variant: "secondary" })}>
              Topping Balance Lab
            </Link>
            <Link href="/guide" className={buttonClass({ className: "min-h-10 px-3 text-xs", variant: "secondary" })}>
              Learning Center
            </Link>
          </nav>
        </header>

        <section className="grid gap-5 py-7 sm:py-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Pizza Night Economics</p>
              <span className={statusPillClass({ className: "bg-white px-3 py-1.5", variant: "warning" })}>Just for fun</span>
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-none sm:text-6xl">
              What does pizza night really cost?
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">
              Compare the ingredient cost of your homemade pizzas with an equivalent restaurant order. Adjust the numbers and see what changes.
            </p>
            <p className="mt-3 max-w-2xl text-xs font-bold leading-5 text-ink/45">
              This is a simple estimate for fun — real prices vary by ingredients, restaurant, location, and delivery fees.
            </p>
            <button type="button" onClick={focusInputs} className={buttonClass({ className: "mt-5 w-full sm:w-auto" })}>
              Calculate pizza night
            </button>
          </div>

          <div className="rounded-[1.35rem] border border-ink/10 bg-white/80 p-3 shadow-sm">
            <p className="px-2 text-xs font-extrabold uppercase tracking-[.16em] text-ink/45">Currency</p>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-ink/[.05] p-1">
              {(["EUR", "USD"] as Currency[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeCurrency(option)}
                  aria-pressed={currency === option}
                  className={cx(
                    "min-h-10 rounded-lg px-4 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato",
                    currency === option ? "bg-ink text-white shadow-sm" : "text-ink/50 hover:bg-white/70",
                  )}
                >
                  {currencyCopy[option].label}
                </button>
              ))}
            </div>
            <p className="mt-2 px-2 text-[11px] font-bold leading-4 text-ink/40">
              Enter prices in the selected currency. No exchange rate is applied.
            </p>
          </div>
        </section>

        <section id="pizza-night-inputs" ref={inputRef} aria-labelledby="comparison-workspace-heading" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,.8fr)] lg:items-start">
          <h2 id="comparison-workspace-heading" className="sr-only">Pizza night cost comparison workspace</h2>
          <div className="grid min-w-0 gap-5">
            <section className={cardClass({ className: "p-4 sm:p-5", variant: "guidance" })}>
              <PanelHeading accent="home" icon="pizza" label="First question" title="How many pizzas?" />
              <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <NumericControl
                  id="cost-pizzas"
                  label="How many pizzas?"
                  min={0}
                  value={values.pizzas}
                  onChange={updateValue("pizzas")}
                  helper={`Pizza night for ${formatNumber(values.pizzas)} pizzas.`}
                />
                <NumericControl
                  id="cost-diners"
                  label="Diners"
                  min={0}
                  value={values.diners}
                  onChange={updateValue("diners")}
                  helper="Used only for the per-diner estimate."
                />
              </div>
            </section>

            <section className={cardClass({ className: "p-4 sm:p-5", variant: "default" })}>
              <PanelHeading accent="home" icon="wheat" label="Made at home" title="Ingredient assumptions" />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <NumericControl id="cost-ball-weight" label="Dough-ball weight" suffix="g" value={values.ballWeight} onChange={updateValue("ballWeight")} step={10} />
                <NumericControl id="cost-hydration" label="Hydration" suffix="%" value={values.hydration} onChange={updateValue("hydration")} step={1} />
                <NumericControl id="cost-salt" label="Salt" suffix="%" value={values.salt} onChange={updateValue("salt")} step={0.1} />
                <NumericControl id="cost-flour-price" label="Flour price" suffix={perKg} value={values.flourPrice} onChange={updateValue("flourPrice")} step={0.25} />
              </div>

              <div className="mt-5 grid gap-4">
                {([
                  ["sauceGrams", "saucePrice", "Tomato sauce"],
                  ["cheeseGrams", "cheesePrice", "Cheese"],
                  ["toppingGrams", "toppingPrice", "Other toppings"],
                ] as const).map(([grams, price, label]) => (
                  <div key={grams} className="grid gap-3 rounded-[1.25rem] border border-ink/10 bg-cream/60 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <NumericControl id={`cost-${grams}`} label={`${label} amount`} suffix="g/pizza" value={values[grams]} onChange={updateValue(grams)} step={5} />
                    <NumericControl id={`cost-${price}`} label={`${label} price`} suffix={perKg} value={values[price]} onChange={updateValue(price)} step={0.5} />
                  </div>
                ))}
              </div>

              <details className="mt-5 rounded-[1.25rem] border border-ink/10 bg-white/75 p-4">
                <summary className="cursor-pointer text-sm font-extrabold text-ink/70">What is included?</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <NumericControl id="cost-extras" label="Oil, basil and seasoning" suffix={perPizza} value={values.extrasPerPizza} onChange={updateValue("extrasPerPizza")} step={0.1} />
                  <NumericControl id="cost-energy" label="Oven energy / session" suffix={currencySymbol} value={values.energy} onChange={updateValue("energy")} step={0.25} />
                  <NumericControl id="cost-packaging" label="Box or packaging" suffix={perPizza} value={values.packagingPerPizza} onChange={updateValue("packagingPerPizza")} step={0.1} />
                  <NumericControl id="cost-waste" label="Waste" suffix="%" value={values.waste} onChange={updateValue("waste")} step={1} />
                </div>
                <p className="mt-4 text-xs font-bold leading-5 text-ink/45">
                  The dough calculation uses pizza count, ball weight, hydration and salt exactly as the existing cost calculator did. Water, salt and yeast are kept as the same small dough-extras estimate.
                </p>
              </details>
            </section>

            <section className={cardClass({ className: "p-4 sm:p-5", variant: "information" })}>
              <PanelHeading accent="restaurant" icon="shopping-basket" label="Restaurant order" title="Equivalent pizza order" />
              <div className="mt-5">
                <NumericControl
                  id="cost-restaurant-price"
                  label="Restaurant price per pizza"
                  suffix={perPizza}
                  value={values.sellingPrice}
                  onChange={updateValue("sellingPrice")}
                  step={0.5}
                  helper="Use the price of the pizza you would otherwise buy. Delivery or service fees are not added unless you include them in this price."
                />
              </div>
            </section>
          </div>

          <aside className="grid min-w-0 gap-5 lg:sticky lg:top-5">
            <section className="overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-card" aria-labelledby="cost-result-heading">
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={statusPillClass({ className: "bg-white/10 text-oven-gold ring-white/10", variant: "warning" })}>{copy.badge}</span>
                  <span className="text-xs font-extrabold uppercase tracking-[.18em] text-white/35">Home vs restaurant</span>
                </div>
                <h2 id="cost-result-heading" className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                  {copy.title}
                </h2>
                <p className="mt-3 text-sm font-bold leading-6 text-white/55">{copy.body}</p>

                <dl className="mt-6 grid gap-3">
                  <div className="rounded-[1.25rem] bg-white/[.08] p-4">
                    <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-white/40">Made at home total</dt>
                    <dd className="mt-1 break-words font-display text-4xl font-semibold">{formatMoney(result.total)}</dd>
                  </div>
                  <div className="rounded-[1.25rem] bg-white/[.08] p-4">
                    <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-white/40">Restaurant order total</dt>
                    <dd className="mt-1 break-words font-display text-4xl font-semibold">{formatMoney(result.revenue)}</dd>
                  </div>
                </dl>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] bg-white/[.08] p-4">
                    <p className="break-words text-xl font-extrabold">{formatMoney(result.perPizza)}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[.14em] text-white/35">Home per pizza</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-white/[.08] p-4">
                    <p className="break-words text-xl font-extrabold">{formatMoney(values.sellingPrice)}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[.14em] text-white/35">Restaurant per pizza</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[.04] p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[.16em] text-white/35">Difference</p>
                  <p className="mt-1 break-words text-2xl font-extrabold">{differenceText}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-white/45">
                    Difference is calculated from the home total and restaurant order total.
                  </p>
                </div>
              </div>
              <div className="border-t border-white/10 p-5 sm:p-6">
                <ComparisonVisual currency={currency} homeTotal={result.total} restaurantTotal={result.revenue} />
              </div>
            </section>

            <section className={cardClass({ className: "p-4 sm:p-5", variant: "default" })}>
              <h2 className="font-display text-2xl font-semibold">Home cost breakdown</h2>
              <ul className="mt-4 grid gap-2">
                {result.lines.map((line) => (
                  <BreakdownLine key={line.id} line={line} currency={currency} />
                ))}
                <li className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-tomato/[.06] p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-tomato" aria-hidden="true">
                    <DoughToolsIcon name="warning" size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-extrabold text-ink/70">Waste ({values.waste}%)</span>
                    <span className="block text-xs font-bold text-ink/40">Applied to the home subtotal</span>
                  </span>
                  <strong className="break-words text-right text-sm text-ink">{formatMoney(result.wasteCost)}</strong>
                </li>
              </ul>
            </section>
          </aside>
        </section>

        <section className="mx-auto mt-6 grid max-w-6xl gap-4 md:grid-cols-2">
          <article className={cardClass({ className: "p-5 sm:p-6", variant: "warning" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">The useful bit</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">What the difference means</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-ink/60">
              This estimate counts ingredients and the restaurant price you enter. Restaurant pizza also includes labor, premises, equipment, service and convenience. Homemade pizza includes time, learning and the fun of making it.
            </p>
          </article>
          <article className={cardClass({ className: "p-5 sm:p-6", variant: "success" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-leaf">Pizza night bonus</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">The real bonus is the pizza night.</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-ink/60">
              The calculator cannot price the smell from the oven, the first successful launch, or the satisfaction of serving a pizza you made yourself.
            </p>
          </article>
        </section>

        <section className="mx-auto mt-6 grid max-w-6xl gap-4 lg:grid-cols-[1fr_.85fr]">
          <article className="rounded-[1.75rem] bg-tomato p-5 text-white shadow-card sm:p-7">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-white/70">Next step</p>
            <h2 className="mt-2 font-display text-4xl font-semibold leading-none">Ready to turn the estimate into pizza?</h2>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-white/75">
              The cost estimate stays here. Your Pizza Session builds the recipe and timeline.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/session/start" className={buttonClass({ className: "bg-white text-tomato hover:bg-flour" })}>
                Plan my next pizza
              </Link>
              <button type="button" onClick={focusInputs} className={buttonClass({ className: "border-white/30 bg-white/10 text-white hover:border-white/60 hover:text-white", variant: "secondary" })}>
                Try another comparison
              </button>
            </div>
          </article>
          <article className={cardClass({ className: "p-5 sm:p-6", variant: "guidance" })}>
            <h2 className="font-display text-2xl font-semibold">Related learning</h2>
            <div className="mt-4 grid gap-2">
              {[
                ["Topping Balance Lab", "/toppings"],
                ["Pizza Sauce Guide", "/sauce"],
                ["Pizza Learning Center", "/guide"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/75 px-4 py-3 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato">
                  <span>{label}</span>
                  <DoughToolsIcon name="forward" size={20} />
                </Link>
              ))}
            </div>
          </article>
        </section>

        <footer className="mt-8 border-t border-ink/10 py-6">
          <AppSignature />
        </footer>
      </div>
    </main>
  );
}
