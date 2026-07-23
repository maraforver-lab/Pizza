"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import SiteFooter from "@/components/SiteFooter";
import { AccountDataExportCard } from "@/components/account/AccountDataExportCard";
import { AccountDeleteAccountCard } from "@/components/account/AccountDeleteAccountCard";
import { AccountBakeTimerSoundPreference } from "@/components/account/AccountBakeTimerSoundPreference";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AccountSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    document.documentElement.lang = "en";
    setAccountDeleted(new URLSearchParams(window.location.search).get("accountDeleted") === "1");
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-cream px-4 py-7 pb-24 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border border-ink/10 bg-white/75 p-5 shadow-card backdrop-blur sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">Account</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Settings
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base sm:leading-7">
            Manage account preferences that apply to new DoughTools tools and pizza plans.
          </p>
          <Link
            href="/account"
            className="mt-6 inline-flex min-h-11 items-center rounded-full border border-ink/10 bg-white px-5 text-sm font-extrabold transition hover:border-tomato/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            ← Back to account
          </Link>
        </section>

        <div className="mt-6">
          {accountDeleted ? (
            <section className="rounded-[1.75rem] border border-leaf/15 bg-white/80 p-4 shadow-sm sm:p-5" role="status">
              <h2 className="font-display text-2xl font-semibold text-ink">Your account has been deleted</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Your DoughTools account deletion is complete. This browser has also cleared DoughTools-owned local app data.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
              >
                Go to Homepage
              </Link>
            </section>
          ) : loading ? (
            <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5" aria-busy="true">
              <h2 className="font-display text-2xl font-semibold text-ink">Loading settings…</h2>
              <div className="mt-4 space-y-3" aria-hidden="true">
                <div className="h-4 w-3/4 rounded-full bg-ink/10" />
                <div className="h-4 w-1/2 rounded-full bg-ink/10" />
                <div className="h-12 rounded-2xl bg-ink/10" />
              </div>
            </section>
          ) : user ? (
            <div className="space-y-4">
              <AccountDataExportCard />
              <AccountDeleteAccountCard />
              <AccountBakeTimerSoundPreference />
            </div>
          ) : (
            <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-sm sm:p-5">
              <h2 className="font-display text-2xl font-semibold text-ink">Sign in to manage settings</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                Account settings are available after you sign in.
              </p>
              <Link
                href="/account"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-tomato px-5 text-sm font-extrabold text-white transition hover:bg-forest focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
              >
                Sign in
              </Link>
            </section>
          )}
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
