"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from "react";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";
import {
  resolveCanonicalActivePizzaSession,
  type CanonicalActivePizzaSessionResolution,
} from "@/lib/canonical-active-pizza-session";
import type { PizzaSession } from "@/lib/pizza-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const copy = {
  account: "Account",
  accountActive: "Account",
  signIn: "Sign in",
  signInDescription: "Save your pizza plans and continue on another device.",
  myAccount: "Account",
  myAccountDescription: "Manage your pizza plans and preferences.",
  checkingAccount: "Checking account...",
  menu: "Menu",
  plan: "Plan a pizza",
  mobileStartPizza: "Plan a pizza",
  mobileContinuePizza: "Continue making your pizza",
  mobileCheckingPizza: "Checking your pizza...",
  mobilePizzaFallback: "Continue your pizza plan",
  mobileStartPizzaDescription: "Create a guided plan for Dough Plan, Shopping list, Timeline, Kitchen and Review.",
  learning: "Pizza guides",
  learningDescription: "Dough, sauce, ovens, styles and troubleshooting.",
  quickCalculator: "Quick dough calculator",
  quickCalculatorDescription: "Fast standalone dough amounts without starting a full pizza plan.",
  mobileBakeTimer: "Bake timer",
  mobileBakeTimerDescription: "Time one pizza without starting a pizza plan.",
  mobileQuickCalculator: "Quick dough calculator",
  mobileQuickCalculatorDescription: "Calculate dough amounts without starting a full pizza plan.",
  mobileLearn: "Pizza guides",
  mobileLearnDescription: "Practical guides for dough, sauce, ovens and common problems.",
  doughGuide: "Make the dough",
  doughGuideDescription: "Step-by-step dough preparation from mixing to a ball ready to stretch.",
  sauceGuide: "Make the sauce",
  sauceGuideDescription: "Sauce methods, tomato choices and practical quantities.",
  toppingsGuide: "Choose toppings",
  toppingsGuideDescription: "Balance sauce, cheese and topping moisture before baking.",
  pizzaStyles: "Choose your pizza",
  pizzaStylesDescription: "Compare styles and choose the pizza you want to make.",
  ovens: "Choose your oven",
  ovensDescription: "Compare home ovens, pizza ovens and bake trade-offs.",
  troubleshooting: "Fix pizza problems",
  troubleshootingDescription: "Fix common dough, topping and baking problems.",
  practicalTips: "Practical pizza tips",
  practicalTipsDescription: "Storage, timing and common pizza-making fixes.",
  about: "About",
  aboutDoughTools: "About DoughTools",
} as const;

const emptyDecision: CanonicalActivePizzaSessionResolution = {
  state: "empty",
  signedIn: false,
  source: "none",
  session: null,
  cloudRow: null,
  href: "/session/start",
};

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
    href: "/toppings",
    label: copy.toppingsGuide,
    description: copy.toppingsGuideDescription,
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
    href: "/guide/practical-pizza-tips",
    label: copy.practicalTips,
    description: copy.practicalTipsDescription,
  },
  {
    href: "/guide/pizza-troubleshooting",
    label: copy.troubleshooting,
    description: copy.troubleshootingDescription,
  },
] as const;

const mobileLearningItems = [
  {
    href: "/guides/dough",
    label: copy.doughGuide,
  },
  {
    href: "/sauce",
    label: copy.sauceGuide,
  },
  {
    href: "/toppings",
    label: copy.toppingsGuide,
  },
  {
    href: "/ovens",
    label: copy.ovens,
  },
  {
    href: "/styles",
    label: copy.pizzaStyles,
  },
  {
    href: "/guide/practical-pizza-tips",
    label: copy.practicalTips,
  },
  {
    href: "/guide/pizza-troubleshooting",
    label: copy.troubleshooting,
  },
  {
    href: "/guide",
    label: copy.learning,
    secondary: true,
  },
] as const;

const mobileToolItems = [
  {
    href: "/tools/bake-timer",
    label: copy.mobileBakeTimer,
    description: copy.mobileBakeTimerDescription,
    icon: "timer" satisfies DoughToolsIconName,
  },
  {
    href: "/calculator/quick",
    label: copy.mobileQuickCalculator,
    description: copy.mobileQuickCalculatorDescription,
    icon: "scale" satisfies DoughToolsIconName,
  },
] as const;

type OpenNavigationMenu = "learning" | "mobile" | null;
type AuthStatus = "loading" | "signed-in" | "signed-out";

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

function mobileSectionLabelClass() {
  return "text-[0.68rem] font-extrabold uppercase tracking-[.22em] text-ink/42";
}

function mobileActionClass(active: boolean, emphasis: "normal" | "primary" | "account" = "normal") {
  if (emphasis === "primary") {
    return `flex min-h-[4.75rem] w-full items-center gap-3 rounded-[1.35rem] px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
      active
        ? "bg-ink text-white"
        : "bg-tomato text-white shadow-sm shadow-tomato/15 hover:bg-forest"
    }`;
  }

  if (emphasis === "account") {
    return `flex min-h-[4.25rem] w-full items-center gap-3 rounded-[1.25rem] px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
      active
        ? "bg-ink text-white"
        : "border border-leaf/20 bg-leaf/[.08] text-ink hover:border-leaf/35"
    }`;
  }

  return `flex min-h-[4rem] w-full items-center gap-3 rounded-[1.15rem] border border-ink/10 bg-white px-4 py-3 text-left text-ink transition hover:border-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
    active ? "ring-1 ring-tomato/25" : ""
  }`;
}

function mobileStepDescription(step: PizzaSession["currentStep"] | undefined) {
  if (step === "recipe") return "Continue from Dough Plan";
  if (step === "shopping") return "Continue from Shopping";
  if (step === "timeline") return "Continue from Timeline";
  if (step === "prep" || step === "bake") return "Continue from Kitchen";
  if (step === "review") return "Continue from Review";
  return copy.mobilePizzaFallback;
}

export default function GlobalToolNavigation() {
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authPulse, setAuthPulse] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenNavigationMenu>(null);
  const [mobileLearnOpen, setMobileLearnOpen] = useState(false);
  const [sessionDecision, setSessionDecision] = useState<CanonicalActivePizzaSessionResolution>(emptyDecision);
  const [sessionChecking, setSessionChecking] = useState(true);
  const learningMenuOpen = openMenu === "learning";
  const mobileMenuOpen = openMenu === "mobile";
  const navigationRootRef = useRef<HTMLDivElement>(null);
  const learningButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const learningMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const startActive = pathname === "/session/start";
  const accountActive = pathname === "/account";
  const doughGuideActive = pathname === "/guides/dough";
  const learningCenterActive = pathname === "/guide";
  const sauceGuideActive = pathname === "/sauce";
  const toppingsGuideActive = pathname === "/toppings";
  const pizzaStylesActive = pathname === "/styles";
  const ovensActive = pathname === "/ovens";
  const practicalTipsActive = pathname === "/guide/practical-pizza-tips";
  const troubleshootingActive = pathname === "/guide/pizza-troubleshooting";
  const quickCalculatorActive = pathname === "/calculator/quick";
  const aboutActive = pathname === "/about";

  useEffect(() => {
    document.documentElement.lang = "en";
    setOpenMenu(null);
    setMobileLearnOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) setMobileLearnOpen(false);
  }, [mobileMenuOpen]);

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
        setMobileLearnOpen(false);
        trigger?.focus();
      }
    };

    const trapMobileFocus = (event: globalThis.KeyboardEvent) => {
      if (!mobileMenuOpen || event.key !== "Tab") return;
      const focusable = mobileMenuRef.current
        ? Array.from(mobileMenuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter((item) => !item.hasAttribute("disabled") && item.getClientRects().length > 0)
        : [];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("keydown", trapMobileFocus);

    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("keydown", trapMobileFocus);
    };
  }, [learningMenuOpen, mobileMenuOpen, openMenu]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const scrollY = window.scrollY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";
    window.requestAnimationFrame(() => mobileCloseButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [mobileMenuOpen]);

  const openMenuFromKeyboard = (menu: Exclude<OpenNavigationMenu, null>) => (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpenMenu(menu);
      window.requestAnimationFrame(() => {
        const menuElement = menu === "learning" ? learningMenuRef.current : mobileMenuRef.current;
        const firstMenuItem = menuElement?.querySelector<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        firstMenuItem?.focus();
      });
    }
  };

  useEffect(() => {
    let pulseTimer: number | undefined;
    try {
      const supabase = getSupabaseBrowserClient();
      supabase.auth.getSession().then(({ data }) => setAuthStatus(data.session?.user ? "signed-in" : "signed-out"));
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        setAuthStatus(session?.user ? "signed-in" : "signed-out");
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
      setAuthStatus("signed-out");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setSessionChecking(true);

    async function resolveMobilePizzaAction() {
      const decision = await resolveCanonicalActivePizzaSession();
      if (!mounted) return;
      setSessionDecision(decision);
      setAuthStatus(decision.signedIn ? "signed-in" : "signed-out");
      setSessionChecking(false);
    }

    resolveMobilePizzaAction();
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const learningActiveByHref = (href: string) => {
    if (href === "/guide") return learningCenterActive;
    if (href === "/guides/dough") return doughGuideActive;
    if (href === "/sauce") return sauceGuideActive;
    if (href === "/toppings") return toppingsGuideActive;
    if (href === "/ovens") return ovensActive;
    if (href === "/styles") return pizzaStylesActive;
    if (href === "/guide/practical-pizza-tips") return practicalTipsActive;
    if (href === "/guide/pizza-troubleshooting") return troubleshootingActive;
    return false;
  };

  const signedIn = authStatus === "signed-in";
  const accountLoading = authStatus === "loading";
  const mobilePizzaActionDescription = sessionDecision.state === "active"
    ? mobileStepDescription(sessionDecision.session.currentStep)
    : sessionDecision.state === "error"
      ? "We could not check your account pizza yet."
      : copy.mobileStartPizzaDescription;

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

  const mobileAccountAction = accountLoading ? (
    <div className={`${mobileActionClass(false, "account")} min-h-[4.25rem] opacity-85`} aria-busy="true" data-mobile-account-state="loading">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-ink/50" aria-hidden="true">
        <DoughToolsIcon name="account" size={20} strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{copy.checkingAccount}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-ink/55">Checking sign-in status.</span>
      </span>
    </div>
  ) : (
    <Link
      href="/account"
      aria-label={signedIn ? copy.myAccount : copy.signIn}
      aria-current={accountActive ? "page" : undefined}
      onClick={() => setOpenMenu(null)}
      className={mobileActionClass(accountActive, "account")}
      data-mobile-account-state={signedIn ? "signed-in" : "signed-out"}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${accountActive ? "bg-white/14 text-white" : "bg-white text-leaf"}`} aria-hidden="true">
        <DoughToolsIcon name="account" size={20} strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{signedIn ? copy.myAccount : copy.signIn}</span>
        <span className={`mt-1 block text-xs font-bold leading-5 ${accountActive ? "text-white/72" : "text-ink/58"}`}>
          {signedIn ? copy.myAccountDescription : copy.signInDescription}
        </span>
      </span>
    </Link>
  );

  const mobilePizzaAction = sessionChecking ? (
    <div className={`${mobileActionClass(false, "primary")} min-h-[4.75rem] opacity-90`} aria-busy="true" data-mobile-pizza-action="checking">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/16 text-white" aria-hidden="true">
        <DoughToolsIcon name="pizza" size={24} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{copy.mobileCheckingPizza}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-white/72">Finding the safest place to continue.</span>
      </span>
    </div>
  ) : sessionDecision.state === "active" ? (
    <Link
      href={sessionDecision.href}
      aria-current={pathname === sessionDecision.href ? "page" : undefined}
      onClick={() => setOpenMenu(null)}
      className={mobileActionClass(pathname === sessionDecision.href, "primary")}
      data-mobile-pizza-action="continue"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/16 text-white" aria-hidden="true">
        <DoughToolsIcon name="pizza" size={24} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{copy.mobileContinuePizza}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-white/72">{mobilePizzaActionDescription}</span>
      </span>
    </Link>
  ) : sessionDecision.state === "error" ? (
    <Link
      href={sessionDecision.href}
      onClick={() => setOpenMenu(null)}
      className={mobileActionClass(false, "primary")}
      data-mobile-pizza-action="error-fallback"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/16 text-white" aria-hidden="true">
        <DoughToolsIcon name="warning" size={24} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{copy.mobileContinuePizza}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-white/72">{mobilePizzaActionDescription}</span>
      </span>
    </Link>
  ) : (
    <Link
      href="/session/start"
      aria-current={startActive ? "page" : undefined}
      onClick={() => setOpenMenu(null)}
      className={mobileActionClass(startActive, "primary")}
      data-mobile-pizza-action="start"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/16 text-white" aria-hidden="true">
        <DoughToolsIcon name="pizza" size={24} strokeWidth={2} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{copy.mobileStartPizza}</span>
        <span className="mt-1 block text-xs font-bold leading-5 text-white/72">{mobilePizzaActionDescription}</span>
      </span>
    </Link>
  );
  const closeMobileMenu = () => {
    setOpenMenu(null);
    setMobileLearnOpen(false);
    window.requestAnimationFrame(() => mobileButtonRef.current?.focus());
  };

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
                <div id="global-learning-menu" className="absolute right-0 top-12 z-[70] w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border border-ink/10 bg-white/95 p-2 text-ink shadow-card backdrop-blur" role="menu" aria-label="Pizza guides menu">
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

          <div className="relative lg:hidden">
            <button
              ref={mobileButtonRef}
              type="button"
              aria-haspopup="dialog"
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
              <div
                id="global-mobile-menu"
                ref={mobileMenuRef}
                className="fixed inset-0 z-[100] h-[100dvh] overflow-hidden bg-cream text-ink"
                role="dialog"
                aria-modal="true"
                aria-labelledby="global-mobile-menu-title"
                aria-label="Mobile navigation menu"
                data-mobile-menu-overlay
              >
                <div className="flex h-full min-h-0 flex-col pt-[calc(env(safe-area-inset-top)+1rem)]">
                  <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ink/10 px-4 pb-4">
                    <h2 id="global-mobile-menu-title" className="text-base font-extrabold text-ink">
                      Menu
                    </h2>
                    <button
                      ref={mobileCloseButtonRef}
                      type="button"
                      onClick={closeMobileMenu}
                      aria-label="Close menu"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/10 bg-white text-ink transition hover:border-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                    >
                      <DoughToolsIcon name="close" size={20} aria-hidden="true" />
                    </button>
                  </div>

                  <nav
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4"
                    aria-label="Mobile navigation"
                    data-mobile-menu-scroll
                  >
                    <div className="grid gap-4">
                      <section aria-labelledby="mobile-menu-account-heading" data-mobile-menu-section="account">
                        <p id="mobile-menu-account-heading" className={mobileSectionLabelClass()}>Account</p>
                        <div className="mt-2">{mobileAccountAction}</div>
                      </section>

                      <section aria-labelledby="mobile-menu-pizza-heading" data-mobile-menu-section="pizza">
                        <p id="mobile-menu-pizza-heading" className={mobileSectionLabelClass()}>Your pizza</p>
                        <div className="mt-2">{mobilePizzaAction}</div>
                      </section>

                      <section aria-labelledby="mobile-menu-tools-heading" data-mobile-menu-section="tools" data-mobile-tools-extension-point="before-quick-dough-calculator">
                        <p id="mobile-menu-tools-heading" className={mobileSectionLabelClass()}>Tools</p>
                        <div className="mt-2 grid gap-2">
                          {mobileToolItems.map((item) => {
                            const active = item.href === "/calculator/quick" ? quickCalculatorActive : pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                onClick={() => setOpenMenu(null)}
                                className={mobileActionClass(active)}
                                data-mobile-tool-item={item.href}
                              >
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-tomato" aria-hidden="true">
                                  <DoughToolsIcon name={item.icon} size={20} strokeWidth={2} />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-extrabold">{item.label}</span>
                                  <span className="mt-1 block text-xs font-bold leading-5 text-ink/55">{item.description}</span>
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </section>

                      <section aria-labelledby="mobile-menu-learn-heading" data-mobile-menu-section="learn">
                        <p id="mobile-menu-learn-heading" className={mobileSectionLabelClass()}>Learn</p>
                        <div className="mt-2 rounded-[1.25rem] border border-ink/10 bg-white">
                          <button
                            type="button"
                            aria-expanded={mobileLearnOpen}
                            aria-controls="mobile-menu-learn-panel"
                            onClick={() => setMobileLearnOpen((open) => !open)}
                            className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-leaf" aria-hidden="true">
                                <DoughToolsIcon name="information" size={20} strokeWidth={2} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-extrabold">{copy.mobileLearn}</span>
                                <span className="mt-1 block text-xs font-bold leading-5 text-ink/55">{copy.mobileLearnDescription}</span>
                              </span>
                            </span>
                            <DoughToolsIcon name={mobileLearnOpen ? "chevron-up" : "chevron-down"} size={20} className="shrink-0 text-ink/45" aria-hidden="true" />
                          </button>

                          {mobileLearnOpen && (
                            <div id="mobile-menu-learn-panel" className="border-t border-ink/10 p-2">
                              {mobileLearningItems.map((item) => {
                                const active = learningActiveByHref(item.href);
                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => setOpenMenu(null)}
                                    className={`block rounded-xl px-3 py-3 text-sm font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                                      active
                                        ? "bg-cream text-ink ring-1 ring-tomato/20"
                                        : "secondary" in item && item.secondary
                                          ? "text-ink/55 hover:bg-cream"
                                          : "text-ink hover:bg-cream"
                                    }`}
                                  >
                                    {item.label}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </section>

                      <section aria-labelledby="mobile-menu-about-heading" data-mobile-menu-section="about">
                        <p id="mobile-menu-about-heading" className={mobileSectionLabelClass()}>About</p>
                        <div className="mt-2">
                          <Link
                            href="/about"
                            aria-current={aboutActive ? "page" : undefined}
                            onClick={() => setOpenMenu(null)}
                            className={mobileActionClass(aboutActive)}
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-ink/65" aria-hidden="true">
                              <DoughToolsIcon name="information" size={20} strokeWidth={2} />
                            </span>
                            <span className="block text-sm font-extrabold">{copy.aboutDoughTools}</span>
                          </Link>
                        </div>
                      </section>
                    </div>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
