"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import SiteFooter from "@/components/SiteFooter";
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
  sellingPrice: 12,
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

const lineGroups: Record<string, "Dough" | "Sauce and toppings" | "Kitchen extras"> = {
  cheese: "Sauce and toppings",
  doughExtras: "Dough",
  energy: "Kitchen extras",
  extras: "Kitchen extras",
  flour: "Dough",
  packaging: "Kitchen extras",
  sauce: "Sauce and toppings",
  toppings: "Sauce and toppings",
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
    maximumFractionDigits: 2,
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
      badge: "Add a takeaway price",
      body: "Your homemade estimate is ready. Add a takeaway price per pizza to compare both nights.",
      title: "Your homemade pizza night has a number.",
    };
  }

  if (state === "home-cheaper") {
    return {
      badge: "Homemade advantage",
      body: "That is an approximate difference based on your assumptions, not a promise.",
      title: `You keep about ${difference}.`,
    };
  }

  if (state === "restaurant-cheaper") {
    return {
      badge: "Takeaway wins this round",
      body: "That can happen too. Convenience, delivery and time are part of the decision.",
      title: `Takeaway is about ${difference} less.`,
    };
  }

  return {
    badge: "Almost a tie",
    body: "The money is close enough that the better answer is probably the evening you want.",
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
          {lineGroups[line.id] ?? "Estimate"} · {formatNumber(line.amount)} {line.unit}
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
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[.08] p-4" aria-label="Homemade and takeaway total comparison">
      <div className="grid gap-4">
        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-extrabold text-white/65">
            <span>Homemade</span>
            <span>{money(homeTotal, currency)}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-leaf" style={{ width: `${homeWidth}%` }} aria-hidden="true" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3 text-xs font-extrabold text-white/65">
            <span>Takeaway</span>
            <span>{money(restaurantTotal, currency)}</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-tomato" style={{ width: `${restaurantWidth}%` }} aria-hidden="true" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-white/45">
        The bars are only a visual hint. The totals above are the accessible comparison.
      </p>
    </div>
  );
}

function groupCost(lines: CostLine[], group: "Dough" | "Sauce and toppings" | "Kitchen extras") {
  return lines
    .filter((line) => lineGroups[line.id] === group)
    .reduce((total, line) => total + line.cost, 0);
}

export default function PizzaCostsPlayfulClient() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [ready, setReady] = useState(false);
  const [values, setValues] = useState<CostInputs>(initial);

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
  const doughCost = groupCost(result.lines, "Dough");
  const toppingCost = groupCost(result.lines, "Sauce and toppings");
  const kitchenCost = groupCost(result.lines, "Kitchen extras") + result.wasteCost;
  const homemadePizzaEquivalent = values.sellingPrice > 0
    ? Math.max(0, Math.floor(values.sellingPrice / Math.max(result.perPizza, 0.01)))
    : 0;

  const changeCurrency = (next: Currency) => {
    setCurrency(next);
    localStorage.setItem("doughtools-currency", next);
  };

  const updateValue = (key: keyof CostInputs) => (value: number) => {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "pizzas" ? { diners: value } : null),
    }));
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
        </header>

        <section className="py-7 sm:py-9">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Pizza cost insight</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-none sm:text-6xl">
            What does your pizza night cost?
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">
            Compare homemade pizza with takeaway and see where the money goes.
          </p>
        </section>

        <section aria-labelledby="cost-comparison-heading" className="grid gap-5 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1fr)] lg:items-start">
          <div className={cardClass({ className: "p-4 sm:p-5", variant: "guidance" })}>
            <h2 id="cost-comparison-heading" className="font-display text-3xl font-semibold">Estimate my pizza cost</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-ink/55">
              Start with three numbers. Everything else is tucked into assumptions.
            </p>

            <div className="mt-5 grid gap-4">
              <NumericControl
                id="cost-pizzas"
                label="Number of pizzas"
                min={1}
                value={values.pizzas}
                onChange={updateValue("pizzas")}
                helper={`The comparison uses ${formatNumber(values.pizzas)} pizza${values.pizzas === 1 ? "" : "s"}.`}
              />
              <NumericControl
                id="cost-home-per-pizza"
                label="Homemade estimate per pizza"
                min={0}
                suffix={perPizza}
                value={Math.round(result.perPizza * 100) / 100}
                onChange={(value) => {
                  const safePizzas = Math.max(1, values.pizzas);
                  const currentVariableTotal = result.total - values.energy - values.packagingPerPizza * safePizzas;
                  const targetVariableTotal = Math.max(0, value * safePizzas - values.energy - values.packagingPerPizza * safePizzas);
                  const ratio = currentVariableTotal > 0 ? targetVariableTotal / currentVariableTotal : 1;
                  setValues((current) => ({
                    ...current,
                    cheesePrice: Math.max(0, Math.round(current.cheesePrice * ratio * 100) / 100),
                    flourPrice: Math.max(0, Math.round(current.flourPrice * ratio * 100) / 100),
                    saucePrice: Math.max(0, Math.round(current.saucePrice * ratio * 100) / 100),
                    toppingPrice: Math.max(0, Math.round(current.toppingPrice * ratio * 100) / 100),
                  }));
                }}
                step={0.25}
                helper="This adjusts the ingredient price assumptions together, keeping the existing cost formula."
              />
              <NumericControl
                id="cost-takeaway-price"
                label="Takeaway price per pizza"
                min={0}
                suffix={perPizza}
                value={values.sellingPrice}
                onChange={updateValue("sellingPrice")}
                step={0.5}
                helper="Use the pizza price you would otherwise order. Add delivery into this number if you want."
              />

              <div>
                <p className="text-sm font-extrabold text-ink/70">Currency</p>
                <div className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-ink/[.05] p-1">
                  {(["EUR", "USD"] as Currency[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => changeCurrency(option)}
                      aria-pressed={currency === option}
                      className={cx(
                        "min-h-11 rounded-xl px-4 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato",
                        currency === option ? "bg-ink text-white shadow-sm" : "text-ink/50 hover:bg-white/70",
                      )}
                    >
                      {currencyCopy[option].label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-bold leading-5 text-ink/45">
                  Enter prices in the selected currency. No exchange rate is applied.
                </p>
              </div>
            </div>
          </div>

          <section className="overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-card" aria-labelledby="cost-result-heading" aria-live="polite">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={statusPillClass({ className: "bg-white/10 text-oven-gold ring-white/10", variant: "warning" })}>{copy.badge}</span>
                <span className="text-xs font-extrabold uppercase tracking-[.18em] text-white/35">Estimated comparison</span>
              </div>
              <h2 id="cost-result-heading" className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {copy.title}
              </h2>
              <p className="mt-3 text-sm font-bold leading-6 text-white/55">{copy.body}</p>

              <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.25rem] bg-white/[.08] p-4">
                  <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-white/40">Homemade total</dt>
                  <dd className="mt-1 break-words font-display text-3xl font-semibold">{formatMoney(result.total)}</dd>
                </div>
                <div className="rounded-[1.25rem] bg-white/[.08] p-4">
                  <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-white/40">Homemade / pizza</dt>
                  <dd className="mt-1 break-words font-display text-3xl font-semibold">{formatMoney(result.perPizza)}</dd>
                </div>
                <div className="rounded-[1.25rem] bg-white/[.08] p-4">
                  <dt className="text-xs font-extrabold uppercase tracking-[.16em] text-white/40">Takeaway total</dt>
                  <dd className="mt-1 break-words font-display text-3xl font-semibold">{formatMoney(result.revenue)}</dd>
                </div>
              </dl>

              <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[.04] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[.16em] text-white/35">Difference</p>
                <p className="mt-1 break-words text-2xl font-extrabold">{differenceText}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-white/45">
                  Difference is calculated from the home total and takeaway order total.
                </p>
              </div>

              <p className="mt-4 text-xs font-bold leading-5 text-white/45">
                These are practical estimates. Your ingredients, energy prices and local restaurant prices may differ.
              </p>
            </div>
            <div className="border-t border-white/10 p-5 sm:p-6">
              <ComparisonVisual currency={currency} homeTotal={result.total} restaurantTotal={result.revenue} />
            </div>
          </section>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1fr)]">
          <article className={cardClass({ className: "p-5 sm:p-6", variant: "warning" })}>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">Playful insight</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              One takeaway pizza buys about {homemadePizzaEquivalent || "?"} homemade pizza{homemadePizzaEquivalent === 1 ? "" : "s"}.
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-ink/60">
              This is the quick gut-check: cost per pizza usually falls as the oven is already hot and the ingredients stretch across the whole pizza night.
            </p>
          </article>

          <section className={cardClass({ className: "p-5 sm:p-6", variant: "default" })} aria-labelledby="cost-breakdown-heading">
            <h2 id="cost-breakdown-heading" className="font-display text-3xl font-semibold">Where the homemade cost goes</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {([
                ["Dough", doughCost],
                ["Sauce and toppings", toppingCost],
                ["Kitchen extras", kitchenCost],
              ] as const).map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-cream/70 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/40">{label}</p>
                  <p className="mt-1 break-words text-xl font-extrabold text-ink">{formatMoney(value)}</p>
                </div>
              ))}
            </div>
            <details className="mt-4 rounded-[1.25rem] border border-ink/10 bg-white/75 p-4">
              <summary className="cursor-pointer text-sm font-extrabold text-ink/70">How these estimates work</summary>
              <div className="mt-4 grid gap-4">
                <p className="text-sm font-bold leading-6 text-ink/55">
                  The model keeps the existing DoughTools formula: dough amount comes from pizza count, ball weight, hydration and salt; sauce, cheese and toppings use grams per pizza; waste is applied to the homemade subtotal.
                </p>
                <div className="grid gap-2">
                  {result.lines.map((line) => (
                    <BreakdownLine key={line.id} line={line} currency={currency} />
                  ))}
                  <BreakdownLine
                    currency={currency}
                    line={{ id: "waste", amount: values.waste, unit: "%", cost: result.wasteCost }}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumericControl id="cost-ball-weight" label="Dough-ball weight" suffix="g" value={values.ballWeight} onChange={updateValue("ballWeight")} step={10} />
                  <NumericControl id="cost-hydration" label="Hydration" suffix="%" value={values.hydration} onChange={updateValue("hydration")} step={1} />
                  <NumericControl id="cost-salt" label="Salt" suffix="%" value={values.salt} onChange={updateValue("salt")} step={0.1} />
                  <NumericControl id="cost-flour-price" label="Flour price" suffix={perKg} value={values.flourPrice} onChange={updateValue("flourPrice")} step={0.25} />
                  <NumericControl id="cost-sauce-grams" label="Sauce amount" suffix="g/pizza" value={values.sauceGrams} onChange={updateValue("sauceGrams")} step={5} />
                  <NumericControl id="cost-sauce-price" label="Sauce price" suffix={perKg} value={values.saucePrice} onChange={updateValue("saucePrice")} step={0.5} />
                  <NumericControl id="cost-cheese-grams" label="Cheese amount" suffix="g/pizza" value={values.cheeseGrams} onChange={updateValue("cheeseGrams")} step={5} />
                  <NumericControl id="cost-cheese-price" label="Cheese price" suffix={perKg} value={values.cheesePrice} onChange={updateValue("cheesePrice")} step={0.5} />
                  <NumericControl id="cost-topping-grams" label="Other toppings amount" suffix="g/pizza" value={values.toppingGrams} onChange={updateValue("toppingGrams")} step={5} />
                  <NumericControl id="cost-topping-price" label="Other toppings price" suffix={perKg} value={values.toppingPrice} onChange={updateValue("toppingPrice")} step={0.5} />
                  <NumericControl id="cost-extras" label="Oil, basil and seasoning" suffix={perPizza} value={values.extrasPerPizza} onChange={updateValue("extrasPerPizza")} step={0.1} />
                  <NumericControl id="cost-energy" label="Oven energy / session" suffix={currencySymbol} value={values.energy} onChange={updateValue("energy")} step={0.25} />
                  <NumericControl id="cost-packaging" label="Box or packaging" suffix={perPizza} value={values.packagingPerPizza} onChange={updateValue("packagingPerPizza")} step={0.1} />
                  <NumericControl id="cost-waste" label="Waste" suffix="%" value={values.waste} onChange={updateValue("waste")} step={1} />
                </div>
                <p className="text-xs font-bold leading-5 text-ink/45">
                  Currency is only a label. DoughTools does not fetch live ingredient prices, restaurant prices, exchange rates or location data.
                </p>
              </div>
            </details>
          </section>
        </section>

        <section className="mt-6 rounded-[1.75rem] bg-tomato p-5 text-white shadow-card sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-white/70">Next step</p>
          <h2 className="mt-2 font-display text-4xl font-semibold leading-none">Turn the estimate into pizza.</h2>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-white/75">
            Costs stays a lightweight insight page. Pizza Session handles the recipe, timeline and kitchen flow.
          </p>
          <Link href="/session/start" className={buttonClass({ className: "mt-5 bg-white text-tomato hover:bg-flour" })}>
            Plan my next pizza
          </Link>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
