"use client";

import { useMemo, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import {
  calculatePizzaSauce,
  defaultSaltPercentForTomato,
  defaultSauceCalculatorInput,
  defaultSauceGramsForMethod,
  formatGrams,
  sauceMethodLabels,
  tomatoTypeLabels,
  type SauceCanSize,
  type SauceCalculatorResult,
  type SauceGarlicIntensity,
  type SauceMethod,
  type SauceReductionPercent,
  type SauceReservePercent,
  type SauceTomatoType,
} from "@/lib/pizza-sauce-calculator";

const methodCopy: Record<SauceMethod, string> = {
  "classic-neapolitan": "Raw tomato for a fast 30-32 cm pizza with restrained coverage.",
  marinara: "Tomato, garlic, oregano and oil for a sauce-forward pizza.",
  "home-oven-cooked": "A tighter cooked sauce for lower heat or longer bakes.",
};

const tomatoOptions = Object.entries(tomatoTypeLabels) as Array<[SauceTomatoType, string]>;
const reserveOptions: SauceReservePercent[] = [0, 5, 10, 15];
const reductionOptions: SauceReductionPercent[] = [0, 10, 15, 20];
const garlicOptions: Array<[SauceGarlicIntensity, string]> = [
  ["mild", "Mild garlic"],
  ["traditional", "Traditional garlic"],
  ["strong", "Strong garlic"],
];

type NumberStepperProps = {
  help?: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  unit?: string;
  value: number;
};

function NumberStepper({ help, label, max, min, onChange, step = 1, unit, value }: NumberStepperProps) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const update = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <label htmlFor={id} className="block text-sm font-extrabold text-ink">
        {label}
      </label>
      {help ? <p className="mt-1 text-xs leading-5 text-muted">{help}</p> : null}
      <div className="mt-3 grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2">
        <button
          type="button"
          onClick={() => update(value - step)}
          className="grid min-h-12 place-items-center rounded-xl border border-ink/10 bg-flour text-ink transition hover:border-tomato/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
          aria-label={`Decrease ${label}`}
        >
          <DoughToolsIcon name="remove" size={20} />
        </button>
        <div className="relative">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => update(Number(event.target.value))}
            className="min-h-12 w-full rounded-xl border border-ink/10 bg-white px-3 text-center text-base font-extrabold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
          />
          {unit ? (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
              {unit}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => update(value + step)}
          className="grid min-h-12 place-items-center rounded-xl border border-ink/10 bg-flour text-ink transition hover:border-tomato/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
          aria-label={`Increase ${label}`}
        >
          <DoughToolsIcon name="add" size={20} />
        </button>
      </div>
    </div>
  );
}

function recipeSteps(result: SauceCalculatorResult): string[] {
  const applyStep = `Measure about ${result.sauceGramsPerPizza} g onto each pizza, spreading thinly and leaving the rim clear.`;

  if (result.method === "marinara") {
    return [
      "Choose ripe whole peeled tomatoes or another tomato product you trust.",
      "Crush by hand, mill, or pulse briefly until spoonable but not foamy.",
      "Stir in the calculated salt, garlic, oregano and extra-virgin olive oil.",
      "Rest briefly while the dough warms and toppings are prepared.",
      applyStep,
    ];
  }

  if (result.method === "home-oven-cooked") {
    return [
      "Start with the calculated tomato amount so the cooked yield still covers the selected pizzas.",
      "Crush or blend only as much as needed for the texture you want.",
      "Simmer gently until the selected reduction is reached; keep it spreadable, not paste-like.",
      "Stir in the calculated salt and optional seasonings, then cool before topping.",
      applyStep,
    ];
  }

  return [
    "Choose whole peeled tomatoes with good flavor and controlled loose juice.",
    "Crush by hand, mill, or pulse briefly to keep a fresh tomato texture.",
    "Stir in the calculated salt; basil and oil stay as topping guidance, not blended into the tomato base.",
    "Rest briefly or use immediately while the dough is ready to stretch.",
    applyStep,
  ];
}

function coveragePresets(method: SauceMethod) {
  return [
    ["Light", method === "classic-neapolitan" ? 60 : 70],
    ["Balanced", defaultSauceGramsForMethod(method)],
    ["Generous", method === "classic-neapolitan" ? 80 : 100],
  ] as const;
}

export default function SauceCalculator() {
  const defaults = defaultSauceCalculatorInput();
  const [method, setMethod] = useState<SauceMethod>(defaults.method);
  const [pizzaCount, setPizzaCount] = useState(defaults.pizzaCount);
  const [sauceGramsPerPizza, setSauceGramsPerPizza] = useState(defaults.sauceGramsPerPizza);
  const [tomatoType, setTomatoType] = useState<SauceTomatoType>(defaults.tomatoType);
  const [reservePercent, setReservePercent] = useState<SauceReservePercent>(defaults.reservePercent);
  const [saltPercent, setSaltPercent] = useState(defaultSaltPercentForTomato(defaults.tomatoType, defaults.method));
  const [garlicIntensity, setGarlicIntensity] = useState<SauceGarlicIntensity>("traditional");
  const [reductionPercent, setReductionPercent] = useState<SauceReductionPercent>(15);
  const [canSizeGrams, setCanSizeGrams] = useState<SauceCanSize>(400);

  const result = useMemo(
    () => calculatePizzaSauce({
      method,
      pizzaCount,
      sauceGramsPerPizza,
      tomatoType,
      reservePercent,
      saltPercent,
      garlicIntensity,
      reductionPercent,
      canSizeGrams,
    }),
    [method, pizzaCount, sauceGramsPerPizza, tomatoType, reservePercent, saltPercent, garlicIntensity, reductionPercent, canSizeGrams],
  );

  const selectMethod = (nextMethod: SauceMethod) => {
    setMethod(nextMethod);
    setSauceGramsPerPizza(defaultSauceGramsForMethod(nextMethod));
    setSaltPercent(defaultSaltPercentForTomato(tomatoType, nextMethod));
  };

  const selectTomatoType = (nextTomatoType: SauceTomatoType) => {
    setTomatoType(nextTomatoType);
    setSaltPercent(defaultSaltPercentForTomato(nextTomatoType, method));
  };

  return (
    <section
      id="sauce-calculator"
      className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-ink/10 bg-card shadow-card"
      aria-labelledby="sauce-calculator-title"
    >
      <div className="border-b border-ink/10 p-5 sm:p-7 lg:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Sauce calculator and recipe</p>
        <h2 id="sauce-calculator-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          How much sauce do I need?
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
          Start with the per-pizza amount, multiply by the pizza count, then make a small practical reserve for bowl and spoon loss.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/48">Sauce per pizza</p>
            <strong className="mt-1 block text-3xl">{result.sauceGramsPerPizza} g</strong>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/48">Pizzas</p>
            <strong className="mt-1 block text-3xl">{result.pizzaCount}</strong>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-ink/48">Finished total</p>
            <strong className="mt-1 block text-3xl">{formatGrams(result.finishedSauceGrams)}</strong>
            <span className="mt-1 block text-xs font-bold text-muted">Before prep reserve</span>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.8fr)]">
        <div className="order-2 p-5 sm:p-7 lg:order-1 lg:p-8">
          <fieldset>
            <legend className="text-sm font-extrabold text-ink">Sauce style</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(Object.keys(sauceMethodLabels) as SauceMethod[]).map((option) => {
                const selected = option === method;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectMethod(option)}
                    className={`rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                      selected ? "border-tomato bg-tomato text-white shadow-card" : "border-ink/10 bg-white text-ink hover:border-tomato/35"
                    }`}
                    aria-pressed={selected}
                  >
                    <strong className="block text-sm">{sauceMethodLabels[option]}</strong>
                    <span className={`mt-2 block text-xs leading-5 ${selected ? "text-white/76" : "text-muted"}`}>
                      {methodCopy[option]}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberStepper
              label="Pizzas"
              value={pizzaCount}
              min={1}
              max={30}
              onChange={setPizzaCount}
              help="Changes the total sauce required."
            />
            <NumberStepper
              label="Sauce per pizza"
              value={sauceGramsPerPizza}
              min={30}
              max={140}
              step={5}
              unit="g"
              onChange={setSauceGramsPerPizza}
              help="A starting point for one typical 30-32 cm pizza."
            />
          </div>

          <div className="mt-4 rounded-2xl border border-ink/10 bg-flour p-4">
            <p className="text-sm font-extrabold text-ink">Coverage preset</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {coveragePresets(method).map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSauceGramsPerPizza(value)}
                  className={`min-h-11 rounded-xl border px-3 text-sm font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                    sauceGramsPerPizza === value ? "border-leaf bg-leaf text-white" : "border-ink/10 bg-white text-ink hover:border-leaf/40"
                  }`}
                >
                  {label} - {value} g
                </button>
              ))}
            </div>
          </div>

          <details className="group mt-5 rounded-2xl border border-ink/10 bg-white p-4">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-sm font-extrabold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tomato">
              Adjust tomato, salt and batch details
              <DoughToolsIcon name="chevron-down" className="text-tomato transition group-open:rotate-180" size={20} />
            </summary>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="rounded-2xl border border-ink/10 bg-flour p-4 text-sm font-extrabold text-ink">
                Tomato type
                <select
                  value={tomatoType}
                  onChange={(event) => selectTomatoType(event.target.value as SauceTomatoType)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-ink/10 bg-white px-3 text-sm font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato"
                >
                  {tomatoOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <NumberStepper
                label="Salt ratio"
                value={saltPercent}
                min={0.4}
                max={1.8}
                step={0.1}
                unit="%"
                onChange={setSaltPercent}
                help={`Reference range: ${result.saltRangeLabel}.`}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <fieldset className="rounded-2xl border border-ink/10 bg-flour p-4">
                <legend className="text-sm font-extrabold text-ink">Preparation reserve</legend>
                <p className="mt-1 text-xs leading-5 text-muted">Bowl, spoon and small spreading variation.</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {reserveOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setReservePercent(option)}
                      className={`min-h-11 rounded-xl border text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                        reservePercent === option ? "border-leaf bg-leaf text-white" : "border-ink/10 bg-white text-ink"
                      }`}
                      aria-pressed={reservePercent === option}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="rounded-2xl border border-ink/10 bg-flour p-4">
                <legend className="text-sm font-extrabold text-ink">Can estimate</legend>
                <p className="mt-1 text-xs leading-5 text-muted">Convenience only; tomato products vary.</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {([400, 800] as SauceCanSize[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCanSizeGrams(option)}
                      className={`min-h-11 rounded-xl border text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                        canSizeGrams === option ? "border-leaf bg-leaf text-white" : "border-ink/10 bg-white text-ink"
                      }`}
                      aria-pressed={canSizeGrams === option}
                    >
                      {option} g cans
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {method === "marinara" ? (
              <fieldset className="mt-4 rounded-2xl border border-ink/10 bg-flour p-4">
                <legend className="text-sm font-extrabold text-ink">Garlic profile</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {garlicOptions.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGarlicIntensity(value)}
                      className={`min-h-11 rounded-xl border px-3 text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                        garlicIntensity === value ? "border-tomato bg-tomato text-white" : "border-ink/10 bg-white text-ink"
                      }`}
                      aria-pressed={garlicIntensity === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {method === "home-oven-cooked" ? (
              <fieldset className="mt-4 rounded-2xl border border-ink/10 bg-flour p-4">
                <legend className="text-sm font-extrabold text-ink">Cooking reduction</legend>
                <p className="mt-1 text-xs leading-5 text-muted">How much moisture you expect to cook off.</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {reductionOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setReductionPercent(option)}
                      className={`min-h-11 rounded-xl border text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                        reductionPercent === option ? "border-tomato bg-tomato text-white" : "border-ink/10 bg-white text-ink"
                      }`}
                      aria-pressed={reductionPercent === option}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </details>
        </div>

        <aside className="order-1 bg-forest-dark p-5 text-white sm:p-7 lg:order-2 lg:p-8" aria-live="polite">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">Recipe and batch</p>
          <p className="mt-5 text-sm leading-6 text-white/68">
            This uses the selected style starting amount for a typical 30-32 cm pizza, then includes {result.reservePercent}% preparation reserve.
          </p>
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/[.07] p-4 text-sm font-bold leading-6 text-white/78">
            Prepare {formatGrams(result.preparationSauceGrams)} including {result.reservePercent}% reserve. Use {result.sauceGramsPerPizza} g on each pizza.
          </p>

          <section className="mt-5" aria-labelledby="sauce-recipe-title">
            <h3 id="sauce-recipe-title" className="font-display text-3xl font-semibold">How to make pizza sauce</h3>
            <ol className="mt-4 space-y-3">
              {recipeSteps(result).map((step, index) => (
                <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-3 text-sm leading-6 text-white/74">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-extrabold text-forest-dark" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-5" aria-labelledby="sauce-ingredients-title">
            <h3 id="sauce-ingredients-title" className="text-sm font-extrabold text-oven-gold">Batch ingredients</h3>
            <div className="mt-3 space-y-3">
              {result.ingredients.map((ingredient) => (
                <div key={ingredient.id} className="rounded-2xl border border-white/10 bg-white/[.07] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-sm font-extrabold">{ingredient.label}</span>
                    <strong className="text-right text-sm">{ingredient.amountLabel}</strong>
                  </div>
                  {ingredient.note ? <p className="mt-2 text-xs leading-5 text-white/55">{ingredient.note}</p> : null}
                </div>
              ))}
            </div>
          </section>

          {result.toppingGuidance.length > 0 ? (
            <section className="mt-5 rounded-2xl border border-oven-gold/25 bg-oven-gold/10 p-4" aria-labelledby="sauce-topping-guidance-title">
              <h3 id="sauce-topping-guidance-title" className="text-sm font-extrabold text-oven-gold">Topping guidance</h3>
              <div className="mt-3 space-y-2">
                {result.toppingGuidance.map((item) => (
                  <p key={item.id} className="text-xs leading-5 text-white/70">
                    <strong className="text-white">{item.label}:</strong> {item.amountLabel}. {item.note}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-5 grid gap-3 text-xs leading-5 text-white/62 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl bg-white/[.07] p-4">
              <strong className="block text-white">Can estimate</strong>
              {result.cansNeeded} x {result.canSizeGrams} g cans
              <span className="block text-white/42">approx. {formatGrams(result.estimatedLeftoverGrams)} leftover before tasting and trimming</span>
            </div>
            <div className="rounded-2xl bg-white/[.07] p-4">
              <strong className="block text-white">What changes the amount</strong>
              Larger pizzas, heavier styles or deeper coverage need a higher per-pizza value.
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
