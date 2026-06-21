"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppSignature from "@/components/AppSignature";
import { flourById } from "@/lib/flours";
import { pizzaStyles, type PizzaStyleId } from "@/lib/pizza-styles";
import { recipeParams } from "@/lib/recipe-url";

type Locale = "fi" | "en";

const copy = {
  fi: {
    calculator: "Laskuri", planner: "Aikataulu", doctor: "Taikinalääkäri", styles: "Pizzatyylit", guide: "Ohjeet & termit", eyebrow: "Pizza Style Library", title: "Valitse pizza, jonka haluat tehdä.", intro: "Jokainen tyyli käyttää sille sopivaa pallopainoa, hydraatiota, jauhoa, kohotusta ja uunia. Voit siirtää asetukset yhdellä painalluksella laskuriin.", use: "Käytä tätä tyyliä", balls: "palloa", pan: "pannu", flour: "Jauho", fermentation: "Kohotus", hydration: "Hydraatio", bake: "Paisto", note: "Asetukset ovat testattavia lähtökohtia, eivät yhden ainoan oikean reseptin väite. Hienosäädä niitä oman uunisi ja jauhoeräsi mukaan.",
    names: { neapolitan: "Klassinen napolilainen", contemporary: "Contemporary Neapolitan", "new-york": "New York", "roman-thin": "Roomalainen ohut", detroit: "Detroit", sicilian: "Sisilialainen" },
    descriptions: { neapolitan: "Pehmeä ohut keskusta, ilmava leopardipilkullinen reuna ja hyvin nopea paisto kuumassa pizzauunissa.", contemporary: "Erittäin korkea ja avoin canotto-reuna. Suurempi hydraatio ja vahva jauho vaativat hellää käsittelyä.", "new-york": "Suuri, ohut ja taitettava pala. Pohja on rapea mutta keskusta säilyy joustavana.", "roman-thin": "Hyvin ohut, matala ja rouskuvan rapea tonda romana ilman suurta reunusta.", detroit: "Paksu suorakulmainen pannupizza, ilmava sisus ja tumma karamellisoitunut juustoreuna.", sicilian: "Pehmeä ja ilmava suorakulmainen pannupizza, jonka pohja on öljyisen kullanrapeaksi paistunut." },
    ferment: { "6h-room": "6 h huone", "12h-room": "12 h huone", "24h-room": "24 h huone", "24h-cold": "24 h kylmä", "48h-cold": "48 h kylmä" },
  },
  en: {
    calculator: "Calculator", planner: "Planner", doctor: "Dough Doctor", styles: "Pizza styles", guide: "Guide & glossary", eyebrow: "Pizza Style Library", title: "Choose the pizza you want to make.", intro: "Each style uses a suitable ball weight, hydration, flour, fermentation and oven. Apply every setting to the calculator with one tap.", use: "Use this style", balls: "balls", pan: "pan", flour: "Flour", fermentation: "Fermentation", hydration: "Hydration", bake: "Bake", note: "These settings are practical starting points, not claims of one uniquely correct recipe. Fine-tune them for your oven and flour batch.",
    names: { neapolitan: "Classic Neapolitan", contemporary: "Contemporary Neapolitan", "new-york": "New York", "roman-thin": "Roman thin", detroit: "Detroit", sicilian: "Sicilian" },
    descriptions: { neapolitan: "A soft thin centre, airy leopard-spotted rim, and a very fast bake in a hot pizza oven.", contemporary: "A dramatically tall, open canotto rim. Higher hydration and strong flour call for gentle handling.", "new-york": "A large, thin and foldable slice. The base is crisp while the centre remains flexible.", "roman-thin": "An extremely thin, low and crunchy tonda romana without a large rim.", detroit: "A thick rectangular pan pizza with an airy crumb and dark caramelised cheese crown.", sicilian: "A soft airy rectangular pan pizza with an oil-crisped golden base." },
    ferment: { "6h-room": "6h room", "12h-room": "12h room", "24h-room": "24h room", "24h-cold": "24h cold", "48h-cold": "48h cold" },
  },
} as const;

export default function StylesPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [ready, setReady] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    const stored = window.localStorage.getItem("doughtools-locale") as Locale | null;
    const next = stored === "fi" || stored === "en" ? stored : navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en";
    setLocale(next); document.documentElement.lang = next; setReady(true);
  }, []);

  if (!ready) return <main className="min-h-screen bg-cream" />;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4"><Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-lg shadow-tomato/20"><svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 15.5C7.8 7.9 17.6 5 20 7c-.3 6.4-4.9 12.1-12 12.5-3.4.2-5.3-1.4-4-4Z"/><circle cx="10" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg></span><span className="text-lg font-extrabold tracking-tight">Dough<span className="text-tomato">Tools</span></span></Link><nav className="hidden items-center gap-1 rounded-full border border-ink/10 bg-white/70 p-1 lg:flex"><Link href="/" className="rounded-full px-4 py-2 text-xs font-bold text-ink/55">{t.calculator}</Link><Link href="/plan" className="rounded-full px-4 py-2 text-xs font-bold text-ink/55">{t.planner}</Link><Link href="/doctor" className="rounded-full px-4 py-2 text-xs font-bold text-ink/55">{t.doctor}</Link><span className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{t.styles}</span></nav><Link href="/guide" className="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-xs font-bold text-ink/65">{t.guide}</Link></header>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden"><Link href="/" className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.calculator}</Link><Link href="/plan" className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.planner}</Link><Link href="/doctor" className="shrink-0 rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-bold">{t.doctor}</Link><span className="shrink-0 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{t.styles}</span></nav>

        <section className="py-9 sm:py-12"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{t.eyebrow}</p><h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-none sm:text-6xl">{t.title}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-ink/55 sm:text-base">{t.intro}</p></section>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{pizzaStyles.map((style) => { const flour = flourById(style.settings.flourId); const countLabel = style.id === "detroit" || style.id === "sicilian" ? `1 ${t.pan}` : `${style.settings.pizzas} ${t.balls}`; return <article key={style.id} className="overflow-hidden rounded-[1.5rem] border border-white bg-white/80 shadow-card"><div className="relative aspect-square overflow-hidden bg-ink/5"><Image src={style.image} alt={t.names[style.id as PizzaStyleId]} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition duration-300 hover:scale-[1.02]"/><span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white">{style.diameter}</span></div><div className="p-5"><h2 className="font-display text-2xl font-semibold">{t.names[style.id as PizzaStyleId]}</h2><p className="mt-2 min-h-16 text-sm leading-6 text-ink/55">{t.descriptions[style.id as PizzaStyleId]}</p><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-ink/10 py-4 text-xs"><dt className="text-ink/40">{countLabel}</dt><dd className="text-right font-bold">{style.settings.ballWeight} g</dd><dt className="text-ink/40">{t.hydration}</dt><dd className="text-right font-bold">{style.settings.hydration} %</dd><dt className="text-ink/40">{t.flour}</dt><dd className="truncate text-right font-bold">{flour.brand} {flour.name}</dd><dt className="text-ink/40">{t.fermentation}</dt><dd className="text-right font-bold">{style.settings.fermentation.replaceAll("-", " ")}</dd><dt className="text-ink/40">{t.bake}</dt><dd className="text-right font-bold">{style.bake}</dd></dl><Link href={`/?${recipeParams(style.settings).toString()}`} className="mt-4 block rounded-xl bg-tomato px-4 py-3 text-center text-sm font-extrabold text-white transition active:scale-[.98]">{t.use} →</Link></div></article>; })}</section>
        <p className="mt-6 rounded-2xl bg-leaf/[.08] px-4 py-3 text-xs leading-5 text-ink/50">{t.note}</p>
        <footer className="mt-8 border-t border-ink/10 py-6"><AppSignature locale={locale}/></footer>
      </div>
    </main>
  );
}
