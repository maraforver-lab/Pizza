"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Locale = "fi" | "sv" | "en";

const nextSteps: Record<string, { route: string; fi: string; en: string; sv?: string }> = {
  "/": { route: "/plan", fi: "Avaa valmistusohje ja aikataulu", sv: "Öppna instruktioner och tidsplan", en: "Open instructions and schedule" },
  "/styles": { route: "/", fi: "Muokkaa valittua reseptiä laskurissa", sv: "Finjustera receptet i kalkylatorn", en: "Fine-tune the selected recipe" },
  "/plan": { route: "/sauce", fi: "Laske seuraavaksi pizzakastike", sv: "Beräkna pizzasåsen härnäst", en: "Calculate the pizza sauce next" },
  "/sauce": { route: "/toppings", fi: "Valitse juusto ja täytteet", sv: "Välj ost och toppingar", en: "Choose cheese and toppings" },
  "/toppings": { route: "/costs", fi: "Laske koko pizzaillan kustannukset", sv: "Beräkna kostnaden för hela pizzakvällen", en: "Calculate the full pizza-night cost" },
  "/timer": { route: "/journal", fi: "Kirjaa paiston tulos pizzapäiväkirjaan", sv: "Skriv in resultatet i pizzadagboken", en: "Record the bake in your pizza journal" },
  "/costs": { route: "/journal", fi: "Tallenna lopputulos päiväkirjaan", en: "Save the result in your journal" },
  "/doctor": { route: "/plan", fi: "Avaa korjattu valmistussuunnitelma", en: "Open the adjusted preparation plan" },
  "/coach": { route: "/", fi: "Vie suositukset laskuriin", en: "Take the recommendations to the calculator" },
  "/guide": { route: "/styles", fi: "Tutustu pizzatyyleihin", en: "Explore pizza styles" },
  "/updates": { route: "/", fi: "Kokeile uusinta versiota laskurissa", sv: "Prova den senaste versionen i kalkylatorn", en: "Try the latest version in the calculator" },
  "/history": { route: "/styles", fi: "Tutustu historiallisiin pizzatyyleihin", en: "Explore classic pizza styles" },
  "/ovens": { route: "/gear", fi: "Katso uunin kanssa tarvittavat varusteet", en: "See the gear needed with your oven" },
  "/gear": { route: "/plan", fi: "Siirry pizzaillan valmistussuunnitelmaan", en: "Continue to the pizza-night plan" },
  "/journal": { route: "/community", fi: "Tutustu yhteisön resepteihin", en: "Explore community recipes" },
  "/community": { route: "/", fi: "Avaa resepti laskurissa", en: "Open a recipe in the calculator" },
};

export default function WorkflowNextStep() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const pageLocale = pathname === "/toppings" ? new URLSearchParams(window.location.search).get("toppingsLang") : null;
    const stored = localStorage.getItem("doughtools-locale");
    const browserLocale = navigator.language.toLowerCase();
    setLocale(pageLocale === "fi" || pageLocale === "sv" || pageLocale === "en" ? pageLocale : stored === "fi" || stored === "sv" || stored === "en" ? stored : browserLocale.startsWith("fi") ? "fi" : browserLocale.startsWith("sv") ? "sv" : "en");
    const updateQuery = () => setQuery(window.location.search);
    updateQuery();
    window.addEventListener("doughtools:urlchange", updateQuery);
    return () => window.removeEventListener("doughtools:urlchange", updateQuery);
  }, [pathname]);

  const step = nextSteps[pathname];
  if (!step) return null;

  const nextLabel = locale === "fi" ? "Seuraava askel" : locale === "sv" ? "Nästa steg" : "Next step";
  return <aside className="border-t border-ink/10 bg-ink/[.035] px-4 py-7 text-ink sm:px-6" aria-label={nextLabel}>
    <Link href={`${step.route}${query}`} className="mx-auto flex max-w-3xl items-center justify-between gap-5 rounded-2xl bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <span><small className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">{nextLabel}</small><strong className="mt-1 block font-display text-xl sm:text-2xl">{locale === "fi" ? step.fi : locale === "sv" ? step.sv ?? step.en : step.en}</strong></span>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-xl text-white" aria-hidden="true">→</span>
    </Link>
  </aside>;
}
