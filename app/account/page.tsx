"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import SiteFooter from "@/components/SiteFooter";
import { AccountActivePizzaSessionCard } from "@/components/account/AccountActivePizzaSessionCard";
import { AccountGuidancePreference } from "@/components/account/AccountGuidancePreference";
import { AccountPizzaSessionHistory } from "@/components/account/AccountPizzaSessionHistory";
import { PartyOrdersAccountEntryCard } from "@/components/account/PartyOrdersAccountEntryCard";
import InstallAppPrompt from "@/components/InstallAppPrompt";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

const copy = {
  fi: {
    eyebrow: "Käyttäjätili", title: "Oma paikka pizzaresepteillesi.", intro: "Ensimmäisessä versiossa voit luoda tilin, kirjautua sisään ja ulos. Reseptejä ei vielä siirretä tilille.", login: "Kirjaudu sisään", signup: "Luo käyttäjätili", email: "Sähköposti", password: "Salasana", passwordHint: "Vähintään 8 merkkiä", working: "Hetkinen…", confirm: "Tarkista sähköpostisi ja vahvista käyttäjätili viestissä olevasta linkistä.", confirmed: "Sähköposti vahvistettu. Olet nyt kirjautunut sisään.", signedIn: "Olet kirjautunut sisään", signOut: "Kirjaudu ulos", signedOut: "Olet kirjautunut ulos.", back: "Back to homepage", retry: "Vahvistuslinkkiä ei voitu käsitellä. Yritä kirjautua sisään.", error: "Kirjautuminen ei onnistunut. Tarkista tiedot ja yritä uudelleen." },
  sv: {
    eyebrow: "Användarkonto", title: "Din plats för pizzarecept.", intro: "I den första versionen kan du skapa ett konto samt logga in och ut. Recept flyttas ännu inte till kontot.", login: "Logga in", signup: "Skapa konto", email: "E-post", password: "Lösenord", passwordHint: "Minst 8 tecken", working: "Ett ögonblick…", confirm: "Kontrollera din e-post och bekräfta kontot via länken i meddelandet.", confirmed: "E-postadressen är bekräftad. Du är nu inloggad.", signedIn: "Du är inloggad", signOut: "Logga ut", signedOut: "Du är utloggad.", back: "Back to homepage", retry: "Bekräftelselänken kunde inte behandlas. Försök logga in.", error: "Inloggningen misslyckades. Kontrollera uppgifterna och försök igen." },
  en: {
    eyebrow: "User account", title: "Your place for pizza recipes.", intro: "You can create an account, sign in and sign out. Active Pizza Sessions can now be saved to your account while saved recipes and bake notes remain browser-local for now.", login: "Sign in", signup: "Create account", email: "Email", password: "Password", passwordHint: "At least 8 characters", working: "One moment…", confirm: "Check your email and confirm the account using the link in the message.", confirmed: "Email confirmed. You are now signed in.", signedIn: "You are signed in", signOut: "Sign out", signedOut: "You are signed out.", back: "Back to homepage", retry: "The confirmation link could not be processed. Try signing in.", error: "Authentication failed. Check your details and try again." },
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

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false); setUser(null); setMessage(error ? error.message : t.signedOut); setIsError(Boolean(error));
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-7 pb-24 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="grid min-w-0 gap-5 rounded-[2rem] border border-ink/10 bg-white/75 p-5 shadow-card backdrop-blur sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{t.eyebrow}</p>
            <h1 className="mt-3 max-w-3xl break-words font-display text-4xl font-semibold leading-[.98] sm:text-5xl lg:text-6xl">
              {user ? "Your DoughTools workspace." : t.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base sm:leading-7">
              {user
                ? "Continue your active pizza plan, review recent bakes, manage party orders and keep your guidance preferences in one calm place."
                : t.intro}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-11 items-center rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              ← {t.back}
            </Link>
          </div>

          <section className="min-w-0 rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="account-access-heading">
            {loading && !user ? (
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
            ) : user ? (
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-leaf text-base font-extrabold text-white">✓</span>
                <h2 id="account-access-heading" className="mt-3 font-display text-2xl font-semibold">
                  {t.signedIn}
                </h2>
                <p className="mt-1 break-all text-sm text-ink/55">{user.email}</p>
                <p className="mt-4 rounded-2xl bg-leaf/[.08] p-3 text-xs font-bold leading-5 text-ink/55">
                  Cloud-backed Pizza Sessions appear here when they are active or completed.
                </p>
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

        {user ? (
          <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)] lg:items-start">
            <div className="min-w-0 space-y-6">
              <AccountActivePizzaSessionCard enabled className="mt-0" />
              <AccountPizzaSessionHistory enabled className="mt-0" />
            </div>
            <aside className="min-w-0 space-y-6 lg:sticky lg:top-24" aria-label="Account support tools">
              <PartyOrdersAccountEntryCard enabled className="mt-0" />
              <InstallAppPrompt compact collapsible className="mt-0" />
              <AccountGuidancePreference />
              <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-labelledby="account-security-heading">
                <p className="text-xs font-extrabold uppercase tracking-[.2em] text-ink/45">Account</p>
                <h2 id="account-security-heading" className="mt-2 font-display text-2xl font-semibold text-ink">
                  Account and security
                </h2>
                <p className="mt-2 break-all text-sm leading-6 text-ink/60">{user.email}</p>
                <button
                  type="button"
                  onClick={signOut}
                  disabled={loading}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-ink/10 bg-cream/65 px-5 text-sm font-extrabold text-ink/75 transition hover:border-tomato/25 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50"
                >
                  {loading ? t.working : t.signOut}
                </button>
              </section>
            </aside>
          </div>
        ) : null}
        <SiteFooter />
      </div>
    </main>
  );
}
