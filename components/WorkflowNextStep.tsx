"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Locale = "fi" | "en";

const nextSteps: Record<string, { route: string; fi: string; en: string }> = {
  "/": { route: "/plan", fi: "Avaa valmistusohje ja aikataulu", en: "Open instructions and schedule" },
  "/styles": { route: "/", fi: "Muokkaa valittua reseptiä laskurissa", en: "Fine-tune the selected recipe" },
  "/plan": { route: "/sauce", fi: "Laske seuraavaksi pizzakastike", en: "Calculate the pizza sauce next" },
  "/sauce": { route: "/toppings", fi: "Valitse juusto ja täytteet", en: "Choose cheese and toppings" },
  "/toppings": { route: "/costs", fi: "Laske koko pizzaillan kustannukset", en: "Calculate the full pizza-night cost" },
  "/costs": { route: "/journal", fi: "Tallenna lopputulos päiväkirjaan", en: "Save the result in your journal" },
  "/doctor": { route: "/plan", fi: "Avaa korjattu valmistussuunnitelma", en: "Open the adjusted preparation plan" },
  "/coach": { route: "/", fi: "Vie suositukset laskuriin", en: "Take the recommendations to the calculator" },
  "/guide": { route: "/styles", fi: "Tutustu pizzatyyleihin", en: "Explore pizza styles" },
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
    const stored = localStorage.getItem("doughtools-locale");
    setLocale(stored === "fi" || stored === "en" ? stored : navigator.language.toLowerCase().startsWith("fi") ? "fi" : "en");
    const updateQuery = () => setQuery(window.location.search);
    updateQuery();
    window.addEventListener("doughtools:urlchange", updateQuery);
    return () => window.removeEventListener("doughtools:urlchange", updateQuery);
  }, [pathname]);

  const step = nextSteps[pathname];
  if (!step) return null;

  return <aside className="border-t border-ink/10 bg-ink/[.035] px-4 py-7 text-ink sm:px-6" aria-label={locale === "fi" ? "Seuraava askel" : "Next step"}>
    <Link href={`${step.route}${query}`} className="mx-auto flex max-w-3xl items-center justify-between gap-5 rounded-2xl bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <span><small className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">{locale === "fi" ? "Seuraava askel" : "Next step"}</small><strong className="mt-1 block font-display text-xl sm:text-2xl">{locale === "fi" ? step.fi : step.en}</strong></span>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-xl text-white" aria-hidden="true">→</span>
    </Link>
  </aside>;
}
