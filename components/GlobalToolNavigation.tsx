"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isNavigationGroupActive,
  isNavigationItemActive,
  navigationGroups,
  navigationItemById,
  primaryNavigationItemId,
  type NavigationGroup,
  type NavigationGroupId,
  type NavigationItem,
} from "@/lib/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const panelId = "doughtools-navigation-panel";

const copy = {
  all: "DoughTools navigation",
  menu: "Menu",
  close: "Close menu",
  account: "Sign in",
  accountActive: "Your account",
  current: "Current page",
} as const;

function itemPath(item: NavigationItem, query: string) {
  const [pathWithSearch, hash] = item.href.split("#");
  const hasOwnSearch = pathWithSearch.includes("?");
  const shouldKeepQuery = item.preserveQuery !== false && query && !hasOwnSearch;
  return `${pathWithSearch}${shouldKeepQuery ? query : ""}${hash ? `#${hash}` : ""}`;
}

function ItemLink({
  item,
  pathname,
  hash,
  query,
  onNavigate,
}: {
  item: NavigationItem;
  pathname: string;
  hash: string;
  query: string;
  onNavigate?: () => void;
}) {
  const active = isNavigationItemActive(item, pathname, hash);

  return (
    <Link
      href={itemPath(item, query)}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-14 items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
        active ? "bg-ink text-white" : "bg-white/75 text-ink hover:bg-white"
      }`}
    >
      <span>
        <span className="block text-sm font-extrabold">{item.label}</span>
        <span className={`mt-0.5 block text-xs leading-snug ${active ? "text-white/70" : "text-ink/55"}`}>{item.description}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold ${active ? "bg-white/15" : "bg-ink/[.06] text-ink/45"}`} aria-hidden="true">
        {active ? "●" : "→"}
      </span>
      {active && <span className="sr-only">{copy.current}</span>}
    </Link>
  );
}

function GroupPanel({
  groups,
  pathname,
  hash,
  query,
  onNavigate,
}: {
  groups: readonly NavigationGroup[];
  pathname: string;
  hash: string;
  query: string;
  onNavigate: () => void;
}) {
  return (
    <div className={`mt-5 grid gap-5 ${groups.length > 1 ? "md:grid-cols-2" : ""}`}>
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`nav-group-${group.id}`}>
          <div className="mb-3">
            <h2 id={`nav-group-${group.id}`} className="text-[11px] font-extrabold uppercase tracking-[.16em] text-tomato">
              {group.label}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">{group.description}</p>
          </div>
          <div className="grid gap-2">
            {group.items.map((item) => (
              <ItemLink key={item.id} item={item} pathname={pathname} hash={hash} query={query} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function GlobalToolNavigation() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [hash, setHash] = useState("");
  const [open, setOpen] = useState<NavigationGroupId | "all" | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authPulse, setAuthPulse] = useState(false);
  const triggerRefs = useRef<Partial<Record<NavigationGroupId | "all", HTMLButtonElement | null>>>({});

  useEffect(() => {
    const updateUrlState = () => {
      setQuery(window.location.search);
      setHash(window.location.hash.replace(/^#/, ""));
    };
    document.documentElement.lang = "en";
    updateUrlState();
    setOpen(null);
    window.addEventListener("popstate", updateUrlState);
    window.addEventListener("hashchange", updateUrlState);
    window.addEventListener("doughtools:urlchange", updateUrlState);
    return () => {
      window.removeEventListener("popstate", updateUrlState);
      window.removeEventListener("hashchange", updateUrlState);
      window.removeEventListener("doughtools:urlchange", updateUrlState);
    };
  }, [pathname]);

  const closeMenu = useCallback((restoreFocus = false) => {
    const closing = open;
    setOpen(null);
    if (restoreFocus && closing) window.requestAnimationFrame(() => triggerRefs.current[closing]?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, closeMenu]);

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

  const primaryItem = navigationItemById(primaryNavigationItemId)!;
  const accountItem = navigationItemById("account")!;
  const visibleGroups = open === "all" ? navigationGroups : open ? navigationGroups.filter((group) => group.id === open) : [];
  const setTriggerRef = (id: NavigationGroupId | "all") => (element: HTMLButtonElement | null) => {
    triggerRefs.current[id] = element;
  };
  const toggle = (menu: NavigationGroupId | "all") => setOpen((current) => (current === menu ? null : menu));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream/95 px-3 py-2.5 text-ink shadow-sm backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link href={itemPath(primaryItem, query)} className="flex shrink-0 items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream" aria-label="DoughTools home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-tomato text-lg text-white shadow-lg shadow-tomato/15" aria-hidden="true">◉</span>
            <strong className="hidden text-lg tracking-tight sm:block">Dough<span className="text-tomato">Tools</span></strong>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={copy.all}>
            <Link
              href={itemPath(primaryItem, query)}
              aria-current={isNavigationItemActive(primaryItem, pathname, hash) ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                isNavigationItemActive(primaryItem, pathname, hash) ? "bg-ink text-white" : "bg-white text-ink hover:bg-white/80"
              }`}
            >
              {primaryItem.label}
            </Link>
            {navigationGroups.map((group) => {
              const active = isNavigationGroupActive(group, pathname, hash);
              const expanded = open === group.id;
              return (
                <button
                  key={group.id}
                  ref={setTriggerRef(group.id)}
                  type="button"
                  onClick={() => toggle(group.id)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
                    active || expanded ? "bg-ink text-white" : "text-ink/60 hover:bg-white"
                  }`}
                >
                  {group.label} <span aria-hidden="true">⌄</span>
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={itemPath(accountItem, query)}
              aria-label={signedIn ? copy.accountActive : copy.account}
              aria-current={isNavigationItemActive(accountItem, pathname, hash) ? "page" : undefined}
              className={`group relative flex h-10 items-center gap-2 rounded-full border px-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:px-3 ${
                isNavigationItemActive(accountItem, pathname, hash)
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
              <span className="hidden text-[11px] font-extrabold xl:block">{signedIn ? copy.accountActive : copy.account}</span>
              {signedIn && (
                <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-cream bg-leaf" aria-hidden="true">
                  <span className={`absolute h-full w-full rounded-full bg-leaf ${authPulse ? "animate-ping" : ""}`} />
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {open && (
        <>
          <button type="button" aria-label={copy.close} onClick={() => closeMenu(true)} className="fixed inset-0 z-40 cursor-default bg-ink/25 backdrop-blur-[2px]" />
          <div id={panelId} className="fixed inset-x-3 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.7rem)] z-50 mx-auto max-h-[70vh] max-w-4xl overflow-y-auto rounded-3xl border border-white/70 bg-cream p-5 text-ink shadow-2xl md:bottom-auto md:top-[4.5rem]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <strong className="font-display text-2xl">Dough<span className="text-tomato">Tools</span></strong>
                <p className="mt-1 text-xs text-ink/55">Start with dough, make the pizza, then learn from the bake.</p>
              </div>
              <button type="button" onClick={() => closeMenu(true)} aria-label={copy.close} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/5 text-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream">
                ×
              </button>
            </div>
            <GroupPanel groups={visibleGroups} pathname={pathname} hash={hash} query={query} onNavigate={() => closeMenu(false)} />
          </div>
        </>
      )}

      <nav className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 grid grid-cols-4 gap-1 rounded-2xl border border-white/70 bg-cream/95 p-1.5 text-ink shadow-2xl backdrop-blur-xl lg:hidden" aria-label={copy.all}>
        <Link
          href={itemPath(primaryItem, query)}
          aria-current={isNavigationItemActive(primaryItem, pathname, hash) ? "page" : undefined}
          className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
            isNavigationItemActive(primaryItem, pathname, hash) ? "bg-ink text-white" : "text-ink/55"
          }`}
        >
          <span className="text-base" aria-hidden="true">⌂</span>
          Calculator
        </Link>
        {navigationGroups.slice(0, 2).map((group) => {
          const active = isNavigationGroupActive(group, pathname, hash);
          const expanded = open === group.id;
          return (
            <button
              key={group.id}
              ref={setTriggerRef(group.id)}
              type="button"
              onClick={() => toggle(group.id)}
              aria-expanded={expanded}
              aria-controls={panelId}
              className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                active || expanded ? "bg-ink text-white" : "text-ink/55"
              }`}
            >
              <span className="text-base" aria-hidden="true">{group.id === "make" ? "◷" : "?"}</span>
              {group.shortLabel}
            </button>
          );
        })}
        <button
          ref={setTriggerRef("all")}
          type="button"
          onClick={() => toggle("all")}
          aria-expanded={open === "all"}
          aria-controls={panelId}
          className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-[10px] font-extrabold focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
            open === "all" || navigationGroups.slice(2).some((group) => isNavigationGroupActive(group, pathname, hash)) ? "bg-tomato text-white" : "text-ink/55"
          }`}
        >
          <span className="text-base" aria-hidden="true">☰</span>
          {copy.menu}
        </button>
      </nav>
    </>
  );
}
