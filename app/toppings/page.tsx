"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppSignature from "@/components/AppSignature";
import ScrollNumberPicker from "@/components/ScrollNumberPicker";
import { pizzaStyleById } from "@/lib/pizza-styles";
import { settingsFromUrl } from "@/lib/recipe-url";
import type { RecipeSettings } from "@/lib/saved-recipes";
import { calculateToppingLoad, recommendedCheese, toppingDefaults, toppingProfiles, type CheeseType, type DrainState, type PizzaGeometry, type PreparationState, type ToppingId, type ToppingSelection } from "@/lib/topping-calculator";

const defaults: RecipeSettings = { pizzas: 6, ballWeight: 260, waste: 3, hydration: 64, salt: 2.8, yeastType: "idy", fermentation: "24h-cold", temperature: 4, goal: "balanced", ovenType: "gas", flourId: "caputo-pizzeria", pizzaStyleId: "neapolitan" };
const cheeseTypes: CheeseType[] = ["fior-di-latte", "buffalo", "low-moisture", "none"];
const drainStates: DrainState[] = ["undrained", "under-1h", "1-3h", "4-8h", "overnight"];

const copy = {
  fi: {
    eyebrow: "Juusto- ja täytelaskuri", title: "Rakenna maukas pizza ilman märkää keskustaa.", intro: "Pinta-ala, uuni, juuston valutus ja täytteiden käsittely vaikuttavat nyt samaan laskelmaan. Rajat ovat käytännöllisiä lähtöarvoja, eivät virallisia pizzastandardeja.", current: "Nykyinen resepti", pizzas: "pizzaa", pan: "pannupizzaa", gas: "Kaasupizzauuni", home: "Sähköuuni",
    pizza: "1. Pizzan koko", round: "Pyöreä", rectangle: "Suorakulmainen", diameter: "Halkaisija", width: "Leveys", length: "Pituus", rim: "Täyttämätön reunus", areaNote: "Kuorma lasketaan vain täytettävältä pinta-alalta.",
    cheese: "2. Mozzarella", cheeseAmount: "Juustoa / pizza", recommendation: "Pinta-alasuositus", use: "Käytä suositusta", total: "Yhteensä", drain: "Kuinka kauan tuore juusto on valunut?", drainedWeight: "Punnitse vasta valuttamisen jälkeen.",
    cheeses: { "fior-di-latte": ["Fior di latte", "Tuore lehmänmaitomozzarella"], buffalo: ["Buffalomozzarella", "Aromaattinen ja erittäin kostea"], "low-moisture": ["Vähäkosteinen mozzarella", "Tasainen sulaminen pidemmässä paistossa"], none: ["Ei juustoa", "Esimerkiksi Marinara"] },
    drains: { undrained: "Valuttamaton", "under-1h": "Alle 1 tunti", "1-3h": "1–3 tuntia", "4-8h": "4–8 tuntia", overnight: "Yön yli" },
    cheeseTips: { "fior-di-latte": "Leikkaa suikaleiksi ja valuta jääkaapissa siivilässä. Taputtele pinta juuri ennen käyttöä.", buffalo: "Revi tai viipaloi, valuta huolellisesti ja jätä palojen väliin tilaa.", "low-moisture": "Raasta kylmä pala itse ja levitä ilmavasti. Valmis raaste sulaa usein heikommin.", none: "Ilman juustoa kastike korostuu, mutta märät kasvikset pitää silti käsitellä." },
    toppings: "3. Täytteet", toppingsLead: "Valitse vain käyttämäsi täytteet. Käsittelyvalinta muuttaa kosteusriskiä heti.", before: "Ennen paistoa", after: "Paiston jälkeen", add: "Lisää", remove: "Poista", grams: "g / pizza", raw: "Raaka", prepared: "Esikäsitelty", doThis: "Tee näin", why: "Miksi", mistake: "Vältä tätä",
    load: "Täytekuorma", loadLabels: { light: "Kevyt", balanced: "Tasapainoinen", heavy: "Raskas", overloaded: "Ylikuormitettu" }, perArea: "g / 100 cm²", preBake: "ennen paistoa", sauce: "Kastike", cheeseShort: "Juusto", other: "Täytteet", practical: "Käytännön arvio valitulle pizzatyylille.",
    moisture: "Kosteusriski", risks: { low: "Pieni", medium: "Keskitasoinen", high: "Suuri" }, points: "riskipistettä", causedBy: "Riskiin vaikuttaa", noRisks: "Valitut ainekset ja käsittelyt eivät tuo merkittävää vapaata vettä.",
    reasonText: { "cheese-drain": "tuore mozzarella on valunut liian vähän", buffalo: "buffalomozzarella sisältää paljon kosteutta", "home-fresh-cheese": "tuore mozzarella paistetaan pitkään sähköuunissa", "many-wet-toppings": "pizzassa on useita märkiä täytteitä", "tomato-and-sauce": "kastikkeen lisäksi käytetään tuoretta tomaattia" },
    warnings: "Korjaa nämä ennen paistoa", warningText: { "fresh-cheese-raw-mushroom": "Tuore mozzarella ja raa'at sienet vapauttavat molemmat vettä. Paista sienet ensin.", "fresh-cheese-heavy-sauce": "Runsas kastike ja tuore mozzarella muodostavat yhdessä märän pinnan. Vähennä jompaakumpaa.", "tomato-and-sauce": "Poista tuoreen tomaatin siemenosa ja valuta viipaleet.", "many-main-toppings": "Neljä tai useampi päätäyte vaikeuttaa tasaista paistumista. Harkitse 2–3 päätäytettä.", "heavy-and-wet": "Suuri kuorma ja korkea kosteusriski yhdessä tekevät pizzasta vaikean siirtää ja paistaa." },
    checklist: "Valmistelujärjestys", checklistLead: "Tee kosteat ja kuumat valmistelut ensin. Lisää viimeistelyt vasta uunista tulleelle pizzalle.", stretch: "Venytä pohja ja siirrä se kevyesti jauhotetulle lapiolle.", sauceStep: "Levitä kastike ohuesti keskeltä ulospäin.", cheeseStep: "Lisää juusto ilmavasti, ei yhtenäiseksi kanneksi.", bake: "Lisää ennen paistoa tulevat täytteet, tee ravistustesti ja paista.", finish: "Lisää viimeistelytäytteet paiston jälkeen.", cost: "Siirrä määrät kustannuslaskuriin", sources: "Lähteet ja tausta", sourceLead: "AVPN antaa napolilaiselle lähtökohdan. Täytteiden esikäsittely perustuu testikeittiöiden ja pizzantekijöiden toistuviin havaintoihin. Kuormarajat ovat DoughToolsin kalibroitavia käytännön arvioita.",
  },
  en: {
    eyebrow: "Cheese & topping calculator", title: "Build a flavourful pizza without a soggy centre.", intro: "Area, oven, cheese draining and topping preparation now affect one calculation. The limits are practical starting points, not official pizza standards.", current: "Current recipe", pizzas: "pizzas", pan: "pan pizzas", gas: "Gas pizza oven", home: "Electric oven",
    pizza: "1. Pizza size", round: "Round", rectangle: "Rectangular", diameter: "Diameter", width: "Width", length: "Length", rim: "Untopped rim", areaNote: "Load is calculated over the topped area only.",
    cheese: "2. Mozzarella", cheeseAmount: "Cheese / pizza", recommendation: "Area recommendation", use: "Use recommendation", total: "Total", drain: "How long has the fresh cheese drained?", drainedWeight: "Weigh only after draining.",
    cheeses: { "fior-di-latte": ["Fior di latte", "Fresh cow's-milk mozzarella"], buffalo: ["Buffalo mozzarella", "Aromatic and very moist"], "low-moisture": ["Low-moisture mozzarella", "Even melt in a longer bake"], none: ["No cheese", "For example, Marinara"] },
    drains: { undrained: "Not drained", "under-1h": "Under 1 hour", "1-3h": "1–3 hours", "4-8h": "4–8 hours", overnight: "Overnight" },
    cheeseTips: { "fior-di-latte": "Cut into strips and drain in a sieve in the fridge. Blot just before use.", buffalo: "Tear or slice, drain carefully and leave space between pieces.", "low-moisture": "Shred a cold block yourself and spread loosely. Pre-shredded cheese often melts less evenly.", none: "Without cheese the sauce stands out, but wet vegetables still need preparation." },
    toppings: "3. Toppings", toppingsLead: "Choose only what you use. Changing preparation immediately changes the moisture risk.", before: "Before baking", after: "After baking", add: "Add", remove: "Remove", grams: "g / pizza", raw: "Raw", prepared: "Prepared", doThis: "Do this", why: "Why", mistake: "Avoid this",
    load: "Topping load", loadLabels: { light: "Light", balanced: "Balanced", heavy: "Heavy", overloaded: "Overloaded" }, perArea: "g / 100 cm²", preBake: "before baking", sauce: "Sauce", cheeseShort: "Cheese", other: "Toppings", practical: "A practical estimate for the selected pizza style.",
    moisture: "Moisture risk", risks: { low: "Low", medium: "Medium", high: "High" }, points: "risk points", causedBy: "The risk is affected by", noRisks: "The selected ingredients and preparation add little free water.",
    reasonText: { "cheese-drain": "fresh mozzarella has not drained long enough", buffalo: "buffalo mozzarella contains a lot of moisture", "home-fresh-cheese": "fresh mozzarella has a long electric-oven bake", "many-wet-toppings": "the pizza has several wet toppings", "tomato-and-sauce": "fresh tomato is used in addition to sauce" },
    warnings: "Correct these before baking", warningText: { "fresh-cheese-raw-mushroom": "Fresh mozzarella and raw mushrooms both release water. Cook the mushrooms first.", "fresh-cheese-heavy-sauce": "Generous sauce and fresh mozzarella create a wet surface together. Reduce one of them.", "tomato-and-sauce": "Remove the fresh tomato seed pulp and drain the slices.", "many-main-toppings": "Four or more main toppings make even baking difficult. Consider 2–3 main toppings.", "heavy-and-wet": "High load and high moisture together make the pizza difficult to launch and bake." },
    checklist: "Preparation order", checklistLead: "Do wet and hot preparation first. Add finishing toppings only after baking.", stretch: "Stretch the base and move it to a lightly dusted peel.", sauceStep: "Spread the sauce thinly from the centre outwards.", cheeseStep: "Add cheese loosely, not as a solid lid.", bake: "Add pre-bake toppings, shake-test and bake.", finish: "Add finishing toppings after baking.", cost: "Send amounts to cost calculator", sources: "Sources and background", sourceLead: "AVPN provides a Neapolitan baseline. Preparation advice reflects recurring test-kitchen and pizza-maker findings. Load limits are calibratable DoughTools estimates.",
  },
  sv: {
    eyebrow: "Ost- och toppingkalkylator", title: "Bygg en smakrik pizza utan en blöt mitt.", intro: "Yta, ugn, avrinning av osten och förberedelse av toppingarna ingår nu i samma beräkning. Gränserna är praktiska riktvärden, inte officiella pizzastandarder.", current: "Aktuellt recept", pizzas: "pizzor", pan: "pannpizzor", gas: "Gaspizzaugn", home: "Elektrisk ugn",
    pizza: "1. Pizzans storlek", round: "Rund", rectangle: "Rektangulär", diameter: "Diameter", width: "Bredd", length: "Längd", rim: "Kant utan topping", areaNote: "Belastningen beräknas endast på den toppade ytan.",
    cheese: "2. Mozzarella", cheeseAmount: "Ost / pizza", recommendation: "Rekommendation enligt yta", use: "Använd rekommendationen", total: "Totalt", drain: "Hur länge har den färska osten fått rinna av?", drainedWeight: "Väg osten först efter avrinning.",
    cheeses: { "fior-di-latte": ["Fior di latte", "Färsk komjölksmozzarella"], buffalo: ["Buffelmozzarella", "Aromatisk och mycket fuktig"], "low-moisture": ["Mozzarella med låg fukthalt", "Jämn smältning vid längre gräddning"], none: ["Ingen ost", "Till exempel Marinara"] },
    drains: { undrained: "Inte avrunnen", "under-1h": "Under 1 timme", "1-3h": "1–3 timmar", "4-8h": "4–8 timmar", overnight: "Över natten" },
    cheeseTips: { "fior-di-latte": "Skär i strimlor och låt rinna av i en sil i kylskåpet. Torka ytan precis före användning.", buffalo: "Riv eller skiva, låt rinna av noggrant och lämna mellanrum mellan bitarna.", "low-moisture": "Riv en kall ostbit själv och fördela luftigt. Färdigriven ost smälter ofta sämre.", none: "Utan ost framträder såsen tydligare, men fuktiga grönsaker måste fortfarande förberedas." },
    toppings: "3. Toppingar", toppingsLead: "Välj bara det du använder. Valet av förberedelse ändrar fuktrisken direkt.", before: "Före gräddning", after: "Efter gräddning", add: "Lägg till", remove: "Ta bort", grams: "g / pizza", raw: "Rå", prepared: "Förberedd", doThis: "Gör så här", why: "Varför", mistake: "Undvik detta",
    load: "Toppingbelastning", loadLabels: { light: "Lätt", balanced: "Balanserad", heavy: "Tung", overloaded: "Överbelastad" }, perArea: "g / 100 cm²", preBake: "före gräddning", sauce: "Sås", cheeseShort: "Ost", other: "Toppingar", practical: "En praktisk uppskattning för den valda pizzastilen.",
    moisture: "Fuktrisk", risks: { low: "Låg", medium: "Medelhög", high: "Hög" }, points: "riskpoäng", causedBy: "Risken påverkas av", noRisks: "De valda ingredienserna och förberedelserna tillför lite fritt vatten.",
    reasonText: { "cheese-drain": "den färska mozzarellan har inte fått rinna av tillräckligt länge", buffalo: "buffelmozzarella innehåller mycket fukt", "home-fresh-cheese": "färsk mozzarella gräddas länge i en elektrisk ugn", "many-wet-toppings": "pizzan har flera fuktiga toppingar", "tomato-and-sauce": "färsk tomat används tillsammans med tomatsås" },
    warnings: "Rätta till detta före gräddning", warningText: { "fresh-cheese-raw-mushroom": "Färsk mozzarella och rå svamp släpper båda vätska. Tillaga svampen först.", "fresh-cheese-heavy-sauce": "Mycket sås och färsk mozzarella skapar tillsammans en fuktig yta. Minska den ena.", "tomato-and-sauce": "Ta bort tomatens kärnhus och låt skivorna rinna av.", "many-main-toppings": "Fyra eller fler huvudtoppingar gör jämn gräddning svårare. Överväg 2–3 huvudtoppingar.", "heavy-and-wet": "Hög belastning och hög fuktrisk gör pizzan svår att flytta och grädda." },
    checklist: "Förberedelseordning", checklistLead: "Gör de fuktiga och varma förberedelserna först. Lägg på avslutande toppingar efter gräddningen.", stretch: "Sträck ut bottnen och flytta den till en lätt mjölad pizzaspade.", sauceStep: "Bred ut såsen tunt från mitten och utåt.", cheeseStep: "Fördela osten luftigt, inte som ett heltäckande lock.", bake: "Lägg på toppingarna som ska gräddas, gör skaktestet och grädda.", finish: "Lägg på de avslutande toppingarna efter gräddningen.", cost: "Skicka mängderna till kostnadskalkylatorn", sources: "Källor och bakgrund", sourceLead: "AVPN ger en utgångspunkt för napolitansk pizza. Råden om förberedelse bygger på återkommande erfarenheter från testkök och pizzabagare. Belastningsgränserna är praktiska DoughTools-värden som kan kalibreras.",
  },
} as const;

const visualCopy = {
  fi: { title: "Näin täytekuorma näkyy", lead: "Vertaa omaa pizzaasi kolmeen yksinkertaiseen esimerkkiin.", light: "Liian vähän", balanced: "Sopiva määrä", heavy: "Liikaa", yours: "Sinun pizzasi", section: "Pizzan sivuleikkaus", dry: "Tasapainoinen keskusta", wet: "Märän keskustan riski", note: "Havainnekuva näyttää kuorman ja kosteuden suunnan, ei valmista valokuvaa reseptistä." },
  en: { title: "What topping load looks like", lead: "Compare your pizza with three simple examples.", light: "Too little", balanced: "Just right", heavy: "Too much", yours: "Your pizza", section: "Pizza cross-section", dry: "Balanced centre", wet: "Risk of a soggy centre", note: "The illustration shows the direction of load and moisture, not a finished photo of the recipe." },
  sv: { title: "Så ser toppingbelastningen ut", lead: "Jämför din pizza med tre enkla exempel.", light: "För lite", balanced: "Lagom", heavy: "För mycket", yours: "Din pizza", section: "Pizzans tvärsnitt", dry: "Balanserad mitt", wet: "Risk för blöt mitt", note: "Bilden visar belastning och fukt i stora drag, inte ett färdigt foto av receptet." },
} as const;

const pickerCopy = {
  fi: { label: "Valitse määrä", hint: "Vieritä sormella ylös tai alas", done: "Valitse" },
  sv: { label: "Välj mängd", hint: "Rulla uppåt eller nedåt med fingret", done: "Välj" },
  en: { label: "Choose amount", hint: "Swipe up or down", done: "Choose" },
} as const;

function ToppingLoadVisual({ load, moisture }: { load: "light" | "balanced" | "heavy" | "overloaded"; moisture: "low" | "medium" | "high" }) {
  const v = visualCopy.en;
  const current = load === "light" ? "light" : load === "balanced" ? "balanced" : "heavy";
  const examples = ([
    { kind: "light", label: v.light, src: "/toppings/too-light.webp" },
    { kind: "balanced", label: v.balanced, src: "/toppings/balanced.webp" },
    { kind: "heavy", label: v.heavy, src: "/toppings/too-heavy.webp" },
  ] as const);
  const wet = moisture === "high" || moisture === "medium";

  return <section className="rounded-[1.75rem] bg-white/85 p-5 shadow-card" aria-labelledby="topping-visual-title">
    <h2 id="topping-visual-title" className="font-display text-2xl font-semibold">{v.title}</h2>
    <p className="mt-1 text-[11px] leading-5 text-ink/45">{v.lead}</p>
    <div className="mt-4 grid grid-cols-3 gap-2">
      {examples.map(({ kind, label, src }) => {
        const active = current === kind;
        return <div key={kind} className={`rounded-2xl border p-2 text-center ${active ? "border-leaf bg-leaf/[.07]" : "border-ink/10 bg-cream/60"}`}>
          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl bg-ink/5 shadow-inner">
            <Image src={src} alt={label} fill sizes="(max-width: 640px) 29vw, 96px" className="object-cover"/>
          </div>
          <strong className="mt-2 block text-[10px] leading-tight">{label}</strong>
          {active && <span className="mt-1 inline-flex rounded-full bg-leaf px-2 py-1 text-[8px] font-extrabold text-white">✓ {v.yours}</span>}
        </div>;
      })}
    </div>
    <div className="mt-4 rounded-2xl bg-ink/[.04] p-3">
      <div className="flex items-center justify-between gap-3"><strong className="text-xs">{v.section}</strong><span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${wet ? "bg-tomato/10 text-tomato" : "bg-leaf/10 text-leaf"}`}>{wet ? v.wet : v.dry}</span></div>
      <div className="relative mt-3 h-20 overflow-hidden rounded-xl bg-[#dce9ec]" aria-hidden="true">
        <div className="absolute inset-x-[8%] bottom-2 h-5 rounded-[50%_50%_28%_28%] bg-[#c78d4b]" />
        <div className="absolute inset-x-[11%] bottom-[1.15rem] h-3 rounded-full bg-[#f0c77d]" />
        <div className="absolute inset-x-[15%] bottom-[1.85rem] h-2 rounded-full bg-[#c94c32]" />
        <div className={`absolute inset-x-[20%] bottom-[2.3rem] h-2 rounded-full ${wet ? "bg-sky-400/70" : "bg-[#f7e4b7]"}`} />
        <span className="absolute bottom-[2.65rem] left-[30%] h-3 w-3 rounded-full bg-[#4f733f]"/><span className="absolute bottom-[2.65rem] right-[30%] h-3 w-3 rounded-full bg-[#77613c]"/>
        {wet && <><span className="absolute bottom-3 left-[43%] h-3 w-2 rounded-full bg-sky-400/60"/><span className="absolute bottom-2 left-[54%] h-2 w-4 rounded-full bg-sky-400/50"/></>}
      </div>
    </div>
    <p className="mt-3 text-[9px] leading-4 text-ink/35">{v.note}</p>
  </section>;
}

const queryNumber = (params: URLSearchParams, key: string, fallback: number) => { const raw = params.get(key); if (raw === null || raw.trim() === "") return fallback; const value = Number(raw); return Number.isFinite(value) && value >= 0 ? value : fallback; };

export default function ToppingsPage() {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(defaults);
  const [geometry, setGeometry] = useState<PizzaGeometry>({ shape: "round", diameter: 32, rim: 2 });
  const [cheeseType, setCheeseType] = useState<CheeseType>("fior-di-latte");
  const [drainState, setDrainState] = useState<DrainState>("4-8h");
  const [cheeseGrams, setCheeseGrams] = useState(88);
  const [sauceGrams, setSauceGrams] = useState(75);
  const [toppings, setToppings] = useState<Partial<Record<ToppingId, ToppingSelection>>>({});
  const t = copy.en;
  const style = pizzaStyleById(settings.pizzaStyleId, settings.goal);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shared = settingsFromUrl(location.search);
    const nextSettings = { ...defaults, ...Object.fromEntries(Object.entries(shared).filter(([, value]) => value !== undefined)) } as RecipeSettings;
    const nextStyle = pizzaStyleById(nextSettings.pizzaStyleId, nextSettings.goal);
    const styleDefault = toppingDefaults(nextStyle.id);
    const shape = params.get("pizzaShape") === "rectangle" ? "rectangle" : styleDefault.geometry.shape;
    const nextGeometry: PizzaGeometry = shape === "round"
      ? { shape, diameter: queryNumber(params, "diameter", styleDefault.geometry.shape === "round" ? styleDefault.geometry.diameter : 32), rim: queryNumber(params, "rim", styleDefault.geometry.rim) }
      : { shape, width: queryNumber(params, "pizzaWidth", styleDefault.geometry.shape === "rectangle" ? styleDefault.geometry.width : 20), length: queryNumber(params, "pizzaLength", styleDefault.geometry.shape === "rectangle" ? styleDefault.geometry.length : 25), rim: queryNumber(params, "rim", styleDefault.geometry.rim) };
    const nextCheese = cheeseTypes.includes(params.get("cheese") as CheeseType) ? params.get("cheese") as CheeseType : styleDefault.cheese;
    const nextDrain = drainStates.includes(params.get("drain") as DrainState) ? params.get("drain") as DrainState : nextSettings.ovenType === "home" ? "overnight" : "4-8h";
    const selected: Partial<Record<ToppingId, ToppingSelection>> = {};
    (params.get("toppings") ?? "").split(",").forEach(item => { const [id, raw, prep] = item.split(":"); const profile = toppingProfiles.find(candidate => candidate.id === id); const grams = Number(raw); if (profile && Number.isFinite(grams) && grams > 0) selected[profile.id] = { grams, preparation: prep === "prepared" ? "prepared" : "raw" }; });
    setSettings(nextSettings); setGeometry(nextGeometry); setCheeseType(nextCheese); setDrainState(nextDrain); setCheeseGrams(queryNumber(params, "cheeseGrams", recommendedCheese(nextStyle.id, nextCheese, nextGeometry))); setSauceGrams(queryNumber(params, "sauceGrams", styleDefault.sauceGrams)); setToppings(selected); document.documentElement.lang = "en"; setReady(true);
  }, []);

  const cheeseRecommendation = useMemo(() => recommendedCheese(style.id, cheeseType, geometry), [style.id, cheeseType, geometry]);
  const result = useMemo(() => calculateToppingLoad({ style: style.id, oven: settings.ovenType, geometry, sauceGrams, cheeseType, cheeseGrams, drainState, toppings }), [style.id, settings.ovenType, geometry, sauceGrams, cheeseType, cheeseGrams, drainState, toppings]);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(location.search);
    params.set("pizzaShape", geometry.shape); params.set("rim", String(geometry.rim));
    if (geometry.shape === "round") { params.set("diameter", String(geometry.diameter)); params.delete("pizzaWidth"); params.delete("pizzaLength"); }
    else { params.set("pizzaWidth", String(geometry.width)); params.set("pizzaLength", String(geometry.length)); params.delete("diameter"); }
    params.set("cheese", cheeseType); params.set("drain", drainState); params.set("cheeseGrams", String(cheeseType === "none" ? 0 : cheeseGrams)); params.set("sauceGrams", String(sauceGrams));
    const selected = toppingProfiles.flatMap(profile => toppings[profile.id] ? [`${profile.id}:${toppings[profile.id]!.grams}:${toppings[profile.id]!.preparation}`] : []);
    selected.length ? params.set("toppings", selected.join(",")) : params.delete("toppings");
    history.replaceState(null, "", `${location.pathname}?${params.toString()}`); window.dispatchEvent(new Event("doughtools:urlchange"));
  }, [ready, geometry, cheeseType, drainState, cheeseGrams, sauceGrams, toppings]);

  if (!ready) return <main className="min-h-screen bg-cream"/>;
  const selectedProfiles = toppingProfiles.filter(profile => toppings[profile.id]);
  const preBakeProfiles = selectedProfiles.filter(profile => profile.stage === "before");
  const afterBakeProfiles = selectedProfiles.filter(profile => profile.stage === "after");
  const toppingName = (id: ToppingId) => toppingProfiles.find(profile => profile.id === id)?.nameEn ?? id;
  const profileText = (id: ToppingId, field: "prep" | "why" | "mistake") => { const profile = toppingProfiles.find(item => item.id === id)!; return field === "prep" ? profile.prepEn : field === "why" ? profile.whyEn : profile.mistakeEn; };
  const riskReasons = result.reasons.map(reason => reason.startsWith("raw-") ? `raw or untreated: ${toppingName(reason.slice(4) as ToppingId)}` : t.reasonText[reason as keyof typeof t.reasonText]).filter(Boolean);
  const meterColor = result.load === "overloaded" || result.load === "heavy" ? "bg-tomato" : result.load === "balanced" ? "bg-leaf" : "bg-[#e8c98a]";
  const costParams = new URLSearchParams(location.search); costParams.set("cheeseGrams", String(cheeseType === "none" ? 0 : cheeseGrams)); costParams.set("sauceGrams", String(sauceGrams)); costParams.set("toppingGrams", String(result.toppingGrams));
  const chooseShape = (shape: "round" | "rectangle") => setGeometry(current => shape === "round" ? { shape, diameter: current.shape === "round" ? current.diameter : 32, rim: current.rim } : { shape, width: current.shape === "rectangle" ? current.width : 20, length: current.shape === "rectangle" ? current.length : 25, rim: current.rim });
  const updateTopping = (id: ToppingId, change?: Partial<ToppingSelection>) => setToppings(current => { const next = { ...current }; const profile = toppingProfiles.find(item => item.id === id)!; if (!change) delete next[id]; else next[id] = { grams: change.grams ?? current[id]?.grams ?? profile.defaultGrams, preparation: change.preparation ?? current[id]?.preparation ?? (profile.prepRecommended ? "raw" : "prepared") }; return next; });
  const numberField = (value: number, onChange: (value: number) => void, suffix = "cm") => <ScrollNumberPicker value={value} onValueChange={onChange} min={0} max={suffix === "g" ? 300 : 100} suffix={suffix} label={pickerCopy.en.label} hint={pickerCopy.en.hint} done={pickerCopy.en.done}/>;

  return <main className="min-h-screen bg-cream px-4 py-8 pb-28 text-ink sm:px-6"><div className="mx-auto max-w-6xl">
    <section className="grid items-end gap-5 py-8 lg:grid-cols-[1fr_auto]"><div><p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{t.eyebrow}</p><h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.95] sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-3xl text-sm leading-6 text-ink/55 sm:text-base">{t.intro}</p></div><div className="rounded-2xl bg-white/80 p-4 text-xs shadow-card"><strong className="block text-leaf">{t.current}</strong><span className="mt-1 block text-ink/55">{style.nameEn} · {settings.pizzas} {settings.goal === "pan" ? t.pan : t.pizzas} · {settings.ovenType === "gas" ? t.gas : t.home}</span></div></section>
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_22rem]"><div className="space-y-5">
      <section className="rounded-[1.75rem] bg-white/80 p-5 shadow-card sm:p-7"><h2 className="font-display text-3xl font-semibold">{t.pizza}</h2><div className="mt-4 inline-flex rounded-xl bg-ink/[.05] p-1">{(["round", "rectangle"] as const).map(shape => <button key={shape} type="button" onClick={() => chooseShape(shape)} className={`rounded-lg px-4 py-2 text-xs font-bold ${geometry.shape === shape ? "bg-ink text-white" : "text-ink/45"}`}>{shape === "round" ? t.round : t.rectangle}</button>)}</div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{geometry.shape === "round" ? <label className="text-xs font-bold text-ink/55">{t.diameter}{numberField(geometry.diameter, value => setGeometry({ ...geometry, diameter: value }))}</label> : <><label className="text-xs font-bold text-ink/55">{t.width}{numberField(geometry.width, value => setGeometry({ ...geometry, width: value }))}</label><label className="text-xs font-bold text-ink/55">{t.length}{numberField(geometry.length, value => setGeometry({ ...geometry, length: value }))}</label></>}<label className="text-xs font-bold text-ink/55">{t.rim}{numberField(geometry.rim, value => setGeometry({ ...geometry, rim: value }))}</label></div><p className="mt-4 text-xs text-ink/40">{t.areaNote}</p></section>
      <section className="rounded-[1.75rem] bg-white/80 p-5 shadow-card sm:p-7"><h2 className="font-display text-3xl font-semibold">{t.cheese}</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{cheeseTypes.map(type => { const labels = t.cheeses[type]; return <button key={type} type="button" onClick={() => setCheeseType(type)} className={`min-h-20 rounded-2xl border p-4 text-left ${cheeseType === type ? "border-tomato bg-tomato text-white shadow-lg" : "border-ink/10 bg-white"}`}><strong className="block">{labels[0]}</strong><span className={`mt-1 block text-xs ${cheeseType === type ? "text-white/70" : "text-ink/45"}`}>{labels[1]}</span></button>; })}</div>
        {(cheeseType === "fior-di-latte" || cheeseType === "buffalo") && <div className="mt-5"><strong className="text-xs text-ink/55">{t.drain}</strong><div className="mt-2 flex flex-wrap gap-2">{drainStates.map(state => <button type="button" key={state} onClick={() => setDrainState(state)} className={`rounded-full px-3 py-2 text-[10px] font-bold ${drainState === state ? "bg-leaf text-white" : "bg-ink/[.05] text-ink/50"}`}>{t.drains[state]}</button>)}</div><p className="mt-2 text-[10px] text-ink/40">{t.drainedWeight}</p></div>}
        <div className="mt-5 grid gap-3 rounded-2xl bg-leaf/[.07] p-4 sm:grid-cols-[1fr_auto]"><div><strong className="text-xs text-leaf">{t.recommendation}: {cheeseRecommendation} g</strong><p className="mt-1 text-xs leading-5 text-ink/50">{t.cheeseTips[cheeseType]}</p></div><button type="button" onClick={() => setCheeseGrams(cheeseRecommendation)} className="rounded-xl bg-white px-4 py-2 text-xs font-bold shadow-sm">{t.use}</button></div>
        <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-bold text-ink/55">{t.cheeseAmount}{numberField(cheeseType === "none" ? 0 : cheeseGrams, setCheeseGrams, "g")}</label><div className="self-end rounded-xl bg-ink/[.04] p-3 text-xs text-ink/45">{t.total}<strong className="mt-1 block text-lg text-ink">{cheeseType === "none" ? 0 : cheeseGrams * settings.pizzas} g</strong></div></div>
      </section>
      <section className="rounded-[1.75rem] bg-white/80 p-5 shadow-card sm:p-7"><h2 className="font-display text-3xl font-semibold">{t.toppings}</h2><p className="mt-2 text-xs leading-5 text-ink/45">{t.toppingsLead}</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{toppingProfiles.map(profile => { const selection = toppings[profile.id]; return <article key={profile.id} className={`rounded-2xl border p-4 ${selection ? "border-leaf/35 bg-leaf/[.06]" : "border-ink/10 bg-white"}`}><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-ink/[.05] text-xl">{profile.icon}</span><div className="min-w-0 flex-1"><strong className="block">{toppingName(profile.id)}</strong><span className="text-[10px] font-bold text-ink/35">{profile.stage === "after" ? t.after : t.before}</span></div><button type="button" onClick={() => updateTopping(profile.id, selection ? undefined : {})} className={`rounded-full px-3 py-2 text-[10px] font-extrabold ${selection ? "bg-ink text-white" : "bg-tomato text-white"}`}>{selection ? t.remove : t.add}</button></div>{selection && <><label className="mt-3 block text-[10px] font-bold text-ink/45">{t.grams}{numberField(selection.grams, value => updateTopping(profile.id, { grams: value }), "g")}</label>{profile.prepRecommended && profile.stage === "before" && <div className="mt-3 grid grid-cols-2 rounded-xl bg-white p-1">{(["raw", "prepared"] as PreparationState[]).map(state => <button type="button" key={state} onClick={() => updateTopping(profile.id, { preparation: state })} className={`rounded-lg px-2 py-2 text-[10px] font-bold ${selection.preparation === state ? state === "prepared" ? "bg-leaf text-white" : "bg-tomato text-white" : "text-ink/40"}`}>{state === "raw" ? t.raw : t.prepared}</button>)}</div>}<div className="mt-3 space-y-1.5 text-[11px] leading-5"><p><strong className="text-leaf">{t.doThis}: </strong>{profileText(profile.id, "prep")}</p><p><strong>{t.why}: </strong>{profileText(profile.id, "why")}</p><p className="text-tomato"><strong>{t.mistake}: </strong>{profileText(profile.id, "mistake")}</p></div></>}</article>; })}</div></section>
      {(selectedProfiles.length > 0 || cheeseType !== "none") && <section className="rounded-[1.75rem] bg-white/70 p-5 sm:p-7"><h2 className="font-display text-3xl font-semibold">{t.checklist}</h2><p className="mt-2 text-xs text-ink/45">{t.checklistLead}</p><ol className="mt-5 space-y-3 text-xs leading-5">{(cheeseType === "fior-di-latte" || cheeseType === "buffalo") && <li className="rounded-xl bg-white p-3"><strong>1. </strong>{t.cheeseTips[cheeseType]}</li>}{selectedProfiles.filter(profile => profile.prepRecommended).map(profile => <li key={profile.id} className="rounded-xl bg-white p-3"><strong>• {toppingName(profile.id)}: </strong>{profileText(profile.id, "prep")}</li>)}<li className="rounded-xl bg-white p-3">• {t.stretch}</li><li className="rounded-xl bg-white p-3">• {t.sauceStep}</li>{cheeseType !== "none" && <li className="rounded-xl bg-white p-3">• {t.cheeseStep}</li>}<li className="rounded-xl bg-white p-3">• {t.bake}</li>{afterBakeProfiles.length > 0 && <li className="rounded-xl bg-leaf/[.08] p-3">• {t.finish} <strong>{afterBakeProfiles.map(profile => toppingName(profile.id)).join(", ")}</strong></li>}</ol></section>}
    </div>
    <aside className="space-y-5 lg:sticky lg:top-24"><section className="rounded-[1.75rem] bg-ink p-6 text-white shadow-card"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#e8c98a]">{t.load}</p><div className="mt-3 flex items-end justify-between"><strong className="font-display text-5xl">{result.loadPer100}</strong><span className="pb-1 text-xs text-white/45">{t.perArea}</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${meterColor}`} style={{ width: `${Math.min(100, result.loadPer100 / Math.max(result.loadLimit, 1) * 75)}%` }}/></div><div className="mt-2 flex justify-between text-[10px]"><strong>{t.loadLabels[result.load]}</strong><span className="text-white/40">{result.total} g {t.preBake}</span></div><p className="mt-3 text-[10px] leading-4 text-white/35">{t.practical}</p><div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px]"><div className="rounded-xl bg-white/[.07] p-3"><strong className="block text-base">{sauceGrams} g</strong>{t.sauce}</div><div className="rounded-xl bg-white/[.07] p-3"><strong className="block text-base">{cheeseType === "none" ? 0 : cheeseGrams} g</strong>{t.cheeseShort}</div><div className="rounded-xl bg-white/[.07] p-3"><strong className="block text-base">{result.preBakeToppingGrams} g</strong>{t.other}</div></div></section>
      <ToppingLoadVisual load={result.load} moisture={result.moisture}/>
      <section className={`rounded-[1.75rem] p-5 ${result.moisture === "high" ? "bg-[#5a2c20] text-white" : result.moisture === "medium" ? "bg-[#e8c98a]/35" : "bg-leaf/[.09]"}`}><p className="text-[10px] font-extrabold uppercase tracking-[.16em]">{t.moisture}</p><h2 className="mt-1 font-display text-3xl font-semibold">{t.risks[result.moisture]}</h2><span className="text-[10px] opacity-55">{result.moisturePoints} {t.points}</span>{riskReasons.length ? <div className="mt-4"><strong className="text-xs">{t.causedBy}:</strong><ul className="mt-2 space-y-1 text-xs leading-5 opacity-70">{riskReasons.map(reason => <li key={reason}>• {reason}</li>)}</ul></div> : <p className="mt-3 text-xs leading-5 opacity-65">{t.noRisks}</p>}</section>
      {result.warnings.length > 0 && <section className="rounded-[1.75rem] border border-tomato/20 bg-tomato/[.07] p-5"><h2 className="font-display text-2xl font-semibold">{t.warnings}</h2><ul className="mt-3 space-y-2 text-xs leading-5 text-ink/60">{result.warnings.map(warning => <li key={warning}>• {t.warningText[warning as keyof typeof t.warningText]}</li>)}</ul></section>}
      <Link href={`/costs?${costParams.toString()}`} className="flex min-h-14 items-center justify-between rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white shadow-lg"><span>{t.cost}</span><span>→</span></Link>
    </aside></div>
    <section className="mt-8 rounded-[1.75rem] border border-ink/10 bg-white/60 p-5 sm:p-7"><h2 className="font-display text-3xl font-semibold">{t.sources}</h2><p className="mt-3 max-w-4xl text-xs leading-5 text-ink/50">{t.sourceLead}</p><div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold"><a className="rounded-full bg-white px-3 py-2" href="https://www.pizzanapoletana.org/en/ricetta_pizza_napoletana" target="_blank" rel="noreferrer">AVPN ↗</a><a className="rounded-full bg-white px-3 py-2" href="https://www.kingarthurbaking.com/blog/2024/06/07/add-pizza-toppings" target="_blank" rel="noreferrer">King Arthur Baking ↗</a><a className="rounded-full bg-white px-3 py-2" href="https://www.seriouseats.com/the-pizza-lab-the-best-low-moisture-mozzarella-for-pizzas" target="_blank" rel="noreferrer">Serious Eats ↗</a><a className="rounded-full bg-white px-3 py-2" href="https://www.pizzamaking.com/forum/index.php/topic,70662.0.html" target="_blank" rel="noreferrer">PizzaMaking ↗</a></div></section>
    <footer className="mt-8 border-t border-ink/10 py-6"><AppSignature /></footer>
  </div></main>;
}
