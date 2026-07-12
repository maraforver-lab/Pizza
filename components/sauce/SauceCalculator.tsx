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
  type SauceGarlicIntensity,
  type SauceMethod,
  type SauceReductionPercent,
  type SauceReservePercent,
  type SauceTomatoType,
} from "@/lib/pizza-sauce-calculator";

const methodCopy: Record<SauceMethod, string> = {
  "classic-neapolitan": "Fresh tomato base for a fast-baked Margherita-style pizza.",
  marinara: "Tomato with garlic, oregano and olive oil as the pizza topping profile.",
  "home-oven-cooked": "A restrained cooked adaptation for longer, lower-temperature baking.",
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

  const setCoveragePreset = (value: number) => setSauceGramsPerPizza(value);

  return (
    <section
      id="sauce-calculator"
      className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-ink/10 bg-card shadow-card"
      aria-labelledby="sauce-calculator-title"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,0.72fr)]">
        <div className="p-5 sm:p-7 lg:p-9">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Interactive Sauce Calculator</p>
          <h2 id="sauce-calculator-title" className="mt-3 font-display text-4xl font-semibold">
            Calculate the sauce before you open the tomatoes.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            Choose the method, number of pizzas and sauce amount. The calculator keeps grams primary and treats spoon,
            clove and can estimates as practical helpers, not false precision.
          </p>

          <fieldset className="mt-7">
            <legend className="text-sm font-extrabold text-ink">Sauce method</legend>
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

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <NumberStepper
              label="Number of pizzas"
              value={pizzaCount}
              min={1}
              max={30}
              onChange={setPizzaCount}
              help="Practical range: 1–30 pizzas."
            />
            <NumberStepper
              label="Sauce amount per pizza"
              value={sauceGramsPerPizza}
              min={30}
              max={140}
              step={5}
              unit="g"
              onChange={setSauceGramsPerPizza}
              help="Starting point, not a universal rule."
            />
          </div>

          <div className="mt-4 rounded-2xl border border-ink/10 bg-flour p-4">
            <p className="text-sm font-extrabold text-ink">Coverage preset</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                ["Light", method === "classic-neapolitan" ? 60 : 70],
                ["Balanced", defaultSauceGramsForMethod(method)],
                ["Generous", method === "classic-neapolitan" ? 80 : 100],
              ].map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCoveragePreset(Number(value))}
                  className={`min-h-11 rounded-xl border px-3 text-sm font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                    sauceGramsPerPizza === value ? "border-leaf bg-leaf text-white" : "border-ink/10 bg-white text-ink hover:border-leaf/40"
                  }`}
                >
                  {label} · {value} g
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="rounded-2xl border border-ink/10 bg-white p-4 text-sm font-extrabold text-ink">
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
              help={`Reference range for this choice: ${result.saltRangeLabel}.`}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <fieldset className="rounded-2xl border border-ink/10 bg-white p-4">
              <legend className="text-sm font-extrabold text-ink">Preparation reserve</legend>
              <p className="mt-1 text-xs leading-5 text-muted">Accounts for bowl and spoon loss and small variation.</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {reserveOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setReservePercent(option)}
                    className={`min-h-11 rounded-xl border text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                      reservePercent === option ? "border-leaf bg-leaf text-white" : "border-ink/10 bg-flour text-ink"
                    }`}
                    aria-pressed={reservePercent === option}
                  >
                    {option}%
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-ink/10 bg-white p-4">
              <legend className="text-sm font-extrabold text-ink">Can estimate</legend>
              <p className="mt-1 text-xs leading-5 text-muted">Convenience only; tomato products vary.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {([400, 800] as SauceCanSize[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCanSizeGrams(option)}
                    className={`min-h-11 rounded-xl border text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                      canSizeGrams === option ? "border-leaf bg-leaf text-white" : "border-ink/10 bg-flour text-ink"
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
            <fieldset className="mt-4 rounded-2xl border border-ink/10 bg-white p-4">
              <legend className="text-sm font-extrabold text-ink">Garlic profile</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {garlicOptions.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGarlicIntensity(value)}
                    className={`min-h-11 rounded-xl border px-3 text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                      garlicIntensity === value ? "border-tomato bg-tomato text-white" : "border-ink/10 bg-flour text-ink"
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
            <fieldset className="mt-4 rounded-2xl border border-ink/10 bg-white p-4">
              <legend className="text-sm font-extrabold text-ink">Cooking reduction</legend>
              <p className="mt-1 text-xs leading-5 text-muted">How much moisture you expect to cook off.</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {reductionOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setReductionPercent(option)}
                    className={`min-h-11 rounded-xl border text-sm font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato ${
                      reductionPercent === option ? "border-tomato bg-tomato text-white" : "border-ink/10 bg-flour text-ink"
                    }`}
                    aria-pressed={reductionPercent === option}
                  >
                    {option}%
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>

        <aside className="bg-forest-dark p-5 text-white sm:p-7 lg:p-9" aria-live="polite">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-oven-gold">Your sauce plan</p>
          <div className="mt-4 rounded-[1.5rem] bg-white/10 p-5">
            <p className="text-sm text-white/65">Total finished sauce required</p>
            <strong className="mt-2 block font-display text-5xl leading-none">{formatGrams(result.finishedSauceGrams)}</strong>
            <p className="mt-2 text-xs leading-5 text-white/55">
              {result.pizzaCount} pizzas × {result.sauceGramsPerPizza} g, including {result.reservePercent}% reserve.
            </p>
          </div>

          <div className="mt-5 space-y-3">
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

          {result.toppingGuidance.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-oven-gold/25 bg-oven-gold/10 p-4">
              <h3 className="text-sm font-extrabold text-oven-gold">Topping guidance, not tomato-base ingredients</h3>
              <div className="mt-3 space-y-2">
                {result.toppingGuidance.map((item) => (
                  <p key={item.id} className="text-xs leading-5 text-white/70">
                    <strong className="text-white">{item.label}:</strong> {item.amountLabel}. {item.note}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 text-xs leading-5 text-white/62 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="rounded-2xl bg-white/[.07] p-4">
              <strong className="block text-white">Can estimate</strong>
              {result.cansNeeded} × {result.canSizeGrams} g cans
              <span className="block text-white/42">approx. {formatGrams(result.estimatedLeftoverGrams)} leftover before tasting and trimming</span>
            </div>
            <div className="rounded-2xl bg-white/[.07] p-4">
              <strong className="block text-white">How calculated</strong>
              {result.calculationNote}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
