"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { latestChange } from "@/lib/changelog";

type Locale = "fi" | "sv" | "en";

export default function LatestUpdateNotice() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<Locale>("en");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("doughtools-locale");
    const browserLocale = navigator.language.toLowerCase();
    const next = stored === "fi" || stored === "sv" || stored === "en" ? stored : browserLocale.startsWith("fi") ? "fi" : browserLocale.startsWith("sv") ? "sv" : "en";
    setLocale(next);
    setVisible(localStorage.getItem("doughtools-seen-update") !== latestChange.version);
  }, []);

  if (!visible || pathname === "/updates") return null;
  const text = locale === "fi" ? "Uutta DoughToolsissa" : locale === "sv" ? "Nytt i DoughTools" : "New in DoughTools";
  const action = locale === "fi" ? "Katso uusi ominaisuus" : locale === "sv" ? "Se den nya funktionen" : "See what is new";
  const close = locale === "fi" ? "Sulje" : locale === "sv" ? "Stäng" : "Close";
  const description = locale === "fi" ? latestChange.fi : latestChange.en;
  const dismiss = () => { localStorage.setItem("doughtools-seen-update", latestChange.version); setVisible(false); };

  return <aside className="border-b border-tomato/15 bg-[#fff0e9] px-3 py-3 text-ink"><div className="mx-auto flex max-w-7xl items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tomato text-lg text-white">✦</span><div className="min-w-0 flex-1"><strong className="block text-xs text-tomato">{text} · v{latestChange.version}</strong><span className="block truncate text-xs text-ink/55">{description}</span></div><Link href="/updates" onClick={dismiss} className="hidden rounded-full bg-tomato px-4 py-2 text-xs font-extrabold text-white sm:block">{action} →</Link><button type="button" onClick={dismiss} aria-label={close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-lg text-ink/45">×</button></div><Link href="/updates" onClick={dismiss} className="mx-auto mt-2 block max-w-7xl rounded-xl bg-tomato px-4 py-2 text-center text-xs font-extrabold text-white sm:hidden">{action} →</Link></aside>;
}
