"use client";

import { useMemo, useState } from "react";

type Fermentation = "6h-room" | "12h-room" | "24h-room" | "24h-cold" | "48h-cold";
type YeastType = "fresh" | "dry";

const fermentationOptions: { value: Fermentation; label: string; note: string; freshYeast: number }[] = [
  { value: "6h-room", label: "6h room", note: "Same-day", freshYeast: 0.8 },
  { value: "12h-room", label: "12h room", note: "Overnight", freshYeast: 0.45 },
  { value: "24h-room", label: "24h room", note: "Slow room", freshYeast: 0.22 },
  { value: "24h-cold", label: "24h cold", note: "Fridge", freshYeast: 0.18 },
  { value: "48h-cold", label: "48h cold", note: "Deep flavor", freshYeast: 0.1 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value || 0));
const grams = (value: number) => value < 10 ? value.toFixed(1) : Math.round(value).toString();

function NumberField({ id, label, value, min, max, step = 1, suffix, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (value: number) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-sm font-semibold text-ink/70">{label}</span>
      <span className="relative block">
        <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value}
          onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
          className="h-14 w-full rounded-2xl border border-ink/10 bg-white px-4 pr-12 text-base font-semibold outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10" />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink/40">{suffix}</span>}
      </span>
    </label>
  );
}

export default function Home() {
  const [pizzas, setPizzas] = useState(4);
  const [ballWeight, setBallWeight] = useState(260);
  const [waste, setWaste] = useState(3);
  const [hydration, setHydration] = useState(65);
  const [salt, setSalt] = useState(2.8);
  const [yeastType, setYeastType] = useState<YeastType>("dry");
  const [fermentation, setFermentation] = useState<Fermentation>("24h-cold");

  const recipe = useMemo(() => {
    const total = pizzas * ballWeight * (1 + waste / 100);
    const option = fermentationOptions.find((item) => item.value === fermentation)!;
    const yeastPercent = yeastType === "fresh" ? option.freshYeast : option.freshYeast / 3;
    const flour = total / (1 + hydration / 100 + salt / 100 + yeastPercent / 100);
    return {
      total,
      flour,
      water: flour * hydration / 100,
      salt: flour * salt / 100,
      yeast: flour * yeastPercent / 100,
      yeastPercent,
    };
  }, [pizzas, ballWeight, waste, hydration, salt, yeastType, fermentation]);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex items-center justify-between sm:mb-10">
          <a href="#top" className="flex items-center gap-3" aria-label="DoughTools home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-lg shadow-tomato/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 15.5C7.8 7.9 17.6 5 20 7c-.3 6.4-4.9 12.1-12 12.5-3.4.2-5.3-1.4-4-4Z"/><circle cx="10" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>
            </span>
            <span className="text-lg font-extrabold tracking-tight">Dough<span className="text-tomato">Tools</span></span>
          </a>
          <span className="hidden rounded-full border border-leaf/20 bg-leaf/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-leaf sm:block">Baker&apos;s toolkit</span>
        </header>

        <section id="top" className="mb-7 max-w-2xl sm:mb-10">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Pizza dough calculator</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">Your next great pizza<br className="hidden sm:block" /> starts with the numbers.</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-ink/60 sm:text-base">Set your batch, style, and fermentation. We&apos;ll handle the baker&apos;s math.</p>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_.8fr] lg:gap-7">
          <section className="rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-7" aria-labelledby="recipe-settings">
            <div className="mb-6 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">1</span><h2 id="recipe-settings" className="font-display text-2xl font-semibold">Build your batch</h2></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField id="pizzas" label="Number of pizzas" value={pizzas} min={1} max={50} onChange={setPizzas} />
              <NumberField id="ball-weight" label="Dough ball weight" value={ballWeight} min={100} max={1000} step={5} suffix="g" onChange={setBallWeight} />
              <NumberField id="hydration" label="Hydration" value={hydration} min={40} max={100} step={0.5} suffix="%" onChange={setHydration} />
              <NumberField id="salt" label="Salt" value={salt} min={0} max={10} step={0.1} suffix="%" onChange={setSalt} />
              <NumberField id="waste" label="Extra for waste" value={waste} min={0} max={25} step={0.5} suffix="%" onChange={setWaste} />
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink/70">Yeast type</legend>
                <div className="grid h-14 grid-cols-2 rounded-2xl bg-ink/5 p-1">
                  {(["dry", "fresh"] as YeastType[]).map((type) => <button key={type} type="button" onClick={() => setYeastType(type)} className={`rounded-xl text-sm font-bold capitalize transition ${yeastType === type ? "bg-white text-ink shadow-sm" : "text-ink/45 hover:text-ink"}`}>{type}</button>)}
                </div>
              </fieldset>
            </div>

            <fieldset className="mt-7">
              <legend className="mb-3 text-sm font-semibold text-ink/70">Fermentation</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {fermentationOptions.map((option) => (
                  <button key={option.value} type="button" onClick={() => setFermentation(option.value)} aria-pressed={fermentation === option.value}
                    className={`min-h-16 rounded-2xl border px-2 py-3 text-left transition sm:text-center ${fermentation === option.value ? "border-tomato bg-tomato text-white shadow-lg shadow-tomato/15" : "border-ink/10 bg-white text-ink hover:border-ink/25"}`}>
                    <span className="block text-sm font-bold">{option.label}</span><span className={`mt-1 block text-[10px] font-medium ${fermentation === option.value ? "text-white/70" : "text-ink/40"}`}>{option.note}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <aside className="overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-card lg:sticky lg:top-7" aria-live="polite">
            <div className="p-5 sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/45">Your recipe</p><h2 className="mt-1 font-display text-3xl font-semibold">Ready to mix</h2></div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">{Math.round(recipe.total)} g total</span>
              </div>

              <div className="divide-y divide-white/10">
                {[{ name: "Flour", value: recipe.flour, color: "bg-[#e8c98a]" }, { name: "Water", value: recipe.water, color: "bg-[#80b4c3]" }, { name: "Salt", value: recipe.salt, color: "bg-white" }, { name: yeastType === "fresh" ? "Fresh yeast" : "Dry yeast", value: recipe.yeast, color: "bg-[#d67e65]" }].map((ingredient) => (
                  <div key={ingredient.name} className="flex items-center justify-between py-4 first:pt-1 last:pb-1">
                    <span className="flex items-center gap-3 text-sm font-semibold text-white/65"><span className={`h-2 w-2 rounded-full ${ingredient.color}`} />{ingredient.name}</span>
                    <span className="text-2xl font-extrabold tabular-nums">{grams(ingredient.value)} <small className="text-sm font-semibold text-white/35">g</small></span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/[.04] px-5 py-4 sm:px-7">
              <p className="flex items-start gap-2 text-xs leading-5 text-white/45"><svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.01"/></svg>Yeast is estimated for roughly 21°C room temperature and 4°C refrigeration. Adjust for your kitchen and flour.</p>
            </div>
          </aside>
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-ink/10 py-6 text-xs text-ink/45 sm:flex-row sm:items-center sm:justify-between"><p>Made for better pizza nights.</p><p>Baker&apos;s percentages are based on flour weight.</p></footer>
      </div>
    </main>
  );
}
