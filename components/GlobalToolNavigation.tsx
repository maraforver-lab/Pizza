"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const copy = {
  account: "Sign in",
  accountActive: "Your account",
  tools: "Tools",
  calculatorV2: "Calculator v2",
  calculatorV2Description: "Guided recommendation from bake time and ingredients.",
  guide: "Guide",
  doughGuide: "Dough Guide",
  doughGuideDescription: "Step-by-step dough preparation from mixing to a ball ready to stretch.",
  guideGlossary: "Guide and glossary",
  guideGlossaryDescription: "Learn terminology, flour strength and dough principles.",
  troubleshootingGuide: "Pizza Troubleshooting Guide",
  troubleshootingGuideDescription: "Fix common dough, topping and baking problems.",
  about: "About",
} as const;

const toolsMenuItems = [
  {
    href: "/?calculator=2",
    label: copy.calculatorV2,
    description: copy.calculatorV2Description,
  },
] as const;

type OpenNavigationMenu = "guide" | "tools" | null;

function guideMenuItemClass(active: boolean) {
  return `block rounded-xl px-3 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
    active
      ? "bg-cream text-ink ring-1 ring-tomato/20"
      : "hover:bg-cream"
  }`;
}

export default function GlobalToolNavigation() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [authPulse, setAuthPulse] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenNavigationMenu>(null);
  const guideMenuOpen = openMenu === "guide";
  const toolsMenuOpen = openMenu === "tools";
  const guideMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const accountActive = pathname === "/account";
  const doughGuideActive = pathname === "/guides/dough";
  const guideGlossaryActive = pathname === "/guide";
  const troubleshootingGuideActive = pathname === "/guide/pizza-troubleshooting";

  useEffect(() => {
    document.documentElement.lang = "en";
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!guideMenuOpen && !toolsMenuOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (guideMenuOpen && !guideMenuRef.current?.contains(target)) {
        setOpenMenu(null);
      }
      if (toolsMenuOpen && !toolsMenuRef.current?.contains(target)) {
        setOpenMenu(null);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [guideMenuOpen, toolsMenuOpen]);

  useEffect(() => {
    let pulseTimer: number | undefined;
    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session?.user)));
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        setSignedIn(Boolean(session?.user));
        if (event === "SIGNED_IN") {
          setAuthPulse(true);
          window.clearTimeout(pulseTimer);
          pulseTimer = window.setTimeout(() => setAuthPulse(false), 3500);
        }
      });
      return () => {
        window.clearTimeout(pulseTimer);
        data.subscription.unsubscribe();
      };
    } catch {
      setSignedIn(false);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/95 px-3 py-2.5 text-ink shadow-sm backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          aria-label="DoughTools home"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-lg text-white shadow-lg shadow-tomato/15" aria-hidden="true">◉</span>
          <strong className="text-lg tracking-tight max-sm:sr-only">Dough<span className="text-tomato">Tools</span></strong>
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <Link
              href="/about"
              className="rounded-full px-3 py-2 text-xs font-extrabold text-ink/55 transition hover:bg-white/70 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {copy.about}
            </Link>
          </nav>
          <div ref={guideMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={guideMenuOpen}
              aria-controls="global-guide-menu"
              onClick={() => setOpenMenu((menu) => menu === "guide" ? null : "guide")}
              className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-ink/10 bg-white/75 px-3 text-[11px] font-extrabold text-ink/65 shadow-sm transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {copy.guide}
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2">
                <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {guideMenuOpen && (
              <div id="global-guide-menu" className="absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto" role="menu" aria-label="Guide menu">
                <Link
                  href="/guides/dough"
                  role="menuitem"
                  aria-current={doughGuideActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={guideMenuItemClass(doughGuideActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.doughGuide}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.doughGuideDescription}</span>
                </Link>
                <Link
                  href="/guide"
                  role="menuitem"
                  aria-current={guideGlossaryActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={guideMenuItemClass(guideGlossaryActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.guideGlossary}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.guideGlossaryDescription}</span>
                </Link>
                <Link
                  href="/guide/pizza-troubleshooting"
                  role="menuitem"
                  aria-current={troubleshootingGuideActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={guideMenuItemClass(troubleshootingGuideActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.troubleshootingGuide}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.troubleshootingGuideDescription}</span>
                </Link>
              </div>
            )}
          </div>
          <div ref={toolsMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={toolsMenuOpen}
              aria-controls="global-tools-menu"
              onClick={() => setOpenMenu((menu) => menu === "tools" ? null : "tools")}
              className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-ink/10 bg-white/75 px-3 text-[11px] font-extrabold text-ink/65 shadow-sm transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {copy.tools}
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2">
                <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {toolsMenuOpen && (
              <div id="global-tools-menu" className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto" role="menu" aria-label="Tools menu">
                {toolsMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                    className="block rounded-xl px-3 py-3 transition hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
                  >
                    <span className="block text-sm font-extrabold">{item.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-ink/55">{item.description}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/account"
            aria-label={signedIn ? copy.accountActive : copy.account}
            aria-current={accountActive ? "page" : undefined}
            className={`group relative flex h-10 items-center gap-2 rounded-full border px-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
              accountActive
                ? "border-ink bg-ink text-white"
                : signedIn
                  ? "border-leaf/20 bg-leaf/[.08] text-leaf"
                  : "border-ink/10 bg-white text-ink/55 hover:border-tomato/30 hover:text-tomato"
            }`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-extrabold max-sm:sr-only">{signedIn ? copy.accountActive : copy.account}</span>
            {signedIn && (
              <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-cream bg-leaf" aria-hidden="true">
                <span className={`absolute h-full w-full rounded-full bg-leaf ${authPulse ? "animate-ping" : ""}`} />
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
