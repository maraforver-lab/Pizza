"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Locale = "fi" | "en";

const navigation = {
  fi: {
    back: "Takaisin laskuriin",
    menu: "Kaikki osiot",
    close: "Sulje valikko",
    groups: [
      ["Suunnittele", [["/plan", "Valmistusohje ja aikataulu"], ["/styles", "Pizzatyylit"], ["/journal", "Päiväkirja"]]],
      ["Laske ja ratkaise", [["/sauce", "Kastikelaskuri"], ["/costs", "Kustannuslaskuri"], ["/doctor", "Taikinalääkäri"], ["/coach", "AI Pizza Coach"]]],
      ["Opi", [["/guide", "Ohjeet ja terminologia"], ["/history", "Pizzan historia"], ["/ovens", "Uuniopas"], ["/gear", "Varusteopas"]]],
      ["Yhteisö", [["/community", "Yhteisön reseptit"]]],
    ],
  },
  en: {
    back: "Back to calculator",
    menu: "All sections",
    close: "Close menu",
    groups: [
      ["Plan", [["/plan", "Instructions and schedule"], ["/styles", "Pizza styles"], ["/journal", "Pizza journal"]]],
      ["Calculate and solve", [["/sauce", "Sauce calculator"], ["/costs", "Cost calculator"], ["/doctor", "Dough Doctor"], ["/coach", "AI Pizza Coach"]]],
      ["Learn", [["/guide", "Guide and terminology"], ["/history", "Pizza history"], ["/ovens", "Oven guide"], ["/gear", "Gear guide"]]],
      ["Community", [["/community", "Community recipes"]]],
    ],
  },
} as const;

export default function GlobalToolNavigation() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("doughtools-locale");
    setLocale(stored === "fi" || stored === "en" ? stored : navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en");
    setQuery(window.location.search);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (pathname === "/") return null;

  const t = navigation[locale];
  const href = (route: string) => `${route}${query}`;

  return <>
    <div className="h-24" aria-hidden="true"/>
    {open && <button type="button" aria-label={t.close} onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default bg-ink/25 backdrop-blur-[2px]"/>}
    <nav aria-label={t.menu} className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-xl gap-2 rounded-2xl border border-white/70 bg-cream/95 p-2 shadow-2xl backdrop-blur-xl">
      <Link href={href("/")} className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-ink px-4 text-center text-xs font-extrabold text-white shadow-sm">← {t.back}</Link>
      <button type="button" onClick={() => setOpen(current => !current)} aria-expanded={open} className={`min-h-12 rounded-xl px-4 text-xs font-extrabold transition ${open ? "bg-tomato text-white" : "border border-ink/10 bg-white text-ink"}`}>☰ {t.menu}</button>
      {open && <div className="absolute inset-x-0 bottom-[calc(100%+0.6rem)] max-h-[min(70vh,34rem)] overflow-y-auto rounded-2xl border border-white/70 bg-cream p-4 text-ink shadow-2xl">
        <div className="flex items-center justify-between"><strong className="font-display text-2xl">Dough<span className="text-tomato">Tools</span></strong><button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-lg">×</button></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{t.groups.map(([group, links]) => <section key={group}><h2 className="text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">{group}</h2><div className="mt-2 grid gap-1">{links.map(([route, label]) => <Link key={route} href={href(route)} aria-current={pathname === route ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-xs font-bold ${pathname === route ? "bg-ink text-white" : "bg-white/70 text-ink/65 hover:bg-white"}`}>{label}{pathname === route ? " ·" : " →"}</Link>)}</div></section>)}</div>
      </div>}
    </nav>
  </>;
}
