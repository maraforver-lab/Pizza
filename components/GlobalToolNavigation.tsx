"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const copy = {
  account: "Sign in",
  accountActive: "Your account",
  tools: "Tools",
  quickCalculator: "Quick Dough Calculator",
  quickCalculatorDescription: "Standalone dough amounts, preferments, sizing and advanced tools.",
  toppingBalanceLab: "Topping Balance Lab",
  toppingBalanceLabDescription: "See how sauce, cheese, pizza size and moisture change the bake.",
  guide: "Guide",
  doughGuide: "Dough Guide",
  doughGuideDescription: "Step-by-step dough preparation from mixing to a ball ready to stretch.",
  guideGlossary: "Guide and glossary",
  guideGlossaryDescription: "Learn terminology, flour strength and dough principles.",
  sauceGuide: "Pizza Sauce Guide",
  sauceGuideDescription: "Learn sauce methods, tomato choices and sauce quantities.",
  pizzaStyles: "Pizza Styles",
  pizzaStylesDescription: "Compare styles and choose the pizza you want to make.",
  ovenGuide: "Oven Guide",
  ovenGuideDescription: "Understand home ovens, pizza ovens and bake trade-offs.",
  troubleshootingGuide: "Pizza Troubleshooting Guide",
  troubleshootingGuideDescription: "Fix common dough, topping and baking problems.",
  about: "About",
} as const;

const toolsMenuItems = [
  {
    href: "/calculator/quick",
    label: copy.quickCalculator,
    description: copy.quickCalculatorDescription,
  },
  {
    href: "/toppings",
    label: copy.toppingBalanceLab,
    description: copy.toppingBalanceLabDescription,
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
  const navigationRootRef = useRef<HTMLDivElement>(null);
  const guideButtonRef = useRef<HTMLButtonElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const guideMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const accountActive = pathname === "/account";
  const doughGuideActive = pathname === "/guides/dough";
  const guideGlossaryActive = pathname === "/guide";
  const sauceGuideActive = pathname === "/sauce";
  const pizzaStylesActive = pathname === "/styles";
  const ovenGuideActive = pathname === "/ovens";
  const troubleshootingGuideActive = pathname === "/guide/pizza-troubleshooting";
  const quickCalculatorActive = pathname === "/calculator/quick";
  const toppingBalanceLabActive = pathname === "/toppings";
  const aboutActive = pathname === "/about";

  useEffect(() => {
    document.documentElement.lang = "en";
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!guideMenuOpen && !toolsMenuOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!navigationRootRef.current?.contains(target)) {
        setOpenMenu(null);
        return;
      }
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        const trigger = openMenu === "guide" ? guideButtonRef.current : openMenu === "tools" ? toolsButtonRef.current : null;
        setOpenMenu(null);
        trigger?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [guideMenuOpen, openMenu, toolsMenuOpen]);

  const openMenuFromKeyboard = (menu: Exclude<OpenNavigationMenu, null>) => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpenMenu(menu);
      window.requestAnimationFrame(() => {
        const menuElement = menu === "guide" ? guideMenuRef.current : toolsMenuRef.current;
        const firstMenuItem = menuElement?.querySelector<HTMLElement>('[role="menuitem"]');
        firstMenuItem?.focus();
      });
    }
  };

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
    <header className="sticky top-0 z-[60] overflow-visible border-b border-ink/10 bg-cream/95 px-3 py-2.5 text-ink shadow-sm backdrop-blur-xl sm:px-6">
      <div ref={navigationRootRef} className="mx-auto flex max-w-7xl items-center justify-between gap-2 overflow-visible sm:gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          aria-label="DoughTools home"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-white shadow-lg shadow-tomato/15" aria-hidden="true">
            <DoughToolsIcon name="pizza" size={24} strokeWidth={2.2} />
          </span>
          <strong className="text-lg tracking-tight max-sm:sr-only">Dough<span className="text-tomato">Tools</span></strong>
        </Link>

        <div className="flex min-w-0 max-w-[calc(100vw-5.25rem)] items-center justify-start gap-1 overflow-visible sm:justify-end sm:gap-3">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <Link
              href="/about"
              aria-current={aboutActive ? "page" : undefined}
              className={`rounded-full px-3 py-2 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                aboutActive
                  ? "bg-white text-ink ring-1 ring-tomato/20"
                  : "text-ink/55 hover:bg-white/70 hover:text-ink"
              }`}
            >
              {copy.about}
            </Link>
          </nav>
          <div ref={guideMenuRef} className="relative">
            <button
              ref={guideButtonRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={guideMenuOpen}
              aria-controls="global-guide-menu"
              onClick={() => setOpenMenu((menu) => menu === "guide" ? null : "guide")}
              onKeyDown={openMenuFromKeyboard("guide")}
              className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-ink/10 bg-white/75 px-2.5 text-[11px] font-extrabold text-ink/65 shadow-sm transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:px-3"
            >
              {copy.guide}
              <DoughToolsIcon name="chevron-down" size={16} />
            </button>
            {guideMenuOpen && (
              <div id="global-guide-menu" className="absolute right-0 top-12 z-[70] w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:max-h-[calc(100vh-4.5rem)] max-sm:w-auto max-sm:overflow-y-auto" role="menu" aria-label="Guide menu">
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
                  href="/sauce"
                  role="menuitem"
                  aria-current={sauceGuideActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={guideMenuItemClass(sauceGuideActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.sauceGuide}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.sauceGuideDescription}</span>
                </Link>
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
                  href="/guide/pizza-troubleshooting"
                  role="menuitem"
                  aria-current={troubleshootingGuideActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={guideMenuItemClass(troubleshootingGuideActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.troubleshootingGuide}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.troubleshootingGuideDescription}</span>
                </Link>
                <Link
                  href="/styles"
                  role="menuitem"
                  aria-current={pizzaStylesActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={guideMenuItemClass(pizzaStylesActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.pizzaStyles}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.pizzaStylesDescription}</span>
                </Link>
                <Link
                  href="/ovens"
                  role="menuitem"
                  aria-current={ovenGuideActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={guideMenuItemClass(ovenGuideActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.ovenGuide}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.ovenGuideDescription}</span>
                </Link>
                <Link
                  href="/about"
                  role="menuitem"
                  aria-current={aboutActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={`${guideMenuItemClass(aboutActive)} lg:hidden`}
                >
                  <span className="block text-sm font-extrabold">{copy.about}</span>
                </Link>
              </div>
            )}
          </div>
          <div ref={toolsMenuRef} className="relative">
            <button
              ref={toolsButtonRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={toolsMenuOpen}
              aria-controls="global-tools-menu"
              onClick={() => setOpenMenu((menu) => menu === "tools" ? null : "tools")}
              onKeyDown={openMenuFromKeyboard("tools")}
              className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-ink/10 bg-white/75 px-2.5 text-[11px] font-extrabold text-ink/65 shadow-sm transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:px-3"
            >
              {copy.tools}
              <DoughToolsIcon name="chevron-down" size={16} />
            </button>
            {toolsMenuOpen && (
              <div id="global-tools-menu" className="absolute right-0 top-12 z-[70] w-64 rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto" role="menu" aria-label="Tools menu">
                {toolsMenuItems.map((item) => {
                  const active = item.href === "/calculator/quick" ? quickCalculatorActive : item.href === "/toppings" ? toppingBalanceLabActive : false;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpenMenu(null)}
                      className={guideMenuItemClass(active)}
                    >
                      <span className="block text-sm font-extrabold">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-ink/55">{item.description}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/account"
            aria-label={signedIn ? copy.accountActive : copy.account}
            aria-current={accountActive ? "page" : undefined}
            className={`group relative flex h-10 items-center gap-2 rounded-full border px-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:px-3 ${
              accountActive
                ? "border-ink bg-ink text-white"
                : signedIn
                  ? "border-leaf/20 bg-leaf/[.08] text-leaf"
                  : "border-ink/10 bg-white text-ink/55 hover:border-tomato/30 hover:text-tomato"
            }`}
          >
            <DoughToolsIcon name="account" size={20} strokeWidth={1.9} />
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
