"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AppSignature from "@/components/AppSignature";
import ExperienceLevelSelector from "@/components/ExperienceLevelSelector";
import { bakeFor } from "@/lib/baking";
import { buildDoughInstructions } from "@/lib/dough-instructions";
import { getEducationExperienceCopy } from "@/lib/education-experience-copy";
import { readExperienceLevelPreference, type ExperienceLevel } from "@/lib/experience-levels";
import { beginnerHelpFor } from "@/lib/beginner-guide";
import { calculateDoughIngredients } from "@/lib/dough-calculator";
import { flourById } from "@/lib/flours";
import { nextScheduledStep, scheduleInstructions } from "@/lib/pizza-schedule";
import { recipeParams, settingsFromUrl } from "@/lib/recipe-url";
import type { RecipeSettings } from "@/lib/saved-recipes";

type Locale = "fi" | "sv" | "en";
type ScheduleMode = "start" | "bake";

const defaults: RecipeSettings = {
  pizzas: 6, ballWeight: 260, waste: 3, hydration: 64, salt: 2.8, yeastType: "idy",
  fermentation: "24h-cold", temperature: 4, goal: "balanced", ovenType: "gas", flourId: "caputo-pizzeria",
};

const copy = {
  fi: {
    back: "Takaisin laskuriin", eyebrow: "Valmistusohje ja aikataulu", title: "Pizza valmistuu ajallaan.", intro: "Aloita heti tai valitse paistohetki. DoughTools antaa jokaiselle työvaiheelle kellonajan.",
    startNow: "Aloita nyt", startNote: "Aikataulu alkaa puhelimen nykyisestä kellonajasta.", bakeAt: "Haluttu paistoaika", makeSchedule: "Laske taaksepäin", localTime: "Puhelimen aika", next: "Seuraavaksi", overdue: "Aloita nyt", done: "Kaikki vaiheet tehty – on aika nauttia pizzasta!", markDone: "Merkitse tehdyksi", undo: "Palauta", timeline: "Beginner guide – vaihe vaiheelta", warnings: "Tarkista yhdistelmä", estimated: "Kellonajat ovat käytännöllisiä arvioita. Taikina ei tunne kelloa: seuraa myös kuvissa näytettyä rakennetta, lämpöä ja kasvua.", currentRecipe: "Nykyinen resepti", balls: "palloa", hydration: "hydraatio", timezone: "Aikavyöhyke", day: "pv", hour: "h", minute: "min", doThis: "Tee näin", why: "Miksi tämä tehdään?", readyWhen: "Valmis, kun", commonMistake: "Vältä tätä", ingredients: "Punnitse nämä", flour: "Jauhot", water: "Vesi", salt: "Suola", leavener: "Hiiva / juuri", visualIntro: "Jokainen kuva näyttää tavoiteltavan rakenteen tai käsien liikkeen. Avaa vaihe ja vertaa omaa taikinaasi kuvaan.", timerTitle: "Avaa paistoajastin", timerLead: "Suuri puhelinnäkymä, 10 sekunnin äänimerkit ja näytön hereillä pito.",
  },
  en: {
    back: "Back to calculator", eyebrow: "Instructions and schedule", title: "Pizza, ready on time.", intro: "Start immediately or choose your baking time. DoughTools gives every step a clock time.",
    startNow: "Start now", startNote: "The schedule begins from your phone’s current time.", bakeAt: "Desired baking time", makeSchedule: "Calculate backwards", localTime: "Phone time", next: "Up next", overdue: "Start now", done: "Every step is complete – time to enjoy your pizza!", markDone: "Mark complete", undo: "Undo", timeline: "Beginner guide – step by step", warnings: "Check this combination", estimated: "Clock times are practical estimates. Dough cannot read a clock: also watch the texture, temperature and growth shown in the pictures.", currentRecipe: "Current recipe", balls: "balls", hydration: "hydration", timezone: "Time zone", day: "d", hour: "h", minute: "min", doThis: "Do this", why: "Why do this?", readyWhen: "Ready when", commonMistake: "Avoid this", ingredients: "Weigh these", flour: "Flour", water: "Water", salt: "Salt", leavener: "Yeast / starter", visualIntro: "Each picture shows the target texture or hand movement. Open each step and compare your dough with the image.", timerTitle: "Open bake timer", timerLead: "Large phone view, final 10-second sound cues and screen wake lock.",
  },
  sv: {
    back: "Tillbaka till kalkylatorn", eyebrow: "Instruktioner och tidsplan", title: "Pizza, klar i rätt tid.", intro: "Börja genast eller välj baktid. DoughTools ger varje arbetsmoment ett klockslag.",
    startNow: "Börja nu", startNote: "Tidsplanen börjar från telefonens aktuella tid.", bakeAt: "Önskad baktid", makeSchedule: "Räkna bakåt", localTime: "Telefonens tid", next: "Nästa steg", overdue: "Börja nu", done: "Alla steg är klara – dags att njuta av pizzan!", markDone: "Markera som klar", undo: "Ångra", timeline: "Nybörjarguide – steg för steg", warnings: "Kontrollera kombinationen", estimated: "Klockslagen är praktiska uppskattningar. Degen kan inte läsa klockan: följ också strukturen, temperaturen och tillväxten på bilderna.", currentRecipe: "Aktuellt recept", balls: "bollar", hydration: "hydrering", timezone: "Tidszon", day: "d", hour: "h", minute: "min", doThis: "Gör så här", why: "Varför gör man detta?", readyWhen: "Klar när", commonMistake: "Undvik detta", ingredients: "Väg upp", flour: "Mjöl", water: "Vatten", salt: "Salt", leavener: "Jäst / surdeg", visualIntro: "Varje bild visar önskad struktur eller handrörelse. Öppna steget och jämför din deg med bilden.", timerTitle: "Öppna gräddningstimern", timerLead: "Stor mobilvy, ljudsignaler de sista 10 sekunderna och skärmen hålls vaken.",
  },
} as const;

const dateInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const durationText = (milliseconds: number, locale: Locale) => {
  if (milliseconds <= 0) return copy.en.overdue;
  const totalMinutes = Math.ceil(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return [[days, copy.en.day], [hours, copy.en.hour], [minutes, copy.en.minute]].filter(([value]) => Number(value) > 0).map(([value, unit]) => `${value} ${unit}`).join(" ");
};

export default function PlanPage() {
  const locale: Locale = "en";
  const [settings, setSettings] = useState<RecipeSettings>(defaults);
  const [mode, setMode] = useState<ScheduleMode>("start");
  const [anchor, setAnchor] = useState(new Date(0));
  const [bakeInput, setBakeInput] = useState("");
  const [now, setNow] = useState(new Date(0));
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const t = copy.en;
  const levelCopy = getEducationExperienceCopy(experienceLevel).planner;
  const flour = flourById(settings.flourId);
  const bake = bakeFor(settings.goal, settings.ovenType);
  const ingredients = useMemo(() => calculateDoughIngredients(settings), [settings]);

  useEffect(() => {
    const shared = settingsFromUrl(window.location.search);
    const validShared = Object.fromEntries(Object.entries(shared).filter(([, value]) => value !== undefined)) as Partial<RecipeSettings>;
    const parsed = { ...defaults, ...validShared };
    const current = new Date();
    const hours = Number(parsed.fermentation.match(/^\d+/)?.[0] ?? 24);
    const defaultBake = new Date(current.getTime() + hours * 3_600_000);
    const signature = recipeParams(parsed).toString();
    const storedRaw = window.localStorage.getItem("doughtools-active-plan-v1");
    let stored: { signature?: string; mode?: ScheduleMode; anchor?: string; completed?: string[] } | null = null;
    try { stored = storedRaw ? JSON.parse(storedRaw) : null; } catch { stored = null; }
    const storedAnchor = stored?.signature === signature && stored.anchor ? new Date(stored.anchor) : null;
    const nextMode = stored?.signature === signature && stored.mode ? stored.mode : "start";
    const nextAnchor = storedAnchor && !Number.isNaN(storedAnchor.getTime()) ? storedAnchor : (nextMode === "bake" ? defaultBake : current);
    setSettings(parsed);
    setNow(current);
    setMode(nextMode);
    setAnchor(nextAnchor);
    setBakeInput(dateInputValue(nextMode === "bake" ? nextAnchor : defaultBake));
    setCompleted(new Set(stored?.signature === signature ? stored.completed ?? [] : []));
    document.documentElement.lang = "en";
    setExperienceLevel(readExperienceLevelPreference());
    setReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem("doughtools-active-plan-v1", JSON.stringify({ signature: recipeParams(settings).toString(), mode, anchor: anchor.toISOString(), completed: [...completed] }));
  }, [ready, settings, mode, anchor, completed]);

  const instructions = useMemo(() => buildDoughInstructions({ locale, settings, flour, bake }), [locale, settings, flour, bake]);
  const scheduled = useMemo(() => scheduleInstructions(instructions.steps, settings.fermentation, anchor, mode), [instructions.steps, settings.fermentation, anchor, mode]);
  const nextStep = nextScheduledStep(scheduled, now, completed);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), []);
  const timeFormatter = useMemo(() => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }), []);
  const backHref = `/?${recipeParams(settings).toString()}`;

  const startNow = () => {
    const current = new Date();
    setMode("start"); setAnchor(current); setNow(current); setCompleted(new Set());
  };
  const scheduleForBake = () => {
    const selected = new Date(bakeInput);
    if (Number.isNaN(selected.getTime())) return;
    setMode("bake"); setAnchor(selected); setCompleted(new Set());
  };
  const toggleStep = (id: string) => setCompleted((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  if (!ready) return <main className="min-h-screen bg-cream" />;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-end"><div className="rounded-full bg-white px-3 py-2 text-xs font-bold text-ink/55 shadow-sm">{t.localTime} {timeFormatter.format(now)}</div></div>
        <section className="py-9 sm:py-12"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{t.eyebrow}</p><h1 className="mt-3 font-display text-4xl font-semibold leading-none sm:text-6xl">{t.title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-ink/55 sm:text-base">{levelCopy.intro}</p><ExperienceLevelSelector value={experienceLevel} onChange={setExperienceLevel} compact title="Planning guidance mode" intro="Choose how detailed the fermentation plan should feel while you work through the dough schedule." className="mt-5 max-w-4xl" /></section>

        <section className="grid gap-4 md:grid-cols-2">
          <button type="button" onClick={startNow} aria-pressed={mode === "start"} className={`rounded-[1.5rem] border p-5 text-left shadow-card transition focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${mode === "start" ? "border-leaf bg-leaf text-white" : "border-white bg-white/75"}`}><span className="text-xs font-extrabold uppercase tracking-wide opacity-55">01</span><strong className="mt-2 block font-display text-2xl">{t.startNow}</strong><span className="mt-2 block text-xs leading-5 opacity-65">{t.startNote}</span>{mode === "start" && <span className="mt-3 block text-[10px] font-extrabold uppercase tracking-[.14em]">Selected schedule mode</span>}</button>
          <div className={`rounded-[1.5rem] border p-5 shadow-card ${mode === "bake" ? "border-tomato bg-white" : "border-white bg-white/75"}`}><label htmlFor="bake-time" className="text-xs font-extrabold uppercase tracking-wide text-tomato">02 · {t.bakeAt}</label><input id="bake-time" type="datetime-local" value={bakeInput} min={dateInputValue(now)} onChange={(event) => setBakeInput(event.target.value)} className="mt-3 h-12 w-full rounded-xl border border-ink/10 bg-cream px-3 text-sm font-bold outline-none focus:border-tomato"/><button type="button" onClick={scheduleForBake} aria-pressed={mode === "bake"} className="mt-2 w-full rounded-xl bg-tomato px-4 py-3 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white">{t.makeSchedule}</button>{mode === "bake" && <span className="mt-2 block text-[10px] font-extrabold uppercase tracking-[.14em] text-tomato">Selected schedule mode</span>}</div>
        </section>

        <section className="mt-4 rounded-[1.5rem] bg-ink p-5 text-white shadow-card sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-white/40">{t.next}</p>{nextStep ? <><h2 className="mt-2 font-display text-3xl font-semibold">{nextStep.title}</h2><p className="mt-2 text-sm text-white/55">{dateFormatter.format(nextStep.at)}</p></> : <h2 className="mt-2 font-display text-3xl font-semibold">{t.done}</h2>}</div>{nextStep && <div className="rounded-2xl bg-white/10 px-5 py-4 text-center"><strong className="block text-2xl text-[#e8c98a]">{durationText(nextStep.at.getTime() - now.getTime(), locale)}</strong><button type="button" onClick={() => toggleStep(nextStep.id)} className="mt-2 text-xs font-bold text-white/60 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink">{t.markDone}</button></div>}</div>
          <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-white/45">{levelCopy.nextAdvice}</p>
        </section>

        <section className="mt-4 rounded-[1.5rem] border border-white bg-white/75 p-5 shadow-card sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-wide text-ink/35">{t.currentRecipe}</p><h2 className="mt-1 font-display text-2xl font-semibold">{flour.brand} {flour.name}</h2></div><div className="text-right text-xs font-bold text-ink/50">{settings.pizzas} {t.balls} × {settings.ballWeight} g<br/>{settings.hydration} % {t.hydration}</div></div>{instructions.warnings.length > 0 && <div className="mt-4 rounded-xl bg-tomato/[.07] p-3"><strong className="text-xs text-tomato">{t.warnings}</strong>{instructions.warnings.map((warning) => <p key={warning} className="mt-1 text-xs leading-5 text-ink/55">• {warning}</p>)}</div>}</section>

        <section className="mt-7">
          <div className="flex items-end justify-between gap-4"><h2 className="font-display text-3xl font-semibold">{t.timeline}</h2><span className="text-[10px] font-bold text-ink/35">{t.timezone}: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span></div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/50">{levelCopy.visualIntro}</p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-ink/45">{levelCopy.timelineNote}</p>
          <div className="mt-4 rounded-2xl bg-[#e8c98a]/25 p-4"><strong className="text-xs uppercase tracking-wide text-ink/50">{t.ingredients}</strong><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[[t.flour, ingredients.flour, false], [t.water, ingredients.water, false], [t.salt, ingredients.salt, false], [t.leavener, ingredients.leavener, true]].map(([name, value, precise]) => <div key={String(name)} className="rounded-xl bg-white/80 px-3 py-2"><span className="block text-[10px] font-bold text-ink/40">{name}</span><strong className="text-sm">{Number(value).toFixed(precise ? 2 : 0)} g</strong></div>)}</div></div>
          <ol className="mt-4 space-y-5">{scheduled.map((step, index) => { const isDone = completed.has(step.id); const help = beginnerHelpFor(step.id, locale); return <li key={step.id} className={`overflow-hidden rounded-[1.5rem] border bg-white shadow-card transition ${isDone ? "border-leaf/20 opacity-60" : "border-white"}`}>
            <div className="relative aspect-[3/2] bg-cream"><Image src={help.image} alt={help.imageAlt} fill sizes="(max-width: 768px) 100vw, 850px" className="object-cover" priority={index < 2}/><div className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-extrabold text-white shadow-lg">{isDone ? "✓" : index + 1}</div><time className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-2 text-xs font-extrabold text-tomato shadow-lg">{dateFormatter.format(step.at)}</time></div>
            <div className="p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><h3 className={`font-display text-2xl font-semibold ${isDone ? "line-through" : ""}`}>{step.title}</h3><span className="mt-1 block text-xs font-bold text-tomato">{step.timing}</span></div><button type="button" onClick={() => toggleStep(step.id)} aria-pressed={isDone} className={`shrink-0 rounded-full px-3 py-2 text-xs font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isDone ? "bg-leaf text-white" : "bg-cream text-ink/60"}`}>{isDone ? t.undo : t.markDone}</button></div>
              <p className="mt-3 text-sm leading-6 text-ink/55">{step.description}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-cream p-4"><strong className="text-xs uppercase tracking-wide text-leaf">{t.doThis}</strong><ol className="mt-2 space-y-2">{help.action.map((action, actionIndex) => <li key={action} className="flex gap-2 text-sm leading-5 text-ink/65"><span className="font-extrabold text-tomato">{actionIndex + 1}.</span><span>{action}</span></li>)}</ol></div><div className="space-y-3"><div className="rounded-2xl bg-leaf/[.08] p-4"><strong className="text-xs uppercase tracking-wide text-leaf">{t.why}</strong><p className="mt-2 text-sm leading-5 text-ink/60">{help.why}</p></div><div className="rounded-2xl bg-[#e8c98a]/20 p-4"><strong className="text-xs uppercase tracking-wide text-ink/45">✓ {t.readyWhen}</strong><p className="mt-2 text-sm leading-5 text-ink/60">{help.ready}</p></div></div></div>
              <div className="mt-3 rounded-xl border border-tomato/15 bg-tomato/[.05] px-4 py-3 text-xs leading-5 text-ink/55"><strong className="text-tomato">{t.commonMistake}: </strong>{help.mistake}</div>
            </div>
          </li>; })}</ol>
        </section>
        <Link href={`/timer?${recipeParams(settings).toString()}`} className="mt-5 flex items-center justify-between gap-4 rounded-[1.5rem] bg-tomato p-5 text-white shadow-card"><span><small className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/55">Bake stage</small><strong className="mt-1 block font-display text-2xl">{t.timerTitle}</strong><span className="mt-1 block text-xs text-white/65">{t.timerLead}</span></span><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-xl text-tomato">⏱</span></Link>
        <p className="mt-5 rounded-2xl bg-leaf/[.08] px-4 py-3 text-xs leading-5 text-ink/50">{levelCopy.estimated}</p>
        <footer className="mt-8 border-t border-ink/10 py-6"><AppSignature /></footer>
      </div>
    </main>
  );
}
