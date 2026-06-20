"use client";

import { useEffect, useMemo, useState } from "react";

type Fermentation = "6h-room" | "12h-room" | "24h-room" | "24h-cold" | "48h-cold";
type YeastType = "fresh" | "dry";
type Locale = "en" | "fi";

const fermentationOptions: { value: Fermentation; freshYeast: number }[] = [
  { value: "6h-room", freshYeast: 0.8 },
  { value: "12h-room", freshYeast: 0.45 },
  { value: "24h-room", freshYeast: 0.22 },
  { value: "24h-cold", freshYeast: 0.18 },
  { value: "48h-cold", freshYeast: 0.1 },
];

const copy = {
  en: {
    toolkit: "Baker's toolkit", eyebrow: "Pizza dough calculator", title: "Your next great pizza starts with the numbers.",
    intro: "Set your batch, style, and fermentation. We'll handle the baker's math.", build: "Build your batch",
    pizzas: "Number of pizzas", ballWeight: "Dough ball weight", hydration: "Hydration", salt: "Salt", waste: "Extra for waste",
    yeastType: "Yeast type", dry: "Dry", fresh: "Fresh", fermentation: "Fermentation",
    ferment: {
      "6h-room": ["6h room", "Same-day"], "12h-room": ["12h room", "Overnight"], "24h-room": ["24h room", "Slow room"],
      "24h-cold": ["24h cold", "Fridge"], "48h-cold": ["48h cold", "Deep flavor"],
    },
    yourRecipe: "Your recipe", ready: "Ready to mix", total: "total", flour: "Flour", water: "Water", freshYeast: "Fresh yeast", dryYeast: "Dry yeast",
    note: "Yeast is estimated for roughly 21°C room temperature and 4°C refrigeration. Adjust for your kitchen and flour.",
    footer: "Made for better pizza nights.", bakers: "Baker's percentages are based on flour weight.", decrease: "Decrease number of pizzas", increase: "Increase number of pizzas",
  },
  fi: {
    toolkit: "Leipurin työkalut", eyebrow: "Pizzataikinalaskuri", title: "Seuraava loistava pizzasi alkaa oikeista luvuista.",
    intro: "Valitse erän koko, tyyli ja kohotus. Me hoidamme leipurin laskut.", build: "Rakenna taikinaerä",
    pizzas: "Pizzojen määrä", ballWeight: "Taikinapallon paino", hydration: "Hydraatio", salt: "Suola", waste: "Hävikkivara",
    yeastType: "Hiivatyyppi", dry: "Kuivahiiva", fresh: "Tuorehiiva", fermentation: "Kohotus",
    ferment: {
      "6h-room": ["6 h huone", "Samana päivänä"], "12h-room": ["12 h huone", "Yön yli"], "24h-room": ["24 h huone", "Hidas kohotus"],
      "24h-cold": ["24 h kylmä", "Jääkaapissa"], "48h-cold": ["48 h kylmä", "Syvä maku"],
    },
    yourRecipe: "Reseptisi", ready: "Valmis sekoitettavaksi", total: "yhteensä", flour: "Jauhot", water: "Vesi", freshYeast: "Tuorehiiva", dryYeast: "Kuivahiiva",
    note: "Hiivan määrä on arvioitu noin 21°C huonelämpöön ja 4°C jääkaappiin. Säädä määrää keittiösi ja jauhojesi mukaan.",
    footer: "Parempia pizzailtoja varten.", bakers: "Leipurin prosentit lasketaan jauhojen painosta.", decrease: "Vähennä pizzojen määrää", increase: "Lisää pizzojen määrää",
  },
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value || 0));
const grams = (value: number) => value < 10 ? value.toFixed(1) : Math.round(value).toString();

function NumberField({ id, label, value, min, max, step = 1, suffix, stepper = false, decreaseLabel = "Decrease", increaseLabel = "Increase", onChange }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string; stepper?: boolean; decreaseLabel?: string; increaseLabel?: string; onChange: (value: number) => void;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink/70">{label}</label>
      <div className={`relative ${stepper ? "grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] gap-2" : "block"}`}>
        {stepper && <button type="button" aria-label={decreaseLabel} disabled={value <= min} onClick={() => onChange(clamp(value - step, min, max))} className="grid h-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-semibold transition active:scale-95 disabled:opacity-30">−</button>}
        <div className="relative min-w-0">
          <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value}
            onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
            className={`h-14 min-w-0 w-full rounded-2xl border border-ink/10 bg-white px-4 text-base font-semibold outline-none transition focus:border-tomato focus:ring-4 focus:ring-tomato/10 ${stepper ? "text-center" : "pr-12"}`} />
          {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink/40">{suffix}</span>}
        </div>
        {stepper && <button type="button" aria-label={increaseLabel} disabled={value >= max} onClick={() => onChange(clamp(value + step, min, max))} className="grid h-14 place-items-center rounded-2xl border border-ink/10 bg-white text-2xl font-semibold transition active:scale-95 disabled:opacity-30">+</button>}
      </div>
    </div>
  );
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en");
  const [pizzas, setPizzas] = useState(4);
  const [ballWeight, setBallWeight] = useState(260);
  const [waste, setWaste] = useState(3);
  const [hydration, setHydration] = useState(65);
  const [salt, setSalt] = useState(2.8);
  const [yeastType, setYeastType] = useState<YeastType>("dry");
  const [fermentation, setFermentation] = useState<Fermentation>("24h-cold");
  const t = copy[locale];

  useEffect(() => {
    const saved = window.localStorage.getItem("doughtools-locale") as Locale | null;
    const detected: Locale = navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en";
    const nextLocale = saved === "fi" || saved === "en" ? saved : detected;
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  }, []);

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    window.localStorage.setItem("doughtools-locale", nextLocale);
    document.documentElement.lang = nextLocale;
  };

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
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-ink/10 bg-white/70 p-1" aria-label="Language">
              {(["fi", "en"] as Locale[]).map((language) => <button key={language} type="button" onClick={() => changeLocale(language)} aria-pressed={locale === language} className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase transition ${locale === language ? "bg-ink text-white" : "text-ink/45"}`}>{language}</button>)}
            </div>
            <span className="hidden rounded-full border border-leaf/20 bg-leaf/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-leaf md:block">{t.toolkit}</span>
          </div>
        </header>

        <section id="top" className="mb-7 max-w-2xl sm:mb-10">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{t.eyebrow}</p>
          <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-ink/60 sm:text-base">{t.intro}</p>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[1.2fr_.8fr] lg:gap-7">
          <section className="rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-card backdrop-blur sm:p-7" aria-labelledby="recipe-settings">
            <div className="mb-6 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-bold text-white">1</span><h2 id="recipe-settings" className="font-display text-2xl font-semibold">{t.build}</h2></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <NumberField id="pizzas" label={t.pizzas} value={pizzas} min={1} max={50} stepper decreaseLabel={t.decrease} increaseLabel={t.increase} onChange={setPizzas} />
              <NumberField id="ball-weight" label={t.ballWeight} value={ballWeight} min={100} max={1000} step={5} suffix="g" stepper onChange={setBallWeight} />
              <NumberField id="hydration" label={t.hydration} value={hydration} min={40} max={100} step={0.5} suffix="%" stepper onChange={setHydration} />
              <NumberField id="salt" label={t.salt} value={salt} min={0} max={10} step={0.1} suffix="%" stepper onChange={setSalt} />
              <NumberField id="waste" label={t.waste} value={waste} min={0} max={25} step={0.5} suffix="%" stepper onChange={setWaste} />
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink/70">{t.yeastType}</legend>
                <div className="grid h-14 grid-cols-2 rounded-2xl bg-ink/5 p-1">
                  {(["dry", "fresh"] as YeastType[]).map((type) => <button key={type} type="button" onClick={() => setYeastType(type)} className={`rounded-xl text-sm font-bold transition ${yeastType === type ? "bg-white text-ink shadow-sm" : "text-ink/45 hover:text-ink"}`}>{t[type]}</button>)}
                </div>
              </fieldset>
            </div>

            <fieldset className="mt-7">
              <legend className="mb-3 text-sm font-semibold text-ink/70">{t.fermentation}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {fermentationOptions.map((option) => (
                  <button key={option.value} type="button" onClick={() => setFermentation(option.value)} aria-pressed={fermentation === option.value}
                    className={`min-h-16 rounded-2xl border px-2 py-3 text-left transition sm:text-center ${fermentation === option.value ? "border-tomato bg-tomato text-white shadow-lg shadow-tomato/15" : "border-ink/10 bg-white text-ink hover:border-ink/25"}`}>
                    <span className="block text-sm font-bold">{t.ferment[option.value][0]}</span><span className={`mt-1 block text-[10px] font-medium ${fermentation === option.value ? "text-white/70" : "text-ink/40"}`}>{t.ferment[option.value][1]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <aside className="overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-card lg:sticky lg:top-7" aria-live="polite">
            <div className="p-5 sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/45">{t.yourRecipe}</p><h2 className="mt-1 font-display text-3xl font-semibold">{t.ready}</h2></div>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">{Math.round(recipe.total)} g {t.total}</span>
              </div>

              <div className="divide-y divide-white/10">
                {[{ name: t.flour, value: recipe.flour, color: "bg-[#e8c98a]" }, { name: t.water, value: recipe.water, color: "bg-[#80b4c3]" }, { name: t.salt, value: recipe.salt, color: "bg-white" }, { name: yeastType === "fresh" ? t.freshYeast : t.dryYeast, value: recipe.yeast, color: "bg-[#d67e65]" }].map((ingredient) => (
                  <div key={ingredient.name} className="flex items-center justify-between py-4 first:pt-1 last:pb-1">
                    <span className="flex items-center gap-3 text-sm font-semibold text-white/65"><span className={`h-2 w-2 rounded-full ${ingredient.color}`} />{ingredient.name}</span>
                    <span className="text-2xl font-extrabold tabular-nums">{grams(ingredient.value)} <small className="text-sm font-semibold text-white/35">g</small></span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/[.04] px-5 py-4 sm:px-7">
              <p className="flex items-start gap-2 text-xs leading-5 text-white/45"><svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.01"/></svg>{t.note}</p>
            </div>
          </aside>
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-ink/10 py-6 text-xs text-ink/45 sm:flex-row sm:items-center sm:justify-between"><p>{t.footer}</p><p>{t.bakers}</p></footer>
      </div>
    </main>
  );
}
