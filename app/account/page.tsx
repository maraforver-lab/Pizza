"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import SiteFooter from "@/components/SiteFooter";
import { AccountAdminEntryCard } from "@/components/account/AccountAdminEntryCard";
import { AccountActivePizzaSessionCard } from "@/components/account/AccountActivePizzaSessionCard";
import { AccountPizzaSessionHistory } from "@/components/account/AccountPizzaSessionHistory";
import { PartyOrdersAccountEntryCard } from "@/components/account/PartyOrdersAccountEntryCard";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

const copy = {
  en: {
    eyebrow: "Account", title: "Your place for pizza plans.", intro: "Create an account, sign in and sign out. Active pizza plans can be saved to your account while saved recipes and bake notes remain browser-local for now.", login: "Sign in", signup: "Create account", email: "Email", password: "Password", passwordHint: "At least 8 characters", working: "One moment…", confirm: "Check your email and confirm the account using the link in the message.", confirmed: "Email confirmed. You are now signed in.", back: "Back to homepage", retry: "The confirmation link could not be processed. Try signing in.", error: "Authentication failed. Check your details and try again." },
} as const;

export default function AccountPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const t = copy.en;

  useEffect(() => {
    document.documentElement.lang = "en";
    const params = new URLSearchParams(location.search);
    if (params.get("confirmed") === "1") setMessage(copy.en.confirmed);
    if (params.get("authError")) { setMessage(copy.en.retry); setIsError(true); }

    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true); setMessage(""); setIsError(false);
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${location.origin}/auth/callback?next=/account` } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (result.error) { setMessage(result.error.message || t.error); setIsError(true); return; }
    if (mode === "signup" && !result.data.session) { setMessage(t.confirm); setPassword(""); return; }
    setUser(result.data.user); setPassword("");
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-7 pb-24 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {user ? (
          <div className="space-y-6 sm:space-y-8">
            <section className="max-w-4xl" aria-labelledby="account-workspace-heading">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{t.eyebrow}</p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h1 id="account-workspace-heading" className="max-w-3xl break-words font-display text-4xl font-semibold leading-[.98] sm:text-5xl lg:text-6xl">
                    Your DoughTools workspace
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base sm:leading-7">
                    Continue your active pizza plan, review the latest finished bake, and manage party orders from one clear workspace.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex min-h-11 w-fit max-w-full shrink-0 items-center rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                >
                  ← {t.back}
                </Link>
              </div>
            </section>

            <div
              className="account-workspace-shell grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2.35fr)_minmax(16rem,20rem)] lg:items-start"
              data-account-workspace-layout="two-column"
            >
              <div className="account-workspace-main min-w-0 space-y-5 sm:space-y-6" data-account-workspace-main>
                <AccountActivePizzaSessionCard enabled className="mt-0" />
                <AccountPizzaSessionHistory enabled latestOnly className="mt-0" />
                <PartyOrdersAccountEntryCard enabled className="mt-0" />
              </div>
              <aside
                className="account-workspace-secondary min-w-0 space-y-3 lg:sticky lg:top-24"
                aria-label="Account support tools"
                data-account-workspace-secondary
              >
                <section className="rounded-[1.25rem] border border-ink/10 bg-white/85 p-4 shadow-sm" aria-labelledby="account-settings-heading">
                  <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">Account</p>
                  <h2 id="account-settings-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
                    Settings
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink/60">
                    Preferences, privacy, security and app options live here.
                  </p>
                  <Link
                    href="/account/settings"
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                  >
                    Open settings
                  </Link>
                </section>
                <AccountAdminEntryCard title="Admin tools" compact />
              </aside>
            </div>
          </div>
        ) : (
          <section className="grid min-w-0 gap-5 rounded-[2rem] border border-ink/10 bg-white/75 p-5 shadow-card backdrop-blur sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{t.eyebrow}</p>
              <h1 className="mt-3 max-w-3xl break-words font-display text-4xl font-semibold leading-[.98] sm:text-5xl lg:text-6xl">
                {t.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base sm:leading-7">
                {t.intro}
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex min-h-11 items-center rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
              >
                ← {t.back}
              </Link>
            </div>

            <section className="min-w-0 rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="account-access-heading">
              {loading ? (
                <div className="min-h-48 space-y-4" aria-busy="true">
                  <h2 id="account-access-heading" className="font-display text-2xl font-semibold">
                    Loading your DoughTools workspace…
                  </h2>
                  <div className="space-y-3" aria-hidden="true">
                    <div className="h-4 w-3/4 rounded-full bg-ink/10" />
                    <div className="h-4 w-1/2 rounded-full bg-ink/10" />
                    <div className="h-12 rounded-2xl bg-ink/10" />
                  </div>
                </div>
              ) : (
                <>
                  <h2 id="account-access-heading" className="sr-only">
                    Account access
                  </h2>
                  <div className="grid grid-cols-2 rounded-xl bg-ink/[.05] p-1">
                    {(["login", "signup"] as Mode[]).map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => { setMode(item); setMessage(""); setIsError(false); }}
                        className={`min-h-11 rounded-lg px-3 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${mode === item ? "bg-white text-ink shadow-sm" : "text-ink/45"}`}
                      >
                        {item === "login" ? t.login : t.signup}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={submit} className="mt-5 space-y-4">
                    <label className="block text-xs font-bold text-ink/55">
                      {t.email}
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        className="mt-2 h-12 w-full rounded-xl border border-ink/10 bg-cream/40 px-4 text-base text-ink outline-none focus:border-tomato"
                      />
                    </label>
                    <label className="block text-xs font-bold text-ink/55">
                      {t.password}
                      <input
                        type="password"
                        required
                        minLength={8}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        className="mt-2 h-12 w-full rounded-xl border border-ink/10 bg-cream/40 px-4 text-base text-ink outline-none focus:border-tomato"
                      />
                      <span className="mt-1 block text-[10px] font-normal text-ink/35">{t.passwordHint}</span>
                    </label>
                    <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-tomato px-5 text-sm font-extrabold text-white shadow-lg disabled:opacity-50">
                      {loading ? t.working : mode === "login" ? t.login : t.signup}
                    </button>
                  </form>
                </>
              )}
              {message && <p role="status" className={`mt-4 rounded-xl p-3 text-xs leading-5 ${isError ? "bg-tomato/10 text-tomato" : "bg-leaf/10 text-leaf"}`}>{message}</p>}
            </section>
          </section>
        )}
        <SiteFooter />
      </div>
    </main>
  );
}
