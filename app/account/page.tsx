"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AppSignature from "@/components/AppSignature";
import {
  EXPERIENCE_LEVELS,
  getExperienceLevelConfig,
  readExperienceLevelPreference,
  writeExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

const copy = {
  fi: {
    eyebrow: "Käyttäjätili", title: "Oma paikka pizzaresepteillesi.", intro: "Ensimmäisessä versiossa voit luoda tilin, kirjautua sisään ja ulos. Reseptejä ei vielä siirretä tilille.", login: "Kirjaudu sisään", signup: "Luo käyttäjätili", email: "Sähköposti", password: "Salasana", passwordHint: "Vähintään 8 merkkiä", working: "Hetkinen…", confirm: "Tarkista sähköpostisi ja vahvista käyttäjätili viestissä olevasta linkistä.", confirmed: "Sähköposti vahvistettu. Olet nyt kirjautunut sisään.", signedIn: "Olet kirjautunut sisään", signOut: "Kirjaudu ulos", signedOut: "Olet kirjautunut ulos.", back: "Takaisin laskuriin", retry: "Vahvistuslinkkiä ei voitu käsitellä. Yritä kirjautua sisään.", error: "Kirjautuminen ei onnistunut. Tarkista tiedot ja yritä uudelleen.", privacy: "Salasana käsitellään Supabasessa eikä sitä tallenneta DoughToolsin omaan koodiin." },
  sv: {
    eyebrow: "Användarkonto", title: "Din plats för pizzarecept.", intro: "I den första versionen kan du skapa ett konto samt logga in och ut. Recept flyttas ännu inte till kontot.", login: "Logga in", signup: "Skapa konto", email: "E-post", password: "Lösenord", passwordHint: "Minst 8 tecken", working: "Ett ögonblick…", confirm: "Kontrollera din e-post och bekräfta kontot via länken i meddelandet.", confirmed: "E-postadressen är bekräftad. Du är nu inloggad.", signedIn: "Du är inloggad", signOut: "Logga ut", signedOut: "Du är utloggad.", back: "Tillbaka till kalkylatorn", retry: "Bekräftelselänken kunde inte behandlas. Försök logga in.", error: "Inloggningen misslyckades. Kontrollera uppgifterna och försök igen.", privacy: "Lösenordet hanteras av Supabase och lagras inte i DoughTools egen kod." },
  en: {
    eyebrow: "User account", title: "Your place for pizza recipes.", intro: "In this first version you can create an account, sign in and sign out. Recipes are not connected to the account yet.", login: "Sign in", signup: "Create account", email: "Email", password: "Password", passwordHint: "At least 8 characters", working: "One moment…", confirm: "Check your email and confirm the account using the link in the message.", confirmed: "Email confirmed. You are now signed in.", signedIn: "You are signed in", signOut: "Sign out", signedOut: "You are signed out.", back: "Back to calculator", retry: "The confirmation link could not be processed. Try signing in.", error: "Authentication failed. Check your details and try again.", privacy: "Your password is handled by Supabase and is not stored in DoughTools code." },
} as const;

export default function AccountPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("beginner");
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const t = copy.en;
  const selectedExperience = getExperienceLevelConfig(experienceLevel);

  useEffect(() => {
    document.documentElement.lang = "en";
    setExperienceLevel(readExperienceLevelPreference());
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

  const selectExperienceLevel = (level: ExperienceLevel) => {
    setExperienceLevel(writeExperienceLevelPreference(level));
  };

  return <main className="min-h-screen bg-cream px-4 py-10 pb-28 text-ink sm:px-6"><div className="mx-auto max-w-4xl">
    <section className="grid min-w-0 items-center gap-8 py-8 lg:grid-cols-[1fr_24rem]">
      <div className="min-w-0"><p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{t.eyebrow}</p><h1 className="mt-3 max-w-2xl break-words font-display text-5xl font-semibold leading-[.95] sm:text-6xl">{t.title}</h1><p className="mt-5 max-w-xl leading-7 text-ink/55">{t.intro}</p><Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold">← {t.back}</Link></div>
      <section className="min-w-0 rounded-[2rem] bg-white p-5 shadow-card sm:p-7">
        {loading && !user ? <div className="grid min-h-72 place-items-center text-sm font-bold text-ink/45">{t.working}</div> : user ? <div className="py-5 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf text-2xl text-white">✓</span><h2 className="mt-5 font-display text-3xl font-semibold">{t.signedIn}</h2><p className="mt-2 break-all text-sm text-ink/55">{user.email}</p><button type="button" onClick={signOut} disabled={loading} className="mt-7 min-h-12 w-full rounded-xl bg-ink px-5 text-sm font-extrabold text-white disabled:opacity-50">{loading ? t.working : t.signOut}</button></div> : <>
          <div className="grid grid-cols-2 rounded-xl bg-ink/[.05] p-1">{(["login", "signup"] as Mode[]).map(item => <button key={item} type="button" onClick={() => { setMode(item); setMessage(""); setIsError(false); }} className={`min-h-11 rounded-lg px-3 text-xs font-extrabold ${mode === item ? "bg-white text-ink shadow-sm" : "text-ink/45"}`}>{item === "login" ? t.login : t.signup}</button>)}</div>
          <form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-xs font-bold text-ink/55">{t.email}<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-ink/10 bg-cream/40 px-4 text-base text-ink outline-none focus:border-tomato"/></label><label className="block text-xs font-bold text-ink/55">{t.password}<input type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-ink/10 bg-cream/40 px-4 text-base text-ink outline-none focus:border-tomato"/><span className="mt-1 block text-[10px] font-normal text-ink/35">{t.passwordHint}</span></label><button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-tomato px-5 text-sm font-extrabold text-white shadow-lg disabled:opacity-50">{loading ? t.working : mode === "login" ? t.login : t.signup}</button></form>
        </>}
        {message && <p role="status" className={`mt-4 rounded-xl p-3 text-xs leading-5 ${isError ? "bg-tomato/10 text-tomato" : "bg-leaf/10 text-leaf"}`}>{message}</p>}
        <p className="mt-5 border-t border-ink/10 pt-4 text-[10px] leading-4 text-ink/35">{t.privacy}</p>
      </section>
    </section>
    <section className={`rounded-[2rem] border p-5 shadow-card sm:p-7 ${selectedExperience.cardClassName}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">Experience level</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">Choose how much guidance you want.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
            Experience level helps DoughTools decide how much guidance and technical detail to show.
            You can change it at any time.
          </p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${selectedExperience.badgeClassName}`}>
          <span aria-hidden="true">{selectedExperience.marker}</span>
          {selectedExperience.label}
        </span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const active = level.id === experienceLevel;
          return (
            <button
              key={level.id}
              type="button"
              onClick={() => selectExperienceLevel(level.id)}
              aria-pressed={active}
              className={`min-h-36 rounded-2xl border bg-white/75 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${
                active ? `${level.cardClassName} shadow-sm` : "border-ink/10 hover:border-tomato/30"
              }`}
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm ${active ? level.badgeClassName : "bg-ink/[.06] text-ink/45"}`} aria-label={`${level.label} marker`}>
                <span aria-hidden="true">{level.marker}</span>
              </span>
              <span className="mt-4 block text-base font-extrabold text-ink">{level.label}</span>
              <span className="mt-2 block text-sm leading-5 text-ink/55">{level.description}</span>
              {active && <span className="mt-3 block text-xs font-extrabold text-leaf">Selected</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-5 rounded-2xl bg-white/65 p-4 text-xs leading-5 text-ink/50">
        This is the foundation for personalized guidance. More pages will use this preference in future updates.
        For now it is stored locally on this device and is not synced to your account.
      </p>
    </section>
    <footer className="mt-8 border-t border-ink/10 py-6"><AppSignature /></footer>
  </div></main>;
}
