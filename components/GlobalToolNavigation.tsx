"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const copy = {
  account: "Account",
  accountActive: "Account",
  menu: "Menu",
  plan: "Plan my next pizza",
  learning: "Learning Center",
  learningDescription: "Dough, sauce, ovens, styles and troubleshooting.",
  quickCalculator: "Quick Calculator",
  quickCalculatorDescription: "Fast standalone dough amounts without a Pizza Session.",
  doughGuide: "Dough Guide",
  doughGuideDescription: "Step-by-step dough preparation from mixing to a ball ready to stretch.",
  sauceGuide: "Pizza Sauce",
  sauceGuideDescription: "Sauce methods, tomato choices and practical quantities.",
  pizzaStyles: "Pizza Styles",
  pizzaStylesDescription: "Compare styles and choose the pizza you want to make.",
  ovens: "Ovens",
  ovensDescription: "Compare home ovens, pizza ovens and bake trade-offs.",
  troubleshooting: "Troubleshooting",
  troubleshootingDescription: "Fix common dough, topping and baking problems.",
  about: "About",
} as const;

const learningMenuItems = [
  {
    href: "/guide",
    label: copy.learning,
    description: copy.learningDescription,
  },
  {
    href: "/guides/dough",
    label: copy.doughGuide,
    description: copy.doughGuideDescription,
  },
  {
    href: "/sauce",
    label: copy.sauceGuide,
    description: copy.sauceGuideDescription,
  },
  {
    href: "/ovens",
    label: copy.ovens,
    description: copy.ovensDescription,
  },
  {
    href: "/styles",
    label: copy.pizzaStyles,
    description: copy.pizzaStylesDescription,
  },
  {
    href: "/guide/pizza-troubleshooting",
    label: copy.troubleshooting,
    description: copy.troubleshootingDescription,
  },
] as const;

type OpenNavigationMenu = "learning" | "mobile" | null;

function menuItemClass(active: boolean, emphasis: "normal" | "primary" = "normal") {
  if (emphasis === "primary") {
    return `block rounded-xl px-3 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
      active
        ? "bg-tomato text-white ring-1 ring-tomato/20"
        : "bg-ink text-white hover:bg-forest"
    }`;
  }

  return `block rounded-xl px-3 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
    active
      ? "bg-cream text-ink ring-1 ring-tomato/20"
      : "hover:bg-cream"
  }`;
}

function navLinkClass(active: boolean, emphasis: "normal" | "primary" = "normal") {
  if (emphasis === "primary") {
    return `inline-flex min-h-10 items-center justify-center rounded-full px-4 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
      active
        ? "bg-ink text-white"
        : "bg-tomato text-white shadow-sm shadow-tomato/15 hover:bg-forest"
    }`;
  }

  return `inline-flex min-h-10 items-center justify-center rounded-full px-3 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
    active
      ? "bg-white text-ink ring-1 ring-tomato/20"
      : "text-ink/60 hover:bg-white/75 hover:text-ink"
  }`;
}

export default function GlobalToolNavigation() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [authPulse, setAuthPulse] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenNavigationMenu>(null);
  const learningMenuOpen = openMenu === "learning";
  const mobileMenuOpen = openMenu === "mobile";
  const navigationRootRef = useRef<HTMLDivElement>(null);
  const learningButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const learningMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const startActive = pathname === "/session/start";
  const accountActive = pathname === "/account";
  const doughGuideActive = pathname === "/guides/dough";
  const learningCenterActive = pathname === "/guide";
  const sauceGuideActive = pathname === "/sauce";
  const pizzaStylesActive = pathname === "/styles";
  const ovensActive = pathname === "/ovens";
  const troubleshootingActive = pathname === "/guide/pizza-troubleshooting";
  const quickCalculatorActive = pathname === "/calculator/quick";
  const aboutActive = pathname === "/about";

  useEffect(() => {
    document.documentElement.lang = "en";
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!learningMenuOpen && !mobileMenuOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!navigationRootRef.current?.contains(target)) {
        setOpenMenu(null);
      }
    };

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        const trigger = openMenu === "learning" ? learningButtonRef.current : openMenu === "mobile" ? mobileButtonRef.current : null;
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
  }, [learningMenuOpen, mobileMenuOpen, openMenu]);

  const openMenuFromKeyboard = (menu: Exclude<OpenNavigationMenu, null>) => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpenMenu(menu);
      window.requestAnimationFrame(() => {
        const menuElement = menu === "learning" ? learningMenuRef.current : mobileMenuRef.current;
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

  const learningActiveByHref = (href: string) => {
    if (href === "/guide") return learningCenterActive;
    if (href === "/guides/dough") return doughGuideActive;
    if (href === "/sauce") return sauceGuideActive;
    if (href === "/ovens") return ovensActive;
    if (href === "/styles") return pizzaStylesActive;
    if (href === "/guide/pizza-troubleshooting") return troubleshootingActive;
    return false;
  };

  const accountLink = (
    <Link
      href="/account"
      aria-label={copy.account}
      aria-current={accountActive ? "page" : undefined}
      onClick={() => setOpenMenu(null)}
      className={`group relative inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
        accountActive
          ? "bg-ink text-white"
          : signedIn
            ? "bg-leaf/[.08] text-leaf ring-1 ring-leaf/20 hover:bg-leaf/[.12]"
            : "text-ink/60 hover:bg-white/75 hover:text-ink"
      }`}
    >
      <DoughToolsIcon name="account" size={20} strokeWidth={1.9} />
      <span>{copy.accountActive}</span>
      {signedIn && (
        <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-cream bg-leaf" aria-hidden="true">
          <span className={`absolute h-full w-full rounded-full bg-leaf ${authPulse ? "animate-ping" : ""}`} />
        </span>
      )}
    </Link>
  );

  const mobileAccountLink = (
    <Link
      href="/account"
      role="menuitem"
      aria-label={copy.account}
      aria-current={accountActive ? "page" : undefined}
      onClick={() => setOpenMenu(null)}
      className={menuItemClass(accountActive)}
    >
      <span className="flex items-center gap-2 text-sm font-extrabold">
        <DoughToolsIcon name="account" size={20} strokeWidth={1.9} />
        {copy.account}
      </span>
      {signedIn && <span className="mt-1 block text-xs leading-5 text-leaf">Signed in</span>}
    </Link>
  );

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

        <div className="flex min-w-0 items-center justify-end gap-1 overflow-visible sm:gap-2">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <Link href="/session/start" aria-current={startActive ? "page" : undefined} className={navLinkClass(startActive, "primary")}>
              {copy.plan}
            </Link>
            <div ref={learningMenuRef} className="relative">
              <button
                ref={learningButtonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={learningMenuOpen}
                aria-controls="global-learning-menu"
                onClick={() => setOpenMenu((menu) => menu === "learning" ? null : "learning")}
                onKeyDown={openMenuFromKeyboard("learning")}
                className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border border-ink/10 bg-white/75 px-3 text-xs font-extrabold text-ink/65 shadow-sm transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                {copy.learning}
                <DoughToolsIcon name="chevron-down" size={16} />
              </button>
              {learningMenuOpen && (
                <div id="global-learning-menu" className="absolute right-0 top-12 z-[70] w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur" role="menu" aria-label="Learning Center menu">
                  {learningMenuItems.map((item) => {
                    const active = learningActiveByHref(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpenMenu(null)}
                        className={menuItemClass(active)}
                      >
                        <span className="block text-sm font-extrabold">{item.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-ink/55">{item.description}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            <Link href="/calculator/quick" aria-current={quickCalculatorActive ? "page" : undefined} className={navLinkClass(quickCalculatorActive)}>
              {copy.quickCalculator}
            </Link>
            <Link href="/about" aria-current={aboutActive ? "page" : undefined} className={navLinkClass(aboutActive)}>
              {copy.about}
            </Link>
            {accountLink}
          </nav>

          <div ref={mobileMenuRef} className="relative lg:hidden">
            <button
              ref={mobileButtonRef}
              type="button"
              aria-haspopup="menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="global-mobile-menu"
              aria-label="Open DoughTools navigation menu"
              onClick={() => setOpenMenu((menu) => menu === "mobile" ? null : "mobile")}
              onKeyDown={openMenuFromKeyboard("mobile")}
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-ink/10 bg-white/80 px-3 text-xs font-extrabold text-ink/65 shadow-sm transition hover:border-tomato/30 hover:text-tomato focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <DoughToolsIcon name="menu" size={20} />
              {copy.menu}
            </button>
            {mobileMenuOpen && (
              <div id="global-mobile-menu" className="fixed left-3 right-3 top-14 z-[70] max-h-[calc(100vh-4.5rem)] overflow-y-auto rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur" role="menu" aria-label="Mobile navigation menu">
                <Link
                  href="/session/start"
                  role="menuitem"
                  aria-current={startActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={menuItemClass(startActive, "primary")}
                >
                  <span className="block text-sm font-extrabold">{copy.plan}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/72">Create the guided recipe, shopping, timeline, Kitchen Mode and review flow.</span>
                </Link>
                <div className="mt-2 rounded-xl border border-ink/10 p-2" role="none">
                  <p className="px-1 pb-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-ink/38">{copy.learning}</p>
                  {learningMenuItems.map((item) => {
                    const active = learningActiveByHref(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpenMenu(null)}
                        className={menuItemClass(active)}
                      >
                        <span className="block text-sm font-extrabold">{item.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-ink/55">{item.description}</span>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href="/calculator/quick"
                  role="menuitem"
                  aria-current={quickCalculatorActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={menuItemClass(quickCalculatorActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.quickCalculator}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink/55">{copy.quickCalculatorDescription}</span>
                </Link>
                <Link
                  href="/about"
                  role="menuitem"
                  aria-current={aboutActive ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={menuItemClass(aboutActive)}
                >
                  <span className="block text-sm font-extrabold">{copy.about}</span>
                </Link>
                {mobileAccountLink}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
