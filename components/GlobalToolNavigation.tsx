"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Locale = "fi" | "sv" | "en";
type MenuId = "plan" | "solve" | "learn" | "mine" | "all";

const copy = {
  fi: {
    calculator: "Laskuri", plan: "Suunnittele", learn: "Opi", mine: "Omat", all: "Kaikki työkalut", menu: "Valikko", close: "Sulje valikko",
    groups: [
      ["Suunnittele", [["/styles", "Pizzatyylit"], ["/plan", "Valmistusohje ja aikataulu"], ["/timer", "Paistoajastin"], ["/sauce", "Kastikelaskuri"], ["/toppings", "Juusto ja täytteet"]]],
      ["Ratkaise", [["/doctor", "Taikinalääkäri"], ["/coach", "AI Pizza Coach"], ["/costs", "Kustannuslaskuri"]]],
      ["Opi ja varustaudu", [["/guide", "Ohjeet ja terminologia"], ["/ovens", "Uuniopas"], ["/gear", "Varusteopas"], ["/history", "Pizzan historia"]]],
      ["Omat ja yhteisö", [["/#my-recipes", "Omat reseptit"], ["/journal", "Pizzapäiväkirja"], ["/community", "Yhteisön reseptit"]]],
    ],
  },
  en: {
    calculator: "Calculator", plan: "Plan", learn: "Learn", mine: "Mine", all: "All tools", menu: "Menu", close: "Close menu",
    groups: [
      ["Plan", [["/styles", "Pizza styles"], ["/plan", "Instructions and schedule"], ["/timer", "Bake timer"], ["/sauce", "Sauce calculator"], ["/toppings", "Cheese and toppings"]]],
      ["Solve", [["/doctor", "Dough Doctor"], ["/coach", "AI Pizza Coach"], ["/costs", "Cost calculator"]]],
      ["Learn and equip", [["/guide", "Guide and terminology"], ["/ovens", "Oven guide"], ["/gear", "Gear guide"], ["/history", "Pizza history"]]],
      ["Mine and community", [["/#my-recipes", "Saved recipes"], ["/journal", "Pizza journal"], ["/community", "Community recipes"]]],
    ],
  },
  sv: {
    calculator: "Kalkylator", plan: "Planera", learn: "Lär dig", mine: "Mina", all: "Alla verktyg", menu: "Meny", close: "Stäng menyn",
    groups: [
      ["Planera", [["/styles", "Pizzastilar"], ["/plan", "Instruktioner och tidsplan"], ["/timer", "Gräddningstimer"], ["/sauce", "Såskalkylator"], ["/toppings", "Ost och toppingar"]]],
      ["Lös problem", [["/doctor", "Degläkaren"], ["/coach", "AI Pizza Coach"], ["/costs", "Kostnadskalkylator"]]],
      ["Lär dig och utrusta", [["/guide", "Guide och terminologi"], ["/ovens", "Ugnsguide"], ["/gear", "Utrustningsguide"], ["/history", "Pizzans historia"]]],
      ["Mina och gemenskap", [["/#my-recipes", "Sparade recept"], ["/journal", "Pizzadagbok"], ["/community", "Gemenskapens recept"]]],
    ],
  },
} as const;

const menuGroups: Record<Exclude<MenuId, "all">, number[]> = { plan: [0], solve: [1], learn: [2], mine: [3] };
const planRoutes = ["/styles", "/plan", "/timer", "/sauce", "/toppings"];
const learnRoutes = ["/guide", "/ovens", "/gear", "/history"];
const mineRoutes = ["/journal", "/community"];

export default function GlobalToolNavigation() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<MenuId | null>(null);

  useEffect(() => {
    const updateLocale = () => { const params = new URLSearchParams(window.location.search); const pageLocale = pathname === "/toppings" ? params.get("toppingsLang") : null; const stored = localStorage.getItem("doughtools-locale"); const browserLocale = navigator.language.toLowerCase(); setLocale(pageLocale === "fi" || pageLocale === "sv" || pageLocale === "en" ? pageLocale : stored === "fi" || stored === "sv" || stored === "en" ? stored : browserLocale.startsWith("fi") ? "fi" : browserLocale.startsWith("sv") ? "sv" : "en"); };
    const updateQuery = () => setQuery(window.location.search);
    updateLocale(); updateQuery(); setOpen(null);
    window.addEventListener("popstate", updateQuery);
    window.addEventListener("doughtools:urlchange", updateQuery);
    window.addEventListener("doughtools:localechange", updateLocale);
    return () => { window.removeEventListener("popstate", updateQuery); window.removeEventListener("doughtools:urlchange", updateQuery); window.removeEventListener("doughtools:localechange", updateLocale); };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const t = copy[locale];
  const href = (route: string) => { const [path, hash] = route.split("#"); return `${path}${query}${hash ? `#${hash}` : ""}`; };
  const changeLocale = (next: Locale) => { localStorage.setItem("doughtools-locale", next); if (pathname === "/toppings") { localStorage.setItem("doughtools-toppings-locale", next); const params = new URLSearchParams(window.location.search); params.set("toppingsLang", next); window.history.replaceState(null, "", `${pathname}?${params.toString()}`); } document.documentElement.lang = next; window.dispatchEvent(new Event("doughtools:localechange")); window.location.reload(); };
  const toggle = (menu: MenuId) => setOpen(current => current === menu ? null : menu);
  const active = (routes: readonly string[]) => routes.includes(pathname);
  const visibleGroups = open === "all" ? [0, 1, 2, 3] : open ? menuGroups[open as Exclude<MenuId, "all">] : [];

  const languageSwitch = <div className="flex rounded-full bg-ink/[.05] p-1" aria-label="Language / Språk / Kieli">
    {(["fi", "sv", "en"] as Locale[]).map(lang => <button key={lang} type="button" onClick={() => changeLocale(lang)} aria-pressed={locale === lang} className={`rounded-full px-2.5 py-1.5 text-[10px] font-extrabold uppercase ${locale === lang ? "bg-ink text-white" : "text-ink/45"}`}>{lang}</button>)}
  </div>;

  return <>
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/95 px-3 py-2.5 text-ink shadow-sm backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link href={href("/")} className="flex shrink-0 items-center gap-2" aria-label="DoughTools">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-lg text-white shadow-lg shadow-tomato/15">◉</span>
          <strong className="hidden text-lg tracking-tight sm:block">Dough<span className="text-tomato">Tools</span></strong>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label={t.all}>
          <Link href={href("/")} aria-current={pathname === "/" ? "page" : undefined} className={`rounded-full px-4 py-2 text-xs font-extrabold ${pathname === "/" ? "bg-ink text-white" : "text-ink/55 hover:bg-white"}`}>{t.calculator}</Link>
          <button type="button" onClick={() => toggle("plan")} aria-expanded={open === "plan"} className={`rounded-full px-4 py-2 text-xs font-extrabold ${active(planRoutes) || open === "plan" ? "bg-ink text-white" : "text-ink/55 hover:bg-white"}`}>{t.plan}⌄</button>
          <button type="button" onClick={() => toggle("learn")} aria-expanded={open === "learn"} className={`rounded-full px-4 py-2 text-xs font-extrabold ${active(learnRoutes) || open === "learn" ? "bg-ink text-white" : "text-ink/55 hover:bg-white"}`}>{t.learn}⌄</button>
          <button type="button" onClick={() => toggle("mine")} aria-expanded={open === "mine"} className={`rounded-full px-4 py-2 text-xs font-extrabold ${active(mineRoutes) || open === "mine" ? "bg-ink text-white" : "text-ink/55 hover:bg-white"}`}>{t.mine}⌄</button>
          <button type="button" onClick={() => toggle("all")} aria-expanded={open === "all"} className={`rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-extrabold ${open === "all" ? "border-tomato text-tomato" : "text-ink/65"}`}>☰ {t.all}</button>
        </nav>
        {languageSwitch}
      </div>
    </header>

    {open && <>
      <button type="button" aria-label={t.close} onClick={() => setOpen(null)} className="fixed inset-0 z-40 cursor-default bg-ink/25 backdrop-blur-[2px]"/>
      <div className="fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.7rem)] z-50 mx-auto max-h-[68vh] max-w-3xl overflow-y-auto rounded-3xl border border-white/70 bg-cream p-5 text-ink shadow-2xl md:bottom-auto md:top-[4.5rem]">
        <div className="flex items-center justify-between"><strong className="font-display text-2xl">Dough<span className="text-tomato">Tools</span></strong><button type="button" onClick={() => setOpen(null)} aria-label={t.close} className="grid h-10 w-10 place-items-center rounded-full bg-ink/5 text-xl">×</button></div>
        <div className={`mt-4 grid gap-4 ${visibleGroups.length > 1 ? "sm:grid-cols-2" : ""}`}>{visibleGroups.map(index => { const [group, links] = t.groups[index]; return <section key={group}><h2 className="text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">{group}</h2><div className="mt-2 grid gap-1.5">{links.map(([route, label]) => <Link key={route} href={href(route)} onClick={() => setOpen(null)} aria-current={pathname === route ? "page" : undefined} className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${pathname === route ? "bg-ink text-white" : "bg-white/75 text-ink/65 hover:bg-white"}`}><span>{label}</span><span aria-hidden="true">{pathname === route ? "●" : "→"}</span></Link>)}</div></section>; })}</div>
      </div>
    </>}

    <nav className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 grid grid-cols-4 gap-1 rounded-2xl border border-white/70 bg-cream/95 p-1.5 text-ink shadow-2xl backdrop-blur-xl md:hidden" aria-label={t.all}>
      <Link href={href("/")} aria-current={pathname === "/" ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-extrabold ${pathname === "/" ? "bg-ink text-white" : "text-ink/55"}`}><span className="text-base">⌂</span>{t.calculator}</Link>
      <Link href={href("/plan")} aria-current={pathname === "/plan" ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-extrabold ${active(planRoutes) ? "bg-ink text-white" : "text-ink/55"}`}><span className="text-base">◷</span>{t.plan}</Link>
      <button type="button" onClick={() => toggle("mine")} aria-expanded={open === "mine"} className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-extrabold ${active(mineRoutes) || open === "mine" ? "bg-ink text-white" : "text-ink/55"}`}><span className="text-base">♡</span>{t.mine}</button>
      <button type="button" onClick={() => toggle("all")} aria-expanded={open === "all"} className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-extrabold ${open === "all" || (!active(planRoutes) && !active(mineRoutes) && pathname !== "/") ? "bg-tomato text-white" : "text-ink/55"}`}><span className="text-base">☰</span>{t.menu}</button>
    </nav>
  </>;
}
