"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { diagnoseDough, doctorIssues, issueCopy, type DoctorIssueId } from "@/lib/dough-doctor";
import { flourById } from "@/lib/flours";
import { pizzaStyleById } from "@/lib/pizza-styles";
import { recipeParams, settingsFromUrl } from "@/lib/recipe-url";
import type { RecipeSettings } from "@/lib/saved-recipes";

type Locale = "fi" | "en";

const defaults: RecipeSettings = { pizzas: 6, ballWeight: 260, waste: 3, hydration: 64, salt: 2.8, yeastType: "idy", fermentation: "24h-cold", temperature: 4, goal: "balanced", ovenType: "gas", flourId: "caputo-pizzeria" };

const copy = {
  fi: {
    calculator: "Laskuri", planner: "Aikataulu", doctor: "Taikinalääkäri", styles: "Pizzatyylit", guide: "Ohjeet ja terminologia", eyebrow: "Dough Doctor", title: "Miltä taikinasi näyttää?", intro: "Valitse kuva, joka muistuttaa omaa taikinaasi. Diagnoosi käyttää nykyisen reseptisi pizzatyyliä, jauhoa, hydraatiota ja kohotusta.", recipe: "Diagnoosissa käytettävä resepti", verify: "Varmista resepti ennen diagnoosia", verifyBody: "Teitkö taikinan alla näkyvällä reseptillä? Tohtorin ohjeet personoidaan tämän pizzatyylin ja asetusten mukaan. Jos käytit muuta reseptiä, muokkaa asetukset ensin laskurissa.", styleAdvice: "Huomio valitulle pizzatyylille", choose: "Valitse lähin tilanne", likely: "Todennäköisin selitys", now: "Mitä voit tehdä nyt", next: "Muuta seuraavalla kerralla", edit: "Tarkista tai muokkaa reseptiä", plan: "Avaa aikataulu", note: "Kuvat ja diagnoosit ovat käytännöllisiä vertailuja. Taikinan todelliseen käytökseen vaikuttavat myös lämpötila, käsittely ja jauhoerä.", prompt: "Valitse ensin taikinaasi parhaiten vastaava kuva.",
  },
  en: {
    calculator: "Calculator", planner: "Planner", doctor: "Dough Doctor", styles: "Pizza styles", guide: "Guide & glossary", eyebrow: "Dough Doctor", title: "What does your dough look like?", intro: "Choose the photo that resembles your dough. The diagnosis uses the pizza style, flour, hydration and fermentation from your current recipe.", recipe: "Recipe used for diagnosis", verify: "Confirm the recipe before diagnosis", verifyBody: "Did you make the dough with the recipe shown below? The Doctor personalises advice for this pizza style and its settings. If you used another recipe, edit the calculator settings first.", styleAdvice: "Note for the selected pizza style", choose: "Choose the closest situation", likely: "Most likely explanation", now: "What you can do now", next: "Change next time", edit: "Check or edit recipe", plan: "Open schedule", note: "The photos and diagnoses are practical comparisons. Actual dough behaviour also depends on temperature, handling, and flour batch.", prompt: "First choose the photo that best matches your dough.",
  },
} as const;

export default function DoctorPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [settings, setSettings] = useState<RecipeSettings>(defaults);
  const [selected, setSelected] = useState<DoctorIssueId | null>(null);
  const [ready, setReady] = useState(false);
  const t = copy[locale];
  const flour = flourById(settings.flourId);
  const pizzaStyle = pizzaStyleById(settings.pizzaStyleId, settings.goal);
  const query = recipeParams(settings).toString();

  useEffect(() => {
    const stored = window.localStorage.getItem("doughtools-locale") as Locale | null;
    const nextLocale = stored === "fi" || stored === "en" ? stored : navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en";
    const shared = settingsFromUrl(window.location.search);
    const validShared = Object.fromEntries(Object.entries(shared).filter(([, value]) => value !== undefined)) as Partial<RecipeSettings>;
    setLocale(nextLocale);
    setSettings({ ...defaults, ...validShared });
    document.documentElement.lang = nextLocale;
    setReady(true);
  }, []);

  const diagnosis = useMemo(() => selected ? diagnoseDough(selected, settings, flour, locale) : null, [selected, settings, flour, locale]);

  if (!ready) return <main className="min-h-screen bg-cream" />;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <Link href={`/?${query}`} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-lg shadow-tomato/20"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 15.5C7.8 7.9 17.6 5 20 7c-.3 6.4-4.9 12.1-12 12.5-3.4.2-5.3-1.4-4-4Z"/><circle cx="10" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg></span><span className="text-lg font-extrabold tracking-tight">Dough<span className="text-tomato">Tools</span></span></Link>
          <nav className="hidden items-center gap-1 rounded-full border border-ink/10 bg-white/70 p-1 lg:flex"><Link href={`/?${query}`} className="rounded-full px-4 py-2 text-xs font-bold text-ink/55">{t.calculator}</Link><Link href={`/plan?${query}`} className="rounded-full px-4 py-2 text-xs font-bold text-ink/55">{t.planner}</Link><span className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{t.doctor}</span><Link href="/styles" className="rounded-full px-4 py-2 text-xs font-bold text-ink/55">{t.styles}</Link></nav>
          <Link href="/guide" className="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65">{t.guide}</Link>
        </header>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"><Link href={`/?${query}`} className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.calculator}</Link><Link href={`/plan?${query}`} className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.planner}</Link><span className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{t.doctor}</span><Link href="/styles" className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.styles}</Link></nav>

        <section className="py-9 sm:py-12"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{t.eyebrow}</p><h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-none sm:text-6xl">{t.title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-ink/55 sm:text-base">{t.intro}</p><div className="mt-6 max-w-3xl rounded-2xl border border-tomato/15 bg-tomato/[.06] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5"><div><strong className="text-sm text-tomato">{t.verify}</strong><p className="mt-1 text-xs leading-5 text-ink/55">{t.verifyBody}</p></div><Link href={`/?${query}#recipe-settings`} className="mt-3 block shrink-0 rounded-xl bg-white px-4 py-3 text-center text-xs font-extrabold text-ink shadow-sm sm:mt-0">{t.edit} →</Link></div><div className="mt-3 inline-flex flex-wrap gap-x-3 gap-y-1 rounded-2xl bg-leaf/[.08] px-4 py-3 text-xs text-ink/55"><strong className="text-leaf">{t.recipe}:</strong><span className="font-bold text-ink">{locale === "fi" ? pizzaStyle.nameFi : pizzaStyle.nameEn}</span><span>{flour.brand} {flour.name}</span><span>{settings.hydration} %</span><span>{settings.fermentation.replaceAll("-", " ")}</span></div></section>

        <section><h2 className="font-display text-3xl font-semibold">{t.choose}</h2><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">{doctorIssues.map((issue) => { const labels = issueCopy[locale][issue.id]; const active = selected === issue.id; const isReady = issue.id === "ready"; return <button key={issue.id} type="button" onClick={() => setSelected(issue.id)} aria-pressed={active} className={`group overflow-hidden rounded-2xl border text-left shadow-card transition active:scale-[.99] ${active ? "border-tomato bg-tomato text-white ring-4 ring-tomato/10" : "border-white bg-white"}`}><div className="relative aspect-square overflow-hidden bg-ink/5"><Image src={issue.image} alt={labels[0]} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.03]"/><span aria-hidden="true" className={`absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full border-2 border-white text-xl font-black text-white shadow-lg ${isReady ? "bg-leaf" : "bg-tomato"}`}>{isReady ? "✓" : "×"}</span></div><div className="p-3 sm:p-4"><strong className="block text-sm sm:text-base">{labels[0]}</strong><span className={`mt-1 hidden text-[11px] leading-4 sm:block ${active ? "text-white/65" : "text-ink/45"}`}>{labels[1]}</span></div></button>; })}</div></section>

        <section className="mt-7 overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-card" aria-live="polite">{diagnosis ? <><div className="grid gap-5 p-5 sm:p-7 md:grid-cols-3"><article><span className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#e8c98a]">01 · {t.likely}</span><p className="mt-3 text-sm leading-6 text-white/65">{diagnosis.cause}</p></article><article className="border-t border-white/10 pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0"><span className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#e8c98a]">02 · {t.now}</span><p className="mt-3 text-sm leading-6 text-white/65">{diagnosis.now}</p></article><article className="border-t border-white/10 pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0"><span className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#e8c98a]">03 · {t.next}</span><p className="mt-3 text-sm leading-6 text-white/65">{diagnosis.next}</p></article></div><div className="border-t border-white/10 bg-[#e8c98a]/10 p-5 sm:px-7"><span className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#e8c98a]">04 · {t.styleAdvice} · {locale === "fi" ? pizzaStyle.nameFi : pizzaStyle.nameEn}</span><p className="mt-2 text-sm leading-6 text-white/65">{diagnosis.styleNote}</p></div><div className="grid grid-cols-2 gap-2 border-t border-white/10 bg-white/[.04] p-4 sm:flex sm:justify-end"><Link href={`/?${query}`} className="rounded-xl border border-white/15 px-4 py-3 text-center text-xs font-bold text-white/70">{t.edit}</Link><Link href={`/plan?${query}`} className="rounded-xl bg-tomato px-4 py-3 text-center text-xs font-extrabold text-white">{t.plan}</Link></div></> : <p className="p-7 text-center text-sm text-white/50">{t.prompt}</p>}</section>
        <p className="mt-4 rounded-2xl bg-leaf/[.08] px-4 py-3 text-xs leading-5 text-ink/50">{t.note}</p>
        <footer className="mt-8 border-t border-ink/10 py-6"><AppSignature locale={locale}/></footer>
      </div>
    </main>
  );
}
