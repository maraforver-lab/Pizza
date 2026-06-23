"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type MenuId = "plan" | "solve" | "learn" | "mine" | "all";

const copy = {
  calculator: "Calculator", plan: "Plan", learn: "Learn", mine: "Mine", all: "All tools", menu: "Menu", close: "Close menu", account: "Sign in", accountActive: "Your account",
  groups: [
    ["Plan", [["/styles", "Pizza styles"], ["/plan", "Instructions and schedule"], ["/timer", "Bake timer"], ["/sauce", "Sauce calculator"], ["/toppings", "Cheese and toppings"]]],
    ["Solve", [["/doctor", "Dough Doctor"], ["/coach", "AI Pizza Coach"], ["/costs", "Cost calculator"]]],
    ["Learn and equip", [["/guide", "Guide and terminology"], ["/ovens", "Oven guide"], ["/gear", "Gear guide"], ["/history", "Pizza history"], ["/updates", "Updates and story"]]],
    ["Mine and community", [["/account", "User account"], ["/#my-recipes", "Saved recipes"], ["/journal", "Pizza journal"], ["/community", "Community recipes"]]],
  ],
} as const;

const menuGroups: Record<Exclude<MenuId, "all">, number[]> = { plan: [0], solve: [1], learn: [2], mine: [3] };
const planRoutes = ["/styles", "/plan", "/timer", "/sauce", "/toppings"];
const learnRoutes = ["/guide", "/ovens", "/gear", "/history", "/updates"];
const mineRoutes = ["/account", "/journal", "/community"];

export default function GlobalToolNavigation() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<MenuId | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [authPulse, setAuthPulse] = useState(false);

  useEffect(() => {
    const updateQuery = () => setQuery(window.location.search);
    document.documentElement.lang = "en";
    updateQuery(); setOpen(null);
    window.addEventListener("popstate", updateQuery);
    window.addEventListener("doughtools:urlchange", updateQuery);
    return () => { window.removeEventListener("popstate", updateQuery); window.removeEventListener("doughtools:urlchange", updateQuery); };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

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
      return () => { window.clearTimeout(pulseTimer); data.subscription.unsubscribe(); };
    } catch {
      setSignedIn(false);
    }
  }, []);

  const t = copy;
  const href = (route: string) => { const [path, hash] = route.split("#"); return `${path}${query}${hash ? `#${hash}` : ""}`; };
  const toggle = (menu: MenuId) => setOpen(current => current === menu ? null : menu);
  const active = (routes: readonly string[]) => routes.includes(pathname);
  const visibleGroups = open === "all" ? [0, 1, 2, 3] : open ? menuGroups[open as Exclude<MenuId, "all">] : [];

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
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/account" aria-label={signedIn ? t.accountActive : t.account} aria-current={pathname === "/account" ? "page" : undefined} className={`group relative flex h-10 items-center gap-2 rounded-full border px-2.5 transition sm:px-3 ${pathname === "/account" ? "border-ink bg-ink text-white" : signedIn ? "border-leaf/20 bg-leaf/[.08] text-leaf" : "border-ink/10 bg-white text-ink/55 hover:border-tomato/30 hover:text-tomato"}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6" strokeLinecap="round"/></svg>
            <span className="hidden text-[11px] font-extrabold xl:block">{signedIn ? t.accountActive : t.account}</span>
            {signedIn && <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-cream bg-leaf"><span className={`absolute h-full w-full rounded-full bg-leaf ${authPulse ? "animate-ping" : ""}`}/></span>}
          </Link>
        </div>
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
