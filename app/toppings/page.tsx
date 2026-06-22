"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppSignature from "@/components/AppSignature";
import EditableNumberInput from "@/components/EditableNumberInput";
import { pizzaStyleById } from "@/lib/pizza-styles";
import { settingsFromUrl } from "@/lib/recipe-url";
import type { RecipeSettings } from "@/lib/saved-recipes";
import { calculateToppingLoad, toppingDefaults, toppingProfiles, type CheeseType, type ToppingId } from "@/lib/topping-calculator";

type Locale = "fi" | "en";
const defaults: RecipeSettings = { pizzas: 6, ballWeight: 260, waste: 3, hydration: 64, salt: 2.8, yeastType: "idy", fermentation: "24h-cold", temperature: 4, goal: "balanced", ovenType: "gas", flourId: "caputo-pizzeria", pizzaStyleId: "neapolitan" };

const copy = {
  fi: {
    eyebrow: "Juusto- ja täytelaskuri", title: "Täytä pizza niin, että pohja ehtii paistua.", intro: "Laskuri sovittaa juuston, täytteet ja kosteuden valittuun pizzatyyliin, pallon painoon ja uuniin. Määrät ovat lähtökohtia — raaka-aineen todellinen kosteus ratkaisee.",
    current: "Nykyinen resepti", pizzas: "pizzaa", pan: "pannupizzaa", gas: "Kaasupizzauuni", home: "Sähköuuni", cheese: "1. Valitse mozzarella", cheeseAmount: "Juustoa / pizza", total: "Yhteensä", noCheese: "Ilman juustoa",
    cheeses: { "fior-di-latte": ["Fior di latte", "Tuore lehmänmaitomozzarella · pehmeä ja kostea"], buffalo: ["Buffalomozzarella", "Aromaattinen · erittäin kostea"], "low-moisture": ["Vähäkosteinen mozzarella", "Tasainen sulaminen · sopii pitkempään paistoon"], none: ["Ei juustoa", "Esimerkiksi Marinara"] },
    cheeseGuides: {
      "fior-di-latte": ["Leikkaa 1–2 cm suikaleiksi ja valuta siivilässä vähintään 2–4 tuntia. Sähköuunissa 8–24 tuntia on usein turvallisempi.", "Älä purista juustoa kuivaksi massaksi. Tavoite on poistaa vapaa hera, ei juuston omaa kosteutta."],
      buffalo: ["Revi tai viipaloi ja valuta siivilässä 4–12 tuntia; erittäin märkä tuote tarvittaessa yön yli. Taputtele pinta juuri ennen käyttöä.", "Buffalomozzarella ei ole vain fior di latten suora gramma­vaihto: käytä mieluummin hieman vähemmän ja jätä palojen väliin tilaa."],
      "low-moisture": ["Raasta kylmä juusto itse. Täysrasvainen pala sulaa yleensä tasaisemmin kuin valmiiksi raastettu juusto.", "Valmis raaste voi sisältää paakkuuntumisenestoaineita, jotka heikentävät sulamista. Älä peitä koko pintaa paksuksi kannneksi."],
      none: ["Ilman juustoa kastike ja öljy näkyvät selvemmin. Pidä silti täytteiden kokonaiskuorma maltillisena.", "Juuston poistaminen ei tee märistä vihanneksista automaattisesti turvallisia."],
    },
    choose: "2. Valitse täytteet", chooseLead: "Määrä ilmoitetaan yhdelle pizzalle. Lisää vain ne täytteet, joita todella käytät.", add: "Lisää", remove: "Poista", grams: "g / pizza", preparation: "Tee näin", why: "Miksi", mistake: "Yleinen virhe",
    meter: "Topping load", loadTitle: "Pizzan kokonaiskuorma", recommended: "Suositus enintään", includes: "Sisältää kastikkeen, juuston ja muut täytteet.", sauce: "Kastike", other: "Muut täytteet", load: { light: "Kevyt", balanced: "Tasapainoinen", heavy: "Liian raskas" },
    loadNotes: { light: "Kevyt täyttö paistuu varmasti, mutta maku voi jäädä niukaksi. Lisää mieluummin yksi hyvä raaka-aine kuin monta kerrosta.", balanced: "Hyvä alue tälle pohjalle. Jätä täytteiden väliin näkyvää kastiketta, jotta höyry pääsee pois.", heavy: "Vähennä ensin märintä täytettä tai 10–20 g juustoa. Raskas pizza tarttuu lapioon ja keskusta jää helposti pehmeäksi." },
    moisture: "Kosteustarkistus", risks: { low: "Matala riski", medium: "Tarkkaile kosteutta", high: "Korkea kosteusriski" },
    moistureNotes: { low: "Valitut täytteet eivät tuo paljon vapaata vettä.", medium: "Valuta ja kuivaa jokainen kostea raaka-aine ennen täyttämistä.", high: "Useita kosteita aineksia osuu samaan pizzaan. Esikäsittele ne ja vähennä kokonaismäärää — erityisesti sähköuunissa." },
    ruleTitle: "Kolme sääntöä, jotka pelastavat pohjan", rules: [["Kuiva pinta", "Valutettu ei aina tarkoita kuivaa. Taputtele juusto ja säilyketäytteet juuri ennen käyttöä."], ["Täytä viime hetkellä", "Siirrä pohja lapioon, täytä nopeasti, tee ravistustesti ja paista. Kastike imeytyy odottaessaan."], ["Älä rakenna kumpua", "Jätä täytteiden väliin aukkoja. Keskelle kasattu märkä täyte höyrystää pohjan."]],
    sources: "Mihin ohjeet perustuvat?", sourceLead: "Määräsuositus on DoughToolsin käytännön aloitusarvo. Valmistustavat perustuvat viralliseen napolilaiseen prosessiin, testikeittiöiden havaintoihin ja samoihin toistuviin ongelmiin pizzaharrastajien keskusteluissa.", cost: "Siirrä määrät kustannuslaskuriin",
  },
  en: {
    eyebrow: "Cheese & topping calculator", title: "Top the pizza so the base can still bake.", intro: "The calculator matches cheese, toppings and moisture to the selected pizza style, dough-ball weight and oven. Amounts are starting points — the ingredient's real moisture decides the result.",
    current: "Current recipe", pizzas: "pizzas", pan: "pan pizzas", gas: "Gas pizza oven", home: "Electric oven", cheese: "1. Choose mozzarella", cheeseAmount: "Cheese / pizza", total: "Total", noCheese: "No cheese",
    cheeses: { "fior-di-latte": ["Fior di latte", "Fresh cow's-milk mozzarella · soft and moist"], buffalo: ["Buffalo mozzarella", "Aromatic · very moist"], "low-moisture": ["Low-moisture mozzarella", "Even melt · suited to longer bakes"], none: ["No cheese", "For example, Marinara"] },
    cheeseGuides: {
      "fior-di-latte": ["Cut into 1–2 cm strips and drain in a sieve for at least 2–4 hours. For an electric oven, 8–24 hours is often safer.", "Do not squeeze it into a dry paste. Remove free whey, not all of the cheese's own moisture."],
      buffalo: ["Tear or slice and drain for 4–12 hours; leave very wet cheese overnight if needed. Blot just before use.", "Buffalo mozzarella is not a straight gram-for-gram swap: use a little less and leave space between pieces."],
      "low-moisture": ["Shred a cold block yourself. Whole-milk block cheese usually melts more evenly than pre-shredded cheese.", "Pre-shredded cheese may contain anti-caking agents that inhibit melting. Do not cover the surface with a thick lid."],
      none: ["Without cheese, tomato and oil become more prominent. Keep the total topping load restrained.", "Removing cheese does not automatically make wet vegetables safe."],
    },
    choose: "2. Choose toppings", chooseLead: "Amounts are per pizza. Add only the toppings you will actually use.", add: "Add", remove: "Remove", grams: "g / pizza", preparation: "Do this", why: "Why", mistake: "Common mistake",
    meter: "Topping load", loadTitle: "Total pizza load", recommended: "Recommended maximum", includes: "Includes sauce, cheese and all other toppings.", sauce: "Sauce", other: "Other toppings", load: { light: "Light", balanced: "Balanced", heavy: "Too heavy" },
    loadNotes: { light: "A light pizza bakes reliably, though flavour may feel sparse. Add one good ingredient rather than several layers.", balanced: "A good range for this base. Leave visible sauce between toppings so steam can escape.", heavy: "First reduce the wettest topping or 10–20 g of cheese. A heavy pizza sticks to the peel and develops a soft centre." },
    moisture: "Moisture check", risks: { low: "Low risk", medium: "Watch the moisture", high: "High moisture risk" },
    moistureNotes: { low: "The selected toppings add little free water.", medium: "Drain and dry every moist ingredient before topping.", high: "Several wet ingredients meet on one pizza. Pre-treat and reduce them — especially in an electric oven." },
    ruleTitle: "Three rules that save the base", rules: [["Dry surface", "Drained does not always mean dry. Blot cheese and preserved toppings just before use."], ["Top at the last moment", "Move the base to the peel, top quickly, shake-test and bake. Sauce soaks in while waiting."], ["Do not build a mound", "Leave gaps between toppings. A wet pile in the centre steams the base."]],
    sources: "What are these instructions based on?", sourceLead: "The amount recommendation is a practical DoughTools starting point. Preparation methods combine the official Neapolitan process, test-kitchen findings and recurring problems reported by pizza makers.", cost: "Send amounts to cost calculator",
  },
} as const;

const cheeseTypes: CheeseType[] = ["fior-di-latte", "buffalo", "low-moisture", "none"];
const queryNumber = (params: URLSearchParams, key: string, fallback: number) => { const raw = params.get(key); if (raw === null || raw.trim() === "") return fallback; const value = Number(raw); return Number.isFinite(value) && value >= 0 ? value : fallback; };

export default function ToppingsPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(defaults);
  const [cheeseType, setCheeseType] = useState<CheeseType>("fior-di-latte");
  const [cheeseGrams, setCheeseGrams] = useState(80);
  const [sauceGrams, setSauceGrams] = useState(75);
  const [toppings, setToppings] = useState<Partial<Record<ToppingId, number>>>({});
  const t = copy[locale];
  const style = pizzaStyleById(settings.pizzaStyleId, settings.goal);

  useEffect(() => {
    const stored = localStorage.getItem("doughtools-locale") as Locale | null;
    const next = stored === "fi" || stored === "en" ? stored : navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en";
    const shared = settingsFromUrl(location.search);
    const nextSettings = { ...defaults, ...Object.fromEntries(Object.entries(shared).filter(([, value]) => value !== undefined)) } as RecipeSettings;
    const nextStyle = pizzaStyleById(nextSettings.pizzaStyleId, nextSettings.goal);
    const styleDefault = toppingDefaults(nextStyle.id);
    const params = new URLSearchParams(location.search);
    const selectedCheese = cheeseTypes.includes(params.get("cheese") as CheeseType) ? params.get("cheese") as CheeseType : styleDefault.cheese;
    const selected: Partial<Record<ToppingId, number>> = {};
    (params.get("toppings") ?? "").split(",").forEach(item => { const [id, raw] = item.split(":"); const profile = toppingProfiles.find(candidate => candidate.id === id); const grams = Number(raw); if (profile && Number.isFinite(grams) && grams > 0) selected[profile.id] = grams; });
    setLocale(next); setSettings(nextSettings); setCheeseType(selectedCheese); setCheeseGrams(queryNumber(params, "cheeseGrams", styleDefault.cheeseGrams)); setSauceGrams(queryNumber(params, "sauceGrams", styleDefault.sauceGrams)); setToppings(selected);
    document.documentElement.lang = next; setReady(true);
  }, []);

  const result = useMemo(() => calculateToppingLoad({ style: style.id, oven: settings.ovenType, ballWeight: settings.ballWeight, sauceGrams, cheeseType, cheeseGrams, toppings }), [style.id, settings.ovenType, settings.ballWeight, sauceGrams, cheeseType, cheeseGrams, toppings]);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(location.search);
    params.set("cheese", cheeseType); params.set("cheeseGrams", String(cheeseType === "none" ? 0 : cheeseGrams)); params.set("sauceGrams", String(sauceGrams));
    const selected = toppingProfiles.flatMap(profile => toppings[profile.id] ? [`${profile.id}:${toppings[profile.id]}`] : []);
    selected.length ? params.set("toppings", selected.join(",")) : params.delete("toppings");
    history.replaceState(null, "", `${location.pathname}?${params.toString()}`); window.dispatchEvent(new Event("doughtools:urlchange"));
  }, [ready, cheeseType, cheeseGrams, sauceGrams, toppings]);

  if (!ready) return <main className="min-h-screen bg-cream"/>;
  const chosenProfiles = toppingProfiles.filter(profile => toppings[profile.id]);
  const meterColor = result.load === "heavy" ? "bg-tomato" : result.load === "balanced" ? "bg-leaf" : "bg-[#e8c98a]";
  const costParams = new URLSearchParams(location.search); costParams.set("cheeseGrams", String(cheeseType === "none" ? 0 : cheeseGrams)); costParams.set("sauceGrams", String(sauceGrams)); costParams.set("toppingGrams", String(result.toppingGrams));
  const changeTopping = (id: ToppingId, grams?: number) => setToppings(current => { const next = { ...current }; if (grams === undefined) delete next[id]; else next[id] = grams; return next; });

  return <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6"><div className="mx-auto max-w-6xl">
    <section className="grid items-end gap-5 py-8 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{t.eyebrow}</p><h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.95] sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-3xl text-sm leading-6 text-ink/55 sm:text-base">{t.intro}</p></div><div className="rounded-2xl bg-white/80 p-4 text-xs shadow-card"><strong className="block text-leaf">{t.current}</strong><span className="mt-1 block text-ink/55">{locale === "fi" ? style.nameFi : style.nameEn} · {settings.pizzas} {settings.goal === "pan" ? t.pan : t.pizzas} · {settings.ovenType === "gas" ? t.gas : t.home}</span></div></section>
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]"><div className="space-y-5">
      <section className="rounded-[1.75rem] bg-white/80 p-5 shadow-card sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><h2 className="font-display text-3xl font-semibold">{t.cheese}</h2><label className="w-40 text-xs font-bold text-ink/55">{t.cheeseAmount}<div className="relative mt-2"><EditableNumberInput min={0} max={400} value={cheeseType === "none" ? 0 : cheeseGrams} disabled={cheeseType === "none"} onValueChange={setCheeseGrams} className="h-12 w-full rounded-xl border border-ink/10 bg-white px-3 pr-8 font-bold disabled:opacity-40"/><span className="absolute right-3 top-3.5 text-xs text-ink/35">g</span></div></label></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{cheeseTypes.map(type => { const labels = t.cheeses[type]; return <button key={type} type="button" onClick={() => setCheeseType(type)} className={`min-h-24 rounded-2xl border p-4 text-left transition ${cheeseType === type ? "border-tomato bg-tomato text-white shadow-lg" : "border-ink/10 bg-white"}`}><strong className="block">{labels[0]}</strong><span className={`mt-1 block text-xs leading-5 ${cheeseType === type ? "text-white/70" : "text-ink/45"}`}>{labels[1]}</span></button>; })}</div>
        <div className="mt-5 grid gap-3 rounded-2xl bg-leaf/[.08] p-4 text-xs leading-5 sm:grid-cols-2"><p><strong className="block text-leaf">{t.preparation}</strong>{t.cheeseGuides[cheeseType][0]}</p><p><strong className="block text-tomato">{t.mistake}</strong>{t.cheeseGuides[cheeseType][1]}</p></div>
        <p className="mt-4 text-right text-xs text-ink/45">{t.total}: <strong className="text-ink">{cheeseType === "none" ? 0 : cheeseGrams * settings.pizzas} g</strong></p>
      </section>
      <section className="rounded-[1.75rem] bg-white/80 p-5 shadow-card sm:p-7"><h2 className="font-display text-3xl font-semibold">{t.choose}</h2><p className="mt-2 text-xs leading-5 text-ink/45">{t.chooseLead}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{toppingProfiles.map(profile => { const selected = toppings[profile.id] !== undefined; return <article key={profile.id} className={`rounded-2xl border p-4 ${selected ? "border-leaf/35 bg-leaf/[.06]" : "border-ink/10 bg-white"}`}><div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink/[.05] text-xl">{profile.icon}</span><strong className="flex-1">{locale === "fi" ? profile.nameFi : profile.nameEn}</strong><button type="button" onClick={() => changeTopping(profile.id, selected ? undefined : profile.defaultGrams)} className={`rounded-full px-3 py-2 text-[10px] font-extrabold ${selected ? "bg-ink text-white" : "bg-tomato text-white"}`}>{selected ? t.remove : t.add}</button></div>{selected && <><label className="mt-4 block text-[10px] font-extrabold uppercase tracking-wide text-ink/45">{t.grams}<div className="relative mt-1"><EditableNumberInput min={1} max={300} value={toppings[profile.id] ?? profile.defaultGrams} onValueChange={value => changeTopping(profile.id, value)} className="h-11 w-full rounded-xl border border-ink/10 bg-white px-3 pr-8 font-bold"/><span className="absolute right-3 top-3 text-xs text-ink/35">g</span></div></label><div className="mt-3 space-y-2 text-[11px] leading-5"><p><strong className="text-leaf">{t.preparation}: </strong>{locale === "fi" ? profile.prepFi : profile.prepEn}</p><p><strong>{t.why}: </strong>{locale === "fi" ? profile.whyFi : profile.whyEn}</p><p className="text-tomato"><strong>{t.mistake}: </strong>{locale === "fi" ? profile.mistakeFi : profile.mistakeEn}</p></div></>}</article>; })}</div></section>
      {chosenProfiles.length > 0 && <section className="rounded-[1.75rem] bg-[#5a2c20] p-6 text-white sm:p-7"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#e8c98a]">{t.moisture}</p><h2 className="mt-2 font-display text-3xl font-semibold">{t.risks[result.moisture]}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">{t.moistureNotes[result.moisture]}</p><div className="mt-5 flex flex-wrap gap-2">{chosenProfiles.filter(profile => profile.moisture >= 2).map(profile => <span key={profile.id} className="rounded-full bg-white/10 px-3 py-2 text-xs">{profile.icon} {locale === "fi" ? profile.nameFi : profile.nameEn}</span>)}</div></section>}
      <section className="rounded-[1.75rem] bg-white/65 p-5 sm:p-7"><h2 className="font-display text-3xl font-semibold">{t.ruleTitle}</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{t.rules.map(([title, text], index) => <article key={title} className="rounded-2xl bg-white p-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-black text-white">{index + 1}</span><strong className="mt-3 block">{title}</strong><p className="mt-2 text-xs leading-5 text-ink/50">{text}</p></article>)}</div></section>
    </div>
    <aside className="space-y-5 lg:sticky lg:top-24"><section className="rounded-[1.75rem] bg-ink p-6 text-white shadow-card"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#e8c98a]">{t.meter}</p><h2 className="mt-2 font-display text-3xl font-semibold">{t.loadTitle}</h2><div className="mt-5 flex items-end justify-between"><strong className="font-display text-5xl">{result.total} g</strong><span className="text-xs text-white/40">{result.percent} %</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all ${meterColor}`} style={{ width: `${Math.min(100, result.percent)}%` }}/></div><div className="mt-2 flex justify-between text-[10px] text-white/40"><span>{t.load[result.load]}</span><span>{t.recommended}: {result.recommended} g</span></div><p className="mt-5 rounded-xl bg-white/10 p-4 text-xs leading-5 text-white/65">{t.loadNotes[result.load]}</p><div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-xl bg-white/[.07] p-3"><strong className="block text-base">{sauceGrams} g</strong>{t.sauce}</div><div className="rounded-xl bg-white/[.07] p-3"><strong className="block text-base">{cheeseType === "none" ? 0 : cheeseGrams} g</strong>{t.cheese.split(" ").slice(2).join(" ") || "Cheese"}</div><div className="rounded-xl bg-white/[.07] p-3"><strong className="block text-base">{result.toppingGrams} g</strong>{t.other}</div></div><p className="mt-3 text-[10px] leading-4 text-white/35">{t.includes}</p></section><Link href={`/costs?${costParams.toString()}`} className="flex min-h-14 items-center justify-between rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-lg"><span>{t.cost}</span><span>→</span></Link></aside>
    </div>
    <section className="mt-8 rounded-[1.75rem] border border-ink/10 bg-white/60 p-5 sm:p-7"><h2 className="font-display text-3xl font-semibold">{t.sources}</h2><p className="mt-3 max-w-4xl text-xs leading-5 text-ink/50">{t.sourceLead}</p><div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold"><a className="rounded-full bg-white px-3 py-2" href="https://www.pizzanapoletana.org/en/ricetta_pizza_napoletana" target="_blank" rel="noreferrer">AVPN · Official recipe ↗</a><a className="rounded-full bg-white px-3 py-2" href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32010R0097" target="_blank" rel="noreferrer">EU · Pizza Napoletana TSG ↗</a><a className="rounded-full bg-white px-3 py-2" href="https://www.seriouseats.com/the-pizza-lab-the-best-low-moisture-mozzarella-for-pizzas" target="_blank" rel="noreferrer">Serious Eats · Low-moisture mozzarella ↗</a><a className="rounded-full bg-white px-3 py-2" href="https://www.pizzamaking.com/forum/index.php/topic,5075.0.html" target="_blank" rel="noreferrer">PizzaMaking · Mushroom moisture ↗</a><a className="rounded-full bg-white px-3 py-2" href="https://www.reddit.com/r/Pizza/comments/17wecm3/help_get_rid_of_liquid_on_top_of_pizza/" target="_blank" rel="noreferrer">r/Pizza · Draining mozzarella ↗</a></div></section>
    <footer className="mt-8 border-t border-ink/10 py-6"><AppSignature locale={locale}/></footer>
  </div></main>;
}
