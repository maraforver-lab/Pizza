"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const copy = {
  tools: "Tools",
  calculator: "Pizza dough calculator",
  calculatorDescription: "Calculate flour, water, salt and yeast.",
  calculatorV1: "Calculator v1",
  calculatorV1Description: "Full-control planning lab for dough variables and risk.",
  calculatorV2: "Calculator v2",
  calculatorV2Description: "Guided recommendation from bake time and ingredients.",
  guide: "Guide",
  guideGlossary: "Guide and glossary",
  guideGlossaryDescription: "Learn terminology, flour strength and dough principles.",
  troubleshootingGuide: "Pizza Troubleshooting Guide",
  troubleshootingGuideDescription: "Fix common dough, topping and baking problems.",
  lab: "Lab",
  about: "About",
  startSession: "Start Pizza Session",
} as const;

export default function GlobalToolNavigation() {
  const pathname = usePathname();
  const [guideMenuOpen, setGuideMenuOpen] = useState(false);
  const guideMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    setGuideMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!guideMenuOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!guideMenuRef.current?.contains(event.target as Node)) {
        setGuideMenuOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGuideMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [guideMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/95 px-3 py-2.5 text-ink shadow-sm backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          aria-label="DoughTools home"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-lg text-white shadow-lg shadow-tomato/15" aria-hidden="true">◉</span>
          <strong className="text-lg tracking-tight">Dough<span className="text-tomato">Tools</span></strong>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <div ref={guideMenuRef} className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={guideMenuOpen}
                onClick={() => setGuideMenuOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-extrabold text-ink/55 transition hover:bg-white/70 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                {copy.guide}
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2">
                  <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {guideMenuOpen && (
                <div className="absolute left-0 top-10 z-50 w-72 rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur" role="menu" aria-label="Guide menu">
                  <Link
                    href="/guide"
                    role="menuitem"
                    onClick={() => setGuideMenuOpen(false)}
                    className="block rounded-xl px-3 py-3 transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                  >
                    <span className="block text-sm font-extrabold">{copy.guideGlossary}</span>
                    <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.guideGlossaryDescription}</span>
                  </Link>
                  <Link
                    href="/guide/pizza-troubleshooting"
                    role="menuitem"
                    onClick={() => setGuideMenuOpen(false)}
                    className="block rounded-xl px-3 py-3 transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                  >
                    <span className="block text-sm font-extrabold">{copy.troubleshootingGuide}</span>
                    <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.troubleshootingGuideDescription}</span>
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/?calculator=1"
              className="rounded-full px-3 py-2 text-xs font-extrabold text-ink/55 transition hover:bg-white/70 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {copy.lab}
            </Link>
            <Link
              href="/about"
              className="rounded-full px-3 py-2 text-xs font-extrabold text-ink/55 transition hover:bg-white/70 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {copy.about}
            </Link>
          </nav>
          <details className="group relative">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-ink/10 bg-white/75 px-3 text-[11px] font-extrabold text-ink/65 shadow-sm transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream [&::-webkit-details-marker]:hidden">
              {copy.tools}
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2">
                <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur">
              <Link
                href="/?calculator=1"
                className="block rounded-xl px-3 py-3 transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                <span className="block text-sm font-extrabold">{copy.calculator}</span>
                <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.calculatorDescription}</span>
              </Link>
              <Link
                href="/?calculator=1"
                className="block rounded-xl px-3 py-3 transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                <span className="block text-sm font-extrabold">{copy.calculatorV1}</span>
                <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.calculatorV1Description}</span>
              </Link>
              <Link
                href="/?calculator=2"
                className="block rounded-xl px-3 py-3 transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
              >
                <span className="block text-sm font-extrabold">{copy.calculatorV2}</span>
                <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.calculatorV2Description}</span>
              </Link>
            </div>
          </details>

          <Link
            href="/session/start"
            className="hidden h-10 items-center justify-center rounded-full bg-tomato px-4 text-[11px] font-extrabold text-white shadow-sm shadow-tomato/15 transition hover:bg-tomato/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:inline-flex"
          >
            {copy.startSession}
          </Link>
        </div>
      </div>
    </header>
  );
}
